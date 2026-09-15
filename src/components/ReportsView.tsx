import React, { useState, useMemo } from 'react';
import { 
  ServiceOrder, 
  WhiteLabelTheme, 
  UserProfile, 
  FarmPlot, 
  AgriculturalDrone, 
  CrewPilot, 
  CrewAssistant,
  ClientProducer 
} from '../types';
import { 
  Printer, 
  Search, 
  Filter, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Award, 
  Calendar, 
  User, 
  MapPin, 
  Plane, 
  Droplets,
  RotateCcw,
  Clock,
  Activity,
  AlertCircle,
  Lock,
  X,
  SlidersHorizontal,
  ChevronDown,
  Wheat,
  CalendarRange,
  ArrowUpDown,
  Sparkles
} from 'lucide-react';
import { formatBRL, formatDateBR, formatDateTimeBR } from '../utils/formatters';

interface ReportsViewProps {
  currentUser: UserProfile;
  theme?: WhiteLabelTheme;
  orders: ServiceOrder[];
  plots: FarmPlot[];
  drones: AgriculturalDrone[];
  pilots: CrewPilot[];
  assistants: CrewAssistant[];
  clients: ClientProducer[];
  onOpenReportModal: (orderId?: string) => void;
  onNavigate: (view: string) => void;
}

export type ReportSortOption = 
  | 'COMPLETION_DESC' 
  | 'COMPLETION_ASC' 
  | 'CREATION_DESC' 
  | 'HECTARES_DESC' 
  | 'VALUE_DESC' 
  | 'CODE_ASC';

export type DatePresetOption = 
  | 'ALL' 
  | 'TODAY' 
  | 'LAST_7_DAYS' 
  | 'LAST_30_DAYS' 
  | 'THIS_MONTH' 
  | 'CUSTOM';

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentUser,
  theme,
  orders = [],
  plots = [],
  drones = [],
  pilots = [],
  assistants = [],
  clients = [],
  onOpenReportModal,
  onNavigate,
}) => {
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL');
  const [selectedPilotId, setSelectedPilotId] = useState<string>('ALL');
  const [datePreset, setDatePreset] = useState<DatePresetOption>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [sortBy, setSortBy] = useState<ReportSortOption>('COMPLETION_DESC');

  // Unified clients list
  const availableClients = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const addedNames = new Set<string>();

    clients.forEach(c => {
      if (c && c.name && !addedNames.has(c.name.toLowerCase().trim())) {
        list.push({ id: c.id, name: c.name });
        addedNames.add(c.name.toLowerCase().trim());
      }
    });

    orders.forEach(o => {
      if (o && o.clientName && !addedNames.has(o.clientName.toLowerCase().trim())) {
        list.push({ id: o.clientId || `client-${o.clientName}`, name: o.clientName });
        addedNames.add(o.clientName.toLowerCase().trim());
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [clients, orders]);

  // Unique Crops list
  const availableCrops = useMemo(() => {
    const crops = new Set<string>();
    orders.forEach(o => { if (o.crop) crops.add(o.crop.trim()); });
    plots.forEach(p => { if (p.crop) crops.add(p.crop.trim()); });
    return Array.from(crops).sort((a, b) => a.localeCompare(b));
  }, [orders, plots]);

  // Unique Pilots list
  const availablePilots = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    const seen = new Set<string>();

    pilots.forEach(p => {
      if (p && p.name && !seen.has(p.name)) {
        list.push({ id: p.id, name: p.name });
        seen.add(p.name);
      }
    });

    orders.forEach(o => {
      if (o.pilotName && !seen.has(o.pilotName)) {
        list.push({ id: o.pilotId || `pilot-${o.pilotName}`, name: o.pilotName });
        seen.add(o.pilotName);
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [pilots, orders]);

  // Helper to extract numeric timestamp of completion for sorting and date range checking
  const getCompletionTimestamp = (os: ServiceOrder): number => {
    if (os.completedAt) {
      const t = new Date(os.completedAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (os.status === 'COMPLETED') {
      if (os.createdAt) {
        const t = new Date(os.createdAt).getTime();
        if (!isNaN(t)) return t;
      }
      if (os.scheduledDate) {
        const dateStr = os.endTime ? `${os.scheduledDate}T${os.endTime}:00` : `${os.scheduledDate}T17:00:00`;
        const t = new Date(dateStr).getTime();
        if (!isNaN(t)) return t;
      }
    }
    if (os.createdAt) {
      const t = new Date(os.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (os.scheduledDate) {
      const t = new Date(os.scheduledDate).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  const getCreationTimestamp = (os: ServiceOrder): number => {
    if (os.createdAt) {
      const t = new Date(os.createdAt).getTime();
      if (!isNaN(t)) return t;
    }
    if (os.scheduledDate) {
      const t = new Date(os.scheduledDate).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  // Helper date checking for presets
  const matchesDatePreset = (os: ServiceOrder): boolean => {
    if (datePreset === 'ALL') return true;

    const ts = getCompletionTimestamp(os);
    if (!ts) return false;

    const targetDate = new Date(ts);
    const now = new Date();

    if (datePreset === 'TODAY') {
      return (
        targetDate.getDate() === now.getDate() &&
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear()
      );
    }

    if (datePreset === 'LAST_7_DAYS') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return targetDate >= sevenDaysAgo && targetDate <= now;
    }

    if (datePreset === 'LAST_30_DAYS') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return targetDate >= thirtyDaysAgo && targetDate <= now;
    }

    if (datePreset === 'THIS_MONTH') {
      return (
        targetDate.getMonth() === now.getMonth() &&
        targetDate.getFullYear() === now.getFullYear()
      );
    }

    if (datePreset === 'CUSTOM') {
      if (customStartDate) {
        const start = new Date(`${customStartDate}T00:00:00`).getTime();
        if (ts < start) return false;
      }
      if (customEndDate) {
        const end = new Date(`${customEndDate}T23:59:59`).getTime();
        if (ts > end) return false;
      }
      return true;
    }

    return true;
  };

  // Filtered and sorted Orders Logic
  const filteredOrders = useMemo(() => {
    return orders
      .filter(os => {
        // 1. Text Search matching
        const term = searchTerm.trim().toLowerCase();
        const matchesSearch = !term || (
          (os.code || '').toLowerCase().includes(term) ||
          (os.clientName || '').toLowerCase().includes(term) ||
          (os.farmName || '').toLowerCase().includes(term) ||
          (os.plotName || '').toLowerCase().includes(term) ||
          (os.pilotName || '').toLowerCase().includes(term) ||
          (os.droneModel || '').toLowerCase().includes(term) ||
          (os.droneAnac || '').toLowerCase().includes(term) ||
          (os.crop || '').toLowerCase().includes(term) ||
          (os.targetPestOrGoal || '').toLowerCase().includes(term) ||
          (os.cityState || '').toLowerCase().includes(term)
        );

        // 2. Client Filter matching
        let matchesClient = true;
        if (selectedClientId !== 'ALL') {
          const clientObj = availableClients.find(c => c.id === selectedClientId) 
            || clients.find(c => c.id === selectedClientId);

          const targetClientName = (clientObj ? clientObj.name : selectedClientId).toLowerCase().trim();
          const osClientName = (os.clientName || '').toLowerCase().trim();
          const osClientId = (os.clientId || '').toLowerCase().trim();
          const selectedIdLower = selectedClientId.toLowerCase().trim();

          matchesClient = 
            osClientId === selectedIdLower ||
            (clientObj && osClientId === clientObj.id.toLowerCase()) ||
            osClientName === targetClientName ||
            osClientName.includes(targetClientName) ||
            targetClientName.includes(osClientName) ||
            (clientObj && 'tradeName' in clientObj && Boolean((clientObj as any).tradeName) && osClientName === ((clientObj as any).tradeName || '').toLowerCase().trim());
        }

        // 3. Status Filter matching
        let matchesStatus = true;
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'COMPLETED') {
            matchesStatus = os.status === 'COMPLETED';
          } else if (statusFilter === 'SCHEDULED') {
            matchesStatus = os.status === 'SCHEDULED';
          } else if (statusFilter === 'OPERATING' || statusFilter === 'IN_PROGRESS') {
            matchesStatus = os.status === 'OPERATING' || os.status === 'IN_TRANSIT';
          } else if (statusFilter === 'IN_TRANSIT') {
            matchesStatus = os.status === 'IN_TRANSIT';
          } else if (statusFilter === 'PAUSED') {
            matchesStatus = os.status === 'PAUSED';
          } else if (statusFilter === 'CANCELLED') {
            matchesStatus = os.status === 'CANCELLED';
          } else {
            matchesStatus = os.status === statusFilter;
          }
        }

        // 4. Crop Filter matching
        let matchesCrop = true;
        if (selectedCrop !== 'ALL') {
          matchesCrop = (os.crop || '').toLowerCase().trim() === selectedCrop.toLowerCase().trim();
        }

        // 5. Pilot Filter matching
        let matchesPilot = true;
        if (selectedPilotId !== 'ALL') {
          const pilotObj = availablePilots.find(p => p.id === selectedPilotId);
          const targetPilotName = pilotObj ? pilotObj.name.toLowerCase().trim() : selectedPilotId.toLowerCase().trim();
          const osPilotName = (os.pilotName || '').toLowerCase().trim();
          const osPilotId = (os.pilotId || '').toLowerCase().trim();
          matchesPilot = osPilotId === selectedPilotId.toLowerCase().trim() || osPilotName.includes(targetPilotName);
        }

        // 6. Date Preset matching
        const matchesDate = matchesDatePreset(os);

        return matchesSearch && matchesClient && matchesStatus && matchesCrop && matchesPilot && matchesDate;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'COMPLETION_DESC': {
            const timeA = getCompletionTimestamp(a);
            const timeB = getCompletionTimestamp(b);
            if (timeA !== timeB) return timeB - timeA;
            return (b.code || '').localeCompare(a.code || '');
          }
          case 'COMPLETION_ASC': {
            const timeA = getCompletionTimestamp(a);
            const timeB = getCompletionTimestamp(b);
            if (timeA !== timeB) return timeA - timeB;
            return (a.code || '').localeCompare(b.code || '');
          }
          case 'CREATION_DESC': {
            const timeA = getCreationTimestamp(a);
            const timeB = getCreationTimestamp(b);
            if (timeA !== timeB) return timeB - timeA;
            return (b.code || '').localeCompare(a.code || '');
          }
          case 'HECTARES_DESC': {
            const haA = a.sprayedHectares || a.targetHectares || 0;
            const haB = b.sprayedHectares || b.targetHectares || 0;
            return haB - haA;
          }
          case 'VALUE_DESC': {
            const valA = a.totalGrossValue || 0;
            const valB = b.totalGrossValue || 0;
            return valB - valA;
          }
          case 'CODE_ASC': {
            return (a.code || '').localeCompare(b.code || '');
          }
          default:
            return 0;
        }
      });
  }, [orders, searchTerm, selectedClientId, statusFilter, selectedCrop, selectedPilotId, datePreset, customStartDate, customEndDate, sortBy, availableClients, clients, availablePilots]);

  // Reset all active filters helper
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedClientId('ALL');
    setStatusFilter('ALL');
    setSelectedCrop('ALL');
    setSelectedPilotId('ALL');
    setDatePreset('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('COMPLETION_DESC');
  };

  const hasActiveFilters = 
    searchTerm !== '' || 
    selectedClientId !== 'ALL' || 
    statusFilter !== 'ALL' || 
    selectedCrop !== 'ALL' || 
    selectedPilotId !== 'ALL' || 
    datePreset !== 'ALL' || 
    customStartDate !== '' || 
    customEndDate !== '' ||
    sortBy !== 'COMPLETION_DESC';

  // Helper formatting creation date of OS (Padrão Oficial DD/MM/AAAA às HH:MM)
  const formatCreationDate = (os: ServiceOrder) => {
    return formatDateTimeBR(os.createdAt || os.scheduledDate, os.startTime || '08:00');
  };

  // Helper formatting real completion/closure date of OS (Padrão Oficial DD/MM/AAAA às HH:MM)
  const formatCompletionDate = (os: ServiceOrder) => {
    if (os.completedAt) {
      return formatDateTimeBR(os.completedAt);
    }
    if (os.status === 'COMPLETED') {
      return formatDateTimeBR(new Date().toISOString());
    }
    if (os.status === 'CANCELLED') {
      return 'OS Cancelada';
    }
    return 'Pendente (Em andamento)';
  };

  // Statistics KPIs
  const totalReportsCount = orders.length;
  const completedReportsCount = orders.filter(o => o.status === 'COMPLETED').length;
  const operatingReportsCount = orders.filter(o => o.status === 'OPERATING' || o.status === 'IN_TRANSIT').length;
  const scheduledReportsCount = orders.filter(o => o.status === 'SCHEDULED').length;
  const totalHectaresSprayed = orders.reduce((acc, o) => acc + (o.sprayedHectares || o.targetHectares || 0), 0);
  const totalGrossValueSum = orders.reduce((acc, o) => acc + (o.totalGrossValue || 0), 0);

  // Status Badge Renderer Helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Concluída • Laudo Pronto
          </span>
        );
      case 'OPERATING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30">
            <Activity className="w-3 h-3 text-blue-600 dark:text-blue-400 animate-pulse" />
            Em Operação
          </span>
        );
      case 'IN_TRANSIT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
            <Plane className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            Em Deslocamento
          </span>
        );
      case 'SCHEDULED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Agendada
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-orange-500/15 text-orange-700 dark:text-orange-300 border border-orange-500/30">
            <AlertCircle className="w-3 h-3 text-orange-600 dark:text-orange-400" />
            Pausada
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Cancelada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-500/15 text-slate-700 dark:text-slate-300 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 sm:px-4 sm:py-2.5 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Conformidade MAPA 298/2021 & ANAC</span>
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-emerald-950 dark:text-white">
            Relatórios Técnicos e Laudos
          </h1>
          <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            Emissão restrita a pulverizações concluídas com laudos certificados, telemetria e assinaturas digitais.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
              statusFilter === 'COMPLETED'
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{statusFilter === 'COMPLETED' ? 'Exibindo Somente Concluídas' : 'Filtrar Prontas p/ Emissão'}</span>
          </button>
        </div>
      </div>

      {/* Compact KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div 
          onClick={() => setStatusFilter('COMPLETED')}
          className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs space-y-0.5 cursor-pointer hover:border-emerald-500 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Laudos Prontos</span>
            <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-950 dark:text-white">
            {completedReportsCount} <span className="text-[10px] font-normal text-slate-400">/ {totalReportsCount} OS</span>
          </div>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" /> Prontos p/ Emissão PDF
          </p>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Área Certificada</span>
            <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-950 dark:text-white">
            {totalHectaresSprayed.toLocaleString('pt-BR')} <span className="text-[10px] font-normal text-slate-400">ha</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Pulverização Efetiva
          </p>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Produtores</span>
            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-950 dark:text-white">
            {availableClients.length || clients.length || new Set(orders.map(o => o.clientName)).size} <span className="text-[10px] font-normal text-slate-400">propriedades</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Clientes Atendidos
          </p>
        </div>

        <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Faturamento Laudado</span>
            <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-black font-mono text-emerald-700 dark:text-emerald-400">
            {formatBRL(totalGrossValueSum)}
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
            Total em Ordens de Serviço
          </p>
        </div>
      </div>

      {/* Single Unified Filter Bar */}
      <div className="p-2.5 sm:p-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código OS, produtor, fazenda, cultura, piloto..."
              className="w-full pl-8 pr-8 py-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 text-emerald-950 dark:text-white placeholder:text-slate-400"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              aria-label="Filtrar por Status"
            >
              <option value="ALL" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Status: Todos ({totalReportsCount})
              </option>
              <option value="COMPLETED" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Concluídas ({completedReportsCount})
              </option>
              <option value="OPERATING" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Em Operação ({operatingReportsCount})
              </option>
              <option value="SCHEDULED" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Agendadas ({scheduledReportsCount})
              </option>
              <option value="PAUSED" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Pausadas
              </option>
              <option value="CANCELLED" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Canceladas
              </option>
            </select>
          </div>

          {/* Client Filter */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 shrink-0">
            <User className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[140px] truncate"
              aria-label="Filtrar por Produtor / Cliente"
            >
              <option value="ALL" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Todos os Clientes
              </option>
              {availableClients.map(c => (
                <option key={c.id} value={c.id} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Crop Filter */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 shrink-0">
            <Wheat className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
              aria-label="Filtrar por Cultura Agrícola"
            >
              <option value="ALL" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Todas as Culturas
              </option>
              {availableCrops.map(crop => (
                <option key={crop} value={crop} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {crop}
                </option>
              ))}
            </select>
          </div>

          {/* Pilot Filter */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 shrink-0">
            <Plane className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <select
              value={selectedPilotId}
              onChange={(e) => setSelectedPilotId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[130px] truncate"
              aria-label="Filtrar por Piloto Remoto"
            >
              <option value="ALL" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Todos os Pilotos
              </option>
              {availablePilots.map(p => (
                <option key={p.id} value={p.id} className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Preset Filter */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 shrink-0">
            <CalendarRange className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <select
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value as DatePresetOption)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              aria-label="Filtrar por Período de Data"
            >
              <option value="ALL" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Todo Período
              </option>
              <option value="TODAY" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Hoje
              </option>
              <option value="LAST_7_DAYS" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Últimos 7 Dias
              </option>
              <option value="LAST_30_DAYS" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Últimos 30 Dias
              </option>
              <option value="THIS_MONTH" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Mês Atual
              </option>
              <option value="CUSTOM" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Personalizado...
              </option>
            </select>
          </div>

          {/* Custom Date Range (when CUSTOM is selected) */}
          {datePreset === 'CUSTOM' && (
            <div className="flex items-center gap-1.5 shrink-0 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2 py-1">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-emerald-950 dark:text-white focus:outline-none"
                aria-label="Data inicial"
              />
              <span className="text-slate-400 text-xs font-bold">até</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-transparent text-xs font-semibold text-emerald-950 dark:text-white focus:outline-none"
                aria-label="Data final"
              />
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 bg-emerald-50/60 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 rounded-lg px-2.5 py-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ReportSortOption)}
              className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer max-w-[145px] truncate"
              aria-label="Ordenar laudos"
            >
              <option value="COMPLETION_DESC" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Encerramento (Mais recentes)
              </option>
              <option value="COMPLETION_ASC" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Encerramento (Mais antigos)
              </option>
              <option value="CREATION_DESC" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Criação (Mais recentes)
              </option>
              <option value="HECTARES_DESC" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Área (Maior p/ Menor)
              </option>
              <option value="VALUE_DESC" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Faturamento (Maior p/ Menor)
              </option>
              <option value="CODE_ASC" className="text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900">
                Código OS (A-Z)
              </option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              title="Limpar todos os filtros"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-bold text-xs shrink-0 hover:bg-rose-100 dark:hover:bg-rose-900/80 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpar</span>
            </button>
          )}
        </div>

        {/* ACTIVE FILTER CHIPS */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-emerald-100 dark:border-emerald-900/40 text-[11px]">
            <span className="text-slate-400 font-bold text-[10px] uppercase mr-1">Filtros Ativos:</span>

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-800">
                Busca: "{searchTerm}"
                <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => setSearchTerm('')} />
              </span>
            )}

            {statusFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-800">
                Status: {statusFilter}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => setStatusFilter('ALL')} />
              </span>
            )}

            {selectedClientId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-800">
                Cliente: {availableClients.find(c => c.id === selectedClientId)?.name || selectedClientId}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => setSelectedClientId('ALL')} />
              </span>
            )}

            {selectedCrop !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-800">
                Cultura: {selectedCrop}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => setSelectedCrop('ALL')} />
              </span>
            )}

            {selectedPilotId !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-800">
                Piloto: {availablePilots.find(p => p.id === selectedPilotId)?.name || selectedPilotId}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => setSelectedPilotId('ALL')} />
              </span>
            )}

            {datePreset !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 font-semibold border border-emerald-300 dark:border-emerald-800">
                Período: {datePreset === 'TODAY' ? 'Hoje' : datePreset === 'LAST_7_DAYS' ? 'Últimos 7 dias' : datePreset === 'LAST_30_DAYS' ? 'Últimos 30 dias' : datePreset === 'THIS_MONTH' ? 'Mês atual' : 'Personalizado'}
                <X className="w-3 h-3 cursor-pointer hover:text-rose-600" onClick={() => { setDatePreset('ALL'); setCustomStartDate(''); setCustomEndDate(''); }} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Reports Master List */}
      <div className="bg-white dark:bg-[#072a1e] rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 overflow-hidden shadow-2xs">
        <div className="p-2.5 sm:px-3 sm:py-2.5 border-b border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-white">
              Laudos Disponíveis ({filteredOrders.length})
            </h2>
            {hasActiveFilters && (
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-bold border border-amber-300 dark:border-amber-800">
                Filtros Ativos
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:inline">
            Emissão oficial liberada exclusivamente para Ordens de Serviço concluídas
          </span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-8 text-center space-y-3">
            <FileText className="w-9 h-9 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nenhuma Ordem de Serviço encontrada para os filtros selecionados.
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tente ajustar os filtros, buscar por outro termo ou limpar os parâmetros.
              </p>
            </div>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-transform active:scale-95 cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Todos os Registros</span>
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-emerald-100 dark:divide-emerald-900/40">
            {filteredOrders.map((os) => {
              const isCompleted = os.status === 'COMPLETED';

              return (
                <div 
                  key={os.id} 
                  className={`p-3 sm:px-4 sm:py-3 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    isCompleted 
                      ? 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40' 
                      : 'bg-slate-50/50 dark:bg-emerald-950/20 opacity-85 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-1.5 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-black text-xs border border-emerald-200 dark:border-emerald-800">
                        {os.code}
                      </span>

                      {renderStatusBadge(os.status)}

                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {formatDateBR(isCompleted ? (os.completedAt || os.scheduledDate) : os.scheduledDate)}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-white flex items-center gap-1.5">
                        {os.clientName}
                      </h3>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                        <span>{os.farmName} — <strong>{os.plotName}</strong> ({os.crop} - {os.targetHectares} ha)</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-100 dark:border-emerald-900/40">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Criação da OS: <strong className="text-slate-800 dark:text-slate-100 font-mono">{formatCreationDate(os)}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                        Encerramento da OS: <strong className={isCompleted ? 'text-emerald-700 dark:text-emerald-300 font-mono font-bold' : 'text-amber-700 dark:text-amber-400 font-mono'}>{formatCompletionDate(os)}</strong>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-0.5 text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-2.5 h-2.5 text-slate-400" />
                        Piloto: <strong className="text-slate-700 dark:text-slate-300">{os.pilotName}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Plane className="w-2.5 h-2.5 text-slate-400" />
                        Drone: <strong className="text-slate-700 dark:text-slate-300">{os.droneModel}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Droplets className="w-2.5 h-2.5 text-slate-400" />
                        Calda: <strong className="text-slate-700 dark:text-slate-300">{os.sprayRateLHa} L/ha</strong>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0">
                    {isCompleted ? (
                      <button
                        onClick={() => onOpenReportModal(os.id)}
                        className="px-3.5 py-2 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
                        title="Emitir laudo técnico completo e termo em PDF"
                      >
                        <Printer className="w-3.5 h-3.5 text-white" />
                        <span>Emitir Relatório / PDF</span>
                      </button>
                    ) : (
                      <div 
                        title="A emissão de relatórios oficiais e laudos é permitida apenas após a conclusão e assinatura digital da aplicação."
                        className="px-3 py-2 rounded-lg bg-slate-100 dark:bg-emerald-950/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-emerald-900/60 text-xs font-semibold flex items-center gap-1.5 select-none"
                      >
                        <Lock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>Disponível pós-Conclusão</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
