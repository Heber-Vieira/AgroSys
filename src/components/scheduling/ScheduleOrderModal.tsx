import React, { useState, useEffect, useMemo } from 'react';
import { 
  ServiceOrder, 
  UserProfile, 
  FarmPlot, 
  AgriculturalDrone, 
  CrewPilot, 
  CrewAssistant,
  ClientProducer,
  WhiteLabelTheme
} from '../../types';
import { 
  X, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Wind, 
  Droplets, 
  Thermometer, 
  CloudRain, 
  Plane, 
  User, 
  MapPin, 
  Sparkles,
  RefreshCw,
  Info,
  ShieldAlert,
  ArrowRight,
  Volume2
} from 'lucide-react';
import { 
  checkOrderConflicts, 
  findAvailableTimeSlots, 
  minutesToTimeString, 
  timeStringToMinutes 
} from '../../services/scheduleConflictService';
import { 
  assessScheduleWeather, 
  resolveCityForPlot, 
  WeatherFeasibilityCheck 
} from '../../services/scheduleWeatherChecker';
import { formatDecimal, formatHectares } from '../../utils/formatters';
import { 
  POPULAR_AGRO_CITIES, 
  CityLocation 
} from '../../services/weatherService';
import { resolveCityLocation } from '../../services/brazilCitiesService';
import { BrazilCityAutocomplete } from '../common/BrazilCityAutocomplete';
import { 
  playSuccessChime, 
  playConflictAlert, 
  playWeatherWarning, 
  playSlotSelectedTone 
} from '../../utils/audioAlerts';

interface ScheduleOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveOrder: (order: ServiceOrder) => void;
  existingOrders: ServiceOrder[];
  plots: FarmPlot[];
  drones: AgriculturalDrone[];
  pilots: CrewPilot[];
  assistants: CrewAssistant[];
  currentUser: UserProfile;
  theme?: WhiteLabelTheme;
  initialDate?: string;
  initialStartTime?: string;
  editingOrder?: ServiceOrder | null;
  clients?: ClientProducer[];
}

export const ScheduleOrderModal: React.FC<ScheduleOrderModalProps> = ({
  isOpen,
  onClose,
  onSaveOrder,
  existingOrders,
  plots,
  drones,
  pilots,
  assistants,
  currentUser,
  theme,
  initialDate,
  initialStartTime,
  editingOrder,
  clients,
}) => {
  // Form State
  const [selectedPlotId, setSelectedPlotId] = useState<string>(
    editingOrder?.plotId || plots[0]?.id || ''
  );
  const [targetPest, setTargetPest] = useState<string>(
    editingOrder?.targetPestOrGoal || 'Fungicida Preventivo (Ferrugem) + Óleo Vegetal'
  );
  const [sprayRate, setSprayRate] = useState<number>(
    editingOrder?.sprayRateLHa || 10.0
  );
  const [selectedDroneId, setSelectedDroneId] = useState<string>(
    editingOrder?.droneId || drones[0]?.id || ''
  );
  const [selectedPilotId, setSelectedPilotId] = useState<string>(
    editingOrder?.pilotId || pilots[0]?.id || ''
  );
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    editingOrder?.assistantId || assistants[0]?.id || ''
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const [scheduledDate, setScheduledDate] = useState<string>(
    editingOrder?.scheduledDate || initialDate || todayStr
  );
  const [startTime, setStartTime] = useState<string>(
    editingOrder?.startTime || initialStartTime || '07:00'
  );
  const [endTime, setEndTime] = useState<string>(
    editingOrder?.endTime || '09:30'
  );
  const [notes, setNotes] = useState<string>(
    editingOrder?.notes || ''
  );

  // Weather state
  const [selectedCity, setSelectedCity] = useState<CityLocation>(POPULAR_AGRO_CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherFeasibilityCheck | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);

  // Selected Entities
  const currentPlot = plots.find(p => p.id === selectedPlotId) || plots[0];
  const matchedClient = clients?.find(c => 
    c.name === currentPlot?.clientName || 
    c.farmNames?.some(f => f.toLowerCase() === currentPlot?.farmName?.toLowerCase())
  );
  const currentDrone = drones.find(d => d.id === selectedDroneId) || drones[0];
  const currentPilot = pilots.find(p => p.id === selectedPilotId) || pilots[0];
  const currentAssistant = assistants.find(a => a.id === selectedAssistantId) || assistants[0];

  // Initialize values when opening or changing editingOrder
  useEffect(() => {
    if (editingOrder) {
      setSelectedPlotId(editingOrder.plotId);
      setTargetPest(editingOrder.targetPestOrGoal);
      setSprayRate(editingOrder.sprayRateLHa);
      setSelectedDroneId(editingOrder.droneId);
      setSelectedPilotId(editingOrder.pilotId);
      setSelectedAssistantId(editingOrder.assistantId);
      setScheduledDate(editingOrder.scheduledDate);
      setStartTime(editingOrder.startTime || '07:00');
      setEndTime(editingOrder.endTime || '09:30');
      setNotes(editingOrder.notes || '');
    } else {
      if (initialDate) setScheduledDate(initialDate);
      if (initialStartTime) setStartTime(initialStartTime);
    }
  }, [editingOrder, initialDate, initialStartTime, isOpen]);

  // Sync city based on client's registered municipality/UF or farm plot's registered municipality/UF
  useEffect(() => {
    if (currentPlot) {
      const cityToResolve = matchedClient?.cityState || currentPlot.cityState || currentPlot.farmName || 'Rio Verde - GO';
      const resolved = resolveCityLocation(cityToResolve);
      setSelectedCity(resolved);
    }
  }, [currentPlot?.id, matchedClient?.cityState, currentPlot?.cityState, currentPlot?.farmName]);

  // Calculate estimated end time based on plot size and drone efficiency
  const calculateEstimatedDuration = () => {
    if (!currentPlot) return;
    const hectares = currentPlot.hectares || 30;
    // Avg agricultural drone applies ~ 18 - 25 ha/h (including battery turns & calda refills)
    const hoursNeeded = Math.max(0.75, hectares / 20.0);
    const minutesNeeded = Math.round(hoursNeeded * 60);

    const startMin = timeStringToMinutes(startTime);
    const newEndMin = startMin + minutesNeeded;
    setEndTime(minutesToTimeString(newEndMin));
  };

  // Perform Conflict Validation
  const conflictResult = useMemo(() => {
    return checkOrderConflicts(
      {
        id: editingOrder?.id,
        scheduledDate,
        startTime,
        endTime,
        pilotId: selectedPilotId,
        pilotName: currentPilot?.name,
        droneId: selectedDroneId,
        droneModel: currentDrone?.modelName,
        plotId: selectedPlotId,
        plotName: currentPlot?.name,
      },
      existingOrders
    );
  }, [
    editingOrder?.id,
    scheduledDate,
    startTime,
    endTime,
    selectedPilotId,
    currentPilot?.name,
    selectedDroneId,
    currentDrone?.modelName,
    selectedPlotId,
    currentPlot?.name,
    existingOrders,
  ]);

  // Trigger audio alert when conflict arises
  useEffect(() => {
    if (conflictResult.hasConflict) {
      playConflictAlert();
    }
  }, [conflictResult.hasConflict]);

  // Fetch and Assess Weather
  useEffect(() => {
    let isCancelled = false;

    async function loadWeather() {
      setIsLoadingWeather(true);
      try {
        const assessment = await assessScheduleWeather(selectedCity, scheduledDate, startTime);
        if (!isCancelled) {
          setWeatherData(assessment);
          if (!assessment.isAllowed) {
            playWeatherWarning();
          }
        }
      } catch (err) {
        console.warn('Falha ao avaliar clima do agendamento:', err);
      } finally {
        if (!isCancelled) setIsLoadingWeather(false);
      }
    }

    if (isOpen) {
      loadWeather();
    }

    return () => {
      isCancelled = true;
    };
  }, [selectedCity, scheduledDate, startTime, isOpen]);

  // Suggested Slots for Conflict Resolution
  const availableSlots = useMemo(() => {
    if (!conflictResult.hasConflict) return [];
    const duration = timeStringToMinutes(endTime) - timeStringToMinutes(startTime);
    return findAvailableTimeSlots(
      scheduledDate,
      Math.max(60, duration),
      selectedPilotId,
      selectedDroneId,
      existingOrders,
      editingOrder?.id
    );
  }, [
    conflictResult.hasConflict,
    scheduledDate,
    startTime,
    endTime,
    selectedPilotId,
    selectedDroneId,
    existingOrders,
    editingOrder?.id,
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPlot || !currentDrone || !currentPilot || !currentAssistant) return;

    const estimatedGross = (currentPlot.hectares || 30) * 75.0;
    const estimatedPilotComm = (currentPlot.hectares || 30) * (currentPilot.commissionRatePerHa || 8.0);
    const estimatedAssistComm = (currentPlot.hectares || 30) * (currentAssistant.commissionRatePerHa || 3.0);

    const orderData: ServiceOrder = {
      id: editingOrder ? editingOrder.id : `os-${Date.now()}`,
      code: editingOrder ? editingOrder.code : `OS-2026-0${existingOrders.length + 42}`,
      clientId: currentUser.role === 'USER' ? currentUser.id : 'user-client',
      clientName: currentUser.role === 'USER' ? currentUser.name : currentPlot.clientName,
      farmName: currentPlot.farmName,
      plotId: currentPlot.id,
      plotName: currentPlot.name,
      crop: currentPlot.crop,
      targetHectares: currentPlot.hectares,
      sprayedHectares: editingOrder ? editingOrder.sprayedHectares : 0,
      targetPestOrGoal: targetPest,
      status: editingOrder ? editingOrder.status : 'SCHEDULED',
      scheduledDate,
      startTime,
      endTime,
      cityState: `${selectedCity.name} - ${selectedCity.state}`,
      sprayRateLHa: sprayRate,
      droneId: currentDrone.id,
      droneModel: currentDrone.modelName,
      droneAnac: currentDrone.anacPrefix,
      dronePhotoUrl: currentDrone.photoUrl,
      pilotId: currentPilot.id,
      pilotName: currentPilot.name,
      pilotPhotoUrl: currentPilot.photoUrl,
      assistantId: currentAssistant.id,
      assistantName: currentAssistant.name,
      assistantPhotoUrl: currentAssistant.photoUrl,
      pricingModel: editingOrder?.pricingModel || 'PER_HECTARE',
      baseRatePerHa: editingOrder?.baseRatePerHa || 75.0,
      totalGrossValue: editingOrder?.totalGrossValue || estimatedGross,
      pilotCommission: editingOrder?.pilotCommission || estimatedPilotComm,
      assistantCommission: editingOrder?.assistantCommission || estimatedAssistComm,
      weatherSafeApproved: weatherData ? weatherData.isAllowed : true,
      mixPreparedApproved: editingOrder ? editingOrder.mixPreparedApproved : false,
      digitalSigned: editingOrder ? editingOrder.digitalSigned : false,
      notes,
      weatherFeasibility: weatherData ? {
        status: weatherData.status,
        score: weatherData.score,
        deltaT: weatherData.deltaT,
        windSpeed: weatherData.windSpeed,
        precipitationProb: weatherData.precipitationProbability,
        isAllowed: weatherData.isAllowed,
        recommendation: weatherData.description,
        checkedAt: new Date().toISOString(),
      } : undefined,
    };

    playSuccessChime();
    onSaveOrder(orderData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-emerald-500/20 dark:border-slate-800 overflow-hidden my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/60 dark:bg-emerald-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                {editingOrder ? `Editar Agendamento • ${editingOrder.code}` : 'Novo Agendamento de Pulverização'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sincronização anti-sobreposição de pilotos, drones e checagem climática precisa
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* Conflict Alert Banner (If Any Collision Detected) */}
          {conflictResult.hasConflict && (
            <div className="p-4 rounded-xl border border-rose-400 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 animate-pulse-subtle">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-rose-600 text-white flex-shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-rose-900 dark:text-rose-200 uppercase tracking-wide">
                      Conflito de Escala Detectado ({conflictResult.conflicts.length})
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300">
                      Sobreposição Imediata
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5 text-xs text-rose-800 dark:text-rose-300">
                    {conflictResult.conflicts.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 bg-rose-100/70 dark:bg-rose-900/30 p-2 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                        <span>{c.description}</span>
                      </div>
                    ))}
                  </div>

                  {/* Auto-Resolve Quick Suggestions */}
                  {availableSlots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-rose-200 dark:border-rose-800/60">
                      <p className="text-[11px] font-bold text-rose-900 dark:text-rose-200 mb-1.5 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        Sugestões de horários livres para este Piloto e Drone na mesma data:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {availableSlots.map((slot, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              playSlotSelectedTone();
                              setStartTime(slot.startTime);
                              setEndTime(slot.endTime);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-lg shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                          >
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{slot.label}</span>
                            <span className="text-[10px] text-emerald-600 font-normal">({slot.reason})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1: Local e Talhão */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Talhão de Aplicação & Fazenda
              </label>
              <select
                value={selectedPlotId}
                onChange={(e) => setSelectedPlotId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {plots.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.farmName} — {p.name} ({p.crop}, {formatHectares(p.hectares)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <BrazilCityAutocomplete
                label="Cidade Meteorológica de Referência"
                value={`${selectedCity.name} - ${selectedCity.state}`}
                onChange={(cityStateStr) => {
                  if (cityStateStr) {
                    const resolved = resolveCityLocation(cityStateStr);
                    setSelectedCity(resolved);
                  }
                }}
                helperText={
                  matchedClient?.cityState
                    ? `📍 Vinculada automaticamente ao Cadastro do Cliente (${matchedClient.name}): ${matchedClient.cityState}`
                    : currentPlot?.cityState 
                    ? `📍 Vinculada ao Talhão: ${currentPlot.cityState}`
                    : 'Busca direta em 5.570 municípios do Brasil (IBGE)'
                }
              />
            </div>
          </div>

          {/* SECTION 2: Data, Horário e Sincronização */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                Data e Janela de Execução
              </span>
              <button
                type="button"
                onClick={calculateEstimatedDuration}
                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                title="Calcula a duração aproximada baseado na área do talhão (ha) e rendimento do drone"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Estimar Duração p/ {currentPlot?.hectares || 30} ha
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Data da Pulverização
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => {
                    playSlotSelectedTone();
                    setScheduledDate(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Hora de Início (Decolagem)
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => {
                    playSlotSelectedTone();
                    setStartTime(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Hora de Término Estimada
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => {
                    playSlotSelectedTone();
                    setEndTime(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Quick Date Shortcuts */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">Atalhos:</span>
              <button
                type="button"
                onClick={() => setScheduledDate(todayStr)}
                className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                  scheduledDate === todayStr 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setScheduledDate(tomorrow.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 rounded-md font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Amanhã
              </button>
              <button
                type="button"
                onClick={() => {
                  const in2Days = new Date();
                  in2Days.setDate(in2Days.getDate() + 2);
                  setScheduledDate(in2Days.toISOString().split('T')[0]);
                }}
                className="px-2.5 py-1 rounded-md font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                +2 Dias
              </button>
            </div>
          </div>

          {/* SECTION 3: Recursos (Drone, Piloto e Auxiliar) com Validação de Disponibilidade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* Drone Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Drone Agrícola
                </label>
                {conflictResult.hasDroneConflict ? (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Em Conflito
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Livre
                  </span>
                )}
              </div>
              <select
                value={selectedDroneId}
                onChange={(e) => setSelectedDroneId(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer ${
                  conflictResult.hasDroneConflict
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                }`}
              >
                {drones.map(d => (
                  <option key={d.id} value={d.id}>
                    🛸 {d.modelName} ({d.anacPrefix})
                  </option>
                ))}
              </select>
            </div>

            {/* Pilot Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Piloto em Comando
                </label>
                {conflictResult.hasPilotConflict ? (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Em Conflito
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Livre
                  </span>
                )}
              </div>
              <select
                value={selectedPilotId}
                onChange={(e) => setSelectedPilotId(e.target.value)}
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer ${
                  conflictResult.hasPilotConflict
                    ? 'border-rose-500 ring-1 ring-rose-500'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-emerald-500'
                }`}
              >
                {pilots.map(p => (
                  <option key={p.id} value={p.id}>
                    👨‍✈️ {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assistant Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Auxiliar de Operações (NR-31)
              </label>
              <select
                value={selectedAssistantId}
                onChange={(e) => setSelectedAssistantId(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
              >
                {assistants.map(a => (
                  <option key={a.id} value={a.id}>
                    👷 {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SECTION 4: Checagem Climática e Portão Meteorológico em Tempo Real */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-gradient-to-br from-slate-50 to-emerald-50/20 dark:from-slate-800/70 dark:to-slate-900/60">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wind className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Viabilidade Climática da Janela ({selectedCity.name}, {startTime})
                </span>
              </div>
              {isLoadingWeather ? (
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" /> Consultando satélite...
                </span>
              ) : (
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  weatherData?.isAllowed 
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {weatherData?.isAllowed ? '✓ VOO LIBERADO' : '✗ JANELA DESFAVORÁVEL'}
                </span>
              )}
            </div>

            {weatherData && (
              <div className="space-y-3">
                {/* 4 Meteorological Pillars HUD */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
                  
                  {/* Delta T Psicrométrico */}
                  <div className={`p-2.5 rounded-xl border ${
                    weatherData.deltaT >= 2 && weatherData.deltaT <= 8
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : weatherData.deltaT > 8 && weatherData.deltaT <= 10
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Delta T</span>
                    <span className="text-base font-black">{formatDecimal(weatherData.deltaT, 1)} °C</span>
                    <span className="text-[9px] block font-semibold mt-0.5">
                      {weatherData.deltaT >= 2 && weatherData.deltaT <= 8 ? 'Ideal (2 a 8°C)' : 'Atenção/Risco'}
                    </span>
                  </div>

                  {/* Vento */}
                  <div className={`p-2.5 rounded-xl border ${
                    weatherData.windSpeed >= 3 && weatherData.windSpeed <= 15
                       ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                       : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Vento</span>
                    <span className="text-base font-black">{formatDecimal(weatherData.windSpeed, 1)} km/h</span>
                    <span className="text-[9px] block font-semibold mt-0.5">
                      Rajadas: {formatDecimal(weatherData.windGusts, 1)} km/h
                    </span>
                  </div>

                  {/* Umidade Relativa */}
                  <div className={`p-2.5 rounded-xl border ${
                    weatherData.relativeHumidity >= 55
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Umidade Rel.</span>
                    <span className="text-base font-black">{formatDecimal(weatherData.relativeHumidity, 0)}%</span>
                    <span className="text-[9px] block font-semibold mt-0.5">
                      Temp: {formatDecimal(weatherData.temperature, 1)}°C
                    </span>
                  </div>

                  {/* Chuva */}
                  <div className={`p-2.5 rounded-xl border ${
                    weatherData.precipitationProbability <= 30
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
                  }`}>
                    <span className="text-[10px] font-black uppercase tracking-wider block opacity-75">Prob. Chuva</span>
                    <span className="text-base font-black">{weatherData.precipitationProbability}%</span>
                    <span className="text-[9px] block font-semibold mt-0.5">
                      {weatherData.precipitationProbability <= 30 ? 'Sem Chuva' : 'Risco de Lavagem'}
                    </span>
                  </div>
                </div>

                {/* Agronomic Technical Advice */}
                <div className="text-xs text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/80 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="font-bold mb-1 text-slate-900 dark:text-white">
                    {weatherData.title}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {weatherData.description}
                  </p>
                  {weatherData.isAllowed && (
                    <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-4 text-[11px]">
                      <span><strong>Gota:</strong> {weatherData.recommendedDropletSize}</span>
                      <span><strong>Bico:</strong> {weatherData.recommendedNozzle}</span>
                      <span><strong>Adjuvante:</strong> {weatherData.recommendedAdjuvant}</span>
                    </div>
                  )}
                </div>

                {/* Alternative Spray Windows on the same day */}
                {!weatherData.isAllowed && weatherData.alternativeWindows.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-300 dark:border-amber-800">
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      Janelas de Ouro recomendadas para este dia:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {weatherData.alternativeWindows.map((win, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            playSlotSelectedTone();
                            setStartTime(win.time);
                            // Adjust end time proportionally
                            const startMin = timeStringToMinutes(win.time);
                            const duration = timeStringToMinutes(endTime) - timeStringToMinutes(startTime);
                            setEndTime(minutesToTimeString(startMin + Math.max(60, duration)));
                          }}
                          className="px-2.5 py-1 bg-white dark:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-bold rounded border border-amber-400/50 hover:border-amber-600 cursor-pointer shadow-2xs"
                        >
                          {win.time} (ΔT {formatDecimal(win.deltaT, 1)}°C, {formatDecimal(win.windSpeed, 0)} km/h)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 5: Alvo / Insumo e Observações */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Alvo Biológico / Produto
              </label>
              <input
                type="text"
                value={targetPest}
                onChange={(e) => setTargetPest(e.target.value)}
                placeholder="Ex: Fungicida Ferrugem + Óleo Vegetal"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Taxa de Aplicação (L/ha)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                max="500"
                value={sprayRate || ''}
                placeholder="10"
                onChange={(e) => setSprayRate(parseFloat(e.target.value) || 10)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Observações Operacionais & Instruções ao Piloto
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Instruções sobre rede elétrica próxima, ponto de recarga de bateria, sentido do vento..."
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <div className="flex items-center gap-3">
              {conflictResult.hasConflict && (
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                  Atenção: Salvar mesmo com sobreposição?
                </span>
              )}
              <button
                type="submit"
                className={`px-6 py-2.5 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
                  conflictResult.hasConflict
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25 hover:scale-[1.02]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingOrder ? 'Salvar Alterações' : 'Confirmar Agendamento'}</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
