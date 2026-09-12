import React from 'react';
import { 
  Calendar, 
  CloudRain, 
  Wind, 
  Thermometer, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Info,
  Sun,
  CloudSun,
  Cloud,
  ChevronRight
} from 'lucide-react';
import { DailyForecastItem, SprayStatus } from '../../services/weatherService';

interface SevenDayForecastGridProps {
  daily: DailyForecastItem[];
  cityName: string;
}

export const SevenDayForecastGrid: React.FC<SevenDayForecastGridProps> = ({ daily, cityName }) => {
  const getStatusBadge = (status: SprayStatus) => {
    switch (status) {
      case 'IDEAL':
        return {
          label: 'Favorável',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300'
        };
      case 'FAVORABLE_CAUTION':
        return {
          label: 'Atenção',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border-amber-300'
        };
      case 'BLOCKED_RAIN':
        return {
          label: 'Chuva / Bloqueado',
          color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200 border-indigo-300'
        };
      case 'BLOCKED_WIND':
        return {
          label: 'Vento Forte',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border-rose-300'
        };
      default:
        return {
          label: 'Operacional',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200 border-emerald-300'
        };
    }
  };

  return (
    <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base sm:text-lg font-black text-emerald-950 dark:text-white">
              Previsão de 7 Dias para Planejamento de Lavouras e Ordens de Serviço
            </h2>
          </div>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
            Visão estendida para programação antecipada de escalas de pilotos, drones e compras de defensivos em {cityName}.
          </p>
        </div>

        <div className="text-xs text-emerald-700/80 dark:text-emerald-300/80 font-semibold bg-white dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto shadow-2xs">
          Previsão ECMWF / GFS Integrada
        </div>
      </div>

      {/* Grid of Daily Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
        {daily.map((day, idx) => {
          const badge = getStatusBadge(day.dominantSprayStatus);
          const isToday = idx === 0;
          const isHighRainRisk = day.precipitationProbabilityMax >= 50 || day.precipitationSum >= 5.0;

          return (
            <div
              key={day.date || idx}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                isToday
                  ? 'bg-white dark:bg-[#041c14] border-emerald-400 dark:border-emerald-500 shadow-md ring-1 ring-emerald-400/50'
                  : 'bg-white/80 dark:bg-[#072a1e] border-emerald-200/80 dark:border-emerald-800/80 hover:bg-white dark:hover:bg-[#083023]'
              }`}
            >
              {/* Day Header */}
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-black text-emerald-950 dark:text-white truncate">
                    {isToday ? 'Hoje' : day.dayOfWeek.split('-')[0]}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700/80 dark:text-emerald-400/80">
                    {new Date(day.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                </div>

                {/* Status Pill */}
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border block text-center truncate ${badge.color}`}>
                  {badge.label}
                </span>
              </div>

              {/* Weather Description & Temperatures */}
              <div className="space-y-1.5 my-1">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-rose-600 dark:text-rose-400">{day.temperatureMax}°C</span>
                  <span className="text-emerald-300 dark:text-emerald-700">/</span>
                  <span className="text-sky-600 dark:text-sky-400">{day.temperatureMin}°C</span>
                </div>

                <div className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-snug line-clamp-2 h-7">
                  {day.weatherDescription}
                </div>
              </div>

              {/* Vento, Chuva & Horas Favoráveis */}
              <div className="space-y-1.5 pt-2 border-t border-emerald-100 dark:border-emerald-800/60 text-[10px]">
                {/* Chuva */}
                <div className={`flex items-center justify-between ${
                  isHighRainRisk ? 'text-indigo-600 font-bold' : 'text-emerald-800/80 dark:text-emerald-300/80'
                }`}>
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3" />
                    Chuva:
                  </span>
                  <span className="font-mono">{day.precipitationSum.toFixed(1).replace('.', ',')}mm ({day.precipitationProbabilityMax}%)</span>
                </div>

                {/* Vento */}
                <div className="flex items-center justify-between text-emerald-800/80 dark:text-emerald-300/80">
                  <span className="flex items-center gap-1">
                    <Wind className="w-3 h-3" />
                    Vento Máx:
                  </span>
                  <span className="font-mono">{day.windSpeedMax.toFixed(0)} km/h</span>
                </div>

                {/* Janela Favorável */}
                <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                  <span className="flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-emerald-600" />
                    Janela:
                  </span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                    {day.favorableSprayHoursCount}h ideais
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Strategic Planning Legend */}
      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-[#072a1e]/70 border border-emerald-200 dark:border-emerald-800 text-xs flex flex-wrap items-center justify-between gap-3 text-emerald-800 dark:text-emerald-300">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            <strong>Diretriz Técnica de Planejamento:</strong> Priorize lavouras com maior infestação nos dias com mais de 5 horas de janela favorável. Evite aplicações de contato em dias com probabilidade de chuva acima de 40%.
          </span>
        </div>
      </div>
    </div>
  );
};
