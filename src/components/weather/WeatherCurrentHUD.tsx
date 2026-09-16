import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Compass, 
  CloudRain, 
  Gauge, 
  Lock, 
  Unlock, 
  Sparkles, 
  AlertTriangle, 
  ShieldCheck, 
  Info,
  Sun,
  CloudSun,
  Cloud,
  CloudFog,
  Zap,
  RotateCw,
  Clock,
  Calendar,
  Radio
} from 'lucide-react';
import { CurrentWeather, SprayStatus } from '../../services/weatherService';

interface WeatherCurrentHUDProps {
  current: CurrentWeather;
  cityName: string;
  isManualSimulation: boolean;
  onToggleManualSimulation: () => void;
  onRefreshWeather?: () => void;
  isRefreshing?: boolean;
  lastUpdated?: string;
}

export const WeatherCurrentHUD: React.FC<WeatherCurrentHUDProps> = ({
  current,
  cityName,
  isManualSimulation,
  onToggleManualSimulation,
  onRefreshWeather,
  isRefreshing = false,
  lastUpdated
}) => {
  const { assessment } = current;
  const isAllowed = assessment.isAllowed;

  // Visual status for Flight Gate
  const getGateBadge = () => {
    switch (assessment.status) {
      case 'IDEAL':
        return {
          bg: 'bg-emerald-500/10 dark:bg-emerald-950/20 border-emerald-500/30 text-emerald-950 dark:text-emerald-100',
          iconBg: 'bg-emerald-600',
          title: 'PORTÃO ABERTO: VOO LIBERADO',
          sub: 'Condições meteorológicas ideais para pulverização aeroagrícola e drones'
        };
      case 'FAVORABLE_CAUTION':
        return {
          bg: 'bg-amber-500/10 dark:bg-amber-950/20 border-amber-500/30 text-amber-950 dark:text-amber-100',
          iconBg: 'bg-amber-600',
          title: 'PORTÃO ABERTO COM RESTRIÇÕES TÉCNICAS',
          sub: 'Exige bicos de indução de ar, gotas grossas e adjuvante anti-evaporante'
        };
      case 'THERMAL_INVERSION':
        return {
          bg: 'bg-sky-500/10 dark:bg-sky-950/20 border-sky-500/30 text-sky-950 dark:text-sky-100',
          iconBg: 'bg-sky-600',
          title: 'ATENÇÃO CRÍTICA: RISCO DE INVERSÃO TÉRMICA',
          sub: 'Vento calmo (< 3 km/h) ou Delta T baixo retém névoa suspensa e escorrimento'
        };
      case 'BLOCKED_WIND':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30 text-rose-950 dark:text-rose-100',
          iconBg: 'bg-rose-600',
          title: 'PORTÃO FECHADO: VENTO EXCESSIVO (> 15 km/h)',
          sub: 'Risco severo de deriva química fora do alvo foliar. Voo estritamente proibido'
        };
      case 'BLOCKED_EVAPORATION':
        return {
          bg: 'bg-rose-500/10 dark:bg-rose-950/20 border-rose-500/30 text-rose-950 dark:text-rose-100',
          iconBg: 'bg-rose-600',
          title: 'PORTÃO FECHADO: EVAPORAÇÃO CRÍTICA (Delta T > 10°C)',
          sub: 'Gotas de calda evaporam no ar antes de atingirem as folhas da lavoura'
        };
      case 'BLOCKED_RAIN':
        return {
          bg: 'bg-indigo-500/10 dark:bg-indigo-950/20 border-indigo-500/30 text-indigo-950 dark:text-indigo-100',
          iconBg: 'bg-indigo-600',
          title: 'PORTÃO FECHADO: PRECIPITAÇÃO / CHUVA',
          sub: 'Chuva provoca lavagem imediata do produto ativo da folha. Decolagem suspensa'
        };
    }
  };

  const gate = getGateBadge();

  return (
    <div className="space-y-4 relative">
      {/* Flight Interlock Banner (Portão de Decolagem) */}
      <div className={`relative p-4 sm:p-4.5 rounded-2xl border shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 transition-all ${gate.bg}`}>
        <div className="flex items-center gap-3.5 text-left">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white shadow-2xs shrink-0 ${gate.iconBg}`}>
            {isAllowed ? <Unlock className="w-5.5 h-5.5" /> : <Lock className="w-5.5 h-5.5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border shadow-3xs ${assessment.badgeColor}`}>
                {assessment.badgeLabel}
              </span>
              {!isAllowed && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-600 dark:bg-rose-950 text-white dark:text-rose-300 border border-rose-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-200 animate-pulse shrink-0" />
                  CONDIÇÕES IMPRÓPRIAS
                </span>
              )}
              <span className="text-xs text-slate-500 dark:text-emerald-200/80 font-mono">
                {cityName} • Score Operacional: <strong className="text-slate-900 dark:text-white font-extrabold">{assessment.score}%</strong>
              </span>

              {/* High-visibility collection timestamp pill */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-800/90 text-white dark:bg-emerald-950 dark:text-emerald-200 text-[10px] font-bold border border-emerald-600/40 shadow-2xs">
                <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>Coleta: {(() => {
                  const d = lastUpdated ? new Date(lastUpdated) : new Date();
                  const valid = isNaN(d.getTime()) ? new Date() : d;
                  const dateStr = valid.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = valid.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                  return `${dateStr} às ${timeStr}`;
                })()}</span>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
              {gate.title}
            </h2>
            <p className="text-xs text-slate-600 dark:text-emerald-100/80 mt-1 max-w-2xl leading-relaxed">
              {assessment.description}
            </p>
          </div>
        </div>

        {/* Compact Delta T Display */}
        <div className="flex flex-col justify-center items-end text-right pl-4 border-t md:border-t-0 md:border-l border-slate-200/80 dark:border-emerald-800/40 shrink-0">
          <span className="text-[10px] font-bold text-slate-500 dark:text-emerald-300/80 uppercase tracking-wider">
            Delta T Psicrométrico
          </span>
          <div className="flex items-baseline gap-1.5 my-0.5">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
              {current.deltaT.toFixed(1).replace('.', ',')}
            </span>
            <span className="text-xs font-bold text-slate-500 dark:text-emerald-400">°C</span>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${
            current.deltaT < 2 
              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20' 
              : current.deltaT <= 8 
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' 
              : current.deltaT <= 10 
              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20' 
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
          }`}>
            {current.deltaT < 2 ? 'Inversão' : current.deltaT <= 8 ? 'Ideal (2 a 8°C)' : current.deltaT <= 10 ? 'Atenção' : 'Crítico'}
          </span>
        </div>
      </div>

      {/* Main Meteorological Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Temperatura & Ponto de Orvalho */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900/80 dark:text-emerald-300/80 flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Temperatura do Ar
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              Bulbo Seco
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950 dark:text-white font-mono">
              {current.temperature.toFixed(1).replace('.', ',')}°C
            </span>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Sensação: {current.apparentTemperature.toFixed(1).replace('.', ',')}°C
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/60 flex justify-between text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            <span>Ponto Orvalho: <strong className="text-emerald-950 dark:text-emerald-100">{current.dewPoint.toFixed(1).replace('.', ',')}°C</strong></span>
            <span>T. Bulbo Úmido: <strong className="text-emerald-950 dark:text-emerald-100">{current.wetBulbTemp.toFixed(1).replace('.', ',')}°C</strong></span>
          </div>
        </div>

        {/* Card 2: Umidade Relativa do Ar */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900/80 dark:text-emerald-300/80 flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Umidade Relativa (UR)
            </span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              current.relativeHumidity >= 55 
                ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200' 
                : current.relativeHumidity >= 45 
                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200' 
                : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
            }`}>
              {current.relativeHumidity >= 55 ? 'Adequada' : current.relativeHumidity >= 45 ? 'Baixa' : 'Crítica'}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950 dark:text-white font-mono">
              {current.relativeHumidity.toFixed(0)}%
            </span>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Ideal: &gt; 55%
            </span>
          </div>
          <div className="w-full bg-emerald-100 dark:bg-emerald-950 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${
                current.relativeHumidity >= 55 ? 'bg-emerald-500' : current.relativeHumidity >= 45 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${Math.min(100, current.relativeHumidity)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-emerald-700/70 dark:text-emerald-400/70">
            <span>Risco Evaporação:</span>
            <strong className="text-emerald-950 dark:text-emerald-100">{assessment.evaporationRiskLevel}</strong>
          </div>
        </div>

        {/* Card 3: Vento & Bússola Dinâmica */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900/80 dark:text-emerald-300/80 flex items-center gap-1.5">
              <Wind className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Velocidade do Vento
            </span>
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
              {current.windDirectionCompass} ({current.windDirectionDegrees}°)
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${
              current.windSpeed > 15 ? 'text-rose-600' : 'text-emerald-950 dark:text-white'
            }`}>
              {current.windSpeed.toFixed(1).replace('.', ',')} <span className="text-sm font-sans font-bold text-emerald-700 dark:text-emerald-400">km/h</span>
            </span>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
              Rajadas: <strong className="text-emerald-950 dark:text-emerald-100">{current.windGusts.toFixed(1).replace('.', ',')} km/h</strong>
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/60 flex items-center justify-between text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            <span className="flex items-center gap-1">
              <Compass 
                className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-transform duration-500" 
                style={{ transform: `rotate(${current.windDirectionDegrees}deg)` }}
              />
              Direção: <strong className="text-emerald-950 dark:text-emerald-100">{current.windDirectionCompass}</strong>
            </span>
            <span>Risco Deriva: <strong className={current.windSpeed > 15 ? 'text-rose-600 font-black' : 'text-emerald-700 dark:text-emerald-300'}>{assessment.driftRiskLevel}</strong></span>
          </div>
        </div>

        {/* Card 4: Chuva & Precipitação */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900/80 dark:text-emerald-300/80 flex items-center gap-1.5">
              <CloudRain className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Previsão de Chuva
            </span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
              current.precipitation > 0 || current.precipitationProbability >= 40
                ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200'
            }`}>
              {current.precipitation > 0 ? 'Chovendo' : `${current.precipitationProbability}% prob.`}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-950 dark:text-white font-mono">
              {current.precipitation.toFixed(1).replace('.', ',')} <span className="text-sm font-sans font-bold text-emerald-700 dark:text-emerald-400">mm</span>
            </span>
            <span className="text-xs text-emerald-700/80 dark:text-emerald-400/80 truncate">
              {current.weatherDescription}
            </span>
          </div>
          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/60 flex justify-between text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
            <span>Pressão: <strong className="text-emerald-950 dark:text-emerald-100">{current.surfacePressure} hPa</strong></span>
            <span>Índice UV: <strong className="text-emerald-950 dark:text-emerald-100">{current.uvIndex}</strong></span>
          </div>
        </div>
      </div>

      {/* Secondary Quick Specs & Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 text-xs shadow-2xs">
        <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300 flex-wrap">
          <span className="flex items-center gap-1.5 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            Ponta Recomendada: <strong className="text-emerald-950 dark:text-white">{assessment.recommendedNozzle}</strong>
          </span>
          <span className="hidden md:inline text-emerald-300 dark:text-emerald-700">•</span>
          <span className="font-semibold">
            Tamanho de Gota: <strong className="text-emerald-950 dark:text-white">{assessment.recommendedDropletSize}</strong>
          </span>
          <span className="hidden md:inline text-emerald-300 dark:text-emerald-700">•</span>
          <span className="font-semibold">
            Adjuvante: <strong className="text-emerald-950 dark:text-white">{assessment.recommendedAdjuvant}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRefreshWeather && (
            <button
              onClick={onRefreshWeather}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 cursor-pointer transition-colors shadow-2xs"
              title="Atualizar Previsão Agora"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-600' : ''}`} />
            </button>
          )}

          <button
            onClick={onToggleManualSimulation}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-all cursor-pointer shadow-2xs ${
              isManualSimulation 
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold'
                : 'bg-emerald-100/70 hover:bg-emerald-200/70 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            }`}
          >
            {isManualSimulation ? '⚙ Modo Aferição Manual (Kestrel Ativo)' : '📡 Previsão Satélite / Estação'}
          </button>
        </div>
      </div>
    </div>
  );
};
