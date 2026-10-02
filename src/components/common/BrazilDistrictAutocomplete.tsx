import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  searchBrazilDistricts, 
  fetchAllIbgeDistricts,
  fetchDistrictsForCity,
  BrazilDistrict,
  BRAZIL_STATES 
} from '../../services/brazilCitiesService';
import { Landmark, ChevronDown, Check, Loader2, X, Search, MapPin, Globe } from 'lucide-react';

interface BrazilDistrictAutocompleteProps {
  cityState?: string; // e.g. "Rio Verde - GO" or "Resende Costa - MG"
  value: string; // e.g. "Jacarandira" or "Distrito Sede"
  onChange: (districtName: string, districtObj?: BrazilDistrict) => void;
  onSelectCity?: (cityFullName: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  helperText?: string;
}

export const BrazilDistrictAutocomplete: React.FC<BrazilDistrictAutocompleteProps> = ({
  cityState = '',
  value,
  onChange,
  onSelectCity,
  label = 'Distrito Municipal (Cadastro IBGE)',
  placeholder = 'Digite ou busque o distrito (ex: Jacarandira, Sede)...',
  required = false,
  className = '',
  disabled = false,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(value || '');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [results, setResults] = useState<BrazilDistrict[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scopeNationwide, setScopeNationwide] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal search input with incoming prop value
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Pre-load all Brazilian districts on mount
  useEffect(() => {
    fetchAllIbgeDistricts();
  }, []);

  // When cityState changes, reset nationwide scope to focus on city's districts
  useEffect(() => {
    setScopeNationwide(false);
  }, [cityState]);

  // Load districts when searchTerm, cityState, state filter, or scope changes
  useEffect(() => {
    let isMounted = true;

    const loadDistricts = async () => {
      setIsLoading(true);
      try {
        const targetCity = scopeNationwide ? undefined : cityState;
        const matches = await searchBrazilDistricts(searchTerm, targetCity, selectedState);
        if (isMounted) {
          setResults(matches);
        }
      } catch (e) {
        console.error('Error fetching Brazilian districts:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(loadDistricts, 100);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, cityState, selectedState, scopeNationwide]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (district: BrazilDistrict) => {
    setSearchTerm(district.name);
    onChange(district.name, district);
    if (district.cityFullName && onSelectCity) {
      onSelectCity(district.cityFullName);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(true);
  };

  const isCityScoped = Boolean(cityState && !scopeNationwide);

  return (
    <div ref={wrapperRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <Landmark className="w-4 h-4 absolute left-3 text-teal-600 dark:text-teal-400 flex-shrink-0 pointer-events-none" />

        <input
          type="text"
          value={searchTerm}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin mr-1" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              title="Limpar distrito"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{helperText}</p>
      )}

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-72 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header State & Scope Filter Bar */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Search className="w-3 h-3 text-teal-600" />
                {isCityScoped ? `Distritos de ${cityState}:` : 'Distritos do Brasil:'}
              </span>
              {cityState && (
                <button
                  type="button"
                  onClick={() => setScopeNationwide(!scopeNationwide)}
                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Globe className="w-2.5 h-2.5" />
                  {scopeNationwide ? 'Focar no Município' : 'Buscar no Brasil todo'}
                </button>
              )}
            </div>

            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setScopeNationwide(true);
              }}
              className="px-2 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="ALL">🇧🇷 Todos os Estados</option>
              {BRAZIL_STATES.map(st => (
                <option key={st.uf} value={st.uf}>{st.uf}</option>
              ))}
            </select>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2 text-teal-600 font-medium">
                    <Loader2 className="w-4 h-4 animate-spin" /> Buscando nos 10.750+ distritos do IBGE...
                  </div>
                ) : (
                  <>
                    Nenhum distrito oficial do IBGE listado para "{searchTerm}".
                    <br />
                    <span className="text-[10px] text-slate-500 mt-1 block font-medium">
                      Você pode salvar o nome do distrito customizado digitando diretamente no campo acima.
                    </span>
                  </>
                )}
              </div>
            ) : (
              results.map((district) => {
                const isSelected = value?.toLowerCase() === district.name.toLowerCase();

                return (
                  <button
                    key={district.id + '-' + district.cityFullName}
                    type="button"
                    onClick={() => handleSelect(district)}
                    className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-950 dark:text-teal-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                        {district.state}
                      </div>
                      <div className="truncate">
                        <span className="block font-bold truncate text-slate-900 dark:text-white">
                          {district.name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal block truncate flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-slate-400 flex-shrink-0" />
                          Município: <strong className="text-teal-700 dark:text-teal-300 font-semibold">{district.cityName} - {district.state}</strong>
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer IBGE District Badge */}
          <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center font-medium">
            Base Completa de todos os ~10.750+ Distritos Brasileiros do IBGE
          </div>
        </div>
      )}
    </div>
  );
};

