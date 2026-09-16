-- =========================================================================
-- AgroSys Migration: User Profiles, Crew Pilots, Crew Assistants & Relationships
-- =========================================================================

-- 1. Tenants table
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

-- 2. User Profiles
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

    CONSTRAINT fk_user_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='company_id') THEN
        ALTER TABLE public.user_profiles ADD COLUMN company_id TEXT REFERENCES public.tenants(id) ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='password') THEN
        ALTER TABLE public.user_profiles ADD COLUMN password TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='is_master') THEN
        ALTER TABLE public.user_profiles ADD COLUMN is_master BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='allowed_views') THEN
        ALTER TABLE public.user_profiles ADD COLUMN allowed_views JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='photo_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN photo_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='user_profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.user_profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 3. Crew Pilots
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

    CONSTRAINT fk_pilot_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    CONSTRAINT fk_pilot_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 4. Crew Assistants
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

    CONSTRAINT fk_assistant_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    CONSTRAINT fk_assistant_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- 5. User Permissions Override
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

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON public.user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_doc ON public.user_profiles(document_number);
CREATE INDEX IF NOT EXISTS idx_crew_pilots_company_id ON public.crew_pilots(company_id);
CREATE INDEX IF NOT EXISTS idx_crew_pilots_user_id ON public.crew_pilots(user_id);
CREATE INDEX IF NOT EXISTS idx_crew_assistants_company_id ON public.crew_assistants(company_id);
CREATE INDEX IF NOT EXISTS idx_crew_assistants_user_id ON public.crew_assistants(user_id);

-- 7. RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crew_assistants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions_override ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all on user_profiles" ON public.user_profiles FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on crew_pilots" ON public.crew_pilots;
CREATE POLICY "Allow all on crew_pilots" ON public.crew_pilots FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on crew_assistants" ON public.crew_assistants;
CREATE POLICY "Allow all on crew_assistants" ON public.crew_assistants FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all on user_permissions_override" ON public.user_permissions_override;
CREATE POLICY "Allow all on user_permissions_override" ON public.user_permissions_override FOR ALL TO public USING (true) WITH CHECK (true);
