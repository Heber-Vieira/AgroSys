import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxjamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSupabase() {
  console.log("=== TESTING SUPABASE PERMISSIONS & PERSISTENCE ===");

  // Test 1: app_settings table upsert
  console.log("\n1. Testing app_settings upsert...");
  const { data: appData, error: appErr } = await supabase
    .from('app_settings')
    .upsert({ key: 'test_key_123', value: JSON.stringify({ test: 'ok', timestamp: Date.now() }) }, { onConflict: 'key' })
    .select();
  console.log("app_settings upsert result:", { appData, appErr });

  // Test 1b: app_settings select
  const { data: appSelectData, error: appSelectErr } = await supabase
    .from('app_settings')
    .select('*');
  console.log("app_settings select all count:", appSelectData?.length, "error:", appSelectErr);
  if (appSelectData) {
    console.log("app_settings keys:", appSelectData.map(d => d.key));
  }

  // Test 2: tenant_branding_configs table upsert
  console.log("\n2. Testing tenant_branding_configs upsert...");
  const { data: brandData, error: brandErr } = await supabase
    .from('tenant_branding_configs')
    .upsert({
      tenant_id: 'ciclodrone',
      company_name: 'Test Ciclodrone',
      logo_light_url: 'data:image/png;base64,test',
      logo_dark_url: 'data:image/png;base64,test_dark',
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' })
    .select();
  console.log("tenant_branding_configs upsert result:", { brandData, brandErr });

  // Test 2b: tenant_branding_configs select
  const { data: brandSelectData, error: brandSelectErr } = await supabase
    .from('tenant_branding_configs')
    .select('*');
  console.log("tenant_branding_configs select result:", { brandSelectData, brandSelectErr });

  // Test 3: tenants table
  console.log("\n3. Testing tenants table select...");
  const { data: tenantsData, error: tenantsErr } = await supabase
    .from('tenants')
    .select('*');
  console.log("tenants select result:", { tenantsData, tenantsErr });

  process.exit(0);
}

testSupabase().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
