import React, { useState } from 'react';
import { 
  ChemicalLeaflet 
} from '../data/chemicalLeafletsData';
import { 
  X, 
  Droplets, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  FlaskConical, 
  Plane, 
  Info, 
  Layers, 
  FileText, 
  Building2, 
  Clock, 
  Sparkles, 
  Plus, 
  Share2, 
  Copy, 
  Check, 
  HeartHandshake, 
  Recycle, 
  ThermometerSnowflake,
  ExternalLink
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface ChemicalLeafletModalProps {
  leaflet: ChemicalLeaflet | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToSprayMix?: (leaflet: ChemicalLeaflet) => void;
  onAddToMix?: (leaflet: ChemicalLeaflet) => void;
  isAlreadyInMix?: boolean;
  selectedCrop?: string;
}

export const ChemicalLeafletModal: React.FC<ChemicalLeafletModalProps> = ({
  leaflet,
  isOpen,
  onClose,
  onAddToSprayMix,
  onAddToMix,
  isAlreadyInMix = false,
  selectedCrop,
}) => {
  const handleAddAction = onAddToMix || onAddToSprayMix;
  const [activeSection, setActiveSection] = useState<'geral' | 'alvos' | 'drone' | 'wales' | 'seguranca'>('geral');
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);

  if (!isOpen || !leaflet) return null;

  const handleCopySummary = () => {
    const text = `📄 BULA TÉCNICA - ${leaflet.commercialName.toUpperCase()}
• Registro MAPA: ${leaflet.mapaRegistration} (${leaflet.manufacturer})
• Princípio Ativo: ${leaflet.activeIngredientConcentration}
• Grupo Químico: ${leaflet.chemicalGroup}
• Formulação / WALES: ${leaflet.formulationType} (Ordem: ${leaflet.walesMixOrder} - ${leaflet.walesStageName})
• Dose Padrão Drone: ${leaflet.defaultDosePerHa} ${leaflet.defaultDoseUnit}
• pH Ótimo da Água: ${leaflet.phWaterOptimalRange.min} a ${leaflet.phWaterOptimalRange.max}
• Volume Recomendado Drone: ${leaflet.droneGuidelines.minVolumeLHa} a ${leaflet.droneGuidelines.maxVolumeLHa} L/ha
• Carência (Soja/Milho): ${leaflet.safetyPreHarvestIntervalDays.Soja ?? 0} dias (Soja) / ${leaflet.safetyPreHarvestIntervalDays.Milho ?? 0} dias (Milho)
• Classificação: ${leaflet.toxicologicalLabel}
• EPIs: ${leaflet.mandatoryPPE.join(', ')}`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'FUNGICIDE': return { label: 'Fungicida', bg: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30' };
      case 'INSECTICIDE': return { label: 'Inseticida', bg: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30' };
      case 'HERBICIDE': return { label: 'Herbicida', bg: 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border-rose-500/30' };
      case 'ADJUVANT': return { label: 'Adjuvante / Óleo', bg: 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border-teal-500/30' };
      case 'BIOLOGICAL': return { label: 'Biológico', bg: 'bg-emerald-600/20 text-emerald-900 dark:text-emerald-200 border-emerald-600/40' };
      case 'FOLIAR_FERT': return { label: 'Nutrição Foliar', bg: 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/30' };
      case 'ACARICIDE': return { label: 'Acaricida', bg: 'bg-orange-500/15 text-orange-800 dark:text-orange-300 border-orange-500/30' };
      default: return { label: cat, bg: 'bg-slate-500/15 text-slate-800 dark:text-slate-300 border-slate-500/30' };
    }
  };

  const catStyle = getCategoryBadge(leaflet.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-[#07251a] border border-emerald-200 dark:border-emerald-800 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            title="Fechar Bula"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${catStyle.bg} bg-white/20 text-white border-white/30 shadow-2xs`}>
              {catStyle.label}
            </span>
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-black/30 border border-white/20 text-emerald-200">
              Formulação: {leaflet.formulationType}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/40 text-emerald-100">
              WALES: Etapa {leaflet.walesMixOrder}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-300/40 text-amber-100">
              {leaflet.mapaRegistration}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
                <FileText className="w-7 h-7 text-emerald-300" />
                {leaflet.commercialName}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium">
                {leaflet.activeIngredientConcentration} • <span className="text-emerald-300 font-bold">{leaflet.manufacturer}</span>
              </p>
            </div>

            {onAddToSprayMix && (
              <button
                onClick={() => {
                  onAddToSprayMix(leaflet);
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-400 hover:bg-emerald-300 text-emerald-950 shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                title="Inserir este produto na receita de calda atual"
              >
                <Plus className="w-4 h-4" />
                <span>➕ Sincronizar com a Calda</span>
              </button>
            )}
          </div>
        </div>

        {/* Toxicological Band Bar (GHS Standard) */}
        <div 
          className="w-full py-1.5 px-4 text-center text-xs font-black uppercase tracking-wider text-white shadow-inner flex items-center justify-center gap-2"
          style={{ backgroundColor: leaflet.toxicologicalColorHex }}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>{leaflet.toxicologicalLabel} • Meio Ambiente: {leaflet.environmentalHazardClass.replace(/_/g, ' ')}</span>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-emerald-50/80 dark:bg-emerald-950/60 border-b border-emerald-200 dark:border-emerald-800/80 overflow-x-auto text-xs font-bold">
          {[
            { id: 'geral', label: '1. Visão Geral & Físico-Química', icon: FlaskConical },
            { id: 'alvos', label: '2. Alvos & Doses Drone', icon: Info, count: leaflet.targets.length },
            { id: 'drone', label: '3. Parâmetros de Voo & Bicos', icon: Plane },
            { id: 'wales', label: '4. Preparo & Ordem WALES', icon: Layers },
            { id: 'seguranca', label: '5. Carência, EPIs & InpEV', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-black'
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-white text-emerald-800' : 'bg-emerald-200 dark:bg-emerald-800 text-emerald-950 dark:text-emerald-100'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6 text-xs sm:text-sm">
          
          {/* TAB 1: VISÃO GERAL & FÍSICO-QUÍMICA */}
          {activeSection === 'geral' && (
            <div className="space-y-5">
              {/* Highlight Badges */}
              <div className="flex flex-wrap gap-2">
                {leaflet.highlightBadges.map((badge, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 font-bold text-xs flex items-center gap-1.5 shadow-2xs">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    {badge}
                  </span>
                ))}
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Grupo Químico / Mecanismo</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">{leaflet.chemicalGroup}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Registro Oficial MAPA</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">{leaflet.mapaRegistration}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Empresa Titular do Registro</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">{leaflet.manufacturer}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Formulação & Protocolo WALES</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">{leaflet.formulationType} (Etapa {leaflet.walesMixOrder} de adição)</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Faixa Ótima de pH da Água</span>
                  <strong className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">
                    pH {leaflet.phWaterOptimalRange.min} a {leaflet.phWaterOptimalRange.max}
                  </strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200/80 dark:border-emerald-800/80 space-y-1">
                  <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block">Custo Médio Referência</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">
                    {formatBRL(leaflet.averageCostPerUnit)} / {leaflet.defaultDoseUnit.includes('kg') ? 'kg' : 'Litro'}
                  </strong>
                </div>
              </div>

              {/* Water pH note */}
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-start gap-3 text-sky-950 dark:text-sky-200">
                <Droplets className="w-5 h-5 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-xs block text-sky-900 dark:text-sky-300">Nota Físico-Química da Água de Pulverização</span>
                  <p className="text-xs mt-0.5">{leaflet.phWaterOptimalRange.note}</p>
                </div>
              </div>

              {/* Target Crops */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-[#06241a] border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Culturas Registradas e Autorizadas no MAPA
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {leaflet.targetCrops.map((crop, idx) => (
                    <span 
                      key={idx} 
                      className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                        selectedCrop && crop.toLowerCase().includes(selectedCrop.toLowerCase())
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : 'bg-white dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      🌱 {crop}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ALVOS BIOLÓGICOS & DOSAGENS DRONE */}
          {activeSection === 'alvos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-sm text-emerald-950 dark:text-white">
                    Espectro de Ação e Doses Calibradas para Pulverização com Drone
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Dosagens recomendadas por hectare para ultrabaixo volume (UBV / BV).
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {leaflet.targets.map((target, idx) => (
                  <div 
                    key={idx}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 transition-colors space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-sm font-black text-emerald-950 dark:text-white flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          {target.pestName}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-700/80 dark:text-emerald-400 italic">
                          ({target.scientificName})
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold px-3 py-1 rounded-xl bg-emerald-600 text-white shadow-2xs">
                          🎯 Dose Drone: {target.doseDrone}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-emerald-950/50 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900">
                      <strong>Época & Posicionamento:</strong> {target.applicationTiming}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: PARÂMETROS OPERACIONAIS DE DRONE */}
          {activeSection === 'drone' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-900/20 to-teal-900/20 border border-emerald-500/30 space-y-2">
                <h3 className="text-sm font-black text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Diretrizes de Aplicação Aérea Remota (Drone Agrícola)
                </h3>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Parâmetros calibrados para garantir o coeficiente de variação (CV &lt; 15%) e deposição uniforme sem risco de deriva.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Volume de Calda Recomendado</span>
                  <strong className="text-base font-black text-emerald-950 dark:text-white block">
                    {leaflet.droneGuidelines.minVolumeLHa} a {leaflet.droneGuidelines.maxVolumeLHa} Litros / ha
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Excelente performance em ultrabaixo volume (UBV).</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Espectro de Gotas & DMV (VMD)</span>
                  <strong className="text-base font-black text-emerald-950 dark:text-white block">
                    {leaflet.droneGuidelines.recommendedVMD_microns}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Classificação: {leaflet.droneGuidelines.dropletSpectrum}.</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Bicos / Pontas Recomendadas</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">
                    {leaflet.droneGuidelines.nozzleRecommendation}
                  </strong>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Altura de Voo & Faixa Efetiva</span>
                  <strong className="text-xs font-black text-emerald-950 dark:text-white block">
                    {leaflet.droneGuidelines.flightAltitudeM} • Faixa: {leaflet.droneGuidelines.swathWidthM}
                  </strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Velocidade: {leaflet.droneGuidelines.speedMs}</span>
                </div>
              </div>

              {/* Climate Alert for Spraying */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 space-y-1">
                <span className="font-bold text-xs flex items-center gap-1.5 text-amber-900 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Janela Climática e Delta T para Drone
                </span>
                <p className="text-xs">
                  Respeitar a velocidade máxima do vento de <strong>15 km/h (4.2 m/s)</strong>, temperatura abaixo de <strong>32 °C</strong> e umidade relativa do ar acima de <strong>50%</strong> (Delta T entre 2.0 °C e 8.0 °C).
                </p>
              </div>
            </div>
          )}

          {/* TAB 4: PREPARO DA CALDA & PROTOCOLO WALES */}
          {activeSection === 'wales' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-600 text-white space-y-1.5 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full">
                    {leaflet.walesStageName}
                  </span>
                  <span className="text-xs font-black">Ordem de Adição: #{leaflet.walesMixOrder}</span>
                </div>
                <h4 className="text-base font-black">Instrução Operacional no Misturador / Tanque de Apoio</h4>
                <p className="text-xs text-emerald-50">
                  {leaflet.walesStepDescription}
                </p>
              </div>

              {/* Compatibility & Incompatibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Compatibilidade & Sinergias
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 list-disc pl-4">
                    {leaflet.compatibilityNotes.map((note, idx) => (
                      <li key={idx}>{note}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-[#1a0808] border border-rose-200 dark:border-rose-900/60 space-y-2">
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Advertências de Incompatibilidade
                  </span>
                  <ul className="space-y-1.5 text-xs text-rose-900 dark:text-rose-200 list-disc pl-4">
                    {leaflet.incompatibilityWarnings.map((warn, idx) => (
                      <li key={idx}>{warn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CARÊNCIA, SEGURANÇA, EPIS & INPEV */}
          {activeSection === 'seguranca' && (
            <div className="space-y-4">
              {/* Pre-Harvest Interval (PHI / Carência) & REI */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Intervalo de Segurança / Carência (Dias antes da colheita)
                  </span>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {Object.entries(leaflet.safetyPreHarvestIntervalDays).map(([crop, days]) => (
                      <div key={crop} className="p-2.5 rounded-xl bg-white dark:bg-emerald-950/80 border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                        <span className="font-bold text-xs">{crop}:</span>
                        <strong className="text-xs text-emerald-600 dark:text-emerald-400">{days} dias</strong>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Intervalo de Reentrada na Lavoura (REI)
                  </span>
                  <div className="p-4 rounded-xl bg-white dark:bg-emerald-950/80 border border-emerald-100 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 dark:text-slate-400 block">Tempo mínimo sem EPI</span>
                      <strong className="text-base font-black text-emerald-950 dark:text-white">{leaflet.reentryIntervalHours} Horas</strong>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300">
                      NR-31 Exigida
                    </span>
                  </div>
                </div>
              </div>

              {/* Mandatory PPE / EPIs */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#051c14] border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Equipamentos de Proteção Individual Obrigatórios (EPIs - NR-31)
                </span>
                <div className="flex flex-wrap gap-2">
                  {leaflet.mandatoryPPE.map((ppe, idx) => (
                    <span key={idx} className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                      🛡️ {ppe}
                    </span>
                  ))}
                </div>
              </div>

              {/* InpEV Disposal & First Aid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-950 dark:text-teal-200 space-y-1">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-teal-900 dark:text-teal-300">
                    <Recycle className="w-4 h-4 text-teal-600" />
                    Logística Reversa & Tríplice Lavagem (InpEV)
                  </span>
                  <p className="text-xs">{leaflet.emptyContainerDisposal}</p>
                </div>

                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-950 dark:text-rose-200 space-y-1">
                  <span className="text-xs font-bold flex items-center gap-1.5 text-rose-900 dark:text-rose-300">
                    <HeartHandshake className="w-4 h-4 text-rose-600" />
                    Primeiros Socorros & Atendimento de Emergência
                  </span>
                  <p className="text-xs">{leaflet.firstAidGuidelines}</p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions Bar */}
        <div className="p-4 bg-emerald-50/90 dark:bg-[#06241a] border-t border-emerald-200 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={handleCopySummary}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Resumo da Bula Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copiar Ficha Técnica / Bula</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
            >
              Fechar
            </button>

            {handleAddAction && (
              <button
                onClick={() => {
                  handleAddAction(leaflet);
                  onClose();
                }}
                className={`px-5 py-2 rounded-xl text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer ${
                  isAlreadyInMix 
                    ? 'bg-emerald-700 hover:bg-emerald-800 text-white' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {isAlreadyInMix ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>🔄 Atualizar Dados na Calda</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>➕ Sincronizar Produto na Calda</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
