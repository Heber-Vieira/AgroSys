import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { UserProfile, FarmPlot } from '../types';
import { 
  Wind, 
  Thermometer, 
  Droplets, 
  Compass, 
  ShieldCheck, 
  AlertOctagon, 
  AlertTriangle, 
  CheckCircle2,
  Lock,
  Unlock,
  RotateCcw,
  Sparkles,
  Info,
  Layers,
  Check,
  X,
  Gauge,
  Zap,
  Clock,
  Calendar,
  FileText,
  Loader2,
  Sliders,
  CloudSun,
  Flame,
  CloudRain,
  Radio,
  Database,
  Globe,
  ExternalLink
} from 'lucide-react';
import { 
  CityLocation, 
  POPULAR_AGRO_CITIES, 
  WeatherForecastData, 
  fetchWeatherForecast, 
  calculateWetBulbTemp, 
  calculateDeltaT, 
  assessSprayingSuitability,
  generateSimulatedWeather
} from '../services/weatherService';
import { WeatherCitySelector } from './weather/WeatherCitySelector';
import { WeatherCurrentHUD } from './weather/WeatherCurrentHUD';
import { HourlySprayPlanner } from './weather/HourlySprayPlanner';
import { SevenDayForecastGrid } from './weather/SevenDayForecastGrid';
import { WeatherReportModal } from './weather/WeatherReportModal';

interface WeatherGateViewProps {
  currentUser: UserProfile;
  plots?: FarmPlot[];
}

type WeatherViewTab = 'overview' | 'hourly' | 'weekly' | 'prescription';

export const WeatherGateView: React.FC<WeatherGateViewProps> = ({ currentUser, plots = [] }) => {
  // Tab Navigation
  const [activeTab, setActiveTab] = useState<WeatherViewTab>('overview');

  // Selected City (Default: Rio Verde - GO)
  const [selectedCity, setSelectedCity] = useState<CityLocation>(POPULAR_AGRO_CITIES[0]);
  const [weatherData, setWeatherData] = useState<WeatherForecastData>(() => generateSimulatedWeather(POPULAR_AGRO_CITIES[0]));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Manual Calibration / Pocket Anemometer Mode (Kestrel)
  const [isManualMode, setIsManualMode] = useState<boolean>(false);
  const [manualTemp, setManualTemp] = useState<number>(26.0);
  const [manualHumidity, setManualHumidity] = useState<number>(62.0);
  const [manualWind, setManualWind] = useState<number>(9.2);
  const [manualWindDir, setManualWindDir] = useState<string>('SE (Sudeste)');

  // Weather Report Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [isSourceInfoModalOpen, setIsSourceInfoModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'info' | 'success' | 'error'>('success');

  // Fetch forecast whenever selectedCity changes
  const loadForecast = useCallback(async (city: CityLocation) => {
    setIsLoading(true);
    try {
      const data = await fetchWeatherForecast(city);
      setWeatherData(data);
      // Sync manual values to current city reading
      setManualTemp(data.current.temperature);
      setManualHumidity(data.current.relativeHumidity);
      setManualWind(data.current.windSpeed);
      setManualWindDir(`${data.current.windDirectionCompass} (${data.current.windDirectionDegrees}°)`);
    } catch (err) {
      console.warn('Error fetching weather:', err);
      const fallback = generateSimulatedWeather(city);
      setWeatherData(fallback);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadForecast(selectedCity);
  }, [selectedCity, loadForecast]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setToastType('info');
    setToastMessage(`Sincronizando dados de satélite e radar para ${selectedCity.name}...`);
    
    try {
      // Simulate real transmission latency (minimum 700ms) for professional visual feedback
      const [data] = await Promise.all([
        fetchWeatherForecast(selectedCity),
        new Promise(resolve => setTimeout(resolve, 800))
      ]);
      
      setWeatherData(data);
      
      // Sync manual values to current city reading
      setManualTemp(data.current.temperature);
      setManualHumidity(data.current.relativeHumidity);
      setManualWind(data.current.windSpeed);
      setManualWindDir(`${data.current.windDirectionCompass} (${data.current.windDirectionDegrees}°)`);
      
      setToastType('success');
      setToastMessage(`Previsão de satélite atualizada com sucesso para ${selectedCity.name}!`);
    } catch (err) {
      console.warn('Error during manual refresh:', err);
      setToastType('error');
      setToastMessage(`Falha ao obter dados atualizados. Usando modelo local de previsão.`);
    } finally {
      setIsRefreshing(false);
      setTimeout(() => {
        setToastMessage(null);
      }, 3500);
    }
  };

  // Active metrics: either from manual sliders or from live city weatherData
  const activeTemp = isManualMode ? manualTemp : weatherData.current.temperature;
  const activeHumidity = isManualMode ? manualHumidity : weatherData.current.relativeHumidity;
  const activeWind = isManualMode ? manualWind : weatherData.current.windSpeed;
  const activeWindGust = isManualMode ? Math.round(manualWind * 1.35 * 10) / 10 : weatherData.current.windGusts;
  const activePrecip = isManualMode ? 0 : weatherData.current.precipitation;
  const activePrecipProb = isManualMode ? 0 : weatherData.current.precipitationProbability;

  // Real-time Psychrometric calculations
  const wetBulbTemp = useMemo(() => {
    return calculateWetBulbTemp(activeTemp, activeHumidity);
  }, [activeTemp, activeHumidity]);

  const deltaT = useMemo(() => {
    return calculateDeltaT(activeTemp, activeHumidity);
  }, [activeTemp, activeHumidity]);

  const activeAssessment = useMemo(() => {
    return assessSprayingSuitability(
      activeTemp,
      activeHumidity,
      activeWind,
      activeWindGust,
      activePrecip,
      activePrecipProb
    );
  }, [activeTemp, activeHumidity, activeWind, activeWindGust, activePrecip, activePrecipProb]);

  // Current weather representation for HUD
  const activeCurrentWeather = useMemo(() => {
    if (!isManualMode) {
      return weatherData.current;
    }
    return {
      ...weatherData.current,
      temperature: activeTemp,
      relativeHumidity: activeHumidity,
      windSpeed: activeWind,
      windGusts: activeWindGust,
      wetBulbTemp,
      deltaT,
      assessment: activeAssessment
    };
  }, [isManualMode, weatherData.current, activeTemp, activeHumidity, activeWind, activeWindGust, wetBulbTemp, deltaT, activeAssessment]);

  // Delta T Status Badge helper
  const getDeltaTStatus = () => {
    if (deltaT < 2.0) {
      return {
        label: 'Abaixo do Ideal (< 2°C)',
        sublabel: 'Risco de inversão térmica e escorrimento foliar',
        color: 'text-sky-600 bg-sky-500/15 border-sky-500/30',
      };
    }
    if (deltaT >= 2.0 && deltaT <= 8.0) {
      return {
        label: 'Faixa Ideal (2°C a 8°C)',
        sublabel: 'Condição meteorológica perfeita para gotas aeroagrícolas',
        color: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30',
      };
    }
    if (deltaT > 8.0 && deltaT <= 10.0) {
      return {
        label: 'Atenção Elevada (8°C a 10°C)',
        sublabel: 'Evaporação rápida. Adicionar adjuvante vegetal/antideriva',
        color: 'text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30',
      };
    }
    return {
      label: 'Crítico / Proibido (> 10°C)',
      sublabel: 'Evaporação imediata da gota no ar. Perda total de eficácia',
      color: 'text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30',
    };
  };

  const deltaTStatus = getDeltaTStatus();

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Top Header & Global Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <Wind className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
                Centro Meteorológico & Previsão
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Previsão de chuva, vento, umidade e portão psicrométrico Delta T por município.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsSourceInfoModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Entenda de onde vêm os dados de satélite e meteorologia"
          >
            <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Como Funciona a Coleta?</span>
          </button>

          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
            title="Emitir laudo técnico meteorológico pré-voo para anexo em OS"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Emitir Laudo</span>
          </button>
        </div>
      </div>

      {/* City Search Bar & Location Selector Component */}
      <WeatherCitySelector
        selectedCity={selectedCity}
        onSelectCity={(city) => setSelectedCity(city)}
        farmPlots={plots}
        isLoading={isLoading}
      />

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 overflow-x-auto scrollbar-none text-xs">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
            activeTab === 'overview'
              ? 'bg-white dark:bg-emerald-900 text-emerald-950 dark:text-white shadow-2xs font-black'
              : 'text-emerald-900/80 dark:text-emerald-200/80 hover:bg-white/50 dark:hover:bg-emerald-900/40'
          }`}
        >
          <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Painel Atual & Delta T</span>
        </button>

        <button
          onClick={() => setActiveTab('hourly')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
            activeTab === 'hourly'
              ? 'bg-white dark:bg-emerald-900 text-emerald-950 dark:text-white shadow-2xs font-black'
              : 'text-emerald-900/80 dark:text-emerald-200/80 hover:bg-white/50 dark:hover:bg-emerald-900/40'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Horário (24h)</span>
        </button>

        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
            activeTab === 'weekly'
              ? 'bg-white dark:bg-emerald-900 text-emerald-950 dark:text-white shadow-2xs font-black'
              : 'text-emerald-900/80 dark:text-emerald-200/80 hover:bg-white/50 dark:hover:bg-emerald-900/40'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Previsão 7 Dias</span>
        </button>

        <button
          onClick={() => setActiveTab('prescription')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap text-xs ${
            activeTab === 'prescription'
              ? 'bg-white dark:bg-emerald-900 text-emerald-950 dark:text-white shadow-2xs font-black'
              : 'text-emerald-900/80 dark:text-emerald-200/80 hover:bg-white/50 dark:hover:bg-emerald-900/40'
          }`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Prescritor Técnico</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & DELTA T FLIGHT GATE */}
      {activeTab === 'overview' && (
        <div className="space-y-3 sm:space-y-4">
          {/* Real-time Weather HUD */}
          <WeatherCurrentHUD
            current={activeCurrentWeather}
            cityName={selectedCity.name}
            isManualSimulation={isManualMode}
            onToggleManualSimulation={() => setIsManualMode(!isManualMode)}
            onRefreshWeather={handleRefresh}
            isRefreshing={isRefreshing}
          />

          {/* Manual Field Calibration Sliders (When Kestrel Mode is Active) */}
          {isManualMode && (
            <div className="p-3 sm:p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 shadow-2xs space-y-3 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100">
                      Aferição Manual (Kestrel / Termohigrômetro)
                    </h3>
                    <p className="text-[11px] text-amber-900/80 dark:text-amber-300/80">
                      Ajuste os valores medidos em campo para aferir o Portão de Decolagem.
                    </p>
                  </div>
                </div>

                {/* Simulation Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => {
                      setManualTemp(25.0);
                      setManualHumidity(65.0);
                      setManualWind(8.0);
                    }}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold bg-white dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 cursor-pointer shadow-2xs"
                  >
                    ✓ Ideal
                  </button>
                  <button
                    onClick={() => {
                      setManualTemp(35.0);
                      setManualHumidity(35.0);
                      setManualWind(12.0);
                    }}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/70 text-amber-900 dark:text-amber-200 border border-amber-300 hover:bg-amber-200 cursor-pointer shadow-2xs"
                  >
                    ⚠ Evaporação
                  </button>
                  <button
                    onClick={() => {
                      setManualTemp(28.0);
                      setManualHumidity(55.0);
                      setManualWind(18.0);
                    }}
                    className="px-2 py-0.5 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 border border-rose-300 hover:bg-rose-200 cursor-pointer shadow-2xs"
                  >
                    🛑 Vento &gt; 15
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-0.5">
                {/* Temp Slider */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/60 border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between font-bold mb-1 text-amber-950 dark:text-amber-100 text-xs">
                    <span>Temp. (Bulbo Seco):</span>
                    <span className="font-mono text-sm font-black text-amber-900 dark:text-amber-200">
                      {manualTemp.toFixed(1).replace('.', ',')} °C
                    </span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="42"
                    step="0.5"
                    value={manualTemp}
                    onChange={(e) => setManualTemp(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    <span>15°C</span>
                    <span>Ideal: &lt; 30°C</span>
                    <span>42°C</span>
                  </div>
                </div>

                {/* Humidity Slider */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/60 border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between font-bold mb-1 text-amber-950 dark:text-amber-100 text-xs">
                    <span>Umidade (UR):</span>
                    <span className="font-mono text-sm font-black text-amber-900 dark:text-amber-200">
                      {manualHumidity.toFixed(0)} %
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="95"
                    step="1"
                    value={manualHumidity}
                    onChange={(e) => setManualHumidity(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    <span>20%</span>
                    <span>Ideal: &gt; 55%</span>
                    <span>95%</span>
                  </div>
                </div>

                {/* Wind Slider */}
                <div className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/60 border border-amber-200 dark:border-amber-800">
                  <div className="flex justify-between font-bold mb-1 text-amber-950 dark:text-amber-100 text-xs">
                    <span>Vento:</span>
                    <span className={`font-mono text-sm font-black ${
                      manualWind > 15 ? 'text-rose-600' : 'text-amber-900 dark:text-amber-200'
                    }`}>
                      {manualWind.toFixed(1).replace('.', ',')} km/h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    step="0.5"
                    value={manualWind}
                    onChange={(e) => setManualWind(parseFloat(e.target.value))}
                    className="w-full accent-amber-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
                    <span>0 km/h</span>
                    <span>Máx: 15 km/h</span>
                    <span>28 km/h</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Psychrometric Gauge & Agronomic Science Track */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Escala Técnica de Delta T (EMBRAPA / MAPA)
                </h3>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                  Diferencial entre bulbo seco e bulbo úmido que governa a taxa de evaporação das gotas.
                </p>
              </div>

              <div className="flex items-center gap-1.5 font-mono font-bold text-xs bg-white dark:bg-emerald-950 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                <span>Delta T:</span>
                <span className={`px-2 py-0.5 rounded-md font-black ${deltaTStatus.color}`}>
                  {deltaT.toFixed(1).replace('.', ',')} °C • {deltaT < 2 ? 'Inversão' : deltaT <= 8 ? 'Ideal' : deltaT <= 10 ? 'Atenção' : 'Proibido'}
                </span>
              </div>
            </div>

            {/* Graphical Scale Track with Pointer */}
            <div className="relative pt-7 pb-2 px-1">
              {/* Pointer with pill badge */}
              <div
                className="absolute top-0 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-300 ease-out"
                style={{
                  left: `${Math.min(97, Math.max(3, (deltaT / 12) * 100))}%`,
                }}
              >
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black shadow-md flex items-center gap-1 border whitespace-nowrap ${
                  deltaT < 2 
                    ? 'bg-sky-600 text-white border-sky-300' 
                    : deltaT <= 8 
                    ? 'bg-emerald-600 text-white border-emerald-300' 
                    : deltaT <= 10 
                    ? 'bg-amber-600 text-white border-amber-300' 
                    : 'bg-rose-600 text-white border-rose-300'
                }`}>
                  <span>▲ {deltaT.toFixed(1).replace('.', ',')}°C</span>
                  <span className="opacity-80">({deltaT < 2 ? 'Inversão' : deltaT <= 8 ? 'IDEAL' : deltaT <= 10 ? 'Atenção' : 'Crítico'})</span>
                </div>
                <div className={`w-2.5 h-2.5 rotate-45 -mt-1 ${
                  deltaT < 2 ? 'bg-sky-600' : deltaT <= 8 ? 'bg-emerald-600' : deltaT <= 10 ? 'bg-amber-600' : 'bg-rose-600'
                }`} />
              </div>

              {/* 4 Colored Segments Track */}
              <div className="h-6 w-full rounded-2xl overflow-hidden flex text-[10px] font-extrabold text-white shadow-inner p-0.5 bg-emerald-950/80 border border-emerald-700/60">
                <div 
                  style={{ width: '16.66%' }} 
                  className={`h-full rounded-l-xl flex items-center justify-center transition-all bg-gradient-to-r from-sky-400 to-cyan-500 text-emerald-950 ${
                    deltaT < 2 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-85'
                  }`}
                  title="< 2°C: Risco de Inversão Térmica e Escorrimento Foliar"
                >
                  <span className="truncate px-1">&lt; 2°C</span>
                </div>

                <div 
                  style={{ width: '50%' }} 
                  className={`h-full flex items-center justify-center transition-all bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-500 ${
                    deltaT >= 2 && deltaT <= 8 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-85'
                  }`}
                  title="2° a 8°C: Faixa Ideal de Eficácia e Segurança Aeroagrícola"
                >
                  <span className="truncate px-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300 hidden sm:inline" />
                    2° a 8°C (FAIXA IDEAL)
                  </span>
                </div>

                <div 
                  style={{ width: '16.66%' }} 
                  className={`h-full flex items-center justify-center transition-all bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 ${
                    deltaT > 8 && deltaT <= 10 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-85'
                  }`}
                  title="8° a 10°C: Evaporação Rápida - Exige Gota Grossa e Adjuvante"
                >
                  <span className="truncate px-1">8° a 10°C</span>
                </div>

                <div 
                  style={{ width: '16.66%' }} 
                  className={`h-full rounded-r-xl flex items-center justify-center transition-all bg-gradient-to-r from-rose-500 to-red-600 ${
                    deltaT > 10 ? 'ring-2 ring-white scale-y-110 shadow-md font-black' : 'opacity-85'
                  }`}
                  title="> 10°C: Evaporação Crítica - Decolagem Bloqueada"
                >
                  <span className="truncate px-1">&gt; 10°C</span>
                </div>
              </div>

              {/* Ruler Ticks */}
              <div className="flex justify-between text-[10px] text-emerald-800/80 dark:text-emerald-300/80 font-mono font-bold mt-1 px-1">
                <span>0°C</span>
                <span>2°C (Mínimo)</span>
                <span>5°C (Centro)</span>
                <span>8°C (Máximo)</span>
                <span>10°C (Limite)</span>
                <span>12°C+</span>
              </div>
            </div>

            {/* 4 Interactive Agronomic Technical Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
              <div className={`p-3.5 rounded-2xl border transition-all ${
                deltaT < 2 
                  ? 'bg-sky-500/15 border-sky-400 dark:border-sky-500 ring-2 ring-sky-400/50 shadow-md scale-[1.02]' 
                  : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-xs text-sky-700 dark:text-sky-300">&lt; 2.0 °C</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-800 dark:text-sky-200">
                    {deltaT < 2 ? '★ ATUAL' : 'Muito Baixo'}
                  </span>
                </div>
                <h5 className="font-bold text-emerald-950 dark:text-white text-xs mb-0.5">Inversão / Escorrimento</h5>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/70 leading-snug">
                  Gotas não evaporam. Risco de névoa flutuante sem deposição no alvo foliar ou escorrimento excessivo.
                </p>
                <div className="mt-2 pt-1.5 border-t border-sky-200/60 dark:border-sky-900/60 text-[10px] font-semibold text-sky-800 dark:text-sky-300">
                  💡 Ação: Reduzir volume de calda e checar vento &gt; 3 km/h.
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-all ${
                deltaT >= 2 && deltaT <= 8 
                  ? 'bg-emerald-500/20 border-emerald-400 dark:border-emerald-400 ring-2 ring-emerald-400/60 shadow-md scale-[1.02]' 
                  : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300">2.0° a 8.0 °C</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/30 text-emerald-900 dark:text-emerald-100 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                    {deltaT >= 2 && deltaT <= 8 ? '★ ATUAL' : 'Faixa de Ouro'}
                  </span>
                </div>
                <h5 className="font-bold text-emerald-950 dark:text-white text-xs mb-0.5">Janela Ideal de Pulverização</h5>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/70 leading-snug">
                  Condição termodinâmica perfeita. Máxima absorção estomática foliar e taxa mínima de perda por deriva.
                </p>
                <div className="mt-2 pt-1.5 border-t border-emerald-200/60 dark:border-emerald-800/60 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300">
                  ✓ Gotas finas e médias (150 a 250 µm) 100% liberadas.
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-all ${
                deltaT > 8 && deltaT <= 10 
                  ? 'bg-amber-500/20 border-amber-400 dark:border-amber-400 ring-2 ring-amber-400/60 shadow-md scale-[1.02]' 
                  : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-xs text-amber-700 dark:text-amber-300">8.0° a 10.0 °C</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/30 text-amber-900 dark:text-amber-100">
                    {deltaT > 8 && deltaT <= 10 ? '★ ATUAL' : 'Atenção'}
                  </span>
                </div>
                <h5 className="font-bold text-emerald-950 dark:text-white text-xs mb-0.5">Evaporação Acelerada</h5>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/70 leading-snug">
                  O ar seco e quente evapora as microgotas antes de atingir o baixeiro. Requer ajuste de bico e calda.
                </p>
                <div className="mt-2 pt-1.5 border-t border-amber-200/60 dark:border-amber-800/60 text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                  ⚠ Exigência: Bico de indução de ar + Óleo anti-evaporante.
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border transition-all ${
                deltaT > 10 
                  ? 'bg-rose-500/20 border-rose-400 dark:border-rose-400 ring-2 ring-rose-400/60 shadow-md scale-[1.02]' 
                  : 'bg-white/60 dark:bg-[#041c14]/40 border-emerald-200/60 dark:border-emerald-800/60 opacity-80'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono font-black text-xs text-rose-700 dark:text-rose-300">&gt; 10.0 °C</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-900 dark:text-rose-100">
                    {deltaT > 10 ? '★ ATUAL' : 'Crítico'}
                  </span>
                </div>
                <h5 className="font-bold text-emerald-950 dark:text-white text-xs mb-0.5">Decolagem Bloqueada</h5>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/70 leading-snug">
                  Evaporação instantânea no trajeto da aeronave. Risco de perda superior a 70% do defensivo e deriva gasosa.
                </p>
                <div className="mt-2 pt-1.5 border-t border-rose-200/60 dark:border-rose-800/60 text-[10px] font-semibold text-rose-800 dark:text-rose-300">
                  🛑 Ação Obrigatória: Interromper aplicação imediatamente.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: HOURLY SPRAY PLANNER */}
      {activeTab === 'hourly' && (
        <HourlySprayPlanner
          hourly={weatherData.hourly}
          cityName={selectedCity.name}
        />
      )}

      {/* TAB 3: 7-DAY FORECAST GRID */}
      {activeTab === 'weekly' && (
        <SevenDayForecastGrid
          daily={weatherData.daily}
          cityName={selectedCity.name}
        />
      )}

      {/* TAB 4: PRESCRIPTION & NOZZLES */}
      {activeTab === 'prescription' && (
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3 sm:space-y-4">
          <div>
            <h2 className="text-sm sm:text-base font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Guia Técnico de Pontas, Gotas e Adjuvantes
            </h2>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              Prescrições operacionais fundamentadas nas normas EMBRAPA / MAPA para {selectedCity.name}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* Box 1: Pontas e Gotas */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 space-y-2">
              <h3 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-600" />
                Gota & Ponta Indicada
              </h3>
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold block">Gota Recomendada:</span>
                <span className="text-sm font-black text-emerald-950 dark:text-white">
                  {activeAssessment.recommendedDropletSize}
                </span>
              </div>
              <p className="text-emerald-800/90 dark:text-emerald-200 text-[11px] leading-relaxed">
                Ponta: <strong>{activeAssessment.recommendedNozzle}</strong>. Em drones com atomizadores centrífugos CDA, calibrar rotação conforme a tabela.
              </p>
            </div>

            {/* Box 2: Adjuvantes de Calda */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 space-y-2">
              <h3 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Adjuvante & Proteção
              </h3>
              <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block">Adjuvante Prescrito:</span>
                <span className="text-sm font-black text-amber-950 dark:text-amber-100">
                  {activeAssessment.recommendedAdjuvant}
                </span>
              </div>
              <p className="text-emerald-800/90 dark:text-emerald-200 text-[11px] leading-relaxed">
                Com Delta T de 8°C a 10°C, óleo vegetal metilado ou éster de ácido graxo reduz a taxa de evaporação das gotas em mais de 60%.
              </p>
            </div>

            {/* Box 3: Altura e Velocidade de Voo */}
            <div className="p-3.5 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800/90 space-y-2">
              <h3 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-sky-500" />
                Parâmetros de Voo
              </h3>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <span>Altura cultura (Drone):</span>
                  <strong className="text-emerald-950 dark:text-white">2.5m a 3.5m</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <span>Altura (Avião Agrícola):</span>
                  <strong className="text-emerald-950 dark:text-white">3.0m a 4.5m</strong>
                </div>
                <div className="flex justify-between p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50">
                  <span>Faixa de Deposição:</span>
                  <strong className="text-emerald-950 dark:text-white">Calibração bicos</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border animate-bounce ${
          toastType === 'success' 
            ? 'bg-emerald-600 text-white border-emerald-400/40' 
            : toastType === 'error'
            ? 'bg-rose-600 text-white border-rose-400/40'
            : 'bg-slate-800 text-white border-slate-700'
        }`}>
          {toastType === 'success' && <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-100" />}
          {toastType === 'error' && <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-100" />}
          {toastType === 'info' && <Loader2 className="w-5 h-5 flex-shrink-0 text-slate-100 animate-spin" />}
          <span className="text-xs font-bold leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* Technical Report Modal */}
      <WeatherReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        weatherData={weatherData}
        currentUser={currentUser}
      />

      {/* Weather Data Source & Telemetry Info Modal */}
      {isSourceInfoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-emerald-900 via-emerald-850 to-teal-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-2xs">
                  <Radio className="w-5 h-5 text-emerald-300 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight flex items-center gap-2">
                    Arquitetura de Coleta Meteorológica
                  </h3>
                  <p className="text-xs text-emerald-200/80">
                    Origem dos dados, telemetria em tempo real e modelos de simulação agronômica
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSourceInfoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              
              {/* Section 1: API Open-Meteo & Radar */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-emerald-950 dark:text-emerald-200">
                  <Globe className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>1. Integração Live: API Open-Meteo & Modelos Globais</span>
                </div>
                <p>
                  O AgroSys realiza consultas em tempo real à API meteorológica global de alta resolução 
                  <strong className="text-emerald-900 dark:text-emerald-100"> Open-Meteo API</strong>, combinando múltiplos modelos numéricos de previsão atmosférica:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <li><strong>NOAA GFS & HRRR:</strong> Modelos norte-americanos para dinâmica de vento e pressão de superfície.</li>
                  <li><strong>ECMWF Integrated Forecasting System:</strong> Padrão ouro europeu para umidade relativa e ponto de orvalho.</li>
                  <li><strong>DWD ICON (Alemanha):</strong> Cobertura de nuvens, radiação solar e probabilidade de chuva por grade geográfica de 2.5 a 11 km.</li>
                </ul>
              </div>

              {/* Section 2: Reversa Geocoding & GPS */}
              <div className="p-4 rounded-2xl bg-sky-50/60 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-800/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-sky-950 dark:text-sky-200">
                  <Compass className="w-4.5 h-4.5 text-sky-600 dark:text-sky-400" />
                  <span>2. Geolocalização GPS & Geocodificação Reversa</span>
                </div>
                <p>
                  Quando o operador aciona a busca por município ou utiliza a opção <strong>"Usar GPS do Campo"</strong>:
                </p>
                <ul className="list-disc list-inside pl-2 space-y-1 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                  <li>As coordenadas exatas (Latitude / Longitude / Altitude) são identificadas via <strong>API BigDataCloud & OpenStreetMap Nominatim</strong>.</li>
                  <li>O AgroSys consulta imediatamente o nó de previsão atmosférica correspondente à coordenada da fazenda ou talhão selecionado.</li>
                </ul>
              </div>

              {/* Section 3: Aferição Manual (Kestrel) */}
              <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/80 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-amber-950 dark:text-amber-200">
                  <Sliders className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                  <span>3. Aferição em Campo (Termohigrômetros / Kestrel 5500)</span>
                </div>
                <p>
                  Como microclimas locais podem sofrer variações térmicas ou rajadas súbitas, o AgroSys permite o modo de 
                  <strong className="text-amber-900 dark:text-amber-100"> "Aferição Manual"</strong>. O piloto ou engenheiro agrônomo lê os dados no medidor portátil no local da pista e ajusta a umidade, temperatura e velocidade do vento instantaneamente.
                </p>
              </div>

              {/* Section 4: Fallback & Simulação Agronômica */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-white">
                  <Database className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                  <span>4. Resiliência Offline & Modelo Agronômico Local</span>
                </div>
                <p>
                  Caso a área de aplicação esteja em zona sem sinal celular/internet, o sistema ativa um modelo psicrométrico determinístico baseado na latitude e histórico estacional do município, garantindo o cálculo seguro do <strong>Delta T e Portão de Decolagem sem interrupção de operação</strong>.
                </p>
              </div>

              {/* Section 5: Cálculo do Delta T & Normas MAPA */}
              <div className="p-3.5 rounded-xl bg-emerald-900 text-white space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-300">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Conformidade com Normas Agropecuárias MAPA / EMBRAPA</span>
                </div>
                <p className="text-emerald-100/90 leading-normal">
                  Todas as métricas de liberação de voo (Portão de Decolagem) passam por algoritmos de temperatura de bulbo úmido (Fórmula de Stull) para derivar o <strong>Delta T (°C)</strong>, restringindo o voo quando a umidade cai abaixo de 50%, temperatura supera 30°C ou vento excede 15 km/h.
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                AgroSys Weather Intelligence Protocol v2.5
              </span>
              <button
                type="button"
                onClick={() => setIsSourceInfoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-2xs"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
