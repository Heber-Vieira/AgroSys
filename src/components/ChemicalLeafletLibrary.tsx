import React, { useState, useMemo, useEffect } from 'react';
import { 
  CHEMICAL_LEAFLETS_DATABASE, 
  ChemicalLeaflet, 
  searchChemicalLeaflets 
} from '../data/chemicalLeafletsData';
import { 
  Search, 
  Filter, 
  Sparkles, 
  FileText, 
  Layers, 
  FlaskConical, 
  CheckCircle2, 
  Plus, 
  Eye, 
  AlertCircle, 
  ShieldCheck, 
  ChevronRight, 
  Building2, 
  Grid,
  List,
  Check,
  Droplets,
  HelpCircle,
  ExternalLink,
  User,
  Plane,
} from 'lucide-react';
import { AgriDroneIcon } from './icons/AgriDroneIcon';
import { SprayProduct } from '../types';

interface ChemicalLeafletLibraryProps {
  currentProducts: SprayProduct[];
  onSelectLeaflet: (leaflet: ChemicalLeaflet) => void;
  onAddToSprayMix: (leaflet: ChemicalLeaflet) => void;
  selectedCrop?: string;
}

export const ChemicalLeafletLibrary: React.FC<ChemicalLeafletLibraryProps> = ({
  currentProducts,
  onSelectLeaflet,
  onAddToSprayMix,
  selectedCrop,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>(selectedCrop || 'ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedFormulation, setSelectedFormulation] = useState<string>('ALL');

  // Sync selectedCrop prop with selectedCropFilter state when prop changes
  useEffect(() => {
    if (selectedCrop) {
      setSelectedCropFilter(selectedCrop);
    }
  }, [selectedCrop]);

  // Categories list
  const categories = [
    { id: 'ALL', label: 'Todos os Produtos', count: CHEMICAL_LEAFLETS_DATABASE.length },
    { id: 'FUNGICIDE', label: 'Fungicidas', count: CHEMICAL_LEAFLETS_DATABASE.filter(i => i.category === 'FUNGICIDE').length },
    { id: 'INSECTICIDE', label: 'Inseticidas & Acaricidas', count: CHEMICAL_LEAFLETS_DATABASE.filter(i => i.category === 'INSECTICIDE' || i.category === 'ACARICIDE' || i.category === 'NEMATICIDE').length },
    { id: 'HERBICIDE', label: 'Herbicidas', count: CHEMICAL_LEAFLETS_DATABASE.filter(i => i.category === 'HERBICIDE').length },
    { id: 'ADJUVANT', label: 'Adjuvantes & Óleos', count: CHEMICAL_LEAFLETS_DATABASE.filter(i => i.category === 'ADJUVANT').length },
    { id: 'BIOLOGICAL', label: 'Biológicos & Biorracionais', count: CHEMICAL_LEAFLETS_DATABASE.filter(i => i.category === 'BIOLOGICAL').length },
    { id: 'FOLIAR_FERT', label: 'Nutrição Foliar', count: CHEMICAL_LEAFLETS_DATABASE.filter(i => i.category === 'FOLIAR_FERT').length },
  ];

  // Crops list
  const crops = ['ALL', 'Soja', 'Milho', 'Algodão', 'Cana-de-açúcar', 'Café', 'Pastagem', 'Feijão', 'Trigo'];

  // Formulations list
  const formulations = ['ALL', 'WG', 'WP', 'SC', 'EC', 'SL', 'LÍQUIDO'];

  // Filtered Leaflets
  const filteredLeaflets = useMemo(() => {
    let list = searchChemicalLeaflets(searchQuery, selectedCategory, selectedCropFilter);
    if (selectedFormulation !== 'ALL') {
      list = list.filter(item => item.formulationType === selectedFormulation);
    }
    return list;
  }, [searchQuery, selectedCategory, selectedCropFilter, selectedFormulation]);

  // Check if a product is already added in current mix
  const isProductInMix = (leaflet: ChemicalLeaflet) => {
    return currentProducts.some(p => 
      p.name.toLowerCase().includes(leaflet.commercialName.toLowerCase()) ||
      leaflet.commercialName.toLowerCase().includes(p.name.toLowerCase())
    );
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'FUNGICIDE': return 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30';
      case 'INSECTICIDE': return 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30';
      case 'HERBICIDE': return 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/30';
      case 'ADJUVANT': return 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border-teal-500/30';
      case 'BIOLOGICAL': return 'bg-emerald-600/15 text-emerald-900 dark:text-emerald-200 border-emerald-600/30';
      case 'FOLIAR_FERT': return 'bg-purple-500/10 text-purple-800 dark:text-purple-300 border-purple-500/30';
      default: return 'bg-slate-500/10 text-slate-800 dark:text-slate-300 border-slate-500/30';
    }
  };

  const translateCategory = (cat: string) => {
    switch (cat) {
      case 'FUNGICIDE': return 'Fungicida';
      case 'INSECTICIDE': return 'Inseticida';
      case 'HERBICIDE': return 'Herbicida';
      case 'ADJUVANT': return 'Adjuvante';
      case 'BIOLOGICAL': return 'Biológico';
      case 'FOLIAR_FERT': return 'Nutrição Foliar';
      case 'ACARICIDE': return 'Acaricida';
      case 'NEMATICIDE': return 'Nematicida';
      default: return cat;
    }
  };

  return (
    <div className="space-y-5">
      {/* Banner / Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-100 via-white to-teal-50 dark:from-[#063b28] dark:via-[#0b4d35] dark:to-[#072c1e] text-emerald-950 dark:text-white border border-emerald-300 dark:border-emerald-600/40 shadow-xl relative overflow-hidden transition-colors">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white dark:bg-emerald-400/20 dark:text-emerald-200 border border-emerald-600 dark:border-emerald-400/30 text-[11px] font-black uppercase tracking-wider">
                Compêndio Oficial de Defensivos & Bulas MAPA
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white dark:bg-amber-400/20 dark:text-amber-200 border border-amber-600 dark:border-amber-400/30 text-[11px] font-bold">
                Drone UBV / BV Ready
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-950 dark:text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-300" />
              Bulas Técnicas de Produtos Químicos & Sincronização de Calda
            </h2>
            <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-100/90 leading-relaxed">
              Consulte a bula completa com registro MAPA, princípios ativos, faixas toxicológicas, doses calibradas para drone, faixas ótimas de pH, carência (PHI), e sincronize os produtos diretamente na ordem WALES de preparo da sua calda.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/30 border border-emerald-200 dark:border-white/10 text-center transition-colors">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-200 block uppercase">Bulas Cadastradas</span>
              <strong className="text-xl font-black text-emerald-950 dark:text-white">{CHEMICAL_LEAFLETS_DATABASE.length}</strong>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-100/80 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-400/30 text-center transition-colors">
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-200 block uppercase">Na Calda Atual</span>
              <strong className="text-xl font-black text-emerald-600 dark:text-emerald-300">{currentProducts.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#07251a] border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-4">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome comercial (ex: Fox Xpro, Elatus, Ampligo), princípio ativo, praga, fabricante ou registro MAPA..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 self-end sm:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'grid' 
                  ? 'bg-white dark:bg-emerald-800 text-emerald-600 dark:text-white shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Visualização em Grade de Cartões"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                viewMode === 'table' 
                  ? 'bg-white dark:bg-emerald-800 text-emerald-600 dark:text-white shadow-2xs font-bold' 
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
              }`}
              title="Visualização em Tabela Comparativa"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-50 dark:bg-[#051c14] text-slate-700 dark:text-slate-300 border border-emerald-200/60 dark:border-emerald-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-emerald-900 text-slate-700 dark:text-emerald-200'}`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Secondary Filters: Crop & Formulation */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-100 dark:border-emerald-800/60 text-xs">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-600" />
            Filtrar Cultura:
          </span>
          {crops.map(c => (
            <button
              key={c}
              onClick={() => setSelectedCropFilter(c)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                selectedCropFilter === c
                  ? 'bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-400 font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-950'
              }`}
            >
              {c === 'ALL' ? 'Todas as Culturas' : c}
            </button>
          ))}

          <div className="h-4 w-px bg-emerald-200 dark:border-emerald-800 mx-1 hidden sm:block"></div>

          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            Formulação:
          </span>
          {formulations.map(f => (
            <button
              key={f}
              onClick={() => setSelectedFormulation(f)}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-mono transition-all cursor-pointer ${
                selectedFormulation === f
                  ? 'bg-teal-600 text-white font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-950'
              }`}
            >
              {f === 'ALL' ? 'Todas' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count & Quick Status */}
      <div className="flex items-center justify-between text-xs px-1 text-slate-600 dark:text-slate-400">
        <span>Mostrando <strong>{filteredLeaflets.length}</strong> produtos registrados compatíveis</span>
        <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Clique em <strong>➕ Adicionar à Calda</strong> para auto-sincronizar dose e ordem WALES
        </span>
      </div>

      {/* GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeaflets.map((leaflet) => {
            const inMix = isProductInMix(leaflet);
            const catColor = getCategoryColor(leaflet.category);

            return (
              <div 
                key={leaflet.id}
                className={`p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#072a1e] border transition-all flex flex-col justify-between group hover:shadow-md relative overflow-hidden min-h-[140px] ${
                  inMix 
                    ? 'border-emerald-400 dark:border-emerald-500 shadow-sm ring-1 ring-emerald-400/30' 
                    : 'border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-400'
                }`}
              >
                {/* Top strip for toxicological color */}
                <div 
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: leaflet.toxicologicalColorHex }}
                />

                <div className="space-y-2 pt-1">
                  {/* Category & WALES Step badges */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${catColor} leading-none`}>
                      {translateCategory(leaflet.category)}
                    </span>
                    
                    <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 leading-none" title={`Ordem WALES: ${leaflet.walesStageName}`}>
                      WALES #{leaflet.walesMixOrder} • {leaflet.formulationType}
                    </span>
                  </div>

                  {/* Commercial Name & Active Ingredient */}
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 dark:text-white group-hover:text-emerald-600 transition-colors flex items-center justify-between leading-tight">
                      <span className="truncate pr-2">{leaflet.commercialName}</span>
                      {inMix && (
                        <span title="Adicionado na Calda">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        </span>
                      )}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                      {leaflet.activeIngredientConcentration}
                    </p>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400/80 block mt-0.5 truncate">
                      {leaflet.manufacturer} • MAPA: {leaflet.mapaRegistration}
                    </span>
                  </div>

                  {/* Compact Targets & Drone Dose */}
                  {leaflet.targets.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-emerald-50 dark:border-emerald-900/30">
                      {leaflet.targets.slice(0, 1).map((t, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                          <span className="truncate pr-1 text-slate-600 dark:text-slate-400" title={t.pestName}>🎯 {t.pestName}</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">{t.doseDrone}</span>
                        </div>
                      ))}
                      {leaflet.targets.length > 1 && (
                        <span className="text-[9px] text-slate-400 dark:text-slate-500 block mt-0.5 leading-none">
                          + {leaflet.targets.length - 1} outro(s) alvo(s)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Compact Quick Specs */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 mt-0.5 border-t border-emerald-50 dark:border-emerald-900/30 text-[10px] text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1" title="pH ideal da calda">
                      <Droplets className="w-3 h-3 text-emerald-500/70" />
                      pH: <strong className="text-emerald-800 dark:text-emerald-200">{leaflet.phWaterOptimalRange.min}-{leaflet.phWaterOptimalRange.max}</strong>
                    </span>
                    <span className="flex items-center gap-1" title="Volume recomendado para drone">
                      <AgriDroneIcon className="w-3 h-3 text-emerald-500/70" />
                      <strong className="text-emerald-800 dark:text-emerald-200">{leaflet.droneGuidelines.minVolumeLHa}-{leaflet.droneGuidelines.maxVolumeLHa} L/ha</strong>
                    </span>
                  </div>
                </div>

                {/* Minimal Card Actions Footer */}
                <div className="pt-2.5 mt-2 border-t border-emerald-100/60 dark:border-emerald-800/40 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectLeaflet(leaflet)}
                    className="flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3 h-3 text-emerald-600/70" />
                    <span>Resumo</span>
                  </button>

                  <button
                    onClick={() => onAddToSprayMix(leaflet)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs ${
                      inMix 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 hover:bg-emerald-200' 
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    <Plus className="w-3 h-3" />
                    <span>{inMix ? '+ Dose' : 'Calda'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-3xl bg-white dark:bg-[#07251a] border border-emerald-200 dark:border-emerald-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-emerald-50/80 dark:bg-[#051c14] border-b border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200 font-black">
                <tr>
                  <th className="p-3.5">Produto & Registro</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Princípio Ativo & Formulação</th>
                  <th className="p-3.5">Ordem WALES</th>
                  <th className="p-3.5">Dose Padrão Drone</th>
                  <th className="p-3.5">pH da Água</th>
                  <th className="p-3.5">Carência (Soja)</th>
                  <th className="p-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-100 dark:divide-emerald-800/60">
                {filteredLeaflets.map((leaflet) => {
                  const inMix = isProductInMix(leaflet);
                  return (
                    <tr key={leaflet.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-colors">
                      <td className="p-3.5">
                        <strong className="text-xs text-slate-900 dark:text-white block font-black">{leaflet.commercialName}</strong>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{leaflet.mapaRegistration} • {leaflet.manufacturer}</span>
                      </td>
                      <td className="p-3.5">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${getCategoryColor(leaflet.category)}`}>
                          {translateCategory(leaflet.category)}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs text-slate-800 dark:text-slate-200 block">{leaflet.activeIngredientConcentration}</span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Formulação: {leaflet.formulationType}</span>
                      </td>
                      <td className="p-3.5">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          Etapa #{leaflet.walesMixOrder}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <strong className="text-xs text-emerald-700 dark:text-emerald-300 font-black">{leaflet.defaultDosePerHa} {leaflet.defaultDoseUnit}</strong>
                      </td>
                      <td className="p-3.5 font-semibold text-slate-700 dark:text-slate-300">
                        {leaflet.phWaterOptimalRange.min} - {leaflet.phWaterOptimalRange.max}
                      </td>
                      <td className="p-3.5 text-slate-700 dark:text-slate-300">
                        {leaflet.safetyPreHarvestIntervalDays.Soja ?? '-'} dias
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onSelectLeaflet(leaflet)}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-emerald-900/60 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 transition-colors cursor-pointer"
                            title="Ver Bula Completa"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onAddToSprayMix(leaflet)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>{inMix ? '+ Dose' : 'Sincronizar'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
