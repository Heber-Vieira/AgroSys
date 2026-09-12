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
  // Calendar Navigation State
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 8, 9)); // Default September 2026
  const [viewMode, setViewMode] = useState<CalendarViewMode>('week');
  const [timelineResource, setTimelineResource] = useState<TimelineResource>('pilot');

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
  const [modalInitialDate, setModalInitialDate] = useState<string>('');
  const [modalInitialStartTime, setModalInitialStartTime] = useState<string>('07:00');
  const [editingOrder, setEditingOrder] = useState<ServiceOrder | null>(null);

  // Global Collision Detector across all orders
  const conflictsMap = useMemo(() => {
    return detectAllScheduleCollisions(orders);
  }, [orders]);

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

  // Sound toggle handler
  const handleToggleSound = () => {
    const next = toggleAudioEnabled();
    setSoundActive(next);
  };

  // Date Navigation Helpers
  const handlePrev = () => {
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

  const handleNext = () => {
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

  const handleToday = () => {
    playSlotSelectedTone();
    setCurrentDate(new Date(2026, 8, 9));
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesCode = order.code.toLowerCase().includes(q);
        const matchesFarm = order.farmName.toLowerCase().includes(q);
        const matchesPlot = order.plotName.toLowerCase().includes(q);
        const matchesPilot = order.pilotName.toLowerCase().includes(q);
        const matchesDrone = order.droneModel.toLowerCase().includes(q);
        if (!matchesCode && !matchesFarm && !matchesPlot && !matchesPilot && !matchesDrone) {
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
  }, [orders, searchQuery, selectedPilotFilter, selectedDroneFilter, statusFilter, showConflictsOnly, conflictsMap]);

  // Order CRUD handlers
  const handleSaveOrder = (newOrUpdatedOrder: ServiceOrder) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === newOrUpdatedOrder.id);
      if (exists) {
        return prev.map(o => o.id === newOrUpdatedOrder.id ? newOrUpdatedOrder : o);
      }
      return [newOrUpdatedOrder, ...prev];
    });
  };

  const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja desmarcar e cancelar este agendamento?')) {
      setOrders(prev => prev.filter(o => o.id !== orderId));
      playSuccessChime();
    }
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

  // Week Days (Mon - Sun)
  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    const day = current.getDay();
    const diff = current.getDate() - day + (day === 0 ? -6 : 1); // Adjust when Sunday
    const monday = new Date(current.setDate(diff));

    const days: { dateStr: string; dayNumber: number; dayName: string; fullDate: Date }[] = [];
    const names = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      days.push({
        dateStr: nextDay.toISOString().split('T')[0],
        dayNumber: nextDay.getDate(),
        dayName: names[i],
        fullDate: nextDay,
      });
    }

    return days;
  }, [currentDate]);

  // Month Title Formatter
  const formattedMonthYear = useMemo(() => {
    return currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [currentDate]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Top Header & Scheduling Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        
        {/* Title Bar with Actions */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/25">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  Agenda & Escala Operacional
                  {totalConflictsCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-black bg-rose-600 text-white animate-pulse">
                      {totalConflictsCount} {totalConflictsCount === 1 ? 'Conflito' : 'Conflitos'}
                    </span>
                  )}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sincronização de voos, anti-sobreposição de pilotos e drones, e checagem climática em tempo real
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            {/* Audio Feedback Switch */}
            <button
              onClick={handleToggleSound}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                soundActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-500'
              }`}
              title={soundActive ? 'Alertas Sonoros Ativos (Clique para Silenciar)' : 'Alertas Sonoros Desativados (Clique para Ativar)'}
            >
              {soundActive ? (
                <>
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">Som Ativo</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span className="hidden sm:inline">Mudo</span>
                </>
              )}
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { playSlotSelectedTone(); setViewMode('month'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Mês
              </button>
              <button
                onClick={() => { playSlotSelectedTone(); setViewMode('week'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => { playSlotSelectedTone(); setViewMode('timeline'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Recursos
              </button>
              <button
                onClick={() => { playSlotSelectedTone(); setViewMode('list'); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Lista
              </button>
            </div>

            {/* New Schedule Button */}
            <button
              onClick={() => handleOpenNewModal()}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 hover:scale-[1.02] transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Agendamento</span>
            </button>
          </div>
        </div>

        {/* Conflict Warning Banner (If Active) */}
        {totalConflictsCount > 0 && (
          <div className="p-3.5 rounded-xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs text-rose-800 dark:text-rose-200">
              <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <span className="font-black uppercase tracking-wider block">
                  Atenção: Existem {totalConflictsCount} sobreposições de pilotos ou drones agendadas!
                </span>
                <span className="text-[11px] opacity-90">
                  Dois ou mais agendamentos concorrem pelo mesmo piloto ou drone simultaneamente.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowConflictsOnly(!showConflictsOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  showConflictsOnly
                    ? 'bg-rose-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {showConflictsOnly ? 'Exibindo Apenas Conflitos' : 'Filtrar Conflitos'}
              </button>
            </div>
          </div>
        )}

        {/* Date Navigation & Search Filters Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          
          {/* Calendar Navigation Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Período Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Hoje
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              title="Próximo Período"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white capitalize ml-2">
              {formattedMonthYear}
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Search */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar OS, talhão..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Pilot Filter */}
            <select
              value={selectedPilotFilter}
              onChange={(e) => setSelectedPilotFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="ALL">👨‍✈️ Todos os Pilotos</option>
              {pilots.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {/* Drone Filter */}
            <select
              value={selectedDroneFilter}
              onChange={(e) => setSelectedDroneFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
            >
              <option value="ALL">🛸 Todos os Drones</option>
              {drones.map(d => (
                <option key={d.id} value={d.id}>{d.modelName}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: WEEK CALENDAR (Grade Horária Semanal) */}
      {viewMode === 'week' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Week Header with Golden Spray Windows */}
          <div className="grid grid-cols-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
            <div className="p-3 text-center border-r border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-black uppercase text-slate-400">Horário</span>
            </div>
            {weekDays.map((d, i) => {
              const isToday = d.dateStr === new Date().toISOString().split('T')[0];
              const dayOrders = filteredOrders.filter(o => o.scheduledDate === d.dateStr);

              return (
                <div 
                  key={i} 
                  className={`p-3 text-center border-r last:border-r-0 border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-slate-800 transition-colors ${
                    isToday ? 'bg-emerald-50 dark:bg-emerald-950/40 font-bold' : ''
                  }`}
                  onClick={() => handleOpenNewModal(d.dateStr, '07:00')}
                >
                  <div className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400">
                    {d.dayName}
                  </div>
                  <div className={`text-base font-black ${
                    isToday ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'
                  }`}>
                    {d.dayNumber}
                  </div>
                  {dayOrders.length > 0 && (
                    <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                      {dayOrders.length} {dayOrders.length === 1 ? 'voo' : 'voos'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hourly Slots Grid (00:00 to 23:00) */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[600px] overflow-y-auto">
            {Array.from({ length: 24 }).map((_, hourIdx) => {
              const hour = hourIdx; // 00:00 to 23:00
              const timeSlotStr = `${String(hour).padStart(2, '0')}:00`;
              const isMorningGolden = hour >= 6 && hour <= 9; // Golden spray hours
              const isLateAfternoon = hour >= 16 && hour <= 17;

              return (
                <div key={hour} className="grid grid-cols-8 min-h-[64px] group">
                  {/* Time label */}
                  <div className="p-2 border-r border-slate-200 dark:border-slate-800 text-center flex flex-col justify-start bg-slate-50/60 dark:bg-slate-800/30">
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {timeSlotStr}
                    </span>
                    {isMorningGolden && (
                      <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5 mt-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Ouro
                      </span>
                    )}
                  </div>

                  {/* Day Columns for this hour */}
                  {weekDays.map((d, dayIdx) => {
                    // Find orders that are active during this hour
                    const slotOrders = filteredOrders.filter(o => {
                      if (o.scheduledDate !== d.dateStr) return false;
                      const startMin = timeStringToMinutes(o.startTime || '07:00');
                      const endMin = timeStringToMinutes(o.endTime || '09:30');
                      const slotMin = hour * 60;
                      return slotMin >= startMin && slotMin < endMin;
                    });

                    return (
                      <div
                        key={dayIdx}
                        onClick={() => {
                          if (slotOrders.length === 0) {
                            handleOpenNewModal(d.dateStr, timeSlotStr);
                          }
                        }}
                        className={`p-1.5 border-r last:border-r-0 border-slate-100 dark:border-slate-800/80 transition-colors relative cursor-pointer ${
                          isMorningGolden 
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10 hover:bg-emerald-100/40' 
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        {/* Render Scheduled Order Badges in this slot */}
                        {slotOrders.map((order) => {
                          const hasConflict = conflictsMap.has(order.id);
                          const isSafeWeather = order.weatherSafeApproved;

                          return (
                            <div
                              key={order.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditModal(order);
                              }}
                              className={`p-1.5 rounded-lg text-left shadow-2xs transition-all hover:scale-[1.02] cursor-pointer mb-1 border ${
                                hasConflict
                                  ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100 animate-pulse-subtle'
                                  : order.status === 'OPERATING'
                                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-md shadow-emerald-600/20'
                                  : order.status === 'COMPLETED'
                                  ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                  : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-black text-[10px] truncate">{order.code}</span>
                                {hasConflict ? (
                                  <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                                ) : (
                                  <span className="text-[9px] opacity-75 font-mono">{order.startTime}</span>
                                )}
                              </div>

                              <div className="text-[10px] font-semibold truncate leading-tight mt-0.5">
                                {order.plotName}
                              </div>

                              <div className="text-[9px] opacity-80 truncate flex items-center gap-1 mt-0.5">
                                <span>🛸 {order.droneModel.replace('DJI Agras ', '')}</span>
                                <span>•</span>
                                <span>👨‍✈️ {order.pilotName.split(' ')[0]}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 2: MONTH VIEW (Visão Mensal em Grade) */}
      {viewMode === 'month' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-center font-bold text-xs text-slate-500 py-2.5">
            <div>Domingo</div>
            <div>Segunda</div>
            <div>Terça</div>
            <div>Quarta</div>
            <div>Quinta</div>
            <div>Sexta</div>
            <div>Sábado</div>
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-slate-800/80">
            {monthData.map((cell, idx) => {
              const dayOrders = filteredOrders.filter(o => o.scheduledDate === cell.dateStr);
              const hasConflictsToday = dayOrders.some(o => conflictsMap.has(o.id));
              const isToday = cell.dateStr === new Date().toISOString().split('T')[0];

              return (
                <div
                  key={idx}
                  onClick={() => handleOpenNewModal(cell.dateStr, '07:00')}
                  className={`min-h-[110px] p-2 transition-colors cursor-pointer relative group flex flex-col justify-between ${
                    cell.isCurrentMonth
                      ? 'bg-white dark:bg-slate-900 hover:bg-emerald-50/30 dark:hover:bg-slate-800/60'
                      : 'bg-slate-50/50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600'
                  } ${isToday ? 'ring-2 ring-emerald-500 ring-inset' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${
                      isToday ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {cell.dayNumber}
                    </span>

                    {hasConflictsToday && (
                      <span className="p-0.5 rounded-full bg-rose-600 text-white" title="Conflito de escala neste dia">
                        <AlertTriangle className="w-3 h-3" />
                      </span>
                    )}
                  </div>

                  {/* Day Orders Badges */}
                  <div className="mt-1 space-y-1 flex-1 overflow-y-auto max-h-[75px]">
                    {dayOrders.slice(0, 3).map(order => {
                      const hasConflict = conflictsMap.has(order.id);

                      return (
                        <div
                          key={order.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(order);
                          }}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold truncate flex items-center justify-between border ${
                            hasConflict
                              ? 'bg-rose-100 text-rose-900 border-rose-400 dark:bg-rose-950 dark:text-rose-200'
                              : order.status === 'OPERATING'
                              ? 'bg-emerald-600 text-white border-emerald-700'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          <span className="truncate">{order.startTime || '07:00'} • {order.code}</span>
                          {hasConflict && <AlertTriangle className="w-2.5 h-2.5 text-rose-600 flex-shrink-0" />}
                        </div>
                      );
                    })}
                    {dayOrders.length > 3 && (
                      <div className="text-[9px] font-bold text-slate-400 pl-1">
                        +{dayOrders.length - 3} mais
                      </div>
                    )}
                  </div>

                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-0.5">
                    <Plus className="w-3 h-3" /> Agendar
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: TIMELINE / RESOURCE ALLOCATION (Linha do Tempo de Recursos) */}
      {viewMode === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-5 space-y-4">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Alocação de Recurso na Data ({currentDate.toISOString().split('T')[0]}):
              </span>
              <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setTimelineResource('pilot')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    timelineResource === 'pilot'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  👨‍✈️ Pilotos
                </button>
                <button
                  onClick={() => setTimelineResource('drone')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    timelineResource === 'drone'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  🛸 Drones
                </button>
              </div>
            </div>
          </div>

          {/* Timeline Surface */}
          <div className="space-y-4 pt-2">
            {(timelineResource === 'pilot' ? pilots : drones).map((resource) => {
              const resourceId = resource.id;
              const resourceName = 'name' in resource ? resource.name : resource.modelName;
              const resourceSub = 'deceaLicense' in resource ? resource.deceaLicense : resource.anacPrefix;

              // Find orders for this resource on current date
              const dayStr = currentDate.toISOString().split('T')[0];
              const resourceOrders = filteredOrders.filter(o => {
                if (o.scheduledDate !== dayStr) return false;
                return timelineResource === 'pilot' ? o.pilotId === resourceId : o.droneId === resourceId;
              });

              return (
                <div key={resourceId} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                        {timelineResource === 'pilot' ? '👨‍✈️' : '🛸'}
                      </div>
                      <div>
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {resourceName}
                        </span>
                        <span className="text-xs text-slate-500 ml-2">({resourceSub})</span>
                      </div>
                    </div>

                    <span className="text-xs font-bold text-slate-500">
                      {resourceOrders.length} {resourceOrders.length === 1 ? 'missão agendada' : 'missões agendadas'}
                    </span>
                  </div>

                  {/* Visual Bar representation 00:00 to 23:00 */}
                  <div className="relative h-12 bg-slate-200/60 dark:bg-slate-700/60 rounded-xl overflow-hidden flex items-center">
                    {/* Hour grid guidelines */}
                    {Array.from({ length: 24 }).map((_, h) => (
                      <div
                        key={h}
                        style={{ left: `${(h / 24) * 100}%` }}
                        className="absolute top-0 bottom-0 border-l border-slate-300/40 dark:border-slate-600/40 text-[9px] text-slate-400 pl-1 pt-0.5 select-none pointer-events-none"
                      >
                        {String(h).padStart(2, '0')}h
                      </div>
                    ))}

                    {/* Order Blocks */}
                    {resourceOrders.map(order => {
                      const startMin = timeStringToMinutes(order.startTime || '07:00');
                      const endMin = timeStringToMinutes(order.endTime || '09:30');
                      const dayStart = 0 * 60;
                      const dayTotal = 24 * 60;

                      const leftPct = Math.max(0, Math.min(100, ((startMin - dayStart) / dayTotal) * 100));
                      const widthPct = Math.max(4, Math.min(100 - leftPct, ((endMin - startMin) / dayTotal) * 100));
                      const hasConflict = conflictsMap.has(order.id);

                      return (
                        <div
                          key={order.id}
                          onClick={() => handleOpenEditModal(order)}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                          className={`absolute top-1.5 bottom-1.5 rounded-lg px-2 flex items-center justify-between text-xs font-bold shadow-xs cursor-pointer transition-all hover:scale-[1.02] ${
                            hasConflict
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-emerald-600 text-white'
                          }`}
                          title={`${order.code} • ${order.startTime} às ${order.endTime} (${order.plotName})`}
                        >
                          <span className="truncate">{order.code} - {order.plotName}</span>
                          {hasConflict && <AlertTriangle className="w-3 h-3 text-white flex-shrink-0" />}
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

      {/* VIEW MODE 4: LIST VIEW (Lista Operacional Detalhada) */}
      {viewMode === 'list' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between font-bold text-xs text-slate-500 uppercase">
            <span>Missão / Código</span>
            <span>Talhão & Cultura</span>
            <span>Equipe & Drone</span>
            <span>Janela / Horário</span>
            <span>Viabilidade Climática</span>
            <span>Ações</span>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Nenhum agendamento encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredOrders.map(order => {
              const hasConflict = conflictsMap.has(order.id);

              return (
                <div 
                  key={order.id}
                  onClick={() => handleOpenEditModal(order)}
                  className={`p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer ${
                    hasConflict ? 'bg-rose-50/40 dark:bg-rose-950/20' : ''
                  }`}
                >
                  <div className="min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 dark:text-white text-sm">
                        {order.code}
                      </span>
                      {hasConflict && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" /> Conflito
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block">
                      {order.farmName}
                    </span>
                  </div>

                  <div className="min-w-[140px]">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                      {order.plotName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {order.crop} • {String(order.targetHectares).replace('.', ',')} ha
                    </span>
                  </div>

                  <div className="min-w-[140px] text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                      👨‍✈️ {order.pilotName}
                    </span>
                    <span className="text-slate-500">
                      🛸 {order.droneModel}
                    </span>
                  </div>

                  <div className="min-w-[120px] text-xs">
                    <span className="font-black text-slate-900 dark:text-white block">
                      📅 {order.scheduledDate}
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                      ⏰ {order.startTime || '07:00'} - {order.endTime || '09:30'}
                    </span>
                  </div>

                  <div>
                    {order.weatherFeasibility ? (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${
                        order.weatherFeasibility.isAllowed
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}>
                        <Wind className="w-3 h-3" />
                        <span>ΔT {order.weatherFeasibility.deltaT?.toFixed(1).replace('.', ',')}°C ({order.weatherFeasibility.isAllowed ? 'Liberado' : 'Atenção'})</span>
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Checagem Padrão</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditModal(order)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar Agendamento"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteOrder(order.id, e)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Desmarcar / Cancelar Agendamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Schedule Order Creation / Editing Modal */}
      <ScheduleOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaveOrder={handleSaveOrder}
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

    </div>
  );
};
