import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testRPCs() {
  const rpcs = ['exec_sql', 'execute_sql', 'run_sql', 'sql', 'query'];
  for (const rpc of rpcs) {
    try {
      const { data, error } = await supabase.rpc(rpc as any, { query: 'SELECT 1;' });
      console.log(`RPC ${rpc}:`, error ? error.message : 'SUCCESS', data);
    } catch (e: any) {
      console.log(`RPC ${rpc} catch:`, e.message);
    }
  }
}

testRPCs().catch(console.error);
