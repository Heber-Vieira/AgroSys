import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  AlertTriangle, 
  ShieldCheck, 
  MapPin, 
  User, 
  Cpu, 
  Droplets, 
  Wind, 
  Thermometer, 
  FileCheck, 
  DollarSign, 
  ArrowRight, 
  RefreshCw,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Award,
  Layers
} from 'lucide-react';
import { TOUR_STEPS } from '../data/tourStepsData';
import { WhiteLabelTheme, AppViewMode, UserProfile } from '../types';
import { formatDecimal, formatBRL, formatHectares, formatPercent } from '../utils/formatters';

interface VirtualTourViewProps {
  currentUser?: UserProfile;
  theme: WhiteLabelTheme;
  onNavigate?: (view: AppViewMode) => void;
  onStartLiveTour?: () => void;
}

export const VirtualTourView: React.FC<VirtualTourViewProps> = ({ 
  currentUser,
  theme,
  onNavigate,
  onStartLiveTour
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([0]);

  // Interactive Simulation State: Step 2 (Calda)
  const [sprayHectares, setSprayHectares] = useState<number>(48.5);
  const [sprayRateLHa, setSprayRateLHa] = useState<number>(10.0);

  // Interactive Simulation State: Step 3 (Weather)
  const [simulatedWind, setSimulatedWind] = useState<number>(7.5);
  const [simulatedTemp, setSimulatedTemp] = useState<number>(25.0);
  const [simulatedHumidity, setSimulatedHumidity] = useState<number>(62);

  // Interactive Simulation State: Step 4 (Telemetry Flight Simulator)
  const [isPlayingFlight, setIsPlayingFlight] = useState<boolean>(false);
  const [flightProgress, setFlightProgress] = useState<number>(45);

  // Flight animation loop
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlayingFlight) {
      interval = setInterval(() => {
        setFlightProgress(prev => {
          if (prev >= 100) {
            setIsPlayingFlight(false);
            return 100;
          }
          return Math.min(100, prev + 2);
        });
      }, 150);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlayingFlight]);

  // Interactive Simulation State: Step 6 (Financial Simulator)
  const [finHectares, setFinHectares] = useState<number>(48.5);
  const [finRatePerHa, setFinRatePerHa] = useState<number>(75.0);
  const [finPilotRatePerHa, setFinPilotRatePerHa] = useState<number>(8.0);
  const [finAssistRatePerHa, setFinAssistRatePerHa] = useState<number>(3.0);

  // Delta T Calculation approximation: T_dry - T_wet
  const wetBulbApprox = simulatedTemp * Math.atan(0.151977 * Math.sqrt(simulatedHumidity + 8.313659)) +
    Math.atan(simulatedTemp + simulatedHumidity) -
    Math.atan(simulatedHumidity - 1.676331) +
    0.00391838 * Math.pow(simulatedHumidity, 1.5) * Math.atan(0.023101 * simulatedHumidity) - 4.686035;
  const deltaT = Math.max(0.5, Math.round((simulatedTemp - wetBulbApprox) * 10) / 10);

  const isWeatherBlocked = simulatedWind > 15.0 || deltaT > 8.0 || deltaT < 2.0 || simulatedHumidity < 50;

  const currentStep = TOUR_STEPS[currentStepIdx] || TOUR_STEPS[0];

  const handleNext = () => {
    if (currentStepIdx < TOUR_STEPS.length - 1) {
      const nextIdx = currentStepIdx + 1;
      setCurrentStepIdx(nextIdx);
      if (!completedSteps.includes(nextIdx)) {
        setCompletedSteps(prev => [...prev, nextIdx]);
      }
    }
  };

  const handlePrev = () => {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIdx(0);
    setCompletedSteps([0]);
    setIsPlayingFlight(false);
    setFlightProgress(45);
  };

  const handleSafeNavigate = (view: AppViewMode) => {
    if (onNavigate) {
      onNavigate(view);
    }
  };

  // Step 2 Calculations
  const totalSprayLiters = Math.round(sprayHectares * sprayRateLHa);
  const tankCapacity = 40; // DJI T40 / T50 tank
  const numberOfTanks = Math.ceil(totalSprayLiters / tankCapacity);

  // Step 6 Calculations
  const finGrossTotal = finHectares * finRatePerHa;
  const finPilotCommission = finHectares * finPilotRatePerHa;
  const finAssistCommission = finHectares * finAssistRatePerHa;
  const finNetRevenue = finGrossTotal - (finPilotCommission + finAssistCommission);
  const finMarginPct = finGrossTotal > 0 ? Math.round((finNetRevenue / finGrossTotal) * 100) : 0;

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Top Banner: Interactive Mode Selector */}
      <div className="bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 text-slate-900 dark:text-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-2xs flex-shrink-0"
            style={{ backgroundColor: theme.primaryColor }}
          >
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Centro de Treinamento & Tour Virtual
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-2xs">
                Interativo
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
              Ciclo operacional de pulverização com simulações de campo e tour guiado pelas telas.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto self-start md:self-auto">
          {onStartLiveTour && (
            <button
              onClick={onStartLiveTour}
              className="w-full md:w-auto px-3 py-1.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Tour Guiado pelas Telas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tour Progress Bar & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              Etapa {currentStepIdx + 1} de {TOUR_STEPS.length}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                {currentStep.title}
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Perfil Responsável: <strong>{currentStep.role}</strong>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reiniciar simulador"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentStepIdx === 0}
                onClick={handlePrev}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={currentStepIdx === TOUR_STEPS.length - 1}
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-xs transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span>Próximo Passo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stepper Timeline Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          {TOUR_STEPS.map((step, idx) => {
            const isDone = completedSteps.includes(idx) && idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;

            return (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentStepIdx(idx);
                  if (!completedSteps.includes(idx)) {
                    setCompletedSteps(prev => [...prev, idx]);
                  }
                }}
                className={`p-2.5 rounded-xl text-left transition-all border cursor-pointer ${
                  isCurrent
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 dark:border-emerald-600 ring-2 ring-emerald-500/20'
                    : isDone
                    ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-700 text-slate-500'
                    : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold font-mono text-slate-400">
                    ETAPA 0{idx + 1}
                  </span>
                  {isDone ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  ) : isCurrent ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  ) : null}
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {step.title.split('. ')[1] || step.title}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Stage Box */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contextual Guidance & Tip Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <span
              className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: theme.primaryColor }}
            >
              {currentStep.badge}
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Perfil: {currentStep.role}
            </span>
          </div>

          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            {currentStep.title}
          </h3>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {currentStep.description}
          </p>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
            <div className="font-bold flex items-center gap-1.5 mb-1">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Dica Agronômica & Conformidade:
            </div>
            {currentStep.tipText}
          </div>

          {/* Direct module jump buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {currentStepIdx === 0 && (
              <button
                onClick={() => handleSafeNavigate('orders')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Abrir Gestão de Ordens de Serviço Real</span>
              </button>
            )}

            {currentStepIdx === 1 && (
              <button
                onClick={() => handleSafeNavigate('spray-mix')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-500" />
                <span>Abrir Calculadora de Calda & NR-31 Real</span>
              </button>
            )}

            {currentStepIdx === 2 && (
              <button
                onClick={() => handleSafeNavigate('weather')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-cyan-500" />
                <span>Abrir Estação Meteorológica & Delta T Real</span>
              </button>
            )}

            {currentStepIdx === 3 && (
              <button
                onClick={() => handleSafeNavigate('telemetry')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Abrir Importador de Telemetria Real</span>
              </button>
            )}

            {currentStepIdx === 4 && (
              <button
                onClick={() => handleSafeNavigate('orders')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5 text-amber-500" />
                <span>Ver Certificados & Assinatura Digital</span>
              </button>
            )}

            {currentStepIdx === 5 && (
              <button
                onClick={() => handleSafeNavigate('financial')}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-500" />
                <span>Abrir Gestão Financeira & Comissões Real</span>
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={currentStepIdx === TOUR_STEPS.length - 1}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95 disabled:opacity-40 cursor-pointer"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <span>Confirmar e Avançar Etapa</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column: Interactive UI Simulation based on Step */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs min-h-[440px] flex flex-col justify-between">
          
          {/* STEP 1: SCHEDULING & TRIAD */}
          {currentStepIdx === 0 && (
            <div id="os-triad-card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Fazenda Santa Helena • Talhão 04 (Pivô Central)
                    </h4>
                    <span className="text-xs text-slate-500 font-mono">
                      Cultura: Soja (R1 - Floração) | Área PostGIS: 48,50 ha | Terreno: Plano
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  OS-2025-0892
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2 text-emerald-600 dark:text-emerald-400">
                    <Cpu className="w-4 h-4" />
                    <span className="text-xs font-bold">1. Drone Homologado</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">DJI Agras T40</div>
                  <div className="text-[11px] text-slate-500 font-mono">ANAC: PP-09418471</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-1">✓ Manutenção em dia</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold">2. Piloto Remoto</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Lucas R. Guimarães</div>
                  <div className="text-[11px] text-slate-500 font-mono">DECEA: PIL-99420-BR</div>
                  <div className="text-[10px] text-blue-600 font-semibold mt-1">✓ CMA Válido até 2026</div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400">
                    <User className="w-4 h-4" />
                    <span className="text-xs font-bold">3. Ajudante de Linha</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Marcos Silva</div>
                  <div className="text-[11px] text-slate-500">Treinamento NR-31 / EPIs</div>
                  <div className="text-[10px] text-amber-600 font-semibold mt-1">✓ Gerador & Baterias</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>Status da Ordem de Serviço:</span>
                <span className="font-bold px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px]">
                  AGENDADA & ALOCADA
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: SPRAY MIX CALCULATION (INTERACTIVE) */}
          {currentStepIdx === 1 && (
            <div id="spray-mix-card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  Calculadora de Calda Interativa (Simulador)
                </h4>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Total: {totalSprayLiters} Litros ({numberOfTanks} Tanques)
                </span>
              </div>

              {/* Interactive Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Área a Pulverizar:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatHectares(sprayHectares)}</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="150"
                    step="0.5"
                    value={sprayHectares}
                    onChange={(e) => setSprayHectares(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Taxa de Aplicação:</span>
                    <strong className="text-slate-900 dark:text-white font-mono">{formatDecimal(sprayRateLHa, 1)} L/ha</strong>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={sprayRateLHa}
                    onChange={(e) => setSprayRateLHa(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-blue-500"
                  />
                </div>
              </div>

              {/* Interactive Insumo Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
                      <th className="py-2 px-3">Ordem</th>
                      <th className="py-2 px-3">Insumo / Defensivo</th>
                      <th className="py-2 px-3">Categoria</th>
                      <th className="py-2 px-3">Dose/ha</th>
                      <th className="py-2 px-3 text-right">Total Calculado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    <tr>
                      <td className="py-2 px-3 font-bold text-emerald-600">1º</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white">Condicionador Redutor de pH</td>
                      <td className="py-2 px-3 text-slate-400">Adjuvante pH</td>
                      <td className="py-2 px-3">50 mL/ha</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {formatDecimal((sprayHectares * 50) / 1000, 2)} L
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-emerald-600">2º</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white">Fungicida Sistêmico WG</td>
                      <td className="py-2 px-3 text-slate-400">Grânulo WG</td>
                      <td className="py-2 px-3">200 g/ha</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {formatDecimal((sprayHectares * 200) / 1000, 2)} kg
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-emerald-600">3º</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white">Inseticida Fisiológico SC</td>
                      <td className="py-2 px-3 text-slate-400">Suspensão SC</td>
                      <td className="py-2 px-3">150 mL/ha</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {formatDecimal((sprayHectares * 150) / 1000, 2)} L
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-emerald-600">4º</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white">Óleo Antideriva Mineral</td>
                      <td className="py-2 px-3 text-slate-400">Adjuvante Óleo</td>
                      <td className="py-2 px-3">250 mL/ha</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-600">
                        {formatDecimal((sprayHectares * 250) / 1000, 2)} L
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: WEATHER CHECK & DELTA T (INTERACTIVE) */}
          {currentStepIdx === 2 && (
            <div id="weather-hud-card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  Portão Meteorológico & Delta T Psicrométrico
                </h4>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    isWeatherBlocked
                      ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                  }`}
                >
                  {isWeatherBlocked ? '⛔ VOO IMPEDIDO' : '✓ APROVADO PARA PULVERIZAÇÃO'}
                </span>
              </div>

              {/* Weather Controls Simulator */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-500">Vento</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{String(simulatedWind).replace('.', ',')} km/h</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="25"
                    step="0.5"
                    value={simulatedWind}
                    onChange={(e) => setSimulatedWind(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Limite: 15 km/h</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-500">Temp</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{String(simulatedTemp).replace('.', ',')} °C</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="40"
                    step="0.5"
                    value={simulatedTemp}
                    onChange={(e) => setSimulatedTemp(parseFloat(e.target.value))}
                    className="w-full cursor-pointer accent-amber-500"
                  />
                  <span className="text-[10px] text-slate-400">Ideal: &lt; 30 °C</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-500">Umidade</span>
                    <span className="font-bold font-mono text-slate-900 dark:text-white">{simulatedHumidity} %</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="90"
                    step="1"
                    value={simulatedHumidity}
                    onChange={(e) => setSimulatedHumidity(parseInt(e.target.value))}
                    className="w-full cursor-pointer accent-cyan-500"
                  />
                  <span className="text-[10px] text-slate-400">Mínimo: 50%</span>
                </div>
              </div>

              {/* Delta T Psychrometric Gauge */}
              <div
                className={`p-4 rounded-xl border ${
                  deltaT >= 2.0 && deltaT <= 8.0
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-black uppercase tracking-wider">
                    Delta T Aferido: {String(deltaT).replace('.', ',')} °C
                  </span>
                  <span className="font-bold">
                    {deltaT < 2.0 && '⚠️ Gota não assenta (Risco de orvalho)'}
                    {deltaT >= 2.0 && deltaT <= 8.0 && '✓ Janela Perfeita (Evaporação controlada)'}
                    {deltaT > 8.0 && '⛔ Alta evaporação / Risco de Deriva severa'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden mt-2 relative">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (deltaT / 12) * 100)}%`,
                      backgroundColor: deltaT >= 2.0 && deltaT <= 8.0 ? '#10b981' : '#ef4444'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: TELEMETRY & PRODUCTIVITY (INTERACTIVE) */}
          {currentStepIdx === 3 && (
            <div id="telemetry-card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-500" />
                  Reprodutor de Telemetria de Voo (Log DJI T40)
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsPlayingFlight(!isPlayingFlight)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 flex items-center gap-1 cursor-pointer"
                  >
                    {isPlayingFlight ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlayingFlight ? 'Pausar Voo' : 'Simular Voo'}</span>
                  </button>
                  <button
                    onClick={() => setFlightProgress(0)}
                    className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                    title="Reiniciar trajeto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Flight Visual Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-slate-500">
                  <span>Passadas RTK: {flightProgress}% concluído</span>
                  <span>Velocidade: 22,4 km/h • Altura: 3,2m</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${flightProgress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Área Planejada</span>
                  <span className="text-base font-black text-slate-900 dark:text-white font-mono">
                    48,50 ha
                  </span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block uppercase">
                    Área Aplicada
                  </span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {((48.5 * flightProgress) / 100).toFixed(2).replace('.', ',')} ha
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Uniformidade RTK</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    98,4%
                  </span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block uppercase">Rendimento</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400 font-mono">
                    17,6 ha/h
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: TECHNICAL CLOSURE */}
          {currentStepIdx === 4 && (
            <div id="closure-signature-card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  Fechamento Técnico da OS & Assinatura Digital do Piloto
                </h4>
                <span className="text-xs font-bold text-emerald-600">Conformidade MAPA/CREA</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white">
                    Apontamentos de Campo do Piloto:
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">
                    "Operação realizada com sucesso. Vento médio de 7,5 km/h com Delta T constante em 4,5°C. Cobertura uniforme na altura de 3,2m sobre o dossel."
                  </p>
                  <div className="pt-2 text-[11px] text-slate-400 font-mono">
                    Certificado SHA-256: 7f8a91c0e29b48f...
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs space-y-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-300">
                    Assinatura do Piloto Responsável:
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-dashed border-emerald-400 text-center font-serif italic text-emerald-800 dark:text-emerald-400 text-sm">
                    Lucas R. Guimarães - DECEA PIL-99420-BR
                  </div>
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                    Assinado digitalmente em campo via token offline certificado
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: AUTOMATIC BILLING & COMMISSIONS (INTERACTIVE) */}
          {currentStepIdx === 5 && (
            <div id="financial-billing-card" className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Simulador de Faturamento & Comissões (Rateio Automático)
                </h4>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Margem: {finMarginPct}%
                </span>
              </div>

              {/* Interactive Hectares Slider */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 font-medium">Área da OS:</span>
                  <strong className="text-slate-900 dark:text-white font-mono">{formatHectares(finHectares, 0)} @ {formatBRL(finRatePerHa)}/ha</strong>
                </div>
                <input
                  type="range"
                  min="10"
                  max="300"
                  step="1"
                  value={finHectares}
                  onChange={(e) => setFinHectares(parseFloat(e.target.value))}
                  className="w-full cursor-pointer accent-emerald-500"
                />
              </div>

              {/* Financial Calculation Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">
                    Faturamento Bruto (Cliente)
                  </span>
                  <div className="text-lg font-black text-slate-900 dark:text-white mt-1">
                    {formatBRL(finGrossTotal)}
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {formatHectares(finHectares, 0)} × {formatBRL(finRatePerHa)}/ha
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800">
                  <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 block">
                    Comissão Piloto (DECEA)
                  </span>
                  <div className="text-lg font-black text-blue-700 dark:text-blue-300 mt-1">
                    {formatBRL(finPilotCommission)}
                  </div>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 block mt-1">
                    {formatHectares(finHectares, 0)} × {formatBRL(finPilotRatePerHa)}/ha
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 block">
                    Comissão Ajudante
                  </span>
                  <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-1">
                    {formatBRL(finAssistCommission)}
                  </div>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-1">
                    {formatHectares(finHectares, 0)} × {formatBRL(finAssistRatePerHa)}/ha
                  </span>
                </div>
              </div>

              {/* Net Margin */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                    Margem Operacional Líquida: {formatBRL(finNetRevenue)} ({formatPercent(finMarginPct, 1)})
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 text-[11px]">
                    Lançamentos gerados no Contas a Receber e Contas a Pagar automaticamente.
                  </span>
                </div>
                <button
                  onClick={() => handleSafeNavigate('financial')}
                  className="px-3 py-1.5 rounded-lg text-white font-bold text-xs shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Ver Fluxo de Caixa
                </button>
              </div>
            </div>
          )}

          {/* Bottom Step Indicator Navigation */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Passo {currentStepIdx + 1} de {TOUR_STEPS.length}: {currentStep.title}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={currentStepIdx === 0}
                onClick={handlePrev}
                className="hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <span>•</span>
              <button
                disabled={currentStepIdx === TOUR_STEPS.length - 1}
                onClick={handleNext}
                className="font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 disabled:opacity-30 cursor-pointer flex items-center gap-1"
              >
                <span>Próximo</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
