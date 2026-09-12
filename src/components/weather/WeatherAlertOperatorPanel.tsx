import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  CheckCircle, 
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
  ExternalLink
} from 'lucide-react';
import { ClimateTelemetry } from '../../types';
import { 
  playSingleBeep, 
  startSirenAlert, 
  startPulseAlert, 
  startChimeAlert, 
  stopAllAlerts 
} from '../../utils/audioAlert';
import { formatDecimal } from '../../utils/formatters';

interface WeatherAlertOperatorPanelProps {
  orderId: string;
  orderCode: string;
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

  // Configuration State
  const [isInhibited, setIsInhibited] = useState<boolean>(false);
  const [periodicitySeconds, setPeriodicitySeconds] = useState<number>(15); // Default 15s for interactive demo, normally minutes
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [soundType, setSoundType] = useState<'CHIME' | 'BEEP' | 'SIREN' | 'PULSE'>('CHIME');
  const [soundVolume, setSoundVolume] = useState<number>(0.5);
  const [visualStrobeEnabled, setVisualStrobeEnabled] = useState<boolean>(true);
  const [screenEdgeAlertEnabled, setScreenEdgeAlertEnabled] = useState<boolean>(true);
  const [readingAlertEnabled, setReadingAlertEnabled] = useState<boolean>(true);
  const [showReadingNotification, setShowReadingNotification] = useState<boolean>(false);
  const [recordingMode, setRecordingMode] = useState<'manual' | 'auto'>('manual');

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
          className="fixed top-6 right-6 max-w-md w-[calc(100vw-3rem)] bg-slate-950/95 backdrop-blur-md border-2 border-cyan-500/70 hover:border-cyan-400 hover:shadow-[0_12px_45px_rgba(6,182,212,0.45)] rounded-2xl p-4 text-white flex items-center justify-between gap-4 animate-in slide-in-from-top-8 sm:slide-in-from-right-8 duration-300 z-50 shadow-[0_12px_40px_rgba(6,182,212,0.35)] cursor-pointer group transition-all transform hover:-translate-y-0.5 active:translate-y-0 select-none"
          title="Clique para abrir as informações completas da telemetria climática"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/20 group-hover:bg-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 animate-bounce shrink-0 border border-cyan-400/40 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Clock className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest block font-mono">TELEMETRIA ATUALIZADA</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 px-1.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 group-hover:bg-cyan-500/30 transition-colors">
                  <Sparkles className="w-2.5 h-2.5 text-cyan-300" />
                  Abrir Informações
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-black uppercase text-white leading-tight mt-0.5 group-hover:text-cyan-200 transition-colors">
                Nova Leitura Climática Executada!
              </h4>
              <p className="text-[10px] text-slate-300 mt-0.5">
                Os sensores avaliaram as condições atuais de temperatura, umidade, ventos e Delta T em tempo real.
              </p>
              <div className="mt-1 flex items-center gap-2 text-[9px] text-cyan-400 font-semibold font-mono">
                <span>🌡️ {formatDecimal(temperature, 1)}°C</span>
                <span>•</span>
                <span>💧 {humidity}%</span>
                <span>•</span>
                <span>💨 {formatDecimal(windSpeed, 1)} km/h</span>
                <span>•</span>
                <span className="text-emerald-400">ΔT {formatDecimal(deltaT, 1)}°C</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                playSingleBeep(1200, 0.05, 0.2);
                setShowReadingNotification(false);
                stopReadingSound();
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-bold rounded-lg cursor-pointer transition-colors"
              title="Fechar notificação"
            >
              Fechar
            </button>
            <span className="text-[9px] text-cyan-300 font-bold group-hover:underline flex items-center gap-0.5">
              Ver Dados ➜
            </span>
          </div>
        </div>
      )}

      {/* Detailed Telemetry Information Modal (Opened upon clicking toast balloon or manual inspection) */}
      {isTelemetryModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200"
          onClick={() => setIsTelemetryModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-2xl bg-slate-950 border-2 border-cyan-500/50 rounded-3xl shadow-[0_25px_70px_rgba(6,182,212,0.35)] overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-cyan-950/60 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">
                      DIAGNÓSTICO METEOROLÓGICO OPERACIONAL
                    </span>
                    <span className="text-[9px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-mono">
                      OS {orderCode}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-tight">
                    Telemetria Climática em Tempo Real
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsTelemetryModalOpen(false)}
                className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Fechar Janela"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-200 text-xs">
              
              {/* General Operational Safety Status Banner */}
              {isSafe ? (
                <div className="bg-emerald-950/40 border border-emerald-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm font-black text-emerald-300 uppercase">
                        Janela Operacional Segura & Liberada
                      </strong>
                      <span className="text-[9px] bg-emerald-900/80 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                        Padrão MAPA / DECEA
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                      As variáveis meteorológicas atuais estão rigorosamente dentro dos parâmetros normativos para pulverização com drones. Baixo risco de deriva e taxa de evaporação segura para deposição foliar.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-rose-950/40 border border-rose-800/80 rounded-2xl p-4 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-400/30 shrink-0">
                    <AlertOctagon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-xs sm:text-sm font-black text-rose-300 uppercase">
                        Atenção: Restrições Climáticas Detectadas
                      </strong>
                      <span className="text-[9px] bg-rose-900/80 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                        Ajuste Necessário
                      </span>
                    </div>
                    <ul className="text-[11px] text-rose-200/90 mt-1.5 list-disc list-inside space-y-1">
                      {currentWarnings.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* 4 Main Parameter Cards */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2 font-mono">
                  📊 Parâmetros Climáticos Avaliados na Última Leitura ({activeTelemetryData?.timestamp || 'Agora'}):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Temperatura */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                        Temperatura do Ar
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        temperature >= 15 && temperature <= 30
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {temperature >= 15 && temperature <= 30 ? 'Ideal' : 'Fora da Faixa'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {formatDecimal(activeTelemetryData?.temperatureC ?? temperature, 1)} °C
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Faixa MAPA: <strong>15°C a 30°C</strong></span>
                      <span className="text-slate-500">
                        {temperature > 30 ? '🔥 Risco Evaporação' : temperature < 15 ? '❄️ Absorção Lenta' : '✓ Normal'}
                      </span>
                    </div>
                  </div>

                  {/* Umidade */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-cyan-400" />
                        Umidade Relativa (UR)
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        humidity >= 55
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : humidity >= 50
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {humidity >= 55 ? 'Excelente' : humidity >= 50 ? 'Aceitável' : 'Crítico'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-white">
                      {activeTelemetryData?.relativeHumidityPct ?? humidity}%
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Mínimo Legal: <strong>≥ 50%</strong></span>
                      <span className="text-slate-500">
                        {humidity < 50 ? '⚠️ Evaporação Rápida' : '✓ Sobrevida da Gota'}
                      </span>
                    </div>
                  </div>

                  {/* Vento */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Wind className="w-3.5 h-3.5 text-emerald-400" />
                        Velocidade do Vento
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        windSpeed >= 3 && windSpeed <= 12
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {windSpeed >= 3 && windSpeed <= 12 ? 'Estável' : 'Fora da Faixa'}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-xl sm:text-2xl font-black font-mono text-white">
                        {formatDecimal(activeTelemetryData?.windSpeedKmh ?? windSpeed, 1)} km/h
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        ({((activeTelemetryData?.windSpeedKmh ?? windSpeed) / 3.6).toFixed(1).replace('.', ',')} m/s)
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Faixa MAPA: <strong>3 a 12 km/h</strong></span>
                      <span className="text-slate-500">
                        {windSpeed > 12 ? '💨 Risco Deriva' : windSpeed < 3 ? '🛑 Risco Inversão' : '✓ Uniforme'}
                      </span>
                    </div>
                  </div>

                  {/* Delta T */}
                  <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-purple-400" />
                        Delta T (Psicrométrico)
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        deltaT >= 2 && deltaT <= 8
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : deltaT > 8 && deltaT <= 10
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-rose-950 text-rose-400 border border-rose-800'
                      }`}>
                        {deltaT >= 2 && deltaT <= 8 ? 'Janela Ótima' : deltaT > 8 && deltaT <= 10 ? 'Atenção' : 'Crítico'}
                      </span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                      {formatDecimal(activeTelemetryData?.deltaT ?? deltaT, 1)} °C
                    </div>
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 flex items-center justify-between">
                      <span>Faixa Ideal: <strong>2°C a 8°C</strong></span>
                      <span className="text-slate-500">
                        {deltaT < 2 ? 'Inversão Térmica' : deltaT > 8 ? 'Evaporação Alta' : '✓ Absorção Ótima'}
                      </span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Agronomic & Flight Guidelines */}
              <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-wider block font-mono">
                  🌱 Recomendações Agronômicas para o Piloto Remoto:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Espectro de Gotas:</strong> Gotas Médias a Grossas (250-350 µm) para evitar perda por deriva.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Distância Regulamentar:</strong> Manter afastamento de 100m de mananciais hídricos (Portaria 298/2021).</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Altura de Voo:</strong> Manter 2,5m a 3,5m acima do dossel da cultura para máxima deposição.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong>Aditivação:</strong> Recomenda-se adjuvante antideriva/antievaporante se UR &lt; 60% ou vento &gt; 8 km/h.</span>
                  </div>
                </div>
              </div>

              {/* Registered History Section */}
              <div className="space-y-2 border-t border-slate-800/80 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">
                    Histórico Recente de Medições da OS ({weatherReadings.length})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Modo atual: <strong>{recordingMode === 'auto' ? 'Automático' : 'Manual'}</strong>
                  </span>
                </div>
                {weatherReadings.length > 0 ? (
                  <div className="bg-slate-950 rounded-xl border border-slate-800 max-h-32 overflow-y-auto">
                    <table className="w-full text-left text-[10px]">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="p-2">Horário</th>
                          <th className="p-2">Temp</th>
                          <th className="p-2">UR</th>
                          <th className="p-2">Vento</th>
                          <th className="p-2">ΔT</th>
                          <th className="p-2 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {weatherReadings.slice(-5).reverse().map((r, i) => (
                          <tr key={i} className="hover:bg-slate-900/40">
                            <td className="p-2 font-bold text-slate-300">{r.timestamp}</td>
                            <td className="p-2">{formatDecimal(r.temperatureC, 1)}°C</td>
                            <td className="p-2">{r.relativeHumidityPct}%</td>
                            <td className="p-2">{formatDecimal(r.windSpeedKmh, 1)} km/h</td>
                            <td className="p-2 text-emerald-400 font-bold">{formatDecimal(r.deltaT, 1)}°C</td>
                            <td className="p-2 text-center">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                r.isSafeForSpraying ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
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
            <div className="bg-slate-900 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[10px] text-slate-400">
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
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-initial ${
                    hasJustRecorded
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  {hasJustRecorded ? 'Arquivado ✓' : 'Salvar no Prontuário da OS'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsTelemetryModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      <div className={`text-slate-100 rounded-3xl border shadow-xl overflow-hidden transition-all duration-300 ${
        isAlarmActive && visualStrobeEnabled
          ? 'border-rose-500 ring-4 ring-rose-600/50 shadow-[0_0_30px_rgba(244,63,94,0.7)] bg-slate-900/95 animate-pulse'
          : 'border-slate-800 bg-slate-900'
      }`}>
        
        {/* Visual Alarm Header Banner */}
        {isAlarmActive ? (
          <div className="bg-rose-600 px-6 py-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              {/* Virtual emergency beacon (spinning strobe/Giroflex) */}
              {visualStrobeEnabled ? (
                <div className="relative w-8 h-8 flex items-center justify-center bg-rose-950 rounded-full border border-rose-400 overflow-hidden shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.7)]">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent w-full h-full animate-spin" style={{ animationDuration: '0.6s', transformOrigin: 'center' }} />
                  <div className="w-4.5 h-4.5 bg-rose-500 rounded-full z-10 shadow-[0_0_12px_rgba(244,63,94,1)] animate-ping absolute" />
                  <div className="w-2.5 h-2.5 bg-white rounded-full z-20 border border-rose-600" />
                </div>
              ) : (
                <AlertTriangle className="w-5 h-5 text-white animate-bounce shrink-0" />
              )}
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-rose-100 block">ALERTA METEOROLÓGICO OPERACIONAL</span>
                <strong className="text-xs sm:text-sm font-black text-white">CONDIÇÕES CLIMÁTICAS INSEGURAS DETECTADAS</strong>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleStopAlarms}
                className="px-3 py-1 bg-white hover:bg-rose-50 text-rose-600 text-xs font-black rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Silenciar Alertas
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-600 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-100" />
              <div>
                <span className="text-[10px] font-black tracking-wider uppercase text-emerald-100 block">MONITOR DE CLIMA DA OPERAÇÃO</span>
                <strong className="text-xs sm:text-sm font-bold text-white">CONDIÇÕES DENTRO DA JANELA OPERACIONAL SEGURA</strong>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-700/80 border border-emerald-500/50 text-emerald-100 px-2.5 py-1 rounded-full font-bold">
              Ativo & Monitorando
            </span>
          </div>
        )}

      <div className="p-5 sm:p-6 space-y-6">
        
        {/* Upper Section: Dashboard and Adjusters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Visual Gauges (Left Side - 7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-400" />
                Telemetria Climática em Tempo Real
              </h3>
              
              {!isInhibited && periodicitySeconds > 0 && (
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-950 px-3 py-1 rounded-full border border-slate-800">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Próxima leitura em <strong>{countdown}s</strong></span>
                </div>
              )}
            </div>

            {/* Visual Signal Tower and Gauge Grid Side-by-Side Container */}
            <div className="flex flex-col sm:flex-row items-stretch gap-4">
              
              {/* Virtual LED Signal Tower (Torre de Luz de Automação Agroindustrial) */}
              <div className="flex sm:flex-col items-center justify-around sm:justify-center gap-3 bg-slate-950 p-3 sm:px-3 sm:py-4 rounded-2xl border border-slate-800/80 w-full sm:w-20 shrink-0 shadow-inner">
                <span className="text-[8px] font-black tracking-widest text-slate-500 uppercase text-center hidden sm:block leading-tight">TORRE LED</span>
                
                {/* RED LED (CRITICAL ALARM) */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    isAlarmActive
                      ? 'bg-rose-600 border-rose-400 shadow-[0_0_20px_rgba(244,63,94,1)] animate-pulse'
                      : 'bg-rose-950/20 border-rose-950/60 text-rose-950/30'
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${isAlarmActive ? 'bg-white shadow-[0_0_8px_white] animate-ping' : 'bg-rose-950/50'}`} />
                  </div>
                  <span className="text-[6px] font-black text-slate-500 uppercase tracking-tighter">CRÍTICO</span>
                </div>

                {/* YELLOW LED (CAUTION / MARGINAL CONDITIONS) */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    !isSafe && !isAlarmActive
                      ? 'bg-amber-500 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,1)] animate-bounce'
                      : 'bg-amber-950/20 border-amber-950/60 text-amber-950/30'
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${(!isSafe && !isAlarmActive) ? 'bg-white shadow-[0_0_8px_white]' : 'bg-amber-950/50'}`} />
                  </div>
                  <span className="text-[6px] font-black text-slate-500 uppercase tracking-tighter">ALERTA</span>
                </div>

                {/* GREEN LED (SAFE / OPERATIONAL) */}
                <div className="flex flex-col items-center gap-0.5">
                  <div className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                    isSafe
                      ? 'bg-emerald-500 border-emerald-300 shadow-[0_0_20px_rgba(16,185,129,1)]'
                      : 'bg-emerald-950/20 border-emerald-950/60 text-emerald-950/30'
                  }`}>
                    <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${isSafe ? 'bg-white shadow-[0_0_8px_white]' : 'bg-emerald-950/50'}`} />
                  </div>
                  <span className="text-[6px] font-black text-slate-500 uppercase tracking-tighter">SEGURO</span>
                </div>
              </div>

              {/* Grid of Gauges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1">
                {/* Temp Gauge */}
                <div className={`p-3.5 rounded-2xl border transition-all text-center ${
                  temperature > 30.0 || temperature < 15.0 
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 shadow-2xs shadow-rose-950/20' 
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">TEMPERATURA</span>
                  <span className={`text-xl sm:text-2xl font-black block mt-1 ${
                    temperature > 30.0 || temperature < 15.0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {temperature.toFixed(1).replace('.', ',')} °C
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-1">Limite: 15°C a 30°C</span>
                </div>

                {/* Humidity Gauge */}
                <div className={`p-3.5 rounded-2xl border transition-all text-center ${
                  humidity < 50.0 
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 shadow-2xs shadow-rose-950/20' 
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">UMIDADE</span>
                  <span className={`text-xl sm:text-2xl font-black block mt-1 ${
                    humidity < 50.0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {humidity}%
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-1">Limite: &gt; 50%</span>
                </div>

                {/* Wind Speed Gauge */}
                <div className={`p-3.5 rounded-2xl border transition-all text-center ${
                  windSpeed > 12.0 || windSpeed < 3.0
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 shadow-2xs shadow-rose-950/20' 
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">VELOCIDADE VENTO</span>
                  <span className={`text-xl sm:text-2xl font-black block mt-1 ${
                    windSpeed > 12.0 || windSpeed < 3.0 ? 'text-rose-400' : 'text-emerald-400'
                  }`}>
                    {windSpeed.toFixed(1).replace('.', ',')} km/h
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-1">Limite: 3 a 12 km/h</span>
                </div>

                {/* Delta T Gauge */}
                <div className={`p-3.5 rounded-2xl border transition-all text-center ${
                  deltaT < 2.0 || deltaT > 8.0 
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 shadow-2xs shadow-rose-950/20' 
                    : 'bg-slate-950 border-slate-800'
                }`}>
                  <span className="text-[10px] font-bold text-slate-400 block uppercase">DELTA T</span>
                  <span className={`text-xl sm:text-2xl font-black block mt-1 ${
                    deltaT < 2.0 || deltaT > 8.0 ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {deltaT.toFixed(1).replace('.', ',')} °C
                  </span>
                  <span className="text-[9px] text-slate-500 block mt-1">Ideal: 2°C a 8°C</span>
                </div>
              </div>

            </div>

            {/* Warnings Alert Banner list */}
            {currentWarnings.length > 0 && (
              <div className="bg-rose-950/50 border border-rose-900/60 rounded-2xl p-4 text-xs text-rose-200 space-y-1.5">
                <p className="font-bold text-rose-400 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <AlertTriangle className="w-4 h-4" />
                  Inadequações Climáticas Detectadas:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-1 text-slate-300">
                  {currentWarnings.map((warn, index) => (
                    <li key={index} className="leading-tight">{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Record current reading action bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <strong className="text-xs text-white block">
                  {recordingMode === 'auto' 
                    ? '🔄 Registro Automático Ativo' 
                    : 'Deseja arquivar esta medição meteorológica?'}
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {recordingMode === 'auto' 
                    ? 'As medições estão sendo arquivadas de forma automática ao final de cada contagem.' 
                    : `Associe ao prontuário da OS ${orderCode} para inserção no relatório técnico.`}
                </span>
              </div>
              <button
                onClick={handleRecordMeasurement}
                className={`w-full sm:w-auto px-5 py-2.5 font-black text-xs rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 ${
                  recordingMode === 'auto'
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <Plus className="w-4 h-4" />
                {recordingMode === 'auto' ? 'Forçar Registro Manual' : 'Registrar Medição Climática'}
              </button>
            </div>
          </div>

          {/* Alert Config & Adjuster Simulation Controls (Right Side - 5 Cols) */}
          <div className="lg:col-span-5 bg-slate-950 p-4 sm:p-5 rounded-2xl border border-slate-800 space-y-5">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2">
                <Settings className="w-3.5 h-3.5 text-emerald-400" />
                Configurar Alertas Meteorológicos
              </h4>
            </div>

            {/* Periodicity & Inhibitor settings */}
            <div className="space-y-3 text-xs">
              
              {/* Enable / Inhibit Radio Toggle */}
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Estado de Monitoramento</span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsInhibited(false);
                      playSingleBeep(1000, 0.08, 0.2);
                    }}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md cursor-pointer transition-colors ${
                      !isInhibited 
                        ? 'bg-emerald-600 text-white shadow-2xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ATIVO
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsInhibited(true);
                      stopAllAlerts();
                      setIsAlarmActive(false);
                      playSingleBeep(600, 0.15, 0.2);
                    }}
                    className={`px-3 py-1 text-[10px] font-black uppercase rounded-md cursor-pointer transition-colors ${
                      isInhibited 
                        ? 'bg-rose-600 text-white shadow-2xs' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    INIBIDO (MUTED)
                  </button>
                </div>
              </div>

              {/* Periodicity Selector */}
              <div className="flex items-center justify-between gap-2 border-t border-slate-900 pt-2.5">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-slate-300">Periodisidade de Checagem</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-500" title="Tempo entre reavaliações do clima operacional" />
                </div>
                <select
                  disabled={isInhibited}
                  value={periodicitySeconds}
                  onChange={(e) => {
                    const secs = parseInt(e.target.value);
                    setPeriodicitySeconds(secs);
                    playSingleBeep(900, 0.08, 0.2);
                  }}
                  className="bg-slate-900 border border-slate-800 text-slate-200 text-[11px] font-bold p-1.5 rounded-lg focus:outline-none focus:border-emerald-500 disabled:opacity-50 cursor-pointer"
                >
                  <option value={5}>A cada 5 segundos (Demo)</option>
                  <option value={15}>A cada 15 segundos (Demo)</option>
                  <option value={30}>A cada 30 segundos (Demo)</option>
                  <option value={60}>A cada 1 minuto (MIP)</option>
                  <option value={300}>A cada 5 minutos</option>
                  <option value={900}>A cada 15 minutos</option>
                </select>
              </div>

              {/* Sound Enabled and Volume */}
              <div className="space-y-2 border-t border-slate-900 pt-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5">
                    {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
                    Alerta Acústico (Sonoro)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      disabled={isInhibited}
                      onChange={(e) => {
                        setSoundEnabled(e.target.checked);
                        if (!e.target.checked) stopAllAlerts();
                      }}
                      className="sr-only peer cursor-pointer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                  </label>
                </div>

                {soundEnabled && !isInhibited && (
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-2 animate-in slide-in-from-top-1">
                    {/* Sound Type */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 font-semibold">Tom do Alarme:</span>
                      <div className="flex flex-wrap gap-1">
                        {(['CHIME', 'BEEP', 'SIREN', 'PULSE'] as const).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setSoundType(type);
                              playSingleBeep(type === 'BEEP' ? 880 : 520, 0.1, soundVolume);
                            }}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer uppercase ${
                              soundType === type 
                                ? 'bg-emerald-600 text-white font-black' 
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Volume Slider */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400 font-semibold">Volume do Alerta:</span>
                        <span className="font-bold text-slate-300">{Math.round(soundVolume * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={soundVolume}
                        onChange={(e) => setSoundVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* Test Trigger Button */}
                    <button
                      type="button"
                      onClick={handleTestSound}
                      className="w-full mt-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30 font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Testar Alarme Acústico
                    </button>
                  </div>
                )}
              </div>

              {/* Visual Alerts Configuration */}
              <div className="space-y-2 border-t border-slate-900 pt-2.5">
                <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider">
                  Sinalização Visual de Emergência
                </span>
                
                {/* Visual Strobe Switch */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse border border-rose-400" />
                    Giroflex & Alerta no Painel
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visualStrobeEnabled}
                      disabled={isInhibited}
                      onChange={(e) => setVisualStrobeEnabled(e.target.checked)}
                      className="sr-only peer cursor-pointer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                  </label>
                </div>

                {/* Screen Edge Flash Switch */}
                <div className="flex items-center justify-between pt-1">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-500" />
                    Estrobo nas Bordas da Tela (Flash)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={screenEdgeAlertEnabled}
                      disabled={isInhibited}
                      onChange={(e) => setScreenEdgeAlertEnabled(e.target.checked)}
                      className="sr-only peer cursor-pointer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                  </label>
                </div>
              </div>

              {/* Routine Readings Configuration */}
              <div className="space-y-3 border-t border-slate-900 pt-2.5">
                <span className="font-bold text-slate-400 block text-[10px] uppercase tracking-wider">
                  Notificação de Rotina (Próxima Leitura)
                </span>
                
                {/* Next Reading Alert Switch */}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse border border-cyan-400" />
                    Aviso de Nova Leitura (Visual & Som)
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={readingAlertEnabled}
                      disabled={isInhibited}
                      onChange={(e) => setReadingAlertEnabled(e.target.checked)}
                      className="sr-only peer cursor-pointer"
                    />
                    <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600 cursor-pointer" />
                  </label>
                </div>

                {/* Recording Mode Selector */}
                <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-900/60">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-emerald-400 animate-pulse" />
                      Modo de Registro Climático
                    </span>
                    <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setRecordingMode('manual');
                          playSingleBeep(1200, 0.05, 0.2);
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all duration-150 cursor-pointer ${
                          recordingMode === 'manual'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRecordingMode('auto');
                          playSingleBeep(1400, 0.05, 0.2);
                        }}
                        className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all duration-150 cursor-pointer ${
                          recordingMode === 'auto'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Automático
                      </button>
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-400 leading-tight">
                    {recordingMode === 'manual'
                      ? 'Requer que o operador clique no botão "Registrar" para salvar dados no prontuário.'
                      : 'O sistema registra e arquiva as condições meteorológicas automaticamente ao final de cada contagem.'}
                  </p>
                </div>
              </div>

              {/* Weather Simulator adjusters (For testing alerts easily) */}
              <div className="space-y-2 border-t border-slate-900 pt-3">
                <span className="font-bold text-slate-300 flex items-center gap-1 text-[11px] uppercase tracking-wider text-emerald-400">
                  <Settings className="w-3.5 h-3.5" />
                  Simular Alterações de Clima:
                </span>
                <p className="text-[10px] text-slate-400 leading-tight">
                  Altere os controles para forçar violações meteorológicas e conferir o disparo imediato dos alertas visuais e sonoros:
                </p>

                <div className="space-y-2.5 bg-slate-900 p-3 rounded-xl border border-slate-800 text-[11px]">
                  {/* Temperature slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Temperatura Externa:</span>
                      <strong className={`font-mono ${temperature > 30.0 ? 'text-rose-400 font-black' : 'text-slate-200'}`}>
                        {temperature.toFixed(1).replace('.', ',')} °C
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="0.5"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Humidity slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Umidade Relativa:</span>
                      <strong className={`font-mono ${humidity < 50 ? 'text-rose-400 font-black' : 'text-slate-200'}`}>
                        {humidity}%
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="90"
                      step="1"
                      value={humidity}
                      onChange={(e) => setHumidity(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Wind speed slider */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Velocidade do Vento:</span>
                      <strong className={`font-mono ${windSpeed > 12.0 || windSpeed < 3.0 ? 'text-rose-400 font-black' : 'text-slate-200'}`}>
                        {windSpeed.toFixed(1).replace('.', ',')} km/h
                      </strong>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="0.5"
                      value={windSpeed}
                      onChange={(e) => setWindSpeed(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Lower Section: Table of Registered Readings */}
        <div className="border-t border-slate-800 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-white uppercase tracking-wider">
                Histórico de Medições Meteorológicas Arquivadas ({weatherReadings.length})
              </h4>
              <p className="text-[10px] text-slate-400">Dados climatológicos salvos para esta pulverização.</p>
            </div>
          </div>

          {weatherReadings.length === 0 ? (
            <div className="p-6 bg-slate-950 border border-slate-800 rounded-2xl text-center text-slate-400 text-xs">
              Nenhuma medição arquivada para esta operação. Ajuste os sensores acima e clique em 
              <strong className="text-emerald-400"> "Registrar Medição" </strong> para coletar dados.
            </div>
          ) : (
            <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold text-[10px] uppercase">
                    <th className="p-3">Horário</th>
                    <th className="p-3">Temp (°C)</th>
                    <th className="p-3">Umidade (%)</th>
                    <th className="p-3">Vento (km/h)</th>
                    <th className="p-3">Delta T (°C)</th>
                    <th className="p-3 text-center">Origem</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {weatherReadings.map((reading, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono font-bold text-slate-400">{reading.timestamp}</td>
                      <td className="p-3 font-mono">{reading.temperatureC.toFixed(1).replace('.', ',')} °C</td>
                      <td className="p-3 font-mono">{reading.relativeHumidityPct}%</td>
                      <td className="p-3 font-mono">{reading.windSpeedKmh.toFixed(1).replace('.', ',')} km/h</td>
                      <td className="p-3 font-mono font-bold text-emerald-400">{reading.deltaT.toFixed(1).replace('.', ',')} °C</td>
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                          reading.isAutomatic 
                            ? 'bg-cyan-950 text-cyan-400 border border-cyan-900/60' 
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
                          {reading.isAutomatic ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                          reading.isSafeForSpraying 
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' 
                            : 'bg-rose-950 text-rose-400 border border-rose-900'
                        }`}>
                          {reading.isSafeForSpraying ? 'Seguro' : 'Alerta'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => onRemoveWeatherReading(idx)}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-lg cursor-pointer"
                          title="Remover Registro"
                        >
                          <Trash2 className="w-4 h-4" />
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
