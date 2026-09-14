/**
 * AgroSys - Database Migration & Seed Script for User Activity Logs
 * Creates table `public.user_activity_logs` in Supabase with RLS policies,
 * indexes, and seeds initial realistic activity log records.
 * 
 * Run: npx tsx src/scripts/migrate_create_audit_logs.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const MIGRATION_SQL = `
-- 1. Create User Activity Logs Table
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  user_name TEXT,
  user_email TEXT,
  company_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT NOT NULL DEFAULT '127.0.0.1',
  response_status INTEGER NOT NULL DEFAULT 200,
  status_label TEXT NOT NULL DEFAULT 'SUCCESS',
  user_role TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for fast lookup by user, action, date
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_company_id ON public.user_activity_logs(company_id);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies:
-- Allow insert from authenticated and anon clients (audit logger service)
DROP POLICY IF EXISTS "allow_insert_activity_logs" ON public.user_activity_logs;
CREATE POLICY "allow_insert_activity_logs" ON public.user_activity_logs 
  FOR INSERT WITH CHECK (true);

-- Allow SELECT for all (service layer enforces Master Admin role checks in app)
DROP POLICY IF EXISTS "allow_select_activity_logs" ON public.user_activity_logs;
CREATE POLICY "allow_select_activity_logs" ON public.user_activity_logs 
  FOR SELECT USING (true);
`;

const INITIAL_SEED_LOGS = [
  {
    user_id: 'user-heber-vieira',
    user_name: 'Heber Vieira',
    user_email: 'heber.vieira.hv@gmail.com',
    company_id: 'ciclodrone',
    action: 'LOGIN',
    details: { method: 'password', platform: 'Web Desktop', browser: 'Chrome 122' },
    ip_address: '189.122.45.109',
    response_status: 200,
    status_label: 'SUCCESS',
    user_role: 'MASTER',
    duration_ms: 142,
    created_at: new Date(Date.now() - 3600 * 1000 * 2).toISOString()
  },
  {
    user_id: 'user-heber-vieira',
    user_name: 'Heber Vieira',
    user_email: 'heber.vieira.hv@gmail.com',
    company_id: 'ciclodrone',
    action: 'COMPANY_BRANDING_UPDATE',
    details: { companyName: 'Ciclodrone Aviação Agrícola', primaryColor: '#059669', logoUpdated: true },
    ip_address: '189.122.45.109',
    response_status: 200,
    status_label: 'SUCCESS',
    user_role: 'MASTER',
    duration_ms: 310,
    created_at: new Date(Date.now() - 3600 * 1000 * 1.5).toISOString()
  },
  {
    user_id: 'user-thales-vieira',
    user_name: 'Thales Vieira',
    user_email: 'thalesfelipe1@hotmail.com',
    company_id: 'agro-clean-emerald',
    action: 'CREATE_CLIENT',
    details: { clientName: 'Fazenda Santa Terezinha Ltda', cnpj: '12.345.678/0001-90', hectares: 1250 },
    ip_address: '177.89.210.44',
    response_status: 201,
    status_label: 'SUCCESS',
    user_role: 'ADMIN',
    duration_ms: 220,
    created_at: new Date(Date.now() - 3600 * 1000 * 1).toISOString()
  },
  {
    user_id: 'user-piloto-rodrigo',
    user_name: 'Rodrigo Pilot',
    user_email: 'rodrigo.pilot@agrosys.com',
    company_id: 'ciclodrone',
    action: 'LOGIN_FAILED',
    details: { reason: 'Senha incorreta', attempt: 1 },
    ip_address: '201.55.12.88',
    response_status: 401,
    status_label: 'FAILURE',
    user_role: 'PILOT',
    duration_ms: 85,
    created_at: new Date(Date.now() - 3600 * 1000 * 0.8).toISOString()
  },
  {
    user_id: 'user-unauthorized',
    user_name: 'Usuário Desconhecido',
    user_email: 'hacker@exemplo.com',
    company_id: 'unknown',
    action: 'ACCESS_DENIED',
    details: { attemptedResource: '/admin/logs', reason: 'Role PILOT tentou acessar logs de auditoria' },
    ip_address: '45.133.1.99',
    response_status: 403,
    status_label: 'DENIED',
    user_role: 'USER',
    duration_ms: 15,
    created_at: new Date(Date.now() - 3600 * 1000 * 0.2).toISOString()
  }
];

async function migrateAndSeed() {
  console.log('🚀 Iniciando Migração & População da Tabela user_activity_logs no Supabase...\n');

  console.log('1️⃣ Criando tabela e políticas RLS via RPC...');
  const { error: rpcErr } = await supabase.rpc('exec_sql', { sql_query: MIGRATION_SQL });

  if (rpcErr) {
    console.log(`   ⚠️ RPC exec_sql não ativo (${rpcErr.message}).`);
    console.log('   Tentando inserir/verificar tabela diretamente...');
  } else {
    console.log('   ✅ Tabela public.user_activity_logs criada com sucesso via RPC!');
  }

  console.log('\n2️⃣ Testando inserção dos registros de semente (seed logs)...');
  const { data: insertedData, error: insertErr } = await supabase
    .from('user_activity_logs')
    .insert(INITIAL_SEED_LOGS)
    .select();

  if (insertErr) {
    if (insertErr.code === 'PGRST205' || insertErr.message.includes('404') || insertErr.message.includes('relation')) {
      console.log('   ❌ A tabela user_activity_logs ainda não foi criada no banco de dados Supabase.');
      console.log('\n📋 Copie e cole o SQL abaixo no Dashboard do Supabase (SQL Editor):\n');
      console.log('─────────────────────────────────────────────────────────────────────────────');
      console.log(MIGRATION_SQL);
      console.log('─────────────────────────────────────────────────────────────────────────────');
    } else {
      console.log(`   ⚠️ Aviso ao inserir seed: ${insertErr.message}`);
    }
  } else {
    console.log(`   ✅ Inseridos ${insertedData?.length || 0} registros iniciais de log no Supabase!`);
  }

  console.log('\n✅ Script de migração de logs concluído.');
  process.exit(0);
}

migrateAndSeed().catch(err => {
  console.error('Erro na migração de logs:', err);
  process.exit(1);
});
