import React, { useState, useMemo } from 'react';
import { 
  CHEMICAL_LEAFLETS_DATABASE, 
  ChemicalLeaflet, 
  searchChemicalLeaflets 
} from '../data/chemicalLeafletsData';
import { 
  Search, 
  BookOpen, 
  Sparkles, 
  Check, 
  X, 
  Layers, 
  ShieldCheck, 
  Eye, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  FlaskConical,
  Building2,
  Droplets
} from 'lucide-react';

interface ChemicalBulaSelectorProps {
  selectedLeafletId: string;
  onSelectLeaflet: (leaflet: ChemicalLeaflet) => void;
  onClearSelection?: () => void;
  onOpenLeafletModal?: (leaflet: ChemicalLeaflet) => void;
}

export const ChemicalBulaSelector: React.FC<ChemicalBulaSelectorProps> = ({
  selectedLeafletId,
  onSelectLeaflet,
  onClearSelection,
  onOpenLeafletModal,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Categories list with counts
  const categories = [
    { id: 'ALL', label: 'Todos', count: CHEMICAL_LEAFLETS_DATABASE.length },
    { id: 'FUNGICIDE', label: 'Fungicidas', count: CHEMICAL_LEAFLETS_DATABASE.filter(l => l.category === 'FUNGICIDE').length },
    { id: 'HERBICIDE', label: 'Herbicidas', count: CHEMICAL_LEAFLETS_DATABASE.filter(l => l.category === 'HERBICIDE').length },
    { id: 'INSECTICIDE', label: 'Inseticidas', count: CHEMICAL_LEAFLETS_DATABASE.filter(l => l.category === 'INSECTICIDE' || l.category === 'ACARICIDE' || l.category === 'NEMATICIDE').length },
    { id: 'ADJUVANT', label: 'Adjuvantes', count: CHEMICAL_LEAFLETS_DATABASE.filter(l => l.category === 'ADJUVANT').length },
    { id: 'BIOLOGICAL', label: 'Biológicos', count: CHEMICAL_LEAFLETS_DATABASE.filter(l => l.category === 'BIOLOGICAL').length },
    { id: 'FOLIAR_FERT', label: 'Nutrição', count: CHEMICAL_LEAFLETS_DATABASE.filter(l => l.category === 'FOLIAR_FERT').length },
  ];

  // Currently selected leaflet object
  const currentSelectedLeaflet = useMemo(() => {
    if (!selectedLeafletId) return null;
    return CHEMICAL_LEAFLETS_DATABASE.find(l => l.id === selectedLeafletId) || null;
  }, [selectedLeafletId]);

  // Filtered search results
  const filteredLeaflets = useMemo(() => {
    return searchChemicalLeaflets(searchTerm, selectedCategory, 'ALL');
  }, [searchTerm, selectedCategory]);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'FUNGICIDE': return { label: 'Fungicida', bg: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' };
      case 'INSECTICIDE': return { label: 'Inseticida', bg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' };
      case 'HERBICIDE': return { label: 'Herbicida', bg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' };
      case 'ADJUVANT': return { label: 'Adjuvante', bg: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30' };
      case 'BIOLOGICAL': return { label: 'Biológico', bg: 'bg-emerald-600/20 text-emerald-900 dark:text-emerald-200 border-emerald-600/40' };
      case 'FOLIAR_FERT': return { label: 'Nutrição', bg: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30' };
      default: return { label: cat, bg: 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-500/30' };
    }
  };

  return (
    <div className="rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/50 border border-emerald-300/80 dark:border-emerald-700/80 p-3.5 space-y-2.5 transition-all">
      {/* Header & Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-100">
            Importar Dados Oficiais da Bula MAPA:
          </span>
        </div>
        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          {CHEMICAL_LEAFLETS_DATABASE.length} bulas homologadas
        </span>
      </div>

      {/* Selected Product Card (if one is chosen) */}
      {currentSelectedLeaflet ? (
        <div className="p-2.5 rounded-xl bg-white dark:bg-[#041c14] border border-emerald-400/80 dark:border-emerald-600/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-fade-in">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs text-emerald-950 dark:text-white truncate">
                  {currentSelectedLeaflet.commercialName}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${getCategoryBadge(currentSelectedLeaflet.category).bg}`}>
                  {getCategoryBadge(currentSelectedLeaflet.category).label}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                  WALES #{currentSelectedLeaflet.walesMixOrder} ({currentSelectedLeaflet.formulationType})
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate">
                {currentSelectedLeaflet.activeIngredientConcentration} • <span className="font-medium text-emerald-700 dark:text-emerald-400">{currentSelectedLeaflet.mapaRegistration}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            {onOpenLeafletModal && (
              <button
                type="button"
                onClick={() => onOpenLeafletModal(currentSelectedLeaflet)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1 cursor-pointer transition-colors"
                title="Visualizar ficha técnica e recomendações da bula"
              >
                <Eye className="w-3 h-3" />
                <span>Ver Bula</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsDropdownOpen(true);
                if (onClearSelection) onClearSelection();
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Trocar Produto</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Search Input and Filter Bar */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400" />
          <input
            type="text"
            placeholder="🔍 Buscar produto, princípio ativo ou alvo (ex: glifosato, fox, amargoso)..."
            value={searchTerm}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(true);
            }}
            className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl pl-8.5 pr-8 py-2 text-xs font-semibold text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
          />
          {searchTerm ? (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-emerald-700 dark:text-emerald-300 cursor-pointer"
            >
              {isDropdownOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px]">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setIsDropdownOpen(true);
              }}
              className={`px-2 py-0.5 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 shadow-2xs'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Dropdown Options List */}
        {isDropdownOpen && (
          <div className="mt-1 max-h-56 overflow-y-auto rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 shadow-xl divide-y divide-emerald-100/80 dark:divide-emerald-900/80 z-20">
            {filteredLeaflets.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-600 dark:text-slate-300">
                Nenhum defensivo ou produto encontrado para &quot;{searchTerm}&quot;.
              </div>
            ) : (
              filteredLeaflets.map((leaflet) => {
                const isSelected = leaflet.id === selectedLeafletId;
                const badge = getCategoryBadge(leaflet.category);

                return (
                  <div
                    key={leaflet.id}
                    className={`p-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/80 transition-colors flex items-center justify-between gap-2.5 cursor-pointer ${
                      isSelected ? 'bg-emerald-100/80 dark:bg-emerald-900' : ''
                    }`}
                    onClick={() => {
                      onSelectLeaflet(leaflet);
                      setIsDropdownOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-black text-xs text-emerald-950 dark:text-white">
                          {leaflet.commercialName}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${badge.bg}`}>
                          {badge.label}
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                          {leaflet.formulationType} (WALES #{leaflet.walesMixOrder})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-200 truncate">
                        <span className="font-semibold text-emerald-800 dark:text-emerald-300">{leaflet.activeIngredient}</span> • Dose Drone: <span className="font-bold text-emerald-950 dark:text-emerald-100">{leaflet.defaultDosePerHa} {leaflet.defaultDoseUnit}</span>
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                        <span>{leaflet.manufacturer}</span>
                        <span>•</span>
                        <span>{leaflet.mapaRegistration}</span>
                        <span>•</span>
                        <span>Alvo: {leaflet.targets[0]?.pestName}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {onOpenLeafletModal && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLeafletModal(leaflet);
                          }}
                          className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-800 cursor-pointer"
                          title="Ver Detalhes da Bula"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLeaflet(leaflet);
                          setIsDropdownOpen(false);
                          setSearchTerm('');
                        }}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Preencher</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};
