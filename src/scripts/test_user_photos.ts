const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

async function testUserProfiles() {
  console.log('=== CHECKING USER_PROFILES IN SUPABASE ===');
  const res = await fetch(SUPABASE_URL + '/rest/v1/user_profiles?select=*', {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY }
  });
  const users = await res.json();
  console.log('Total users in database:', users.length);
  users.forEach((u: any) => console.log('  👤', u.name, '| ID:', u.id, '| Email:', u.email, '| Photo:', u.photo_url ? u.photo_url.slice(0, 40) + '...' : 'null'));

  // Test 1: Update existing user photo by UUID
  const firstUser = users[0];
  console.log('\n1. Testing updating user photo by ID (' + firstUser.id + ')...');
  const patchRes = await fetch(SUPABASE_URL + '/rest/v1/user_profiles?id=eq.' + firstUser.id, {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  });
  const patchData = await patchRes.json();
  console.log('Patch result status:', patchRes.status, patchData[0]?.id, patchData[0]?.photo_url);

  // Test 2: Try updating by email
  console.log('\n2. Testing updating user photo by email (' + firstUser.email + ')...');
  const emailRes = await fetch(SUPABASE_URL + '/rest/v1/user_profiles?email=eq.' + encodeURIComponent(firstUser.email), {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({ photo_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb' })
  });
  console.log('Email patch status:', emailRes.status);

  // Test 3: What if user ID from frontend is e.g. "admin-1" or "user-admin"?
  console.log('\n3. Testing updating by non-UUID ID...');
  const nonUuidPatch = await fetch(SUPABASE_URL + '/rest/v1/user_profiles?id=eq.admin-1', {
    method: 'PATCH',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ photo_url: 'https://test.com' })
  });
  console.log('Non-UUID patch status:', nonUuidPatch.status, await nonUuidPatch.json());
}

testUserProfiles().catch(console.error);
