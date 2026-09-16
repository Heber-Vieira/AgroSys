-- ============================================================================
-- CONSOLIDAÇÃO DE SCHEMA & RELACIONAMENTOS DO BANCO DE DADOS AGROSYS
-- 1. Remoção segura de tabelas legadas vazias/duplicadas (users, pilots, assistants, drones, plots, orders, audit_logs, logs)
-- 2. Garantia das tabelas canônicas ativas e seus relacionamentos relacionais de integridade
-- ============================================================================

-- ----------------------------------------------------------------------------
-- STEP 1: REMOVER TABELAS VAZIAS DUPLICADAS / LEGADAS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.pilots CASCADE;
DROP TABLE IF EXISTS public.assistants CASCADE;
DROP TABLE IF EXISTS public.drones CASCADE;
DROP TABLE IF EXISTS public.plots CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.logs CASCADE;

-- ----------------------------------------------------------------------------
-- STEP 2: GARANTIR CONSTRAINTS DE CHAVE ESTRANGEIRA E RELACIONAMENTOS NAS TABELAS CANÔNICAS
-- ----------------------------------------------------------------------------

-- Relacionamento: user_profiles -> tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_profiles_company' AND table_name = 'user_profiles'
    ) THEN
        ALTER TABLE public.user_profiles
        ADD CONSTRAINT fk_user_profiles_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: crew_pilots -> tenants & user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_crew_pilots_company' AND table_name = 'crew_pilots'
    ) THEN
        ALTER TABLE public.crew_pilots
        ADD CONSTRAINT fk_crew_pilots_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_crew_pilots_user' AND table_name = 'crew_pilots'
    ) THEN
        ALTER TABLE public.crew_pilots
        ADD CONSTRAINT fk_crew_pilots_user
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: crew_assistants -> tenants & user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_crew_assistants_company' AND table_name = 'crew_assistants'
    ) THEN
        ALTER TABLE public.crew_assistants
        ADD CONSTRAINT fk_crew_assistants_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_crew_assistants_user' AND table_name = 'crew_assistants'
    ) THEN
        ALTER TABLE public.crew_assistants
        ADD CONSTRAINT fk_crew_assistants_user
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: user_activity_logs -> tenants & user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_activity_logs_company' AND table_name = 'user_activity_logs'
    ) THEN
        ALTER TABLE public.user_activity_logs
        ADD CONSTRAINT fk_user_activity_logs_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_user_activity_logs_user' AND table_name = 'user_activity_logs'
    ) THEN
        ALTER TABLE public.user_activity_logs
        ADD CONSTRAINT fk_user_activity_logs_user
        FOREIGN KEY (user_id) REFERENCES public.user_profiles(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: farm_plots -> tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_farm_plots_company' AND table_name = 'farm_plots'
    ) THEN
        ALTER TABLE public.farm_plots
        ADD CONSTRAINT fk_farm_plots_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: agricultural_drones -> tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_agricultural_drones_company' AND table_name = 'agricultural_drones'
    ) THEN
        ALTER TABLE public.agricultural_drones
        ADD CONSTRAINT fk_agricultural_drones_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: service_orders -> tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_service_orders_company' AND table_name = 'service_orders'
    ) THEN
        ALTER TABLE public.service_orders
        ADD CONSTRAINT fk_service_orders_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Relacionamento: drone_maintenance_logs -> tenants
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_drone_maintenance_company' AND table_name = 'drone_maintenance_logs'
    ) THEN
        ALTER TABLE public.drone_maintenance_logs
        ADD CONSTRAINT fk_drone_maintenance_company
        FOREIGN KEY (company_id) REFERENCES public.tenants(id)
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- ----------------------------------------------------------------------------
-- STEP 3: PUBLICAR HABILITAÇÃO REALTIME SUPABASE
-- ----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_profiles;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_pilots;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.crew_assistants;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_activity_logs;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.farm_plots;
        ALTER PUBLICATION supabase_realtime ADD TABLE public.agricultural_drones;
    END IF;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;
