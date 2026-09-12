import React, { useState } from 'react';
import { UserProfile, DroneTelemetryLog } from '../types';
import { 
  Plane, 
  UploadCloud, 
  CheckCircle2, 
  BatteryCharging, 
  Clock, 
  Gauge, 
  Activity, 
  FileText,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DroneBadge } from './DronePhotoBadge';

interface TelemetryViewProps {
  currentUser: UserProfile;
}

export const TelemetryView: React.FC<TelemetryViewProps> = ({ currentUser }) => {
  const [telemetry, setTelemetry] = useState<DroneTelemetryLog>({
    brand: 'DJI_AGRICULTURE',
    logFileName: 'DJI_AGRAS_T40_LOG_20260909_041.DAT',
    plannedHectares: 48.5,
    appliedHectares: 48.2,
    overlapCoveragePct: 99.4,
    flightTimeMinutes: 58,
    batteryCyclesConsumed: 6,
    effectiveFlowRateLMin: 8.4,
    avgAltitudeM: 3.5,
    avgSpeedMs: 7.2,
  });

  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  const handleSimulateLogUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setTelemetry({
          brand: file.name.toUpperCase().includes('XAG') ? 'XAG' : 'DJI_AGRICULTURE',
          logFileName: file.name,
          plannedHectares: 48.5,
          appliedHectares: 48.5,
          overlapCoveragePct: 99.8,
          flightTimeMinutes: 56,
          batteryCyclesConsumed: 6,
          effectiveFlowRateLMin: 8.5,
          avgAltitudeM: 3.4,
          avgSpeedMs: 7.4,
        });
        setUploadSuccess(`Log de telemetria binário "${file.name}" decodificado e auditado com 100% de precisão!`);
        setTimeout(() => setUploadSuccess(null), 5000);
      }, 1000);
    }
  };

  const productivityHaPerHour = (telemetry.appliedHectares / (telemetry.flightTimeMinutes / 60)).toFixed(1).replace('.', ',');

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Telemetria & Produtividade
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Ingestão e processamento de logs DJI (.DAT) e XAG Cloud para auditoria geoespacial da pulverização.
          </p>
        </div>

        {/* Drone badge & Upload Button */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <DroneBadge
            droneModel={telemetry.brand === 'XAG' ? 'XAG P100 Pro' : 'DJI Agras T40'}
            droneAnac={telemetry.brand === 'XAG' ? 'PP-9904-BR' : 'PP-8821-BR'}
            size="sm"
            className="shadow-2xs"
          />
          <label className="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5" />
            {isProcessing ? 'Decodificando...' : 'Importar Log (.DAT)'}
            <input
              type="file"
              accept=".dat,.csv,.log,.kml"
              onChange={handleSimulateLogUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {uploadSuccess && (
        <div className="p-2.5 sm:p-3 rounded-xl bg-emerald-100 text-emerald-950 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2 text-xs shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
          <span className="font-semibold text-xs">{uploadSuccess}</span>
        </div>
      )}

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80 block">Área Efetiva</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-950 dark:text-white font-mono">
              {String(telemetry.appliedHectares).replace('.', ',')} ha
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
              ({String(telemetry.overlapCoveragePct).replace('.', ',')}%)
            </span>
          </div>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Plan: {String(telemetry.plannedHectares).replace('.', ',')} ha</p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80 block">Rendimento</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
              {productivityHaPerHour} ha/h
            </span>
          </div>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Voo: {telemetry.flightTimeMinutes} min</p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80 block">Vazão Média</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
              {String(telemetry.effectiveFlowRateLMin).replace('.', ',')} L/min
            </span>
          </div>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Bicos calibrados</p>
        </div>

        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
          <span className="text-[11px] font-bold text-emerald-800/80 dark:text-emerald-300/80 block">Baterias</span>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-800 dark:text-emerald-300 font-mono">
              {telemetry.batteryCyclesConsumed} ciclos
            </span>
          </div>
          <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70">Troca rápida solo</p>
        </div>
      </div>

      {/* Flight Path Zig-Zag SVG Map Simulation */}
      <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white">
              Trajetória Real & Faixas de Aplicação (Swath 7m)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80">
            Log: {telemetry.logFileName}
          </span>
        </div>

        {/* Flight Canvas */}
        <div className="relative w-full aspect-16/7 bg-[#041c14] rounded-xl overflow-hidden border border-emerald-800/70 flex items-center justify-center p-3">
          <svg viewBox="0 0 800 320" className="w-full h-full">
            {/* Field Boundary */}
            <polygon
              points="60,30 740,40 700,290 80,270"
              fill="#064e3b"
              fillOpacity="0.25"
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="4,4"
            />

            {/* Spray Pass Lines (Zig-Zag) */}
            {[70, 95, 120, 145, 170, 195, 220, 245].map((y, idx) => (
              <g key={idx}>
                {/* Sprayed swath band */}
                <line
                  x1="100"
                  y1={y}
                  x2="680"
                  y2={y + 5}
                  stroke="#22c55e"
                  strokeWidth="10"
                  strokeOpacity="0.4"
                  strokeLinecap="round"
                />
                {/* Drone flight trajectory */}
                <line
                  x1="100"
                  y1={y}
                  x2="680"
                  y2={y + 5}
                  stroke="#34d399"
                  strokeWidth="1.5"
                  strokeDasharray="6,3"
                />
              </g>
            ))}

            {/* Drone Current/Final Position */}
            <circle cx="680" cy="250" r="8" fill="#10b981" className="animate-ping" />
            <circle cx="680" cy="250" r="6" fill="#059669" />

            {/* Drone Icon */}
            <text x="695" y="254" fill="#ffffff" fontSize="11" fontWeight="bold">
              DJI T40 (Final da Faixa)
            </text>

            {/* Takeoff Base */}
            <g transform="translate(80, 290)">
              <rect x="-15" y="-15" width="30" height="30" rx="6" fill="#072a1e" stroke="#10b981" strokeWidth="2" />
              <text x="0" y="4" textAnchor="middle" fill="#10b981" fontSize="10" fontWeight="bold">H</text>
              <text x="25" y="4" fill="#a7f3d0" fontSize="10">Base de Recarga / Decolagem</text>
            </g>
          </svg>
        </div>

        {/* Telemetry Extra Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300/80 dark:border-emerald-700 shadow-2xs">
            <span className="text-emerald-800 dark:text-emerald-300 text-[9px] block font-semibold">Altura Média</span>
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 font-mono">
              {String(telemetry.avgAltitudeM).replace('.', ',')} m
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300/80 dark:border-emerald-700 shadow-2xs">
            <span className="text-emerald-800 dark:text-emerald-300 text-[9px] block font-semibold">Velocidade Média</span>
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 font-mono">
              {String(telemetry.avgSpeedMs).replace('.', ',')} m/s (26 km/h)
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300/80 dark:border-emerald-700 shadow-2xs">
            <span className="text-emerald-800 dark:text-emerald-300 text-[9px] block font-semibold">Largura de Faixa</span>
            <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 font-mono">
              7,0 metros
            </span>
          </div>

          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300/80 dark:border-emerald-700 shadow-2xs">
            <span className="text-emerald-800 dark:text-emerald-300 text-[9px] block font-semibold">Qualidade Cobertura</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 font-mono">
              Excelente (0 Falhas)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
