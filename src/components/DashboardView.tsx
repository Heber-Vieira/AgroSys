import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserProfile, 
  ServiceOrder, 
  FarmPlot, 
  AgriculturalDrone, 
  FinancialEntry,
  DroneBatteryAsset,
  ClientProducer,
  RegisteredCompany,
  CrewPilot,
  CrewAssistant,
  AppViewMode
} from '../types';
import { 
  Plane, 
  MapPin, 
  Droplets, 
  Wind, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  ShieldCheck, 
  BatteryCharging, 
  ArrowRight,
  Sparkles,
  Plus,
  HelpCircle,
  BookOpen,
  Compass,
  Calendar,
  Printer,
  Upload,
  Sliders,
  Users,
  Building2,
  PieChart,
  Activity,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Award,
  BarChart3,
  Filter,
  Check,
  Zap,
  Lock,
  Unlock,
  Radio,
  RefreshCw,
  Cpu,
  Power
} from 'lucide-react';
import { formatBRL, formatDecimal } from '../utils/formatters';
import { isMasterUser, isCompanyAdmin } from '../utils/userPermissions';
import { isAIAnalysisActive, setAIAnalysisActive, AI_ANALYSIS_UPDATED_EVENT } from '../services/aiSettingsService';
import { EmployeeAccessControlModal } from './EmployeeAccessControlModal';
import { UserAvatar } from './UserAvatar';
import { BrandLogo } from './BrandLogo';

interface DashboardViewProps {
  currentUser: UserProfile;
  orders?: ServiceOrder[];
  plots?: FarmPlot[];
  drones?: AgriculturalDrone[];
  batteries?: DroneBatteryAsset[];
  clients?: ClientProducer[];
  pilots?: CrewPilot[];
  assistants?: CrewAssistant[];
  financials?: FinancialEntry[];
  allUsers?: UserProfile[];
  onSaveUserPermissions?: (userId: string, allowedViews: AppViewMode[]) => void;
  registeredCompanies?: RegisteredCompany[];
  activeCompanyId?: string;
  onNavigate: (view: string) => void;
  onOpenNewOSModal?: () => void;
  onOpenNewOS?: () => void;
  onStartLiveTour?: () => void;
  onOpenReportModal?: (orderId?: string) => void;
}

type PeriodFilter = '7D' | '30D' | '90D' | 'SEASON' | 'ALL';
type DashboardTab = 'overview' | 'clients' | 'spray' | 'crew' | 'fleet_batteries' | 'financial' | 'ai_insights';

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  orders = [],
  plots = [],
  drones = [],
  batteries = [],
  clients = [],
  pilots = [],
  assistants = [],
  financials = [],
  allUsers = [],
  onSaveUserPermissions = (_u: string, _v: AppViewMode[]) => {},
  registeredCompanies = [],
  activeCompanyId = 'ALL',
  onNavigate,
  onOpenNewOSModal,
  onOpenNewOS,
  onStartLiveTour,
  onOpenReportModal,
}) => {
  const isMaster = isMasterUser(currentUser);
  const isCompanyAdministrator = isCompanyAdmin(currentUser);
  const isExecutive = isMaster || isCompanyAdministrator;

  const [period, setPeriod] = useState<PeriodFilter>('SEASON');
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>(activeCompanyId || 'ALL');
  
  // AI Analysis Master Activation State
  const [aiEnabled, setAiEnabled] = useState<boolean>(() => isAIAnalysisActive());
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);
  const [toastFeedback, setToastFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleAiToggle = (e: Event) => {
      const custom = e as CustomEvent<boolean>;
      setAiEnabled(custom.detail);
    };
    window.addEventListener(AI_ANALYSIS_UPDATED_EVENT, handleAiToggle);
    return () => window.removeEventListener(AI_ANALYSIS_UPDATED_EVENT, handleAiToggle);
  }, []);

  const showToast = (msg: string) => {
    setToastFeedback(msg);
    setTimeout(() => setToastFeedback(null), 3500);
  };

  const handleToggleAI = () => {
    if (!isMaster) {
      showToast('Apenas Administradores Masters podem ativar ou desativar a análise por IA.');
      return;
    }
    const nextState = !aiEnabled;
    const res = setAIAnalysisActive(nextState, currentUser);
    if (res.success) {
      setAiEnabled(nextState);
      showToast(res.message);
    } else {
      showToast(res.message);
    }
  };

  // 1. DATA FILTERING BY COMPANY (Multi-tenant isolation)
  const scopedOrders = useMemo(() => {
    let list = orders;
    if (!isMaster) {
      const company = currentUser.companyId || 'ciclodrone';
      list = list.filter(o => (o.companyId || 'ciclodrone') === company);
    } else if (selectedCompanyFilter !== 'ALL') {
      list = list.filter(o => (o.companyId || 'ciclodrone') === selectedCompanyFilter);
    }

    // Role specific narrowing for non-admins
    if (currentUser.role === 'USER') {
      return list.filter(o => o.clientId === currentUser.id || o.clientName === currentUser.name);
    }
    if (currentUser.role === 'PILOT') {
      return list.filter(o => o.pilotId === currentUser.id || o.pilotName.includes(currentUser.name.split(' ')[0]));
    }
    if (currentUser.role === 'ASSISTANT') {
      return list.filter(o => o.assistantId === currentUser.id || o.assistantName.includes(currentUser.name.split(' ')[0]));
    }
    return list;
  }, [orders, isMaster, selectedCompanyFilter, currentUser]);

  const scopedPlots = useMemo(() => {
    if (!isMaster) {
      const company = currentUser.companyId || 'ciclodrone';
      return plots.filter(p => (p.companyId || 'ciclodrone') === company);
    }
    if (selectedCompanyFilter !== 'ALL') {
      return plots.filter(p => (p.companyId || 'ciclodrone') === selectedCompanyFilter);
    }
    return plots;
  }, [plots, isMaster, selectedCompanyFilter, currentUser]);

  const scopedDrones = useMemo(() => {
    if (!isMaster) {
      const company = currentUser.companyId || 'ciclodrone';
      return drones.filter(d => (d.companyId || 'ciclodrone') === company);
    }
    if (selectedCompanyFilter !== 'ALL') {
      return drones.filter(d => (d.companyId || 'ciclodrone') === selectedCompanyFilter);
    }
    return drones;
  }, [drones, isMaster, selectedCompanyFilter, currentUser]);

  const scopedClients = useMemo(() => {
    if (!isMaster) {
      const company = currentUser.companyId || 'ciclodrone';
      return clients.filter(c => (c.companyId || 'ciclodrone') === company);
    }
    if (selectedCompanyFilter !== 'ALL') {
      return clients.filter(c => (c.companyId || 'ciclodrone') === selectedCompanyFilter);
    }
    return clients;
  }, [clients, isMaster, selectedCompanyFilter, currentUser]);

  // 2. KEY METRICS CALCULATIONS
  const totalAppliedHa = useMemo(() => {
    return scopedOrders.reduce((acc, o) => acc + (o.sprayedHectares || 0), 0);
  }, [scopedOrders]);

  const totalGrossRevenue = useMemo(() => {
    return scopedOrders.reduce((acc, o) => acc + (o.totalGrossValue || 0), 0);
  }, [scopedOrders]);

  const totalCommissionsPaid = useMemo(() => {
    return scopedOrders.reduce((acc, o) => acc + (o.pilotCommission || 0) + (o.assistantCommission || 0), 0);
  }, [scopedOrders]);

  const completedOrdersCount = scopedOrders.filter(o => o.status === 'COMPLETED').length;
  const operatingOrdersCount = scopedOrders.filter(o => o.status === 'OPERATING' || o.status === 'IN_TRANSIT').length;
  const scheduledOrdersCount = scopedOrders.filter(o => o.status === 'SCHEDULED').length;

  const totalFlightHours = scopedDrones.reduce((acc, d) => acc + (d.flightHours || 0), 0);
  const avgTicketPerHa = totalAppliedHa > 0 ? totalGrossRevenue / totalAppliedHa : 75;

  // Battery health aggregations
  const batteryStats = useMemo(() => {
    const total = batteries.length || 1;
    const good = batteries.filter(b => b.healthStatus === 'GOOD' || b.sohPercent >= 85).length;
    const warning = batteries.filter(b => b.healthStatus === 'WARNING' || (b.sohPercent < 85 && b.sohPercent >= 70)).length;
    const critical = batteries.filter(b => b.healthStatus === 'CRITICAL' || b.sohPercent < 70).length;
    const avgSoh = Math.round(batteries.reduce((acc, b) => acc + (b.sohPercent || 90), 0) / total);
    return { total: batteries.length, good, warning, critical, avgSoh };
  }, [batteries]);

  // Crop distribution
  const cropStats = useMemo(() => {
    const counts: Record<string, number> = {};
    scopedOrders.forEach(o => {
      const crop = o.crop || 'Soja';
      counts[crop] = (counts[crop] || 0) + (o.sprayedHectares || o.targetHectares || 50);
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [scopedOrders]);

  // Top clients by area
  const topClients = useMemo(() => {
    const map: Record<string, { name: string; ha: number; revenue: number; ordersCount: number }> = {};
    scopedOrders.forEach(o => {
      const name = o.clientName || 'Produtor Rural';
      if (!map[name]) map[name] = { name, ha: 0, revenue: 0, ordersCount: 0 };
      map[name].ha += o.sprayedHectares || o.targetHectares || 0;
      map[name].revenue += o.totalGrossValue || 0;
      map[name].ordersCount += 1;
    });
    return Object.values(map).sort((a, b) => b.ha - a.ha).slice(0, 5);
  }, [scopedOrders]);

  // Pilot leaderboard
  const pilotLeaderboard = useMemo(() => {
    const map: Record<string, { name: string; ha: number; commissions: number; orders: number }> = {};
    scopedOrders.forEach(o => {
      const pName = o.pilotName || 'Piloto Principal';
      if (!map[pName]) map[pName] = { name: pName, ha: 0, commissions: 0, orders: 0 };
      map[pName].ha += o.sprayedHectares || 0;
      map[pName].commissions += o.pilotCommission || 0;
      map[pName].orders += 1;
    });
    return Object.values(map).sort((a, b) => b.ha - a.ha);
  }, [scopedOrders]);

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastFeedback && (
        <div className="fixed top-16 right-4 z-50 px-4 py-2.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-emerald-500/50 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastFeedback}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-xs flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                {currentUser.roleLabel}
              </span>

              {isMaster && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  👑 Super Master • Visão Consolidada
                </span>
              )}

              <span className="text-xs text-slate-400">
                Safra 2025/2026 • Portão Climático: <strong className="text-emerald-400">Delta T 4.8°C (Ideal)</strong>
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight">
              Painel Geral Executivo & Inteligência Operacional (BI)
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
              Consolidação analítica de clientes, pulverizações, drones, saúde de baterias, faturamento e insights prescritivos por IA.
            </p>
          </div>

          {/* Master Company Filter & Period Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Master Company Selector */}
            {isMaster && registeredCompanies.length > 0 && (
              <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={selectedCompanyFilter}
                  onChange={(e) => setSelectedCompanyFilter(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-slate-900 text-white">🌐 Todas as Empresas (Global)</option>
                  {registeredCompanies.map(c => (
                    <option key={c.id} value={c.id} className="bg-slate-900 text-white">{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Period Selector */}
            <div className="bg-slate-950/80 border border-slate-700 p-1 rounded-xl flex items-center text-xs">
              {(['7D', '30D', '90D', 'SEASON', 'ALL'] as PeriodFilter[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    period === p 
                      ? 'bg-emerald-500 text-slate-950 shadow-xs' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p === '7D' ? '7 Dias' : p === '30D' ? '30 Dias' : p === '90D' ? '90 Dias' : p === 'SEASON' ? 'Safra' : 'Tudo'}
                </button>
              ))}
            </div>

            {/* Quick Access Management Button for Admins */}
            {isExecutive && (
              <button
                onClick={() => setIsAccessModalOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                title="Configurar permissões e acessos dos funcionários da empresa"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Gestão de Acessos</span>
              </button>
            )}
          </div>
        </div>

        {/* Master AI Activation Switch Ribbon */}
        {isMaster ? (
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Cpu className={`w-4 h-4 ${aiEnabled ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="font-bold text-slate-200">
                Módulo de Análise Preditiva & Recomendações por IA:
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                aiEnabled ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}>
                {aiEnabled ? '🟢 Ativada' : '🔴 Desativada'}
              </span>
            </div>

            <button
              onClick={handleToggleAI}
              className={`px-3 py-1 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                aiEnabled 
                  ? 'bg-rose-600/30 text-rose-300 hover:bg-rose-600/50 border border-rose-500/40' 
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{aiEnabled ? 'Desativar Análise por IA' : 'Ativar Análise por IA'}</span>
            </button>
          </div>
        ) : (
          aiEnabled && (
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Análise Inteligente por IA ativa e monitorando a performance agronômica da empresa.</span>
            </div>
          )
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI CARDS GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Hectares Totais */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Hectares Aplicados</span>
            <Droplets className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {formatDecimal(totalAppliedHa, 1)} <span className="text-xs font-normal text-slate-400">ha</span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            <ArrowUpRight className="w-3 h-3" />
            <span>+18.4% vs meta</span>
          </div>
        </div>

        {/* Faturamento Bruto */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Faturamento Bruto</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white truncate">
            {formatBRL(totalGrossRevenue)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            Ticket médio: <strong className="text-slate-800 dark:text-slate-200">{formatBRL(avgTicketPerHa)}/ha</strong>
          </div>
        </div>

        {/* Ordens Concluídas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Missões Concluídas</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {completedOrdersCount} <span className="text-xs font-normal text-slate-400">de {scopedOrders.length}</span>
          </div>
          <div className="mt-1 text-[11px] text-blue-600 dark:text-blue-400 font-bold">
            {operatingOrdersCount} em voo ativo
          </div>
        </div>

        {/* Clientes Ativos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Clientes & Fazendas</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {scopedClients.length} <span className="text-xs font-normal text-slate-400">produtores</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium truncate">
            {scopedPlots.length} talhões mapeados
          </div>
        </div>

        {/* Frota & Horas de Voo */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Horas de Voo Frota</span>
            <Plane className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {totalFlightHours} <span className="text-xs font-normal text-slate-400">horas</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 font-medium">
            {scopedDrones.length} drones em operação
          </div>
        </div>

        {/* Saúde das Baterias */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1 text-xs">
            <span>Saúde Baterias (SoH)</span>
            <BatteryCharging className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            {batteryStats.avgSoh}%
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
            {batteryStats.good} boas • {batteryStats.warning} atenção
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BI NAVIGATION TABS */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Visão Geral Executiva</span>
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'clients'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Clientes & Retenção ({scopedClients.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('spray')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'spray'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Droplets className="w-3.5 h-3.5" />
          <span>Pulverizações por Cultura</span>
        </button>

        <button
          onClick={() => setActiveTab('crew')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'crew'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Desempenho da Equipe & Comissões</span>
        </button>

        <button
          onClick={() => setActiveTab('fleet_batteries')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'fleet_batteries'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BatteryCharging className="w-3.5 h-3.5" />
          <span>Drones & Smart Batteries</span>
        </button>

        <button
          onClick={() => setActiveTab('financial')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'financial'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Inteligência Financeira</span>
        </button>

        {aiEnabled && (
          <button
            onClick={() => setActiveTab('ai_insights')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
              activeTab === 'ai_insights'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Recomendações por IA</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. TAB CONTENTS */}
      {/* ========================================================================= */}

      {/* TAB 1: VISÃO GERAL EXECUTIVA */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left 2 Cols: Operations & Top Crops */}
          <div className="lg:col-span-2 space-y-4">
            {/* Crops Distribution Bar Visualizer */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Distribuição de Pulverização por Cultura (ha)
                  </h3>
                  <p className="text-xs text-slate-500">Volume acumulado aplicado na safra</p>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {formatDecimal(totalAppliedHa, 0)} ha totais
                </span>
              </div>

              <div className="space-y-3">
                {cropStats.map(([crop, ha]) => {
                  const pct = totalAppliedHa > 0 ? Math.round((ha / totalAppliedHa) * 100) : 20;
                  return (
                    <div key={crop} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          {crop}
                        </span>
                        <span className="font-mono">{formatDecimal(ha, 0)} ha ({pct}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Stream */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-black text-slate-900 dark:text-white">
                  Últimas Ordens de Serviço & Status em Campo
                </h3>
                <button
                  onClick={() => onNavigate('orders')}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Ver Todas
                </button>
              </div>

              <div className="space-y-2">
                {scopedOrders.slice(0, 4).map(o => (
                  <div key={o.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700/70 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{o.clientName}</div>
                      <div className="text-[11px] text-slate-500">{o.farmName} • {o.crop} ({o.sprayedHectares || o.targetHectares} ha)</div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                        o.status === 'OPERATING' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                        'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {o.status}
                      </span>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatBRL(o.totalGrossValue || 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Smart AI Recommendations & Key Highlights */}
          <div className="space-y-4">
            {/* AI Prescriptive Insight Card */}
            {aiEnabled && (
              <div className="bg-gradient-to-br from-emerald-900/40 via-slate-900 to-teal-950/40 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Recomendação Prescritiva IA</span>
                </div>
                <h4 className="text-sm font-black text-white mb-1">
                  Janela Climática Otimizada
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  As previsões para amanhã indicam Delta T estável (4.5°C a 6.2°C) entre 06:00 e 09:30. Recomendamos priorizar a aplicação dos 320 ha de fungicida no cliente <strong>Fazenda Santa Terezinha</strong> para evitar perdas por evaporação.
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => setActiveTab('ai_insights')}
                    className="text-xs text-emerald-400 font-bold hover:underline flex items-center gap-1"
                  >
                    <span>Ver todos os insights de IA</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Top Clients Mini Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
                Top Clientes por Área Pulverizada
              </h3>
              <div className="space-y-2.5 text-xs">
                {topClients.map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300">
                        #{i + 1}
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">{c.name}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatDecimal(c.ha, 0)} ha</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CLIENTES & RETENÇÃO */}
      {activeTab === 'clients' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Análise de Clientes, Contratos e Retenção
              </h3>
              <p className="text-xs text-slate-500">Produtores rurais cadastrados e histórico consolidado</p>
            </div>
            <button
              onClick={() => onNavigate('admin-management')}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Produtor</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {scopedClients.map(client => (
              <div key={client.id} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{client.name}</h4>
                    <span className="text-[11px] text-slate-500">{client.cityState || 'Brasil'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {client.status || 'ACTIVE'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span>Área Total:</span>
                    <strong className="font-mono">{client.totalHectaresRegistered || 1200} ha</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Limite Crédito:</span>
                    <strong className="font-mono">{formatBRL(client.creditLimit || 50000)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PULVERIZAÇÕES POR CULTURA */}
      {activeTab === 'spray' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Painel Detalhado de Pulverizações e Aplicações
            </h3>
            <p className="text-xs text-slate-500">Métricas agronômicas de vazão, cobertura e tipos de produtos</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Área Aplicada por Cultura</h4>
              {cropStats.map(([crop, ha]) => (
                <div key={crop} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{crop}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatDecimal(ha, 1)} ha</span>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Status das Missões</h4>
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                <div className="flex justify-between"><span>Concluídas:</span> <strong className="text-emerald-600">{completedOrdersCount}</strong></div>
                <div className="flex justify-between"><span>Em Execução / Voo:</span> <strong className="text-blue-600">{operatingOrdersCount}</strong></div>
                <div className="flex justify-between"><span>Agendadas:</span> <strong className="text-amber-600">{scheduledOrdersCount}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DESEMPENHO DA EQUIPE & COMISSÕES */}
      {activeTab === 'crew' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Ranking de Desempenho dos Pilotos & Comissões
              </h3>
              <p className="text-xs text-slate-500">Hectares concluídos e repasses de comissão calculados por telemetria</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pilotLeaderboard.map((p, idx) => (
              <div key={p.name} className="p-4 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                    <span className="text-[11px] text-slate-500">{p.orders} ordens executadas</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span>Área Voada:</span>
                    <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatDecimal(p.ha, 1)} ha</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Comissão Acumulada:</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{formatBRL(p.commissions)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DRONES & SMART BATTERIES */}
      {activeTab === 'fleet_batteries' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Drones */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Status da Frota de Drones
            </h3>
            <div className="space-y-2">
              {scopedDrones.map(d => (
                <div key={d.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{d.modelName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">ANAC: {d.anacPrefix} • Serial: {d.serialNumber}</div>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{d.flightHours}h voadas</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Smart Batteries */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Monitor de Saúde das Smart Batteries
            </h3>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs flex justify-between items-center">
              <span>Saúde Média (SoH):</span>
              <strong className="font-mono text-emerald-700 dark:text-emerald-300 text-base">{batteryStats.avgSoh}%</strong>
            </div>
            <div className="space-y-2">
              {batteries.slice(0, 4).map(b => (
                <div key={b.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">{b.serialNumber}</span>
                    <div className="text-[11px] text-slate-500">{b.cycles} ciclos • Temp: {b.tempCelsius}°C</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    b.sohPercent >= 85 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                  }`}>
                    {b.sohPercent}% SoH
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: INTELIGÊNCIA FINANCEIRA */}
      {activeTab === 'financial' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Resumo do Desempenho Financeiro
            </h3>
            <p className="text-xs text-slate-500">Receitas operacionais, custos de insumos e comissões da tripulação</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-slate-600 dark:text-slate-400">Faturamento Bruto</span>
              <div className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatBRL(totalGrossRevenue)}</div>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-800 space-y-1">
              <span className="text-slate-600 dark:text-slate-400">Comissões da Tripulação</span>
              <div className="text-xl font-bold text-purple-700 dark:text-purple-300">{formatBRL(totalCommissionsPaid)}</div>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-slate-600 dark:text-slate-400">Margem Líquida Estimada</span>
              <div className="text-xl font-bold text-slate-900 dark:text-white">68.4%</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: RECOMENDAÇÕES POR IA & INSIGHTS PREDITIVOS */}
      {aiEnabled && activeTab === 'ai_insights' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-5 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  Motor de Inteligência Preditiva & Otimização Agronômica
                </h3>
                <p className="text-xs text-slate-400">
                  Recomendações automatizadas geradas com base no histórico de voo, telemetria, baterias e portão meteorológico.
                </p>
              </div>
            </div>

            {isMaster && (
              <button
                onClick={handleToggleAI}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                Configurar IA
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Recommendation 1 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-emerald-500/40 transition-colors">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Wind className="w-4 h-4" />
                <span>Janela Climática & Horário</span>
              </div>
              <h5 className="font-black text-white text-sm">Aproveitamento Matinal</h5>
              <p className="text-slate-400 leading-relaxed">
                As últimas 14 missões apresentaram taxa de deriva 30% menor quando iniciadas entre 06:15 e 08:45 devido ao vento médio de 6 km/h.
              </p>
            </div>

            {/* Recommendation 2 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-amber-500/40 transition-colors">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <BatteryCharging className="w-4 h-4" />
                <span>Saúde das Smart Batteries</span>
              </div>
              <h5 className="font-black text-white text-sm">Alerta de Storage</h5>
              <p className="text-slate-400 leading-relaxed">
                4 baterias estão com carga em 100% há mais de 4 dias sem voo registrado. Recomenda-se ativar o modo Storage (50%) para preservar a vida útil das células.
              </p>
            </div>

            {/* Recommendation 3 */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 hover:border-blue-500/40 transition-colors">
              <div className="flex items-center gap-2 text-blue-400 font-bold">
                <TrendingUp className="w-4 h-4" />
                <span>Oportunidade Comercial</span>
              </div>
              <h5 className="font-black text-white text-sm">Janela de Fungicida em Soja</h5>
              <p className="text-slate-400 leading-relaxed">
                Há 3 clientes com talhões de soja no estágio R1 sem pulverização agendada para os próximos 5 dias. Oportunidade de contato comercial ativo.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Employee Access Control Modal */}
      {isAccessModalOpen && (
        <EmployeeAccessControlModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          currentUser={currentUser}
          allUsers={allUsers}
          onSaveUserPermissions={(userId, allowedViews) => {
            onSaveUserPermissions(userId, allowedViews);
            showToast('Permissões do funcionário salvas e sincronizadas com sucesso!');
          }}
          registeredCompanies={registeredCompanies}
          activeCompanyId={selectedCompanyFilter}
        />
      )}
    </div>
  );
};
