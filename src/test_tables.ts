import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test if we can use the SQL endpoint directly (supabase-js v2 has .sql())
async function trySQL() {
  console.log("=== TESTING SQL EXECUTION METHODS ===\n");

  // Method 1: supabase.rpc with a known function
  console.log("1. Trying to list available RPC functions...");
  
  // Method 2: Direct SQL via the postgREST /rpc endpoint with custom function
  console.log("2. Trying fetch to /rest/v1/ for OpenAPI spec...");
  try {
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    const spec = await resp.json();
    
    if (spec.paths) {
      const rpcPaths = Object.keys(spec.paths).filter(p => p.includes('rpc'));
      console.log("   RPC endpoints:", rpcPaths);
      
      const tablePaths = Object.keys(spec.paths).filter(p => !p.includes('rpc') && p !== '/');
      console.log("   Table endpoints:", tablePaths);
    }
    
    if (spec.definitions) {
      console.log("   Definitions:", Object.keys(spec.definitions));
    }
  } catch (e: any) {
    console.log("   Error:", e.message);
  }

  // Method 3: Try the Supabase SQL API endpoint (v1)
  console.log("\n3. Trying Supabase SQL API /pg/ endpoint...");
  try {
    const sqlBody = `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    
    const resp = await fetch(`${SUPABASE_URL}/pg/query`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: sqlBody })
    });
    console.log(`   Status: ${resp.status} ${resp.statusText}`);
    const body = await resp.text();
    console.log(`   Body: ${body.substring(0, 500)}`);
  } catch (e: any) {
    console.log(`   Error: ${e.message}`);
  }

  // Method 4: Check if there's a service_role key in env
  console.log("\n4. Checking for SERVICE_ROLE key in .env...");
  try {
    const fs = await import('fs');
    const envPath = 'd:\\04-Heber\\01-Aplicativos_SASS\\AgroSys\\AgroSys\\.env';
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const hasServiceRole = envContent.includes('SERVICE_ROLE') || envContent.includes('service_role');
      console.log(`   .env found. Contains service_role: ${hasServiceRole}`);
      if (hasServiceRole) {
        const match = envContent.match(/SERVICE_ROLE[_KEY]*\s*=\s*['"]?([^\s'"]+)/i);
        if (match) {
          console.log(`   Service role key found (first 20 chars): ${match[1].substring(0, 20)}...`);
        }
      }
    } else {
      console.log("   .env file not found");
    }
  } catch (e: any) {
    console.log(`   Error: ${e.message}`);
  }

  process.exit(0);
}

trySQL().catch(console.error);
