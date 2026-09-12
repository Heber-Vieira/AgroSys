import React, { useState, useEffect } from 'react';
import { AgriculturalDrone, BatteryAlertSettings, BatteryAlertPeriodUnit, UserProfile } from '../types';
import { 
  BatteryCharging, 
  AlertTriangle, 
  Volume2, 
  VolumeX, 
  Calendar,
  CalendarDays,
  CheckCircle2, 
  Settings, 
  X, 
  ShieldAlert, 
  Zap, 
  Activity, 
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  Info,
  Clock
} from 'lucide-react';
import { playBatteryAlertSound } from '../utils/batteryAudioAlert';

interface BatteryAlertOverlayProps {
  currentUser?: UserProfile;
  drones: AgriculturalDrone[];
  setDrones?: React.Dispatch<React.SetStateAction<AgriculturalDrone[]>>;
  settings: BatteryAlertSettings;
  setSettings: React.Dispatch<React.SetStateAction<BatteryAlertSettings>>;
  showAlertBanner: boolean;
  onDismissAlert: () => void;
  onSnoozeAlert: () => void;
  onRecordInspection: () => void;
}

export const BatteryAlertOverlay: React.FC<BatteryAlertOverlayProps> = ({
  currentUser,
  drones,
  setDrones,
  settings,
  setSettings,
  showAlertBanner,
  onDismissAlert,
  onSnoozeAlert,
  onRecordInspection,
}) => {
  const [isInspectionOpen, setIsInspectionOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // Automatically open inspection modal when banner is manually triggered or shown
  useEffect(() => {
    if (showAlertBanner) {
      setIsInspectionOpen(true);
    }
  }, [showAlertBanner]);

  // Period presets for Days and Months
  const DAY_PRESETS = [
    { value: 7, label: '7 Dias', desc: 'Semanal (Safra Intensa)' },
    { value: 15, label: '15 Dias', desc: 'Quinzenal (Padrão Recomendado)' },
    { value: 21, label: '21 Dias', desc: '3 Semanas' },
    { value: 30, label: '30 Dias', desc: 'Mensal em Dias' },
    { value: 45, label: '45 Dias', desc: 'Ciclo Estendido' },
    { value: 60, label: '60 Dias', desc: 'Bimestral em Dias' },
  ];

  const MONTH_PRESETS = [
    { value: 1, label: '1 Mês', desc: 'Mensal (Balanceamento & SoH)' },
    { value: 2, label: '2 Meses', desc: 'Bimestral' },
    { value: 3, label: '3 Meses', desc: 'Trimestral (Entressafra)' },
    { value: 6, label: '6 Meses', desc: 'Semestral (Armazenamento)' },
    { value: 12, label: '12 Meses', desc: 'Anual (Recertificação)' },
  ];

  const SNOOZE_PRESETS = [
    { days: 1, label: '1 dia' },
    { days: 2, label: '2 dias' },
    { days: 3, label: '3 dias' },
    { days: 7, label: '7 dias' },
  ];

  // Helper to format periodicity text
  const currentPeriodUnit: BatteryAlertPeriodUnit = settings.periodUnit || 'DAYS';
  const currentPeriodValue = settings.periodValue || (currentPeriodUnit === 'MONTHS' ? 1 : 15);
  const currentSnoozeDays = settings.snoozeDays || 1;

  const getPeriodLabel = (unit: BatteryAlertPeriodUnit, val: number) => {
    if (unit === 'MONTHS') {
      return val === 1 ? '1 Mês' : `${val} Meses`;
    }
    return val === 1 ? '1 Dia' : `${val} Dias`;
  };

  const getEstimatedNextDate = (unit: BatteryAlertPeriodUnit, val: number) => {
    const d = new Date();
    if (unit === 'MONTHS') {
      d.setMonth(d.getMonth() + (Number(val) || 1));
    } else {
      d.setDate(d.getDate() + (Number(val) || 15));
    }
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Identify drones needing battery attention
  const dronesNeedingAttention = drones.filter((d) => {
    const lowHealth = (d.batteryHealthPct ?? 100) < settings.minHealthThresholdPct;
    const highDelta = (d.cellVoltageDeltaMv ?? 0) > settings.maxCellDeltaMv;
    return lowHealth || highDelta;
  });

  const handleTestSound = () => {
    playBatteryAlertSound(settings.soundType, settings.soundVolume);
  };

  const handleConfirmInspection = () => {
    const today = new Date().toISOString().split('T')[0];
    if (setDrones) {
      setDrones((prev) =>
        prev.map((d) => ({
          ...d,
          lastBatteryInspectionDate: today,
          // Option to reset minor voltage deltas upon inspection
          cellVoltageDeltaMv: Math.min(d.cellVoltageDeltaMv ?? 15, 12),
        }))
      );
    }
    onRecordInspection();
    setIsInspectionOpen(false);
  };

  return (
    <>
      {/* 1. ELEGANT CENTERED VISUAL & AUDIO ALERT CARD */}
      {showAlertBanner && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0a281e] via-[#051c15] to-[#03130e] text-white border-2 border-amber-500/70 rounded-3xl shadow-2xl shadow-emerald-950/90 p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Top Close Button */}
            <button
              type="button"
              onClick={onDismissAlert}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-emerald-900/60 transition-colors cursor-pointer"
              title="Fechar alerta"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header: Icon + Badges */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-400 flex-shrink-0 animate-pulse shadow-inner">
                <BatteryCharging className="w-7 h-7" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Alerta de Baterias
                  </span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-950/90 text-amber-300 border border-amber-700/80 font-bold flex items-center gap-1">
                    {currentPeriodUnit === 'MONTHS' ? <Calendar className="w-3 h-3 text-amber-400" /> : <CalendarDays className="w-3 h-3 text-amber-400" />}
                    A cada {getPeriodLabel(currentPeriodUnit, currentPeriodValue)}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  Checagem Obrigatória de Saúde das Baterias
                </h3>
              </div>
            </div>

            {/* Content Message Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 space-y-1 text-xs">
              <p className="text-amber-200 font-bold flex items-center gap-1.5">
                {dronesNeedingAttention.length > 0
                  ? `⚠️ ${dronesNeedingAttention.length} drone(s) requerem atenção na saúde ou células!`
                  : `Lembrete periódico (${getPeriodLabel(currentPeriodUnit, currentPeriodValue)}) ativado.`}
              </p>
              <p className="text-emerald-300/80 text-[11px] leading-relaxed">
                Inspeção recomendada para verificar ciclos de carga, desbalanço celular (mV), saúde (SoH) e temperatura de operabilidade.
              </p>
            </div>

            {/* Actions Grid */}
            <div className="space-y-2.5 pt-1">
              {/* Primary Action Button */}
              <button
                type="button"
                onClick={() => setIsInspectionOpen(true)}
                className="w-full py-3 px-4 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 shadow-lg shadow-amber-950/40 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Checar Baterias & Telemetria Agora</span>
              </button>

              {/* Secondary Action Row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onSnoozeAlert}
                  className="flex-1 py-2.5 px-3 rounded-xl font-bold text-xs bg-emerald-900/60 hover:bg-emerald-800/80 text-amber-200 border border-emerald-700/80 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  title={`Adiar alerta por ${currentSnoozeDays} ${currentSnoozeDays === 1 ? 'dia' : 'dias'}`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Adiar ({currentSnoozeDays} {currentSnoozeDays === 1 ? 'dia' : 'dias'})</span>
                </button>

                {settings.soundEnabled && (
                  <button
                    type="button"
                    onClick={() => setIsSoundMuted(!isSoundMuted)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-colors cursor-pointer flex items-center gap-1.5 ${
                      isSoundMuted
                        ? 'bg-rose-950/70 text-rose-300 border-rose-800 hover:bg-rose-900/70'
                        : 'bg-emerald-900/60 text-emerald-300 border-emerald-700 hover:bg-emerald-800/80'
                    }`}
                    title={isSoundMuted ? 'Som mutado' : 'Som ativo'}
                  >
                    {isSoundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isSoundMuted ? 'Mutado' : 'Som On'}</span>
                  </button>
                )}

                {currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700/80 transition-colors cursor-pointer"
                    title="Configurar Periodicidade em Dias/Meses e Sons (Admin)"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. INSPECTION MODAL - DETAILED BATTERY TELEMETRY */}
      {isInspectionOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40">
                  <BatteryCharging className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Inspeção de Saúde das Baterias da Frota
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-300/80">
                    Telemetria das baterias Smart LiPo/LiFePO4 dos drones e diagnóstico de células.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentUser?.role === 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsInspectionOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-900/80 hover:bg-slate-200 dark:hover:bg-emerald-800 border border-slate-300 dark:border-emerald-700 text-slate-700 dark:text-emerald-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Configurar Periodicidade</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setIsInspectionOpen(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/80 text-slate-500 dark:text-emerald-400 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drone Batteries Grid */}
            <div className="space-y-4">
              {drones.map((drone) => {
                const healthPct = drone.batteryHealthPct ?? 95;
                const cellDelta = drone.cellVoltageDeltaMv ?? 15;
                const isLowHealth = healthPct < settings.minHealthThresholdPct;
                const isHighDelta = cellDelta > settings.maxCellDeltaMv;
                const hasAlert = isLowHealth || isHighDelta;

                return (
                  <div
                    key={drone.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      hasAlert
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-500/80 text-amber-900 dark:text-amber-100'
                        : 'bg-slate-50 dark:bg-emerald-900/40 border-slate-200 dark:border-emerald-800 text-slate-900 dark:text-emerald-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-emerald-800/60">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                            {drone.anacPrefix}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800 font-mono text-slate-700 dark:text-emerald-300">
                            {drone.modelName}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold mt-0.5 text-slate-900 dark:text-white">
                          Serial Bateria: {drone.batterySerial || 'Smart-BATT-01'}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2">
                        {hasAlert ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> ATENÇÃO NECESSÁRIA
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> BATERIA SAUDÁVEL
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
                      {/* Health SoH */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Saúde (SoH)</span>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`text-sm font-black font-mono ${isLowHealth ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-emerald-200'}`}>
                            {healthPct}%
                          </span>
                          <div className="w-12 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${isLowHealth ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${healthPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Cell Delta */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Desbalanço Células</span>
                        <span className={`text-sm font-black font-mono mt-1 block ${isHighDelta ? 'text-amber-600 dark:text-amber-400 animate-pulse' : 'text-slate-900 dark:text-emerald-200'}`}>
                          {cellDelta} mV {isHighDelta && '⚠️'}
                        </span>
                      </div>

                      {/* Cycles */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Ciclos de Carga</span>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-emerald-200 mt-1 block">
                          {drone.batteryCycles ?? 120} ciclos
                        </span>
                      </div>

                      {/* Temp & Charge */}
                      <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800">
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-semibold">Temp. / Carga</span>
                        <span className="text-sm font-black font-mono text-slate-900 dark:text-emerald-200 mt-1 block">
                          {drone.batteryTemperatureC ?? 32}°C • {drone.batteryStatusPct}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Action */}
            <div className="pt-4 border-t border-slate-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-600 dark:text-emerald-300/80">
                A confirmação registra a inspeção, zera os alertas visuais e reinicia a contagem periódica ({getPeriodLabel(currentPeriodUnit, currentPeriodValue)}).
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setIsInspectionOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-slate-700 dark:text-emerald-200 text-xs transition-colors cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={handleConfirmInspection}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Confirmar Inspeção & Resetar Alerta</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. ADMIN SETTINGS MODAL - CONFIGURABLE ONLY IN DAYS AND MONTHS */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Sliders className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    Configuração de Periodicidade de Alertas
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-300/80">
                    Defina o ciclo de checagem obrigatória (Configurável exclusivamente em <strong>Dias</strong> e <strong>Meses</strong>).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900 text-slate-500 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Toggle Master Enable */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/50 border border-slate-200 dark:border-emerald-800">
                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white block">
                    Alertas Periódicos de Bateria
                  </label>
                  <span className="text-xs text-slate-600 dark:text-emerald-300/80">
                    Emitir lembretes visuais e sonoros para inspeção física e balanceamento de células.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </div>

              {/* CREATIVE PERIODICITY SELECTOR: ONLY DAYS AND MONTHS */}
              <div className="space-y-3.5 p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Unidade de Periodicidade
                  </label>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-emerald-300/80">
                    Apenas Dias ou Meses
                  </span>
                </div>

                {/* Segmented Unit Selector (Dias vs Meses) */}
                <div className="grid grid-cols-2 p-1 bg-slate-200 dark:bg-emerald-950/90 rounded-2xl border border-slate-300 dark:border-emerald-800">
                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        periodUnit: 'DAYS',
                        periodValue: currentPeriodUnit === 'MONTHS' ? 15 : currentPeriodValue,
                      });
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      currentPeriodUnit === 'DAYS'
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md scale-100'
                        : 'text-slate-700 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-emerald-900/50'
                    }`}
                  >
                    <CalendarDays className="w-4 h-4" />
                    <span>Configuração em DIAS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        periodUnit: 'MONTHS',
                        periodValue: currentPeriodUnit === 'DAYS' ? 1 : currentPeriodValue,
                      });
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      currentPeriodUnit === 'MONTHS'
                        ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-md scale-100'
                        : 'text-slate-700 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-300/50 dark:hover:bg-emerald-900/50'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Configuração em MESES</span>
                  </button>
                </div>

                {/* Presets based on selected unit */}
                {currentPeriodUnit === 'DAYS' ? (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-emerald-300 block">
                      Ciclos recomendados em Dias:
                    </span>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {DAY_PRESETS.map((preset) => {
                        const isSelected = currentPeriodValue === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                periodUnit: 'DAYS',
                                periodValue: preset.value,
                              })
                            }
                            className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-500 shadow-md scale-105'
                                : 'bg-white dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300 border-slate-200 dark:border-emerald-800 hover:bg-slate-100 dark:hover:bg-emerald-900'
                            }`}
                            title={preset.desc}
                          >
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-emerald-300 block">
                      Ciclos recomendados em Meses:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                      {MONTH_PRESETS.map((preset) => {
                        const isSelected = currentPeriodValue === preset.value;
                        return (
                          <button
                            key={preset.value}
                            type="button"
                            onClick={() =>
                              setSettings({
                                ...settings,
                                periodUnit: 'MONTHS',
                                periodValue: preset.value,
                              })
                            }
                            className={`py-2 px-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer text-center flex flex-col items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-500 shadow-md scale-105'
                                : 'bg-white dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300 border-slate-200 dark:border-emerald-800 hover:bg-slate-100 dark:hover:bg-emerald-900'
                            }`}
                            title={preset.desc}
                          >
                            <span>{preset.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom numeric input */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-white dark:bg-emerald-950/70 border border-slate-200 dark:border-emerald-800/80">
                  <div className="text-xs text-slate-700 dark:text-emerald-300">
                    {currentPeriodUnit === 'DAYS'
                      ? 'Ou digite uma quantidade personalizada de dias:'
                      : 'Ou digite uma quantidade personalizada de meses:'}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max={currentPeriodUnit === 'DAYS' ? 365 : 24}
                      value={currentPeriodValue}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setSettings({
                          ...settings,
                          periodValue: val,
                        });
                      }}
                      className="w-20 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono text-xs text-center focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {currentPeriodUnit === 'DAYS'
                        ? currentPeriodValue === 1 ? 'dia' : 'dias'
                        : currentPeriodValue === 1 ? 'mês' : 'meses'}
                    </span>
                  </div>
                </div>

                {/* Smart Simulation & Diagnostic Card */}
                <div className="p-3.5 rounded-xl bg-white dark:bg-emerald-950/90 border border-slate-200 dark:border-emerald-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      Previsão da Próxima Notificação:
                    </span>
                    <span className="font-mono font-bold text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800">
                      {getEstimatedNextDate(currentPeriodUnit, currentPeriodValue)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-emerald-300/80 leading-relaxed">
                    {currentPeriodUnit === 'DAYS'
                      ? currentPeriodValue <= 15
                        ? '⚡ Ciclo Intensivo de Campo: Ideal para períodos de pulverização diária e alta rotatividade de baterias Smart.'
                        : '🌿 Ciclo Padrão de Manutenção: Balanceamento de tensão entre células e revisão de conectores XT90 / AS150.'
                      : currentPeriodValue <= 3
                        ? '🛠️ Ciclo Trimestral Preventivo: Calibração de capacidade total, teste de impedância e validação de descarga de armazenamento.'
                        : '🔒 Ciclo Semestral/Anual de Entressafra: Preservação de células em modo Storage (40-60% SoC) e laudo técnico.'}
                  </p>
                </div>
              </div>

              {/* Snooze (Adiar) in Days */}
              <div className="space-y-2.5 p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800">
                <label className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Tempo de Adiamento do Alerta (em Dias)
                </label>
                <p className="text-xs text-slate-600 dark:text-emerald-300/80">
                  Prazo de tolerância quando o operador clicar no botão "Adiar".
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {SNOOZE_PRESETS.map((snz) => (
                    <button
                      key={snz.days}
                      type="button"
                      onClick={() => setSettings({ ...settings, snoozeDays: snz.days })}
                      className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                        currentSnoozeDays === snz.days
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 border-emerald-500 shadow-md scale-105'
                          : 'bg-white dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300 border-slate-200 dark:border-emerald-800 hover:bg-slate-100 dark:hover:bg-emerald-900'
                      }`}
                    >
                      {snz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Settings */}
              <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-emerald-700 dark:text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Alerta Sonoro (Acoustic Web Sound)
                  </label>

                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => setSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="w-5 h-5 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {settings.soundEnabled && (
                  <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <span className="text-xs text-slate-700 dark:text-emerald-300 block mb-1">Tipo de Sinal Sonoro:</span>
                        <select
                          value={settings.soundType}
                          onChange={(e) =>
                            setSettings({ ...settings, soundType: e.target.value as any })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-white dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white text-xs"
                        >
                          <option value="CHIME">🎵 Chime Harmônico (3 Notas)</option>
                          <option value="BEEP">📟 Beep Duplo Diagnóstico</option>
                          <option value="SIREN">🚨 Sirene Modulada de Campo</option>
                          <option value="PULSE">📡 Pulso Acústico Suave</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-xs text-slate-700 dark:text-emerald-300 block mb-1">Volume ({Math.round(settings.soundVolume * 100)}%):</span>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.05"
                          value={settings.soundVolume}
                          onChange={(e) => setSettings({ ...settings, soundVolume: parseFloat(e.target.value) })}
                          className="w-full accent-emerald-500 cursor-pointer mt-2"
                        />
                      </div>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={handleTestSound}
                        className="px-3.5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Testar Som do Alerta</span>
                      </button>

                      <span className="text-[11px] text-slate-500 dark:text-emerald-300/80">
                        Não necessita arquivos externos (Síntese Web Audio)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Threshold Settings */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800 text-xs">
                <div>
                  <label className="text-slate-700 dark:text-emerald-300 block mb-1 font-semibold">
                    Saúde Mínima Tolerada (% SoH):
                  </label>
                  <input
                    type="number"
                    min="50"
                    max="100"
                    value={settings.minHealthThresholdPct}
                    onChange={(e) =>
                      setSettings({ ...settings, minHealthThresholdPct: parseInt(e.target.value) || 85 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 block mt-1">Alerta se % &lt; limite</span>
                </div>

                <div>
                  <label className="text-slate-700 dark:text-emerald-300 block mb-1 font-semibold">
                    Desbalanço Máximo (mV):
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="200"
                    value={settings.maxCellDeltaMv}
                    onChange={(e) =>
                      setSettings({ ...settings, maxCellDeltaMv: parseInt(e.target.value) || 30 })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 block mt-1">Alerta se delta &gt; limite</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-slate-200 dark:border-emerald-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs transition-all hover:scale-105 cursor-pointer shadow-md"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

