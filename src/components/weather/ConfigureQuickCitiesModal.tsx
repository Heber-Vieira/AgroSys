import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Loader2, Plus, Trash2, CheckCircle2, Settings } from 'lucide-react';
import { CityLocation, searchCities, POPULAR_AGRO_CITIES } from '../../services/weatherService';
import { showToast } from '../../services/notificationService';

interface ConfigureQuickCitiesModalProps {
  initialCities: CityLocation[];
  onSave: (cities: CityLocation[]) => void;
  onClose: () => void;
}

export const ConfigureQuickCitiesModal: React.FC<ConfigureQuickCitiesModalProps> = ({
  initialCities,
  onSave,
  onClose
}) => {
  const [currentCities, setCurrentCities] = useState<CityLocation[]>(initialCities);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CityLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchCities(query);
        setSearchResults(results);
      } catch (err) {
        console.error('Failed to search cities:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleAddCity = (city: CityLocation) => {
    // Check if already exists
    if (currentCities.some(c => c.id === city.id || (c.latitude === city.latitude && c.longitude === city.longitude))) {
      showToast('Esta cidade já está na sua lista de polos.', 'warning');
      return;
    }
    
    setCurrentCities(prev => [...prev, city]);
    setQuery('');
    setShowDropdown(false);
  };

  const handleRemoveCity = (cityId: string) => {
    setCurrentCities(prev => prev.filter(c => c.id !== cityId));
  };

  const handleRestoreDefaults = () => {
    setCurrentCities(POPULAR_AGRO_CITIES.slice(0, 10)); // maybe top 10 to not clutter
    showToast('Lista restaurada para os padrões do sistema.', 'info');
  };

  const handleSave = () => {
    if (currentCities.length === 0) {
      showToast('Adicione pelo menos um polo rápido.', 'warning');
      return;
    }
    onSave(currentCities);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-visible flex flex-col my-auto max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Configurar Polos Rápidos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Escolha as cidades que aparecerão na barra de acesso rápido.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Search to add */}
          <div className="space-y-2 relative" ref={dropdownRef}>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Adicionar Nova Cidade
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Busque por cidade, estado ou pólo agrícola..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              {isSearching && (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin absolute right-3.5 top-3" />
              )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (query.trim() !== '') && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95">
                {searchResults.length === 0 && !isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
                    Nenhuma cidade encontrada para "{query}".
                  </div>
                ) : (
                  searchResults.map(city => (
                    <button
                      key={city.id}
                      onClick={() => handleAddCity(city)}
                      className="w-full text-left p-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 dark:text-white">
                          {city.name} <span className="opacity-70 text-xs font-normal">({city.state})</span>
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {city.country} {city.elevationMeters ? `• ${city.elevationMeters}m alt` : ''}
                        </div>
                      </div>
                      <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus className="w-4 h-4" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Current List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Seus Polos ({currentCities.length})
              </label>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Restaurar Padrões
              </button>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              {currentCities.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  Nenhum polo configurado. Busque e adicione acima.
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-700/80">
                  {currentCities.map(city => (
                    <div key={city.id} className="p-3 flex items-center justify-between hover:bg-white dark:hover:bg-slate-800 transition-colors">
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {city.name} <span className="opacity-70 text-xs font-normal">({city.state})</span>
                          </div>
                          {city.region && (
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              {city.region}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCity(city.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Salvar Polos
          </button>
        </div>
      </div>
    </div>
  );
};
