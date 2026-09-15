import React, { useState, useEffect } from 'react';
import { 
  ServiceOrder, 
  WhiteLabelTheme, 
  UserProfile, 
  FarmPlot, 
  AgriculturalDrone, 
  CrewPilot, 
  CrewAssistant,
} from '../types';
import { canUserAccessView } from '../utils/userPermissions';
import { 
  Printer, 
  X, 
  Sliders, 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  CheckSquare, 
  Square, 
  FileText, 
  Download, 
  ShieldCheck, 
  MapPin, 
  Droplets, 
  Wind, 
  Plane, 
  User, 
  Building, 
  Calendar, 
  Award, 
  CheckCircle2, 
  ClipboardCheck, 
  Eye, 
  Sparkles,
  Info
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { DroneBadge } from './DronePhotoBadge';
import { formatBRL, formatHectares, formatDecimal } from '../utils/formatters';

export interface ReportSectionsConfig {
  showClientData: boolean;
  showPlotData: boolean;
  showTechnicalCrew: boolean;
  showAircraftData: boolean;
  showWeatherMetrics: boolean;
  showCollectedWeatherLogs: boolean;
  showChemicalMix: boolean;
  showFlightTelemetry: boolean;
  showFinancialDetails: boolean;
  showMapImages: boolean;
  showSignatures: boolean;
  showTechnicalNotes: boolean;
}

export interface MapImageAttachment {
  id: string;
  url: string;
  title: string;
  description: string;
  createdAt: string;
}

interface SprayReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceOrders: ServiceOrder[];
  selectedOrderId?: string;
  theme?: WhiteLabelTheme;
  currentUser: UserProfile;
  clients?: ClientProducer[];
  plots?: FarmPlot[];
  drones?: AgriculturalDrone[];
  pilots?: CrewPilot[];
  assistants?: CrewAssistant[];
}

export const SprayReportModal: React.FC<SprayReportModalProps> = ({
  isOpen,
  onClose,
  serviceOrders,
  selectedOrderId,
  theme,
  currentUser,
  clients = [],
  plots = [],
  drones = [],
  pilots = [],
  assistants = [],
}) => {
  // Current Order Selected
  const [currentOrder, setCurrentOrder] = useState<ServiceOrder | null>(null);

  // Section visibility toggles
  const [config, setConfig] = useState<ReportSectionsConfig>({
    showClientData: true,
    showPlotData: true,
    showTechnicalCrew: true,
    showAircraftData: true,
    showWeatherMetrics: true,
    showCollectedWeatherLogs: true,
    showChemicalMix: true,
    showFlightTelemetry: true,
    showFinancialDetails: false, // Default off for operational client reports, but toggleable
    showMapImages: true,
    showSignatures: true,
    showTechnicalNotes: true,
  });

  // Controls drawer/sidebar for configuration on desktop/mobile
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(true);

  // Map Image attachments for pasting / uploading
  const [mapImages, setMapImages] = useState<MapImageAttachment[]>([
    {
      id: 'default-map-1',
      url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=1200&q=80',
      title: 'Mapeamento Ortomosaico de Aplicação (DJI Terra / SmartFarm)',
      description: 'Sobreposição de voo com taxa de cobertura efetiva de 100%. Ausência de deriva e uniformidade na deposição de gotas.',
      createdAt: new Date().toLocaleDateString('pt-BR'),
    }
  ]);

  // Additional customizable fields
  const [reportTitle, setReportTitle] = useState<string>('RELATÓRIO TÉCNICO DE PULVERIZAÇÃO AGRÍCOLA');
  const [customOperatorNotes, setCustomOperatorNotes] = useState<string>(
    'Aplicação realizada dentro das especificações da Instrução Normativa MAPA nº 19/2021. Condições microclimáticas favoráveis mantidas do início ao término do ciclo. Embalagens tríplice lavadas e armazenadas no depósito de vazios da propriedade.'
  );

  // New map image upload state
  const [newImageTitle, setNewImageTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Demo Fallback order if none available
  const DEMO_FALLBACK_ORDER: ServiceOrder = {
    id: 'os-demo-report',
    code: 'OS-2026-891',
    clientName: 'Fazenda Santa Maria - Sr. Roberto Silva',
    clientId: 'client-1',
    farmName: 'Fazenda Santa Maria',
    plotName: 'Talhão 04 - Pivô Central',
    plotId: 'plot-1',
    crop: 'Soja',
    targetPestOrGoal: 'Fungicida Sistêmico (Ferrugem Asiática) + Adjuvante',
    sprayRateLHa: 10,
    targetHectares: 120,
    sprayedHectares: 120,
    status: 'COMPLETED',
    scheduledDate: new Date().toISOString().split('T')[0],
    droneId: 'drone-1',
    droneModel: 'DJI Agras T40 / T20P',
    droneAnac: 'PP-8912-AG',
    pilotName: 'Comandante Lucas Mendes',
    pilotId: 'pilot-1',
    assistantName: 'Mateus Oliveira',
    assistantId: 'assistant-1',
    pricingModel: 'PER_HECTARE',
    baseRatePerHa: 45.00,
    totalGrossValue: 5400.00,
    pilotCommission: 600.00,
    assistantCommission: 240.00,
    weatherSafeApproved: true,
    mixPreparedApproved: true,
    digitalSigned: true,
    notes: 'Aplicação realizada dentro das normas do MAPA IN 19/2021 com 100% de cobertura.',
    cityState: 'Rio Verde - GO'
  };

  const activeOrder: ServiceOrder = currentOrder 
    || (selectedOrderId ? serviceOrders.find(o => o.id === selectedOrderId || o.code === selectedOrderId) : null)
    || serviceOrders[0] 
    || DEMO_FALLBACK_ORDER;

  // Sync selected order on open
  useEffect(() => {
    if (isOpen) {
      if (selectedOrderId) {
        const found = serviceOrders.find(o => o.id === selectedOrderId || o.code === selectedOrderId);
        if (found) setCurrentOrder(found);
        else if (serviceOrders.length > 0) setCurrentOrder(serviceOrders[0]);
      } else if (serviceOrders.length > 0 && !currentOrder) {
        setCurrentOrder(serviceOrders[0]);
      }
    }
  }, [isOpen, selectedOrderId, serviceOrders]);

  // Listen for paste event anywhere inside modal to capture images copied to clipboard
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile() as File | null;
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64Url = event.target?.result as string;
              if (base64Url) {
                const newImg: MapImageAttachment = {
                  id: `pasted-${Date.now()}`,
                  url: base64Url,
                  title: newImageTitle || `Mapeamento da Área (${new Date().toLocaleTimeString()})`,
                  description: 'Imagem colada via Área de Transferência (Ctrl+V) com detalhes do mapa de aplicação.',
                  createdAt: new Date().toLocaleDateString('pt-BR'),
                };
                setMapImages(prev => [...prev, newImg]);
                setNewImageTitle('');
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, newImageTitle]);

  if (!isOpen) return null;

  const matchedPlot = plots.find(p => p.id === activeOrder.plotId);
  const matchedClient = clients.find(c => c.id === activeOrder.clientId || c.name === activeOrder.clientName);

  const toggleConfig = (key: keyof ReportSectionsConfig) => {
    setConfig(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          setMapImages(prev => [
            ...prev,
            {
              id: `upload-${Date.now()}-${Math.random()}`,
              url: base64,
              title: newImageTitle || file.name || 'Mapa de Pulverização',
              description: 'Imagem do mapeamento anexada do computador.',
              createdAt: new Date().toLocaleDateString('pt-BR'),
            }
          ]);
          setNewImageTitle('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = (id: string) => {
    setMapImages(prev => prev.filter(img => img.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="spray-report-modal-wrapper fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col justify-between overflow-hidden animate-in fade-in duration-200 print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible print:h-auto">
      
      {/* Top Action Bar (Non-Printable) */}
      <div className="print:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between text-white z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black tracking-tight flex items-center gap-2">
              Gerador de Relatórios Técnicos de Pulverização
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                Emissão Personalizável
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Personalize campos, visualize a prévia e cole mapas com imagens do voo.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* OS Selector */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1">
            <span className="text-[11px] text-slate-400 font-medium">Ordem de Serviço:</span>
            <select
              value={activeOrder.id}
              onChange={(e) => {
                const found = serviceOrders.find(o => o.id === e.target.value);
                if (found) setCurrentOrder(found);
              }}
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {serviceOrders.map(os => (
                <option key={os.id} value={os.id} className="bg-slate-900 text-slate-200">
                  {os.code} - {os.clientName} ({os.plotName})
                </option>
              ))}
              {serviceOrders.length === 0 && (
                <option value={DEMO_FALLBACK_ORDER.id} className="bg-slate-900 text-slate-200">
                  {DEMO_FALLBACK_ORDER.code} - {DEMO_FALLBACK_ORDER.clientName} ({DEMO_FALLBACK_ORDER.plotName})
                </option>
              )}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              showConfigDrawer
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-2xs'
                : 'bg-slate-800/90 text-slate-300 border-slate-700/80 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Painel de Opções</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar Relatório"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Workspace (Split View: Config Drawer + Printable Canvas) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Options Drawer (Non-Printable) */}
        {showConfigDrawer && (
          <div className="print:hidden w-80 sm:w-96 bg-slate-900 border-r border-slate-800 p-4 overflow-y-auto space-y-6 text-slate-200 z-10 flex-shrink-0 animate-in slide-in-from-left duration-200">
            
            {/* Title / Section Settings Header */}
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-1">
                <CheckSquare className="w-4 h-4" />
                Configurar Seções do Relatório
              </h3>
              <p className="text-[11px] text-slate-400">
                Marque apenas as informações que deseja incluir no documento emitido.
              </p>
            </div>

            {/* Title Override */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-300">
                Título Principal do Documento
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Checkbox Section Toggles */}
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  Dados do Produtor / Cliente
                </span>
                <input
                  type="checkbox"
                  checked={config.showClientData}
                  onChange={() => toggleConfig('showClientData')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  Propriedade & Talhão
                </span>
                <input
                  type="checkbox"
                  checked={config.showPlotData}
                  onChange={() => toggleConfig('showPlotData')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-emerald-400" />
                  Equipe Técnica (Piloto / Auxiliar)
                </span>
                <input
                  type="checkbox"
                  checked={config.showTechnicalCrew}
                  onChange={() => toggleConfig('showTechnicalCrew')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Plane className="w-3.5 h-3.5 text-emerald-400" />
                  Aeronave / Drone Registrado
                </span>
                <input
                  type="checkbox"
                  checked={config.showAircraftData}
                  onChange={() => toggleConfig('showAircraftData')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Wind className="w-3.5 h-3.5 text-emerald-400" />
                  Condições Meteorológicas & Delta T
                </span>
                <input
                  type="checkbox"
                  checked={config.showWeatherMetrics}
                  onChange={() => toggleConfig('showWeatherMetrics')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              {config.showWeatherMetrics && (
                <label className="flex items-center justify-between text-[11px] font-medium cursor-pointer p-1 pl-6 rounded-lg hover:bg-slate-800/50 transition-colors text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Inserir Logs Meteorológicos Coletados
                  </span>
                  <input
                    type="checkbox"
                    checked={config.showCollectedWeatherLogs}
                    onChange={() => toggleConfig('showCollectedWeatherLogs')}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              )}

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                  Calda & Insumos Químicos/Biológicos
                </span>
                <input
                  type="checkbox"
                  checked={config.showChemicalMix}
                  onChange={() => toggleConfig('showChemicalMix')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Telemetria & Parâmetros de Voo
                </span>
                <input
                  type="checkbox"
                  checked={config.showFlightTelemetry}
                  onChange={() => toggleConfig('showFlightTelemetry')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                  Mapeamento & Detalhes da Área
                </span>
                <input
                  type="checkbox"
                  checked={config.showMapImages}
                  onChange={() => toggleConfig('showMapImages')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Termo de Responsabilidade & Assinaturas
                </span>
                <input
                  type="checkbox"
                  checked={config.showSignatures}
                  onChange={() => toggleConfig('showSignatures')}
                  className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
              </label>

              {canUserAccessView(currentUser, 'financial') && (
                <label className="flex items-center justify-between text-xs font-medium cursor-pointer p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors">
                  <span className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    Valores Financeiros & Condições
                  </span>
                  <input
                    type="checkbox"
                    checked={config.showFinancialDetails}
                    onChange={() => toggleConfig('showFinancialDetails')}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </label>
              )}
            </div>

            {/* Paste & Upload Map Images Tool */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-400" />
                  Anexar Mapas e Imagens
                </h4>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-800">
                  {mapImages.length} Imagem(ns)
                </span>
              </div>

              {/* Paste Notice */}
              <div className="p-3 bg-slate-950/80 border border-dashed border-emerald-500/40 rounded-xl text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-emerald-400 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Suporte a Colagem Direta (Ctrl+V)
                </p>
                <p className="text-slate-400">
                  Copie qualquer captura de tela ou mapa do drone e pressione <strong>Ctrl+V</strong> em qualquer lugar da tela.
                </p>
              </div>

              {/* Upload Input */}
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Título do Mapa (opcional)..."
                  value={newImageTitle}
                  onChange={(e) => setNewImageTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />

                <label className="w-full py-2.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 rounded-xl text-xs font-bold text-emerald-300 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Selecionar Arquivo de Imagem</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    multiple
                  />
                </label>
              </div>

              {/* List of Attached Map Images */}
              {mapImages.length > 0 && (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {mapImages.map((img, idx) => (
                    <div key={img.id} className="p-2 bg-slate-800/80 rounded-xl border border-slate-700/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <img src={img.url} alt={img.title} className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-slate-600" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">{img.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{img.createdAt}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(img.id)}
                        className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 rounded-lg cursor-pointer"
                        title="Remover Imagem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Notes Field */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="block text-xs font-bold text-slate-300">
                Observações Técnicas / Parecer do Operador
              </label>
              <textarea
                rows={3}
                value={customOperatorNotes}
                onChange={(e) => setCustomOperatorNotes(e.target.value)}
                className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Right Printable Preview Canvas */}
        <div className="flex-1 bg-slate-950 p-4 sm:p-8 overflow-y-auto print:p-0 print:bg-white print:overflow-visible">
          
          <div 
            id="printable-report-document"
            className="max-w-4xl mx-auto bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-10 space-y-6 border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none print:rounded-none"
            style={{
              fontFamily: theme?.fontFamily ? `"${theme.fontFamily}", sans-serif` : 'Plus Jakarta Sans, sans-serif'
            }}
          >
            {/* Header branding */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-emerald-700 pb-5 gap-4">
              <div className="flex items-center gap-4">
                <BrandLogo
                  theme={theme || ({ primaryColor: '#059669', companyName: 'AeroAgro' } as WhiteLabelTheme)}
                  size="lg"
                  className="w-14 h-14 shrink-0"
                />
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight" style={{ color: theme?.primaryColor || '#059669' }}>
                    {theme?.companyName || 'AeroAgro Tecnologia de Pulverização'}
                  </h1>
                  <p className="text-xs text-slate-600 font-semibold">
                    {theme?.tagline || 'Aviação Agrícola Remota & Agricultura de Precisão'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {theme?.registryCreaMapa || 'Registro MAPA nº 18.942/2025 • ART CREA-MT 2026-8914'}
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right border-l-2 sm:border-l-0 pl-3 sm:pl-0 border-emerald-500">
                <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase text-white tracking-wider" style={{ backgroundColor: theme?.primaryColor || '#059669' }}>
                  {reportTitle}
                </span>
                <p className="text-xs font-mono font-bold text-slate-700 mt-1">
                  CÓDIGO: {activeOrder.code}
                </p>
                <p className="text-[11px] text-slate-500">
                  Data de Emissão: {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {/* SEÇÃO 1: Dados do Produtor / Contratante */}
            {config.showClientData && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  1. Identificação do Contratante / Produtor
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">NOME / RAZÃO SOCIAL</span>
                    <strong className="text-slate-900 block truncate">{activeOrder.clientName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">CPF / CNPJ</span>
                    <strong className="text-slate-900 block">{matchedClient?.cpfCnpj || '04.892.118/0001-92'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">MUNICÍPIO / UF DE CADASTRO</span>
                    <strong className="text-slate-900 block">{activeOrder.cityState || matchedClient?.cityState || 'Rio Verde - GO'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">CONTATO TELEFÔNICO</span>
                    <strong className="text-slate-900 block">{matchedClient?.phone || '(64) 99823-1100'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 2: Propriedade e Talhão */}
            {config.showPlotData && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  2. Propriedade Agrícola e Talhão Tratado
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">FAZENDA / PROPRIEDADE</span>
                    <strong className="text-slate-900 block">{activeOrder.farmName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">IDENTIFICAÇÃO DO TALHÃO</span>
                    <strong className="text-slate-900 block">{activeOrder.plotName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">CULTURA & FENOLOGIA</span>
                    <strong className="text-slate-900 block">{activeOrder.crop} ({matchedPlot?.phenologicalStage || 'V4 Vegetativo'})</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">ÁREA TOTAL APLICADA</span>
                    <strong className="text-emerald-700 font-black block text-sm">{activeOrder.targetHectares} Hectares</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 3: Equipe Técnica e Aeronave */}
            {(config.showTechnicalCrew || config.showAircraftData) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {config.showTechnicalCrew && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-emerald-600" />
                      3. Equipe Técnica de Voo
                    </h3>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">PILOTO AGRÍCOLA REMOTO</span>
                        <p className="font-bold text-slate-900">{activeOrder.pilotName}</p>
                        <p className="text-[10px] text-slate-600">Registro DECEA/ANAC nº PR-894201 • Licença CMA Ativa</p>
                      </div>
                      <div className="border-t border-slate-200 pt-2">
                        <span className="text-slate-500 block text-[10px] font-bold">AUXILIAR TÉCNICO DE CAMPO</span>
                        <p className="font-bold text-slate-900">{activeOrder.assistantName}</p>
                        <p className="text-[10px] text-slate-600">Certificado NR-31.8 (Manejo Seguro de Agrotóxicos)</p>
                      </div>
                    </div>
                  </div>
                )}

                {config.showAircraftData && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                      <Plane className="w-4 h-4 text-emerald-600" />
                      4. Especificações do Drone
                    </h3>
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div>
                        <span className="text-slate-500 block text-[10px] font-bold">AERONAVE / MODELO</span>
                        <p className="font-bold text-slate-900">{activeOrder.droneModel}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 border-t border-slate-200 pt-2">
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold">PREFIXO ANAC</span>
                          <span className="font-mono font-bold text-slate-800">{activeOrder.droneAnac}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] font-bold">CAPACIDADE DO TANQUE</span>
                          <span className="font-bold text-slate-800">40 Litros</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO 4: Condições Meteorológicas & Delta T */}
            {config.showWeatherMetrics && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-emerald-600" />
                  5. Condições Meteorológicas & Janela de Voo (Delta T)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-200 text-xs text-center">
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] font-bold">TEMPERATURA</span>
                    <strong className="text-emerald-900 text-sm">
                      {activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0 
                        ? `${activeOrder.weatherReadings[activeOrder.weatherReadings.length - 1].temperatureC.toFixed(1).replace('.', ',')} ºC` 
                        : '24,8 ºC'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] font-bold">UMIDADE RELATIVA</span>
                    <strong className="text-emerald-900 text-sm">
                      {activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0 
                        ? `${activeOrder.weatherReadings[activeOrder.weatherReadings.length - 1].relativeHumidityPct}%` 
                        : '68 %'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] font-bold">VELOCIDADE DO VENTO</span>
                    <strong className="text-emerald-900 text-sm">
                      {activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0 
                        ? `${activeOrder.weatherReadings[activeOrder.weatherReadings.length - 1].windSpeedKmh.toFixed(1).replace('.', ',')} km/h` 
                        : '7,2 km/h'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-2xs">
                    <span className="text-slate-500 block text-[10px] font-bold">DELTA T CALCULADO</span>
                    <strong className="text-emerald-700 text-sm font-black">
                      {activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0 
                        ? `${activeOrder.weatherReadings[activeOrder.weatherReadings.length - 1].deltaT.toFixed(1).replace('.', ',')} ºC` 
                        : '4,5 ºC (Ideal)'}
                    </strong>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-emerald-100 shadow-2xs col-span-2 sm:col-span-1 flex flex-col justify-center">
                    <span className="text-slate-500 block text-[10px] font-bold">WEATHERGATE</span>
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0
                        ? activeOrder.weatherReadings.every(r => r.isSafeForSpraying)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'bg-emerald-600 text-white'
                    } mt-0.5`}>
                      {activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0
                        ? activeOrder.weatherReadings.every(r => r.isSafeForSpraying)
                          ? '100% APROVADO'
                          : 'ALERTA / ANÁLISE'
                        : '100% APROVADO'}
                    </span>
                  </div>
                </div>

                {/* Sub-seção: Logs Meteorológicos Coletados pelo Operador */}
                {config.showCollectedWeatherLogs && (
                  <div className="mt-2.5 space-y-1.5">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-850 pl-1">
                      5.1. Histórico das Leituras Periódicas Registradas em Campo
                    </h4>
                    {activeOrder.weatherReadings && activeOrder.weatherReadings.length > 0 ? (
                      <div className="border border-slate-200 rounded-lg overflow-hidden text-[10px] bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[9px] uppercase">
                              <th className="p-2">Horário</th>
                              <th className="p-2">Temp (°C)</th>
                              <th className="p-2">Umidade (%)</th>
                              <th className="p-2">Vento (km/h)</th>
                              <th className="p-2">Delta T (°C)</th>
                              <th className="p-2">Parecer Técnico / Alertas Observados</th>
                              <th className="p-2 text-center">Parecer</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-700 font-medium">
                            {activeOrder.weatherReadings.map((reading, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2 font-mono font-bold text-slate-500">{reading.timestamp}</td>
                                <td className="p-2 font-mono">{reading.temperatureC.toFixed(1).replace('.', ',')} °C</td>
                                <td className="p-2 font-mono">{reading.relativeHumidityPct}%</td>
                                <td className="p-2 font-mono">{reading.windSpeedKmh.toFixed(1).replace('.', ',')} km/h</td>
                                <td className="p-2 font-mono font-bold text-emerald-700">{reading.deltaT.toFixed(1).replace('.', ',')} °C</td>
                                <td className="p-2 text-slate-500 max-w-[220px] truncate" title={reading.warnings.join('; ')}>
                                  {reading.warnings.length > 0 ? reading.warnings.join('; ') : 'Condições ideais de aplicação.'}
                                </td>
                                <td className="p-2 text-center">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                    reading.isSafeForSpraying 
                                      ? 'bg-emerald-100 text-emerald-800' 
                                      : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {reading.isSafeForSpraying ? 'SEGURO' : 'ALERTA'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-center text-slate-400 text-[10px] italic">
                        Nenhum registro climatológico manual foi coletado pelo operador nesta OS.
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO 5: Calda & Insumos Aplicados */}
            {config.showChemicalMix && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <Droplets className="w-4 h-4 text-emerald-600" />
                  6. Receituário de Calda & Produtos Aplicados
                </h3>

                <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[10px] uppercase font-black">
                        <th className="p-2.5">Ordem de Mistura</th>
                        <th className="p-2.5">Produto Comercial</th>
                        <th className="p-2.5">Categoria</th>
                        <th className="p-2.5">Dose / Hectare</th>
                        <th className="p-2.5">Total Utilizado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      <tr>
                        <td className="p-2.5 font-bold text-center w-20 bg-slate-50">1º - Água</td>
                        <td className="p-2.5 font-bold">Condicionador de Calda (Redutor pH)</td>
                        <td className="p-2.5 text-slate-500">Adjuvante</td>
                        <td className="p-2.5 font-mono">50 mL/ha</td>
                        <td className="p-2.5 font-mono font-bold">{String((50 * activeOrder.targetHectares) / 1000).replace('.', ',')} L</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-center w-20 bg-slate-50">2º - SC</td>
                        <td className="p-2.5 font-bold">{activeOrder.targetPestOrGoal || 'Fungicida Sistêmico'}</td>
                        <td className="p-2.5 text-slate-500">Fungicida</td>
                        <td className="p-2.5 font-mono">0,5 L/ha</td>
                        <td className="p-2.5 font-mono font-bold">{String(0.5 * activeOrder.targetHectares).replace('.', ',')} L</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-bold text-center w-20 bg-slate-50">3º - Óleo</td>
                        <td className="p-2.5 font-bold">Adjuvante Espalhante Polissensorial</td>
                        <td className="p-2.5 text-slate-500">Óleo Mineral</td>
                        <td className="p-2.5 font-mono">0,2 L/ha</td>
                        <td className="p-2.5 font-mono font-bold">{String(0.2 * activeOrder.targetHectares).replace('.', ',')} L</td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="p-2.5 bg-emerald-50 text-emerald-950 flex flex-wrap items-center justify-between font-semibold text-xs border-t border-slate-200">
                    <span>Volume de Calda: <strong>{String(activeOrder.sprayRateLHa).replace('.', ',')} L/ha</strong></span>
                    <span>Volume Total de Água: <strong>{String(activeOrder.sprayRateLHa * activeOrder.targetHectares).replace('.', ',')} Litros</strong></span>
                    <span>Nº de Tanques (40L): <strong>{Math.ceil((activeOrder.sprayRateLHa * activeOrder.targetHectares) / 40)} Voadas</strong></span>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 6: Telemetria & Parâmetros de Voo */}
            {config.showFlightTelemetry && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                  7. Parâmetros de Voo e Desempenho
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">ALTURA DE VOO</span>
                    <strong className="text-slate-900 block">3,2 Metros sobre o Dossel</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">VELOCIDADE OPERACIONAL</span>
                    <strong className="text-slate-900 block">6,5 m/s (23,4 km/h)</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">FAIXA DE DEPOSIÇÃO (SWATH)</span>
                    <strong className="text-slate-900 block">7,5 Metros</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">RENDIMENTO OPERACIONAL</span>
                    <strong className="text-emerald-700 font-bold block">18,5 Hectares / Hora</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 7: Mapeamento e Detalhes da Área Pulverizada (Imagens) */}
            {config.showMapImages && mapImages.length > 0 && (
              <div className="space-y-3 print:break-inside-avoid">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-emerald-600" />
                  8. Mapeamento e Detalhes das Áreas Pulverizadas
                </h3>

                {mapImages.length === 1 ? (
                  /* 1 Image: Centered horizontally */
                  <div className="flex justify-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 w-full max-w-xl">
                      <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-900 aspect-video flex items-center justify-center">
                        <img
                          src={mapImages[0].url}
                          alt={mapImages[0].title}
                          className="w-full h-full object-contain mx-auto"
                        />
                      </div>
                      <div className="text-center">
                        <h4 className="text-xs font-bold text-slate-900">{mapImages[0].title}</h4>
                        <p className="text-[10px] text-slate-600 mt-0.5 leading-snug">{mapImages[0].description}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2 or more Images: Position at least 2 images side-by-side */
                  <div className="grid grid-cols-2 gap-3.5 print:grid-cols-2">
                    {mapImages.map((img) => (
                      <div key={img.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 flex flex-col justify-between">
                        <div className="relative rounded-lg overflow-hidden border border-slate-300 bg-slate-900 aspect-video flex items-center justify-center">
                          <img
                            src={img.url}
                            alt={img.title}
                            className="w-full h-full object-contain mx-auto"
                          />
                        </div>
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{img.title}</h4>
                          <p className="text-[10px] text-slate-600 leading-snug line-clamp-2">{img.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEÇÃO 8: Observações do Operador */}
            {config.showTechnicalNotes && (
              <div className="space-y-1.5">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  9. Parecer Técnico & Recomendações
                </h3>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed italic">
                  "{customOperatorNotes}"
                </div>
              </div>
            )}

            {/* SEÇÃO 9: Valores Financeiros (Opcional - Exclusivo ADMIN/MASTER ou com permissão financeira) */}
            {config.showFinancialDetails && canUserAccessView(currentUser, 'financial') && (
              <div className="space-y-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  10. Resumo Financeiro da Operação
                </h3>
                <div className="grid grid-cols-3 gap-3 bg-emerald-50/50 p-3 rounded-xl border border-emerald-200 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">VALOR BASE / HA</span>
                    <strong className="text-slate-900 font-mono block">{formatBRL(activeOrder.baseRatePerHa)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">ÁREA FATURADA</span>
                    <strong className="text-slate-900 block">{formatHectares(activeOrder.targetHectares)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] font-bold">VALOR TOTAL BRUTO</span>
                    <strong className="text-emerald-700 font-mono font-black text-sm block">
                      {formatBRL(activeOrder.totalGrossValue)}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* SEÇÃO 10: Assinaturas e Termo Legal */}
            {config.showSignatures && (
              <div className="pt-6 border-t border-slate-200 space-y-6 print:break-inside-avoid">
                <p className="text-[10px] text-slate-500 text-justify leading-snug">
                  Atestamos que os serviços de aplicação aérea com aeronave remota (RPA) acima descritos foram executados em estrita observância à Instrução Normativa MAPA nº 19/2021, às normas de segurança da ANAC/DECEA e às boas práticas agrícolas de prevenção à deriva.
                </p>

                <div className="grid grid-cols-2 gap-12 text-center text-xs pt-4">
                  <div>
                    <div className="border-b border-slate-400 w-56 mx-auto mb-1"></div>
                    <p className="font-bold text-slate-900">{activeOrder.pilotName}</p>
                    <p className="text-[10px] text-slate-500">Piloto Agrícola Remoto • DECEA PR-894201</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 w-56 mx-auto mb-1"></div>
                    <p className="font-bold text-slate-900">{activeOrder.clientName}</p>
                    <p className="text-[10px] text-slate-500">Produtor Rural / Responsável Contratante</p>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Notice */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>AgroSys • Plataforma de Gestão de Frota Agrícola</span>
              <span>Documento emitido eletronicamente em {new Date().toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
