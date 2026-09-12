import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Navigation, Mountain, Wheat, Check, Loader2, Sparkles } from 'lucide-react';
import { CityLocation, POPULAR_AGRO_CITIES, searchCities } from '../../services/weatherService';
import { FarmPlot } from '../../types';

import { showToast } from '../../services/notificationService';

interface WeatherCitySelectorProps {
  selectedCity: CityLocation;
  onSelectCity: (city: CityLocation) => void;
  farmPlots?: FarmPlot[];
  isLoading?: boolean;
}

export const WeatherCitySelector: React.FC<WeatherCitySelectorProps> = ({
  selectedCity,
  onSelectCity,
  farmPlots = [],
  isLoading = false
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<CityLocation[]>(POPULAR_AGRO_CITIES);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingGPS, setIsLocatingGPS] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults(POPULAR_AGRO_CITIES);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchCities(query);
        setSearchResults(res);
      } catch {
        setSearchResults(POPULAR_AGRO_CITIES);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle GPS Geolocation
  const handleUseGPS = () => {
    if (!navigator.geolocation) {
      showToast('Geolocalização não suportada no seu navegador.', 'warning', 'GPS Indisponível');
      return;
    }

    setIsLocatingGPS(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        
        let gpsCityName = '';
        let gpsState = 'Campo (GPS)';
        let resolvedElevation: number | undefined = undefined;

        // 1. Try BigDataCloud Reverse Geocoding API (Fast, Free, CORS-friendly, has detailed subdivision info)
        try {
          const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=pt`;
          const res = await fetch(bdcUrl, { signal: AbortSignal.timeout(3500) });
          if (res.ok) {
            const data = await res.json();
            if (data.city || data.locality) {
              gpsCityName = data.city || data.locality;
            }
            if (data.principalSubdivisionCode) {
              const match = data.principalSubdivisionCode.match(/BR-([A-Z]{2})/);
              if (match) {
                gpsState = match[1];
              } else if (data.principalSubdivision) {
                gpsState = data.principalSubdivision;
              }
            }
          }
        } catch (err) {
          console.warn('BigDataCloud reverse geocoding failed, trying Nominatim...', err);
        }

        // 2. Fallback to Nominatim if BigDataCloud did not yield a city name
        if (!gpsCityName) {
          try {
            const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
            const res = await fetch(nominatimUrl, {
              headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' },
              signal: AbortSignal.timeout(3500)
            });
            if (res.ok) {
              const data = await res.json();
              const addr = data.address || {};
              gpsCityName = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || addr.suburb || '';
              if (addr.state) {
                gpsState = addr.state;
              }
            }
          } catch (err) {
            console.warn('Nominatim reverse geocoding failed:', err);
          }
        }

        // 3. Fallback: Calculate the nearest preset agricultural pole using the Haversine formula
        // This makes sure we always have a high-precision, completely local name resolution fallback!
        let nearestPresetCity = POPULAR_AGRO_CITIES[0];
        let minDistance = Infinity;

        for (const city of POPULAR_AGRO_CITIES) {
          const r = 6371; // Earth's radius in km
          const dLat = (city.latitude - lat) * Math.PI / 180;
          const dLon = (city.longitude - lon) * Math.PI / 180;
          const a = 
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(city.latitude * Math.PI / 180) * 
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const distance = r * c;

          if (distance < minDistance) {
            minDistance = distance;
            nearestPresetCity = city;
          }
        }

        if (!gpsCityName) {
          if (minDistance < 2.0) {
            gpsCityName = nearestPresetCity.name;
            gpsState = nearestPresetCity.state;
          } else {
            gpsCityName = `Próximo a ${nearestPresetCity.name}`;
            gpsState = nearestPresetCity.state;
          }
          resolvedElevation = nearestPresetCity.elevationMeters;
        }

        const gpsCity: CityLocation = {
          id: `gps-${lat.toFixed(4)}-${lon.toFixed(4)}`,
          name: gpsCityName,
          state: gpsState.length === 2 ? gpsState : 'GPS',
          country: 'Brasil',
          latitude: lat,
          longitude: lon,
          elevationMeters: resolvedElevation || nearestPresetCity.elevationMeters || 600,
          region: `Coordenadas GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`
        };

        onSelectCity(gpsCity);
        setIsOpen(false);
        setIsLocatingGPS(false);
      },
      (err) => {
        console.warn('GPS capturing failed or permission blocked:', err);
        setIsLocatingGPS(false);
        onSelectCity(POPULAR_AGRO_CITIES[0]); // fallback to first popular city
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      {/* Top Search Bar & Action Buttons */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Input Search Container */}
        <div className="relative flex-1">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-emerald-700 dark:text-emerald-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Buscar cidade, município agrícola ou fazenda (ex: Sorriso, Rio Verde, Cascavel, LEM...)"
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700 text-sm font-semibold text-emerald-950 dark:text-emerald-50 placeholder:text-emerald-700/60 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-xs"
            />
            {isSearching && (
              <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3.5" />
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700 rounded-2xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto space-y-1 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-800/80 dark:text-emerald-400/80 flex items-center justify-between border-b border-emerald-100 dark:border-emerald-800/60">
                <span>Cidades e Polos Agropecuários</span>
                <span className="font-mono text-[9px]">{searchResults.length} encontrados</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-emerald-800/70 dark:text-emerald-400/70">
                  Nenhuma cidade encontrada para "{query}". Tente buscar por nome de município ou estado.
                </div>
              ) : (
                searchResults.map((city) => {
                  const isSelected = (selectedCity?.name || '').toLowerCase() === (city?.name || '').toLowerCase() && 
                                     (selectedCity?.state || '').toLowerCase() === (city?.state || '').toLowerCase();
                  return (
                    <button
                      key={city.id || `${city.latitude}-${city.longitude}`}
                      onClick={() => {
                        onSelectCity(city);
                        setQuery('');
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                        isSelected 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/50 text-emerald-950 dark:text-emerald-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MapPin className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                        <div className="min-w-0">
                          <div className="text-xs font-bold truncate">
                            {city.name} {city.state && <span className="opacity-80 font-mono">({city.state})</span>}
                          </div>
                          <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-emerald-800/70 dark:text-emerald-400/70'}`}>
                            {city.region || city.country} {city.elevationMeters ? `• ${city.elevationMeters}m alt.` : ''}
                            {city.mainCrops && ` • Culturas: ${city.mainCrops.slice(0, 2).join(', ')}`}
                          </div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* GPS Quick Action */}
        <button
          onClick={handleUseGPS}
          disabled={isLocatingGPS}
          className="px-3.5 py-2.5 rounded-2xl bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/80 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs shrink-0"
          title="Detectar cidade e coordenadas do dispositivo via GPS"
        >
          {isLocatingGPS ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
          ) : (
            <Navigation className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          )}
          <span>{isLocatingGPS ? 'Localizando GPS...' : 'Usar Meu GPS'}</span>
        </button>
      </div>

      {/* Quick Select Agricultural Hub Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800/80 dark:text-emerald-400/80 shrink-0 mr-1 flex items-center gap-1">
          <Wheat className="w-3 h-3" />
          <span>Polos Rápidos:</span>
        </span>
        {POPULAR_AGRO_CITIES.map((city) => {
          const isSelected = (selectedCity?.name || '') === city.name;
          return (
            <button
              key={city.id}
              onClick={() => onSelectCity(city)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs font-extrabold'
                  : 'bg-white dark:bg-[#072a1e] text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60'
              }`}
            >
              {city.name} ({city.state})
            </button>
          );
        })}
      </div>

      {/* Selected City Details Badge Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-emerald-100/50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-black text-emerald-950 dark:text-white text-sm truncate">
                {selectedCity.name}, {selectedCity.state}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-bold">
                {selectedCity.country}
              </span>
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="font-mono">Lat: {selectedCity.latitude.toFixed(4).replace('.', ',')}° / Lon: {selectedCity.longitude.toFixed(4).replace('.', ',')}°</span>
              {selectedCity.elevationMeters && (
                <span className="flex items-center gap-1">
                  <Mountain className="w-3 h-3 text-emerald-600" />
                  {selectedCity.elevationMeters}m altitude
                </span>
              )}
              {selectedCity.region && <span>• {selectedCity.region}</span>}
            </p>
          </div>
        </div>

        {selectedCity.mainCrops && selectedCity.mainCrops.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 font-semibold">Culturas Predominantes:</span>
            {selectedCity.mainCrops.map((c) => (
              <span key={c} className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white dark:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
