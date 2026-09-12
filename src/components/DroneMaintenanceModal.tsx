import React, { useState, useEffect } from 'react';
import { 
  AgriculturalDrone, 
  DroneMaintenanceLog, 
  DroneMaintenanceType, 
  DroneMaintenanceStatus,
  UserProfile,
  WhiteLabelTheme
} from '../types';
import { 
  Wrench, 
  X, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  DollarSign, 
  AlertTriangle, 
  CheckCircle2, 
  FileText, 
  Printer, 
  Camera, 
  Trash2, 
  Check, 
  Plane,
  ShieldCheck,
  Package,
  ChevronDown,
  Layers,
  Tag
} from 'lucide-react';
import { formatHours, formatBRL, formatDecimal } from '../utils/formatters';
import { BrandLogo } from './BrandLogo';

interface DroneMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  drones: AgriculturalDrone[];
  setDrones?: React.Dispatch<React.SetStateAction<AgriculturalDrone[]>>;
  logs: DroneMaintenanceLog[];
  setLogs?: React.Dispatch<React.SetStateAction<DroneMaintenanceLog[]>>;
  selectedDroneId?: string;
  currentUser?: UserProfile;
  theme?: WhiteLabelTheme;
}

export const DroneMaintenanceModal: React.FC<DroneMaintenanceModalProps> = ({
  isOpen,
  onClose,
  drones,
  setDrones,
  logs,
  setLogs,
  selectedDroneId,
  currentUser,
  theme
}) => {
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY' | 'ANALYTICS'>('NEW');

  // Selected Drone
  const [targetDroneId, setTargetDroneId] = useState<string>(
    selectedDroneId || (drones[0]?.id || '')
  );

  useEffect(() => {
    if (selectedDroneId) {
      setTargetDroneId(selectedDroneId);
    } else if (drones.length > 0 && !targetDroneId) {
      setTargetDroneId(drones[0].id);
    }
  }, [selectedDroneId, drones]);

  const currentDrone = drones.find(d => d.id === targetDroneId) || drones[0];

  // New Maintenance Form State
  const [maintType, setMaintType] = useState<DroneMaintenanceType>('PREVENTIVE_REVISION');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [performedBy, setPerformedBy] = useState<string>('Oficina Autorizada DJI Agro');
  const [performedAt, setPerformedAt] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [flightHoursAtService, setFlightHoursAtService] = useState<number>(
    currentDrone?.totalFlightHours || 100
  );
  const [costParts, setCostParts] = useState<number>(0);
  const [costLabor, setCostLabor] = useState<number>(0);
  const [partsInput, setPartsInput] = useState<string>('');
  const [status, setStatus] = useState<DroneMaintenanceStatus>('COMPLETED');
  const [nextMaintenanceHoursTarget, setNextMaintenanceHoursTarget] = useState<number>(
    (currentDrone?.totalFlightHours || 100) + 50
  );
  const [notes, setNotes] = useState<string>('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoTitle, setPhotoTitle] = useState<string>('');

  // Sync flight hours when target drone changes
  useEffect(() => {
    if (currentDrone) {
      setFlightHoursAtService(currentDrone.totalFlightHours || 0);
      setNextMaintenanceHoursTarget(Math.ceil((currentDrone.totalFlightHours || 0) + 50));
    }
  }, [targetDroneId]);

  // Filters for History
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDroneId, setFilterDroneId] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Handle Ctrl+V paste for photos
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
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
                setPhotos(prev => [...prev, base64Url]);
              }
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        if (base64) {
          setPhotos(prev => [...prev, base64]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSaveMaintenance = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Por favor, informe o título ou resumo da manutenção.');
      return;
    }

    if (!currentDrone) {
      alert('Selecione uma aeronave válida.');
      return;
    }

    const totalCost = (Number(costParts) || 0) + (Number(costLabor) || 0);

    const partsArray = partsInput
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    const newLog: DroneMaintenanceLog = {
      id: `maint-${Date.now()}`,
      droneId: currentDrone.id,
      droneModel: currentDrone.modelName,
      droneAnacPrefix: currentDrone.anacPrefix,
      type: maintType,
      title: title.trim(),
      description: description.trim() || 'Sem descrição detalhada fornecida.',
      performedBy: performedBy.trim() || 'Técnico Responsável',
      performedAt,
      flightHoursAtService: Number(flightHoursAtService) || currentDrone.totalFlightHours,
      costParts: Number(costParts) || 0,
      costLabor: Number(costLabor) || 0,
      totalCost,
      partsReplaced: partsArray,
      status,
      nextMaintenanceHoursTarget: Number(nextMaintenanceHoursTarget) || undefined,
      notes: notes.trim(),
      photoUrls: photos,
      createdAt: new Date().toISOString()
    };

    // Save to logs
    if (setLogs) {
      setLogs(prev => [newLog, ...prev]);
    }

    // Update Drone status & stats if setDrones provided
    if (setDrones) {
      setDrones(prevDrones => prevDrones.map(d => {
        if (d.id === currentDrone.id) {
          let newStatus = d.operationalStatus;
          if (status === 'IN_PROGRESS') {
            newStatus = 'MAINTENANCE';
          } else if (status === 'COMPLETED' && d.operationalStatus === 'MAINTENANCE') {
            newStatus = 'READY';
          }

          const currentTotalCost = d.totalMaintenanceCost || 0;
          return {
            ...d,
            operationalStatus: newStatus,
            lastMaintenanceDate: performedAt,
            totalMaintenanceCost: currentTotalCost + totalCost,
            nextMaintenanceHours: nextMaintenanceHoursTarget 
              ? Math.max(0, nextMaintenanceHoursTarget - d.totalFlightHours) 
              : d.nextMaintenanceHours
          };
        }
        return d;
      }));
    }

    alert('✅ Registro de manutenção salvo com sucesso!');

    // Reset Form & Switch to History tab
    setTitle('');
    setDescription('');
    setCostParts(0);
    setCostLabor(0);
    setPartsInput('');
    setNotes('');
    setPhotos([]);
    setActiveTab('HISTORY');
  };

  const handleDeleteLog = (logId: string) => {
    if (confirm('Tem certeza que deseja excluir este registro de manutenção?')) {
      if (setLogs) {
        setLogs(prev => prev.filter(l => l.id !== logId));
      }
    }
  };

  // Filtered logs
  const filteredLogs = logs.filter(log => {
    if (filterDroneId !== 'ALL' && log.droneId !== filterDroneId) return false;
    if (filterType !== 'ALL' && log.type !== filterType) return false;
    if (filterStatus !== 'ALL' && log.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchText = `${log.title} ${log.description} ${log.performedBy} ${log.droneModel} ${log.droneAnacPrefix}`.toLowerCase();
      if (!matchText.includes(term)) return false;
    }
    return true;
  });

  // KPIs
  const totalCostAll = logs.reduce((acc, l) => acc + (l.totalCost || 0), 0);
  const totalPreventive = logs.filter(l => l.type === 'PREVENTIVE_REVISION').length;
  const totalCorrective = logs.filter(l => l.type === 'CORRECTIVE_MAINTENANCE').length;
  const dronesInMaintenance = drones.filter(d => d.operationalStatus === 'MAINTENANCE').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-900 dark:text-slate-100 print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-50 via-slate-100 to-emerald-50 dark:from-slate-900 dark:via-emerald-950 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
              <Wrench className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 tracking-wider">
                  SISTEMA DE MANUTENÇÕES
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">ANAC & MAPA Compliant</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
                Lançamento de Manutenções Corretivas & Revisões
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Fechar Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-x-auto print:hidden">
          <button
            onClick={() => setActiveTab('NEW')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'NEW'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Nova Manutenção</span>
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'HISTORY'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Histórico da Frota ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer ${
              activeTab === 'ANALYTICS'
                ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-400 border-emerald-500 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border-transparent'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Resumo de Custos & KPIs</span>
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              title="Imprimir Relatório de Manutenção"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Imprimir Relatório</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div id="printable-maintenance-document" className="printable-document p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* TAB 1: FORMULÁRIO DE NOVA MANUTENÇÃO */}
          {activeTab === 'NEW' && (
            <form onSubmit={handleSaveMaintenance} className="space-y-6">
              
              {/* Seleção do Drone */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Selecione a Aeronave (Drone da Frota):</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {drones.map(drone => (
                    <div
                      key={drone.id}
                      onClick={() => setTargetDroneId(drone.id)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                        targetDroneId === drone.id
                          ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-700 dark:text-emerald-400 flex-shrink-0">
                        {drone.anacPrefix.slice(-2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{drone.modelName}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{drone.anacPrefix}</div>
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">{formatHours(drone.totalFlightHours)} acumuladas</div>
                      </div>
                      {targetDroneId === drone.id && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Tipo e Dados Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Tipo de Manutenção */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Tipo de Intervenção:</span>
                  </label>
                  <select
                    value={maintType}
                    onChange={(e) => setMaintType(e.target.value as DroneMaintenanceType)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="CORRECTIVE_MAINTENANCE">🛠️ Manutenção Corretiva (Defeito/Quebra/Colisão)</option>
                    <option value="PREVENTIVE_REVISION">🔍 Revisão Preventiva (Periódica/Horas de Voo)</option>
                    <option value="INSPECTION_CALIBRATION">⚖️ Inspeção & Calibração (Bomba/Radar/Bússola)</option>
                    <option value="BATTERY_SERVICE">🔋 Serviço de Baterias & Gerador (BMS/Células)</option>
                  </select>
                </div>

                {/* Título */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Título do Serviço / Resumo:*
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Troca de hélices M2 e reparo da bomba de calda"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Responsável / Oficina */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Oficina Autorizada / Técnico Responsável:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Oficina Autorizada DJI Agro ou Técnico Próprio"
                    value={performedBy}
                    onChange={(e) => setPerformedBy(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Data e Horas de Voo */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Data da Manutenção:
                    </label>
                    <input
                      type="date"
                      value={performedAt}
                      onChange={(e) => setPerformedAt(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Horas no Serviço (h):
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={flightHoursAtService}
                      onChange={(e) => setFlightHoursAtService(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Descrição Detalhada */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Descrição dos Problemas Encontrados e Procedimentos Executados:
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalhamento técnico da causa da manutenção corretiva ou itens inspecionados na revisão preventiva..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Peças Substituídas */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Peças / Componentes Substituídos (separados por vírgula):</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Hélice 5413 M2, Kit O-Rings, Sensor de Pressão de Calda"
                  value={partsInput}
                  onChange={(e) => setPartsInput(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Custos e Status */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-4">
                <h3 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" />
                  <span>Custos Financeiros & Meta de Próxima Revisão</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Custo de Peças (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costParts}
                      onChange={(e) => setCostParts(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Custo Mão de Obra (R$):</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costLabor}
                      onChange={(e) => setCostLabor(parseFloat(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Custo Total Calculado:</label>
                    <div className="w-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-emerald-900 dark:text-emerald-200 font-mono font-bold flex items-center h-9">
                      {formatBRL((Number(costParts) || 0) + (Number(costLabor) || 0))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Status da Manutenção:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as DroneMaintenanceStatus)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-2 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="COMPLETED">✅ Concluída (Drone Pronto)</option>
                      <option value="IN_PROGRESS">🚧 Em Andamento (Drone Inoperante)</option>
                      <option value="SCHEDULED">📅 Agendada</option>
                      <option value="CANCELLED">❌ Cancelada</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/60">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Próxima Revisão Recomendada (Horas do Drone):
                    </label>
                    <input
                      type="number"
                      step="1"
                      value={nextMaintenanceHoursTarget}
                      onChange={(e) => setNextMaintenanceHoursTarget(parseInt(e.target.value) || 0)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                      Observações Adicionais:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Garantia de 90 dias concedida pela oficina"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Anexo e Colagem de Fotos (Ctrl+V) */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Fotos do Serviço / Comprovantes (Cole com Ctrl+V ou selecione):</span>
                  </label>
                  <label className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors flex items-center gap-1">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Anexar Foto</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {photos.length === 0 ? (
                  <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 text-center text-slate-500 dark:text-slate-400 text-xs">
                    Cole prints da peça defeituosa, laudo técnico ou nota fiscal direto com <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-mono">Ctrl+V</kbd>.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photos.map((photo, idx) => (
                      <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-video bg-slate-100 dark:bg-black">
                        <img src={photo} alt={`Foto ${idx+1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(idx)}
                          className="absolute top-1 right-1 p-1 rounded-lg bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão de Submissão */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Salvar Lançamento de Manutenção</span>
                </button>
              </div>

            </form>
          )}

          {/* TAB 2: HISTÓRICO DE MANUTENÇÕES */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-4">
              
              {/* Filtros */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar por título, peças, descrição, oficina ou prefixo..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                  <select
                    value={filterDroneId}
                    onChange={(e) => setFilterDroneId(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="ALL">Todas as Aeronaves</option>
                    {drones.map(d => (
                      <option key={d.id} value={d.id}>{d.modelName} ({d.anacPrefix})</option>
                    ))}
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="ALL">Todos os Tipos</option>
                    <option value="CORRECTIVE_MAINTENANCE">Manutenção Corretiva</option>
                    <option value="PREVENTIVE_REVISION">Revisão Preventiva</option>
                    <option value="INSPECTION_CALIBRATION">Inspeção/Calibração</option>
                    <option value="BATTERY_SERVICE">Baterias</option>
                  </select>
                </div>
              </div>

              {/* Lista de Registros */}
              {filteredLogs.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs space-y-2">
                  <Wrench className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600" />
                  <p>Nenhum registro de manutenção encontrado para os filtros selecionados.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredLogs.map(log => (
                    <div
                      key={log.id}
                      className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            log.type === 'CORRECTIVE_MAINTENANCE'
                              ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/40'
                              : log.type === 'PREVENTIVE_REVISION'
                              ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/40'
                          }`}>
                            {log.type === 'CORRECTIVE_MAINTENANCE' && '🛠️ Corretiva'}
                            {log.type === 'PREVENTIVE_REVISION' && '🔍 Preventiva'}
                            {log.type === 'INSPECTION_CALIBRATION' && '⚖️ Calibração'}
                            {log.type === 'BATTERY_SERVICE' && '🔋 Bateria'}
                          </span>

                          <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                            {log.droneModel} ({log.droneAnacPrefix})
                          </span>

                          <span className="text-xs text-slate-500 dark:text-slate-400">• {log.performedAt}</span>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-xs font-mono font-bold text-slate-900 dark:text-slate-200">
                            {formatBRL(log.totalCost || 0)}
                          </span>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer"
                            title="Excluir Registro"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">{log.title}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">{log.description}</p>
                      </div>

                      {/* Peças e Responsável */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Responsável / Oficina:</span>
                          <span className="text-slate-800 dark:text-slate-200 font-semibold">{log.performedBy}</span>
                        </div>

                        <div>
                          <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Horas acumuladas no serviço:</span>
                          <span className="text-emerald-700 dark:text-emerald-300 font-mono font-semibold">{log.flightHoursAtService} h</span>
                        </div>
                      </div>

                      {log.partsReplaced && log.partsReplaced.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">Peças trocadas:</span>
                          {log.partsReplaced.map((part, pIdx) => (
                            <span key={pIdx} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[10px] text-slate-700 dark:text-slate-300 font-mono">
                              {part}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Fotos em Anexo */}
                      {log.photoUrls && log.photoUrls.length > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">Evidências / Fotos da Manutenção:</span>
                          <div className="flex items-center justify-center gap-2 overflow-x-auto">
                            {log.photoUrls.map((pUrl, pI) => (
                              <img key={pI} src={pUrl} alt="Anexo" className="w-16 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: ANALYTICS & KPIS */}
          {activeTab === 'ANALYTICS' && (
            <div className="space-y-6">
              
              {/* KPIs Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Custo Total de Manutenção</span>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatBRL(totalCostAll)}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Peças + Mão de Obra</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Revisões Preventivas</span>
                  <div className="text-xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                    {totalPreventive} realizadas
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block">Conformidade Operacional</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Manutenções Corretivas</span>
                  <div className="text-xl font-black text-rose-600 dark:text-rose-300 font-mono">
                    {totalCorrective} intervenções
                  </div>
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block">Incidentes / Desgastes</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold">Drones em Manutenção</span>
                  <div className="text-xl font-black text-amber-600 dark:text-amber-300 font-mono">
                    {dronesInMaintenance} de {drones.length}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Status Operacional Ativo</span>
                </div>
              </div>

              {/* Custos Por Drone */}
              <div className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Investimento em Manutenção por Aeronave (Frota)</span>
                </h3>

                <div className="space-y-3">
                  {drones.map(drone => {
                    const droneLogs = logs.filter(l => l.droneId === drone.id);
                    const droneTotal = droneLogs.reduce((a, b) => a + (b.totalCost || 0), 0);
                    const percent = totalCostAll > 0 ? (droneTotal / totalCostAll) * 100 : 0;

                    return (
                      <div key={drone.id} className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{drone.modelName}</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">({drone.anacPrefix})</span>
                          </div>
                          <div className="font-mono text-emerald-700 dark:text-emerald-300 font-bold">
                            {formatBRL(droneTotal)}
                            <span className="text-slate-500 font-normal ml-2">({droneLogs.length} serviços)</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, percent))}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
