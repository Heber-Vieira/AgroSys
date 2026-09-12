import React from 'react';
import { 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Calendar as CalendarIcon, 
  Clock, 
  Edit2, 
  ArrowRight, 
  Sparkles, 
  AlertTriangle,
  User,
  Plane,
  MapPin
} from 'lucide-react';
import { ServiceOrder, ScheduleConflict, CrewPilot, AgriculturalDrone } from '../../types';
import { findAvailableTimeSlots, timeStringToMinutes } from '../../services/scheduleConflictService';

interface ScheduleConflictsModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: ServiceOrder[];
  conflictsMap: Map<string, ScheduleConflict[]>;
  onSelectOrderToEdit: (order: ServiceOrder) => void;
  onJumpToDate: (dateStr: string) => void;
  onAutoResolveConflict: (orderId: string, newStartTime: string, newEndTime: string) => void;
  pilots: CrewPilot[];
  drones: AgriculturalDrone[];
}

export const ScheduleConflictsModal: React.FC<ScheduleConflictsModalProps> = ({
  isOpen,
  onClose,
  orders,
  conflictsMap,
  onSelectOrderToEdit,
  onJumpToDate,
  onAutoResolveConflict,
  pilots,
  drones
}) => {
  if (!isOpen) return null;

  // Extract unique conflict pairs from conflictsMap
  const processedPairs = new Set<string>();
  const conflictItems: {
    orderA: ServiceOrder;
    orderB?: ServiceOrder;
    conflict: ScheduleConflict;
  }[] = [];

  conflictsMap.forEach((conflictList, orderId) => {
    const orderA = orders.find(o => o.id === orderId);
    if (!orderA) return;

    conflictList.forEach(c => {
      const pairKey = [orderId, c.conflictingOrderId].sort().join('___');
      if (!processedPairs.has(pairKey)) {
        processedPairs.add(pairKey);
        const orderB = orders.find(o => o.id === c.conflictingOrderId);
        conflictItems.push({
          orderA,
          orderB,
          conflict: c
        });
      }
    });
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#072a1e] rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-emerald-200/70 dark:border-emerald-800/70 flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/80">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              conflictItems.length > 0 
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800' 
                : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
            }`}>
              {conflictItems.length > 0 ? (
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Central de Conflitos da Agenda
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                  conflictItems.length > 0 
                    ? 'bg-rose-600 text-white' 
                    : 'bg-emerald-600 text-white'
                }`}>
                  {conflictItems.length} {conflictItems.length === 1 ? 'conflito' : 'conflitos'}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80 font-medium">
                Detecção em tempo real de sobreposição de pilotos, drones e talhões.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {conflictItems.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                Nenhum Conflito Encontrado!
              </h4>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80 max-w-md mx-auto font-medium">
                Todos os agendamentos da sua frota estão devidamente sincronizados, sem colisão de horário entre pilotos ou aeronaves.
              </p>
            </div>
          ) : (
            conflictItems.map(({ orderA, orderB, conflict }, idx) => {
              // Calculate available free slots for orderB to resolve conflict
              const startA = timeStringToMinutes(orderA.startTime || '07:00');
              const endA = timeStringToMinutes(orderA.endTime || '09:30');
              const durationMin = Math.max(30, endA - startA);

              const suggestions = findAvailableTimeSlots(
                orderA.scheduledDate,
                durationMin,
                orderA.pilotId,
                orderA.droneId,
                orders,
                orderA.id
              );

              return (
                <div 
                  key={idx}
                  className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3"
                >
                  {/* Conflict Type Header */}
                  <div className="flex items-center justify-between gap-2 border-b border-rose-200/60 dark:border-rose-900/40 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Conflito de {conflict.type === 'PILOT' ? 'Piloto' : conflict.type === 'DRONE' ? 'Drone' : 'Talhão'}
                      </span>
                      <span className="text-xs font-bold text-rose-950 dark:text-rose-200">
                        {conflict.resourceName}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onJumpToDate(orderA.scheduledDate);
                        onClose();
                      }}
                      className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      Ir para {orderA.scheduledDate}
                    </button>
                  </div>

                  {/* Conflict Description */}
                  <p className="text-xs text-rose-900 dark:text-rose-300 font-semibold leading-relaxed">
                    {conflict.description}
                  </p>

                  {/* Side-by-side Conflicting Orders */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Order A Card */}
                    <div className="p-3 rounded-lg bg-white dark:bg-[#041c14] border border-rose-200 dark:border-rose-900/80 shadow-2xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {orderA.code}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-rose-600" />
                          {orderA.startTime} - {orderA.endTime}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                        <div className="font-medium truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                          {orderA.farmName} • {orderA.plotName}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          👨‍✈️ {orderA.pilotName} | 🛸 {orderA.droneModel}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          onSelectOrderToEdit(orderA);
                          onClose();
                        }}
                        className="w-full mt-2 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        Editar {orderA.code}
                      </button>
                    </div>

                    {/* Order B Card */}
                    {orderB && (
                      <div className="p-3 rounded-lg bg-white dark:bg-[#041c14] border border-rose-200 dark:border-rose-900/80 shadow-2xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {orderB.code}
                          </span>
                          <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-rose-600" />
                            {orderB.startTime} - {orderB.endTime}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                          <div className="font-medium truncate flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                            {orderB.farmName} • {orderB.plotName}
                          </div>
                          <div className="text-[10px] text-slate-500 truncate">
                            👨‍✈️ {orderB.pilotName} | 🛸 {orderB.droneModel}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            onSelectOrderToEdit(orderB);
                            onClose();
                          }}
                          className="w-full mt-2 py-1 px-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          Editar {orderB.code}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Auto-Resolution Suggestions */}
                  {suggestions.length > 0 && orderB && (
                    <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950 dark:text-white">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Sugestão Inteligente de Reagendamento Sem Conflito:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.slice(0, 3).map((slot, sIdx) => (
                          <button
                            key={sIdx}
                            onClick={() => {
                              onAutoResolveConflict(orderB.id, slot.startTime, slot.endTime);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Clock className="w-3 h-3" />
                            <span>Mover {orderB.code} para {slot.startTime} às {slot.endTime}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-emerald-200/70 dark:border-emerald-800/70 bg-slate-50 dark:bg-[#041c14] flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-emerald-300/80 font-medium">
            AgroSys Conflict Engine v2.4
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-800 dark:text-emerald-100 font-extrabold text-xs hover:bg-slate-300 dark:hover:bg-emerald-800 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
