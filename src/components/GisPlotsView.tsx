import React, { useState } from 'react';
import { FarmPlot, UserProfile } from '../types';
import { 
  MapPin, 
  Layers, 
  Compass, 
  UploadCloud, 
  Info, 
  CheckCircle2, 
  Eye, 
  EyeOff, 
  FileText,
  Activity,
  Plus,
  Edit2,
  X,
  Save,
  Building
} from 'lucide-react';
import { BrazilCityAutocomplete } from './common/BrazilCityAutocomplete';
import { formatHectares, formatDecimal } from '../utils/formatters';

interface GisPlotsViewProps {
  currentUser: UserProfile;
  plots: FarmPlot[];
  setPlots: React.Dispatch<React.SetStateAction<FarmPlot[]>>;
  onSelectPlotForOS: (plot: FarmPlot) => void;
}

export const GisPlotsView: React.FC<GisPlotsViewProps> = ({
  currentUser,
  plots,
  setPlots,
  onSelectPlotForOS,
}) => {
  const [selectedPlot, setSelectedPlot] = useState<FarmPlot>(plots[0]);
  const [showNdviLayer, setShowNdviLayer] = useState<boolean>(true);
  const [importedNotice, setImportedNotice] = useState<string | null>(null);

  const [showNewPlotModal, setShowNewPlotModal] = useState<boolean>(false);
  const [newPlotName, setNewPlotName] = useState<string>('Talhão 15 - Safrinha');
  const [newFarmName, setNewFarmName] = useState<string>('Fazenda Boa Esperança');
  const [newClientName, setNewClientName] = useState<string>(currentUser.name || 'Produtor Rural');
  const [newCrop, setNewCrop] = useState<'Soja' | 'Milho' | 'Algodão' | 'Cana-de-açúcar' | 'Pastagem' | 'Café'>('Soja');
  const [newHectares, setNewHectares] = useState<number>(55.0);
  const [newCityState, setNewCityState] = useState<string>('Sorriso - MT');

  const handleUpdatePlotCity = (updatedCityState: string) => {
    const updated = plots.map(p => {
      if (p.id === selectedPlot.id) {
        return { ...p, cityState: updatedCityState };
      }
      return p;
    });
    setPlots(updated);
    setSelectedPlot({ ...selectedPlot, cityState: updatedCityState });
  };

  const handleCreatePlot = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlot: FarmPlot = {
      id: `plot-${Date.now()}`,
      farmId: `farm-${Date.now()}`,
      farmName: newFarmName,
      clientName: newClientName,
      name: newPlotName,
      crop: newCrop,
      season: 'Safra 2025/2026',
      phenologicalStage: 'V3 (Vegetativo Inicial)',
      hectares: Number(newHectares) || 40,
      terrain: 'FLAT_GRAINS',
      slopeDegrees: 2.0,
      cityState: newCityState,
      healthIndexNDVI: 0.76,
      coordinates: [
        [-17.7800, -50.9200],
        [-17.7750, -50.9150],
        [-17.7830, -50.9100],
        [-17.7880, -50.9180],
      ],
    };

    setPlots([newPlot, ...plots]);
    setSelectedPlot(newPlot);
    setShowNewPlotModal(false);
    setImportedNotice(`Talhão "${newPlot.name}" cadastrado em ${newCityState} com sucesso!`);
    setTimeout(() => setImportedNotice(null), 5000);
  };

  // SVG representation coordinates map
  const plotSvgs: Record<string, { points: string; center: [number, number]; color: string }> = {
    'plot-1': {
      points: '80,60 260,80 240,240 60,210',
      center: [160, 150],
      color: '#16a34a',
    },
    'plot-2': {
      points: '290,70 460,95 440,230 270,215',
      center: [365, 155],
      color: '#ca8a04',
    },
    'plot-3': {
      points: '70,270 240,280 220,440 50,420',
      center: [145, 350],
      color: '#0284c7',
    },
    'plot-4': {
      points: '270,265 470,285 450,450 250,430',
      center: [360, 360],
      color: '#9333ea',
    },
  };

  const handleSimulateKmlUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newPlot: FarmPlot = {
        id: `plot-${Date.now()}`,
        farmId: 'farm-nova',
        farmName: 'Fazenda Santa Fé - Setor Norte',
        clientName: currentUser.name,
        name: `Talhão KML - ${file.name.replace(/\.[^/.]+$/, '')}`,
        crop: 'Soja',
        season: 'Safra 2025/2026',
        phenologicalStage: 'V4 (Vegetativo)',
        hectares: 54.2,
        terrain: 'FLAT_GRAINS',
        slopeDegrees: 1.8,
        healthIndexNDVI: 0.74,
        coordinates: [
          [-17.7710, -50.9150],
          [-17.7680, -50.9090],
          [-17.7750, -50.9050],
          [-17.7790, -50.9120],
        ],
      };

      setPlots([newPlot, ...plots]);
      setSelectedPlot(newPlot);
      setImportedNotice(`Polígono "${file.name}" importado e vetorizado via PostGIS com sucesso! (54.2 ha calculados)`);
      setTimeout(() => setImportedNotice(null), 5000);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-2xs shrink-0">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
                Mapeamento GIS & Talhões
              </h1>
              <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Georreferenciamento WGS84, vigor vegetativo (NDVI) e importação KML/Shapefile.
              </p>
            </div>
          </div>
        </div>

        {/* Import KML simulator & New Plot Button */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowNewPlotModal(true)}
            className="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Talhão</span>
          </button>

          <label className="px-3 py-1.5 rounded-lg font-bold bg-white dark:bg-emerald-950 hover:bg-emerald-50 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 text-xs shadow-2xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5">
            <UploadCloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>Importar KML/SHP</span>
            <input
              type="file"
              accept=".kml,.kmz,.geojson,.shp"
              onChange={handleSimulateKmlUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {importedNotice && (
        <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center gap-2 text-xs text-emerald-950 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{importedNotice}</span>
        </div>
      )}

      {/* Main Map View & Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Map Canvas (SVG Vectorizer) */}
        <div className="lg:col-span-2 bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs flex flex-col space-y-3">
          {/* Map Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-xs">Camadas:</span>
              <button
                onClick={() => setShowNdviLayer(!showNdviLayer)}
                className={`px-2.5 py-1 rounded-lg font-bold border transition-colors flex items-center gap-1.5 cursor-pointer text-xs ${
                  showNdviLayer
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                }`}
              >
                {showNdviLayer ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                Índice NDVI (Vigor)
              </button>
            </div>

            <div className="flex items-center gap-2 text-emerald-700/70 dark:text-emerald-400/70 font-mono text-[10px]">
              <span>SRID: 4326 (WGS 84)</span>
              <span>•</span>
              <span>PostGIS 3.3+</span>
            </div>
          </div>

          {/* Interactive SVG Plot Visualizer */}
          <div className="relative w-full aspect-4/3 bg-[#041c14] rounded-xl overflow-hidden border border-emerald-900/60 flex items-center justify-center">
            {/* Background Grid simulation */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b_1px,transparent_1px),linear-gradient(to_bottom,#064e3b_1px,transparent_1px)] bg-[size:20px_20px] opacity-40" />

            <svg viewBox="0 0 540 480" className="w-full h-full relative z-10">
              <defs>
                <pattern id="grain-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <path d="M 0 10 L 10 0 M 0 0 L 10 10" stroke="#065f46" strokeWidth="0.5" />
                </pattern>
              </defs>

              {plots.map((plot) => {
                const svgConfig = plotSvgs[plot.id] || {
                  points: '150,150 350,160 330,320 130,300',
                  center: [240, 230],
                  color: '#10b981',
                };
                const isSelected = selectedPlot.id === plot.id;

                // Color calculation based on NDVI layer
                const fillColor = showNdviLayer
                  ? plot.healthIndexNDVI >= 0.75
                    ? '#15803d'
                    : plot.healthIndexNDVI >= 0.60
                    ? '#ca8a04'
                    : '#dc2626'
                  : svgConfig.color;

                return (
                  <g
                    key={plot.id}
                    onClick={() => setSelectedPlot(plot)}
                    className="cursor-pointer transition-all"
                  >
                    <polygon
                      points={svgConfig.points}
                      fill={fillColor}
                      fillOpacity={isSelected ? 0.75 : 0.45}
                      stroke={isSelected ? '#34d399' : '#ffffff'}
                      strokeWidth={isSelected ? 3 : 1.5}
                      strokeDasharray={isSelected ? '6,3' : 'none'}
                      className="hover:fill-opacity-85 transition-all"
                    />

                    {/* Plot Label */}
                    <text
                      x={svgConfig.center[0]}
                      y={svgConfig.center[1] - 8}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="bold"
                      className="pointer-events-none drop-shadow-md"
                    >
                      {plot.name.split('-')[0]}
                    </text>
                    <text
                      x={svgConfig.center[0]}
                      y={svgConfig.center[1] + 10}
                      textAnchor="middle"
                      fill="#d1fae5"
                      fontSize="10"
                      fontWeight="600"
                      className="pointer-events-none drop-shadow-md"
                    >
                      {plot.crop} ({formatHectares(plot.hectares)})
                    </text>
                  </g>
                );
              })}

              {/* North Arrow */}
              <g transform="translate(500, 40)">
                <circle cx="0" cy="0" r="14" fill="#041c14" stroke="#065f46" strokeWidth="1" />
                <path d="M 0 -10 L 4 3 L -4 3 Z" fill="#10b981" />
                <path d="M 0 10 L 4 3 L -4 3 Z" fill="#6ee7b7" />
                <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="bold">N</text>
              </g>
            </svg>

            {/* Floating NDVI Legend */}
            {showNdviLayer && (
              <div className="absolute bottom-2 left-2 bg-[#041c14]/90 backdrop-blur-md border border-emerald-800 px-2.5 py-1.5 rounded-lg text-[9px] text-white flex items-center gap-2">
                <span className="font-bold text-emerald-300">NDVI:</span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                  &gt; 0,75 (Alto)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                  0,60 - 0,74 (Médio)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" />
                  &lt; 0,60 (Atenção)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Selected Plot Detail Card */}
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
          <div className="border-b border-emerald-200/60 dark:border-emerald-800/60 pb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              Talhão Selecionado
            </span>
            <h3 className="text-base font-black text-emerald-950 dark:text-white mt-0.5">
              {selectedPlot.name}
            </h3>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              {selectedPlot.farmName} • Produtor: {selectedPlot.clientName}
            </p>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800">
              <span className="text-emerald-700/70 dark:text-emerald-400/70 text-[10px] block font-semibold">Área Calculada</span>
              <span className="text-sm font-black text-emerald-950 dark:text-white">
                {formatHectares(selectedPlot.hectares)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800">
              <span className="text-emerald-700/70 dark:text-emerald-400/70 text-[10px] block font-semibold">Cultura Atual</span>
              <span className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                {selectedPlot.crop}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800">
              <span className="text-emerald-700/70 dark:text-emerald-400/70 text-[10px] block font-semibold">Estágio</span>
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-[11px] truncate block">
                {selectedPlot.phenologicalStage}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800">
              <span className="text-emerald-700/70 dark:text-emerald-400/70 text-[10px] block font-semibold">Declividade</span>
              <span className="font-bold text-emerald-950 dark:text-emerald-200 text-[11px]">
                {formatDecimal(selectedPlot.slopeDegrees, 1)}° ({selectedPlot.terrain === 'STEEP_SLOPE' ? 'Encosta' : 'Plano'})
              </span>
            </div>
          </div>

          {/* Vigor NDVI */}
          <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-emerald-950 dark:text-emerald-300 text-xs">
                Índice Vegetativo (NDVI)
              </span>
              <span className="font-black text-emerald-800 dark:text-emerald-400 text-xs">
                {formatDecimal(selectedPlot.healthIndexNDVI, 2)}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-emerald-200 dark:bg-emerald-900 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${selectedPlot.healthIndexNDVI * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
              Área em ótimo desenvolvimento fisiológico. Recomendada aplicação de fungicida preventivo.
            </p>
          </div>

          {/* Município e UF de Referência do Talhão */}
          <div className="p-2.5 rounded-xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800">
            <BrazilCityAutocomplete
              label="Município de Referência"
              value={selectedPlot.cityState || 'Rio Verde - GO'}
              onChange={(cityStateStr) => handleUpdatePlotCity(cityStateStr)}
              helperText="Usado nas previsões meteorológicas das OS deste talhão."
            />
          </div>

          {/* Action button */}
          <button
            onClick={() => onSelectPlotForOS(selectedPlot)}
            className="w-full py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar OS para este Talhão</span>
          </button>
        </div>
      </div>

      {/* MODAL: Cadastrar Novo Talhão */}
      {showNewPlotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Cadastrar Novo Talhão Agrícola
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sincronização com dados do Produtor e Cidade de Referência
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewPlotModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlot} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Fazenda / Propriedade
                </label>
                <input
                  type="text"
                  required
                  value={newFarmName}
                  onChange={(e) => setNewFarmName(e.target.value)}
                  placeholder="Ex: Fazenda Boa Esperança"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome / Identificação do Talhão
                </label>
                <input
                  type="text"
                  required
                  value={newPlotName}
                  onChange={(e) => setNewPlotName(e.target.value)}
                  placeholder="Ex: Talhão 08 - Pivô Central"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cultura
                  </label>
                  <select
                    value={newCrop}
                    onChange={(e: any) => setNewCrop(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                  >
                    <option value="Soja">Soja</option>
                    <option value="Milho">Milho</option>
                    <option value="Algodão">Algodão</option>
                    <option value="Cana-de-açúcar">Cana-de-açúcar</option>
                    <option value="Pastagem">Pastagem</option>
                    <option value="Café">Café</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Área Total (Hectares)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={newHectares || ''}
                    placeholder="0"
                    onChange={(e) => setNewHectares(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* IBGE Automatic City & UF Selector */}
              <div>
                <BrazilCityAutocomplete
                  label="Município e UF (Localização do Talhão)"
                  value={newCityState}
                  onChange={(cityStateStr) => setNewCityState(cityStateStr)}
                  required
                  helperText="Define a cidade para busca meteorológica e prevenção de deriva nesta propriedade."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewPlotModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Salvar Talhão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
