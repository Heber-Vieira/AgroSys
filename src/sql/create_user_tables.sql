-- =========================================================================
-- AgroSys - Script de Migração: Usuários, Pilotos, Auxiliares & Relacionamentos
-- Cria e atualiza as tabelas public.user_profiles, public.crew_pilots,
-- public.crew_assistants e public.user_permissions_override com chaves
-- estrangeiras relacionais completas para public.tenants (Empresas),
-- índices de alta performance, triggers de timestamp e políticas RLS.
-- =========================================================================

-- 1. GARANTE A EXISTÊNCIA DA TABELA DE EMPRESAS (TENANTS)
CREATE TABLE IF NOT EXISTS public.tenants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    trade_name TEXT,
    cnpj TEXT NOT NULL,
    state_registration TEXT,
    registry_crea_mapa TEXT,
    phone TEXT,
    email TEXT,
    city_state TEXT,
    tagline TEXT,
    primary_color TEXT DEFAULT '#0284c7',
    secondary_color TEXT DEFAULT '#0f766e',
    accent_color TEXT DEFAULT '#f59e0b',
    crop_focus TEXT,
    description TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELA PRINCIPAL DE PERFIS DE USUÁRIOS (USER_PROFILES)
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    company_id TEXT,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    role_label TEXT DEFAULT 'Usuário / Produtor Rural',
    email TEXT UNIQUE,
    avatar_url TEXT,
    photo_url TEXT,
    badge TEXT DEFAULT 'Colaborador',
    document_number TEXT,
    phone TEXT,
    license_code TEXT,
    farm_name TEXT,
    status TEXT DEFAULT 'ACTIVE',
    salary_base NUMERIC DEFAULT 0,
    hired_date DATE,
    password TEXT,
    is_master BOOLEAN DEFAULT false,
    allowed_views JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Relacionamento com a Empresa (Tenants)
    CONSTRAINT fk_user_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- Garante que colunas essenciais existam caso a tabela já tenha sido criada anteriormente
DO $$ 
BEGIN
    -- Adiciona company_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='company_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN company_id TEXT REFERENCES public.tenants(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    -- Adiciona password se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='password') THEN
        ALTER TABLE public.user_profiles ADD COLUMN password TEXT;
    END IF;

    -- Adiciona is_master se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_master') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_master BOOLEAN DEFAULT false;
    END IF;

    -- Adiciona allowed_views se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='allowed_views') THEN
        ALTER TABLE public.user_profiles ADD COLUMN allowed_views JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Adiciona photo_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='photo_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN photo_url TEXT;
    END IF;

    -- Adiciona avatar_url se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 3. TABELA DE PILOTOS DE DRONE (CREW_PILOTS)
CREATE TABLE IF NOT EXISTS public.crew_pilots (
    id TEXT PRIMARY KEY DEFAULT ('pilot-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    user_id TEXT,
    company_id TEXT,
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    license TEXT,
    decea_license TEXT,
    cma_expiration DATE,
    commission_per_ha NUMERIC DEFAULT 8.00,
    commission_rate_per_ha NUMERIC DEFAULT 8.00,
    total_hours_flown NUMERIC DEFAULT 0,
    hectares_sprayed NUMERIC DEFAULT 0,
    available BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'AVAILABLE',
    salary_base NUMERIC DEFAULT 4800,
    daily_goal_bonus_value NUMERIC DEFAULT 150,
    hazard_pay_pct NUMERIC DEFAULT 30,
    photo_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Relacionamento com Perfil de Usuário
    CONSTRAINT fk_pilot_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    -- Relacionamento com Empresa (Tenants)
    CONSTRAINT fk_pilot_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 4. TABELA DE AUXILIARES DE CAMPO / CALDA (CREW_ASSISTANTS)
CREATE TABLE IF NOT EXISTS public.crew_assistants (
    id TEXT PRIMARY KEY DEFAULT ('assistant-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    user_id TEXT,
    company_id TEXT,
    name TEXT NOT NULL,
    cpf TEXT,
    phone TEXT,
    email TEXT,
    commission_per_ha NUMERIC DEFAULT 3.00,
    commission_rate_per_ha NUMERIC DEFAULT 3.00,
    nr31_certified BOOLEAN DEFAULT true,
    nr31_insalubrity_pct NUMERIC DEFAULT 20,
    hectares_assisted NUMERIC DEFAULT 0,
    available BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'AVAILABLE',
    salary_base NUMERIC DEFAULT 2650,
    daily_goal_bonus_value NUMERIC DEFAULT 60,
    photo_url TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    -- Relacionamento com Perfil de Usuário
    CONSTRAINT fk_assistant_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    -- Relacionamento com Empresa (Tenants)
    CONSTRAINT fk_assistant_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 5. TABELA DE CONTROLE DE ACESSO E DELEGAÇÃO DE TELAS (USER_PERMISSIONS_OVERRIDE)
CREATE TABLE IF NOT EXISTS public.user_permissions_override (
    id TEXT PRIMARY KEY DEFAULT ('perm-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    user_id TEXT NOT NULL,
    company_id TEXT,
    allowed_views JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT true,
    granted_by TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),

    CONSTRAINT fk_perm_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,

    CONSTRAINT fk_perm_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 6. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_doc ON public.user_profiles(document_number);
CREATE INDEX IF NOT EXISTS idx_crew_pilots_company_id ON public.crew_pilots(company_id);
CREATE INDEX IF NOT EXISTS idx_crew_pilots_user_id ON public.crew_pilots(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_assistants_company_id ON public.crew_assistants(company_id);
CREATE INDEX IF NOT EXISTS idx_crew_assistants_user_id ON public.crew_assistants(user_id);

-- 7. POLÍTICAS DE SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions_override ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Allow all on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all on user_profiles"
    ON public.user_profiles
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Políticas para crew_pilots
DROP POLICY IF EXISTS "Allow all on crew_pilots" ON public.crew_pilots;
CREATE POLICY "Allow all on crew_pilots"
    ON public.crew_pilots
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Políticas para crew_assistants
DROP POLICY IF EXISTS "Allow all on crew_assistants" ON public.crew_assistants;
CREATE POLICY "Allow all on crew_assistants"
    ON public.crew_assistants
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- Políticas para user_permissions_override
DROP POLICY IF EXISTS "Allow all on user_permissions_override" ON public.user_permissions_override;
CREATE POLICY "Allow all on user_permissions_override"
    ON public.user_permissions_override
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 8. TRIGGER AUTOMÁTICO DE ATUALIZAÇÃO DE TIMESTAMPS
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_timestamp_user_profiles ON public.user_profiles;
CREATE TRIGGER set_timestamp_user_profiles
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_crew_pilots ON public.crew_pilots;
CREATE TRIGGER set_timestamp_crew_pilots
BEFORE UPDATE ON public.crew_pilots
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_crew_assistants ON public.crew_assistants;
CREATE TRIGGER set_timestamp_crew_assistants
BEFORE UPDATE ON public.crew_assistants
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

-- 9. HABILITAÇÃO DO SUPABASE REALTIME
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_pilots;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_assistants;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
