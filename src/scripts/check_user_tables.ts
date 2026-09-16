import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testCols() {
  const testUuid = 'b0000000-0000-0000-0000-' + String(Date.now()).slice(-12);
  const { error } = await supabase.from('user_profiles').insert({
    id: testUuid,
    name: 'Test Col Check',
    email: 'test.col.' + Date.now() + '@agrosys.com',
    role: 'USER',
    company_id: 'ciclodrone'
  });
  console.log('Basic insert with UUID:', error ? error.message : 'SUCCESS');
  if (!error) {
    await supabase.from('user_profiles').delete().eq('id', testUuid);
  }
}

testCols().catch(console.error);
