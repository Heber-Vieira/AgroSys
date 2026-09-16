import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTables() {
  console.log('Testing Supabase tables...');

  // Check app_settings
  const resAppSettings = await supabase.from('app_settings').select('key').limit(2);
  console.log('app_settings status:', resAppSettings.error ? resAppSettings.error.message : `OK (${resAppSettings.data?.length} rows)`);

  // Check tenants
  const resTenants = await supabase.from('tenants').select('id, name').limit(2);
  console.log('tenants status:', resTenants.error ? resTenants.error.message : `OK (${resTenants.data?.length} rows)`);

  // Check user_profiles
  const resProfiles = await supabase.from('user_profiles').select('id, name').limit(2);
  console.log('user_profiles status:', resProfiles.error ? resProfiles.error.message : `OK (${resProfiles.data?.length} rows)`);

  // Check user_activity_logs
  const resLogs = await supabase.from('user_activity_logs').select('*').limit(2);
  console.log('user_activity_logs status:', resLogs.error ? resLogs.error.message : `OK (${resLogs.data?.length} rows)`);

  // Check if we can insert a test log into user_activity_logs
  if (!resLogs.error) {
    const insertRes = await supabase.from('user_activity_logs').insert([{
      user_id: 'user-heber-vieira',
      user_name: 'Heber Vieira',
      user_email: 'heber.vieira.hv@gmail.com',
      company_id: 'ciclodrone',
      action: 'SYSTEM_TEST',
      details: { test: true },
      ip_address: '127.0.0.1',
      response_status: 200,
      status_label: 'SUCCESS',
      user_role: 'MASTER',
      duration_ms: 45,
      created_at: new Date().toISOString()
    }]);
    console.log('user_activity_logs test insert:', insertRes.error ? insertRes.error.message : 'SUCCESS');
  }
}

checkTables().catch(console.error);
