-- =========================================================================
-- AgroSys - Migration: 20260916_create_user_activity_logs.sql
-- Table: public.user_activity_logs with relationships to public.tenants and public.user_profiles
-- =========================================================================

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

    -- Foreign Key to Tenants / Companies
    CONSTRAINT fk_audit_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    -- Foreign Key to User Profiles
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.user_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_company_id ON public.user_activity_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.user_activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_response_status ON public.user_activity_logs (response_status);
CREATE INDEX IF NOT EXISTS idx_audit_status_label ON public.user_activity_logs (status_label);
CREATE INDEX IF NOT EXISTS idx_audit_details_gin ON public.user_activity_logs USING gin (details);

ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert audit logs" ON public.user_activity_logs;
CREATE POLICY "Allow insert audit logs"
    ON public.user_activity_logs
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select audit logs" ON public.user_activity_logs;
CREATE POLICY "Allow select audit logs"
    ON public.user_activity_logs
    FOR SELECT
    TO public
    USING (true);

-- Complementary tables for durable configuration
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
