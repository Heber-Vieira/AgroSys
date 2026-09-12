import React, { useState, useMemo } from 'react';
import { 
  AgriculturalDrone, 
  DroneBatteryAsset, 
  DroneBatteryStatus, 
  UserProfile, 
  WhiteLabelTheme 
} from '../types';
import { 
  BatteryCharging, 
  Zap, 
  Plus, 
  Edit3, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  QrCode, 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  Search, 
  Filter, 
  RefreshCw, 
  Flame, 
  Check, 
  Activity,
  Plane
} from 'lucide-react';
import { DronePhoto } from './DronePhotoBadge';
import { showToast, showConfirm } from '../services/notificationService';

interface DroneBatteryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  drones: AgriculturalDrone[];
  initialDroneId?: string;
  batteries: DroneBatteryAsset[];
  setBatteries: React.Dispatch<React.SetStateAction<DroneBatteryAsset[]>>;
  currentUser?: UserProfile;
  theme?: WhiteLabelTheme;
}

// Preset battery models for quick 1-click filling
const BATTERY_PRESETS = [
  {
    name: 'DJI DB2000 (T50)',
    model: 'DJI Smart Battery DB2000 (30.000 mAh)',
    capacityMah: 30000,
    voltageNominalV: 52.22,
    desc: 'Bateria LiFePO4 Ultra-Fast Charge para DJI Agras T50',
  },
  {
    name: 'DJI DB1560 (T40)',
    model: 'DJI Smart Battery DB1560 (30.000 mAh)',
    capacityMah: 30000,
    voltageNominalV: 52.22,
    desc: 'Bateria LiPo Smart com Dissipador para DJI Agras T40',
  },
  {
    name: 'DJI DB800 (T20P)',
    model: 'DJI Smart Battery DB800 (13.000 mAh)',
    capacityMah: 13000,
    voltageNominalV: 52.22,
    desc: 'Bateria LiPo Compacta para DJI Agras T20P',
  },
  {
    name: 'XAG B13960S (P100)',
    model: 'XAG SuperCharge B13960S (20.000 mAh)',
    capacityMah: 20000,
    voltageNominalV: 48.0,
    desc: 'Bateria Inteligente com Water-Cooling para XAG P100 Pro',
  },
  {
    name: 'Tattu Pro 22Ah 14S',
    model: 'Gens Ace Tattu Pro 22.000 mAh 14S (51.8V)',
    capacityMah: 22000,
    voltageNominalV: 51.8,
    desc: 'Bateria Universal High-Discharge para drones customizados',
  },
];

export const DroneBatteryManagerModal: React.FC<DroneBatteryManagerModalProps> = ({
  isOpen,
  onClose,
  drones,
  initialDroneId,
  batteries,
  setBatteries,
  currentUser,
}) => {
  const [selectedDroneId, setSelectedDroneId] = useState<string>(() => {
    return initialDroneId || drones[0]?.id || '';
  });

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Form State for Create / Edit
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBattery, setEditingBattery] = useState<DroneBatteryAsset | null>(null);

  const [formData, setFormData] = useState<Partial<DroneBatteryAsset>>({
    serialNumber: '',
    modelName: 'DJI Smart Battery DB1560 (30.000 mAh)',
    capacityMah: 30000,
    voltageNominalV: 52.22,
    healthPct: 98,
    cyclesCount: 0,
    chargePct: 100,
    cellVoltageDeltaMv: 8,
    temperatureC: 28,
    status: 'READY',
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastInspectionDate: new Date().toISOString().split('T')[0],
    qrCodeOrNfcTag: '',
    notes: '',
  });

  // Current Drone Object
  const currentDrone = useMemo(() => {
    return drones.find((d) => d.id === selectedDroneId) || drones[0];
  }, [drones, selectedDroneId]);

  // Batteries for currently selected drone
  const droneBatteries = useMemo(() => {
    if (!currentDrone) return [];
    return batteries.filter((b) => b.droneId === currentDrone.id);
  }, [batteries, currentDrone]);

  // Filtered batteries
  const filteredBatteries = useMemo(() => {
    return droneBatteries.filter((b) => {
      if (statusFilter !== 'ALL' && b.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchSerial = b.serialNumber.toLowerCase().includes(term);
        const matchModel = b.modelName.toLowerCase().includes(term);
        const matchTag = (b.qrCodeOrNfcTag || '').toLowerCase().includes(term);
        return matchSerial || matchModel || matchTag;
      }
      return true;
    });
  }, [droneBatteries, statusFilter, searchTerm]);

  // Telemetry Aggregates for current drone
  const stats = useMemo(() => {
    const total = droneBatteries.length;
    if (total === 0) {
      return {
        total: 0,
        avgHealth: 100,
        readyCount: 0,
        chargingCount: 0,
        alertCount: 0,
        avgCycles: 0,
      };
    }
    const sumHealth = droneBatteries.reduce((acc, b) => acc + (b.healthPct || 0), 0);
    const sumCycles = droneBatteries.reduce((acc, b) => acc + (b.cyclesCount || 0), 0);
    const readyCount = droneBatteries.filter((b) => b.status === 'READY').length;
    const chargingCount = droneBatteries.filter((b) => b.status === 'CHARGING').length;
    const alertCount = droneBatteries.filter((b) => b.status === 'ALERT' || (b.healthPct || 0) < 85 || (b.cellVoltageDeltaMv || 0) > 30).length;

    return {
      total,
      avgHealth: Math.round(sumHealth / total),
      readyCount,
      chargingCount,
      alertCount,
      avgCycles: Math.round(sumCycles / total),
    };
  }, [droneBatteries]);

  if (!isOpen) return null;

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingBattery(null);
    const droneModel = currentDrone?.modelName || '';
    const suggestedPreset = BATTERY_PRESETS.find(p => 
      droneModel.toLowerCase().includes('t50') ? p.name.includes('T50') :
      droneModel.toLowerCase().includes('t40') ? p.name.includes('T40') :
      droneModel.toLowerCase().includes('t20') ? p.name.includes('T20') :
      droneModel.toLowerCase().includes('xag') ? p.name.includes('XAG') : false
    ) || BATTERY_PRESETS[1];

    setFormData({
      serialNumber: `BATT-${currentDrone?.anacPrefix.replace(/[^a-zA-Z0-9]/g, '') || 'DRONE'}-${String(droneBatteries.length + 1).padStart(2, '0')}`,
      modelName: suggestedPreset.model,
      capacityMah: suggestedPreset.capacityMah,
      voltageNominalV: suggestedPreset.voltageNominalV,
      healthPct: 100,
      cyclesCount: 0,
      chargePct: 100,
      cellVoltageDeltaMv: 6,
      temperatureC: 26,
      status: 'READY',
      purchaseDate: new Date().toISOString().split('T')[0],
      warrantyExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lastInspectionDate: new Date().toISOString().split('T')[0],
      qrCodeOrNfcTag: `NFC-${currentDrone?.anacPrefix || 'AGR'}-B${String(droneBatteries.length + 1).padStart(2, '0')}`,
      notes: '',
    });
    setIsFormOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (battery: DroneBatteryAsset) => {
    setEditingBattery(battery);
    setFormData({ ...battery });
    setIsFormOpen(true);
  };

  // Apply quick preset in form
  const handleApplyPreset = (preset: typeof BATTERY_PRESETS[0]) => {
    setFormData(prev => ({
      ...prev,
      modelName: preset.model,
      capacityMah: preset.capacityMah,
      voltageNominalV: preset.voltageNominalV,
    }));
    showToast(`Especificações do preset "${preset.name}" aplicadas!`, 'info', 'Preset Carregado');
  };

  // Save (Create or Update)
  const handleSaveBattery = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serialNumber?.trim()) {
      showToast('Por favor, informe o número de série da bateria.', 'warning', 'Campo Obrigatório');
      return;
    }

    if (!currentDrone) {
      showToast('Selecione uma aeronave válida.', 'warning');
      return;
    }

    if (editingBattery) {
      // Update existing
      const updatedBattery: DroneBatteryAsset = {
        ...editingBattery,
        ...formData,
        serialNumber: formData.serialNumber.trim(),
        modelName: formData.modelName?.trim() || 'Smart Battery Pack',
        capacityMah: Number(formData.capacityMah) || 30000,
        voltageNominalV: Number(formData.voltageNominalV) || 52.22,
        healthPct: Math.min(100, Math.max(0, Number(formData.healthPct) || 100)),
        cyclesCount: Math.max(0, Number(formData.cyclesCount) || 0),
        chargePct: Math.min(100, Math.max(0, Number(formData.chargePct) || 100)),
        cellVoltageDeltaMv: Math.max(0, Number(formData.cellVoltageDeltaMv) || 0),
        temperatureC: Number(formData.temperatureC) || 28,
        status: (formData.status as DroneBatteryStatus) || 'READY',
        updatedAt: new Date().toISOString(),
      };

      setBatteries(prev => prev.map(b => b.id === editingBattery.id ? updatedBattery : b));
      showToast(`Bateria "${updatedBattery.serialNumber}" atualizada com sucesso!`, 'success', 'Bateria Atualizada');
    } else {
      // Create new
      const newBattery: DroneBatteryAsset = {
        id: `batt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        droneId: currentDrone.id,
        companyId: currentDrone.companyId,
        serialNumber: formData.serialNumber.trim(),
        modelName: formData.modelName?.trim() || 'Smart Battery Pack',
        capacityMah: Number(formData.capacityMah) || 30000,
        voltageNominalV: Number(formData.voltageNominalV) || 52.22,
        healthPct: Math.min(100, Math.max(0, Number(formData.healthPct) || 100)),
        cyclesCount: Math.max(0, Number(formData.cyclesCount) || 0),
        chargePct: Math.min(100, Math.max(0, Number(formData.chargePct) || 100)),
        cellVoltageDeltaMv: Math.max(0, Number(formData.cellVoltageDeltaMv) || 0),
        temperatureC: Number(formData.temperatureC) || 28,
        status: (formData.status as DroneBatteryStatus) || 'READY',
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        warrantyExpiryDate: formData.warrantyExpiryDate,
        lastInspectionDate: formData.lastInspectionDate || new Date().toISOString().split('T')[0],
        qrCodeOrNfcTag: formData.qrCodeOrNfcTag?.trim(),
        notes: formData.notes?.trim() || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setBatteries(prev => [newBattery, ...prev]);
      showToast(`Nova bateria "${newBattery.serialNumber}" vinculada ao drone ${currentDrone.anacPrefix}!`, 'success', 'Bateria Cadastrada');
    }

    setIsFormOpen(false);
  };

  // Delete Battery with Unified AgroSys Confirm Modal
  const handleDeleteBattery = (battery: DroneBatteryAsset) => {
    showConfirm({
      title: 'Excluir Bateria',
      message: `Tem certeza que deseja remover a bateria "${battery.serialNumber}" (${battery.modelName}) vinculada ao drone ${currentDrone?.anacPrefix}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setBatteries(prev => prev.filter(b => b.id !== battery.id));
        showToast(`Bateria "${battery.serialNumber}" removida com sucesso.`, 'info', 'Bateria Removida');
      },
    });
  };

  // Quick toggle status
  const handleQuickToggleStatus = (battery: DroneBatteryAsset) => {
    const statusCycle: DroneBatteryStatus[] = ['READY', 'CHARGING', 'STORAGE', 'ALERT'];
    const currIndex = statusCycle.indexOf(battery.status);
    const nextStatus = statusCycle[(currIndex + 1) % statusCycle.length];

    setBatteries(prev => prev.map(b => b.id === battery.id ? { ...b, status: nextStatus, updatedAt: new Date().toISOString() } : b));
    showToast(`Status da bateria ${battery.serialNumber} alterado para "${getStatusLabel(nextStatus)}".`, 'info');
  };

  // Helper for status label & color
  function getStatusBadge(status: DroneBatteryStatus) {
    switch (status) {
      case 'READY':
        return {
          label: 'PRONTA P/ VOO',
          color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          dot: 'bg-emerald-500',
        };
      case 'CHARGING':
        return {
          label: 'EM CARGA',
          color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/80 dark:text-cyan-300 border-cyan-300 dark:border-cyan-700 animate-pulse',
          dot: 'bg-cyan-500',
        };
      case 'STORAGE':
        return {
          label: 'MODO STORAGE (40-60%)',
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300 dark:border-blue-700',
          dot: 'bg-blue-500',
        };
      case 'ALERT':
        return {
          label: 'ATENÇÃO REQUERIDA',
          color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          dot: 'bg-amber-500',
        };
      case 'DISCARDED':
        return {
          label: 'DESCARTADA / FIM DE VIDA',
          color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700',
          dot: 'bg-rose-500',
        };
    }
  }

  function getStatusLabel(status: DroneBatteryStatus) {
    return getStatusBadge(status).label;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#041c14]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-5xl bg-white dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-4 sm:p-6 my-auto max-h-[92vh] flex flex-col space-y-4 overflow-hidden">
        {/* MODAL TOP HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100 dark:border-emerald-800/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 text-amber-600 dark:text-amber-400 border border-amber-400/40 shadow-xs">
              <BatteryCharging className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-emerald-950 dark:text-white tracking-tight flex items-center gap-1.5">
                  Gerenciador de Baterias por Drone
                </h2>
                <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                  Smart LiPo / LiFePO4
                </span>
              </div>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Cadastro, configuração individual, ciclos de carga, saúde (SoH) e balanceamento de células.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleOpenCreate}
              className="px-3.5 py-2 rounded-xl font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md text-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Nova Bateria</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-emerald-400 dark:hover:text-white hover:bg-emerald-100/60 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* DRONE SELECTION BAR */}
        <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-black uppercase text-emerald-900 dark:text-emerald-200 tracking-wider flex items-center gap-1 shrink-0">
              <Plane className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Drone Selecionado:
            </span>

            <div className="flex items-center gap-2 overflow-x-auto">
              {drones.map((drone) => {
                const isSelected = drone.id === selectedDroneId;
                const battCount = batteries.filter(b => b.droneId === drone.id).length;
                return (
                  <button
                    key={drone.id}
                    onClick={() => {
                      setSelectedDroneId(drone.id);
                      setIsFormOpen(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm scale-100'
                        : 'bg-white dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100/50'
                    }`}
                  >
                    <DronePhoto drone={drone} size="xs" rounded="rounded-md" />
                    <span className="font-mono">{drone.anacPrefix}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    }`}>
                      {battCount} {battCount === 1 ? 'pack' : 'packs'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* TELEMETRY KPI TILES FOR CURRENT DRONE */}
        {currentDrone && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="p-3 rounded-2xl bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Banco de Baterias
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                  {stats.total} {stats.total === 1 ? 'bateria' : 'baterias'}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                <BatteryCharging className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Saúde Média (SoH)
                </span>
                <span className={`text-base sm:text-lg font-black font-mono ${
                  stats.avgHealth >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {stats.avgHealth}%
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                <Activity className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Prontas para Voo
                </span>
                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
                  {stats.readyCount} / {stats.total}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                <Zap className="w-4 h-4" />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                  Média de Ciclos
                </span>
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono">
                  {stats.avgCycles} ciclos
                </span>
              </div>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300">
                <RefreshCw className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por serial, modelo ou tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <span className="text-[11px] font-bold text-emerald-900 dark:text-emerald-200 shrink-0">Status:</span>
            {['ALL', 'READY', 'CHARGING', 'STORAGE', 'ALERT'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors cursor-pointer shrink-0 border ${
                  statusFilter === st
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-white dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50'
                }`}
              >
                {st === 'ALL' && 'Todas'}
                {st === 'READY' && 'Prontas'}
                {st === 'CHARGING' && 'Em Carga'}
                {st === 'STORAGE' && 'Storage'}
                {st === 'ALERT' && 'Atenção'}
              </button>
            ))}
          </div>
        </div>

        {/* BATTERIES LIST / GRID */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {filteredBatteries.length === 0 ? (
            <div className="py-12 px-4 rounded-3xl bg-slate-50 dark:bg-emerald-950/40 border-2 border-dashed border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <BatteryCharging className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Nenhuma bateria encontrada para este drone
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80 max-w-md mx-auto">
                {searchTerm
                  ? 'Nenhum resultado corresponde à busca informada.'
                  : `Cadastre as baterias (packs Smart LiPo) que compõem o banco de voo do drone ${currentDrone?.anacPrefix}.`}
              </p>
              <button
                onClick={handleOpenCreate}
                className="px-4 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Primeira Bateria</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredBatteries.map((battery) => {
                const badge = getStatusBadge(battery.status);
                const isLowHealth = battery.healthPct < 85;
                const isHighDelta = battery.cellVoltageDeltaMv > 20;

                return (
                  <div
                    key={battery.id}
                    className={`p-4 rounded-2xl border transition-all relative flex flex-col justify-between space-y-3 ${
                      isLowHealth || isHighDelta
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/80'
                        : 'bg-white dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400'
                    }`}
                  >
                    {/* Header: Serial, Model, Status & Quick Action Buttons */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black text-emerald-800 dark:text-emerald-300">
                              {battery.serialNumber}
                            </span>
                            {battery.qrCodeOrNfcTag && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 flex items-center gap-1">
                                <QrCode className="w-2.5 h-2.5" />
                                {battery.qrCodeOrNfcTag}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                            {battery.modelName}
                          </h4>
                        </div>

                        {/* Top Action Buttons (Edit, Delete) */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEdit(battery)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-slate-700 dark:text-emerald-200 transition-colors cursor-pointer"
                            title="Editar informações da bateria"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBattery(battery)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                            title="Excluir bateria deste drone"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Status Badge (Clickable for quick toggle) */}
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          onClick={() => handleQuickToggleStatus(battery)}
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity ${badge.color}`}
                          title="Clique para alternar o status operacional da bateria"
                        >
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </button>
                      </div>
                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {/* Health SoH */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800">
                        <span className="text-[9px] font-semibold text-emerald-800 dark:text-emerald-400 block">Saúde (SoH)</span>
                        <span className={`text-xs font-black font-mono mt-0.5 block ${
                          isLowHealth ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {battery.healthPct}%
                        </span>
                      </div>

                      {/* Charge SoC */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800">
                        <span className="text-[9px] font-semibold text-emerald-800 dark:text-emerald-400 block">Carga (SoC)</span>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                          {battery.chargePct}%
                        </span>
                      </div>

                      {/* Cell Delta */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800">
                        <span className="text-[9px] font-semibold text-emerald-800 dark:text-emerald-400 block">Desbalanço</span>
                        <span className={`text-xs font-black font-mono mt-0.5 block ${
                          isHighDelta ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-900 dark:text-white'
                        }`}>
                          {battery.cellVoltageDeltaMv} mV
                        </span>
                      </div>

                      {/* Cycles */}
                      <div className="p-2 rounded-xl bg-slate-50 dark:bg-emerald-900/50 border border-emerald-100 dark:border-emerald-800">
                        <span className="text-[9px] font-semibold text-emerald-800 dark:text-emerald-400 block">Ciclos</span>
                        <span className="text-xs font-black font-mono text-slate-900 dark:text-white mt-0.5 block">
                          {battery.cyclesCount}
                        </span>
                      </div>
                    </div>

                    {/* Specs / Inspection Info */}
                    <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/80 flex items-center justify-between text-[10px] text-slate-500 dark:text-emerald-300/80">
                      <span>Capacidade: <strong>{(battery.capacityMah / 1000).toFixed(0)} Ah ({battery.voltageNominalV}V)</strong></span>
                      <span>Temp: <strong>{battery.temperatureC}°C</strong></span>
                      {battery.lastInspectionDate && (
                        <span>Revisão: <strong>{new Date(battery.lastInspectionDate).toLocaleDateString('pt-BR')}</strong></span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="pt-3 border-t border-emerald-100 dark:border-emerald-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Drone ativo: <strong className="text-emerald-950 dark:text-white font-mono">{currentDrone?.anacPrefix}</strong> ({currentDrone?.modelName})
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-emerald-900 text-slate-700 dark:text-emerald-200 text-xs transition-colors cursor-pointer"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INNER MODAL: CADASTRO & EDIÇÃO DE BATERIA COM PRESETS */}
      {/* ========================================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in zoom-in-95 duration-150">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#072a1e] border-2 border-emerald-500 text-slate-900 dark:text-white rounded-3xl shadow-2xl p-5 sm:p-6 my-auto max-h-[90vh] overflow-y-auto space-y-5">
            {/* Form Header */}
            <div className="flex items-center justify-between border-b border-emerald-100 dark:border-emerald-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingBattery ? 'Editar Informações da Bateria' : 'Cadastrar Nova Bateria no Drone'}
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Aeronave: <strong className="font-mono">{currentDrone?.anacPrefix}</strong> ({currentDrone?.modelName})
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="p-1.5 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-900 text-slate-500 dark:text-emerald-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Model Presets */}
            <div className="space-y-2 p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-emerald-900 dark:text-emerald-200 tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Presets Rápidos de Baterias Agrícolas:
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">1-clique para preencher specs</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {BATTERY_PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="p-2 rounded-xl text-left border bg-white dark:bg-emerald-900/70 border-emerald-200 dark:border-emerald-800 hover:border-emerald-500 hover:bg-emerald-100/50 dark:hover:bg-emerald-800 transition-all text-xs cursor-pointer group"
                  >
                    <span className="font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-300">
                      {preset.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-emerald-300/70 block truncate font-mono">
                      {(preset.capacityMah / 1000).toFixed(0)}Ah • {preset.voltageNominalV}V
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form Fields */}
            <form onSubmit={handleSaveBattery} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Serial Number */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Número de Série / Código Identificador: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DJI-DB1560-8812A"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Model Name */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Modelo da Bateria: *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: DJI Smart Battery DB1560"
                    value={formData.modelName}
                    onChange={(e) => setFormData({ ...formData, modelName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                {/* Capacity (mAh) */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Capacidade Nominal (mAh):
                  </label>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={formData.capacityMah}
                    onChange={(e) => setFormData({ ...formData, capacityMah: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Voltage (V) */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Tensão Nominal (Volts):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.voltageNominalV}
                    onChange={(e) => setFormData({ ...formData, voltageNominalV: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Health (% SoH) */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Saúde Atual da Bateria (% SoH):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.healthPct}
                    onChange={(e) => setFormData({ ...formData, healthPct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Cycles Count */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Ciclos de Carga Efetuados:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cyclesCount}
                    onChange={(e) => setFormData({ ...formData, cyclesCount: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Charge (% SoC) */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Nível de Carga Atual (% SoC):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.chargePct}
                    onChange={(e) => setFormData({ ...formData, chargePct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Cell Delta (mV) */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Desbalanço de Células (mV):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cellVoltageDeltaMv}
                    onChange={(e) => setFormData({ ...formData, cellVoltageDeltaMv: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Temperature (°C) */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Temperatura Operacional (°C):
                  </label>
                  <input
                    type="number"
                    value={formData.temperatureC}
                    onChange={(e) => setFormData({ ...formData, temperatureC: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Operational Status */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Status Operacional:
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as DroneBatteryStatus })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                  >
                    <option value="READY">🟢 PRONTA P/ VOO</option>
                    <option value="CHARGING">⚡ EM CARGA RÁPIDA</option>
                    <option value="STORAGE">🔵 MODO STORAGE (Armazenamento 40-60%)</option>
                    <option value="ALERT">🟡 ATENÇÃO REQUERIDA (Desbalanço/SoH)</option>
                    <option value="DISCARDED">🔴 DESCARTADA / FIM DE VIDA</option>
                  </select>
                </div>

                {/* Tag NFC / QR Code */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Código de Etiqueta QR / RFID / NFC:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: NFC-CIC-T40-B01"
                    value={formData.qrCodeOrNfcTag}
                    onChange={(e) => setFormData({ ...formData, qrCodeOrNfcTag: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                {/* Purchase Date */}
                <div>
                  <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                    Data de Aquisição:
                  </label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-slate-800 dark:text-emerald-200 block mb-1">
                  Observações Técnicas / Laudo de Células:
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Utilizada em voos com calda pesada. Inspeção de cabos AS150 e balanceamento de fábrica ok."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-emerald-100 dark:border-emerald-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-emerald-900 text-slate-700 dark:text-emerald-200 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingBattery ? 'Salvar Alterações' : 'Cadastrar Bateria'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
