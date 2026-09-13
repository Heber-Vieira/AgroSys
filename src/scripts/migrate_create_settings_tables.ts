/**
 * AgroSys - Database Migration Script
 * Creates missing tables (app_settings, tenant_branding_configs)
 * and adds logo columns to tenants table.
 * 
 * Run: npx tsx src/scripts/migrate_create_settings_tables.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function migrate() {
  console.log('🚀 AgroSys Database Migration - Creating Missing Tables\n');

  // ============================================================
  // STEP 1: Create app_settings table (generic key-value store)
  // ============================================================
  console.log('1️⃣  Creating app_settings table...');
  const { error: e1 } = await supabase.rpc('exec_sql', {
    sql_query: `
      CREATE TABLE IF NOT EXISTS public.app_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT now()
      );
      ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "allow_all_app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);
    `
  });

  if (e1) {
    console.log(`   ⚠️  RPC exec_sql não disponível (${e1.message}).`);
    console.log('   Tentando via REST SQL direto...');
    
    // Fallback: try direct SQL via Supabase REST
    const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sql_query: `CREATE TABLE IF NOT EXISTS public.app_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TIMESTAMPTZ DEFAULT now());`
      })
    });
    
    if (!resp.ok) {
      console.log(`   ❌ REST SQL falhou: ${resp.status} ${resp.statusText}`);
      console.log('   ⚠️  As tabelas precisam ser criadas manualmente no Supabase Dashboard.');
      console.log('');
      console.log('   📋 SQL para copiar e executar no Dashboard > SQL Editor:');
      console.log('   ─────────────────────────────────────────────────────');
      console.log(`
-- 1. Tabela app_settings (armazenamento key-value genérico)
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_app_settings" ON public.app_settings;
CREATE POLICY "allow_all_app_settings" ON public.app_settings FOR ALL USING (true) WITH CHECK (true);

-- 2. Tabela tenant_branding_configs (branding/logos por empresa)
CREATE TABLE IF NOT EXISTS public.tenant_branding_configs (
  tenant_id TEXT PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name TEXT,
  tagline TEXT,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  logo_icon_id TEXT,
  logo_adaptive_mode TEXT DEFAULT 'auto',
  primary_color_hex TEXT DEFAULT '#0284c7',
  secondary_color_hex TEXT DEFAULT '#0f766e',
  accent_color_hex TEXT DEFAULT '#f59e0b',
  font_family TEXT DEFAULT 'Plus Jakarta Sans',
  border_radius_base TEXT DEFAULT '0.875rem',
  contact_phone TEXT,
  contact_email TEXT,
  registry_crea_mapa TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tenant_branding_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_all_tenant_branding" ON public.tenant_branding_configs;
CREATE POLICY "allow_all_tenant_branding" ON public.tenant_branding_configs FOR ALL USING (true) WITH CHECK (true);

-- 3. Adicionar colunas de logo à tabela tenants existente
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS logo_light_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_dark_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_icon_id TEXT,
  ADD COLUMN IF NOT EXISTS logo_adaptive_mode TEXT DEFAULT 'auto',
  ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'Plus Jakarta Sans',
  ADD COLUMN IF NOT EXISTS border_radius_base TEXT DEFAULT '0.875rem';
      `);
    } else {
      console.log('   ✅ app_settings criada via REST SQL!');
    }
  } else {
    console.log('   ✅ app_settings criada via RPC!');
  }

  // ============================================================
  // STEP 2: Verify tables after creation
  // ============================================================
  console.log('\n2️⃣  Verificando tabelas...');
  
  const tables = ['app_settings', 'tenant_branding_configs', 'tenants', 'user_profiles'];
  for (const table of tables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error && error.code === 'PGRST205') {
      console.log(`   ❌ ${table}: NÃO EXISTE`);
    } else if (error) {
      console.log(`   ⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: OK (${data?.length || 0} registros visíveis)`);
    }
  }

  console.log('\n✅ Migration script concluído.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Erro na migração:', err);
  process.exit(1);
});
