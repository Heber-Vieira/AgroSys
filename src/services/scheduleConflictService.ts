/**
 * Spray Schedule Conflict & Resource Synchronization Engine
 * Detects and prevents overlapping schedules for Pilots, Drones, and Farm Plots
 * with minute-precision interval arithmetic and automated slot resolution.
 */

import { ServiceOrder, ScheduleConflict, SuggestedTimeSlot, AgriculturalDrone, CrewPilot } from '../types';

export interface ConflictCheckResult {
  hasConflict: boolean;
  hasPilotConflict: boolean;
  hasDroneConflict: boolean;
  hasPlotConflict: boolean;
  conflicts: ScheduleConflict[];
  summaryMessage: string;
}

/**
 * Converts 'HH:mm' string to minutes from midnight
 */
export function timeStringToMinutes(timeStr?: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0] || '0', 10);
  const minutes = parseInt(parts[1] || '0', 10);
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight back to 'HH:mm'
 */
export function minutesToTimeString(minutes: number): string {
  const norm = Math.max(0, Math.min(24 * 60 - 1, Math.round(minutes)));
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Checks if two time intervals overlap (with optional buffer minutes)
 */
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number,
  bufferMinutes: number = 0
): boolean {
  const bufferedStartA = startA;
  const bufferedEndA = endA + bufferMinutes;
  const bufferedStartB = startB;
  const bufferedEndB = endB + bufferMinutes;

  return Math.max(bufferedStartA, bufferedStartB) < Math.min(bufferedEndA, bufferedEndB);
}

/**
 * Validates whether an order (new or edited) conflicts with any existing order in the fleet
 */
export function checkOrderConflicts(
  target: {
    id?: string;
    scheduledDate: string;
    startTime?: string;
    endTime?: string;
    pilotId?: string;
    pilotName?: string;
    droneId?: string;
    droneModel?: string;
    plotId?: string;
    plotName?: string;
  },
  existingOrders: ServiceOrder[],
  options?: {
    bufferMinutes?: number;
    ignoreStatus?: string[];
  }
): ConflictCheckResult {
  const buffer = options?.bufferMinutes ?? 15; // 15-min battery/transit safety margin
  const ignoreStatus = options?.ignoreStatus ?? ['CANCELLED'];

  const targetStart = timeStringToMinutes(target.startTime || '07:00');
  const targetEnd = timeStringToMinutes(target.endTime || '09:30');
  const targetDate = target.scheduledDate;

  const conflicts: ScheduleConflict[] = [];

  for (const order of existingOrders) {
    // Don't compare order with itself
    if (target.id && order.id === target.id) continue;

    // Ignore cancelled orders
    if (ignoreStatus.includes(order.status)) continue;

    // Must be on the exact same calendar date
    if (order.scheduledDate !== targetDate) continue;

    const orderStart = timeStringToMinutes(order.startTime || '07:00');
    const orderEnd = timeStringToMinutes(order.endTime || '09:30');

    // Check time overlap
    const isOverlapping = intervalsOverlap(targetStart, targetEnd, orderStart, orderEnd, buffer);

    if (!isOverlapping) continue;

    // 1. Check Pilot Collision
    if (target.pilotId && order.pilotId && target.pilotId === order.pilotId) {
      conflicts.push({
        id: `conflict-pilot-${order.id}`,
        type: 'PILOT',
        severity: 'CRITICAL_BLOCK',
        resourceId: target.pilotId,
        resourceName: target.pilotName || order.pilotName,
        conflictingOrderCode: order.code,
        conflictingOrderId: order.id,
        conflictingFarmName: order.farmName,
        conflictingPlotName: order.plotName,
        conflictingTimeRange: `${order.startTime || '07:00'} - ${order.endTime || '09:30'}`,
        description: `Piloto ${target.pilotName || order.pilotName} já está escalado na ${order.code} (${order.startTime || '07:00'} às ${order.endTime || '09:30'}) na ${order.farmName}.`,
      });
    }

    // 2. Check Drone Collision
    if (target.droneId && order.droneId && target.droneId === order.droneId) {
      conflicts.push({
        id: `conflict-drone-${order.id}`,
        type: 'DRONE',
        severity: 'CRITICAL_BLOCK',
        resourceId: target.droneId,
        resourceName: target.droneModel || order.droneModel,
        conflictingOrderCode: order.code,
        conflictingOrderId: order.id,
        conflictingFarmName: order.farmName,
        conflictingPlotName: order.plotName,
        conflictingTimeRange: `${order.startTime || '07:00'} - ${order.endTime || '09:30'}`,
        description: `Drone ${target.droneModel || order.droneModel} está alocado na ${order.code} (${order.startTime || '07:00'} às ${order.endTime || '09:30'}) no talhão ${order.plotName}.`,
      });
    }

    // 3. Check Plot Duplicate Collision
    if (target.plotId && order.plotId && target.plotId === order.plotId) {
      conflicts.push({
        id: `conflict-plot-${order.id}`,
        type: 'PLOT',
        severity: 'WARNING',
        resourceId: target.plotId,
        resourceName: target.plotName || order.plotName,
        conflictingOrderCode: order.code,
        conflictingOrderId: order.id,
        conflictingFarmName: order.farmName,
        conflictingPlotName: order.plotName,
        conflictingTimeRange: `${order.startTime || '07:00'} - ${order.endTime || '09:30'}`,
        description: `O talhão ${order.plotName} já possui aplicação simultânea na ${order.code}.`,
      });
    }
  }

  const hasPilotConflict = conflicts.some(c => c.type === 'PILOT');
  const hasDroneConflict = conflicts.some(c => c.type === 'DRONE');
  const hasPlotConflict = conflicts.some(c => c.type === 'PLOT');

  let summaryMessage = '';
  if (conflicts.length > 0) {
    const parts = [];
    if (hasPilotConflict) parts.push('sobreposição de piloto');
    if (hasDroneConflict) parts.push('sobreposição de drone');
    if (hasPlotConflict) parts.push('conflito de talhão');
    summaryMessage = `Alerta de conflito: ${parts.join(' e ')} detectado!`;
  }

  return {
    hasConflict: conflicts.length > 0,
    hasPilotConflict,
    hasDroneConflict,
    hasPlotConflict,
    conflicts,
    summaryMessage,
  };
}

/**
 * Finds all global conflicts among an array of orders
 */
export function detectAllScheduleCollisions(orders: ServiceOrder[]): Map<string, ScheduleConflict[]> {
  const conflictMap = new Map<string, ScheduleConflict[]>();

  for (let i = 0; i < orders.length; i++) {
    const orderA = orders[i];
    if (orderA.status === 'CANCELLED') continue;

    for (let j = i + 1; j < orders.length; j++) {
      const orderB = orders[j];
      if (orderB.status === 'CANCELLED') continue;

      if (orderA.scheduledDate !== orderB.scheduledDate) continue;

      const startA = timeStringToMinutes(orderA.startTime || '07:00');
      const endA = timeStringToMinutes(orderA.endTime || '09:30');
      const startB = timeStringToMinutes(orderB.startTime || '07:00');
      const endB = timeStringToMinutes(orderB.endTime || '09:30');

      if (intervalsOverlap(startA, endA, startB, endB, 10)) {
        // Pilot overlap
        if (orderA.pilotId && orderB.pilotId && orderA.pilotId === orderB.pilotId) {
          const conflictA: ScheduleConflict = {
            id: `c-pilot-${orderA.id}-${orderB.id}`,
            type: 'PILOT',
            severity: 'CRITICAL_BLOCK',
            resourceId: orderA.pilotId,
            resourceName: orderA.pilotName,
            conflictingOrderCode: orderB.code,
            conflictingOrderId: orderB.id,
            conflictingFarmName: orderB.farmName,
            conflictingPlotName: orderB.plotName,
            conflictingTimeRange: `${orderB.startTime || '07:00'} - ${orderB.endTime || '09:30'}`,
            description: `Piloto ${orderA.pilotName} escalado simultaneamente na ${orderB.code}.`,
          };
          const existing = conflictMap.get(orderA.id) || [];
          conflictMap.set(orderA.id, [...existing, conflictA]);

          const conflictB: ScheduleConflict = {
            id: `c-pilot-${orderB.id}-${orderA.id}`,
            type: 'PILOT',
            severity: 'CRITICAL_BLOCK',
            resourceId: orderB.pilotId,
            resourceName: orderB.pilotName,
            conflictingOrderCode: orderA.code,
            conflictingOrderId: orderA.id,
            conflictingFarmName: orderA.farmName,
            conflictingPlotName: orderA.plotName,
            conflictingTimeRange: `${orderA.startTime || '07:00'} - ${orderA.endTime || '09:30'}`,
            description: `Piloto ${orderB.pilotName} escalado simultaneamente na ${orderA.code}.`,
          };
          const existingB = conflictMap.get(orderB.id) || [];
          conflictMap.set(orderB.id, [...existingB, conflictB]);
        }

        // Drone overlap
        if (orderA.droneId && orderB.droneId && orderA.droneId === orderB.droneId) {
          const conflictA: ScheduleConflict = {
            id: `c-drone-${orderA.id}-${orderB.id}`,
            type: 'DRONE',
            severity: 'CRITICAL_BLOCK',
            resourceId: orderA.droneId,
            resourceName: orderA.droneModel,
            conflictingOrderCode: orderB.code,
            conflictingOrderId: orderB.id,
            conflictingFarmName: orderB.farmName,
            conflictingPlotName: orderB.plotName,
            conflictingTimeRange: `${orderB.startTime || '07:00'} - ${orderB.endTime || '09:30'}`,
            description: `Drone ${orderA.droneModel} alocado simultaneamente na ${orderB.code}.`,
          };
          const existing = conflictMap.get(orderA.id) || [];
          conflictMap.set(orderA.id, [...existing, conflictA]);

          const conflictB: ScheduleConflict = {
            id: `c-drone-${orderB.id}-${orderA.id}`,
            type: 'DRONE',
            severity: 'CRITICAL_BLOCK',
            resourceId: orderB.droneId,
            resourceName: orderB.droneModel,
            conflictingOrderCode: orderA.code,
            conflictingOrderId: orderA.id,
            conflictingFarmName: orderA.farmName,
            conflictingPlotName: orderA.plotName,
            conflictingTimeRange: `${orderA.startTime || '07:00'} - ${orderA.endTime || '09:30'}`,
            description: `Drone ${orderB.droneModel} alocado simultaneamente na ${orderA.code}.`,
          };
          const existingB = conflictMap.get(orderB.id) || [];
          conflictMap.set(orderB.id, [...existingB, conflictB]);
        }
      }
    }
  }

  return conflictMap;
}

/**
 * Intelligent slot suggester: Finds next conflict-free windows for a pilot and drone
 */
export function findAvailableTimeSlots(
  date: string,
  durationMinutes: number,
  pilotId: string,
  droneId: string,
  existingOrders: ServiceOrder[],
  excludeOrderId?: string
): SuggestedTimeSlot[] {
  // Operational day window: 06:00 to 18:00 (360 min to 1080 min)
  const DAY_START = 6 * 60; // 06:00
  const DAY_END = 18 * 60;  // 18:00
  const STEP = 30; // 30-minute intervals

  const suggestions: SuggestedTimeSlot[] = [];

  // Filter orders for that date and exclude current
  const dayOrders = existingOrders.filter(
    o => o.scheduledDate === date && o.status !== 'CANCELLED' && o.id !== excludeOrderId
  );

  for (let candidateStart = DAY_START; candidateStart + durationMinutes <= DAY_END; candidateStart += STEP) {
    const candidateEnd = candidateStart + durationMinutes;

    // Check if this slot has any conflict with pilot or drone
    let isFree = true;
    for (const ord of dayOrders) {
      const ordStart = timeStringToMinutes(ord.startTime || '07:00');
      const ordEnd = timeStringToMinutes(ord.endTime || '09:30');

      if (intervalsOverlap(candidateStart, candidateEnd, ordStart, ordEnd, 15)) {
        if (ord.pilotId === pilotId || ord.droneId === droneId) {
          isFree = false;
          break;
        }
      }
    }

    if (isFree) {
      const startStr = minutesToTimeString(candidateStart);
      const endStr = minutesToTimeString(candidateEnd);

      // Simple heuristic for morning/afternoon spray window
      const isMorningGoldenWindow = candidateStart >= 360 && candidateEnd <= 600; // 06:00 - 10:00
      const isLateAfternoonWindow = candidateStart >= 960 && candidateEnd <= 1080; // 16:00 - 18:00

      let reason = 'Janela livre sem sobreposição de piloto ou drone';
      if (isMorningGoldenWindow) {
        reason = 'Janela de Ouro Matutina (Vento Calmo & Delta T Ideal)';
      } else if (isLateAfternoonWindow) {
        reason = 'Janela Vespertina de Aplicação';
      }

      suggestions.push({
        startTime: startStr,
        endTime: endStr,
        date,
        label: `${startStr} às ${endStr}`,
        isWeatherSafe: isMorningGoldenWindow || isLateAfternoonWindow,
        deltaT: isMorningGoldenWindow ? 4.8 : 6.5,
        windSpeed: isMorningGoldenWindow ? 6.2 : 9.0,
        reason,
      });

      if (suggestions.length >= 4) break; // Max 4 top recommendations
    }
  }

  return suggestions;
}
