const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function testSmartUserPhotoSave(idOrEmail: string, photoUrl: string, profileName?: string, email?: string) {
  console.log(`\nTesting save for: ${idOrEmail} (email: ${email}, name: ${profileName})`);
  
  // 1. Check if idOrEmail is a UUID
  const isUuid = UUID_REGEX.test(idOrEmail);
  let updatedInDb = false;

  if (isUuid) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?id=eq.${idOrEmail}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ photo_url: photoUrl, avatar_url: photoUrl, updated_at: new Date().toISOString() })
    });
    const data = await res.json();
    if (res.ok && data.length > 0) {
      console.log(`  ✅ Updated user_profiles by UUID: ${data[0].name}`);
      updatedInDb = true;
    }
  }

  // 2. If not UUID or not found, try matching by email
  const userEmail = email || (idOrEmail.includes('@') ? idOrEmail : null);
  if (!updatedInDb && userEmail) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?email=eq.${encodeURIComponent(userEmail)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ photo_url: photoUrl, avatar_url: photoUrl, updated_at: new Date().toISOString() })
    });
    const data = await res.json();
    if (res.ok && data.length > 0) {
      console.log(`  ✅ Updated user_profiles by Email (${userEmail}): ${data[0].name}`);
      updatedInDb = true;
    }
  }

  // 3. If still not updated and profileName is provided, try by name
  if (!updatedInDb && profileName) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?name=eq.${encodeURIComponent(profileName)}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ photo_url: photoUrl, avatar_url: photoUrl, updated_at: new Date().toISOString() })
    });
    const data = await res.json();
    if (res.ok && data.length > 0) {
      console.log(`  ✅ Updated user_profiles by Name (${profileName}): ${data[0].id}`);
      updatedInDb = true;
    }
  }

  // 4. If user not in user_profiles, create record with a valid UUID
  if (!updatedInDb) {
    const newId = crypto.randomUUID();
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: newId,
        company_id: 'ciclodrone',
        name: profileName || idOrEmail,
        role: 'ADMIN',
        role_label: 'Usuário Master',
        email: userEmail || `${idOrEmail}@agrosys.agr.br`,
        photo_url: photoUrl,
        avatar_url: photoUrl,
        badge: 'Super Master',
        status: 'ACTIVE',
        salary_base: 9500,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
    const inserted = await insertRes.json();
    if (insertRes.ok && inserted.length > 0) {
      console.log(`  ✅ Created new user_profile record with UUID (${newId}): ${inserted[0].name}`);
      updatedInDb = true;
    } else {
      console.log(`  ❌ Insert error: ${insertRes.status}`, inserted);
    }
  }

  // 5. Store in resilient metadata fallback on master tenant description
  const key = idOrEmail.toLowerCase().replace(/[^a-z0-9_@-]/g, '_');
  const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.ciclodrone`);
  const tenantData = await tenantRes.json();
  let desc = tenantData[0]?.description || '';
  const tagRegex = new RegExp(`<!--AGRO_USER_PHOTO_${key}:[\\s\\S]*?-->`, 'g');
  desc = desc.replace(tagRegex, '').trim();
  desc = `${desc} <!--AGRO_USER_PHOTO_${key}:${JSON.stringify({ idOrEmail, photoUrl, email: userEmail, name: profileName })}-->`.trim();

  await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.ciclodrone`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ description: desc })
  });
  console.log(`  ✅ Saved backup tag in tenants description for ${key}`);
}

async function run() {
  // Test Heber Vieira
  await testSmartUserPhotoSave(
    'user-heber-vieira',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'Heber Vieira',
    'heber.vieira.hv@gmail.com'
  );

  // Test Thales Vieira
  await testSmartUserPhotoSave(
    'user-thales-vieira',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'Thales Felipe Silva Vieira',
    'thalesfelipe1@hotmail.com'
  );

  // Test existing user by email
  await testSmartUserPhotoSave(
    'admin.agro@aeroagro.com.br',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
    'Marcos Silva',
    'admin.agro@aeroagro.com.br'
  );
}

run();
