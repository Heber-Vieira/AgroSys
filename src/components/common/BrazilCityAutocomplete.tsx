import React, { useState, useEffect, useRef } from 'react';
import { 
  searchBrazilCities, 
  fetchAllIbgeMunicipalities, 
  BrazilCity, 
  BRAZIL_STATES 
} from '../../services/brazilCitiesService';
import { Search, MapPin, ChevronDown, Check, Loader2, X } from 'lucide-react';

interface BrazilCityAutocompleteProps {
  value: string; // e.g. "Rio Verde - GO" or "Sorriso - MT"
  onChange: (cityState: string, cityObj?: BrazilCity) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
  helperText?: string;
}

export const BrazilCityAutocomplete: React.FC<BrazilCityAutocompleteProps> = ({
  value,
  onChange,
  label = 'Município e UF',
  placeholder = 'Digite o nome da cidade (ex: Rio Verde, Sorriso, Cascavel)...',
  required = false,
  className = '',
  disabled = false,
  helperText,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>(value || '');
  const [selectedState, setSelectedState] = useState<string>('ALL');
  const [results, setResults] = useState<BrazilCity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal search input with incoming prop value
  useEffect(() => {
    setSearchTerm(value || '');
  }, [value]);

  // Load IBGE background list on component mount
  useEffect(() => {
    fetchAllIbgeMunicipalities();
  }, []);

  // Perform city search when search term or state filter changes
  useEffect(() => {
    let isMounted = true;

    const performSearch = async () => {
      setIsLoading(true);
      try {
        const matches = await searchBrazilCities(searchTerm, selectedState);
        if (isMounted) {
          setResults(matches);
        }
      } catch (e) {
        console.error('Error searching Brazilian cities:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const timer = setTimeout(performSearch, 150);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchTerm, selectedState]);

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

  const handleSelect = (city: BrazilCity) => {
    setSearchTerm(city.fullName);
    onChange(city.fullName, city);
    setIsOpen(false);
  };

  const handleClear = () => {
    setSearchTerm('');
    onChange('');
    setIsOpen(true);
  };

  return (
    <div ref={wrapperRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 absolute left-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0 pointer-events-none" />

        <input
          type="text"
          value={searchTerm}
          disabled={disabled}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(e.target.value); // Allow typing directly if custom
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-emerald-600 animate-spin mr-1" />
          ) : searchTerm ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              title="Limpar busca"
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
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden max-h-64 flex flex-col animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header State Filter Bar */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Search className="w-3 h-3 text-emerald-600" />
              Filtrar por Estado (UF):
            </span>

            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-300 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">🇧🇷 Todos os 27 Estados</option>
              {BRAZIL_STATES.map(st => (
                <option key={st.uf} value={st.uf}>{st.uf} - {st.name}</option>
              ))}
            </select>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {results.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Nenhum município encontrado para "{searchTerm}".
                <br />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Você pode digitar o nome personalizado se necessário.
                </span>
              </div>
            ) : (
              results.map((city) => {
                const isSelected = value === city.fullName || value?.toLowerCase() === city.name.toLowerCase();

                return (
                  <button
                    key={city.id + '-' + city.state}
                    type="button"
                    onClick={() => handleSelect(city)}
                    className={`w-full px-3 py-2 text-left rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-black text-[10px] flex items-center justify-center flex-shrink-0">
                        {city.state}
                      </div>
                      <div className="truncate">
                        <span className="block font-bold truncate">{city.name}</span>
                        {city.region && (
                          <span className="text-[10px] text-slate-400 font-normal block truncate">
                            {city.region}
                          </span>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer IBGE Badge */}
          <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 text-center font-medium">
            Sincronizado com Base Oficial IBGE de Municípios Brasileiros
          </div>
        </div>
      )}
    </div>
  );
};
