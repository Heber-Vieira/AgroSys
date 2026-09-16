-- =========================================================================
-- AgroSys - Script de Migração: Logs de Auditoria & Relacionamentos
-- Cria a tabela public.user_activity_logs com chaves estrangeiras para
-- public.tenants (Empresas) e public.user_profiles (Usuários),
-- além de índices de performance e políticas RLS de segurança.
-- =========================================================================

-- 1. TABELA PRINCIPAL DE LOGS DE AUDITORIA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    company_id TEXT,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT '127.0.0.1',
    response_status INTEGER DEFAULT 200,
    status_label TEXT DEFAULT 'SUCCESS',
    user_role TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Relacionamento de Chave Estrangeira com a Empresa (Tenants)
    CONSTRAINT fk_audit_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    -- Relacionamento de Chave Estrangeira com o Usuário (User Profiles)
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- Comentários de documentação nas colunas
COMMENT ON TABLE public.user_activity_logs IS 'Armazena todos os eventos e logs de auditoria de atividade de usuários no AgroSys.';
COMMENT ON COLUMN public.user_activity_logs.user_id IS 'ID do usuário que executou a ação (referência a public.user_profiles).';
COMMENT ON COLUMN public.user_activity_logs.company_id IS 'ID da empresa / tenant vinculada à ação (referência a public.tenants).';
COMMENT ON COLUMN public.user_activity_logs.action IS 'Tipo da ação auditada (ex: LOGIN, CREATE_ORDER, UPDATE_USER, DELETE_COMPANY, DATA_EXPORT).';
COMMENT ON COLUMN public.user_activity_logs.details IS 'Payload estruturado em JSON com detalhes da mutação, parâmetros e metadados.';
COMMENT ON COLUMN public.user_activity_logs.ip_address IS 'Endereço IP público ou de rede do cliente no momento da requisição.';
COMMENT ON COLUMN public.user_activity_logs.response_status IS 'Código de status HTTP (ex: 200, 201, 401, 403, 500).';

-- 2. ÍNDICES DE ALTA PERFORMANCE PARA CONSULTAS E FILTROS RÁPIDOS
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.user_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_company_id ON public.user_activity_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.user_activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_response_status ON public.user_activity_logs (response_status);
CREATE INDEX IF NOT EXISTS idx_audit_status_label ON public.user_activity_logs (status_label);
CREATE INDEX IF NOT EXISTS idx_audit_details_gin ON public.user_activity_logs USING gin (details);

-- 3. POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Permite inserção de novos logs por qualquer cliente autenticado ou anônimo (para registro de logins, falhas, etc.)
DROP POLICY IF EXISTS "Allow insert audit logs" ON public.user_activity_logs;
CREATE POLICY "Allow insert audit logs"
    ON public.user_activity_logs
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Permite consulta aos logs de auditoria (a camada de aplicação filtra o acesso exclusivo para usuários Master)
DROP POLICY IF EXISTS "Allow select audit logs" ON public.user_activity_logs;
CREATE POLICY "Allow select audit logs"
    ON public.user_activity_logs
    FOR SELECT
    TO public
    USING (true);

-- 4. TABELA COMPLEMENTAR: APP_SETTINGS (Configurações duráveis globais)
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on app_settings" ON public.app_settings;
CREATE POLICY "Allow all on app_settings"
    ON public.app_settings
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 5. TABELA COMPLEMENTAR: TENANT_BRANDING_CONFIGS
CREATE TABLE IF NOT EXISTS public.tenant_branding_configs (
    tenant_id TEXT PRIMARY KEY REFERENCES public.tenants(id) ON DELETE CASCADE,
    logo_url TEXT,
    logo_dark_url TEXT,
    logo_icon_id TEXT,
    logo_adaptive_mode TEXT DEFAULT 'auto',
    primary_color TEXT DEFAULT '#059669',
    secondary_color TEXT DEFAULT '#0f766e',
    accent_color TEXT DEFAULT '#f59e0b',
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.tenant_branding_configs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on tenant_branding_configs" ON public.tenant_branding_configs;
CREATE POLICY "Allow all on tenant_branding_configs"
    ON public.tenant_branding_configs
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 6. HABILITAR PUBLICADOR REALTIME DO SUPABASE (Opcional para monitoramento ao vivo)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_logs;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
