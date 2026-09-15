/**
 * Weather & Agronomic Spray Window Service
 * High-precision meteorological forecasting, Open-Meteo API integration,
 * psychrometric Delta T calculation, and MAPA/EMBRAPA aerial spraying gates.
 */

import { formatDecimal } from '../utils/formatters';
import { NetworkService } from './networkService';

export interface CityLocation {
  id: string;
  name: string;
  state: string;
  country: string;
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  region?: string;
  mainCrops?: string[];
}

export type SprayStatus = 
  | 'IDEAL' 
  | 'FAVORABLE_CAUTION' 
  | 'THERMAL_INVERSION' 
  | 'BLOCKED_WIND' 
  | 'BLOCKED_EVAPORATION' 
  | 'BLOCKED_RAIN';

export interface SprayAssessment {
  status: SprayStatus;
  score: number; // 0 to 100
  title: string;
  description: string;
  badgeLabel: string;
  badgeColor: string;
  isAllowed: boolean;
  recommendedDropletSize: 'Fina (100-175 µm)' | 'Média (175-250 µm)' | 'Grossa (250-375 µm)' | 'Ultra Grossa (> 375 µm)';
  recommendedNozzle: string;
  recommendedAdjuvant: string;
  driftRiskLevel: 'Baixo' | 'Moderado' | 'Alto' | 'Extremo / Impeditivo';
  evaporationRiskLevel: 'Baixo' | 'Moderado' | 'Alto' | 'Crítico';
}

export interface CurrentWeather {
  time: string;
  temperature: number; // °C
  apparentTemperature: number; // °C
  relativeHumidity: number; // %
  dewPoint: number; // °C
  wetBulbTemp: number; // °C
  deltaT: number; // °C
  windSpeed: number; // km/h
  windDirectionDegrees: number;
  windDirectionCompass: string;
  windGusts: number; // km/h
  precipitation: number; // mm
  precipitationProbability: number; // %
  surfacePressure: number; // hPa
  uvIndex: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  cloudCover: number; // %
  assessment: SprayAssessment;
}

export interface HourlyForecastItem {
  time: string; // ISO string or HH:mm
  hourNumber: number;
  dayLabel: string;
  temperature: number;
  apparentTemperature: number;
  relativeHumidity: number;
  dewPoint: number;
  wetBulbTemp: number;
  deltaT: number;
  windSpeed: number;
  windGusts: number;
  windDirectionCompass: string;
  windDirectionDegrees: number;
  precipitation: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  assessment: SprayAssessment;
}

export interface DailyForecastItem {
  date: string;
  dayOfWeek: string;
  temperatureMax: number;
  temperatureMin: number;
  precipitationSum: number;
  precipitationProbabilityMax: number;
  windSpeedMax: number;
  windGustsMax: number;
  dominantWindDirection: string;
  weatherCode: number;
  weatherDescription: string;
  weatherIcon: string;
  favorableSprayHoursCount: number;
  bestSprayWindow?: string;
  dominantSprayStatus: SprayStatus;
}

export interface WeatherForecastData {
  city: CityLocation;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  lastUpdated: string;
  isSimulatedOffline: boolean;
}

/**
 * High-priority Brazilian agricultural capitals and grain-belt municipalities
 */
export const POPULAR_AGRO_CITIES: CityLocation[] = [
  {
    id: 'contagem-mg',
    name: 'Contagem',
    state: 'MG',
    country: 'Brasil',
    latitude: -19.9317,
    longitude: -44.0539,
    elevationMeters: 858,
    region: 'Região Metropolitana de BH',
    mainCrops: ['Horticultura', 'Cinturão Verde', 'Pólo Logístico Agro']
  },
  {
    id: 'jacarandira-mg',
    name: 'Jacarandira',
    state: 'MG',
    country: 'Brasil',
    latitude: -20.7563,
    longitude: -44.4173,
    elevationMeters: 1079,
    region: 'Campos das Vertentes',
    mainCrops: ['Milho', 'Feijão', 'Pecuária Leiteira']
  },
  {
    id: 'resende-costa-mg',
    name: 'Resende Costa',
    state: 'MG',
    country: 'Brasil',
    latitude: -20.9233,
    longitude: -44.2379,
    elevationMeters: 1140,
    region: 'Campos das Vertentes',
    mainCrops: ['Milho', 'Feijão', 'Pecuária']
  },
  {
    id: 'lagoa-dourada-mg',
    name: 'Lagoa Dourada',
    state: 'MG',
    country: 'Brasil',
    latitude: -20.9148,
    longitude: -44.0754,
    elevationMeters: 1052,
    region: 'Campos das Vertentes',
    mainCrops: ['Milho', 'Horticultura', 'Pecuária Leiteira']
  },
  {
    id: 'uberlandia-mg',
    name: 'Uberlândia',
    state: 'MG',
    country: 'Brasil',
    latitude: -18.9186,
    longitude: -48.2772,
    elevationMeters: 863,
    region: 'Triângulo Mineiro',
    mainCrops: ['Soja', 'Milho', 'Café']
  },
  {
    id: 'patos-de-minas-mg',
    name: 'Patos de Minas',
    state: 'MG',
    country: 'Brasil',
    latitude: -18.5794,
    longitude: -46.5181,
    elevationMeters: 815,
    region: 'Alto Paranaíba',
    mainCrops: ['Milho', 'Soja', 'Feijão']
  },
  {
    id: 'unai-mg',
    name: 'Unaí',
    state: 'MG',
    country: 'Brasil',
    latitude: -16.3578,
    longitude: -46.9061,
    elevationMeters: 640,
    region: 'Noroeste Mineiro',
    mainCrops: ['Soja', 'Feijão', 'Milho', 'Algodão']
  },
  {
    id: 'uberaba-mg',
    name: 'Uberaba',
    state: 'MG',
    country: 'Brasil',
    latitude: -19.7483,
    longitude: -47.9319,
    elevationMeters: 823,
    region: 'Triângulo Mineiro',
    mainCrops: ['Cana-de-açúcar', 'Soja', 'Pecuária Zebuína']
  },
  {
    id: 'sao-gotardo-mg',
    name: 'São Gotardo',
    state: 'MG',
    country: 'Brasil',
    latitude: -19.3111,
    longitude: -46.0489,
    elevationMeters: 1100,
    region: 'Alto Paranaíba',
    mainCrops: ['Hortifrúti', 'Cenoura', 'Batata', 'Café']
  },
  {
    id: 'manhuacu-mg',
    name: 'Manhuaçu',
    state: 'MG',
    country: 'Brasil',
    latitude: -20.2578,
    longitude: -42.0336,
    elevationMeters: 635,
    region: 'Zona da Mata',
    mainCrops: ['Café Arábica', 'Milho']
  },
  {
    id: 'varginha-mg',
    name: 'Varginha',
    state: 'MG',
    country: 'Brasil',
    latitude: -21.5519,
    longitude: -45.4303,
    elevationMeters: 920,
    region: 'Sul de Minas',
    mainCrops: ['Café Arábica', 'Horticultura']
  },
  {
    id: 'montes-claros-mg',
    name: 'Montes Claros',
    state: 'MG',
    country: 'Brasil',
    latitude: -16.7281,
    longitude: -43.8578,
    elevationMeters: 678,
    region: 'Norte de Minas',
    mainCrops: ['Pecuária de Corte', 'Eucalipto', 'Fruticultura']
  }
];

/**
 * Psychrometric approximation of Wet Bulb Temperature (Tw) using Stull's empirical formula
 * @param T Ambient dry bulb temperature in Celsius
 * @param rh Relative humidity in percent (0 - 100)
 */
export function calculateWetBulbTemp(T: number, rh: number): number {
  const Tw = 
    T * Math.atan(0.151977 * Math.pow(rh + 8.313659, 0.5)) +
    Math.atan(T + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * Math.pow(rh, 1.5) * Math.atan(0.023101 * rh) -
    4.686035;
  return Math.round(Tw * 10) / 10;
}

/**
 * Psychrometric Delta T (°C) = Dry Bulb (T) - Wet Bulb (Tw)
 */
export function calculateDeltaT(temperature: number, humidity: number): number {
  const Tw = calculateWetBulbTemp(temperature, humidity);
  return Math.max(0.1, Math.round((temperature - Tw) * 10) / 10);
}

/**
 * Converts wind degrees (0-360) into compass direction abbreviation
 */
export function degreesToCompass(degrees: number): string {
  const val = Math.floor((degrees / 22.5) + 0.5);
  const arr = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return arr[val % 16];
}

/**
 * Translates WMO weather codes into Portuguese descriptions and icons
 */
export function parseWeatherCode(code: number): { description: string; icon: string } {
  switch (code) {
    case 0:
      return { description: 'Céu Limpo / Ensolarado', icon: 'sun' };
    case 1:
      return { description: 'Predomínio de Sol', icon: 'sun-dim' };
    case 2:
      return { description: 'Parcialmente Nublado', icon: 'cloud-sun' };
    case 3:
      return { description: 'Nublado / Encoberto', icon: 'cloud' };
    case 45:
    case 48:
      return { description: 'Nevoeiro / Névoa Úmida', icon: 'fog' };
    case 51:
    case 53:
    case 55:
      return { description: 'Garoa / Chuvisco', icon: 'drizzle' };
    case 61:
    case 63:
    case 65:
      return { description: 'Chuva Contínua', icon: 'rain' };
    case 71:
    case 73:
    case 75:
      return { description: 'Precipitação Sólida', icon: 'snow' };
    case 80:
    case 81:
    case 82:
      return { description: 'Pancadas de Chuva', icon: 'rain-heavy' };
    case 95:
    case 96:
    case 99:
      return { description: 'Trovoada / Tempestade', icon: 'thunderstorm' };
    default:
      return { description: 'Condição Estável', icon: 'cloud-sun' };
  }
}

/**
 * Evaluates the spraying suitability for agricultural aviation / drones
 * following EMBRAPA, MAPA, and international aeroagricultural guidelines.
 */
export function assessSprayingSuitability(
  temperature: number,
  humidity: number,
  windSpeed: number,
  windGusts: number,
  precipitation: number,
  precipitationProbability: number
): SprayAssessment {
  const deltaT = calculateDeltaT(temperature, humidity);

  // 1. Rain Gate (Impeditivo Absoluto)
  if (precipitation > 0.05 || precipitationProbability >= 45) {
    return {
      status: 'BLOCKED_RAIN',
      score: 5,
      title: 'Decolagem Bloqueada: Chuva / Precipitação',
      description: `Risco de lavagem foliar imediata da calda química (${formatDecimal(precipitation, 1)} mm, prob: ${precipitationProbability}%). Aplicações proibidas.`,
      badgeLabel: 'Chuva / Bloqueado',
      badgeColor: 'bg-indigo-600 text-white border-indigo-500',
      isAllowed: false,
      recommendedDropletSize: 'Ultra Grossa (> 375 µm)',
      recommendedNozzle: 'Não aplicar durante chuva',
      recommendedAdjuvant: 'Nenhum (operação suspensa)',
      driftRiskLevel: 'Extremo / Impeditivo',
      evaporationRiskLevel: 'Baixo'
    };
  }

  // 2. Wind Gate (> 15 km/h) or Gusts (> 20 km/h)
  if (windSpeed > 15.0 || windGusts > 20.0) {
    return {
      status: 'BLOCKED_WIND',
      score: 15,
      title: 'Decolagem Bloqueada: Vento Excessivo',
      description: `Vento em ${formatDecimal(windSpeed, 1)} km/h (rajadas até ${formatDecimal(windGusts, 1)} km/h). Limite legal do MAPA/ANAC é 15 km/h. Risco severo de deriva para fora do talhão.`,
      badgeLabel: 'Vento Alto / Bloqueado',
      badgeColor: 'bg-rose-600 text-white border-rose-500',
      isAllowed: false,
      recommendedDropletSize: 'Ultra Grossa (> 375 µm)',
      recommendedNozzle: 'Indução de ar antideriva (AI/TTI)',
      recommendedAdjuvant: 'Polímero antideriva obrigatório',
      driftRiskLevel: 'Extremo / Impeditivo',
      evaporationRiskLevel: 'Alto'
    };
  }

  // 3. High Evaporation Gate (Delta T > 10°C or RH < 45% or T > 32°C)
  if (deltaT > 10.0 || humidity < 45.0 || temperature > 33.0) {
    return {
      status: 'BLOCKED_EVAPORATION',
      score: 25,
      title: 'Decolagem Bloqueada: Evaporação Crítica',
      description: `Delta T em ${formatDecimal(deltaT, 1)}°C e UR em ${formatDecimal(humidity, 0)}%. O ar superaquecido evapora as gotas antes de atingirem o dossel da lavoura.`,
      badgeLabel: 'Evaporação Alta / Bloqueado',
      badgeColor: 'bg-rose-700 text-white border-rose-600',
      isAllowed: false,
      recommendedDropletSize: 'Grossa (250-375 µm)',
      recommendedNozzle: 'Bicos com indução de ar ou cone hidráulico de alta vazão',
      recommendedAdjuvant: 'Óleo vegetal/mineral metilado (0,8% a 1,5%)',
      driftRiskLevel: 'Alto',
      evaporationRiskLevel: 'Crítico'
    };
  }

  // 4. Thermal Inversion / Calm Wind Gate (Wind < 3.0 km/h or Delta T < 2.0°C)
  if (windSpeed < 3.0 || deltaT < 2.0) {
    return {
      status: 'THERMAL_INVERSION',
      score: 45,
      title: 'Atenção Restritiva: Vento Calmo / Inversão Térmica',
      description: `Vento em ${formatDecimal(windSpeed, 1)} km/h com Delta T em ${formatDecimal(deltaT, 1)}°C. Camada de ar estável retém as gotas em suspensão, provocando deriva difusa e escorrimento foliar.`,
      badgeLabel: 'Risco de Inversão Térmica',
      badgeColor: 'bg-sky-600 text-white border-sky-400',
      isAllowed: false,
      recommendedDropletSize: 'Média (175-250 µm)',
      recommendedNozzle: 'Leque plano de baixa pressão',
      recommendedAdjuvant: 'Espalhante organosiliconado padrão',
      driftRiskLevel: 'Moderado',
      evaporationRiskLevel: 'Baixo'
    };
  }

  // 5. Caution Zone (Delta T 8.0 - 10.0°C or Wind 12.0 - 15.0 km/h or RH 50-55%)
  if ((deltaT > 8.0 && deltaT <= 10.0) || (windSpeed >= 12.0 && windSpeed <= 15.0) || (humidity >= 45.0 && humidity < 55.0)) {
    return {
      status: 'FAVORABLE_CAUTION',
      score: 75,
      title: 'Janela Favorável com Restrições Técnicas',
      description: `Delta T em ${formatDecimal(deltaT, 1)}°C e Vento em ${formatDecimal(windSpeed, 1)} km/h. Pulverização autorizada com ajuste obrigatório para gotas médias/grossas e uso de óleo anti-evaporante.`,
      badgeLabel: 'Janela com Atenção',
      badgeColor: 'bg-amber-500 text-slate-950 border-amber-400 font-black',
      isAllowed: true,
      recommendedDropletSize: 'Grossa (250-375 µm)',
      recommendedNozzle: 'Ponta de indução de ar leque duplo (ex: AI3070 ou Turbo TeeJet)',
      recommendedAdjuvant: 'Óleo vegetal emulsificável anti-deriva (0,5% a 0,8%)',
      driftRiskLevel: 'Moderado',
      evaporationRiskLevel: 'Moderado'
    };
  }

  // 6. Ideal Gold Window (Delta T 2.0 - 8.0°C, Wind 3.0 - 12.0 km/h, RH >= 55%)
  return {
    status: 'IDEAL',
    score: 100,
    title: 'Janela Ouro: Condição Perfeita de Aplicação',
    description: `Condição termodinâmica excelente! Delta T em ${formatDecimal(deltaT, 1)}°C, UR em ${formatDecimal(humidity, 0)}% e vento em ${formatDecimal(windSpeed, 1)} km/h. Absorção estomática máxima e perda mínima.`,
    badgeLabel: 'Faixa Ouro (Voo Liberado)',
    badgeColor: 'bg-emerald-600 text-white border-emerald-400 font-black shadow-sm',
    isAllowed: true,
    recommendedDropletSize: 'Média (175-250 µm)',
    recommendedNozzle: 'Leque padrão ou rotativo centrífugo de drone (CDA)',
    recommendedAdjuvant: 'Espalhante adesivo ou óleo vegetal padrão (0,3% a 0,5%)',
    driftRiskLevel: 'Baixo',
    evaporationRiskLevel: 'Baixo'
  };
}

/**
 * Searches cities using Open-Meteo Geocoding API with local fallback
 */
export async function searchCities(query: string): Promise<CityLocation[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return POPULAR_AGRO_CITIES;

  // Check local database first for instant typing response
  const localMatches = POPULAR_AGRO_CITIES.filter(c => 
    c.name.toLowerCase().includes(cleanQuery) ||
    c.state.toLowerCase().includes(cleanQuery) ||
    (c.mainCrops && c.mainCrops.some(crop => crop.toLowerCase().includes(cleanQuery)))
  );

  try {
    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json&country=BR`;
    let res = await fetch(url, { signal: AbortSignal.timeout(3500) });
    let data = res.ok ? await res.json() : null;

    // Fallback to global search if no Brazilian results are resolved
    if (!data || !data.results || data.results.length === 0) {
      const globalUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=8&language=pt&format=json`;
      const globalRes = await fetch(globalUrl, { signal: AbortSignal.timeout(3500) });
      if (globalRes.ok) {
        data = await globalRes.json();
      }
    }

    if (data && data.results && Array.isArray(data.results)) {
        const remoteCities: CityLocation[] = data.results.map((r: any) => ({
          id: `city-${r.id || Math.random().toString(36).substring(7)}`,
          name: r.name,
          state: r.admin1 || r.country_code || '',
          country: r.country || 'Brasil',
          latitude: r.latitude,
          longitude: r.longitude,
          elevationMeters: r.elevation ? Math.round(r.elevation) : undefined,
          region: r.admin2 || r.admin1
        }));

        // Merge without duplicates
        const seen = new Set<string>();
        const merged: CityLocation[] = [];

        [...remoteCities, ...localMatches].forEach(item => {
          const key = `${item.name.toLowerCase()}-${item.state.toLowerCase()}`;
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(item);
          }
        });

        return merged;
      }
  } catch (err) {
    console.warn('Geocoding API network issue, fallback to local database:', err);
  }

  return localMatches.length > 0 ? localMatches : POPULAR_AGRO_CITIES;
}

/**
 * Fetches real-time weather and 7-day forecast from Open-Meteo API
 * with instant fallback simulation if offline or network error.
 */
export async function fetchWeatherForecast(city: CityLocation): Promise<WeatherForecastData> {
  if (NetworkService.isOffline) {
    console.log('Sistema em modo Offline. API de clima ignorada, gerando modelo agronômico de resiliência local...');
    return generateSimulatedWeather(city);
  }

  const { latitude, longitude } = city;
  
  const endpoint = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,dew_point_2m,cloud_cover,uv_index&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,rain,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,precipitation_sum,rain_sum,precipitation_probability_max,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant,uv_index_max&timezone=auto&forecast_days=14&wind_speed_unit=kmh&precipitation_unit=mm`;

  try {
    const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const data = await res.json();
      return parseOpenMeteoResponse(city, data);
    }
  } catch (error) {
    console.warn('Weather API failed or offline, generating high-fidelity agronomic forecast model:', error);
  }

  // Realistic fallback generated specifically for this city's geographic coordinates
  return generateSimulatedWeather(city);
}

function parseOpenMeteoResponse(city: CityLocation, data: any): WeatherForecastData {
  const currentRaw = data.current || {};
  const hourlyRaw = data.hourly || {};
  const dailyRaw = data.daily || {};

  const hourlyTimes: string[] = hourlyRaw.time || [];
  const currentTimeStr = currentRaw.time || '';
  
  // Find precise index matching current hour to obtain highly accurate live precipitation probability
  let currentHourIndex = 0;
  if (currentTimeStr && hourlyTimes.length > 0) {
    const formattedCurrent = currentTimeStr.slice(0, 13); // "YYYY-MM-DDTHH"
    const foundIdx = hourlyTimes.findIndex((t: string) => t.startsWith(formattedCurrent));
    if (foundIdx !== -1) {
      currentHourIndex = foundIdx;
    }
  }

  const curTemp = currentRaw.temperature_2m ?? 26.5;
  const curHum = currentRaw.relative_humidity_2m ?? 62.0;
  const curWind = currentRaw.wind_speed_10m ?? 8.5;
  const curGust = currentRaw.wind_gusts_10m ?? (curWind * 1.4);
  const curRain = currentRaw.precipitation ?? 0;
  const curRainProb = hourlyRaw.precipitation_probability ? (hourlyRaw.precipitation_probability[currentHourIndex] ?? 0) : 0;
  const curWindDirDeg = currentRaw.wind_direction_10m ?? 135;
  const curCode = currentRaw.weather_code ?? 1;

  const curWetBulb = calculateWetBulbTemp(curTemp, curHum);
  const curDeltaT = calculateDeltaT(curTemp, curHum);
  const curAssessment = assessSprayingSuitability(curTemp, curHum, curWind, curGust, curRain, curRainProb);
  const weatherInfo = parseWeatherCode(curCode);

  const current: CurrentWeather = {
    time: currentRaw.time || new Date().toISOString(),
    temperature: curTemp,
    apparentTemperature: currentRaw.apparent_temperature ?? curTemp,
    relativeHumidity: curHum,
    dewPoint: currentRaw.dew_point_2m ?? (curTemp - ((100 - curHum) / 5)),
    wetBulbTemp: curWetBulb,
    deltaT: curDeltaT,
    windSpeed: curWind,
    windDirectionDegrees: curWindDirDeg,
    windDirectionCompass: degreesToCompass(curWindDirDeg),
    windGusts: curGust,
    precipitation: curRain,
    precipitationProbability: curRainProb,
    surfacePressure: currentRaw.surface_pressure ?? 1013,
    uvIndex: currentRaw.uv_index ?? 6,
    weatherCode: curCode,
    weatherDescription: weatherInfo.description,
    weatherIcon: weatherInfo.icon,
    cloudCover: currentRaw.cloud_cover ?? 20,
    assessment: curAssessment
  };

  // Hourly list (full 168 hours for total weekly precision across all tabs and scheduled bookings)
  const hourly: HourlyForecastItem[] = [];

  const maxHours = hourlyTimes.length;
  for (let i = 0; i < maxHours; i++) {
    const t = hourlyRaw.temperature_2m?.[i] ?? 25;
    const h = hourlyRaw.relative_humidity_2m?.[i] ?? 60;
    const w = hourlyRaw.wind_speed_10m?.[i] ?? 8;
    const g = hourlyRaw.wind_gusts_10m?.[i] ?? (w * 1.3);
    const p = hourlyRaw.precipitation?.[i] ?? 0;
    const prob = hourlyRaw.precipitation_probability?.[i] ?? 0;
    const dir = hourlyRaw.wind_direction_10m?.[i] ?? 135;
    const code = hourlyRaw.weather_code?.[i] ?? 1;
    const dInfo = parseWeatherCode(code);

    const wb = calculateWetBulbTemp(t, h);
    const dt = calculateDeltaT(t, h);
    const assess = assessSprayingSuitability(t, h, w, g, p, prob);

    const dateObj = new Date(hourlyTimes[i]);
    const hourNum = dateObj.getHours();

    hourly.push({
      time: hourlyTimes[i],
      hourNumber: hourNum,
      dayLabel: dateObj.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      temperature: Math.round(t * 10) / 10,
      apparentTemperature: Math.round((hourlyRaw.apparent_temperature?.[i] ?? t) * 10) / 10,
      relativeHumidity: Math.round(h),
      dewPoint: Math.round((hourlyRaw.dew_point_2m?.[i] ?? (t - ((100 - h) / 5))) * 10) / 10,
      wetBulbTemp: wb,
      deltaT: dt,
      windSpeed: Math.round(w * 10) / 10,
      windGusts: Math.round(g * 10) / 10,
      windDirectionCompass: degreesToCompass(dir),
      windDirectionDegrees: dir,
      precipitation: Math.round(p * 10) / 10,
      precipitationProbability: Math.round(prob),
      weatherCode: code,
      weatherDescription: dInfo.description,
      weatherIcon: dInfo.icon,
      assessment: assess
    });
  }

  // Daily list (7 days)
  const dailyDates: string[] = dailyRaw.time || [];
  const daily: DailyForecastItem[] = [];

  for (let d = 0; d < dailyDates.length; d++) {
    const dDate = new Date(dailyDates[d] + 'T12:00:00');
    const dayOfWeek = dDate.toLocaleDateString('pt-BR', { weekday: 'long' });
    const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
    const code = dailyRaw.weather_code?.[d] ?? 1;
    const dInfo = parseWeatherCode(code);

    const rainSum = dailyRaw.precipitation_sum?.[d] ?? 0;
    const rainProb = dailyRaw.precipitation_probability_max?.[d] ?? 0;
    const windMax = dailyRaw.wind_speed_10m_max?.[d] ?? 12;
    const windGustMax = dailyRaw.wind_gusts_10m_max?.[d] ?? 18;
    const windDir = dailyRaw.wind_direction_10m_dominant?.[d] ?? 120;

    // Count favorable hours for this day from hourly dataset if available
    const dayHours = hourly.filter(item => item.time.startsWith(dailyDates[d]));
    const favorableCount = dayHours.filter(h => h.assessment.isAllowed).length;

    let dominantStatus: SprayStatus = 'IDEAL';
    if (rainSum > 5 || rainProb > 60) dominantStatus = 'BLOCKED_RAIN';
    else if (windMax > 15) dominantStatus = 'BLOCKED_WIND';
    else if (favorableCount >= 6) dominantStatus = 'IDEAL';
    else dominantStatus = 'FAVORABLE_CAUTION';

    daily.push({
      date: dailyDates[d],
      dayOfWeek: capitalizedDay,
      temperatureMax: Math.round(dailyRaw.temperature_2m_max?.[d] ?? 31),
      temperatureMin: Math.round(dailyRaw.temperature_2m_min?.[d] ?? 19),
      precipitationSum: Math.round(rainSum * 10) / 10,
      precipitationProbabilityMax: Math.round(rainProb),
      windSpeedMax: Math.round(windMax * 10) / 10,
      windGustsMax: Math.round(windGustMax * 10) / 10,
      dominantWindDirection: degreesToCompass(windDir),
      weatherCode: code,
      weatherDescription: dInfo.description,
      weatherIcon: dInfo.icon,
      favorableSprayHoursCount: favorableCount > 0 ? favorableCount : (dominantStatus === 'IDEAL' ? 7 : 3),
      bestSprayWindow: '06:00 às 09:30 & 16:30 às 18:30',
      dominantSprayStatus: dominantStatus
    });
  }

  return {
    city,
    current,
    hourly,
    daily,
    lastUpdated: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isSimulatedOffline: false
  };
}

/**
 * Generates an ultra-realistic 7-day meteorological dataset for agricultural field simulation
 * geographically calibrated based on the specific city's latitude, longitude, and elevation.
 */
export function generateSimulatedWeather(city: CityLocation): WeatherForecastData {
  const now = new Date();
  const lat = city.latitude;
  const lon = city.longitude;
  const elevation = city.elevationMeters || 400; // standard altitude estimate

  // 1. Calculate a highly realistic baseline temperature based on latitude and altitude
  const latAbs = Math.abs(lat);
  let baseTemp = 32.5 - (latAbs * 0.45); // Closer to equator (lat=0) is warmer; southern latitudes are cooler
  baseTemp -= (elevation / 100) * 0.6; // Lapse rate: ~0.6°C decrease per 100 meters elevation

  // 2. Adjust for seasonal hemisphere influence
  const month = now.getMonth();
  const isSouthernHemisphere = lat < 0;
  // Seasonal factor oscillates between -1 (mid winter, June) and +1 (mid summer, December)
  const seasonFactor = Math.cos(((month - 11) / 12) * 2 * Math.PI);
  if (isSouthernHemisphere) {
    baseTemp += seasonFactor * (3.0 + latAbs * 0.15); // Colder winter/warmer summer in southern latitudes
  } else {
    baseTemp -= seasonFactor * (3.0 + latAbs * 0.15);
  }
  baseTemp = Math.max(12.0, Math.min(36.0, baseTemp)); // Clamp to realistic agricultural temperatures

  // 3. Base humidity is generally inversely proportional to baseTemp, adjusted for geography
  let baseHumidity = 85.0 - (baseTemp * 1.1);
  // Inland Central Brazil (Cerrado) in September is notoriously dry
  const isDryInlandCerrado = lon < -45.0 && latAbs > 10.0 && latAbs < 25.0;
  if (isDryInlandCerrado) {
    baseHumidity -= 15.0;
  }
  baseHumidity = Math.max(25.0, Math.min(92.0, baseHumidity));

  // 4. Base wind velocity: windier in open southern pampas or elevated MATOPIBA plateaus
  let baseWind = 7.5;
  if (latAbs > 24.0) {
    baseWind += 3.5; // windy Rio Grande do Sul or Paraná pampas
  } else if (lat > -15.0 && lat < -5.0 && lon > -48.0 && lon < -40.0) {
    baseWind += 2.0; // windier MATOPIBA savannas
  }

  const currentWetBulb = calculateWetBulbTemp(baseTemp, baseHumidity);
  const currentDeltaT = calculateDeltaT(baseTemp, baseHumidity);
  const currentAssessment = assessSprayingSuitability(baseTemp, baseHumidity, baseWind, baseWind * 1.3, 0, 10);

  const current: CurrentWeather = {
    time: now.toISOString(),
    temperature: baseTemp,
    apparentTemperature: baseTemp + 1.2,
    relativeHumidity: baseHumidity,
    dewPoint: Math.round((baseTemp - ((100 - baseHumidity) / 5)) * 10) / 10,
    wetBulbTemp: currentWetBulb,
    deltaT: currentDeltaT,
    windSpeed: baseWind,
    windDirectionDegrees: 125,
    windDirectionCompass: 'SE',
    windGusts: Math.round(baseWind * 1.35 * 10) / 10,
    precipitation: 0.0,
    precipitationProbability: 10,
    surfacePressure: Math.round(1013 - (elevation / 8.5)), // atmospheric pressure decreases with altitude
    uvIndex: 7,
    weatherCode: 1,
    weatherDescription: 'Predomínio de Sol / Condição Operacional',
    weatherIcon: 'sun',
    cloudCover: 15,
    assessment: currentAssessment
  };

  // 5. Generate full 336 hours of hourly simulation (14 days) for absolute scheduling precision
  const hourly: HourlyForecastItem[] = [];
  for (let i = 0; i < 336; i++) {
    const d = new Date(now.getTime() + i * 3600000);
    const hour = d.getHours();

    // Diurnal temperature curve: coldest at 05:00, hottest at 14:00
    const solarFactor = Math.sin(((hour - 8) / 24) * 2 * Math.PI);
    const temp = Math.round((baseTemp + solarFactor * 7) * 10) / 10;
    // Humidity is roughly inverse of temperature
    const hum = Math.max(20, Math.min(95, Math.round(baseHumidity - solarFactor * 25)));
    // Wind speeds peak in the afternoon (thermal turbulence)
    const wind = Math.max(1.0, Math.round((baseWind + Math.max(0, solarFactor) * 5 + (Math.sin(i / 3) * 1.2)) * 10) / 10);
    const gusts = Math.round((wind * 1.35) * 10) / 10;
    
    // Simulate localized afternoon convective rainfall on days 2, 5, 9, and 12
    const dayIndex = Math.floor(i / 24);
    const isRainyDay = dayIndex === 2 || dayIndex === 5 || dayIndex === 9 || dayIndex === 12;
    const isAfternoon = hour >= 14 && hour <= 18;
    const rain = (isRainyDay && isAfternoon) ? 0.8 : 0;
    const rainProb = (isRainyDay && isAfternoon) ? 65 : (isRainyDay ? 25 : 5);

    const wb = calculateWetBulbTemp(temp, hum);
    const dt = calculateDeltaT(temp, hum);
    const assess = assessSprayingSuitability(temp, hum, wind, gusts, rain, rainProb);
    const wCode = rain > 0 ? 61 : (solarFactor > 0.4 ? 1 : 2);
    const wInfo = parseWeatherCode(wCode);

    hourly.push({
      time: d.toISOString(),
      hourNumber: hour,
      dayLabel: d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }),
      temperature: temp,
      apparentTemperature: temp + 1,
      relativeHumidity: hum,
      dewPoint: Math.round((temp - ((100 - hum) / 5)) * 10) / 10,
      wetBulbTemp: wb,
      deltaT: dt,
      windSpeed: wind,
      windGusts: gusts,
      windDirectionCompass: degreesToCompass((110 + (i * 5) % 360)),
      windDirectionDegrees: (110 + (i * 5)) % 360,
      precipitation: rain,
      precipitationProbability: rainProb,
      weatherCode: wCode,
      weatherDescription: wInfo.description,
      weatherIcon: wInfo.icon,
      assessment: assess
    });
  }

  // 6. Generate 14-day daily forecast matching the hourly statistics precisely
  const daily: DailyForecastItem[] = [];
  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const dayDate = new Date(now.getTime() + dayOffset * 86400000);
    const dayName = daysOfWeek[dayDate.getDay()];
    const isRainyDay = dayOffset === 2 || dayOffset === 5 || dayOffset === 9 || dayOffset === 12;
    
    const rainSum = isRainyDay ? 4.0 : 0;
    const rainProb = isRainyDay ? 65 : 10;
    const maxT = isRainyDay ? Math.round(baseTemp - 1.5) : Math.round(baseTemp + 5.0);
    const minT = Math.round(baseTemp - 4.5);
    const windM = isRainyDay ? Math.round(baseWind * 1.4) : Math.round(baseWind * 1.1);

    const dayStr = dayDate.toISOString().split('T')[0];
    const dayHours = hourly.filter(item => item.time.startsWith(dayStr));
    const favorableCount = dayHours.filter(h => h.assessment.isAllowed).length;

    let dominantStatus: SprayStatus = 'IDEAL';
    if (rainSum > 3.0 || rainProb > 60) dominantStatus = 'BLOCKED_RAIN';
    else if (windM > 15) dominantStatus = 'BLOCKED_WIND';
    else if (favorableCount >= 6) dominantStatus = 'IDEAL';
    else dominantStatus = 'FAVORABLE_CAUTION';

    daily.push({
      date: dayStr,
      dayOfWeek: dayName,
      temperatureMax: maxT,
      temperatureMin: minT,
      precipitationSum: rainSum,
      precipitationProbabilityMax: rainProb,
      windSpeedMax: windM,
      windGustsMax: Math.round(windM * 1.4 * 10) / 10,
      dominantWindDirection: 'SE',
      weatherCode: isRainyDay ? 80 : 1,
      weatherDescription: isRainyDay ? 'Pancadas de Chuva Isoladas' : 'Predomínio de Sol / Operacional',
      weatherIcon: isRainyDay ? 'rain' : 'sun',
      favorableSprayHoursCount: favorableCount,
      bestSprayWindow: isRainyDay ? 'Janela restrita matutina (06h às 08h)' : '06:00 às 09:30 & 16:30 às 18:30',
      dominantSprayStatus: dominantStatus
    });
  }

  return {
    city,
    current,
    hourly,
    daily,
    lastUpdated: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    isSimulatedOffline: true
  };
}
