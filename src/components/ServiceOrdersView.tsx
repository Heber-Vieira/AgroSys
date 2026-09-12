import React, { useState } from 'react';
import { 
  ServiceOrder, 
  UserProfile, 
  FarmPlot, 
  AgriculturalDrone, 
  CrewPilot, 
  CrewAssistant,
  ClientProducer,
  OSStatus,
  WhiteLabelTheme
} from '../types';
import { 
  Plane, 
  MapPin, 
  Droplets, 
  Wind, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  FileCheck,
  Check,
  ChevronRight,
  User,
  X,
  Award,
  Download,
  FileText,
  Calendar,
  Printer
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { DronePhoto, DroneBadge, getDronePhotoUrl } from './DronePhotoBadge';
import { UserAvatar, getStoredUserPhoto } from './UserAvatar';
import { SprayReportModal } from './SprayReportModal';
import { WeatherAlertOperatorPanel } from './weather/WeatherAlertOperatorPanel';
import { formatBRL, formatHectares, formatDecimal } from '../utils/formatters';

interface ServiceOrdersViewProps {
  currentUser: UserProfile;
  theme?: WhiteLabelTheme;
  orders: ServiceOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  plots: FarmPlot[];
  drones: AgriculturalDrone[];
  pilots: CrewPilot[];
  assistants: CrewAssistant[];
  clients?: ClientProducer[];
  onNavigate: (view: string) => void;
  showNewOSModal: boolean;
  setShowNewOSModal: (show: boolean) => void;
}

export const ServiceOrdersView: React.FC<ServiceOrdersViewProps> = ({
  currentUser,
  theme,
  orders,
  setOrders,
  plots,
  drones,
  pilots,
  assistants,
  clients,
  onNavigate,
  showNewOSModal,
  setShowNewOSModal,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCertificateOrder, setSelectedCertificateOrder] = useState<ServiceOrder | null>(null);
  
  // Custom Spray Report Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportSelectedOrderId, setReportSelectedOrderId] = useState<string | undefined>(undefined);

  // Weather Readings Management
  const handleAddWeatherReading = (orderId: string, reading: any) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const readings = order.weatherReadings || [];
        return {
          ...order,
          weatherReadings: [...readings, reading]
        };
      }
      return order;
    }));
  };

  const handleRemoveWeatherReading = (orderId: string, readingIndex: number) => {
    setOrders(prevOrders => prevOrders.map(order => {
      if (order.id === orderId) {
        const readings = order.weatherReadings || [];
        return {
          ...order,
          weatherReadings: readings.filter((_, idx) => idx !== readingIndex)
        };
      }
      return order;
    }));
  };

  // New OS Form State
  const [newOSPlotId, setNewOSPlotId] = useState<string>(plots[0]?.id || '');
  const [newOSTargetPest, setNewOSTargetPest] = useState<string>('Fungicida + Adjuvante');
  const [newOSSprayRate, setNewOSSprayRate] = useState<number>(10.0);
  const [newOSDroneId, setNewOSDroneId] = useState<string>(drones[0]?.id || '');
  const [newOSPilotId, setNewOSPilotId] = useState<string>(pilots[0]?.id || '');
  const [newOSAssistantId, setNewOSAssistantId] = useState<string>(assistants[0]?.id || '');

  const selectedPlot = plots.find(p => p.id === newOSPlotId) || plots[0];
  const selectedDrone = drones.find(d => d.id === newOSDroneId) || drones[0];
  const selectedPilot = pilots.find(p => p.id === newOSPilotId) || pilots[0];
  const selectedAssistant = assistants.find(a => a.id === newOSAssistantId) || assistants[0];

  const estimatedGrossValue = (selectedPlot?.hectares || 30) * 75;
  const estimatedPilotComm = (selectedPlot?.hectares || 30) * (selectedPilot?.commissionRatePerHa || 8);
  const estimatedAssistComm = (selectedPlot?.hectares || 30) * (selectedAssistant?.commissionRatePerHa || 3);

  const handleCreateOS = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlot || !selectedDrone || !selectedPilot || !selectedAssistant) return;

    const newOrder: ServiceOrder = {
      id: `os-${Date.now()}`,
      code: `OS-2026-0${orders.length + 42}`,
      clientId: currentUser.role === 'USER' ? currentUser.id : 'user-client',
      clientName: currentUser.role === 'USER' ? currentUser.name : selectedPlot.clientName,
      farmName: selectedPlot.farmName,
      plotId: selectedPlot.id,
      plotName: selectedPlot.name,
      crop: selectedPlot.crop,
      targetHectares: selectedPlot.hectares,
      sprayedHectares: 0,
      targetPestOrGoal: newOSTargetPest,
      status: 'SCHEDULED',
      scheduledDate: new Date().toISOString().split('T')[0],
      sprayRateLHa: newOSSprayRate,
      droneId: selectedDrone.id,
      droneModel: selectedDrone.modelName,
      droneAnac: selectedDrone.anacPrefix,
      dronePhotoUrl: selectedDrone.photoUrl || getDronePhotoUrl({ droneId: selectedDrone.id, modelName: selectedDrone.modelName }),
      pilotId: selectedPilot.id,
      pilotName: selectedPilot.name,
      assistantId: selectedAssistant.id,
      assistantName: selectedAssistant.name,
      pricingModel: 'PER_HECTARE',
      baseRatePerHa: 75.00,
      totalGrossValue: estimatedGrossValue,
      pilotCommission: estimatedPilotComm,
      assistantCommission: estimatedAssistComm,
      weatherSafeApproved: false,
      mixPreparedApproved: false,
      digitalSigned: false,
    };

    setOrders([newOrder, ...orders]);
    setShowNewOSModal(false);
  };

  const updateOrderStatus = (orderId: string, newStatus: OSStatus) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        let sprayed = order.sprayedHectares;
        if (newStatus === 'COMPLETED') sprayed = order.targetHectares;
        return {
          ...order,
          status: newStatus,
          sprayedHectares: sprayed,
          digitalSigned: newStatus === 'COMPLETED' ? true : order.digitalSigned,
        };
      }
      return order;
    }));
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesRole = currentUser.role === 'USER'
      ? (order.clientId === currentUser.id || order.clientName.toLowerCase().includes(currentUser.name.toLowerCase()))
      : currentUser.role === 'PILOT'
      ? (order.pilotId === 'pilot-1' || order.pilotName.includes(currentUser.name.split(' ')[1] || ''))
      : currentUser.role === 'ASSISTANT'
      ? (order.assistantId === 'assistant-1' || order.assistantName.includes(currentUser.name.split(' ')[0]))
      : true;

    const matchesStatus = filterStatus === 'ALL' || order.status === filterStatus;
    const matchesSearch = order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.plotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.crop.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesRole && matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150">
      {/* Header & New OS Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white">
            Ordens de Serviço (Field Service)
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Escala operacional, alocação da tríade de campo e controle de status em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          <button
            onClick={() => {
              setReportSelectedOrderId(orders[0]?.id);
              setShowReportModal(true);
            }}
            className="px-2.5 py-1.5 rounded-lg font-bold bg-white dark:bg-emerald-950/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Emitir Relatório Térmico/PDF</span>
          </button>

          <button
            onClick={() => onNavigate('schedule')}
            className="px-2.5 py-1.5 rounded-lg font-bold bg-white dark:bg-emerald-950/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700 shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Agenda & Calendário</span>
          </button>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'USER') && (
            <button
              onClick={() => setShowNewOSModal(true)}
              className="px-3 py-1.5 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {currentUser.role === 'USER' ? 'Solicitar Pulverização' : 'Nova Ordem de Serviço'}
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 p-2.5 sm:px-3 sm:py-2 rounded-xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-2">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700/70 dark:text-emerald-300/70" />
          <input
            type="text"
            placeholder="Buscar código, fazenda ou talhão..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 sm:pb-0">
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'SCHEDULED', label: 'Agendadas' },
            { id: 'OPERATING', label: 'Em Operação' },
            { id: 'COMPLETED', label: 'Concluídas' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                filterStatus === tab.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 shadow-2xs'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* OS Cards List */}
      <div className="space-y-2.5 sm:space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800 rounded-xl p-6 text-center text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Nenhuma Ordem de Serviço encontrada com os filtros selecionados.
          </div>
        ) : (
          filteredOrders.map((order) => {
            const progressPct = Math.round((order.sprayedHectares / order.targetHectares) * 100);
            return (
              <div
                key={order.id}
                className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all"
              >
                {/* Header of the OS Card */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono font-black text-xs sm:text-sm text-emerald-950 dark:text-white">
                        {order.code}
                      </span>
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border ${
                        order.status === 'OPERATING'
                          ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 animate-pulse'
                          : order.status === 'SCHEDULED'
                          ? 'bg-emerald-200/60 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          : order.status === 'IN_TRANSIT'
                          ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300'
                          : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        {order.status === 'OPERATING' && '● EM OPERAÇÃO'}
                        {order.status === 'SCHEDULED' && 'AGENDADO'}
                        {order.status === 'IN_TRANSIT' && 'EM DESLOCAMENTO'}
                        {order.status === 'COMPLETED' && 'CONCLUÍDO'}
                        {order.status === 'PAUSED' && 'PAUSADO (CLIMA)'}
                      </span>
                      <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 font-medium">
                        Data: {order.scheduledDate} {order.startTime ? `(${order.startTime} às ${order.endTime || '09:30'})` : ''}
                      </span>
                    </div>

                    <h2 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white mt-0.5">
                      {order.plotName} • {order.farmName} ({order.clientName})
                    </h2>
                    <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                      Cultura: <strong>{order.crop}</strong> • Alvo: <strong>{order.targetPestOrGoal}</strong> • Taxa: <strong>{String(order.sprayRateLHa).replace('.', ',')} L/ha</strong>
                    </p>
                  </div>

                  {/* Pricing / Gross Info */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="bg-white/80 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 px-3 py-2 rounded-xl">
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 block font-semibold">Valor Bruto OS</span>
                      <span className="font-bold text-emerald-950 dark:text-white">
                        {formatBRL(order.totalGrossValue)}
                      </span>
                    </div>

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'PILOT') && (
                      <div className="bg-white/80 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 px-3 py-2 rounded-xl">
                        <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 block font-semibold">Comissão Piloto</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          {formatBRL(order.pilotCommission)}
                        </span>
                      </div>
                    )}

                    {(currentUser.role === 'ADMIN' || currentUser.role === 'ASSISTANT') && (
                      <div className="bg-white/80 dark:bg-emerald-950/60 border border-emerald-200/90 dark:border-emerald-800 px-3 py-2 rounded-xl">
                        <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 block font-semibold">Comissão Auxiliar</span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          {formatBRL(order.assistantCommission)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Body: Operational Triad and Progress */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-3">
                    <DronePhoto
                      modelName={order.droneModel}
                      photoUrl={order.dronePhotoUrl}
                      droneId={order.droneId}
                      size="md"
                      rounded="rounded-xl"
                      className="border border-emerald-300 dark:border-emerald-700 shadow-2xs flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-semibold block">Drone Homologado ANAC</span>
                      <span className="font-bold text-emerald-950 dark:text-white truncate block">{order.droneModel}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block font-mono">Prefixo: {order.droneAnac}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-3">
                    {(() => {
                      const pilotObj = pilots.find(p => p.name === order.pilotName);
                      const photoUrl = pilotObj ? (getStoredUserPhoto(pilotObj.id) || pilotObj.photoUrl || pilotObj.avatarUrl) : undefined;
                      return (
                        <UserAvatar
                          user={{
                            id: pilotObj?.id || 'pilot-order',
                            name: order.pilotName,
                            role: 'PILOT',
                            roleLabel: 'Piloto',
                            email: '',
                            badge: 'ANAC',
                            photoUrl,
                          }}
                          size="sm"
                          showRoleBadge
                          className="shrink-0"
                        />
                      );
                    })()}
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-semibold block">Piloto Remoto (DECEA)</span>
                      <span className="font-bold text-emerald-950 dark:text-white">{order.pilotName}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">Licença e CMA Válidos</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800 flex items-center gap-3">
                    {(() => {
                      const astObj = assistants.find(a => a.name === order.assistantName);
                      const photoUrl = astObj ? (getStoredUserPhoto(astObj.id) || astObj.photoUrl || astObj.avatarUrl) : undefined;
                      return (
                        <UserAvatar
                          user={{
                            id: astObj?.id || 'ast-order',
                            name: order.assistantName,
                            role: 'ASSISTANT',
                            roleLabel: 'Auxiliar',
                            email: '',
                            badge: 'NR-31',
                            photoUrl,
                          }}
                          size="sm"
                          showRoleBadge
                          className="shrink-0"
                        />
                      );
                    })()}
                    <div>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400/70 font-semibold block">Auxiliar de Calda (NR-31)</span>
                      <span className="font-bold text-emerald-950 dark:text-white">{order.assistantName}</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold block">EPIs e Mistura Segura</span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-emerald-800/80 dark:text-emerald-300/80">
                      Hectares Aplicados: <strong>{String(order.sprayedHectares).replace('.', ',')} ha</strong> de {String(order.targetHectares).replace('.', ',')} ha
                    </span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">{progressPct}%</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-emerald-200/60 dark:bg-emerald-950 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>

                {order.status === 'OPERATING' && (
                  <div className="mt-4">
                    <WeatherAlertOperatorPanel
                      orderId={order.id}
                      orderCode={order.code}
                      weatherReadings={order.weatherReadings}
                      onAddWeatherReading={(reading) => handleAddWeatherReading(order.id, reading)}
                      onRemoveWeatherReading={(idx) => handleRemoveWeatherReading(order.id, idx)}
                    />
                  </div>
                )}

                {/* Operational Quick Actions (Workflow buttons) */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-emerald-200/60 dark:border-emerald-800/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => onNavigate('spray-mix')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Droplets className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Calcular Calda
                    </button>

                    <button
                      onClick={() => onNavigate('weather')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Wind className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Checar Delta T
                    </button>

                    <button
                      onClick={() => onNavigate('telemetry')}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Log Telemetria
                    </button>

                    <button
                      onClick={() => setSelectedCertificateOrder(order)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/80 dark:hover:bg-emerald-900 border border-emerald-300/80 dark:border-emerald-700/80 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                      Certificado SIMPLES
                    </button>

                    <button
                      onClick={() => {
                        setReportSelectedOrderId(order.id);
                        setShowReportModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Relatório Completo (Mapeamento)
                    </button>
                  </div>

                  {/* State Change Buttons for Field Crews / Admins */}
                  <div className="flex items-center gap-1.5">
                    {order.status === 'SCHEDULED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'IN_TRANSIT')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                      >
                        Iniciar Deslocamento →
                      </button>
                    )}

                    {order.status === 'IN_TRANSIT' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'OPERATING')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                      >
                        Decolar Drone (Operar) →
                      </button>
                    )}

                    {order.status === 'OPERATING' && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PAUSED')}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-200 cursor-pointer"
                        >
                          Pausar Voo
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'COMPLETED')}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Finalizar & Assinar OS
                        </button>
                      </div>
                    )}

                    {order.status === 'PAUSED' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'OPERATING')}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                      >
                        Retomar Voo →
                      </button>
                    )}

                    {order.status === 'COMPLETED' && (
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 border border-emerald-300/80 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        OS Fechada & Assinada
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* NEW OS MODAL */}
      {showNewOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-emerald-50/95 dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950 dark:text-white">
                    {currentUser.role === 'USER' ? 'Solicitar Pulverização de Talhão' : 'Criar Nova Ordem de Serviço'}
                  </h3>
                  <span className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Alocação automatizada e cálculo de calda para pulverização
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowNewOSModal(false)}
                className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-800 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateOS} className="space-y-4 text-xs">
              {/* Plot Selection */}
              <div>
                <label className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                  1. Selecione o Talhão (GIS)
                </label>
                <select
                  value={newOSPlotId}
                  onChange={(e) => setNewOSPlotId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 font-semibold text-emerald-950 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                >
                  {plots.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} • {p.farmName} ({p.crop} - {p.hectares} ha) - {p.cityState || 'Rio Verde - GO'}
                    </option>
                  ))}
                </select>
                {selectedPlot && (() => {
                  const matchedClient = clients?.find(c => 
                    c.name === selectedPlot?.clientName || 
                    c.farmNames?.some(f => f.toLowerCase() === selectedPlot?.farmName?.toLowerCase())
                  );
                  return (
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1">
                      📍 Cidade Meteorológica de Referência: <strong>{matchedClient?.cityState || selectedPlot.cityState || 'Rio Verde - GO'}</strong>
                      <span className="text-[10px] text-slate-500 font-normal">
                        ({matchedClient?.cityState ? `Vinculada ao Cadastro do Cliente: ${matchedClient.name}` : `Vinculada ao Talhão: ${selectedPlot.name}`})
                      </span>
                    </p>
                  );
                })()}
              </div>

              {/* Technical Target */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                    2. Alvo Agronômico
                  </label>
                  <input
                    type="text"
                    value={newOSTargetPest}
                    onChange={(e) => setNewOSTargetPest(e.target.value)}
                    placeholder="Ex: Fungicida Ferrugem + Adjuvante"
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 font-semibold text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                    3. Taxa de Calda (L/ha)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    max="500"
                    value={newOSSprayRate || ''}
                    placeholder="0"
                    onChange={(e) => setNewOSSprayRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 font-semibold text-emerald-950 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Triad Allocation: Drone, Pilot, Assistant */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                    4. Drone Agrícola
                  </label>
                  <select
                    value={newOSDroneId}
                    onChange={(e) => setNewOSDroneId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 font-semibold text-emerald-950 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {drones.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.modelName} ({d.anacPrefix})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                    5. Piloto Remoto (DECEA)
                  </label>
                  <select
                    value={newOSPilotId}
                    onChange={(e) => setNewOSPilotId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 font-semibold text-emerald-950 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {pilots.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatBRL(p.commissionRatePerHa)}/ha)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-200 block mb-1">
                    6. Auxiliar de Solo (NR-31)
                  </label>
                  <select
                    value={newOSAssistantId}
                    onChange={(e) => setNewOSAssistantId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 font-semibold text-emerald-950 dark:text-emerald-50 focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {assistants.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatBRL(a.commissionRatePerHa)}/ha)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected Drone Visual Card */}
                {selectedDrone && (
                  <div className="sm:col-span-3 p-3 rounded-2xl bg-emerald-100/70 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <DronePhoto
                        drone={selectedDrone}
                        size="md"
                        rounded="rounded-xl"
                        className="border border-emerald-300 dark:border-emerald-600 shadow-2xs flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-mono font-bold text-emerald-700 dark:text-emerald-400 block">
                          Aeronave Homologada SISANT: {selectedDrone.anacPrefix}
                        </span>
                        <strong className="text-emerald-950 dark:text-white text-xs truncate block">
                          {selectedDrone.modelName}
                        </strong>
                        <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                          Tanque: {selectedDrone.tankCapacityL}L • Carga Útil: {selectedDrone.maxPayloadKg}kg • Bateria: {selectedDrone.batteryStatusPct}%
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex-shrink-0">
                      {selectedDrone.operationalStatus === 'READY' ? 'PRONTO' : 'ALOCADO'}
                    </span>
                  </div>
                )}
              </div>

              {/* Calculated Summary Box */}
              <div className="p-4 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="font-black text-emerald-950 dark:text-emerald-300 block">
                  Resumo Financeiro da Ordem de Serviço
                </span>
                <div className="grid grid-cols-3 gap-2 text-[11px] text-emerald-800/90 dark:text-emerald-300/90">
                  <div>
                    <span>Área Total:</span>
                    <strong className="block text-emerald-950 dark:text-white font-bold">{formatHectares(selectedPlot?.hectares || 0)}</strong>
                  </div>
                  <div>
                    <span>Faturamento Estimado:</span>
                    <strong className="block text-emerald-950 dark:text-white font-bold">{formatBRL(estimatedGrossValue)}</strong>
                  </div>
                  <div>
                    <span>Comissão Tripulação:</span>
                    <strong className="block text-emerald-950 dark:text-white font-bold">{formatBRL(estimatedPilotComm + estimatedAssistComm)}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewOSModal(false)}
                  className="px-4 py-2.5 rounded-xl font-bold bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200/80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BRANDED CERTIFICATE MODAL (WHITE LABEL PREVIEW) */}
      {selectedCertificateOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-emerald-50/95 dark:bg-[#072a1e] border border-emerald-200/90 dark:border-emerald-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header with actions */}
            <div className="print:hidden flex items-center justify-between border-b border-emerald-200 dark:border-emerald-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-200/80 dark:bg-emerald-950 flex items-center justify-center text-emerald-800 dark:text-emerald-300">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-emerald-950 dark:text-white text-base">
                    Certificado Oficial de Aplicação Aeroagrícola
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Documento emitido com a Identidade Visual personalizada da sua empresa
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCertificateOrder(null)}
                className="w-8 h-8 rounded-full hover:bg-emerald-100 dark:hover:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The Document Printable Preview */}
            <div 
              id="printable-certificate-document"
              className="printable-document bg-white text-slate-900 p-8 rounded-2xl border-2 shadow-xs space-y-6"
              style={{ 
                borderColor: theme?.primaryColor || '#059669',
                fontFamily: theme?.fontFamily ? `"${theme.fontFamily}", sans-serif` : 'inherit'
              }}
            >
              {/* Document Header with Custom Brand */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-3.5">
                  <BrandLogo
                    theme={theme || ({ primaryColor: '#059669', companyName: 'AeroAgro' } as WhiteLabelTheme)}
                    size="md"
                    className="w-12 h-12 shrink-0"
                  />
                  <div>
                    <h4 className="text-lg font-black tracking-tight" style={{ color: theme?.primaryColor || '#059669' }}>
                      {theme?.companyName || 'AeroAgro Tecnologia de Pulverização'}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {theme?.tagline || 'Excelência em Aviação Agrícola Remota'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {theme?.registryCreaMapa || 'MAPA/SDA nº 18.942/2025 • ART CREA-MT 2026-8914'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase text-white tracking-wider" style={{ backgroundColor: theme?.primaryColor || '#059669' }}>
                    CERTIFICADO VÁLIDO
                  </span>
                  <p className="text-xs font-mono text-slate-500 mt-1">
                    OS: {selectedCertificateOrder.code}
                  </p>
                </div>
              </div>

              {/* Document Content Details */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-emerald-800/70 block text-[10px] font-semibold">PRODUTOR / CLIENTE</span>
                  <span className="font-bold text-slate-900">{selectedCertificateOrder.clientName}</span>
                </div>
                <div>
                  <span className="text-emerald-800/70 block text-[10px] font-semibold">FAZENDA & TALHÃO</span>
                  <span className="font-bold text-slate-900">{selectedCertificateOrder.farmName} • {selectedCertificateOrder.plotName}</span>
                </div>
                <div>
                  <span className="text-emerald-800/70 block text-[10px] font-semibold">ÁREA TRATADA</span>
                  <span className="font-bold text-slate-900">{String(selectedCertificateOrder.targetHectares).replace('.', ',')} Hectares</span>
                </div>
                <div>
                  <span className="text-emerald-800/70 block text-[10px] font-semibold">DATA DA OPERAÇÃO</span>
                  <span className="font-bold text-slate-900">{selectedCertificateOrder.scheduledDate}</span>
                </div>
              </div>

              {/* Agronomic and Flight Parameters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-emerald-200/80 space-y-2 bg-emerald-50/30">
                  <h5 className="font-bold text-emerald-950 text-xs border-b border-emerald-200/60 pb-1">Parâmetros Agronômicos</h5>
                  <p><span className="text-slate-500">Cultura:</span> <strong className="text-slate-900">{selectedCertificateOrder.crop}</strong></p>
                  <p><span className="text-slate-500">Alvo Biológico:</span> <strong className="text-slate-900">{selectedCertificateOrder.targetPestOrGoal}</strong></p>
                  <p><span className="text-slate-500">Volume de Calda:</span> <strong className="text-slate-900">{String(selectedCertificateOrder.sprayRateLHa).replace('.', ',')} L/ha</strong></p>
                  <p><span className="text-slate-500">Taxa de Aplicação:</span> <strong className="text-slate-900">{String(selectedCertificateOrder.sprayRateLHa * selectedCertificateOrder.targetHectares).replace('.', ',')} Litros Totais</strong></p>
                </div>
                <div className="p-4 rounded-xl border border-emerald-200/80 space-y-2 bg-emerald-50/30">
                  <h5 className="font-bold text-emerald-950 text-xs border-b border-emerald-200/60 pb-1">Equipe Técnica Responsável</h5>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Aeronave Remota:</span>
                    <DroneBadge
                      droneModel={selectedCertificateOrder.droneModel}
                      droneAnac={selectedCertificateOrder.droneAnac}
                      photoUrl={selectedCertificateOrder.dronePhotoUrl}
                      size="xs"
                    />
                  </div>
                  <p><span className="text-slate-500">Piloto Remoto:</span> <strong className="text-slate-900">{selectedCertificateOrder.pilotName} (DECEA Habilitado)</strong></p>
                  <p><span className="text-slate-500">Auxiliar de Operação:</span> <strong className="text-slate-900">{selectedCertificateOrder.assistantName}</strong></p>
                  <p><span className="text-slate-500">Contato Operacional:</span> <strong className="text-slate-900">{theme?.contactPhone || '(65) 99841-3200'}</strong></p>
                </div>
              </div>

              {/* Legal Signatures */}
              <div className="pt-6 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">{selectedCertificateOrder.pilotName}</p>
                  <p className="text-[10px] text-slate-500">Piloto Agrícola Remoto • Resp. Técnico</p>
                </div>
                <div>
                  <div className="border-b border-slate-400 w-48 mx-auto mb-1"></div>
                  <p className="font-bold text-slate-800">{selectedCertificateOrder.clientName}</p>
                  <p className="text-[10px] text-slate-500">Produtor Rural / Contratante</p>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="print:hidden flex items-center justify-between pt-2">
              <span className="text-xs text-emerald-800/80 dark:text-emerald-300/80 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Certificado conforme Instrução Normativa MAPA nº 19/2021
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCertificateOrder(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-100/80 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-300 hover:bg-emerald-200/80 cursor-pointer"
                >
                  Fechar
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir / Baixar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOMIZABLE SPRAY REPORT MODAL WITH IMAGE PASTING */}
      <SprayReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        serviceOrders={orders}
        selectedOrderId={reportSelectedOrderId}
        theme={theme}
        currentUser={currentUser}
        plots={plots}
        drones={drones}
        pilots={pilots}
        assistants={assistants}
      />
    </div>
  );
};
