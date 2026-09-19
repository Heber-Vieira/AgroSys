import React, { useState, useMemo, useEffect } from 'react';
import { 
  ServiceOrder, 
  UserProfile, 
  FarmPlot, 
  AgriculturalDrone, 
  CrewPilot, 
  CrewAssistant,
  ClientProducer,
  WhiteLabelTheme,
  ScheduleConflict
} from '../types';
import { showConfirm, showToast } from '../services/notificationService';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Plane, 
  User, 
  Wind, 
  Droplets, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CalendarRange, 
  LayoutList, 
  Kanban,
  MapPin,
  ShieldAlert,
  Edit2,
  Trash2,
  Play,
  ArrowRight
} from 'lucide-react';
import { 
  detectAllScheduleCollisions, 
  timeStringToMinutes, 
  minutesToTimeString 
} from '../services/scheduleConflictService';
import { 
  isAudioEnabled, 
  toggleAudioEnabled, 
  playSlotSelectedTone, 
  playConflictAlert, 
  playSuccessChime 
} from '../utils/audioAlerts';
import { ScheduleOrderModal } from './scheduling/ScheduleOrderModal';
import { ScheduleConflictsModal } from './scheduling/ScheduleConflictsModal';
import { formatDateBR } from '../utils/formatters';
import { filterOrdersForUser, isServiceOrderAssignedToUser, doNamesMatch } from '../utils/userPermissions';

interface ScheduleCalendarViewProps {
  currentUser: UserProfile;
  theme?: WhiteLabelTheme;
  orders: ServiceOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  plots: FarmPlot[];
  drones: AgriculturalDrone[];
  pilots: CrewPilot[];
  assistants: CrewAssistant[];
  clients?: ClientProducer[];
  onNavigateToOS?: () => void;
}

type CalendarViewMode = 'month' | 'week' | 'timeline' | 'list';
type TimelineResource = 'pilot' | 'drone';

export const ScheduleCalendarView: React.FC<ScheduleCalendarViewProps> = ({
  currentUser,
  theme,
  orders,
  setOrders,
  plots,
  drones,
  pilots,
  assistants,
  clients,
  onNavigateToOS,
}) => {
  // Calendar Navigation State (Initializes to current system date)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [timelineResource, setTimelineResource] = useState<TimelineResource>('pilot');
  const hourlyGridRef = React.useRef<HTMLDivElement>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPilotFilter, setSelectedPilotFilter] = useState<string>('ALL');
  const [selectedDroneFilter, setSelectedDroneFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showConflictsOnly, setShowConflictsOnly] = useState<boolean>(false);

  // Audio State
  const [soundActive, setSoundActive] = useState<boolean>(isAudioEnabled());

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isConflictsModalOpen, setIsConflictsModalOpen] = useState<boolean>(false);
  const [modalInitialDate, setModalInitialDate] = useState<string>('');
  const [modalInitialStartTime, setModalInitialStartTime] = useState<string>('07:00');
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // Operational hours filter ('OPERATIONAL' 06-18h vs 'FULL' 00-23h)
  const [hoursMode, setHoursMode] = useState<'OPERATIONAL' | 'FULL'>('OPERATIONAL');

  // 1. Data Isolation & RBAC: Precision Filtering for Current User (Pilots/Assistants/Clients)
  const userScopedOrders = useMemo(() => {
    return filterOrdersForUser(orders, currentUser, pilots, assistants);
  }, [orders, currentUser, pilots, assistants]);

  // Global Collision Detector across user's visible orders
  const conflictsMap = useMemo(() => {
    return detectAllScheduleCollisions(userScopedOrders);
  }, [userScopedOrders]);

  const totalConflictsCount = useMemo(() => {
    let count = 0;
    conflictsMap.forEach((conflictList) => {
      count += conflictList.length;
    });
    return Math.floor(count / 2); // Each pair is recorded twice
  }, [conflictsMap]);

  // Trigger cautionary sound if conflicts are detected on initial load
  useEffect(() => {
    if (totalConflictsCount > 0 && soundActive) {
      const timer = setTimeout(() => {
        playConflictAlert();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [totalConflictsCount, soundActive]);

  // Auto-scroll hourly grid to center daytime operating hours on open
  useEffect(() => {
    if (hourlyGridRef.current && viewMode === 'week') {
      hourlyGridRef.current.scrollTop = 44 * 1;
    }
  }, [viewMode, currentDate]);

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = toggleAudioEnabled();
    setSoundActive(next);
  };

  // Date Navigation Helpers
  const selectedDateStr = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(currentDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [currentDate]);

  const handlePrevDay = () => {
    playSlotSelectedTone();
    const next = new Date(currentDate);
    next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNextDay = () => {
    playSlotSelectedTone();
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handlePrevPeriod = () => {
    playSlotSelectedTone();
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNextPeriod = () => {
    playSlotSelectedTone();
    const next = new Date(currentDate);
    if (viewMode === 'month') {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handlePrev = handlePrevDay;
  const handleNext = handleNextDay;

  const handleToday = () => {
    playSlotSelectedTone();
    setCurrentDate(new Date());
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return userScopedOrders.filter(order => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesCode = order.code.toLowerCase().includes(q);
        const matchesFarm = order.farmName.toLowerCase().includes(q);
        const matchesPlot = order.plotName.toLowerCase().includes(q);
        const matchesPilot = order.pilotName.toLowerCase().includes(q);
        const matchesAssistant = order.assistantName.toLowerCase().includes(q);
        const matchesDrone = order.droneModel.toLowerCase().includes(q);
        if (!matchesCode && !matchesFarm && !matchesPlot && !matchesPilot && !matchesAssistant && !matchesDrone) {
          return false;
        }
      }

      // Pilot
      if (selectedPilotFilter !== 'ALL' && order.pilotId !== selectedPilotFilter) {
        return false;
      }

      // Drone
      if (selectedDroneFilter !== 'ALL' && order.droneId !== selectedDroneFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // Conflicts Only
      if (showConflictsOnly) {
        const hasConflict = conflictsMap.has(order.id);
        if (!hasConflict) return false;
      }

      return true;
    });
  }, [userScopedOrders, searchQuery, selectedPilotFilter, selectedDroneFilter, statusFilter, showConflictsOnly, conflictsMap]);

  // Order CRUD handlers
  const handleSaveOrder = (newOrUpdatedOrder: ServiceOrder) => {
    const isCompleting = newOrUpdatedOrder.status === 'COMPLETED';
    const preparedOrder: ServiceOrder = {
      ...newOrUpdatedOrder,
      createdAt: newOrUpdatedOrder.createdAt || new Date().toISOString(),
      completedAt: isCompleting ? (newOrUpdatedOrder.completedAt || new Date().toISOString()) : newOrUpdatedOrder.completedAt,
      sprayedHectares: isCompleting ? newOrUpdatedOrder.targetHectares : newOrUpdatedOrder.sprayedHectares,
      digitalSigned: isCompleting ? true : newOrUpdatedOrder.digitalSigned,
    };
    setOrders(prev => {
      const exists = prev.some(o => o.id === preparedOrder.id);
      if (exists) {
        return prev.map(o => o.id === preparedOrder.id ? preparedOrder : o);
      }
      return [preparedOrder, ...prev];
    });
  };

  const handleDeleteOrder = (orderId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    showConfirm({
      title: 'Cancelar Agendamento',
      message: 'Tem certeza que deseja desmarcar e excluir permanentemente este agendamento?',
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Manter Agendamento',
      isDestructive: true,
      onConfirm: () => {
        setOrders(prev => prev.filter(o => o.id !== orderId));
        playSuccessChime();
        showToast('Agendamento removido com sucesso.', 'info', 'Agendamento Cancelado');
      }
    });
  };

  const handleOpenNewModal = (dateStr?: string, timeStr?: string) => {
    playSlotSelectedTone();
    setEditingOrder(null);
    setModalInitialDate(dateStr || currentDate.toISOString().split('T')[0]);
    setModalInitialStartTime(timeStr || '07:00');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (order: ServiceOrder) => {
    playSlotSelectedTone();
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleAutoResolveConflict = (orderId: string, newStartTime: string, newEndTime: string) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          startTime: newStartTime,
          endTime: newEndTime
        };
      }
      return o;
    }));
    playSuccessChime();
    showToast(`Agendamento atualizado para ${newStartTime} - ${newEndTime}.`, 'success', 'Conflito Resolvido');
  };

  const handleJumpToDateStr = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      setCurrentDate(new Date(y, m, d));
      playSlotSelectedTone();
    }
  };

  // Month Grid Calculations
  const monthData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; dateObj: Date }[] = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const d = new Date(year, month - 1, dayNum);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateObj: d,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNumber: dayNum,
        isCurrentMonth: true,
        dateObj: d,
      });
    }

    // Next month padding to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let dayNum = 1; dayNum <= remaining; dayNum++) {
      const d = new Date(year, month + 1, dayNum);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateObj: d,
      });
    }

    return days;
  }, [currentDate]);

  // 7-Day Rolling Grid Centered around currentDate
  const weekDays = useMemo(() => {
    const days: { dateStr: string; dayNumber: number; dayName: string; fullDate: Date }[] = [];
    const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    // Center currentDate at index 3 (4th column out of 7)
    for (let i = -3; i <= 3; i++) {
      const d = new Date(currentDate);
      d.setDate(currentDate.getDate() + i);
      days.push({
        dateStr: d.toISOString().split('T')[0],
        dayNumber: d.getDate(),
        dayName: names[d.getDay()],
        fullDate: d,
      });
    }

    return days;
  }, [currentDate]);

  // Full Date & Month Formatter
  const formattedFullDate = useMemo(() => {
    const weekdayStr = currentDate.toLocaleDateString('pt-BR', { weekday: 'short' });
    const dayStr = String(currentDate.getDate()).padStart(2, '0');
    const monthStr = currentDate.toLocaleDateString('pt-BR', { month: 'short' });
    const year = currentDate.getFullYear();
    const capWeekday = weekdayStr.charAt(0).toUpperCase() + weekdayStr.slice(1).replace('.', '');
    const capMonth = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace('.', '');
    return `${capWeekday}, ${dayStr} de ${capMonth} de ${year}`;
  }, [currentDate]);

  // Array of hours to render based on hoursMode
  const visibleHours = useMemo(() => {
    if (hoursMode === 'OPERATIONAL') {
      // 06:00 to 18:00 (13 slots)
      return Array.from({ length: 13 }).map((_, i) => i + 6);
    }
    // 00:00 to 23:00 (24 slots)
    return Array.from({ length: 24 }).map((_, i) => i);
  }, [hoursMode]);

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 w-full animate-in fade-in duration-200 overflow-hidden space-y-1.5">
      
      {/* MINIMALIST COMPACT CONTROL BAR (Single tight row fitting all controls) */}
      <div className="flex-none p-2 sm:px-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        
        {/* Left Group: Nav + Date */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Daily Stepper (-1d / Hoje / +1d) */}
          <div className="flex items-center gap-0.5 bg-emerald-50/90 dark:bg-emerald-950/80 p-0.5 rounded-lg border border-emerald-200/70 dark:border-emerald-800/70">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded-md hover:bg-emerald-600 hover:text-white text-emerald-900 dark:text-emerald-200 transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-extrabold"
              title="Voltar 1 Dia (-1d)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">-1d</span>
            </button>
            <button
              onClick={handleToday}
              className="px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700 transition-all cursor-pointer"
              title="Ir para a Data de Hoje"
            >
              Hoje
            </button>
            <button
              onClick={handleNextDay}
              className="p-1 rounded-md hover:bg-emerald-600 hover:text-white text-emerald-900 dark:text-emerald-200 transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-extrabold"
              title="Avançar 1 Dia (+1d)"
            >
              <span className="hidden sm:inline">+1d</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Period Jump Stepper (Mês/Semana Jump) */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={handlePrevPeriod}
              className="px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-emerald-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 dark:text-emerald-300 transition-colors cursor-pointer text-[10px] font-bold"
              title={viewMode === 'month' ? 'Mês Anterior' : viewMode === 'week' ? 'Semana Anterior' : 'Dia Anterior'}
            >
              « {viewMode === 'month' ? 'Mês' : 'Sem'}
            </button>
            <button
              onClick={handleNextPeriod}
              className="px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-emerald-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950 text-slate-600 dark:text-emerald-300 transition-colors cursor-pointer text-[10px] font-bold"
              title={viewMode === 'month' ? 'Próximo Mês' : viewMode === 'week' ? 'Próxima Semana' : 'Próximo Dia'}
            >
              {viewMode === 'month' ? 'Mês' : 'Sem'} »
            </button>
          </div>

          {/* Full Date Display */}
          <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white capitalize truncate min-w-[140px]">
            {formattedFullDate}
          </span>

          {/* Always Visible Conflict Button */}
          <button
            onClick={() => {
              playSlotSelectedTone();
              setIsConflictsModalOpen(true);
              if (totalConflictsCount > 0) {
                setShowConflictsOnly(true);
              }
            }}
            className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer ${
              totalConflictsCount > 0
                ? showConflictsOnly
                  ? 'bg-rose-600 text-white shadow-xs animate-pulse ring-2 ring-rose-400'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200'
                : 'bg-emerald-100/70 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800/60 hover:bg-emerald-200/60'
            }`}
            title={totalConflictsCount > 0 ? "Clique para abrir a Central de Conflitos e filtrar agenda" : "Nenhum conflito detectado - Clique para checar alocação de frota"}
          >
            <ShieldAlert className={`w-3 h-3 ${totalConflictsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
            <span>{totalConflictsCount} {totalConflictsCount === 1 ? 'conflito' : 'conflitos'}</span>
          </button>
        </div>

        {/* Center Group: View Mode Switcher */}
        <div className="flex items-center gap-1 p-0.5 bg-emerald-50/80 dark:bg-[#041c14] rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
          <button
            onClick={() => { playSlotSelectedTone(); setViewMode('week'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
              viewMode === 'week'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => { playSlotSelectedTone(); setViewMode('month'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
              viewMode === 'month'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Mês
          </button>
          <button
            onClick={() => { playSlotSelectedTone(); setViewMode('timeline'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
              viewMode === 'timeline'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Recursos
          </button>
          <button
            onClick={() => { playSlotSelectedTone(); setViewMode('list'); }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-extrabold transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
            }`}
          >
            Lista ({filteredOrders.length})
          </button>
        </div>

        {/* Right Group: Filters & Action */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Hours Window Toggle (Week View) */}
          {viewMode === 'week' && (
            <button
              onClick={() => setHoursMode(prev => prev === 'OPERATIONAL' ? 'FULL' : 'OPERATIONAL')}
              className="px-2 py-1 rounded-lg border border-emerald-200/80 dark:border-emerald-800/80 text-[10px] font-bold bg-white dark:bg-[#072a1e] text-emerald-900 dark:text-emerald-200 hover:bg-emerald-50 cursor-pointer transition-colors"
              title={hoursMode === 'OPERATIONAL' ? 'Alternar para 24 Horas' : 'Alternar para Horário de Voo (06h - 18h)'}
            >
              {hoursMode === 'OPERATIONAL' ? '☀️ 06h - 18h' : '🌙 24 Horas'}
            </button>
          )}

          {/* Quick Search */}
          <div className="relative w-28 sm:w-36">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-2 py-1 rounded-lg bg-slate-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 text-[11px] text-slate-800 dark:text-emerald-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Pilot Dropdown */}
          <select
            value={selectedPilotFilter}
            onChange={(e) => setSelectedPilotFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 rounded-lg text-[10px] font-bold text-slate-700 dark:text-emerald-200 cursor-pointer"
          >
            <option value="ALL">👨‍✈️ Pilotos</option>
            {pilots.map(p => (
              <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>
            ))}
          </select>

          {/* Drone Dropdown */}
          <select
            value={selectedDroneFilter}
            onChange={(e) => setSelectedDroneFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/70 rounded-lg text-[10px] font-bold text-slate-700 dark:text-emerald-200 cursor-pointer"
          >
            <option value="ALL">🛸 Drones</option>
            {drones.map(d => (
              <option key={d.id} value={d.id}>{d.modelName.replace('DJI Agras ', '')}</option>
            ))}
          </select>

          {/* Audio toggle */}
          <button
            onClick={handleToggleSound}
            className={`p-1 rounded-lg border text-xs transition-colors cursor-pointer ${
              soundActive
                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
            title={soundActive ? 'Som Ativado' : 'Som Mudo'}
          >
            {soundActive ? <Volume2 className="w-3.5 h-3.5 text-emerald-600" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* New Schedule Button */}
          <button
            onClick={() => handleOpenNewModal()}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] shadow-2xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agendar</span>
          </button>
        </div>
      </div>

      {/* Active Conflict Filter Banner */}
      {showConflictsOnly && (
        <div className="flex-none px-3 py-1.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/40 border border-rose-500/30 dark:border-rose-800/50 flex items-center justify-between gap-2 text-xs text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-2 font-bold truncate">
            <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse shrink-0" />
            <span className="truncate">
              Exibindo apenas agendamentos com conflito de horário ou recurso ({filteredOrders.length} OSs afetadas).
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsConflictsModalOpen(true)}
              className="px-2.5 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[10px] cursor-pointer shadow-2xs transition-colors"
            >
              Abrir Painel
            </button>
            <button
              onClick={() => setShowConflictsOnly(false)}
              className="px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-emerald-950 hover:bg-slate-300 text-slate-700 dark:text-emerald-200 font-bold text-[10px] cursor-pointer transition-colors"
            >
              Limpar Filtro
            </button>
          </div>
        </div>
      )}

      {/* MAIN VIEWPORT-FITTING CALENDAR GRID BODY */}
      <div className="flex-1 bg-white dark:bg-[#072a1e] rounded-xl border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs overflow-hidden flex flex-col min-h-0">
        
        {/* VIEW MODE 1: WEEK CALENDAR (Ultra-Compact Viewport-Fitting Week Grid) */}
        {viewMode === 'week' && (
          <div className="flex-1 overflow-x-auto touch-scroll scrollbar-none flex flex-col min-h-0">
            <div className="flex flex-col h-full min-h-0 min-w-[580px] sm:min-w-0">
              {/* Week Header Row */}
              <div className="grid grid-cols-8 border-b border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/60 shrink-0">
                <div className="p-1.5 text-center border-r border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hora</span>
                </div>
                {weekDays.map((d, i) => {
                  const isToday = d.dateStr === new Date().toISOString().split('T')[0];
                  const dayOrders = filteredOrders.filter(o => o.scheduledDate === d.dateStr);

                  return (
                    <div 
                      key={i} 
                      className={`p-1 text-center border-r last:border-r-0 border-emerald-200/60 dark:border-emerald-800/60 cursor-pointer hover:bg-emerald-100/50 dark:hover:bg-emerald-900/50 transition-colors ${
                        isToday ? 'bg-emerald-100/60 dark:bg-emerald-950/90 font-bold' : ''
                      }`}
                      onClick={() => handleOpenNewModal(d.dateStr, '07:00')}
                      title="Clique para agendar neste dia"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-[10px] uppercase font-extrabold text-slate-500 dark:text-emerald-300/80">
                          {d.dayName}
                        </span>
                        <span className={`text-xs font-black px-1 rounded ${
                          isToday ? 'bg-emerald-600 text-white' : 'text-slate-800 dark:text-emerald-100'
                        }`}>
                          {d.dayNumber}
                        </span>
                      </div>
                      {dayOrders.length > 0 && (
                        <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 truncate block">
                          {dayOrders.length} {dayOrders.length === 1 ? 'voo' : 'voos'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Scrollable Hourly Grid with Continuous Event Blocks (Auto-Centered Vertically) */}
              <div ref={hourlyGridRef} className="flex-1 overflow-y-auto relative text-xs">
                <div className="grid grid-cols-8 relative min-h-full">
                  {/* Time Labels Column */}
                  <div className="border-r border-emerald-200/60 dark:border-emerald-800/60 flex flex-col shrink-0">
                    {visibleHours.map((hour) => {
                      const timeSlotStr = `${String(hour).padStart(2, '0')}:00`;
                      const isMorningGolden = hour >= 6 && hour <= 9;
                      const isLateGolden = hour >= 16 && hour <= 17;

                      return (
                        <div
                          key={hour}
                          className={`h-[44px] p-1 border-b border-slate-100 dark:border-emerald-900/40 text-center flex flex-col justify-center shrink-0 ${
                            isMorningGolden || isLateGolden ? 'bg-amber-50/60 dark:bg-amber-950/20' : 'bg-slate-50/50 dark:bg-emerald-950/30'
                          }`}
                        >
                          <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                            {timeSlotStr}
                          </span>
                          {(isMorningGolden || isLateGolden) && (
                            <span className="text-[8px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-0.5">
                              ✨ Ouro
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* 7 Day Columns with Continuous Event Overlays */}
                  {weekDays.map((d, dayIdx) => {
                    const dayOrders = filteredOrders.filter(o => o.scheduledDate === d.dateStr);

                    return (
                      <div
                        key={dayIdx}
                        className="border-r last:border-r-0 border-slate-100 dark:border-emerald-900/30 relative flex flex-col h-full min-h-0"
                      >
                        {/* Background Clickable Hourly Rows */}
                        {visibleHours.map((hour) => {
                          const timeSlotStr = `${String(hour).padStart(2, '0')}:00`;
                          const isMorningGolden = hour >= 6 && hour <= 9;
                          const isLateGolden = hour >= 16 && hour <= 17;

                          return (
                            <div
                              key={hour}
                              onClick={() => handleOpenNewModal(d.dateStr, timeSlotStr)}
                              className={`h-[44px] border-b border-slate-100 dark:border-emerald-900/30 transition-colors cursor-pointer ${
                                isMorningGolden || isLateGolden
                                  ? 'bg-amber-50/15 dark:bg-amber-950/10 hover:bg-emerald-50/60 dark:hover:bg-emerald-900/40'
                                  : 'hover:bg-emerald-50/50 dark:hover:bg-emerald-950/50'
                              }`}
                            />
                          );
                        })}

                        {/* Continuous Scheduled Event Blocks Overlay */}
                        <div className="absolute inset-0 pointer-events-none p-0.5">
                          {dayOrders.map((order) => {
                            const startMin = timeStringToMinutes(order.startTime || '07:00');
                            const rawEndMin = timeStringToMinutes(order.endTime || '09:30');
                            const endMin = Math.max(startMin + 30, rawEndMin);

                            const firstHour = visibleHours[0] ?? 6;
                            const firstMin = firstHour * 60;

                            const startOffsetMin = Math.max(0, startMin - firstMin);
                            const durationMin = Math.max(25, endMin - startMin);

                            const topPx = (startOffsetMin / 60) * 44; // 44px per hour slot
                            const heightPx = Math.max(26, (durationMin / 60) * 44 - 2);

                            // Overlap Detection
                            const overlapping = dayOrders.filter(other => {
                              const oStart = timeStringToMinutes(other.startTime || '07:00');
                              const oEnd = Math.max(oStart + 30, timeStringToMinutes(other.endTime || '09:30'));
                              return oStart < endMin && oEnd > startMin;
                            });

                            const overlapIndex = overlapping.findIndex(o => o.id === order.id);
                            const overlapCount = Math.max(1, overlapping.length);
                            const widthPct = 100 / overlapCount;
                            const leftPct = (overlapIndex >= 0 ? overlapIndex : 0) * widthPct;

                            const hasConflict = conflictsMap.has(order.id);

                            return (
                              <div
                                key={order.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenEditModal(order);
                                }}
                                style={{
                                  top: `${topPx}px`,
                                  height: `${heightPx}px`,
                                  left: `${leftPct}%`,
                                  width: `calc(${widthPct}% - 2px)`,
                                }}
                                className={`absolute z-10 p-1.5 rounded-lg text-left transition-all hover:scale-[1.01] hover:z-20 cursor-pointer border text-[10px] shadow-sm pointer-events-auto flex flex-col justify-between overflow-hidden ${
                                  hasConflict
                                    ? 'bg-rose-500 text-white border-rose-600 font-bold animate-pulse'
                                    : order.status === 'OPERATING'
                                    ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-md'
                                    : order.status === 'COMPLETED'
                                    ? 'bg-slate-200 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                    : 'bg-emerald-600 dark:bg-emerald-700 text-white border-emerald-700 dark:border-emerald-600 font-bold'
                                }`}
                                title={`${order.code} • ${order.startTime} às ${order.endTime}\n${order.plotName} (${order.pilotName.split(' ')[0]} / ${order.droneModel.replace('DJI Agras ', '')})`}
                              >
                                <div className="flex items-center justify-between gap-1 leading-tight font-black">
                                  <span className="truncate">{order.code}</span>
                                  <span className="text-[9px] opacity-95 font-mono shrink-0">
                                    {order.startTime} - {order.endTime}
                                  </span>
                                </div>
                                <div className="text-[9.5px] opacity-90 truncate font-semibold">
                                  {order.plotName}
                                </div>
                                {heightPx > 40 && (
                                  <div className="text-[9px] opacity-80 truncate font-normal">
                                    👨‍✈️ {order.pilotName.split(' ')[0]} • 🛸 {order.droneModel.replace('DJI Agras ', '')}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW MODE 2: MONTH VIEW (Minimalist Fits-in-Viewport Month Grid) */}
        {viewMode === 'month' && (
          <div className="flex flex-col h-full min-h-0">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/60 text-center font-black text-[10px] uppercase text-slate-500 dark:text-emerald-300/80 py-1.5 shrink-0">
              <div>Dom</div>
              <div>Seg</div>
              <div>Ter</div>
              <div>Qua</div>
              <div>Qui</div>
              <div>Sex</div>
              <div>Sáb</div>
            </div>

            {/* Month Cells Grid */}
            <div className="flex-1 grid grid-cols-7 grid-rows-5 sm:grid-rows-6 divide-x divide-y divide-slate-100 dark:divide-emerald-900/40 min-h-0">
              {monthData.map((cell, idx) => {
                const dayOrders = filteredOrders.filter(o => o.scheduledDate === cell.dateStr);
                const hasConflictsToday = dayOrders.some(o => conflictsMap.has(o.id));
                const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

                return (
                  <div
                    key={idx}
                    onClick={() => handleOpenNewModal(cell.dateStr, '07:00')}
                    className={`p-1 transition-colors cursor-pointer relative group flex flex-col justify-between overflow-hidden ${
                      cell.isCurrentMonth
                        ? 'bg-white dark:bg-[#072a1e] hover:bg-emerald-50/40 dark:hover:bg-emerald-900/30'
                        : 'bg-slate-50/60 dark:bg-emerald-950/30 text-slate-400 dark:text-slate-600'
                    } ${isToday ? 'ring-1.5 ring-emerald-500 ring-inset' : ''}`}
                  >
                    <div className="flex items-center justify-between leading-none">
                      <span className={`text-[10px] font-black ${
                        isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {cell.dayNumber}
                      </span>

                      {hasConflictsToday && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" title="Conflito neste dia" />
                      )}
                    </div>

                    {/* Day Badges */}
                    <div className="space-y-0.5 flex-1 overflow-hidden my-0.5">
                      {dayOrders.slice(0, 2).map(order => {
                        const hasConflict = conflictsMap.has(order.id);
                        return (
                          <div
                            key={order.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(order);
                            }}
                            className={`px-1 py-0.2 rounded text-[9px] font-extrabold truncate flex items-center justify-between border ${
                              hasConflict
                                ? 'bg-rose-500 text-white border-rose-600'
                                : order.status === 'OPERATING'
                                ? 'bg-emerald-600 text-white border-emerald-700'
                                : 'bg-emerald-50 text-emerald-950 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
                            }`}
                          >
                            <span className="truncate">{order.startTime || '07:00'} {order.code}</span>
                          </div>
                        );
                      })}
                      {dayOrders.length > 2 && (
                        <div className="text-[8px] font-bold text-slate-400">
                          +{dayOrders.length - 2} voo(s)
                        </div>
                      )}
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[8px] font-bold text-emerald-600 dark:text-emerald-400 text-right">
                      + Agendar
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 3: TIMELINE / RESOURCE ALLOCATION (Minimalist Resource Matrix) */}
        {viewMode === 'timeline' && (
          <div className="flex flex-col h-full min-h-0 p-3 space-y-3 overflow-y-auto">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-xs font-black uppercase text-emerald-950 dark:text-emerald-100">
                Alocação de Recursos ({currentDate.toISOString().split('T')[0]}):
              </span>
              <div className="flex items-center p-0.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                <button
                  onClick={() => setTimelineResource('pilot')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    timelineResource === 'pilot' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  👨‍✈️ Pilotos ({pilots.length})
                </button>
                <button
                  onClick={() => setTimelineResource('drone')}
                  className={`px-2.5 py-0.5 rounded text-[11px] font-bold transition-all cursor-pointer ${
                    timelineResource === 'drone' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  🛸 Drones ({drones.length})
                </button>
              </div>
            </div>

            {/* Resource Bars List */}
            <div className="space-y-2 flex-1 overflow-y-auto">
              {(timelineResource === 'pilot' ? pilots : drones).map((resource) => {
                const resourceId = resource.id;
                const resourceName = 'name' in resource ? resource.name : resource.modelName;
                const resourceSub = 'deceaLicense' in resource ? resource.deceaLicense : resource.anacPrefix;
                const dayStr = currentDate.toISOString().split('T')[0];
                const resourceOrders = filteredOrders.filter(o => {
                  if (o.scheduledDate !== dayStr) return false;
                  return timelineResource === 'pilot' ? o.pilotId === resourceId : o.droneId === resourceId;
                });

                return (
                  <div key={resourceId} className="p-2 rounded-xl border border-emerald-200/70 dark:border-emerald-800/70 bg-emerald-50/30 dark:bg-emerald-950/30 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="font-extrabold text-emerald-950 dark:text-white flex items-center gap-1.5">
                        <span>{timelineResource === 'pilot' ? '👨‍✈️' : '🛸'} {resourceName}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({resourceSub})</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500">
                        {resourceOrders.length} {resourceOrders.length === 1 ? 'missão' : 'missões'}
                      </span>
                    </div>

                    {/* Timeline 24h Bar */}
                    <div className="relative h-7 bg-slate-100 dark:bg-emerald-950/80 rounded-lg overflow-hidden flex items-center">
                      {Array.from({ length: 24 }).map((_, h) => (
                        <div
                          key={h}
                          style={{ left: `${(h / 24) * 100}%` }}
                          className="absolute top-0 bottom-0 border-l border-slate-200/50 dark:border-emerald-800/40 text-[8px] text-slate-400 pl-0.5 pointer-events-none select-none"
                        >
                          {h % 3 === 0 ? `${h}h` : ''}
                        </div>
                      ))}

                      {resourceOrders.map(order => {
                        const startMin = timeStringToMinutes(order.startTime || '07:00');
                        const endMin = timeStringToMinutes(order.endTime || '09:30');
                        const leftPct = Math.max(0, Math.min(100, (startMin / (24 * 60)) * 100));
                        const widthPct = Math.max(3, Math.min(100 - leftPct, ((endMin - startMin) / (24 * 60)) * 100));
                        const hasConflict = conflictsMap.has(order.id);

                        return (
                          <div
                            key={order.id}
                            onClick={() => handleOpenEditModal(order)}
                            style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                            className={`absolute top-1 bottom-1 rounded px-1.5 flex items-center justify-between text-[10px] font-black shadow-2xs cursor-pointer transition-all hover:scale-[1.02] ${
                              hasConflict ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-600 text-white'
                            }`}
                            title={`${order.code} • ${order.startTime} às ${order.endTime} (${order.plotName})`}
                          >
                            <span className="truncate">{order.code} - {order.plotName}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW MODE 4: LIST VIEW (Ultra-Clean Viewport Table) */}
        {viewMode === 'list' && (
          <div className="flex flex-col h-full min-h-0 overflow-hidden">
            <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/60 border-b border-emerald-200/80 dark:border-emerald-800/80 grid grid-cols-6 font-black text-[10px] uppercase text-slate-500 dark:text-emerald-300/80 shrink-0">
              <span>Missão / Código</span>
              <span>Talhão & Área</span>
              <span>Tripulação & Drone</span>
              <span>Data & Janela</span>
              <span>Viabilidade Clima</span>
              <span className="text-right">Ações</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-emerald-900/30 text-xs">
              {filteredOrders.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-medium">
                  Nenhum agendamento encontrado para os filtros selecionados.
                </div>
              ) : (
                filteredOrders.map(order => {
                  const hasConflict = conflictsMap.has(order.id);

                  return (
                    <div 
                      key={order.id}
                      onClick={() => handleOpenEditModal(order)}
                      className={`p-2.5 grid grid-cols-6 items-center gap-2 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer ${
                        hasConflict ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                      }`}
                    >
                      <div>
                        <span className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1">
                          {order.code}
                          {hasConflict && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                        </span>
                        <span className="text-[10px] text-slate-500 block truncate">{order.farmName}</span>
                      </div>

                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block truncate">{order.plotName}</span>
                        <span className="text-[10px] text-slate-500">{order.crop} • {order.targetHectares} ha</span>
                      </div>

                      <div className="text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block truncate">👨‍✈️ {order.pilotName.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-500 truncate block">🛸 {order.droneModel.replace('DJI Agras ', '')}</span>
                      </div>

                      <div className="text-[11px]">
                        <span className="font-bold text-slate-900 dark:text-emerald-100 block">📅 {formatDateBR(order.scheduledDate)}</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">⏰ {order.startTime || '07:00'} - {order.endTime || '09:30'}</span>
                      </div>

                      <div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                          order.weatherFeasibility?.isAllowed ?? true
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          <Wind className="w-3 h-3" />
                          <span>{order.weatherFeasibility?.isAllowed ?? true ? 'Clima OK' : 'Restrição'}</span>
                        </span>
                      </div>

                      <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenEditModal(order)}
                          className="p-1 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          className="p-1 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                          title="Cancelar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

      </div>

      {/* Schedule Order Creation / Editing Modal */}
      <ScheduleOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveOrder={handleSaveOrder}
        onDeleteOrder={(orderId) => handleDeleteOrder(orderId)}
        existingOrders={orders}
        plots={plots}
        drones={drones}
        pilots={pilots}
        assistants={assistants}
        currentUser={currentUser}
        theme={theme}
        initialDate={modalInitialDate}
        initialStartTime={modalInitialStartTime}
        editingOrder={editingOrder}
        clients={clients}
      />

      {/* Schedule Conflicts Resolution Modal */}
      <ScheduleConflictsModal
        isOpen={isConflictsModalOpen}
        onClose={() => setIsConflictsModalOpen(false)}
        orders={orders}
        conflictsMap={conflictsMap}
        onSelectOrderToEdit={handleOpenEditModal}
        onJumpToDate={handleJumpToDateStr}
        onAutoResolveConflict={handleAutoResolveConflict}
        pilots={pilots}
        drones={drones}
      />

    </div>
  );
};
