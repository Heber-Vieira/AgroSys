/**
 * Spray Window Meteorological Feasibility Checker for Scheduling
 * Validates scheduled time slots against psychrometric Delta T, wind velocity,
 * and precipitation probability for the specific farm municipality.
 */

import { 
  CityLocation, 
  POPULAR_AGRO_CITIES, 
  fetchWeatherForecast, 
  WeatherForecastData,
  HourlyForecastItem,
  SprayAssessment
} from './weatherService';
import { resolveCityLocation } from './brazilCitiesService';

export interface WeatherFeasibilityCheck {
  city: CityLocation;
  scheduledDate: string;
  scheduledTime: string;
  hourSelected: number;
  isAllowed: boolean;
  score: number;
  status: string;
  title: string;
  description: string;
  temperature: number;
  relativeHumidity: number;
  windSpeed: number;
  windGusts: number;
  deltaT: number;
  precipitationProbability: number;
  driftRiskLevel: string;
  evaporationRiskLevel: string;
  recommendedDropletSize: string;
  recommendedNozzle: string;
  recommendedAdjuvant: string;
  isForecastFound: boolean;
  alternativeWindows: {
    time: string;
    hour: number;
    deltaT: number;
    windSpeed: number;
    status: string;
    isIdeal: boolean;
  }[];
}

/**
 * Finds a matching city from our IBGE / agricultural database or returns default
 */
export function resolveCityForPlot(cityNameOrState?: string): CityLocation {
  return resolveCityLocation(cityNameOrState);
}

/**
 * Checks weather viability for a specific date and time in a given city
 */
export async function assessScheduleWeather(
  city: CityLocation,
  dateStr: string, // YYYY-MM-DD
  timeStr: string  // HH:mm (e.g. '07:30')
): Promise<WeatherFeasibilityCheck> {
  const forecast: WeatherForecastData = await fetchWeatherForecast(city);

  const [hoursStr] = timeStr.split(':');
  const targetHour = parseInt(hoursStr || '7', 10);

  // Search in hourly forecast
  // Format in hourly time is either 'YYYY-MM-DDTHH:00' or 'HH:00'
  const matchingHourItem = forecast.hourly.find(item => {
    // Check if time string has date part
    if (item.time.includes('T')) {
      const [itemDate, itemTime] = item.time.split('T');
      const itemHour = parseInt(itemTime.split(':')[0] || '0', 10);
      return itemDate === dateStr && itemHour === targetHour;
    }
    // Fallback to hourNumber if available
    return item.hourNumber === targetHour;
  }) || forecast.hourly[targetHour] || forecast.hourly[0];

  const assessment: SprayAssessment = matchingHourItem?.assessment || forecast.current.assessment;

  // Find alternative golden windows on that day
  const dayItems = forecast.hourly.filter(item => {
    if (item.time.includes('T')) {
      return item.time.startsWith(dateStr);
    }
    return true;
  });

  const alternativeWindows = dayItems
    .filter(item => item.assessment.isAllowed && (item.hourNumber >= 6 && item.hourNumber <= 18))
    .slice(0, 4)
    .map(item => ({
      time: `${String(item.hourNumber).padStart(2, '0')}:00`,
      hour: item.hourNumber,
      deltaT: item.deltaT,
      windSpeed: item.windSpeed,
      status: item.assessment.title,
      isIdeal: item.assessment.status === 'IDEAL',
    }));

  return {
    city,
    scheduledDate: dateStr,
    scheduledTime: timeStr,
    hourSelected: targetHour,
    isAllowed: assessment.isAllowed,
    score: assessment.score,
    status: assessment.status,
    title: assessment.title,
    description: assessment.description,
    temperature: matchingHourItem?.temperature ?? forecast.current.temperature,
    relativeHumidity: matchingHourItem?.relativeHumidity ?? forecast.current.relativeHumidity,
    windSpeed: matchingHourItem?.windSpeed ?? forecast.current.windSpeed,
    windGusts: matchingHourItem?.windGusts ?? forecast.current.windGusts,
    deltaT: matchingHourItem?.deltaT ?? forecast.current.deltaT,
    precipitationProbability: matchingHourItem?.precipitationProbability ?? forecast.current.precipitationProbability,
    driftRiskLevel: assessment.driftRiskLevel,
    evaporationRiskLevel: assessment.evaporationRiskLevel,
    recommendedDropletSize: assessment.recommendedDropletSize,
    recommendedNozzle: assessment.recommendedNozzle,
    recommendedAdjuvant: assessment.recommendedAdjuvant,
    isForecastFound: Boolean(matchingHourItem),
    alternativeWindows,
  };
}
