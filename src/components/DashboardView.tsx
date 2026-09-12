import React from 'react';
import { UserProfile, ServiceOrder, FarmPlot, AgriculturalDrone, FinancialEntry } from '../types';
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
  Sliders
} from 'lucide-react';
import { DronePhoto, DroneBadge } from './DronePhotoBadge';
import { formatBRL } from '../utils/formatters';

interface DashboardViewProps {
  currentUser: UserProfile;
  orders?: ServiceOrder[];
  plots?: FarmPlot[];
  drones?: AgriculturalDrone[];
  financials?: FinancialEntry[];
  onNavigate: (view: string) => void;
  onOpenNewOSModal?: () => void;
  onOpenNewOS?: () => void;
  onStartLiveTour?: () => void;
  onOpenReportModal?: (orderId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  orders = [],
  plots = [],
  drones = [],
  financials = [],
  onNavigate,
  onOpenNewOSModal,
  onOpenNewOS,
  onStartLiveTour,
  onOpenReportModal,
}) => {
  const handleOpenOS = () => {
    if (onOpenNewOSModal) onOpenNewOSModal();
    else if (onOpenNewOS) onOpenNewOS();
  };

  // Common calculations
  const totalAppliedHa = (orders || []).reduce((acc, o) => acc + (o.sprayedHectares || 0), 0);
  const activeOrdersCount = (orders || []).filter(o => o.status === 'OPERATING' || o.status === 'IN_TRANSIT').length;
  const scheduledOrdersCount = (orders || []).filter(o => o.status === 'SCHEDULED').length;
  const completedOrdersCount = (orders || []).filter(o => o.status === 'COMPLETED').length;

  const totalGrossRevenue = (orders || []).reduce((acc, o) => acc + (o.totalGrossValue || 0), 0);
  const totalPilotCommissions = (orders || []).reduce((acc, o) => acc + (o.pilotCommission || 0), 0);
  const totalAssistantCommissions = (orders || []).reduce((acc, o) => acc + (o.assistantCommission || 0), 0);

  // Role specific filters
  const userOrders = currentUser.role === 'USER' 
    ? (orders || []).filter(o => o.clientId === currentUser.id || o.clientName === currentUser.name)
    : currentUser.role === 'PILOT'
    ? (orders || []).filter(o => o.pilotId === 'pilot-1' || o.pilotName.includes(currentUser.name.split(' ')[1] || ''))
    : currentUser.role === 'ASSISTANT'
    ? (orders || []).filter(o => o.assistantId === 'assistant-1' || o.assistantName.includes(currentUser.name.split(' ')[0]))
    : (orders || []);

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Minimalist Welcome Banner */}
      <div className="bg-gradient-to-br from-white via-emerald-50/50 to-emerald-100/40 dark:from-[#072a1e] dark:via-[#093325] dark:to-[#041c14] text-emerald-950 dark:text-white rounded-xl p-3 sm:px-4 sm:py-3 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shadow-2xs">
              {currentUser.roleLabel}
            </span>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-emerald-950 dark:text-white">
              Olá, {currentUser.name}
            </h1>
            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">|</span>
            <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
              Safra 2025/2026 • Clima: 26°C | Vento: 9 km/h (Favorável)
            </span>
          </div>

          {/* Quick Actions in compact line */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onNavigate('quotations')}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs border border-emerald-400/30 hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-100" />
              <span>Orçamento Comercial</span>
            </button>

            <button
              onClick={handleOpenOS}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-emerald-100 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 hover:scale-102 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Abrir Nova O.S.</span>
            </button>
          </div>
        </div>
      </div>

      {/* COMPACT DESTAQUE: EMISSÃO DE RELATÓRIOS TÉCNICOS DE PULVERIZAÇÃO */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white rounded-xl p-3 sm:px-4 sm:py-3 border border-emerald-500/40 shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/20 text-emerald-300 flex-shrink-0 shadow-inner">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-400 text-emerald-950 tracking-wider">
                  DESTAQUE
                </span>
                <span className="text-[11px] text-emerald-200 font-bold">
                  IN MAPA nº 19/2021 • ANAC • CREA
                </span>
              </div>
              <h3 className="text-sm font-black text-white tracking-tight">
                Emissão de Relatórios Técnicos de Pulverização
              </h3>
              <p className="text-[11px] text-emerald-100/90 mt-0.5 max-w-2xl leading-relaxed">
                Gere documentos técnicos com mapas ortomosaicos, parâmetros de voo, dados do produtor, receita de calda e assinaturas digitais.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end md:self-auto flex-shrink-0">
            <button
              onClick={() => {
                if (onOpenReportModal) onOpenReportModal();
                else onNavigate('reports');
              }}
              className="px-3.5 py-1.5 rounded-lg font-bold text-xs bg-white text-emerald-950 hover:bg-emerald-50 shadow-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              <span>Gerador de Relatórios</span>
            </button>
          </div>
        </div>
      </div>

      {/* METRICS CARDS BY ROLE */}
      {currentUser.role === 'ADMIN' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Área Aplicada</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                {totalAppliedHa.toFixed(1).replace('.', ',')} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">ha</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                +14,5% vs safra passada
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Ordens de Serviço</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <Plane className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                {activeOrdersCount} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">em voo</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                {scheduledOrdersCount} agendadas • {completedOrdersCount} concluídas
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Faturamento Previsto</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                {formatBRL(totalGrossRevenue)}
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5 truncate">
                Comissões: {formatBRL(totalPilotCommissions + totalAssistantCommissions)}
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Frota de Drones</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <BatteryCharging className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                {drones.length} <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">drones</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                100% conformes ANAC/DECEA
              </p>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'USER' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Meus Talhões</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                2 <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">talhões (80.5 ha)</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Soja (R3) e Milho (V6)</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Status Aplicação</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <Plane className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                Operando <span className="text-xs text-emerald-600 font-bold">● 70%</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Talhão 04 (34 / 48.5 ha)</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Previsão Financeira</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                R$ 3.637,50
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Vencimento: 25/09/2026</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Índice Vegetativo</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                0.78 <span className="text-xs text-emerald-800 dark:text-emerald-300 font-normal">NDVI</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Lavouras sem estresse hídrico</p>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'PILOT' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Minha Escala Hoje</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <Plane className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                2 Ordens <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">(80.5 ha)</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                OS-041 em andamento
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Meteorologia</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <Wind className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-400">
                Delta T: 4.8°C <span className="text-[10px] font-bold px-1 py-0.5 rounded bg-emerald-200/80 text-emerald-950 dark:bg-emerald-950">IDEAL</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Vento 9.2 km/h • UR 62%</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Drone Alocado</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-lg font-black text-emerald-950 dark:text-white">
                DJI Agras T40
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">PP-AGR-01 (Bateria: 96%)</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Comissão Prevista</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                R$ 644,00
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Taxa: R$ 8,00/ha (80,5 ha)</p>
            </div>
          </div>
        </div>
      )}

      {currentUser.role === 'ASSISTANT' && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Caldas Hoje</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <Droplets className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                869 L <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">(21 tanques)</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold mt-0.5">
                Taxa média: 10 a 12 L/ha
              </p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Estação de Recarga</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <BatteryCharging className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                3 Baterias <span className="text-xs text-emerald-600 font-bold">Prontas</span>
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Gerador EFI 9000W ativo</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Logística InpEV</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                12 Embalagens
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Tríplice lavagem OK</p>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-3 sm:p-3.5 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80">Minha Comissão</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white">
                R$ 241,50
              </span>
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-0.5">Taxa: R$ 3,00/ha de solo</p>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE ORDERS LIST SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {/* Left 2 Cols: Orders in Progress */}
        <div className="lg:col-span-2 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {currentUser.role === 'USER' ? 'Minhas Ordens de Serviço' : 'Escala Operacional em Campo'}
            </h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              Ver Todas as Ordens →
            </button>
          </div>

          <div className="space-y-2.5">
            {userOrders.map((order) => {
              const progressPct = Math.round((order.sprayedHectares / order.targetHectares) * 100);
              return (
                <div
                  key={order.id}
                  className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 sm:p-3.5 shadow-2xs hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-emerald-950 dark:text-white">
                          {order.code}
                        </span>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${
                          order.status === 'OPERATING'
                            ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 animate-pulse'
                            : order.status === 'SCHEDULED'
                            ? 'bg-emerald-200/60 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        }`}>
                          {order.status === 'OPERATING' ? '● EM OPERAÇÃO' : order.status === 'SCHEDULED' ? 'AGENDADO' : 'CONCLUÍDO'}
                        </span>
                        <span className="text-[11px] font-medium text-emerald-800/80 dark:text-emerald-300/80">
                          {order.crop} • {order.targetHectares} ha
                        </span>
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-emerald-950 dark:text-emerald-100 mt-0.5">
                        {order.plotName} • {order.farmName}
                      </h3>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400 block">Alvo Técnico</span>
                      <span className="text-xs font-semibold text-emerald-950 dark:text-emerald-200">
                        {order.targetPestOrGoal}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Operational Triad */}
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-800/80 dark:text-emerald-300/80">
                        Progresso: <strong>{order.sprayedHectares} ha</strong> de {order.targetHectares} ha
                      </span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">{progressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-emerald-200/60 dark:bg-emerald-950 overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 transition-all rounded-full"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Operational Triad Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                      <DroneBadge
                        droneModel={order.droneModel}
                        droneAnac={order.droneAnac}
                        photoUrl={order.dronePhotoUrl}
                        droneId={order.droneId}
                        size="xs"
                        className="bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800"
                      />
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <strong>Piloto:</strong> {order.pilotName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <strong>Calda:</strong> {order.assistantName}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 1 Col: Quick Tools & Contextual Actions */}
        <div className="space-y-2.5">
          <h2 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Acesso Rápido
          </h2>

          <div className="space-y-1.5">
            <button
              onClick={() => onNavigate('weather')}
              className="w-full text-left p-2.5 rounded-xl bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500 hover:shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Wind className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-white">
                      Estação & Portão Delta T
                    </h4>
                    <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                      Checagem climática de deriva
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('spray-mix')}
              className="w-full text-left p-2.5 rounded-xl bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500 hover:shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-white">
                      Calculadora de Calda
                    </h4>
                    <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                      Ordem de mistura WALES & InpEV
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('gis')}
              className="w-full text-left p-2.5 rounded-xl bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500 hover:shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-white">
                      Mapa de Talhões & GIS
                    </h4>
                    <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                      Polígonos, relevo e WGS84
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            <button
              onClick={() => onNavigate('telemetry')}
              className="w-full text-left p-2.5 rounded-xl bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500 hover:shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-white">
                      Telemetria de Voo (.DAT)
                    </h4>
                    <span className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                      Rendimento real ha/h e baterias
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>

          {/* Drones Fleet Glance Card with Photos */}
          {drones && drones.length > 0 && (
            <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-emerald-950 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Frota Ativa ({drones.length})
                </h3>
                <button
                  onClick={() => onNavigate('fleet')}
                  className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Ver Todos →
                </button>
              </div>

              <div className="space-y-1.5">
                {drones.slice(0, 3).map((drone) => (
                  <div
                    key={drone.id}
                    onClick={() => onNavigate('fleet')}
                    className="p-1.5 rounded-lg bg-white/80 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-between gap-2 hover:border-emerald-400 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <DronePhoto
                        drone={drone}
                        size="xs"
                        rounded="rounded-md"
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-emerald-950 dark:text-white truncate">
                          {drone.modelName}
                        </div>
                        <div className="text-[9px] text-emerald-800/80 dark:text-emerald-400/80 font-mono">
                          {drone.anacPrefix} • {drone.tankCapacityL}L
                        </div>
                      </div>
                    </div>

                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                      drone.operationalStatus === 'READY'
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-300'
                    }`}>
                      {drone.operationalStatus === 'READY' ? 'Pronto' : 'Em Voo'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
