import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2,
  Settings, 
  Activity, 
  Clock, 
  Plus, 
  Trash2, 
  Info,
  HelpCircle,
  Play,
  Square,
  X,
  Wind,
  Thermometer,
  Droplets,
  Compass,
  ShieldCheck,
  AlertOctagon,
  FileText,
  Check,
  Sparkles,
  ExternalLink,
  BellOff,
  Eye,
  ChevronDown,
  ChevronUp,
  Sliders,
  Gauge,
  LayoutGrid,
  Layers
} from 'lucide-react';
import { ClimateTelemetry, WeatherAlertSettings } from '../../types';
import { DeltaTMatrixChart } from './DeltaTMatrixChart';
import { 
  playSingleBeep, 
  startSirenAlert, 
  startPulseAlert, 
  startChimeAlert, 
  stopAllAlerts 
} from '../../utils/audioAlert';
import { 
  saveWeatherAlertSettingsToCloud, 
  loadWeatherAlertSettingsFromCloud, 
  WEATHER_ALERT_STORAGE_KEY,
  DEFAULT_WEATHER_ALERT_SETTINGS 
} from '../../services/cloudSyncService';
import { formatDecimal } from '../../utils/formatters';

interface WeatherAlertOperatorPanelProps {
  orderId?: string;
  orderCode?: string;
  weatherReadings?: ClimateTelemetry[];
  onAddWeatherReading: (reading: ClimateTelemetry) => void;
  onRemoveWeatherReading: (index: number) => void;
  onSaveAlertSettings?: (settings: any) => void;
}

export const WeatherAlertOperatorPanel: React.FC<WeatherAlertOperatorPanelProps> = ({
  orderId,
  orderCode,
  weatherReadings = [],
  onAddWeatherReading,
  onRemoveWeatherReading,
}) => {
  // Weather Simulator State (So the operator can adjust metrics to test the alerts!)
  const [temperature, setTemperature] = useState<number>(24.5);
  const [humidity, setHumidity] = useState<number>(65);
  const [windSpeed, setWindSpeed] = useState<number>(8.5);
  const [windDirection, setWindDirection] = useState<number>(120);

  // Initial loaded settings from localStorage
  const initialSettings = (() => {
    try {
      const raw = localStorage.getItem(WEATHER_ALERT_STORAGE_KEY);
      if (raw) return { ...DEFAULT_WEATHER_ALERT_SETTINGS, ...JSON.parse(raw) };
    } catch (e) {}
    return DEFAULT_WEATHER_ALERT_SETTINGS;
  })();

  // Configuration State
  const [isInhibited, setIsInhibited] = useState<boolean>(initialSettings.isInhibited || false);
  const [periodicitySeconds, setPeriodicitySeconds] = useState<number>(initialSettings.periodicitySeconds || 900); // Padrão: 15 minutos (Maior que 10 min)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialSettings.soundEnabled !== false);
  const [soundType, setSoundType] = useState<'CHIME' | 'BEEP' | 'SIREN' | 'PULSE'>(initialSettings.soundType || 'CHIME');
  const [soundVolume, setSoundVolume] = useState<number>(initialSettings.soundVolume ?? 0.5);
  const [visualStrobeEnabled, setVisualStrobeEnabled] = useState<boolean>(initialSettings.visualStrobeEnabled !== false);
  const [screenEdgeAlertEnabled, setScreenEdgeAlertEnabled] = useState<boolean>(initialSettings.screenEdgeAlertEnabled !== false);
  const [readingAlertEnabled, setReadingAlertEnabled] = useState<boolean>(initialSettings.readingAlertEnabled !== false);
  const [showReadingNotification, setShowReadingNotification] = useState<boolean>(false);
  const [recordingMode, setRecordingMode] = useState<'manual' | 'auto'>(initialSettings.recordingMode || 'manual');
  const [isAudioSilenced, setIsAudioSilenced] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Delta T Scale Preference State ('matrix' | 'ruler' | 'both')
  const [deltaTScale, setDeltaTScale] = useState<'matrix' | 'ruler' | 'both'>(() => {
    try {
      const saved = localStorage.getItem('agrosys_delta_t_scale_preference');
      if (saved === 'matrix' || saved === 'ruler' || saved === 'both') {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'both';
  });

  const handleScaleChange = (scale: 'matrix' | 'ruler' | 'both') => {
    setDeltaTScale(scale);
    try {
      localStorage.setItem('agrosys_delta_t_scale_preference', scale);
    } catch {
      // Ignore
    }
  };

  // Hydrate from cloud on initial component mount
  useEffect(() => {
    async function hydrateWeatherSettings() {
      try {
        const cloudSettings = await loadWeatherAlertSettingsFromCloud();
        if (cloudSettings && typeof cloudSettings.periodicitySeconds === 'number') {
          setPeriodicitySeconds(cloudSettings.periodicitySeconds);
          setIsInhibited(!!cloudSettings.isInhibited);
          setSoundEnabled(cloudSettings.soundEnabled !== false);
          setSoundType(cloudSettings.soundType || 'CHIME');
          setSoundVolume(cloudSettings.soundVolume ?? 0.5);
          setVisualStrobeEnabled(cloudSettings.visualStrobeEnabled !== false);
          setScreenEdgeAlertEnabled(cloudSettings.screenEdgeAlertEnabled !== false);
          setReadingAlertEnabled(cloudSettings.readingAlertEnabled !== false);
          setRecordingMode(cloudSettings.recordingMode || 'manual');
        }
      } catch (err) {
        console.warn('Erro ao restaurar configurações de clima da nuvem:', err);
      }
    }
    hydrateWeatherSettings();
  }, []);

  // Persist settings whenever changed by the user
  const persistSettings = (overrides?: Partial<WeatherAlertSettings>) => {
    const updated: WeatherAlertSettings = {
      periodicitySeconds: overrides?.periodicitySeconds ?? periodicitySeconds,
      isInhibited: overrides?.isInhibited ?? isInhibited,
      soundEnabled: overrides?.soundEnabled ?? soundEnabled,
      soundType: overrides?.soundType ?? soundType,
      soundVolume: overrides?.soundVolume ?? soundVolume,
      visualStrobeEnabled: overrides?.visualStrobeEnabled ?? visualStrobeEnabled,
      screenEdgeAlertEnabled: overrides?.screenEdgeAlertEnabled ?? screenEdgeAlertEnabled,
      readingAlertEnabled: overrides?.readingAlertEnabled ?? readingAlertEnabled,
      recordingMode: overrides?.recordingMode ?? recordingMode,
    };
    saveWeatherAlertSettingsToCloud(updated).catch(() => {});
  };

  // Active alarms & Alert timing states
  const [isAlarmActive, setIsAlarmActive] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(periodicitySeconds);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Detailed Telemetry Information Modal State (Opens when clicking the toast balloon)
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState<boolean>(false);
  const [activeTelemetryData, setActiveTelemetryData] = useState<ClimateTelemetry | null>(null);
  const [hasJustRecorded, setHasJustRecorded] = useState<boolean>(false);

  // Refs for tracking interval & state values in the timer
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readingSoundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopReadingSound = () => {
    if (readingSoundIntervalRef.current) {
      clearInterval(readingSoundIntervalRef.current);
      readingSoundIntervalRef.current = null;
    }
  };

  const startReadingSound = () => {
    stopReadingSound();
    setIsAudioSilenced(false);
    const playChirp = () => {
      playSingleBeep(1100, 0.08, soundVolume * 0.7);
      setTimeout(() => {
        playSingleBeep(1400, 0.08, soundVolume * 0.7);
      }, 120);
    };
    playChirp();
    readingSoundIntervalRef.current = setInterval(playChirp, 2500);
  };

  // Calculate Delta T
  // Psychrometric approximation: Delta T = AirTemp - WetBulbTemp
  // A simplified formula for agricultural spraying Delta T:
  const calculateDeltaT = (t: number, rh: number): number => {
    // Wet bulb temperature approximation
    const tw = t * Math.atan(0.151977 * Math.sqrt(rh + 8.313596)) + 
               Math.atan(t + rh) - Math.atan(rh - 1.676331) + 
               0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) - 4.686035;
    const deltaT = t - tw;
    return parseFloat(deltaT.toFixed(1));
  };

  const deltaT = calculateDeltaT(temperature, humidity);

  // Analyze weather safety
  const checkWeatherSafety = () => {
    const activeWarnings: string[] = [];

    // Delta T guidelines (ideal is 2ºC to 8ºC)
    if (deltaT < 2.0) {
      activeWarnings.push('Delta T muito BAIXO (< 2°C): Risco de inversão térmica e permanência de névoa suspensa no ar.');
    } else if (deltaT > 8.0 && deltaT <= 10.0) {
      activeWarnings.push('Delta T no LIMITE ALTO (8°C - 10°C): Atenção para evaporação parcial de gotas finas.');
    } else if (deltaT > 10.0) {
      activeWarnings.push('Delta T CRÍTICO (> 10°C): Risco severo de evaporação imediata e perda total do produto.');
    }

    // Temperature guidelines (ideal is 15ºC to 30ºC)
    if (temperature > 30.0) {
      activeWarnings.push(`Temperatura CRÍTICA (${temperature}°C): Limite do MAPA de 30°C excedido. Risco extremo de evaporação.`);
    } else if (temperature < 15.0) {
      activeWarnings.push(`Temperatura BAIXA (${temperature}°C): Baixa absorção sistêmica pelas plantas.`);
    }

    // Relative Humidity guidelines (ideal is > 50% or > 55%)
    if (humidity < 50.0) {
      activeWarnings.push(`Umidade Relativa CRÍTICA (${humidity}%): Abaixo do limite legal de 50%. Risco extremo de evaporação.`);
    } else if (humidity < 55.0) {
      activeWarnings.push(`Umidade Relativa Alerta (${humidity}%): Atenção para o rápido declínio da umidade.`);
    }

    // Wind Speed guidelines (ideal is 3 to 10 km/h or up to 12 km/h)
    if (windSpeed > 12.0) {
      activeWarnings.push(`Vento Forte CRÍTICO (${windSpeed} km/h): Risco de deriva severa para áreas vizinhas.`);
    } else if (windSpeed < 3.0) {
      activeWarnings.push(`Ausência de Vento (${windSpeed} km/h): Risco de inversão térmica (mínimo de 3 km/h exigido).`);
    }

    return activeWarnings;
  };

  const currentWarnings = checkWeatherSafety();
  const isSafe = currentWarnings.length === 0;

  // Manage periodicity timer
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (isInhibited || periodicitySeconds <= 0) {
      setCountdown(0);
      stopAllAlerts();
      setIsAlarmActive(false);
      return;
    }

    setCountdown(periodicitySeconds);

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Trigger measurement check!
          triggerMeasurementCheck();
          return periodicitySeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopReadingSound();
    };
  }, [isInhibited, periodicitySeconds, temperature, humidity, windSpeed]);

  // Open full telemetry details modal (from clicking notification toast or manual trigger)
  const openTelemetryDetails = () => {
    playSingleBeep(1400, 0.08, 0.25);
    const safetyWarnings = checkWeatherSafety();
    const currentData: ClimateTelemetry = {
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temperatureC: parseFloat(temperature.toFixed(1)),
      relativeHumidityPct: humidity,
      windSpeedKmh: parseFloat(windSpeed.toFixed(1)),
      windDirectionDeg: windDirection,
      deltaT: deltaT,
      isSafeForSpraying: safetyWarnings.length === 0,
      warnings: safetyWarnings,
      isAutomatic: recordingMode === 'auto',
    };
    setActiveTelemetryData(currentData);
    setIsTelemetryModalOpen(true);
    setShowReadingNotification(false);
    stopReadingSound();
  };

  // Shared helper to log simulated weather state (manual or auto)
  const recordTelemetry = (isAuto: boolean = false) => {
    const safetyWarnings = checkWeatherSafety();
    const newReading: ClimateTelemetry = {
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temperatureC: parseFloat(temperature.toFixed(1)),
      relativeHumidityPct: humidity,
      windSpeedKmh: parseFloat(windSpeed.toFixed(1)),
      windDirectionDeg: windDirection,
      deltaT: deltaT,
      isSafeForSpraying: safetyWarnings.length === 0,
      warnings: safetyWarnings,
      isAutomatic: isAuto,
    };
    onAddWeatherReading(newReading);
    setActiveTelemetryData(newReading);
    setHasJustRecorded(true);
    setTimeout(() => setHasJustRecorded(false), 3000);
    
    // Play a positive confirmation beep
    playSingleBeep(1200, 0.1, 0.3);
  };

  // Actually check weather metrics and trigger sound if out of bounds
  const triggerMeasurementCheck = () => {
    const safetyWarnings = checkWeatherSafety();
    setWarnings(safetyWarnings);

    const currentSnapshot: ClimateTelemetry = {
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      temperatureC: parseFloat(temperature.toFixed(1)),
      relativeHumidityPct: humidity,
      windSpeedKmh: parseFloat(windSpeed.toFixed(1)),
      windDirectionDeg: windDirection,
      deltaT: deltaT,
      isSafeForSpraying: safetyWarnings.length === 0,
      warnings: safetyWarnings,
      isAutomatic: recordingMode === 'auto',
    };
    setActiveTelemetryData(currentSnapshot);

    if (safetyWarnings.length > 0) {
      setIsAlarmActive(true);
      if (soundEnabled && !isInhibited) {
        triggerSoundAlert();
      }
    } else {
      setIsAlarmActive(false);
      stopAllAlerts();
    }

    // AUTOMATIC RECORDING
    if (recordingMode === 'auto' && !isInhibited) {
      recordTelemetry(true);
    }

    // TRIGGER FOR THE NEXT READING ROUTINE NOTIFICATION
    if (readingAlertEnabled && !isInhibited) {
      setShowReadingNotification(true);
      startReadingSound();
    }
  };

  // Sound trigger according to user-selected sound type
  const triggerSoundAlert = () => {
    if (soundType === 'BEEP') {
      playSingleBeep(880, 0.4, soundVolume);
    } else if (soundType === 'SIREN') {
      startSirenAlert(soundVolume);
    } else if (soundType === 'PULSE') {
      startPulseAlert(soundVolume);
    } else if (soundType === 'CHIME') {
      startChimeAlert(soundVolume);
    }
  };

  // Test sound function
  const handleTestSound = () => {
    triggerSoundAlert();
    setTimeout(() => {
      stopAllAlerts();
    }, 2000);
  };

  // Log actual current simulated weather state
  const handleRecordMeasurement = () => {
    recordTelemetry(false);
  };

  // Stop alarms manually
  const handleStopAlarms = () => {
    setIsAlarmActive(false);
    stopAllAlerts();
    stopReadingSound();
    setIsAudioSilenced(true);
  };

  // Acknowledge alert and dismiss notification
  const handleAcknowledgeAlert = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playSingleBeep(1200, 0.08, 0.25);
    setShowReadingNotification(false);
    stopReadingSound();
    stopAllAlerts();
    setIsAlarmActive(false);
  };

  // Silence alert audio without immediately dismissing window
  const handleSilenceAlert = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    stopReadingSound();
    stopAllAlerts();
    setIsAudioSilenced(true);
  };

  return (
    <>
      {/* High Visibility Pulsating Screen-Edge Alert (Flashes crimson red at screen margins) */}
      {isAlarmActive && screenEdgeAlertEnabled && (
        <div className="fixed inset-0 pointer-events-none z-50 border-[10px] sm:border-[16px] border-rose-600/85 animate-pulse shadow-[inset_0_0_50px_rgba(244,63,94,0.7)]" style={{ mixBlendMode: 'screen' }} />
      )}

      {/* Visual Banner Alert for Next Reading (Floating toast at top-right of screen) */}
      {showReadingNotification && readingAlertEnabled && (
        <div 
          onClick={openTelemetryDetails}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              openTelemetryDetails();
            }
          }}
          className="fixed top-6 right-6 max-w-lg w-[calc(100vw-3rem)] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-2 border-cyan-500/70 hover:border-cyan-400 hover:shadow-[0_12px_45px_rgba(6,182,212,0.35)] rounded-2xl p-4 text-slate-900 dark:text-white flex flex-col gap-3 animate-in slide-in-from-top-8 sm:slide-in-from-right-8 duration-300 z-50 shadow-2xl cursor-pointer group transition-all transform hover:-translate-y-0.5 active:translate-y-0 select-none"
          title="Clique para abrir as informações completas da telemetria climática"
        >
          {/* Header & Main Info */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-cyan-500/15 dark:bg-cyan-500/20 group-hover:bg-cyan-500/30 flex items-center justify-center font-bold text-cyan-600 dark:text-cyan-400 animate-bounce shrink-0 border border-cyan-400/40 transition-colors shadow-2xs mt-0.5">
                <Clock className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-widest block font-mono">
                    TELEMETRIA ATUALIZADA
                  </span>
                  {isAudioSilenced ? (
                    <span className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-400/40 px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-1">
                      <VolumeX className="w-2.5 h-2.5 text-amber-600" />
                      Silenciado
                    </span>
                  ) : (
                    <span className="text-[9px] bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-400/40 px-1.5 py-0.2 rounded-full font-bold inline-flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-cyan-600" />
                      Nova Leitura
                    </span>
                  )}
                </div>
                <h4 className="text-xs sm:text-sm font-black uppercase text-slate-900 dark:text-white leading-tight mt-0.5 group-hover:text-cyan-600 dark:group-hover:text-cyan-200 transition-colors">
                  Nova Leitura Climática Executada!
                </h4>
                <p className="text-[10px] text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                  Sensores avaliaram temperatura, umidade, ventos e Delta T em tempo real.
                </p>
                
                {/* Metrics Pill List */}
                <div className="mt-1.5 flex items-center gap-2 text-[10px] text-cyan-700 dark:text-cyan-400 font-bold font-mono flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">🌡️ {formatDecimal(temperature, 1)}°C</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">💧 {humidity}%</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">💨 {formatDecimal(windSpeed, 1)} km/h</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">ΔT {formatDecimal(deltaT, 1)}°C</span>
                </div>
              </div>
            </div>

            {/* Quick Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAcknowledgeAlert(e);
              }}
              className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer shrink-0"
              title="Fechar notificação"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Bar: Reconhecer, Silenciar & Ver Detalhes */}
          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              {/* Reconhecer Alerta */}
              <button
                type="button"
                onClick={handleAcknowledgeAlert}
                className="px-3 py-1.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                title="Reconhecer a leitura, desativar alarmes e fechar a notificação"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Reconhecer</span>
              </button>

              {/* Silenciar Alerta */}
              <button
                type="button"
                onClick={handleSilenceAlert}
                disabled={isAudioSilenced}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  isAudioSilenced
                    ? 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-500 border border-slate-200 dark:border-slate-800 cursor-default'
                    : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 active:scale-95 shadow-2xs'
                }`}
                title="Silenciar o áudio e alertas sonoros da leitura"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>{isAudioSilenced ? 'Silenciado' : 'Silenciar'}</span>
              </button>
            </div>

            {/* Ver Dados */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openTelemetryDetails();
              }}
              className="px-2.5 py-1.5 rounded-xl font-bold text-xs text-cyan-700 dark:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Dados ➜</span>
            </button>
          </div>
        </div>
      )}

      {/* Detailed Telemetry Information Modal (Opened upon clicking toast balloon or manual inspection) */}
      {isTelemetryModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsTelemetryModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-cyan-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-50 via-cyan-50/60 to-slate-50 dark:from-slate-900 dark:via-cyan-950/60 dark:to-slate-900 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-400/30 dark:border-cyan-400/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-2xs">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-700 dark:text-cyan-400 font-mono">
                      DIAGNÓSTICO METEOROLÓGICO OPERACIONAL
                    </span>
                    <span className="text-[9px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full font-mono font-bold">
                      OS {orderCode}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                    Telemetria Climática em Tempo Real
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsTelemetryModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                title="Fechar Janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-200 text-xs">
              
              {/* General Operational Safety Status Banner */}
              {isSafe ? (
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-400/30 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-300 uppercase">
                        Janela Operacional Segura & Liberada
                      </strong>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 dark:bg-emerald-900/80 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Padrão MAPA / DECEA
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      As variáveis meteorológicas atuais estão rigorosamente dentro dos parâmetros normativos para pulverização com drones. Baixo risco de deriva e taxa de evaporação segura para deposição foliar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-400 border border-rose-300/60 dark:border-rose-400/30 shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-300 uppercase">
                        Atenção: Restrições Climáticas Detectadas
                      </strong>
                      <span className="text-[9px] bg-rose-100 text-rose-800 dark:bg-rose-900/80 dark:text-rose-300 px-2 py-0.5 rounded-full font-bold">
                        Ajuste Necessário
                      </span>
                    </div>
                    <ul className="text-[11px] text-rose-800 dark:text-rose-200/90 mt-1.5 list-disc list-inside space-y-1">
                      {currentWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 4 Main Parameter Cards */}
              <div>
                <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  📊 Parâmetros Climáticos Avaliados na Última Leitura ({activeTelemetryData?.timestamp || 'Agora'}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Temperatura */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        Temperatura do Ar
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        temperature >= 15 && temperature <= 30
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {temperature >= 15 && temperature <= 30 ? 'Ideal' : 'Fora da Faixa'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {formatDecimal(activeTelemetryData?.temperatureC ?? temperature, 1)} °C
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Faixa MAPA: <strong>15°C a 30°C</strong></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {temperature > 30 ? '🔥 Risco Evaporação' : temperature < 15 ? '❄️ Absorção Lenta' : '✓ Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Umidade */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        Umidade Relativa (UR)
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        humidity >= 55
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : humidity >= 50
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {humidity >= 55 ? 'Excelente' : humidity >= 50 ? 'Aceitável' : 'Crítico'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                      {activeTelemetryData?.relativeHumidityPct ?? humidity}%
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Mínimo Legal: <strong>≥ 50%</strong></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {humidity < 50 ? '⚠️ Evaporação Rápida' : '✓ Sobrevida da Gota'}
                      </span>
                    </div>
                  </div>

                  {/* Vento */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Velocidade do Vento
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        windSpeed >= 3 && windSpeed <= 12
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {windSpeed >= 3 && windSpeed <= 12 ? 'Estável' : 'Fora da Faixa'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 dark:text-white">
                        {formatDecimal(activeTelemetryData?.windSpeedKmh ?? windSpeed, 1)} km/h
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                        ({((activeTelemetryData?.windSpeedKmh ?? windSpeed) / 3.6).toFixed(1).replace('.', ',')} m/s)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Faixa MAPA: <strong>3 a 12 km/h</strong></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {windSpeed > 12 ? '💨 Risco Deriva' : windSpeed < 3 ? '🛑 Risco Inversão' : '✓ Uniforme'}
                      </span>
                    </div>
                  </div>

                  {/* Delta T */}
                  <div className="bg-slate-50 dark:bg-slate-900/90 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        Delta T (Psicrométrico)
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        deltaT >= 2 && deltaT <= 8
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                          : deltaT > 8 && deltaT <= 10
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      }`}>
                        {deltaT >= 2 && deltaT <= 8 ? 'Janela Ótima' : deltaT > 8 && deltaT <= 10 ? 'Atenção' : 'Crítico'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      {formatDecimal(activeTelemetryData?.deltaT ?? deltaT, 1)} °C
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Faixa Ideal: <strong>2°C a 8°C</strong></span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {deltaT < 2 ? 'Inversão Térmica' : deltaT > 8 ? 'Evaporação Alta' : '✓ Absorção Ótima'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Agronomic & Flight Guidelines */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-cyan-700 dark:text-cyan-400 uppercase tracking-wider block font-mono">
                  🌱 Recomendações Agronômicas para o Piloto Remoto:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span><strong>Espectro de Gotas:</strong> Gotas Médias a Grossas (250-350 µm) para evitar perda por deriva.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span><strong>Distância Regulamentar:</strong> Manter afastamento de 100m de mananciais hídricos (Portaria 298/2021).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span><strong>Altura de Voo:</strong> Manter 2,5m a 3,5m acima do dossel da cultura para máxima deposição.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">•</span>
                    <span><strong>Aditivação:</strong> Recomenda-se adjuvante antideriva/antievaporante se UR &lt; 60% ou vento &gt; 8 km/h.</span>
                  </div>
                </div>
              </div>

              {/* Registered History Section */}
              <div className="space-y-2 border-t border-slate-200 dark:border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                    Histórico Recente de Medições da OS ({weatherReadings.length})
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Modo atual: <strong>{recordingMode === 'auto' ? 'Automático' : 'Manual'}</strong>
                  </span>
                </div>
                {weatherReadings.length > 0 ? (
                  <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 max-h-32 overflow-y-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-2">Horário</th>
                          <th className="p-2">Temp</th>
                          <th className="p-2">UR</th>
                          <th className="p-2">Vento</th>
                          <th className="p-2">ΔT</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                        {weatherReadings.slice(-5).reverse().map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                            <td className="p-2 font-bold text-slate-900 dark:text-slate-300">{r.timestamp}</td>
                            <td className="p-2">{formatDecimal(r.temperatureC, 1)}°C</td>
                            <td className="p-2">{r.relativeHumidityPct}%</td>
                            <td className="p-2">{formatDecimal(r.windSpeedKmh, 1)} km/h</td>
                            <td className="p-2 text-emerald-600 dark:text-emerald-400 font-bold">{formatDecimal(r.deltaT, 1)}°C</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                r.isSafeForSpraying ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                              }`}>
                                {r.isSafeForSpraying ? 'Seguro' : 'Alerta'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic">
                    Nenhuma medição arquivada anteriormente no prontuário desta OS.
                  </p>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {hasJustRecorded 
                  ? '✅ Medição arquivada com sucesso no prontuário!' 
                  : `Associação direta ao prontuário técnico da OS ${orderCode}`}
              </span>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    handleRecordMeasurement();
                  }}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial shadow-xs ${
                    hasJustRecorded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {hasJustRecorded ? 'Arquivado ✓' : 'Salvar no Prontuário da OS'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTelemetryModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className={`rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${
        isAlarmActive && visualStrobeEnabled
          ? 'border-rose-500 ring-4 ring-rose-600/50 shadow-[0_0_30px_rgba(244,63,94,0.4)] bg-rose-50/30 dark:bg-slate-900/95 animate-pulse text-slate-900 dark:text-slate-100'
          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100'
      }`}>
        
        {/* Visual Alarm Header Banner */}
        {isAlarmActive ? (
          <div className="bg-rose-600 px-4 sm:px-5 py-2 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2.5">
              {/* Virtual emergency beacon (spinning strobe/Giroflex) */}
              {visualStrobeEnabled ? (
                <div className="relative w-6 h-6 flex items-center justify-center bg-rose-950 rounded-full border border-rose-400 overflow-hidden shrink-0 shadow-[0_0_10px_rgba(255,255,255,0.7)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent w-full h-full animate-spin" style={{ animationDuration: '0.6s', transformOrigin: 'center' }} />
                  <div className="w-3.5 h-3.5 bg-rose-500 rounded-full z-10 shadow-[0_0_8px_rgba(244,63,94,1)] animate-ping absolute" />
                  <div className="w-2 h-2 bg-white rounded-full z-20 border border-rose-600" />
                </div>
              ) : (
                <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
              )}
              <div>
                <span className="text-[9px] font-black tracking-wider uppercase text-rose-100 block">ALERTA METEOROLÓGICO OPERACIONAL</span>
                <strong className="text-xs sm:text-sm font-black text-white">CONDIÇÕES CLIMÁTICAS INSEGURAS DETECTADAS</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStopAlarms}
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 text-xs font-black rounded-lg cursor-pointer transition-colors shadow-2xs"
              >
                Silenciar
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-600 dark:bg-emerald-700 px-4 sm:px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-100 shrink-0" />
              <div>
                <span className="text-[9px] font-black tracking-wider uppercase text-emerald-100 block">MONITOR DE CLIMA DA OPERAÇÃO</span>
                <strong className="text-xs sm:text-sm font-bold text-white">CONDIÇÕES DENTRO DA JANELA OPERACIONAL SEGURA</strong>
              </div>
            </div>
            <span className="text-[9.5px] bg-emerald-700/80 border border-emerald-500/50 text-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
              Ativo & Monitorando
            </span>
          </div>
        )}

      <div className="p-3 sm:p-4 space-y-3.5">
        
        {/* Upper Section: Dashboard and Adjusters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
          
          {/* Main Visual Gauges (Left Side - Expands to 12 cols when config is hidden) */}
          <div className={`${isSettingsOpen ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Telemetria Climática em Tempo Real
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRecordMeasurement}
                  className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    recordingMode === 'auto'
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                  }`}
                  title={recordingMode === 'auto' ? 'Registrar Leitura Pontual' : 'Salvar Medição Manual'}
                >
                  <Plus className="w-3 h-3" />
                  <span className="hidden sm:inline">{recordingMode === 'auto' ? 'Registrar' : 'Salvar no Prontuário'}</span>
                  <span className="sm:hidden">Salvar</span>
                </button>
                
                {!isInhibited && periodicitySeconds > 0 && (
                  <div className="text-[10.5px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-800 shadow-2xs">
                    <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Próxima leitura em <strong>{countdown}s</strong></span>
                    <span className="sm:hidden"><strong>{countdown}s</strong></span>
                  </div>
                )}

                {/* Toggle Button for Alert Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(!isSettingsOpen);
                    playSingleBeep(1100, 0.06, 0.2);
                  }}
                  className={`text-[10.5px] font-bold px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                    isSettingsOpen
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                  title={isSettingsOpen ? 'Ocultar configurações de alerta' : 'Abrir configurações de alerta'}
                >
                  <Settings className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden sm:inline">{isSettingsOpen ? 'Fechar Ajustes' : 'Configurar Alertas'}</span>
                  <span className="sm:hidden">Config</span>
                  {isSettingsOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Visual Signal Tower and Gauge Grid Side-by-Side Container */}
            <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-2.5">
              
              {/* Virtual LED Signal Tower (Torre de Luz de Automação Agroindustrial) */}
              {(() => {
                const hasCritical = currentWarnings.some(w => w.toLowerCase().includes('crítica') || w.toLowerCase().includes('crítico') || w.toLowerCase().includes('severo') || w.toLowerCase().includes('extremo'));
                const hasAlert = currentWarnings.length > 0 && !hasCritical;
                const isGreen = currentWarnings.length === 0;

                return (
                  <div className="flex sm:flex-col items-center justify-around gap-1 bg-slate-100 dark:bg-slate-950 p-1 sm:px-1.5 sm:py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 w-full sm:w-12 shrink-0 shadow-inner max-h-[92px]">
                    <span className="text-[5.5px] font-black tracking-widest text-slate-500 uppercase text-center hidden sm:block leading-tight">TORRE</span>
                    
                    {/* RED LED (CRITICAL ALARM) */}
                    <div className="flex flex-col items-center gap-0" title="Status Crítico">
                      <div className={`w-4 h-4 rounded-full border transition-all duration-300 flex items-center justify-center ${
                        hasCritical
                          ? 'bg-rose-600 border-rose-400 shadow-[0_0_10px_rgba(244,63,94,1)] animate-pulse'
                          : 'bg-rose-100/60 dark:bg-rose-950/20 border-rose-300/60 dark:border-rose-950/60 text-rose-300 dark:text-rose-950/30'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hasCritical ? 'bg-white shadow-[0_0_4px_white] animate-ping' : 'bg-rose-300/40 dark:bg-rose-950/50'}`} />
                      </div>
                      <span className={`text-[5px] font-black uppercase tracking-tighter ${hasCritical ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>CRÍTICO</span>
                    </div>

                    {/* YELLOW LED (CAUTION / MARGINAL CONDITIONS) */}
                    <div className="flex flex-col items-center gap-0" title="Status Alerta">
                      <div className={`w-4 h-4 rounded-full border transition-all duration-300 flex items-center justify-center ${
                        hasAlert
                          ? 'bg-amber-500 border-amber-300 shadow-[0_0_10px_rgba(245,158,11,1)] animate-bounce'
                          : 'bg-amber-100/60 dark:bg-amber-950/20 border-amber-300/60 dark:border-amber-950/60 text-amber-300 dark:text-amber-950/30'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${hasAlert ? 'bg-white shadow-[0_0_4px_white]' : 'bg-amber-300/40 dark:bg-amber-950/50'}`} />
                      </div>
                      <span className={`text-[5px] font-black uppercase tracking-tighter ${hasAlert ? 'text-amber-600 font-bold' : 'text-slate-400'}`}>ALERTA</span>
                    </div>

                    {/* GREEN LED (SAFE / OPERATIONAL) */}
                    <div className="flex flex-col items-center gap-0" title="Status Seguro">
                      <div className={`w-4 h-4 rounded-full border transition-all duration-300 flex items-center justify-center ${
                        isGreen
                          ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,1)]'
                          : 'bg-emerald-100/60 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-950/60 text-emerald-300 dark:text-emerald-950/30'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${isGreen ? 'bg-white shadow-[0_0_4px_white]' : 'bg-emerald-300/40 dark:bg-emerald-950/50'}`} />
                      </div>
                      <span className={`text-[5px] font-black uppercase tracking-tighter ${isGreen ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>SEGURO</span>
                    </div>
                  </div>
                );
              })()}

              {/* Grid of Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1">
                {/* Temp Gauge */}
                {(() => {
                  const min = 10, max = 35, idealMin = 15, idealMax = 30;
                  const percent = Math.min(Math.max(((temperature - min) / (max - min)) * 100, 0), 100);
                  const isViolation = temperature > idealMax || temperature < idealMin;
                  return (
                    <div className={`p-2 rounded-xl border transition-all flex flex-col justify-between shadow-2xs group hover:shadow-md ${
                      isViolation
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-300' 
                        : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    }`}>
                      <div className="text-center">
                        <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-tight">TEMPERATURA</span>
                        
                        <div className="flex justify-center items-baseline gap-0.5 mt-0.5">
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step="0.5"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                            className={`w-14 sm:w-16 text-center bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-lg font-black p-0 m-0 ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                          />
                          <span className={`text-[9px] font-bold ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>°C</span>
                        </div>
                        
                        <span className="text-[7.5px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                          Limite: {idealMin}°C a {idealMax}°C
                        </span>
                      </div>

                      {/* Interactive Visual Progress / Range Slider */}
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[7px] text-slate-400 font-semibold mb-1">
                          <span>{min}°C</span>
                          <span className={isViolation ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                            {isViolation ? 'FORA' : 'IDEAL'}
                          </span>
                          <span>{max}°C</span>
                        </div>
                        
                        <div className="relative h-1.5 w-full mt-0.5">
                          <div className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-200 ${isViolation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step="0.5"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Deslize para ajustar a temperatura"
                          />
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm pointer-events-none transition-colors group-hover:scale-110 z-0 ${isViolation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ left: `clamp(0%, calc(${percent}% - 6px), 100% - 12px)` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Humidity Gauge */}
                {(() => {
                  const min = 30, max = 100, idealMin = 50;
                  const percent = Math.min(Math.max(((humidity - min) / (max - min)) * 100, 0), 100);
                  const isViolation = humidity < idealMin;
                  return (
                    <div className={`p-2 rounded-xl border transition-all flex flex-col justify-between shadow-2xs group hover:shadow-md ${
                      isViolation 
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-300' 
                        : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    }`}>
                      <div className="text-center">
                        <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-tight">UMIDADE</span>
                        
                        <div className="flex justify-center items-baseline gap-0.5 mt-0.5">
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step="1"
                            value={humidity}
                            onChange={(e) => setHumidity(parseInt(e.target.value) || 0)}
                            className={`w-14 sm:w-16 text-center bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-lg font-black p-0 m-0 ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                          />
                          <span className={`text-[9px] font-bold ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>%</span>
                        </div>
                        
                        <span className="text-[7.5px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                          Limite: &gt; {idealMin}%
                        </span>
                      </div>

                      {/* Interactive Visual Progress / Range Slider */}
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[7px] text-slate-400 font-semibold mb-1">
                          <span>{min}%</span>
                          <span className={isViolation ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                            {isViolation ? 'BAIXA' : 'OK'}
                          </span>
                          <span>{max}%</span>
                        </div>
                        
                        <div className="relative h-1.5 w-full mt-0.5">
                          <div className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-200 ${isViolation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step="1"
                            value={humidity}
                            onChange={(e) => setHumidity(parseInt(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Deslize para ajustar a umidade"
                          />
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm pointer-events-none transition-colors group-hover:scale-110 z-0 ${isViolation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ left: `clamp(0%, calc(${percent}% - 6px), 100% - 12px)` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Wind Speed Gauge */}
                {(() => {
                  const min = 0, max = 20, idealMin = 3, idealMax = 12;
                  const percent = Math.min(Math.max(((windSpeed - min) / (max - min)) * 100, 0), 100);
                  const isViolation = windSpeed > idealMax || windSpeed < idealMin;
                  return (
                    <div className={`p-2 rounded-xl border transition-all flex flex-col justify-between shadow-2xs group hover:shadow-md ${
                      isViolation
                        ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800/60 text-rose-800 dark:text-rose-300' 
                        : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    }`}>
                      <div className="text-center">
                        <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-tight">VENTO</span>
                        
                        <div className="flex justify-center items-baseline gap-0.5 mt-0.5">
                          <input
                            type="number"
                            min={min}
                            max={max}
                            step="0.5"
                            value={windSpeed}
                            onChange={(e) => setWindSpeed(parseFloat(e.target.value) || 0)}
                            className={`w-14 sm:w-16 text-center bg-transparent border-b-2 border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 outline-none transition-all text-base sm:text-lg font-black p-0 m-0 ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}
                          />
                          <span className={`text-[9px] font-bold ${isViolation ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>km/h</span>
                        </div>
                        
                        <span className="text-[7.5px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                          Limite: {idealMin} a {idealMax} km/h
                        </span>
                      </div>

                      {/* Interactive Visual Progress / Range Slider */}
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[7px] text-slate-400 font-semibold mb-1">
                          <span>{min}</span>
                          <span className={isViolation ? 'text-rose-500 font-bold' : 'text-emerald-600 font-bold'}>
                            {windSpeed > idealMax ? 'FORTE' : windSpeed < idealMin ? 'CALMO' : 'IDEAL'}
                          </span>
                          <span>{max}</span>
                        </div>
                        
                        <div className="relative h-1.5 w-full mt-0.5">
                          <div className="absolute inset-0 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-200 ${isViolation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <input
                            type="range"
                            min={min}
                            max={max}
                            step="0.5"
                            value={windSpeed}
                            onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            title="Deslize para ajustar a velocidade do vento"
                          />
                          <div 
                            className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-sm pointer-events-none transition-colors group-hover:scale-110 z-0 ${isViolation ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ left: `clamp(0%, calc(${percent}% - 6px), 100% - 12px)` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Delta T Gauge */}
                {(() => {
                  const min = 0, max = 12, idealMin = 2, idealMax = 8;
                  const percent = Math.min(Math.max(((deltaT - min) / (max - min)) * 100, 0), 100);
                  const isViolation = deltaT < idealMin || deltaT > idealMax;
                  return (
                    <div className={`p-2 rounded-xl border transition-all flex flex-col justify-between shadow-2xs ${
                      isViolation 
                        ? 'bg-amber-50/80 dark:bg-rose-950/40 border-amber-300 dark:border-rose-800/60 text-amber-800 dark:text-rose-300' 
                        : 'bg-slate-50/80 dark:bg-slate-950 border-slate-200/80 dark:border-slate-800'
                    }`}>
                      <div className="text-center">
                        <span className="text-[8.5px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-tight">DELTA T</span>
                        <span className={`text-base sm:text-lg font-black block mt-0.5 ${
                          isViolation ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {deltaT.toFixed(1).replace('.', ',')} °C
                        </span>
                        <span className="text-[7.5px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium">
                          Ideal: {idealMin}°C a {idealMax}°C
                        </span>
                      </div>

                      {/* Visual Progress / Range Indicator */}
                      <div className="mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <div className="flex justify-between items-center text-[7px] text-slate-400 font-semibold mb-0.5">
                          <span>{min}°C</span>
                          <span className={isViolation ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                            {isViolation ? 'ATENÇÃO' : 'IDEAL'}
                          </span>
                          <span>{max}°C</span>
                        </div>
                        <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full relative overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-500 rounded-full ${
                              isViolation ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* DELTA T SCALE SELECTION & DISPLAY CONTAINER */}
            <div className="space-y-2.5">
              {/* View Mode Switcher Header */}
              <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-emerald-500/20 rounded-xl p-2 sm:p-2.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-[11px] sm:text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      Visualização de Delta T na Operação
                      <span className="text-[8.5px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono">
                        EMBRAPA / MAPA
                      </span>
                    </h4>
                    <p className="text-[9.5px] text-slate-500 dark:text-slate-400">
                      Alterne entre a Matriz 2D (T x UR), Régua Técnica Linear ou exiba ambas lado a lado.
                    </p>
                  </div>
                </div>

                {/* Switcher Buttons */}
                <div className="flex items-center p-0.5 bg-slate-200/60 dark:bg-slate-900 rounded-xl border border-slate-300/60 dark:border-slate-800 gap-1 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleScaleChange('both')}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      deltaTScale === 'both'
                        ? 'bg-white dark:bg-emerald-900/90 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Exibir as duas escalas lado a lado no mesmo alinhamento"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Lado a Lado (Ambas)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScaleChange('matrix')}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      deltaTScale === 'matrix'
                        ? 'bg-white dark:bg-emerald-900/90 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Escala 1: Matriz psicrométrica 2D (Temperatura x Umidade)"
                  >
                    <LayoutGrid className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Escala 1 (Matriz 2D)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleScaleChange('ruler')}
                    className={`px-2 py-1 rounded-lg text-[10.5px] font-bold transition-all flex items-center gap-1 cursor-pointer ${
                      deltaTScale === 'ruler'
                        ? 'bg-white dark:bg-emerald-900/90 text-slate-900 dark:text-white shadow-xs font-black'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title="Escala 2: Régua técnica horizontal padronizada EMBRAPA / MAPA"
                  >
                    <Gauge className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Escala 2 (Régua EMBRAPA)</span>
                  </button>
                </div>
              </div>

              {/* DUAL SCALES CONTAINER: SIDE BY SIDE WHEN 'both' */}
              <div className={deltaTScale === 'both' ? 'grid grid-cols-1 xl:grid-cols-2 gap-3 items-stretch' : 'space-y-3'}>
                {/* SCALE 1: 2D PSYCHROMETRIC MATRIX (MINIMALIST PREMIUM) */}
                {(deltaTScale === 'matrix' || deltaTScale === 'both') && (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs flex flex-col justify-between h-full">
                    <DeltaTMatrixChart
                      currentTemp={activeTelemetryData?.temperature ?? temperature}
                      currentHumidity={activeTelemetryData?.humidity ?? humidity}
                      compact={true}
                      onSelectPoint={(t, rh) => {
                        setTemperature(t);
                        setHumidity(rh);
                      }}
                      isSimulating={!activeTelemetryData}
                    />
                  </div>
                )}

                {/* SCALE 2: LINEAR TECHNICAL RULER (EMBRAPA / MAPA) */}
                {(deltaTScale === 'ruler' || deltaTScale === 'both') && (
                  <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 shadow-2xs flex flex-col justify-between h-full space-y-2.5">
                    {/* Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div>
                        <h4 className="text-[11px] sm:text-xs font-black text-emerald-950 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
                          <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          Escala 2: Régua Técnica EMBRAPA / MAPA
                        </h4>
                        <p className="text-[9.5px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
                          Indicador psicrométrico termodinâmico para controle de evaporação e deposição aeroagrícola.
                        </p>
                      </div>

                      {/* Live Delta T Status Pill Badge */}
                      <div className="flex items-center gap-1 font-mono font-bold text-[11px] bg-white dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs shrink-0">
                        <span className="text-slate-500">ΔT:</span>
                        <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${
                          deltaT < 2.0
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300'
                            : deltaT <= 8.0
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : deltaT <= 10.0
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'bg-rose-600 text-white shadow-2xs'
                        }`}>
                          {deltaT.toFixed(1).replace('.', ',')} °C • {
                            deltaT < 2.0 ? 'Inversão' : deltaT <= 8.0 ? 'IDEAL EMBRAPA' : deltaT <= 10.0 ? 'Atenção' : 'Proibido'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Dynamic Pointer Track */}
                    <div className="relative pt-6 pb-1 px-1">
                      {/* Pointer Marker */}
                      <div
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300 ease-out"
                        style={{
                          left: `${Math.min(97, Math.max(3, (deltaT / 12) * 100))}%`,
                        }}
                      >
                        <div className={`px-2 py-0.2 rounded-full text-[9px] font-mono font-black shadow-md flex items-center gap-1 border whitespace-nowrap ${
                          deltaT < 2.0
                            ? 'bg-sky-600 text-white border-sky-300'
                            : deltaT <= 8.0
                            ? 'bg-emerald-600 text-white border-emerald-300'
                            : deltaT <= 10.0
                            ? 'bg-amber-600 text-white border-amber-300'
                            : 'bg-rose-600 text-white border-rose-300'
                        }`}>
                          <span>▲ {deltaT.toFixed(1).replace('.', ',')}°C</span>
                          <span className="opacity-90">({
                            deltaT < 2.0 ? 'Inversão' : deltaT <= 8.0 ? 'FAIXA IDEAL' : deltaT <= 10.0 ? 'Atenção' : 'Crítico'
                          })</span>
                        </div>
                        <div className={`w-2 h-2 rotate-45 -mt-1 ${
                          deltaT < 2.0 ? 'bg-sky-600' : deltaT <= 8.0 ? 'bg-emerald-600' : deltaT <= 10.0 ? 'bg-amber-600' : 'bg-rose-600'
                        }`} />
                      </div>

                      {/* Segmented Color Track */}
                      <div className="h-5 w-full rounded-2xl overflow-hidden flex text-[9px] font-extrabold text-white shadow-inner p-0.5 bg-emerald-950/80 border border-emerald-700/60">
                        {/* < 2°C Inversao */}
                        <div 
                          style={{ width: '16.66%' }} 
                          className={`h-full rounded-l-xl flex items-center justify-center transition-all bg-gradient-to-r from-sky-400 to-cyan-500 text-emerald-950 ${
                            deltaT < 2.0 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-80'
                          }`}
                          title="< 2°C: Risco de Inversão Térmica e Escorrimento Foliar"
                        >
                          <span className="truncate px-1">&lt; 2°C</span>
                        </div>

                        {/* 2° to 8°C Ideal */}
                        <div 
                          style={{ width: '50%' }} 
                          className={`h-full flex items-center justify-center transition-all bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 ${
                            deltaT >= 2.0 && deltaT <= 8.0 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-80'
                          }`}
                          title="2° a 8°C: Faixa Ideal EMBRAPA / MAPA"
                        >
                          <span className="truncate px-1 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-300 hidden sm:inline" />
                            2° a 8°C (FAIXA IDEAL)
                          </span>
                        </div>

                        {/* 8° to 10°C Atencao */}
                        <div 
                          style={{ width: '16.66%' }} 
                          className={`h-full flex items-center justify-center transition-all bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 ${
                            deltaT > 8.0 && deltaT <= 10.0 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-80'
                          }`}
                          title="8° a 10°C: Evaporação Rápida - Exige Gota Grossa e Adjuvante"
                        >
                          <span className="truncate px-1">8° a 10°C</span>
                        </div>

                        {/* > 10°C Proibido */}
                        <div 
                          style={{ width: '16.66%' }} 
                          className={`h-full rounded-r-xl flex items-center justify-center transition-all bg-gradient-to-r from-rose-500 to-red-600 ${
                            deltaT > 10.0 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-80'
                          }`}
                          title="> 10°C: Evaporação Crítica - Decolagem Bloqueada"
                        >
                          <span className="truncate px-1">&gt; 10°C</span>
                        </div>
                      </div>

                      {/* Ruler Ticks */}
                      <div className="flex justify-between text-[8.5px] text-emerald-800/80 dark:text-emerald-300/80 font-mono font-bold mt-0.5 px-1">
                        <span>0°C</span>
                        <span>2°C</span>
                        <span>5°C (Centro)</span>
                        <span>8°C</span>
                        <span>10°C</span>
                      </div>
                    </div>

                    {/* 4 Interactive Agronomic Technical Cards */}
                    <div className={`grid gap-1.5 text-xs pt-0.5 ${deltaTScale === 'both' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
                      <div className={`p-2 rounded-xl border transition-all ${
                        deltaT < 2.0 
                          ? 'bg-sky-500/15 border-sky-400 dark:border-sky-500 ring-2 ring-sky-400/50 shadow-xs scale-[1.01]' 
                          : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
                      }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-black text-[10.5px] text-sky-700 dark:text-sky-300">&lt; 2.0 °C</span>
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-sky-500/20 text-sky-800 dark:text-sky-200">
                            {deltaT < 2.0 ? '★ ATUAL' : 'Baixo'}
                          </span>
                        </div>
                        <h5 className="font-bold text-emerald-950 dark:text-white text-[10.5px] mb-0.5">Inversão / Orvalho</h5>
                        <p className="text-[9.5px] text-emerald-800/80 dark:text-emerald-300/70 leading-tight">
                          Ar saturado. Gotas não evaporam e flutuam sem penetrar.
                        </p>
                      </div>

                      <div className={`p-2 rounded-xl border transition-all ${
                        deltaT >= 2.0 && deltaT <= 8.0 
                          ? 'bg-emerald-500/20 border-emerald-400 dark:border-emerald-400 ring-2 ring-emerald-400/60 shadow-xs scale-[1.01]' 
                          : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
                      }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-black text-[10.5px] text-emerald-700 dark:text-emerald-300">2.0° a 8.0 °C</span>
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex items-center gap-0.5">
                            <Sparkles className="w-2 h-2 text-amber-400" />
                            {deltaT >= 2.0 && deltaT <= 8.0 ? '★ ATUAL' : 'Ideal'}
                          </span>
                        </div>
                        <h5 className="font-bold text-emerald-950 dark:text-white text-[10.5px] mb-0.5">Janela Otimizada</h5>
                        <p className="text-[9.5px] text-emerald-800/80 dark:text-emerald-300/70 leading-tight">
                          Máxima absorção estomática e mínima perda aeroagrícola.
                        </p>
                      </div>

                      <div className={`p-2 rounded-xl border transition-all ${
                        deltaT > 8.0 && deltaT <= 10.0 
                          ? 'bg-amber-500/20 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/60 shadow-xs scale-[1.01]' 
                          : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
                      }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-black text-[10.5px] text-amber-700 dark:text-amber-300">8.0° a 10.0 °C</span>
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-amber-500/30 text-amber-900 dark:text-amber-100">
                            {deltaT > 8.0 && deltaT <= 10.0 ? '★ ATUAL' : 'Atenção'}
                          </span>
                        </div>
                        <h5 className="font-bold text-emerald-950 dark:text-white text-[10.5px] mb-0.5">Evaporação Rápida</h5>
                        <p className="text-[9.5px] text-emerald-800/80 dark:text-emerald-300/70 leading-tight">
                          Gotas grossas + adjuvante anti-evaporante mandatório.
                        </p>
                      </div>

                      <div className={`p-2 rounded-xl border transition-all ${
                        deltaT > 10.0 
                          ? 'bg-rose-500/20 border-rose-400 dark:border-rose-400 ring-2 ring-rose-400/60 shadow-xs scale-[1.01]' 
                          : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
                      }`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-mono font-black text-[10.5px] text-rose-700 dark:text-rose-300">&gt; 10.0 °C</span>
                          <span className="text-[8px] font-bold px-1 py-0.2 rounded bg-rose-500/30 text-rose-900 dark:text-rose-100">
                            {deltaT > 10.0 ? '★ ATUAL' : 'Crítico'}
                          </span>
                        </div>
                        <h5 className="font-bold text-emerald-950 dark:text-white text-[10.5px] mb-0.5">Decolagem Bloqueada</h5>
                        <p className="text-[9.5px] text-emerald-800/80 dark:text-emerald-300/70 leading-tight">
                          Evaporação instantânea no ar. Aplicação estritamente proibida.
                        </p>
                      </div>
                    </div>

                    {/* Technical Agronomic Prescriptions Box */}
                    <div className="p-2.5 rounded-xl bg-white/80 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 mt-auto">
                      <div className="flex items-center gap-1 font-bold text-emerald-950 dark:text-emerald-100 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Prescrição Técnica Operacional (EMBRAPA / MAPA):</span>
                      </div>
                      <p className="text-[10px] text-slate-700 dark:text-slate-300 leading-tight font-medium">
                        {deltaT < 2.0 && '⚠️ ATENÇÃO: Delta T < 2°C indica saturação. Gotas finas flutuam sem penetrar no dossel (risco de inversão). Monitore vento.'}
                        {deltaT >= 2.0 && deltaT <= 8.0 && '✨ CONDIÇÃO EXCELENTE: Delta T dentro da Faixa Otimizada EMBRAPA / MAPA (2° a 8°C). Máxima absorção estomática e perda mínima.'}
                        {deltaT > 8.0 && deltaT <= 10.0 && '⚠️ ATENÇÃO: Delta T elevado (8° a 10°C). Ajuste para gotas médias/grossas (250-350 µm) e use adjuvante anti-evaporante.'}
                        {deltaT > 10.0 && '⛔ RESTRIÇÃO SEVERA: Delta T > 10°C. Alta taxa de evaporação pré-alvo. Interromper aplicação imediatamente.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warnings Alert Banner list */}
            {currentWarnings.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-xl p-2.5 text-xs text-rose-900 dark:text-rose-200 space-y-1 shadow-2xs">
                <p className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[9.5px]">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Inadequações Climáticas Detectadas:
                </p>
                <ul className="list-disc list-inside space-y-0.5 pl-1 text-slate-700 dark:text-slate-300 text-[10.5px]">
                  {currentWarnings.map((warn, index) => (
                    <li key={index} className="leading-tight">{warn}</li>
                  ))}
                </ul>
              </div>
            )}


          </div>

          {/* Alert Config Controls (Right Side - 5 Cols, Visible when isSettingsOpen is true) */}
          {isSettingsOpen && (
            <div className="lg:col-span-5 bg-slate-50/80 dark:bg-slate-950 p-3 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-4 shadow-2xs animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1.5">
                <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Configurar Alertas Meteorológicos
                </h4>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Ocultar Painel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Periodicity & Inhibitor settings */}
              <div className="space-y-2.5 text-xs">
                
                {/* Enable / Inhibit Radio Toggle */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Estado de Monitoramento</span>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => {
                          setIsInhibited(false);
                          persistSettings({ isInhibited: false });
                          playSingleBeep(1200, 0.08, 0.2);
                        }}
                        className={`px-2.5 py-0.5 text-[9.5px] font-black uppercase rounded-md cursor-pointer transition-colors ${
                          !isInhibited 
                            ? 'bg-emerald-600 text-white shadow-2xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        ATIVO
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsInhibited(true);
                          persistSettings({ isInhibited: true });
                          stopAllAlerts();
                          setIsAlarmActive(false);
                          playSingleBeep(600, 0.15, 0.2);
                        }}
                        className={`px-2.5 py-0.5 text-[9.5px] font-black uppercase rounded-md cursor-pointer transition-colors ${
                          isInhibited 
                            ? 'bg-rose-600 text-white shadow-2xs' 
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                      >
                        INIBIDO (MUTED)
                      </button>
                    </div>
                  </div>

                {/* Periodicity Selector */}
                <div className="flex items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-900 pt-2">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-slate-700 dark:text-slate-300">Periodicidade de Checagem</span>
                    <HelpCircle className="w-3.5 h-3.5 text-slate-400" title="Tempo entre reavaliações do clima operacional" />
                  </div>
                  <select
                    disabled={isInhibited}
                    value={periodicitySeconds}
                    onChange={(e) => {
                      const secs = parseInt(e.target.value);
                      setPeriodicitySeconds(secs);
                      persistSettings({ periodicitySeconds: secs });
                      playSingleBeep(900, 0.08, 0.2);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-[10.5px] font-bold p-1 rounded-lg focus:outline-none focus:border-emerald-500 disabled:opacity-50 cursor-pointer shadow-2xs"
                  >
                    <option value={900}>A cada 15 minutos (Padrão)</option>
                    <option value={1200}>A cada 20 minutos</option>
                    <option value={1800}>A cada 30 minutos</option>
                    <option value={2700}>A cada 45 minutos</option>
                    <option value={3600}>A cada 1 hora</option>
                    <option value={7200}>A cada 2 horas</option>
                  </select>
                </div>

                {/* Sound Enabled and Volume */}
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-900 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-rose-500" />}
                      Alerta Acústico (Sonoro)
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        disabled={isInhibited}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setSoundEnabled(val);
                          persistSettings({ soundEnabled: val });
                          if (!val) stopAllAlerts();
                        }}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                    </label>
                  </div>

                  {soundEnabled && !isInhibited && (
                    <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5 animate-in slide-in-from-top-1 shadow-2xs">
                      {/* Sound Type */}
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">Tom do Alarme:</span>
                        <div className="flex flex-wrap gap-1">
                          {(['CHIME', 'BEEP', 'SIREN', 'PULSE'] as const).map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setSoundType(type);
                                persistSettings({ soundType: type });
                                playSingleBeep(type === 'BEEP' ? 880 : 520, 0.1, soundVolume);
                              }}
                              className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold cursor-pointer uppercase transition-colors ${
                                soundType === type 
                                  ? 'bg-emerald-600 text-white font-black shadow-2xs' 
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Volume Slider */}
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="text-slate-500 dark:text-slate-400 font-semibold">Volume:</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{Math.round(soundVolume * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={soundVolume}
                          onChange={(e) => {
                            const vol = parseFloat(e.target.value);
                            setSoundVolume(vol);
                            persistSettings({ soundVolume: vol });
                          }}
                          className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none"
                        />
                      </div>

                      {/* Test Trigger Button */}
                      <button
                        type="button"
                        onClick={handleTestSound}
                        className="w-full mt-0.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-emerald-400 border border-emerald-500/30 font-bold text-[10.5px] rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Play className="w-3 h-3" />
                        Testar Alarme Acústico
                      </button>
                    </div>
                  )}
                </div>

                {/* Visual Alerts Configuration */}
                <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-900 pt-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase tracking-wider">
                    Sinalização Visual de Emergência
                  </span>
                  
                  {/* Visual Strobe Switch */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse border border-rose-400" />
                      Giroflex no Painel
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={visualStrobeEnabled}
                        disabled={isInhibited}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setVisualStrobeEnabled(val);
                          persistSettings({ visualStrobeEnabled: val });
                        }}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                    </label>
                  </div>

                  {/* Screen Edge Flash Switch */}
                  <div className="flex items-center justify-between pt-0.5">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-600 border border-red-500" />
                      Flash nas Bordas da Tela
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={screenEdgeAlertEnabled}
                        disabled={isInhibited}
                        onChange={(e) => setScreenEdgeAlertEnabled(e.target.checked)}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                    </label>
                  </div>
                </div>

                {/* Routine Readings Configuration */}
                <div className="space-y-2 border-t border-slate-200 dark:border-slate-900 pt-2">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block text-[9.5px] uppercase tracking-wider">
                    Notificação de Rotina (Próxima Leitura)
                  </span>
                  
                  {/* Next Reading Alert Switch */}
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 text-xs">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse border border-cyan-400" />
                      Aviso de Nova Leitura
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={readingAlertEnabled}
                        disabled={isInhibited}
                        onChange={(e) => setReadingAlertEnabled(e.target.checked)}
                        className="sr-only peer cursor-pointer"
                      />
                      <div className="w-8 h-4.5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                    </label>
                  </div>

                  {/* Recording Mode Selector */}
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-900/60">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 text-[11px]">
                        <Activity className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Origem da Coleta
                      </span>
                      <div className="flex bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingMode('auto');
                            playSingleBeep(1400, 0.05, 0.2);
                          }}
                          className={`px-2 py-0.5 text-[9.5px] font-bold rounded-md transition-all duration-150 cursor-pointer ${
                            recordingMode === 'auto'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          ⚡ Auto
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRecordingMode('manual');
                            playSingleBeep(1200, 0.05, 0.2);
                          }}
                          className={`px-2 py-0.5 text-[9.5px] font-bold rounded-md transition-all duration-150 cursor-pointer ${
                            recordingMode === 'manual'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                          }`}
                        >
                          ✋ Manual
                        </button>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-tight bg-slate-100/60 dark:bg-slate-900/40 p-1.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                      {recordingMode === 'auto'
                        ? '⚡ Auto: Medições sincronizadas em tempo real via sensores integrados.'
                        : '✋ Manual: Equipe afere com termo-higrômetro/anemômetro de mão.'}
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Lower Section: Table of Registered Readings */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Histórico de Medições Meteorológicas ({weatherReadings.length})
              </h4>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:inline">• Prontuário técnico da pulverização</span>
            </div>
          </div>

          {weatherReadings.length === 0 ? (
            <div className="p-3 bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl text-center text-slate-500 dark:text-slate-400 text-[11px]">
              Nenhuma medição arquivada para esta operação. Ajuste os sensores e clique em 
              <strong className="text-emerald-600 dark:text-emerald-400"> "Salvar no Prontuário" </strong> para coletar dados.
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-36 overflow-y-auto shadow-2xs">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9.5px] uppercase">
                  <tr>
                    <th className="py-2 px-2.5">Horário</th>
                    <th className="py-2 px-2.5">Temp</th>
                    <th className="py-2 px-2.5">Umidade</th>
                    <th className="py-2 px-2.5">Vento</th>
                    <th className="py-2 px-2.5">Delta T</th>
                    <th className="py-2 px-2.5 text-center">Origem</th>
                    <th className="py-2 px-2.5 text-center">Status</th>
                    <th className="py-2 px-2.5 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                  {weatherReadings.map((reading, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-900/40">
                      <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 dark:text-slate-300">{reading.timestamp}</td>
                      <td className="py-1.5 px-2.5 font-mono">{reading.temperatureC.toFixed(1).replace('.', ',')} °C</td>
                      <td className="py-1.5 px-2.5 font-mono">{reading.relativeHumidityPct}%</td>
                      <td className="py-1.5 px-2.5 font-mono">{reading.windSpeedKmh.toFixed(1).replace('.', ',')} km/h</td>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{reading.deltaT.toFixed(1).replace('.', ',')} °C</td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[8.5px] font-black uppercase ${
                          reading.isAutomatic 
                            ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/60' 
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
                        }`}>
                          {reading.isAutomatic ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-center">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[8.5px] font-bold uppercase ${
                          reading.isSafeForSpraying 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400 border border-rose-200 dark:border-rose-900'
                        }`}>
                          {reading.isSafeForSpraying ? 'Seguro' : 'Alerta'}
                        </span>
                      </td>
                      <td className="py-1.5 px-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveWeatherReading(idx)}
                          className="p-1 text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md cursor-pointer"
                          title="Remover Registro"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  </>
);
};
