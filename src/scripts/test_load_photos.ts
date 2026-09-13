const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

async function testLoadUserPhotos() {
  console.log('=== TESTING LOADING ALL USER PHOTOS FROM SUPABASE ===\n');

  const photoMap: Record<string, string> = {};

  // 1. Fetch from user_profiles table
  const res = await fetch(`${SUPABASE_URL}/rest/v1/user_profiles?select=*`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const profiles = await res.json();
  console.log(`Found ${profiles.length} user_profiles in database.`);
  profiles.forEach((p: any) => {
    const photo = p.photo_url || p.avatar_url;
    if (photo) {
      if (p.id) photoMap[p.id] = photo;
      if (p.email) photoMap[p.email] = photo;
      if (p.name) photoMap[p.name] = photo;
    }
  });

  // 2. Fetch from tenants description tags
  const tenantRes = await fetch(`${SUPABASE_URL}/rest/v1/tenants?id=eq.ciclodrone`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const tenantData = await tenantRes.json();
  const desc = tenantData[0]?.description || '';
  const photoTags = desc.match(/<!--AGRO_USER_PHOTO_[^:]+:([\s\S]*?)-->/g) || [];
  console.log(`Found ${photoTags.length} photo backup tags in tenants description.`);
  photoTags.forEach((tag: string) => {
    const match = tag.match(/<!--AGRO_USER_PHOTO_[^:]+:([\s\S]*?)-->/);
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.photoUrl) {
          if (parsed.idOrEmail) photoMap[parsed.idOrEmail] = parsed.photoUrl;
          if (parsed.email) photoMap[parsed.email] = parsed.photoUrl;
          if (parsed.name) photoMap[parsed.name] = parsed.photoUrl;
        }
      } catch (e) {}
    }
  });

  console.log('\nTotal mapped user photo keys:', Object.keys(photoMap).length);
  Object.entries(photoMap).forEach(([k, v]) => {
    console.log(`  🔑 [${k}] -> ${v.slice(0, 50)}...`);
  });
}

testLoadUserPhotos();
