import React, { useState } from 'react';
import { 
  Clock, 
  Sparkles, 
  Wind, 
  Droplets, 
  Thermometer, 
  CloudRain, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Unlock, 
  Info,
  Calendar,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { HourlyForecastItem, SprayStatus } from '../../services/weatherService';

interface HourlySprayPlannerProps {
  hourly: HourlyForecastItem[];
  cityName: string;
}

export const HourlySprayPlanner: React.FC<HourlySprayPlannerProps> = ({ hourly, cityName }) => {
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(6); // Default 06:00 AM (typical spray dawn)

  // Split into Day 0 (today) and Day 1 (tomorrow)
  const day0Hours = hourly.slice(0, 24);
  const day1Hours = hourly.slice(24, 48);

  const activeHours = selectedDayOffset === 0 ? day0Hours : day1Hours;
  const selectedHour = activeHours[selectedHourIndex] || activeHours[0];

  // Calculate best spray window for active day
  const favorableHours = activeHours.filter(h => h.assessment.isAllowed);
  const idealHours = activeHours.filter(h => h.assessment.status === 'IDEAL');

  const getBestWindowSummary = () => {
    if (idealHours.length === 0 && favorableHours.length === 0) {
      return 'Condições meteorológicas desfavoráveis para voo durante todo o período.';
    }

    const morning = activeHours.filter(h => h.hourNumber >= 5 && h.hourNumber <= 10 && h.assessment.isAllowed);
    const afternoon = activeHours.filter(h => h.hourNumber >= 15 && h.hourNumber <= 19 && h.assessment.isAllowed);

    const parts: string[] = [];
    if (morning.length > 0) {
      parts.push(`Janela Matutina: ${morning[0].hourNumber.toString().padStart(2, '0')}:00 às ${(morning[morning.length - 1].hourNumber + 1).toString().padStart(2, '0')}:00`);
    }
    if (afternoon.length > 0) {
      parts.push(`Janela Vespertina: ${afternoon[0].hourNumber.toString().padStart(2, '0')}:00 às ${(afternoon[afternoon.length - 1].hourNumber + 1).toString().padStart(2, '0')}:00`);
    }

    return parts.length > 0 ? parts.join(' & ') : `${favorableHours.length} horas operacionais favoráveis detectadas.`;
  };

  const getStatusColor = (status: SprayStatus) => {
    switch (status) {
      case 'IDEAL':
        return 'bg-emerald-500 text-white';
      case 'FAVORABLE_CAUTION':
        return 'bg-amber-500 text-slate-950 font-black';
      case 'THERMAL_INVERSION':
        return 'bg-sky-500 text-white';
      case 'BLOCKED_WIND':
        return 'bg-rose-600 text-white';
      case 'BLOCKED_EVAPORATION':
        return 'bg-rose-700 text-white';
      case 'BLOCKED_RAIN':
        return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* Header & Day Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base sm:text-lg font-black text-emerald-950 dark:text-white">
              Programador Horário de Pulverização (Janela a Janela)
            </h2>
          </div>
          <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
            Previsão meteorológica dinâmica de 24h para planejamento de voos de drones e aeronaves agrícolas em {cityName}.
          </p>
        </div>

        {/* Day Switcher */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 self-start sm:self-auto shadow-2xs">
          <button
            onClick={() => {
              setSelectedDayOffset(0);
              setSelectedHourIndex(6);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDayOffset === 0
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60'
            }`}
          >
            Hoje ({day0Hours[0]?.dayLabel || 'Hoje'})
          </button>
          <button
            onClick={() => {
              setSelectedDayOffset(1);
              setSelectedHourIndex(6);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedDayOffset === 1
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60'
            }`}
          >
            Amanhã ({day1Hours[0]?.dayLabel || 'Amanhã'})
          </button>
        </div>
      </div>

      {/* Best Window Highlights Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/90 to-teal-900/90 text-white border border-emerald-700/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-emerald-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-950" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
              Recomendação Agronômica de Janela de Voo:
            </span>
            <div className="text-sm sm:text-base font-black text-white">
              {getBestWindowSummary()}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs shrink-0 self-end md:self-auto">
          <div className="text-right">
            <span className="text-[10px] text-emerald-200/80 block uppercase">Horas Ideais</span>
            <strong className="text-sm font-black text-emerald-300">{favorableHours.length} de 24h</strong>
          </div>
          <div className="h-8 w-px bg-emerald-700" />
          <div className="text-right">
            <span className="text-[10px] text-emerald-200/80 block uppercase">Chuva Máx.</span>
            <strong className="text-sm font-black text-emerald-300">
              {Math.max(...activeHours.map(h => h.precipitationProbability))}%
            </strong>
          </div>
        </div>
      </div>

      {/* Horizontal Hourly Timeline (Scrollable) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-emerald-950 dark:text-emerald-100 px-1">
          <span>Linha do Tempo Horária (Clique na hora para inspecionar):</span>
          <span className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 font-normal">
            Arraste para os lados ◄ ►
          </span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-thin">
          {activeHours.map((item, idx) => {
            const isSelected = idx === selectedHourIndex;
            const hourFormatted = `${item.hourNumber.toString().padStart(2, '0')}:00`;
            const statusColor = getStatusColor(item.assessment.status);

            return (
              <button
                key={item.time || idx}
                onClick={() => setSelectedHourIndex(idx)}
                className={`flex-shrink-0 w-24 p-3 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-between gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/70 scale-105 z-10'
                    : 'bg-white dark:bg-[#072a1e] border-emerald-200/90 dark:border-emerald-800/90 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 text-emerald-950 dark:text-emerald-100'
                }`}
              >
                {/* Hour */}
                <span className="font-mono text-xs font-black tracking-tight">
                  {hourFormatted}
                </span>

                {/* Status Pill */}
                <div className={`w-full py-0.5 px-1 rounded-md text-[9px] font-black uppercase truncate shadow-2xs ${statusColor}`}>
                  {item.assessment.status === 'IDEAL' ? 'Ideal' :
                   item.assessment.status === 'FAVORABLE_CAUTION' ? 'Atenção' :
                   item.assessment.status === 'THERMAL_INVERSION' ? 'Inversão' :
                   item.assessment.status === 'BLOCKED_RAIN' ? 'Chuva' :
                   item.assessment.status === 'BLOCKED_WIND' ? 'Vento' : 'Evaporação'}
                </div>

                {/* Temperature */}
                <div className="text-sm font-black font-mono mt-0.5">
                  {item.temperature.toFixed(0)}°C
                </div>

                {/* Delta T */}
                <div className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-emerald-800/80 text-emerald-100' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300'
                }`}>
                  ΔT {item.deltaT.toFixed(1).replace('.', ',')}°
                </div>

                {/* Wind */}
                <div className="text-[10px] flex items-center gap-1 opacity-90">
                  <Wind className="w-3 h-3" />
                  <span>{item.windSpeed.toFixed(0)} km/h</span>
                </div>

                {/* Rain */}
                <div className="text-[9px] flex items-center gap-0.5 opacity-80">
                  <CloudRain className="w-2.5 h-2.5" />
                  <span>{item.precipitationProbability}%</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Hour Deep Inspection Card */}
      {selectedHour && (
        <div className="p-5 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 dark:border-emerald-800/80 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-black text-xl font-mono shrink-0">
                {selectedHour.hourNumber.toString().padStart(2, '0')}h
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-emerald-950 dark:text-white text-base">
                    Condições Programadas para as {selectedHour.hourNumber.toString().padStart(2, '0')}:00 ({selectedHour.dayLabel})
                  </h3>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border ${selectedHour.assessment.badgeColor}`}>
                    {selectedHour.assessment.badgeLabel}
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  {selectedHour.weatherDescription} • Score de Voo: <strong className="font-black">{selectedHour.assessment.score}%</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <span className={`px-3 py-1 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-2xs ${
                selectedHour.assessment.isAllowed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {selectedHour.assessment.isAllowed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {selectedHour.assessment.isAllowed ? 'Voo Autorizado' : 'Voo Bloqueado'}
              </span>
            </div>
          </div>

          {/* 4 Metrics for Selected Hour */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#052117]/60 border border-emerald-200/70 dark:border-emerald-800/70">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[10px] font-bold block">Temperatura / Bulbo Úmido</span>
              <div className="text-lg font-mono font-black text-emerald-950 dark:text-white my-0.5">
                {selectedHour.temperature.toFixed(1).replace('.', ',')}°C
              </div>
              <span className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70">
                Bulbo Úmido: {selectedHour.wetBulbTemp.toFixed(1).replace('.', ',')}°C
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#052117]/60 border border-emerald-200/70 dark:border-emerald-800/70">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[10px] font-bold block">Delta T Psicrométrico</span>
              <div className="text-lg font-mono font-black text-emerald-950 dark:text-white my-0.5">
                {selectedHour.deltaT.toFixed(1).replace('.', ',')}°C
              </div>
              <span className={`text-[10px] font-bold ${
                selectedHour.deltaT >= 2 && selectedHour.deltaT <= 8 ? 'text-emerald-600' : 'text-amber-600'
              }`}>
                {selectedHour.deltaT >= 2 && selectedHour.deltaT <= 8 ? '✓ Faixa Ouro' : '! Fora do Ideal'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#052117]/60 border border-emerald-200/70 dark:border-emerald-800/70">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[10px] font-bold block">Vento & Rajadas</span>
              <div className="text-lg font-mono font-black text-emerald-950 dark:text-white my-0.5">
                {selectedHour.windSpeed.toFixed(1).replace('.', ',')} km/h
              </div>
              <span className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70">
                Rajadas: {selectedHour.windGusts.toFixed(1).replace('.', ',')} km/h • {selectedHour.windDirectionCompass}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#052117]/60 border border-emerald-200/70 dark:border-emerald-800/70">
              <span className="text-emerald-700/80 dark:text-emerald-400/80 text-[10px] font-bold block">Umidade & Chuva</span>
              <div className="text-lg font-mono font-black text-emerald-950 dark:text-white my-0.5">
                {selectedHour.relativeHumidity}% UR
              </div>
              <span className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70">
                Chuva: {selectedHour.precipitation.toFixed(1).replace('.', ',')}mm ({selectedHour.precipitationProbability}%)
              </span>
            </div>
          </div>

          {/* Agronomic Technical Advisory Box */}
          <div className="p-3.5 rounded-xl bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="font-bold text-emerald-950 dark:text-white flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                Prescrição de Bico e Calda para as {selectedHour.hourNumber.toString().padStart(2, '0')}:00:
              </span>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-200">
                • Tamanho de gota recomendado: <strong>{selectedHour.assessment.recommendedDropletSize}</strong><br />
                • Ponta indicada: <strong>{selectedHour.assessment.recommendedNozzle}</strong><br />
                • Adjuvante de calda: <strong>{selectedHour.assessment.recommendedAdjuvant}</strong>
              </p>
            </div>

            <div className="text-right text-[11px] text-emerald-800/80 dark:text-emerald-300/80 shrink-0">
              <span>Risco Deriva: <strong className="text-emerald-950 dark:text-white">{selectedHour.assessment.driftRiskLevel}</strong></span><br />
              <span>Risco Evaporação: <strong className="text-emerald-950 dark:text-white">{selectedHour.assessment.evaporationRiskLevel}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
