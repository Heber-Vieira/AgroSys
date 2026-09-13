import React, { useState } from 'react';
import { 
  UserProfile, 
  AgriculturalDrone, 
  DroneBatteryAsset, 
  CrewPilot, 
  CrewAssistant, 
  DroneMaintenanceLog, 
  WhiteLabelTheme 
} from '../types';
import { 
  Plane, 
  ShieldCheck, 
  BatteryCharging, 
  Wrench, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Clock,
  UserCheck,
  Camera,
  FileText,
  DollarSign,
  Zap
} from 'lucide-react';
import { DronePhoto, DroneBadge, DronePhotoUploadModal } from './DronePhotoBadge';
import { UserAvatar, UserPhotoUploadModal, saveStoredUserPhoto } from './UserAvatar';
import { DroneMaintenanceModal } from './DroneMaintenanceModal';
import { formatBRL } from '../utils/formatters';

interface FleetDronesViewProps {
  currentUser: UserProfile;
  drones: AgriculturalDrone[];
  setDrones?: React.Dispatch<React.SetStateAction<AgriculturalDrone[]>>;
  batteries?: DroneBatteryAsset[];
  setBatteries?: React.Dispatch<React.SetStateAction<DroneBatteryAsset[]>>;
  onOpenBatteryManager?: (droneId?: string) => void;
  pilots: CrewPilot[];
  setPilots?: React.Dispatch<React.SetStateAction<CrewPilot[]>>;
  assistants: CrewAssistant[];
  setAssistants?: React.Dispatch<React.SetStateAction<CrewAssistant[]>>;
  maintenanceLogs?: DroneMaintenanceLog[];
  setMaintenanceLogs?: React.Dispatch<React.SetStateAction<DroneMaintenanceLog[]>>;
  theme?: WhiteLabelTheme;
  onOpenAdminManagement?: () => void;
  onOpenBatteryAlerts?: () => void;
}

export const FleetDronesView: React.FC<FleetDronesViewProps> = ({
  currentUser,
  drones,
  setDrones,
  batteries = [],
  setBatteries,
  onOpenBatteryManager,
  pilots,
  setPilots,
  assistants,
  setAssistants,
  maintenanceLogs = [],
  setMaintenanceLogs,
  theme,
  onOpenAdminManagement,
  onOpenBatteryAlerts,
}) => {
  const [activeUploadDrone, setActiveUploadDrone] = useState<AgriculturalDrone | null>(null);
  const [activeUploadCrew, setActiveUploadCrew] = useState<{ person: CrewPilot | CrewAssistant; role: 'PILOT' | 'ASSISTANT' } | null>(null);

  // Drone Maintenance Modal State
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState<boolean>(false);
  const [selectedMaintenanceDroneId, setSelectedMaintenanceDroneId] = useState<string | undefined>(undefined);

  const handleOpenMaintenance = (droneId?: string) => {
    setSelectedMaintenanceDroneId(droneId);
    setIsMaintenanceModalOpen(true);
  };

  const handleSaveDronePhoto = (newPhotoUrl: string) => {
    if (!activeUploadDrone) return;
    if (setDrones) {
      setDrones(prev => prev.map(d => d.id === activeUploadDrone.id ? { ...d, photoUrl: newPhotoUrl } : d));
    }
  };

  const handleSaveCrewPhoto = (newPhotoUrl: string) => {
    if (!activeUploadCrew) return;
    const { person, role } = activeUploadCrew;
    saveStoredUserPhoto(person.id, newPhotoUrl, {
      id: person.id,
      name: person.name,
      role: role as any,
      photoUrl: newPhotoUrl,
      avatarUrl: newPhotoUrl,
    });

    if (role === 'PILOT' && setPilots) {
      setPilots(prev => prev.map(p => p.id === person.id ? { ...p, photoUrl: newPhotoUrl, avatarUrl: newPhotoUrl } : p));
    } else if (role === 'ASSISTANT' && setAssistants) {
      setAssistants(prev => prev.map(a => a.id === person.id ? { ...a, photoUrl: newPhotoUrl, avatarUrl: newPhotoUrl } : a));
    }
  };
  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
            <Plane className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Frota Aeroagrícola & Tripulação
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Aeronaves registradas no SISANT (ANAC), autorizações SARPAS (DECEA) e tripulação qualificada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto">
          {onOpenBatteryManager && (
            <button
              onClick={() => onOpenBatteryManager()}
              className="px-3 py-1.5 rounded-lg font-black bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 shadow-2xs text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
              title="Gerenciar, cadastrar e configurar o banco de baterias de cada drone"
            >
              <Zap className="w-3.5 h-3.5 fill-slate-950 text-amber-300" />
              <span>⚡ Banco de Baterias ({batteries.length})</span>
            </button>
          )}

          {onOpenBatteryAlerts && (
            <button
              onClick={onOpenBatteryAlerts}
              className="px-2.5 py-1.5 rounded-lg font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-800 dark:text-amber-300 border border-amber-400/50 text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
              title="Abrir painel de checagem e configuração de alertas de bateria"
            >
              <BatteryCharging className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Alertas & Periodicidade</span>
            </button>
          )}

          <button
            onClick={() => handleOpenMaintenance()}
            className="px-3 py-1.5 rounded-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs border border-emerald-500 text-xs flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            title="Lançar novas manutenções e consultar histórico da frota"
          >
            <Wrench className="w-3.5 h-3.5 text-emerald-100" />
            <span>Gerenciar Manutenções</span>
          </button>

          {(currentUser.role === 'ADMIN' || currentUser.role === 'MASTER' || currentUser.isMaster) && onOpenAdminManagement && (
            <button
              onClick={onOpenAdminManagement}
              className="px-2.5 py-1.5 rounded-lg font-bold bg-white dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Cadastros & Salários (Admin)</span>
            </button>
          )}
        </div>
      </div>

      {/* Drones Section */}
      <div className="space-y-2">
        <h2 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
          <Plane className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Aeronaves Remotamente Pilotadas (RPA Classe 3)
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {drones.map((drone) => {
            const droneBatts = batteries.filter(b => b.droneId === drone.id);
            const avgSoH = droneBatts.length > 0 
              ? Math.round(droneBatts.reduce((a, b) => a + (b.healthPct || 0), 0) / droneBatts.length)
              : (drone.batteryHealthPct || 95);

            return (
            <div
              key={drone.id}
              className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs space-y-2 flex flex-col justify-between"
            >
              {/* Drone Header with Photo */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative group/photo shrink-0 cursor-pointer" onClick={() => setActiveUploadDrone(drone)}>
                      <DronePhoto
                        drone={drone}
                        size="sm"
                        rounded="rounded-lg"
                        className="border border-slate-200 dark:border-slate-700 shadow-2xs transition-transform group-hover/photo:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center text-white" title="Clique para trocar a foto">
                        <Camera className="w-3 h-3 text-emerald-300" />
                      </div>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[9px] font-mono font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block truncate">
                        ANAC: {drone.anacPrefix}
                      </span>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {drone.modelName}
                      </h3>
                      <span className="text-[10px] text-slate-400 truncate block">
                        S/N: {drone.serialNumber}
                      </span>
                    </div>
                  </div>

                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border shrink-0 ${
                    drone.operationalStatus === 'READY'
                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                      : drone.operationalStatus === 'FLYING'
                      ? 'bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border-emerald-400 dark:border-emerald-600 animate-pulse'
                      : drone.operationalStatus === 'CHARGING'
                      ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                      : 'bg-rose-100 dark:rose-950/80 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700'
                  }`}>
                    {drone.operationalStatus === 'READY' && 'PRONTO'}
                    {drone.operationalStatus === 'FLYING' && 'EM VOO'}
                    {drone.operationalStatus === 'CHARGING' && 'CARREGANDO'}
                    {drone.operationalStatus === 'MAINTENANCE' && 'MANUTENÇÃO'}
                  </span>
                </div>

                {/* Drone Specs Grid */}
                <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[8px] block font-semibold">Tanque</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {drone.tankCapacityL}L
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[8px] block font-semibold">Horas Voo</span>
                    <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                      {drone.totalFlightHours.toFixed(1).replace('.', ',')}h
                    </span>
                  </div>

                  <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80">
                    <span className="text-slate-400 text-[8px] block font-semibold flex items-center justify-between">
                      <span>SoH Médio</span>
                    </span>
                    <span className={`text-xs font-black font-mono flex items-center gap-0.5 ${
                      avgSoH >= 85 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      <BatteryCharging className="w-2.5 h-2.5" />
                      {avgSoH}%
                    </span>
                  </div>
                </div>

                {/* Battery Management Card & Action */}
                <div className="p-2 rounded-lg bg-amber-50/60 dark:bg-emerald-950/90 border border-amber-200/70 dark:border-emerald-800/80 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>Banco Baterias:</span>
                    </div>

                    {onOpenBatteryManager && (
                      <button
                        onClick={() => onOpenBatteryManager(drone.id)}
                        className="px-2 py-0.5 rounded font-black bg-amber-500 hover:bg-amber-400 text-slate-950 text-[9px] transition-colors cursor-pointer flex items-center gap-0.5 shadow-2xs"
                        title="Configurar, cadastrar, editar ou excluir baterias deste drone"
                      >
                        <Zap className="w-2.5 h-2.5 fill-slate-950" />
                        <span>Gerenciar ({droneBatts.length})</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/50 dark:border-slate-800/60 text-[9px]">
                    <span className="text-slate-500 dark:text-slate-400">Packs Vinculados:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {droneBatts.length > 0 ? `${droneBatts.length} Smart Packs` : 'Nenhum pack'}
                    </span>
                  </div>
                </div>

                {/* Maintenance Bar & Actions */}
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-[10px]">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200 text-[10px]">
                      <Wrench className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Manutenção</span>
                    </div>

                    <button
                      onClick={() => handleOpenMaintenance(drone.id)}
                      className="px-1.5 py-0.5 rounded font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] transition-colors cursor-pointer flex items-center gap-0.5 shadow-2xs"
                      title="Lançar manutenção para este drone"
                    >
                      <Wrench className="w-2.5 h-2.5" />
                      <span>Lançar</span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[9px]">
                    <span className="text-slate-400">Próxima:</span>
                    <span className={`font-mono font-bold ${
                      drone.nextMaintenanceHours <= 30
                        ? 'text-amber-600 dark:text-amber-400 animate-pulse'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}>
                      {drone.nextMaintenanceHours <= 0 ? 'VENCIDA' : `Em ${drone.nextMaintenanceHours.toFixed(1).replace('.', ',')}h`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Regulatory Badges */}
              <div className="pt-1.5 flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 dark:border-slate-700/60">
                <span className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 truncate">
                  <ShieldCheck className="w-2.5 h-2.5" /> Seguro RETA OK
                </span>
                <span className="font-mono">Cap: {drone.maxPayloadKg}kg</span>
              </div>
            </div>
          );
          })}
        </div>
      </div>

      {/* Crew Section: Pilots & Assistants */}
      <div className="space-y-2 pt-1">
        <h2 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Tripulação Remota & Operadores de Solo
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Pilots */}
          <div className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs space-y-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700/80">
              <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Pilotos Remotos (DECEA / ANAC / MAPA)
            </h3>

            <div className="space-y-1.5">
              {pilots.map((pilot) => (
                <div
                  key={pilot.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        onClick={() => setActiveUploadCrew({ person: pilot, role: 'PILOT' })}
                        className="relative group/avatar cursor-pointer shrink-0"
                        title="Clique para alterar a foto do piloto"
                      >
                        <UserAvatar
                          user={pilot}
                          size="sm"
                          editable
                          onEditClick={() => setActiveUploadCrew({ person: pilot, role: 'PILOT' })}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{pilot.name}</h4>
                        <span className="text-[9px] text-slate-400 font-mono truncate block">
                          DECEA: {pilot.deceaLicense}
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[9px] border border-emerald-200 dark:border-emerald-700 shrink-0">
                      CMA: {pilot.cmaExpiration}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[9px] pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-slate-400">
                    <div>
                      <span>Contato:</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate block">{pilot.phone}</strong>
                    </div>
                    <div>
                      <span>Horas:</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono block">{pilot.totalHoursFlown}h</strong>
                    </div>
                    <div>
                      {(currentUser.role === 'ADMIN' || currentUser.role === 'MASTER' || currentUser.isMaster) ? (
                        <>
                          <span>Comissão:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono block">{formatBRL(pilot.commissionRatePerHa)}/ha</strong>
                        </>
                      ) : (
                        <>
                          <span>Qualificação:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold block truncate">ANAC/DECEA OK</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assistants */}
          <div className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3 shadow-2xs space-y-2">
            <h3 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-700/80">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Auxiliares de Calda & Solo (NR-31)
            </h3>

            <div className="space-y-1.5">
              {assistants.map((assistant) => (
                <div
                  key={assistant.id}
                  className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-700/80 space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        onClick={() => setActiveUploadCrew({ person: assistant, role: 'ASSISTANT' })}
                        className="relative group/avatar cursor-pointer shrink-0"
                        title="Clique para alterar a foto do auxiliar"
                      >
                        <UserAvatar
                          user={assistant}
                          size="sm"
                          editable
                          onEditClick={() => setActiveUploadCrew({ person: assistant, role: 'ASSISTANT' })}
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">{assistant.name}</h4>
                        <span className="text-[9px] text-slate-400 truncate block">
                          CPF: {assistant.cpf}
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[9px] border border-emerald-200 dark:border-emerald-700 shrink-0">
                      {assistant.nr31Certified ? 'NR-31 OK' : 'PENDENTE'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[9px] pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-slate-400">
                    <div>
                      <span>Status:</span>
                      <strong className="text-slate-700 dark:text-slate-300 truncate block">{assistant.available ? 'Disponível em Campo' : 'Em Treinamento'}</strong>
                    </div>
                    <div>
                      {(currentUser.role === 'ADMIN' || currentUser.role === 'MASTER' || currentUser.isMaster) ? (
                        <>
                          <span>Comissão Solo:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-mono block">{formatBRL(assistant.commissionRatePerHa)}/ha</strong>
                        </>
                      ) : (
                        <>
                          <span>Capacitação:</span>
                          <strong className="text-emerald-600 dark:text-emerald-400 font-bold block truncate">Apoio NR-31 Apto</strong>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Drone Maintenance Modal */}
      <DroneMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        drones={drones}
        setDrones={setDrones}
        logs={maintenanceLogs}
        setLogs={setMaintenanceLogs}
        selectedDroneId={selectedMaintenanceDroneId}
        currentUser={currentUser}
        theme={theme}
      />

      {/* Drone Photo Upload Modal */}
      <DronePhotoUploadModal
        isOpen={Boolean(activeUploadDrone)}
        onClose={() => setActiveUploadDrone(null)}
        drone={activeUploadDrone}
        onSavePhoto={handleSaveDronePhoto}
      />

      {/* Crew Photo Upload Modal (Pilots & Assistants) */}
      <UserPhotoUploadModal
        isOpen={Boolean(activeUploadCrew)}
        onClose={() => setActiveUploadCrew(null)}
        user={activeUploadCrew ? {
          id: activeUploadCrew.person.id,
          name: activeUploadCrew.person.name,
          role: activeUploadCrew.role,
          roleLabel: activeUploadCrew.role === 'PILOT' ? 'Piloto Remoto' : 'Auxiliar de Solo',
          email: '',
          badge: activeUploadCrew.role === 'PILOT' ? 'Piloto DECEA' : 'NR-31',
          photoUrl: activeUploadCrew.person.photoUrl,
        } as UserProfile : null}
        onSavePhoto={handleSaveCrewPhoto}
        title={activeUploadCrew?.role === 'PILOT' ? 'Alterar Foto do Piloto' : 'Alterar Foto do Auxiliar'}
      />
    </div>
  );
};
