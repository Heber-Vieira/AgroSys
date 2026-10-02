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
  ArrowRight,
  Sprout,
  Target,
  Check,
  Maximize2,
  DollarSign,
  TrendingUp,
  Users
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
import { formatDateBR, formatLocalDate, parseLocalDate, formatBRL, formatDecimal } from '../utils/formatters';
import { filterOrdersForUser, isServiceOrderAssignedToUser, doNamesMatch, isMasterUser, isCompanyAdmin } from '../utils/userPermissions';

interface ScheduleCalendarViewProps {
  currentUser: UserProfile;
  theme?: WhiteLabelTheme;
  orders: ServiceOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  plots: FarmPlot[];
  setPlots?: React.Dispatch<React.SetStateAction<FarmPlot[]>>;
  drones: AgriculturalDrone[];
  pilots: CrewPilot[];
  assistants: CrewAssistant[];
  clients?: ClientProducer[];
  setClients?: React.Dispatch<React.SetStateAction<ClientProducer[]>>;
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
  setPlots,
  drones,
  pilots,
  assistants,
  clients,
  setClients,
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

  // Executive RBAC check (Master or Company Admin ONLY)
  const isExecutive = isMasterUser(currentUser) || isCompanyAdmin(currentUser) || currentUser.role === 'ADMIN';

  // Future Revenue Forecast Panel State (Admin & Master Exclusive)
  const [showFutureRevenuePanel, setShowFutureRevenuePanel] = useState<boolean>(false);
  const [forecastDaysRange, setForecastDaysRange] = useState<'7' | '15' | '30' | '60' | '90' | 'CUSTOM'>('30');
  const [forecastStartDate, setForecastStartDate] = useState<string>(() => formatLocalDate(new Date()));
  const [forecastEndDate, setForecastEndDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return formatLocalDate(d);
  });
  const [forecastPilotId, setForecastPilotId] = useState<string>('ALL');
  const [forecastDroneId, setForecastDroneId] = useState<string>('ALL');

  // Operational hours filter ('OPERATIONAL' 06-18h vs 'FULL' 00-23h)
  const [hoursMode, setHoursMode] = useState<'OPERATIONAL' | 'FULL'>('OPERATIONAL');

  // 1. Data Isolation & RBAC: Precision Filtering for Current User (Pilots/Assistants/Clients)
  const userScopedOrders = useMemo(() => {
    return filterOrdersForUser(orders, currentUser, pilots, assistants);
  }, [orders, currentUser, pilots, assistants]);

  // Future Revenue Projection Calculation for Agenda Operacional
  const futureCalendarRevenueProjection = useMemo(() => {
    if (!isExecutive) return null;

    const todayStr = formatLocalDate(new Date());

    const matchingOrders = userScopedOrders.filter(order => {
      // Exclude completed or cancelled
      if (order.status === 'COMPLETED' || order.status === 'CANCELLED') {
        return false;
      }

      // Filter Date Range
      const dateStr = order.scheduledDate || todayStr;
      if (forecastDaysRange !== 'CUSTOM') {
        const days = parseInt(forecastDaysRange, 10) || 30;
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + days);
        const maxDateStr = formatLocalDate(maxDate);
        if (dateStr < todayStr || dateStr > maxDateStr) {
          return false;
        }
      } else {
        if (forecastStartDate && dateStr < forecastStartDate) return false;
        if (forecastEndDate && dateStr > forecastEndDate) return false;
      }

      // Filter Pilot
      if (forecastPilotId !== 'ALL' && order.pilotId !== forecastPilotId) {
        return false;
      }

      // Filter Drone
      if (forecastDroneId !== 'ALL' && order.droneId !== forecastDroneId) {
        return false;
      }

      return true;
    });

    const totalGrossRevenue = matchingOrders.reduce((acc, o) => acc + (o.totalGrossValue || ((o.targetHectares || 30) * (o.baseRatePerHa || 75))), 0);
    const totalTargetHectares = matchingOrders.reduce((acc, o) => acc + (o.targetHectares || 0), 0);
    const osCount = matchingOrders.length;
    const avgTicketPerOS = osCount > 0 ? totalGrossRevenue / osCount : 0;
    const estimatedPilotCommissions = matchingOrders.reduce((acc, o) => acc + (o.pilotCommission || 0), 0);

    // Group by Pilot
    const pilotMap = new Map<string, { id: string; name: string; count: number; ha: number; gross: number }>();
    matchingOrders.forEach(o => {
      const pId = o.pilotId || 'unassigned';
      const pName = o.pilotName || 'Não Alocado';
      const val = o.totalGrossValue || ((o.targetHectares || 30) * (o.baseRatePerHa || 75));
      const existing = pilotMap.get(pId) || { id: pId, name: pName, count: 0, ha: 0, gross: 0 };
      existing.count += 1;
      existing.ha += (o.targetHectares || 0);
      existing.gross += val;
      pilotMap.set(pId, existing);
    });

    // Group by Drone
    const droneMap = new Map<string, { id: string; model: string; count: number; ha: number; gross: number }>();
    matchingOrders.forEach(o => {
      const dId = o.droneId || 'unassigned';
      const dModel = o.droneModel || 'Não Alocado';
      const val = o.totalGrossValue || ((o.targetHectares || 30) * (o.baseRatePerHa || 75));
      const existing = droneMap.get(dId) || { id: dId, model: dModel, count: 0, ha: 0, gross: 0 };
      existing.count += 1;
      existing.ha += (o.targetHectares || 0);
      existing.gross += val;
      droneMap.set(dId, existing);
    });

    return {
      orders: matchingOrders,
      totalGrossRevenue,
      totalTargetHectares,
      osCount,
      avgTicketPerOS,
      estimatedPilotCommissions,
      byPilot: Array.from(pilotMap.values()).sort((a, b) => b.gross - a.gross),
      byDrone: Array.from(droneMap.values()).sort((a, b) => b.gross - a.gross),
    };
  }, [
    userScopedOrders,
    isExecutive,
    forecastDaysRange,
    forecastStartDate,
    forecastEndDate,
    forecastPilotId,
    forecastDroneId,
  ]);

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
    return formatLocalDate(currentDate);
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
    setModalInitialDate(dateStr || formatLocalDate(currentDate));
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
    setCurrentDate(parseLocalDate(dateStr));
    playSlotSelectedTone();
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
        dateStr: formatLocalDate(d),
        dayNumber: dayNum,
        isCurrentMonth: false,
        dateObj: d,
      });
    }

    // Current month days
    for (let dayNum = 1; dayNum <= totalDaysInMonth; dayNum++) {
      const d = new Date(year, month, dayNum);
      days.push({
        dateStr: formatLocalDate(d),
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
        dateStr: formatLocalDate(d),
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
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + i);
      days.push({
        dateStr: formatLocalDate(d),
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

          {/* Future Revenue Projection Button (Admins & Masters Only) */}
          {isExecutive && (
            <button
              onClick={() => {
                playSlotSelectedTone();
                setShowFutureRevenuePanel(prev => !prev);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 transition-all cursor-pointer border shrink-0 ${
                showFutureRevenuePanel
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-300'
                  : 'bg-emerald-900/90 hover:bg-emerald-800 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:text-amber-200'
              }`}
              title="Exibir/Ocultar Projeção de Faturamento Futuro (Acesso Exclusivo Executivo/Admin)"
            >
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span>Faturamento Futuro</span>
            </button>
          )}

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

      {/* Future Revenue Projection Drawer (Admin & Master Exclusive) */}
      {isExecutive && showFutureRevenuePanel && futureCalendarRevenueProjection && (
        <div className="flex-none p-4 rounded-2xl bg-gradient-to-br from-[#06382a] via-[#04281e] to-slate-950 border border-emerald-500/40 shadow-xl space-y-3 text-white animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-500/20 pb-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 flex items-center gap-1 shadow-2xs">
                <DollarSign className="w-3 h-3" />
                Projeção Financeira Futura (Agenda Operacional)
              </span>
              <span className="text-[11px] text-emerald-300 font-bold">
                {isMasterUser(currentUser) ? '🌐 Multi-Empresa' : `🏢 Isolação: ${currentUser.companyId || 'Empresa'}`}
              </span>
            </div>

            {/* Controls: Range, Pilot, Drone */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <select
                value={forecastDaysRange}
                onChange={(e) => setForecastDaysRange(e.target.value as any)}
                className="px-2.5 py-1 bg-slate-950 border border-emerald-500/40 rounded-lg text-[10.5px] font-bold text-emerald-200 cursor-pointer"
              >
                <option value="7">Próximos 7 Dias</option>
                <option value="15">Próximos 15 Dias</option>
                <option value="30">Próximos 30 Dias</option>
                <option value="60">Próximos 60 Dias</option>
                <option value="90">Próximos 90 Dias</option>
                <option value="CUSTOM">📅 Personalizado</option>
              </select>

              {forecastDaysRange === 'CUSTOM' && (
                <div className="flex items-center gap-1 bg-slate-950 border border-emerald-500/40 p-0.5 rounded-lg text-[10px]">
                  <input
                    type="date"
                    value={forecastStartDate}
                    onChange={(e) => setForecastStartDate(e.target.value)}
                    className="bg-transparent text-emerald-200 font-semibold focus:outline-none"
                  />
                  <span className="text-slate-400">até</span>
                  <input
                    type="date"
                    value={forecastEndDate}
                    onChange={(e) => setForecastEndDate(e.target.value)}
                    className="bg-transparent text-emerald-200 font-semibold focus:outline-none"
                  />
                </div>
              )}

              <select
                value={forecastPilotId}
                onChange={(e) => setForecastPilotId(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-emerald-500/40 rounded-lg text-[10.5px] font-bold text-emerald-200 cursor-pointer"
              >
                <option value="ALL">👨‍✈️ Todos Pilotos</option>
                {pilots.map(p => (
                  <option key={p.id} value={p.id}>{p.name.split(' ')[0]}</option>
                ))}
              </select>

              <select
                value={forecastDroneId}
                onChange={(e) => setForecastDroneId(e.target.value)}
                className="px-2.5 py-1 bg-slate-950 border border-emerald-500/40 rounded-lg text-[10.5px] font-bold text-emerald-200 cursor-pointer"
              >
                <option value="ALL">🛸 Todos Drones</option>
                {drones.map(d => (
                  <option key={d.id} value={d.id}>{d.modelName.replace('DJI Agras ', '')}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFutureRevenuePanel(false)}
                className="px-2 py-0.5 text-[10px] font-bold text-slate-400 hover:text-white hover:underline ml-1 cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
          </div>

          {/* Metric Cards Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <div className="text-[10px] text-slate-400 font-semibold">Faturamento Futuro (R$)</div>
              <div className="text-lg font-black text-emerald-400">{formatBRL(futureCalendarRevenueProjection.totalGrossRevenue)}</div>
              <div className="text-[9px] text-emerald-300/80">Comissão Pilotos: {formatBRL(futureCalendarRevenueProjection.estimatedPilotCommissions)}</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <div className="text-[10px] text-slate-400 font-semibold">Área Agendada (ha)</div>
              <div className="text-lg font-black text-white">{formatDecimal(futureCalendarRevenueProjection.totalTargetHectares)} ha</div>
              <div className="text-[9px] text-slate-400">{futureCalendarRevenueProjection.osCount} Agendamentos Futuros</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30">
              <div className="text-[10px] text-slate-400 font-semibold">Ticket Médio por OS</div>
              <div className="text-lg font-black text-amber-300">{formatBRL(futureCalendarRevenueProjection.avgTicketPerOS)}</div>
              <div className="text-[9px] text-amber-200/70">Média de R$/Operação</div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-emerald-500/30 overflow-hidden">
              <div className="text-[10px] text-slate-400 font-semibold mb-1">Top Piloto & Drone</div>
              <div className="text-[10.5px] font-bold text-emerald-200 truncate">
                👨‍✈️ {futureCalendarRevenueProjection.byPilot[0]?.name || 'N/A'}: {formatBRL(futureCalendarRevenueProjection.byPilot[0]?.gross || 0)}
              </div>
              <div className="text-[10.5px] font-bold text-emerald-200 truncate">
                🛸 {futureCalendarRevenueProjection.byDrone[0]?.model || 'N/A'}: {formatBRL(futureCalendarRevenueProjection.byDrone[0]?.gross || 0)}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  const isToday = d.dateStr === formatLocalDate(new Date());
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
                            const matchedClient = clients?.find(c => c.id === order.clientId || c.name === order.clientName);
                            const districtLabel = order.district || matchedClient?.district || (order.cityState ? order.cityState.split(' - ')[0] : '');

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
                                className={`absolute z-10 p-2 rounded-xl text-left transition-all duration-200 hover:scale-[1.015] hover:z-30 cursor-pointer border text-xs shadow-md backdrop-blur-md pointer-events-auto flex flex-col justify-between overflow-hidden group ${
                                  hasConflict
                                    ? 'bg-gradient-to-br from-rose-950 via-red-900 to-rose-900 text-rose-100 border-rose-500/80 shadow-rose-950/50 animate-pulse'
                                    : order.status === 'OPERATING'
                                    ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-800 text-white border-emerald-400/60 shadow-emerald-950/40 ring-1 ring-emerald-400/30'
                                    : order.status === 'COMPLETED'
                                    ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-slate-200 border-slate-700/80 hover:border-emerald-500/50'
                                    : 'bg-gradient-to-br from-[#064e3b] via-[#04392b] to-[#022c22] text-emerald-50 border-emerald-500/40 hover:border-emerald-400/80 shadow-emerald-950/60 ring-1 ring-emerald-500/20'
                                }`}
                                title={`OS: ${order.code}\nCliente: ${order.clientName}\nDistrito: ${districtLabel || 'N/A'}\nCidade: ${order.cityState || 'N/A'}\nHorário: ${order.startTime} - ${order.endTime}\nFazenda/Talhão: ${order.farmName ? order.farmName + ' - ' : ''}${order.plotName} (${order.targetHectares || 0} ha)\nCultura: ${order.crop || 'N/A'}\nAlvo: ${order.targetPestOrGoal || 'Geral'}\nPiloto: ${order.pilotName}\nDrone: ${order.droneModel}`}
                              >
                                {/* HEADER ROW: OS Code + Time Badge */}
                                <div className="flex items-center justify-between gap-1 leading-none shrink-0">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[9.5px] font-black tracking-wide shrink-0 ${
                                      hasConflict
                                        ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                                        : order.status === 'OPERATING'
                                        ? 'bg-white/20 text-white border border-white/30 animate-pulse'
                                        : order.status === 'COMPLETED'
                                        ? 'bg-slate-700 text-slate-300'
                                        : 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/30'
                                    }`}>
                                      {order.code}
                                    </span>

                                    {order.status === 'OPERATING' && (
                                      <span className="inline-flex items-center px-1 py-0.2 text-[8px] font-extrabold uppercase bg-emerald-400 text-emerald-950 rounded-full animate-bounce shrink-0">
                                        Voo
                                      </span>
                                    )}
                                  </div>

                                  <span className="text-[9.5px] font-mono font-bold tracking-tight opacity-90 shrink-0 bg-black/30 px-1.5 py-0.5 rounded">
                                    {order.startTime} - {order.endTime}
                                  </span>
                                </div>

                                {/* BODY SECTION: Client Name, District Location, Plot, Hectares */}
                                {heightPx >= 44 && (
                                  <div className="my-1 space-y-1 min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
                                    {/* Line 1: Nome do Cliente & Nome do Distrito */}
                                    <div className="flex items-center justify-between gap-1 text-[11px] font-black text-white leading-tight min-w-0">
                                      <span className="truncate flex items-center gap-1 min-w-0">
                                        <User className="w-3 h-3 text-emerald-400 shrink-0 inline" />
                                        <span className="truncate">{order.clientName || 'Cliente'}</span>
                                      </span>
                                      {districtLabel && (
                                        <span className="text-[9.5px] font-extrabold text-amber-300 truncate shrink-0 max-w-[55%] flex items-center gap-0.5 bg-black/40 px-1.5 py-0.3 rounded border border-amber-400/30 shadow-2xs">
                                          <MapPin className="w-2.5 h-2.5 text-amber-400 shrink-0 inline" />
                                          <span className="truncate">{districtLabel}</span>
                                        </span>
                                      )}
                                    </div>

                                    {/* Line 2: Talhão & Área (ha) */}
                                    <div className="flex items-center justify-between gap-1.5 text-[10px] font-bold text-emerald-100 min-w-0">
                                      <span className="truncate flex items-center gap-1 min-w-0">
                                        <span className="opacity-75 text-[9px]">Talhão:</span>
                                        <span className="font-extrabold text-white truncate">{order.plotName}</span>
                                      </span>
                                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-200 border border-emerald-500/40 text-[9.5px] font-mono font-black shrink-0 shadow-2xs">
                                        <Maximize2 className="w-2.5 h-2.5 text-amber-400 shrink-0 inline" />
                                        {order.targetHectares || 0} ha
                                      </span>
                                    </div>

                                    {/* Line 3: Cultura & Alvo (Height >= 85px) */}
                                    {heightPx >= 85 && (
                                      <div className="flex items-center gap-1.5 text-[9px] font-semibold text-emerald-200/90 min-w-0 pt-0.5">
                                        {order.crop && (
                                          <span className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded shrink-0">
                                            <Sprout className="w-2.5 h-2.5 text-emerald-400 inline" />
                                            {order.crop}
                                          </span>
                                        )}
                                        {order.targetPestOrGoal && (
                                          <span className="flex items-center gap-1 bg-black/30 px-1.5 py-0.5 rounded truncate min-w-0">
                                            <Target className="w-2.5 h-2.5 text-amber-400 shrink-0 inline" />
                                            <span className="truncate">{order.targetPestOrGoal}</span>
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* FOOTER SECTION: Piloto & Drone (Height >= 65px) */}
                                {heightPx >= 65 && (
                                  <div className="pt-1 border-t border-white/10 flex items-center justify-between gap-1 text-[9px] font-medium text-emerald-100/90 shrink-0">
                                    <div className="flex items-center gap-1 min-w-0 truncate">
                                      <span className="truncate bg-black/30 px-1.5 py-0.5 rounded font-semibold">
                                        👨‍✈️ {order.pilotName ? order.pilotName.split(' ')[0] : 'Piloto'}
                                      </span>
                                      <span className="truncate bg-black/30 px-1.5 py-0.5 rounded font-semibold">
                                        🛸 {order.droneModel ? order.droneModel.replace('DJI Agras ', '') : 'Drone'}
                                      </span>
                                    </div>

                                    {heightPx >= 105 && (
                                      <span className="hidden sm:inline-flex items-center gap-0.5 text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-500/30 font-bold shrink-0">
                                        🍃 Clima OK
                                      </span>
                                    )}
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
                const isToday = cell.dateStr === formatLocalDate(new Date());

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
                            className={`px-1.5 py-0.5 rounded-md text-[8.5px] font-bold truncate flex items-center justify-between border transition-all hover:scale-[1.02] shadow-2xs ${
                              hasConflict
                                ? 'bg-rose-950 text-rose-200 border-rose-600 animate-pulse'
                                : order.status === 'OPERATING'
                                ? 'bg-emerald-600 text-white border-emerald-400 font-extrabold'
                                : order.status === 'COMPLETED'
                                ? 'bg-slate-800 text-slate-300 border-slate-700'
                                : 'bg-[#04392b] text-emerald-100 border-emerald-600/50 hover:border-emerald-400'
                            }`}
                            title={`OS: ${order.code} • ${order.startTime} às ${order.endTime}\n${order.plotName}`}
                          >
                            <span className="truncate flex items-center gap-1">
                              <span className="font-mono text-[8px] opacity-80">{order.startTime || '07:00'}</span>
                              <span className="font-extrabold">{order.code}</span>
                            </span>
                            <span className="opacity-75 text-[8px] truncate ml-1 hidden xl:inline">{order.plotName}</span>
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
                Alocação de Recursos ({formatLocalDate(currentDate)}):
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
                const dayStr = formatLocalDate(currentDate);
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
        setClients={setClients}
        setPlots={setPlots}
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
