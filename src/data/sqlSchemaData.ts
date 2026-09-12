export interface SchemaTable {
  name: string;
  category: 'GIS & Core' | 'Precificação' | 'Field Service (OS)' | 'Calda & Clima' | 'Telemetria' | 'Financeiro & Comissões' | 'White Label';
  description: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    description: string;
    isPrimary?: boolean;
    isForeign?: boolean;
    references?: string;
  }[];
  indices: string[];
}

export const POSTGIS_SQL_SCRIPT = `-- ============================================================================
-- AGROSYS - SISTEMA INTEGRADO DE GESTÃO DE PULVERIZAÇÃO AEROAGRÍCOLA
-- MODELAGEM DE DADOS RELACIONAL E GEOESPACIAL (POSTGRESQL 15+ & POSTGIS 3.3+)
-- Mentalidade: Multi-Tenant, API-First, Offline-First Sync & Auditoria
-- ============================================================================

-- 1. EXTENSÕES OBRIGATÓRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS DE DOMÍNIO
CREATE TYPE tenant_status AS ENUM ('ACTIVE', 'SUSPENDED', 'TRIAL', 'CANCELED');
CREATE TYPE os_status AS ENUM ('SCHEDULED', 'IN_TRANSIT', 'OPERATING', 'PAUSED', 'COMPLETED', 'CANCELLED');
CREATE TYPE pricing_model_type AS ENUM ('PER_HECTARE', 'PER_FLIGHT_HOUR', 'PER_LITER_MIX');
CREATE TYPE terrain_type AS ENUM ('FLAT_GRAINS', 'PASTURE', 'STEEP_SLOPE', 'ORCHARD_FRUIT', 'WETLAND');
CREATE TYPE drone_brand_type AS ENUM ('DJI_AGRICULTURE', 'XAG', 'EFT_JMR', 'CUSTOM_PX4');
CREATE TYPE product_category_type AS ENUM ('HERBICIDE', 'FUNGICIDE', 'INSECTICIDE', 'ADJUVANT', 'FOLIAR_FERT', 'BIOLOGICAL');
CREATE TYPE commission_calc_type AS ENUM ('FIXED_PER_HECTARE', 'PERCENTAGE_GROSS', 'PERCENTAGE_NET');
CREATE TYPE financial_entry_type AS ENUM ('RECEIVABLE', 'PAYABLE');
CREATE TYPE financial_status_type AS ENUM ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');

-- ============================================================================
-- MÓDULO: MULTI-TENANCY & BRANDING (WHITE LABEL)
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(150) NOT NULL,
    trade_name VARCHAR(150),
    tax_id VARCHAR(20) NOT NULL UNIQUE, -- CNPJ
    subdomain VARCHAR(63) NOT NULL UNIQUE,
    custom_domain VARCHAR(255) UNIQUE,
    status tenant_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE tenant_branding_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    logo_light_url TEXT,
    logo_dark_url TEXT,
    favicon_url TEXT,
    -- Paleta Semântica Primária & Secundária (Extraída do Logo ou Ajustada Manualmente)
    primary_color_hex VARCHAR(7) NOT NULL DEFAULT '#15803D',   -- Verde Agro
    secondary_color_hex VARCHAR(7) NOT NULL DEFAULT '#0284C7', -- Azul Céu
    accent_color_hex VARCHAR(7) NOT NULL DEFAULT '#D97706',    -- Terra / Alerta
    neutral_light_hex VARCHAR(7) NOT NULL DEFAULT '#F8FAFC',
    neutral_dark_hex VARCHAR(7) NOT NULL DEFAULT '#0F172A',
    font_family VARCHAR(100) DEFAULT 'Plus Jakarta Sans',
    border_radius_base VARCHAR(10) DEFAULT '0.75rem',
    high_contrast_sunlight_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MÓDULO 1: CADASTRO DE CLIENTES, FAZENDAS E TALHÕES (GIS / POSTGIS)
-- ============================================================================

CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    tax_id VARCHAR(20) NOT NULL, -- CPF ou CNPJ
    email VARCHAR(100),
    phone VARCHAR(25),
    state_registration VARCHAR(30),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_client_tax UNIQUE (tenant_id, tax_id)
);

CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    farm_name VARCHAR(150) NOT NULL,
    car_number VARCHAR(100), -- Cadastro Ambiental Rural (CAR)
    municipality VARCHAR(100) NOT NULL,
    state_uf CHAR(2) NOT NULL,
    headquarters_location GEOMETRY(Point, 4326), -- Sede da fazenda para rotas
    total_area_hectares NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE farm_plots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    plot_name VARCHAR(100) NOT NULL,
    crop_type VARCHAR(60) NOT NULL, -- Soja, Milho, Algodão, Cana, Pastagem
    crop_season VARCHAR(30), -- Ex: Safra 2025/2026
    growth_stage VARCHAR(50), -- Ex: V4, R1, Florescimento, Pré-emergência
    calculated_area_hectares NUMERIC(10, 2) NOT NULL,
    average_slope_degrees NUMERIC(5, 2) DEFAULT 0.0,
    -- Polígono Geoespacial PostGIS no sistema WGS 84 (SRID 4326)
    polygon_boundary GEOMETRY(Polygon, 4326) NOT NULL,
    kml_source_file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice Espacial GIST para consultas ultra-rápidas de polígonos
CREATE INDEX idx_farm_plots_boundary ON farm_plots USING GIST (polygon_boundary);

-- ============================================================================
-- MÓDULO 2: CONFIGURAÇÃO DE PRECIFICAÇÃO FLEXÍVEL
-- ============================================================================

CREATE TABLE pricing_matrices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    matrix_name VARCHAR(120) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_matrix_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_matrix_id UUID NOT NULL REFERENCES pricing_matrices(id) ON DELETE CASCADE,
    crop_type VARCHAR(60), -- NULL representa regra genérica
    terrain_type terrain_type NOT NULL,
    pricing_model pricing_model_type NOT NULL DEFAULT 'PER_HECTARE',
    base_unit_rate NUMERIC(10, 2) NOT NULL, -- Ex: R$ 75,00 por hectare
    difficulty_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.00, -- Ex: 1.25 para declive severo
    minimum_billable_units NUMERIC(8, 2) DEFAULT 10.00, -- Mínimo de 10 ha faturados
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE pricing_volume_discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pricing_matrix_id UUID NOT NULL REFERENCES pricing_matrices(id) ON DELETE CASCADE,
    min_volume_hectares NUMERIC(10, 2) NOT NULL, -- A partir de 200 ha
    max_volume_hectares NUMERIC(10, 2),          -- até 500 ha
    discount_percentage NUMERIC(5, 2) NOT NULL,  -- 5.00%
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MÓDULO 8 & 3: ATIVOS E TRÍADE OPERACIONAL (DRONE + PILOTO + AJUDANTE)
-- ============================================================================

CREATE TABLE agricultural_drones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    brand drone_brand_type NOT NULL,
    model_name VARCHAR(80) NOT NULL, -- Ex: DJI Agras T40, XAG P100 Pro
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    anac_registration_code VARCHAR(50) NOT NULL, -- Ex: PP-000000001
    decea_sarpas_id VARCHAR(50),
    tank_capacity_liters NUMERIC(6, 2) NOT NULL,
    maximum_payload_kg NUMERIC(6, 2) NOT NULL,
    total_flight_hours NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
    total_sprayed_hectares NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE crew_pilots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID, -- Chave estrangeira para tabela de usuários
    full_name VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    phone VARCHAR(25) NOT NULL,
    anac_cma_code VARCHAR(40), -- Certificado Médico Aeronáutico
    decea_license_number VARCHAR(40) NOT NULL, -- Registro de Piloto Remoto
    default_commission_type commission_calc_type NOT NULL DEFAULT 'FIXED_PER_HECTARE',
    default_commission_rate NUMERIC(8, 2) NOT NULL DEFAULT 8.00, -- R$ 8,00 por hectare aplicado
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE crew_assistants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(150) NOT NULL,
    cpf VARCHAR(14) NOT NULL UNIQUE,
    phone VARCHAR(25),
    default_commission_type commission_calc_type NOT NULL DEFAULT 'FIXED_PER_HECTARE',
    default_commission_rate NUMERIC(8, 2) NOT NULL DEFAULT 3.00, -- R$ 3,00 por hectare aplicado
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MÓDULO 3 & 4: ORDENS DE SERVIÇO (OS), CALDA E CONDIÇÕES AMBIENTAIS
-- ============================================================================

CREATE TABLE service_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    order_code VARCHAR(25) NOT NULL, -- Ex: OS-2025-0892
    client_id UUID NOT NULL REFERENCES clients(id),
    farm_id UUID NOT NULL REFERENCES farms(id),
    farm_plot_id UUID NOT NULL REFERENCES farm_plots(id),
    pricing_matrix_id UUID NOT NULL REFERENCES pricing_matrices(id),
    -- Tríade Operacional Alocada
    drone_id UUID NOT NULL REFERENCES agricultural_drones(id),
    pilot_id UUID NOT NULL REFERENCES crew_pilots(id),
    assistant_id UUID NOT NULL REFERENCES crew_assistants(id),
    -- Planejamento vs Execução
    status os_status NOT NULL DEFAULT 'SCHEDULED',
    scheduled_start_date TIMESTAMPTZ NOT NULL,
    planned_spray_rate_l_ha NUMERIC(6, 2) NOT NULL DEFAULT 10.0, -- L/ha
    planned_target_hectares NUMERIC(10, 2) NOT NULL,
    actual_sprayed_hectares NUMERIC(10, 2) DEFAULT 0.0,
    actual_flight_time_minutes INTEGER DEFAULT 0,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    weather_safety_approved BOOLEAN NOT NULL DEFAULT FALSE,
    pilot_digital_signature TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tenant_order_code UNIQUE (tenant_id, order_code)
);

CREATE TABLE spray_mix_formulations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    total_water_volume_liters NUMERIC(10, 2) NOT NULL,
    number_of_tanks_prepared INTEGER NOT NULL,
    target_pest_disease VARCHAR(120),
    mandatory_ppe_checked BOOLEAN NOT NULL DEFAULT TRUE,
    empty_containers_collected_count INTEGER NOT NULL DEFAULT 0,
    reverse_logistics_receipt_number VARCHAR(80),
    chemical_incompatibility_flag BOOLEAN NOT NULL DEFAULT FALSE,
    agronomist_receipt_code VARCHAR(60), -- ART / Receituário Agronômico
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE spray_mix_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    spray_mix_id UUID NOT NULL REFERENCES spray_mix_formulations(id) ON DELETE CASCADE,
    product_name VARCHAR(120) NOT NULL,
    active_ingredient VARCHAR(120),
    product_category product_category_type NOT NULL,
    dose_per_hectare NUMERIC(8, 3) NOT NULL,
    unit_of_measure VARCHAR(10) NOT NULL, -- L, kg, mL, g
    -- Ordem de Adição no Tanque (Regra Agronômica: 1-Condicionador, 2-WP/WG, 3-SC, 4-EC, 5-Adjuvante)
    addition_order_sequence INTEGER NOT NULL,
    total_quantity_used NUMERIC(10, 3) NOT NULL,
    batch_number VARCHAR(50),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE environmental_weather_checks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    temperature_celsius NUMERIC(4, 1) NOT NULL,
    relative_humidity_pct NUMERIC(4, 1) NOT NULL,
    wind_speed_kmh NUMERIC(4, 1) NOT NULL,
    wind_direction_cardinal VARCHAR(10), -- N, NE, E, SE, S, SW, W, NW
    -- Delta T (°C): Indicador crucial de evaporação / deriva de gotas
    delta_t_celsius NUMERIC(4, 1) NOT NULL,
    is_safe_to_spray BOOLEAN NOT NULL,
    impediment_alert_reason VARCHAR(255),
    reading_source VARCHAR(50) NOT NULL DEFAULT 'MANUAL_POCKET_WEATHER' -- ou 'LOCAL_STATION'
);

-- ============================================================================
-- MÓDULO 6: MEDIÇÃO DE PRODUTIVIDADE E TELEMETRIA DE VOO
-- ============================================================================

CREATE TABLE drone_flight_telemetry_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE CASCADE,
    drone_id UUID NOT NULL REFERENCES agricultural_drones(id),
    brand drone_brand_type NOT NULL,
    log_file_name VARCHAR(255) NOT NULL,
    log_file_url TEXT,
    applied_hectares NUMERIC(10, 2) NOT NULL,
    flight_duration_seconds INTEGER NOT NULL,
    total_spray_volume_pumped_liters NUMERIC(10, 2) NOT NULL,
    average_flight_speed_ms NUMERIC(5, 2),
    average_spray_height_meters NUMERIC(5, 2),
    overlap_coverage_percentage NUMERIC(5, 2),
    battery_serial_used VARCHAR(80),
    battery_cycle_number INTEGER,
    -- Polígono ou Linha de Voo real gerada pelo log
    actual_flight_path GEOMETRY(MultiLineString, 4326),
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- MÓDULO 7: GESTÃO FINANCEIRA, FATURAMENTO E COMISSÕES
-- ============================================================================

CREATE TABLE commission_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_name VARCHAR(100) NOT NULL,
    pilot_rate NUMERIC(8, 2) NOT NULL,
    pilot_calc_type commission_calc_type NOT NULL DEFAULT 'FIXED_PER_HECTARE',
    assistant_rate NUMERIC(8, 2) NOT NULL,
    assistant_calc_type commission_calc_type NOT NULL DEFAULT 'FIXED_PER_HECTARE',
    is_default BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE service_order_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL UNIQUE REFERENCES service_orders(id) ON DELETE RESTRICT,
    invoice_number VARCHAR(50) NOT NULL,
    billed_hectares NUMERIC(10, 2) NOT NULL,
    base_unit_rate NUMERIC(10, 2) NOT NULL,
    terrain_multiplier NUMERIC(4, 2) NOT NULL DEFAULT 1.0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.0,
    gross_total_amount NUMERIC(10, 2) NOT NULL,
    net_total_amount NUMERIC(10, 2) NOT NULL,
    due_date DATE NOT NULL,
    status financial_status_type NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE commission_settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    service_order_id UUID NOT NULL REFERENCES service_orders(id) ON DELETE RESTRICT,
    pilot_id UUID NOT NULL REFERENCES crew_pilots(id),
    pilot_commission_amount NUMERIC(10, 2) NOT NULL,
    assistant_id UUID NOT NULL REFERENCES crew_assistants(id),
    assistant_commission_amount NUMERIC(10, 2) NOT NULL,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    pilot_paid_at TIMESTAMPTZ,
    assistant_paid_at TIMESTAMPTZ,
    financial_status financial_status_type NOT NULL DEFAULT 'PENDING'
);

CREATE TABLE financial_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entry_type financial_entry_type NOT NULL, -- RECEIVABLE (Fatura da OS) ou PAYABLE (Comissão/Insumo)
    category VARCHAR(60) NOT NULL, -- 'PULVERIZACAO_SERVICO', 'COMISSAO_PILOTO', 'COMISSAO_AJUDANTE'
    description VARCHAR(255) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date DATE,
    status financial_status_type NOT NULL DEFAULT 'PENDING',
    service_order_id UUID REFERENCES service_orders(id) ON DELETE SET NULL,
    invoice_id UUID REFERENCES service_order_invoices(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AUDITORIA & TRIGGER PARA ATUALIZAÇÃO AUTOMÁTICA DE TIMESTAMP
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_tenants_updated BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_farm_plots_updated BEFORE UPDATE ON farm_plots FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER trg_service_orders_updated BEFORE UPDATE ON service_orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
`;

export const SCHEMA_TABLES: SchemaTable[] = [
  {
    name: 'tenants & tenant_branding_configs',
    category: 'White Label',
    description: 'Armazena clientes B2B do sistema, domínios personalizados e a paleta de cores primárias/secundárias extraídas da logo.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'Identificador único do inquilino', isPrimary: true },
      { name: 'company_name', type: 'VARCHAR(150)', nullable: false, description: 'Razão social da empresa de drones' },
      { name: 'subdomain', type: 'VARCHAR(63)', nullable: false, description: 'Ex: aeropulverize.agrodrone.com' },
      { name: 'primary_color_hex', type: 'VARCHAR(7)', nullable: false, description: 'Cor primária gerada dinamicamente da logo' },
      { name: 'high_contrast_sunlight_enabled', type: 'BOOLEAN', nullable: false, description: 'Ativa modo de alto contraste para sol a pino' }
    ],
    indices: ['idx_tenants_subdomain (UNIQUE)', 'idx_branding_tenant_id (FK)']
  },
  {
    name: 'farm_plots (GIS / PostGIS)',
    category: 'GIS & Core',
    description: 'Representação geoespacial dos talhões rurais com suporte a polígonos WGS84 e cálculo topográfico.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'ID do talhão', isPrimary: true },
      { name: 'farm_id', type: 'UUID', nullable: false, description: 'ID da fazenda vinculada', isForeign: true, references: 'farms(id)' },
      { name: 'plot_name', type: 'VARCHAR(100)', nullable: false, description: 'Nome/Identificador do talhão (ex: Talhão 04 - Pivô Sul)' },
      { name: 'crop_type', type: 'VARCHAR(60)', nullable: false, description: 'Cultura: Soja, Milho, Algodão, Cana, Pastagem' },
      { name: 'calculated_area_hectares', type: 'NUMERIC(10,2)', nullable: false, description: 'Área calculada por projeção plana' },
      { name: 'polygon_boundary', type: 'GEOMETRY(Polygon, 4326)', nullable: false, description: 'Polígono PostGIS do perímetro' }
    ],
    indices: ['idx_farm_plots_boundary USING GIST (polygon_boundary)', 'idx_plots_farm_id (FK)']
  },
  {
    name: 'pricing_matrix_rules & discounts',
    category: 'Precificação',
    description: 'Matriz flexível de precificação por tipo de terreno, cultura, modelo (ha, hora, litro) e descontos progressivos de volume.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'ID da regra', isPrimary: true },
      { name: 'pricing_matrix_id', type: 'UUID', nullable: false, description: 'Matriz base', isForeign: true, references: 'pricing_matrices(id)' },
      { name: 'terrain_type', type: 'ENUM (terrain_type)', nullable: false, description: 'Terreno: plano, pastagem, declive, pomar' },
      { name: 'pricing_model', type: 'ENUM (pricing_model_type)', nullable: false, description: 'PER_HECTARE, PER_FLIGHT_HOUR ou PER_LITER_MIX' },
      { name: 'base_unit_rate', type: 'NUMERIC(10,2)', nullable: false, description: 'Valor base (ex: R$ 75,00/ha)' },
      { name: 'difficulty_multiplier', type: 'NUMERIC(4,2)', nullable: false, description: 'Fator de risco/inclinação (ex: 1.20)' }
    ],
    indices: ['idx_pricing_matrix_lookup (pricing_matrix_id, terrain_type)']
  },
  {
    name: 'service_orders',
    category: 'Field Service (OS)',
    description: 'Ordem de serviço que amarra a tríade (Drone + Piloto + Ajudante) ao Talhão e comanda o ciclo de vida.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'ID da OS', isPrimary: true },
      { name: 'order_code', type: 'VARCHAR(25)', nullable: false, description: 'Código único legível (ex: OS-2025-0892)' },
      { name: 'farm_plot_id', type: 'UUID', nullable: false, description: 'Talhão alvo com coordenadas', isForeign: true, references: 'farm_plots(id)' },
      { name: 'drone_id', type: 'UUID', nullable: false, description: 'Drone homologado ANAC/DECEA', isForeign: true, references: 'agricultural_drones(id)' },
      { name: 'pilot_id', type: 'UUID', nullable: false, description: 'Piloto credenciado', isForeign: true, references: 'crew_pilots(id)' },
      { name: 'assistant_id', type: 'UUID', nullable: false, description: 'Ajudante de linha', isForeign: true, references: 'crew_assistants(id)' },
      { name: 'status', type: 'ENUM (os_status)', nullable: false, description: 'SCHEDULED, IN_TRANSIT, OPERATING, PAUSED, COMPLETED, CANCELLED' },
      { name: 'actual_sprayed_hectares', type: 'NUMERIC(10,2)', nullable: true, description: 'Área consolidada via telemetria' }
    ],
    indices: ['idx_service_orders_status (status)', 'idx_service_orders_tenant_code (UNIQUE)']
  },
  {
    name: 'environmental_weather_checks & spray_mix',
    category: 'Calda & Clima',
    description: 'Registro das condições meteorológicas (Delta T, vento, UR) com alertas impeditivos e calculadora de calda.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'ID da checagem', isPrimary: true },
      { name: 'service_order_id', type: 'UUID', nullable: false, description: 'OS associada', isForeign: true, references: 'service_orders(id)' },
      { name: 'temperature_celsius', type: 'NUMERIC(4,1)', nullable: false, description: 'Temperatura no momento do voo' },
      { name: 'relative_humidity_pct', type: 'NUMERIC(4,1)', nullable: false, description: 'Umidade do ar (%)' },
      { name: 'wind_speed_kmh', type: 'NUMERIC(4,1)', nullable: false, description: 'Velocidade do vento (trava se > 15 km/h)' },
      { name: 'delta_t_celsius', type: 'NUMERIC(4,1)', nullable: false, description: 'Delta T psicrométrico (faixa ideal: 2°C a 8°C)' },
      { name: 'is_safe_to_spray', type: 'BOOLEAN', nullable: false, description: 'Status impeditivo de liberação' }
    ],
    indices: ['idx_weather_checks_os_time (service_order_id, recorded_at)']
  },
  {
    name: 'drone_flight_telemetry_logs',
    category: 'Telemetria',
    description: 'Processamento de logs brutos (DJI Agriculture / XAG) com cálculo de ha aplicados vs planejados e desgaste.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'ID da telemetria', isPrimary: true },
      { name: 'service_order_id', type: 'UUID', nullable: false, description: 'OS associada', isForeign: true, references: 'service_orders(id)' },
      { name: 'brand', type: 'ENUM (drone_brand_type)', nullable: false, description: 'DJI_AGRICULTURE, XAG, etc.' },
      { name: 'applied_hectares', type: 'NUMERIC(10,2)', nullable: false, description: 'Área calculada a partir da malha de bicos ativados' },
      { name: 'actual_flight_path', type: 'GEOMETRY(MultiLineString, 4326)', nullable: true, description: 'Trajetória real de voo geoespacial' }
    ],
    indices: ['idx_telemetry_os_id (service_order_id)', 'idx_flight_path USING GIST (actual_flight_path)']
  },
  {
    name: 'service_order_invoices & commission_settlements',
    category: 'Financeiro & Comissões',
    description: 'Faturamento automático da OS com aplicação da matriz e cálculo automático da comissão do piloto e ajudante.',
    columns: [
      { name: 'id', type: 'UUID', nullable: false, description: 'ID da fatura', isPrimary: true },
      { name: 'service_order_id', type: 'UUID', nullable: false, description: 'OS vinculada', isForeign: true, references: 'service_orders(id)' },
      { name: 'billed_hectares', type: 'NUMERIC(10,2)', nullable: false, description: 'Hectares auditados para faturamento' },
      { name: 'gross_total_amount', type: 'NUMERIC(10,2)', nullable: false, description: 'Valor total bruto da OS' },
      { name: 'pilot_commission_amount', type: 'NUMERIC(10,2)', nullable: false, description: 'Comissão calculada do piloto' },
      { name: 'assistant_commission_amount', type: 'NUMERIC(10,2)', nullable: false, description: 'Comissão calculada do ajudante' }
    ],
    indices: ['idx_invoice_service_order (service_order_id)', 'idx_commission_pilot (pilot_id)']
  }
];
