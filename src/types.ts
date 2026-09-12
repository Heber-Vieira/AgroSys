export type ThemeMode = 'light' | 'dark' | 'field';

export type UserRole = 'ADMIN' | 'USER' | 'PILOT' | 'ASSISTANT';

export interface RegisteredCompany {
  id: string; // e.g. 'ciclodrone', 'agro-clean-emerald'
  name: string; // 'Ciclodrone'
  tradeName?: string; // 'Ciclodrone Aviação Agrícola & Tecnologia'
  cnpj: string; // '41.890.123/0001-77'
  stateRegistration?: string;
  registryCreaMapa: string; // 'MAPA/SDA nº 24.890/2026 • ART CREA-SP 2026-1044'
  phone: string;
  email: string;
  cityState: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  surfaceLight?: string;
  surfaceDark?: string;
  cropFocus?: string;
  description?: string;
  createdAt?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface UserProfile {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  name: string;
  role: UserRole;
  roleLabel: string;
  email: string;
  avatarUrl?: string;
  photoUrl?: string; // URL ou Base64 da foto do perfil/colaborador
  badge: string;
  documentNumber?: string; // CPF / CNPJ
  phone?: string;
  licenseCode?: string; // DECEA/ANAC para piloto
  farmName?: string; // para Usuário/Produtor
  status?: 'ACTIVE' | 'INACTIVE';
  salaryBase?: number;
  hiredDate?: string;
  password?: string;
}

export interface ClientProducer {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  name: string;
  tradeName?: string;
  cpfCnpj: string;
  stateRegistration?: string;
  phone: string;
  email: string;
  cityState: string;
  farmNames: string[];
  totalHectaresRegistered: number;
  creditLimit: number;
  paymentTermsDays: number;
  status: 'ACTIVE' | 'BLOCKED' | 'PROSPECT';
  notes?: string;
}

export interface CompensationPolicy {
  pilotBaseSalary: number;
  pilotCommissionPerHa: number;
  pilotDailyGoalBonusHa: number;
  pilotDailyGoalBonusValue: number;
  pilotHazardPayPct: number; // % Periculosidade / Voo

  assistantBaseSalary: number;
  assistantCommissionPerHa: number;
  assistantNr31InsalubrityPct: number; // % Insalubridade NR-31
  assistantDailyGoalBonusValue: number;

  adminBaseSalary: number;
  techManagerBonusPerHa: number;
  overtimeHourRateMultiplier: number;
}

export interface WhiteLabelTheme {
  tenantId: string;
  companyName: string;
  tagline: string;
  logoUrl?: string;
  logoIconId?: string; // Built-in SVG logo ID
  primaryColor: string; // Hex e.g. #059669
  secondaryColor: string; // Hex e.g. #0f766e
  accentColor: string; // Hex e.g. #f59e0b
  surfaceLight: string; // Hex e.g. #FFFFFF
  surfaceDark: string; // Hex e.g. #0f172a
  borderRadius: string; // e.g. 0.75rem or 1rem
  fontFamily: string; // e.g. Plus Jakarta Sans
  contactPhone?: string;
  contactEmail?: string;
  registryCreaMapa?: string;
  brandStyle?: 'modern' | 'minimal' | 'organic' | 'technical';
  density?: 'comfortable' | 'compact';
}

export type OSStatus = 
  | 'SCHEDULED' 
  | 'IN_TRANSIT' 
  | 'OPERATING' 
  | 'PAUSED' 
  | 'COMPLETED' 
  | 'CANCELLED';

export type PricingModel = 'PER_HECTARE' | 'PER_FLIGHT_HOUR' | 'PER_LITER_MIX';

export type TerrainType = 'FLAT_GRAINS' | 'PASTURE' | 'STEEP_SLOPE' | 'ORCHARD_FRUIT' | 'WETLAND';

export interface FarmPlot {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  farmId: string;
  farmName: string;
  clientName: string;
  name: string;
  crop: 'Soja' | 'Milho' | 'Algodão' | 'Cana-de-açúcar' | 'Pastagem' | 'Café';
  season: string;
  phenologicalStage: string;
  hectares: number;
  terrain: TerrainType;
  slopeDegrees: number;
  coordinates: [number, number][]; // Polígono WGS84
  cityState?: string; // e.g. "Rio Verde - GO"
  lastAppliedDate?: string;
  healthIndexNDVI: number; // 0.1 a 0.9
}

export interface PricingMatrixRule {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  name: string;
  cropType: string;
  terrainType: TerrainType;
  pricingModel: PricingModel;
  baseRate: number; // e.g. 75.00 R$/ha
  difficultyMultiplier: number; // e.g. 1.15 for steep slope
  minHectaresThreshold: number; // minimum billable ha
  volumeDiscounts: { minHa: number; discountPercent: number }[];
}

export type DroneMaintenanceType = 
  | 'PREVENTIVE_REVISION' 
  | 'CORRECTIVE_MAINTENANCE' 
  | 'INSPECTION_CALIBRATION' 
  | 'BATTERY_SERVICE';

export type DroneMaintenanceStatus = 
  | 'SCHEDULED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'CANCELLED';

export interface DroneMaintenanceLog {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  droneId: string;
  droneModel: string;
  droneAnacPrefix: string;
  type: DroneMaintenanceType;
  title: string;
  description: string;
  performedBy: string; // e.g. "Oficina Autorizada DJI Agro", "Técnico Lucas Mendes"
  performedAt: string; // YYYY-MM-DD
  flightHoursAtService: number; // Flight hours when serviced
  costParts: number; // Cost of components/parts (R$)
  costLabor: number; // Labor cost (R$)
  totalCost: number; // Total cost (R$)
  partsReplaced?: string[]; // e.g. ["Hélice M2", "Bomba de Vazão Centrifuga", "Filtro de Malha"]
  status: DroneMaintenanceStatus;
  nextMaintenanceHoursTarget?: number; // e.g. 500h
  notes?: string;
  photoUrls?: string[]; // Photos of maintenance or invoice
  createdAt: string;
}

export type BatteryAlertPeriodUnit = 'DAYS' | 'MONTHS';

export interface BatteryAlertSettings {
  enabled: boolean;
  periodUnit: BatteryAlertPeriodUnit; // 'DAYS' (Dias) ou 'MONTHS' (Meses)
  periodValue: number; // Valor da periodicidade (ex: 15 dias, 1 mês)
  daysBetweenInspections?: number; // Dias recomendados entre inspeções físicas completas
  minHealthThresholdPct: number; // Alerta se Saúde da Bateria (SoH) < ex: 85%
  maxCellDeltaMv: number; // Alerta se Desbalanço de Células > ex: 30 mV
  soundEnabled: boolean; // Emissão de Alerta Sonoro ativada
  soundType: 'CHIME' | 'BEEP' | 'SIREN' | 'PULSE';
  soundVolume: number; // 0.1 a 1.0
  snoozeDays: number; // Tempo de adiamento do alerta em DIAS (ex: 1 dia, 3 dias, 7 dias)
  lastAlertTimestamp?: number; // timestamp em ms
  nextAlertTimestamp?: number; // timestamp em ms
  // Campos de compatibilidade com versões anteriores
  intervalMinutes?: number;
export type DroneBatteryStatus = 'READY' | 'CHARGING' | 'STORAGE' | 'ALERT' | 'DISCARDED';

export interface DroneBatteryAsset {
  id: string;
  droneId: string; // ID da aeronave vinculada
  companyId?: string; // Isolamento multi-empresa
  serialNumber: string; // Serial único da bateria (e.g. "DJI-DB1560-8812A")
  modelName: string; // Modelo (e.g. "DJI DB1560 Smart Battery (30.000 mAh)")
  capacityMah: number; // Capacidade nominal em mAh (e.g. 30000)
  voltageNominalV: number; // Tensão nominal (e.g. 52.22V / 14S)
  healthPct: number; // Estado de Saúde SoH % (e.g. 96%)
  cyclesCount: number; // Ciclos totais de carga (e.g. 142)
  chargePct: number; // Nível atual de carga SoC % (e.g. 95%)
  cellVoltageDeltaMv: number; // Desbalanço de células em mV (e.g. 12 mV)
  temperatureC: number; // Temperatura operacional em °C (e.g. 28°C)
  status: DroneBatteryStatus;
  purchaseDate?: string; // Data de aquisição (YYYY-MM-DD)
  warrantyExpiryDate?: string; // Vencimento da garantia (YYYY-MM-DD)
  lastInspectionDate?: string; // Data da última inspeção (YYYY-MM-DD)
  qrCodeOrNfcTag?: string; // Identificador QR / RFID / NFC
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AgriculturalDrone {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  brand: 'DJI_AGRICULTURE' | 'XAG' | 'EFT_JMR';
  modelName: string;
  serialNumber: string;
  anacPrefix: string;
  deceaRegistration: string;
  tankCapacityL: number;
  maxPayloadKg: number;
  totalFlightHours: number;
  batteryStatusPct: number;
  operationalStatus: 'READY' | 'FLYING' | 'MAINTENANCE' | 'CHARGING';
  nextMaintenanceHours: number;
  photoUrl?: string; // URL da foto do drone ou Base64 Data URL
  lastMaintenanceDate?: string;
  totalMaintenanceCost?: number;
  // Smart Battery Health Telemetry
  batterySerial?: string;
  batteryCycles?: number;
  batteryHealthPct?: number; // SoH (State of Health) e.g. 94%
  cellVoltageDeltaMv?: number; // Desbalanço de tensão entre células e.g. 12 mV
  batteryTemperatureC?: number; // Temperatura operacional e.g. 32°C
  lastBatteryInspectionDate?: string; // Data da última checagem de bateria YYYY-MM-DD
  batteries?: DroneBatteryAsset[]; // Banco de baterias do drone
}

export interface CrewPilot {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  name: string;
  cpf: string;
  phone: string;
  deceaLicense: string;
  cmaExpiration: string;
  commissionRatePerHa: number;
  totalHoursFlown: number;
  available: boolean;
  photoUrl?: string; // URL ou Base64 da foto do piloto
  avatarUrl?: string;
}

export interface CrewAssistant {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  name: string;
  cpf: string;
  phone: string;
  commissionRatePerHa: number;
  nr31Certified: boolean;
  available: boolean;
  photoUrl?: string; // URL ou Base64 da foto do auxiliar
  avatarUrl?: string;
}

export interface ServiceOrder {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  code: string;
  clientId: string;
  clientName: string;
  farmName: string;
  plotId: string;
  plotName: string;
  crop: string;
  targetHectares: number;
  sprayedHectares: number;
  targetPestOrGoal: string;
  status: OSStatus;
  scheduledDate: string;
  sprayRateLHa: number;
  droneId: string;
  droneModel: string;
  droneAnac: string;
  dronePhotoUrl?: string;
  pilotId: string;
  pilotName: string;
  pilotPhotoUrl?: string;
  assistantId: string;
  assistantName: string;
  assistantPhotoUrl?: string;
  pricingModel: PricingModel;
  baseRatePerHa: number;
  totalGrossValue: number;
  pilotCommission: number;
  assistantCommission: number;
  weatherSafeApproved: boolean;
  mixPreparedApproved: boolean;
  digitalSigned: boolean;
  // Dynamic scheduling extensions
  startTime?: string; // HH:mm (e.g. '07:00')
  endTime?: string;   // HH:mm (e.g. '09:30')
  cityState?: string; // Reference location for weather validation
  notes?: string;
  weatherFeasibility?: {
    status: string;
    score: number;
    deltaT: number;
    windSpeed: number;
    precipitationProb: number;
    isAllowed: boolean;
    recommendation: string;
    checkedAt: string;
  };
  weatherReadings?: ClimateTelemetry[];
  weatherAlertSettings?: {
    enabled: boolean;
    periodicitySeconds: number; // 0 means inhibited/disabled, or use a value in seconds
    soundEnabled: boolean;
    soundType: 'CHIME' | 'BEEP' | 'SIREN' | 'PULSE';
    soundVolume: number;
  };
}

export interface ScheduleConflict {
  id: string;
  type: 'PILOT' | 'DRONE' | 'PLOT';
  severity: 'CRITICAL_BLOCK' | 'WARNING';
  resourceId: string;
  resourceName: string;
  conflictingOrderCode: string;
  conflictingOrderId: string;
  conflictingFarmName: string;
  conflictingPlotName: string;
  conflictingTimeRange: string;
  description: string;
}

export interface SuggestedTimeSlot {
  startTime: string;
  endTime: string;
  date: string;
  label: string;
  isWeatherSafe: boolean;
  deltaT: number;
  windSpeed: number;
  reason: string;
}

export interface ClimateTelemetry {
  timestamp: string;
  temperatureC: number;
  relativeHumidityPct: number;
  windSpeedKmh: number;
  windDirectionDeg: number;
  deltaT: number; // Delta T calculated (Temp - WetBulb or psychrometric approx)
  isSafeForSpraying: boolean;
  warnings: string[];
  isAutomatic?: boolean;
}

export interface SprayProduct {
  id: string;
  name: string;
  category: 'HERBICIDE' | 'FUNGICIDE' | 'INSECTICIDE' | 'ADJUVANT' | 'FOLIAR_FERT' | 'BIOLOGICAL';
  dosePerHa: number;
  doseUnit: 'L/ha' | 'kg/ha' | 'mL/ha' | 'g/ha';
  mixOrder: number; // 1: Condicionador/Água, 2: WP/WG (Sólidos), 3: SC/OD (Suspensões), 4: EC/SL (Emulsionáveis), 5: Adjuvantes/Óleos
  chemicalClass: string;
  packageUnitsEmpty?: number;
  costPerUnit?: number; // R$/L or R$/kg
  activeIngredient?: string;
  targetPest?: string;
}

export interface SprayMixConfig {
  waterVolumeLHa: number;
  tankCapacityL: number;
  totalHectares: number;
  totalWaterNeededL: number;
  numberOfTanks: number;
  products: SprayProduct[];
  mandatoryPPE: string[];
  emptyContainersHandledCount: number;
  rinsedTripleChecked: boolean;
}

export interface DroneTelemetryLog {
  brand: 'DJI_AGRICULTURE' | 'XAG' | 'EFT_JMR';
  logFileName: string;
  plannedHectares: number;
  appliedHectares: number;
  overlapCoveragePct: number;
  flightTimeMinutes: number;
  batteryCyclesConsumed: number;
  effectiveFlowRateLMin: number;
  avgAltitudeM: number;
  avgSpeedMs: number;
}

export interface FinancialEntry {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  osCode: string;
  clientOrBeneficiary: string;
  description: string;
  type: 'RECEIVABLE' | 'PAYABLE';
  category: 'FATURAMENTO_OS' | 'COMISSAO_PILOTO' | 'COMISSAO_AUXILIAR' | 'MANUTENCAO_DRONE' | 'INSUMOS';
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

export interface TourStep {
  stepIndex: number;
  id: string;
  title: string;
  role: 'PILOT' | 'DISPATCHER' | 'FINANCIAL_ADMIN' | 'ALL';
  targetElementId: string;
  description: string;
  actionRequired: 'READ' | 'CLICK' | 'INPUT_CHECK' | 'APPROVE';
  badge: string;
  tipText: string;
}

export type QuotationStatus = 'DRAFT' | 'SENT' | 'APPROVED' | 'REJECTED' | 'CONVERTED';

export interface SprayQuotationItem {
  id: string;
  description: string;
  hectares: number;
  ratePerHa: number;
  subtotal: number;
  crop?: string;
  terrain?: TerrainType;
}

export interface SprayQuotationProduct {
  id: string;
  productName: string;
  dosePerHa: number;
  doseUnit: string;
  totalQuantityNeeded: number;
  unitPrice: number;
  totalCost: number;
  suppliedByCompany: boolean;
}

export interface SprayQuotation {
  id: string;
  companyId?: string; // Multi-tenant company isolation
  code: string; // e.g. "ORC-2026-001"
  clientId: string;
  clientName: string;
  clientCpfCnpj?: string;
  clientPhone?: string;
  clientEmail?: string;
  farmName: string;
  cityState: string;
  crop: string;
  targetPestOrGoal: string;
  totalHectares: number;
  droneModelSuggested: string;
  pricingModel: PricingModel;
  baseRatePerHa: number;
  subtotalServices: number;
  subtotalProducts: number;
  displacementFee: number;
  discountValue: number;
  discountPercent: number;
  totalValue: number;
  paymentTerms: string;
  validUntil: string;
  status: QuotationStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  convertedOSCode?: string;
  items?: SprayQuotationItem[];
  products?: SprayQuotationProduct[];
}

export type AppViewMode = 
  | 'hub'
  | 'dashboard' 
  | 'orders' 
  | 'quotations'
  | 'reports'
  | 'schedule' 
  | 'gis' 
  | 'spray-mix' 
  | 'weather' 
  | 'telemetry' 
  | 'pricing' 
  | 'fleet' 
  | 'financial' 
  | 'docs' 
  | 'database' 
  | 'design-system' 
  | 'virtual-tour'
  | 'help'
  | 'branding'
  | 'admin-management';

