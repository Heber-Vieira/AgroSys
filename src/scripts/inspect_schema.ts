import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function inspectSchema() {
  const tenants = await supabase.from('tenants').select('*').limit(1);
  console.log('Sample tenant:', tenants.data?.[0]);

  const users = await supabase.from('user_profiles').select('*').limit(1);
  console.log('Sample user_profile:', users.data?.[0]);

  const branding = await supabase.from('tenant_branding_configs').select('*').limit(1);
  console.log('Sample tenant_branding_configs:', branding.error ? branding.error.message : branding.data?.[0]);
}

inspectSchema().catch(console.error);
