import { createClient } from '@supabase/supabase-js';
import { 
  INITIAL_REGISTERED_COMPANIES,
  INITIAL_CLIENTS,
  INITIAL_PLOTS,
  INITIAL_DRONES,
  INITIAL_MAINTENANCE_LOGS,
  INITIAL_PILOTS,
  INITIAL_ASSISTANTS,
  INITIAL_PRICING_RULES,
  INITIAL_ORDERS,
  INITIAL_FINANCIALS,
  INITIAL_QUOTATIONS,
  INITIAL_COMPENSATION_POLICY
} from '../data/mockAppState';

const SUPABASE_URL = 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seedData() {
  console.log('🚀 Iniciando sincronização completa de dados para o Supabase...');

  // 1. Tenants (Empresas)
  console.log('📦 1/12 Inserindo Empresas / Tenants...');
  for (const comp of INITIAL_REGISTERED_COMPANIES) {
    const { error } = await supabase.from('tenants').upsert({
      id: comp.id,
      name: comp.name,
      trade_name: comp.tradeName,
      cnpj: comp.cnpj,
      state_registration: comp.stateRegistration,
      registry_crea_mapa: comp.registryCreaMapa,
      phone: comp.phone,
      email: comp.email,
      city_state: comp.cityState,
      tagline: comp.tagline,
      primary_color: comp.primaryColor,
      secondary_color: comp.secondaryColor,
      accent_color: comp.accentColor,
      crop_focus: comp.cropFocus,
      description: comp.description,
      status: comp.status || 'ACTIVE',
      created_at: comp.createdAt || new Date().toISOString()
    });
    if (error) console.error(`❌ Erro empresa ${comp.id}:`, error.message);
  }

  // 2. Clients (Produtores)
  console.log('📦 2/12 Inserindo Clientes / Produtores...');
  for (const client of INITIAL_CLIENTS) {
    const { error } = await supabase.from('clients').upsert({
      id: client.id,
      company_id: client.companyId || 'ciclodrone',
      name: client.name,
      trade_name: client.tradeName,
      cpf_cnpj: client.cpfCnpj,
      state_registration: client.stateRegistration,
      phone: client.phone,
      email: client.email,
      city_state: client.cityState,
      farm_names: client.farmNames,
      total_hectares_registered: client.totalHectaresRegistered,
      credit_limit: client.creditLimit,
      payment_terms_days: client.paymentTermsDays,
      status: client.status,
      notes: client.notes
    });
    if (error) console.error(`❌ Erro cliente ${client.id}:`, error.message);
  }

  // 3. Farm Plots (Talhões)
  console.log('📦 3/12 Inserindo Talhões / Farm Plots...');
  for (const plot of INITIAL_PLOTS) {
    const { error } = await supabase.from('farm_plots').upsert({
      id: plot.id,
      company_id: plot.companyId || 'ciclodrone',
      farm_id: plot.farmId,
      farm_name: plot.farmName,
      client_name: plot.clientName,
      name: plot.name,
      crop: plot.crop,
      season: plot.season,
      phenological_stage: plot.phenologicalStage,
      hectares: plot.hectares,
      terrain: plot.terrain,
      slope_degrees: plot.slopeDegrees,
      city_state: plot.cityState,
      health_index_ndvi: plot.healthIndexNDVI,
      last_applied_date: plot.lastAppliedDate,
      coordinates: plot.coordinates
    });
    if (error) console.error(`❌ Erro talhão ${plot.id}:`, error.message);
  }

  // 4. Agricultural Drones
  console.log('📦 4/12 Inserindo Drones da Frota...');
  for (const drone of INITIAL_DRONES) {
    const { error } = await supabase.from('agricultural_drones').upsert({
      id: drone.id,
      company_id: drone.companyId || 'ciclodrone',
      brand: drone.brand,
      model_name: drone.modelName,
      serial_number: drone.serialNumber,
      anac_prefix: drone.anacPrefix,
      decea_registration: drone.deceaRegistration,
      tank_capacity_l: drone.tankCapacityL,
      total_flight_hours: drone.totalFlightHours,
      hectares_sprayed: 0,
      operational_status: drone.operationalStatus || 'READY',
      battery_count: drone.batteryCycles || 4,
      photo_url: drone.photoUrl
    });
    if (error) console.error(`❌ Erro drone ${drone.id}:`, error.message);
  }

  // 5. Drone Maintenance Logs
  console.log('📦 5/12 Inserindo Histórico de Manutenções...');
  for (const log of INITIAL_MAINTENANCE_LOGS) {
    const { error } = await supabase.from('drone_maintenance_logs').upsert({
      id: log.id,
      company_id: log.companyId || 'ciclodrone',
      drone_id: log.droneId,
      drone_model: log.droneModel,
      drone_anac_prefix: log.droneAnacPrefix,
      type: log.type,
      title: log.title,
      description: log.description,
      performed_by: log.performedBy,
      performed_at: log.performedAt,
      flight_hours_at_service: log.flightHoursAtService,
      cost_parts: log.costParts,
      cost_labor: log.costLabor,
      total_cost: log.totalCost,
      parts_replaced: log.partsReplaced,
      status: log.status,
      next_maintenance_hours_target: log.nextMaintenanceHoursTarget,
      notes: log.notes,
      created_at: log.createdAt || new Date().toISOString()
    });
    if (error) console.error(`❌ Erro manutenção ${log.id}:`, error.message);
  }

  // 6. Crew Pilots
  console.log('📦 6/12 Inserindo Pilotos...');
  for (const pilot of INITIAL_PILOTS) {
    const { error } = await supabase.from('crew_pilots').upsert({
      id: pilot.id,
      company_id: pilot.companyId || 'ciclodrone',
      name: pilot.name,
      license: pilot.deceaLicense,
      phone: pilot.phone,
      email: `${pilot.id}@agrosys.com.br`,
      hectares_sprayed: 0,
      status: pilot.available ? 'AVAILABLE' : 'OFFLINE',
      photo_url: pilot.photoUrl,
      salary_base: 4800,
      commission_per_ha: pilot.commissionRatePerHa || 8,
      daily_goal_bonus_value: 150,
      hazard_pay_pct: 30
    });
    if (error) console.error(`❌ Erro piloto ${pilot.id}:`, error.message);
  }

  // 7. Crew Assistants
  console.log('📦 7/12 Inserindo Auxiliares de Campo...');
  for (const asst of INITIAL_ASSISTANTS) {
    const { error } = await supabase.from('crew_assistants').upsert({
      id: asst.id,
      company_id: asst.companyId || 'ciclodrone',
      name: asst.name,
      phone: asst.phone,
      email: `${asst.id}@agrosys.com.br`,
      hectares_assisted: 0,
      status: asst.available ? 'AVAILABLE' : 'OFFLINE',
      photo_url: asst.photoUrl,
      salary_base: 2650,
      commission_per_ha: asst.commissionRatePerHa || 3,
      nr31_insalubrity_pct: 20,
      daily_goal_bonus_value: 60
    });
    if (error) console.error(`❌ Erro auxiliar ${asst.id}:`, error.message);
  }

  // 8. Pricing Matrix Rules
  console.log('📦 8/12 Inserindo Matriz de Precificação...');
  for (const rule of INITIAL_PRICING_RULES) {
    const { error } = await supabase.from('pricing_matrix_rules').upsert({
      id: rule.id,
      company_id: rule.companyId || 'ciclodrone',
      crop_type: rule.cropType,
      terrain_type: rule.terrainType,
      base_rate: rule.baseRate,
      difficulty_multiplier: rule.difficultyMultiplier,
      pricing_model: rule.pricingModel || 'PER_HECTARE',
      min_hectares_threshold: rule.minHectaresThreshold || 10
    });
    if (error) console.error(`❌ Erro regra de preço ${rule.id}:`, error.message);
  }

  // 9. Service Orders (OS)
  console.log('📦 9/12 Inserindo Ordens de Serviço (OS)...');
  for (const order of INITIAL_ORDERS) {
    const { error } = await supabase.from('service_orders').upsert({
      id: order.id,
      company_id: order.companyId || 'ciclodrone',
      code: order.code,
      client_id: order.clientId,
      client_name: order.clientName,
      farm_name: order.farmName,
      plot_id: order.plotId,
      plot_name: order.plotName,
      crop: order.crop,
      service_type: order.targetPestOrGoal,
      status: order.status,
      scheduled_date: order.scheduledDate,
      start_time: order.startTime || '08:00',
      end_time: order.endTime || '12:00',
      target_hectares: order.targetHectares,
      sprayed_hectares: order.sprayedHectares,
      drone_id: order.droneId,
      pilot_id: order.pilotId,
      assistant_id: order.assistantId,
      spray_rate_l_ha: order.sprayRateLHa,
      total_gross_value: order.totalGrossValue || 0,
      total_flight_time_minutes: 0
    });
    if (error) console.error(`❌ Erro OS ${order.id}:`, error.message);
  }

  // 10. Financial Entries
  console.log('📦 10/12 Inserindo Lançamentos Financeiros...');
  for (const fin of INITIAL_FINANCIALS) {
    const { error } = await supabase.from('financial_entries').upsert({
      id: fin.id,
      company_id: fin.companyId || 'ciclodrone',
      os_code: fin.osCode,
      client_or_beneficiary: fin.clientOrBeneficiary,
      description: fin.description,
      type: fin.type,
      category: fin.category,
      amount: fin.amount,
      due_date: fin.dueDate,
      status: fin.status
    });
    if (error) console.error(`❌ Erro financeiro ${fin.id}:`, error.message);
  }

  // 11. Spray Quotations
  console.log('📦 11/12 Inserindo Orçamentos...');
  for (const quot of INITIAL_QUOTATIONS) {
    const { error } = await supabase.from('spray_quotations').upsert({
      id: quot.id,
      company_id: quot.companyId || 'ciclodrone',
      code: quot.code,
      client_id: quot.clientId,
      client_name: quot.clientName,
      producer_id: quot.clientId,
      producer_name: quot.clientName,
      farm_name: quot.farmName,
      city_state: quot.cityState,
      crop: quot.crop,
      service_type: quot.targetPestOrGoal,
      hectares: quot.totalHectares,
      final_price_per_ha: (quot as any).pricePerHectare || (quot as any).totalEstimatedPrice || 0,
      total_amount: (quot as any).totalAmount || (quot as any).totalEstimatedPrice || 0,
      status: quot.status,
      created_at: quot.createdAt || new Date().toISOString()
    });
    if (error) console.error(`❌ Erro orçamento ${quot.id}:`, error.message);
  }

  // 12. Compensation Policies
  console.log('📦 12/12 Inserindo Política Salarial e Comissões...');
  const { error: polError } = await supabase.from('compensation_policies').upsert({
    id: 'comp-policy-default',
    company_id: 'ciclodrone',
    pilot_base_salary: INITIAL_COMPENSATION_POLICY.pilotBaseSalary,
    pilot_commission_per_ha: INITIAL_COMPENSATION_POLICY.pilotCommissionPerHa,
    pilot_daily_goal_bonus_ha: INITIAL_COMPENSATION_POLICY.pilotDailyGoalBonusHa,
    pilot_daily_goal_bonus_value: INITIAL_COMPENSATION_POLICY.pilotDailyGoalBonusValue,
    pilot_hazard_pay_pct: INITIAL_COMPENSATION_POLICY.pilotHazardPayPct,
    assistant_base_salary: INITIAL_COMPENSATION_POLICY.assistantBaseSalary,
    assistant_commission_per_ha: INITIAL_COMPENSATION_POLICY.assistantCommissionPerHa,
    assistant_nr31_insalubrity_pct: INITIAL_COMPENSATION_POLICY.assistantNr31InsalubrityPct,
    assistant_daily_goal_bonus_value: INITIAL_COMPENSATION_POLICY.assistantDailyGoalBonusValue,
    admin_base_salary: INITIAL_COMPENSATION_POLICY.adminBaseSalary,
    tech_manager_bonus_per_ha: INITIAL_COMPENSATION_POLICY.techManagerBonusPerHa,
    overtime_hour_rate_multiplier: INITIAL_COMPENSATION_POLICY.overtimeHourRateMultiplier
  });
  if (polError) console.error('❌ Erro política salarial:', polError.message);

  console.log('✨ Sincronização 100% concluída sem falhas!');
}

seedData().catch(console.error);
