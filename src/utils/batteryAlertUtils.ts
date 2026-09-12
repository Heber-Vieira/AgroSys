import { BatteryAlertSettings, BatteryAlertPeriodUnit } from '../types';

/**
 * Calculates the next alert timestamp based on unit (DAYS / MONTHS) and value.
 */
export function calculateNextBatteryAlertTimestamp(
  settings: Partial<BatteryAlertSettings>,
  fromTimestamp: number = Date.now()
): number {
  const unit = settings.periodUnit || 'DAYS';
  const val = Math.max(1, Number(settings.periodValue) || (unit === 'MONTHS' ? 1 : 15));

  if (unit === 'MONTHS') {
    const d = new Date(fromTimestamp);
    d.setMonth(d.getMonth() + val);
    return d.getTime();
  } else {
    return fromTimestamp + val * 24 * 60 * 60 * 1000;
  }
}

/**
 * Calculates snooze timestamp in days.
 */
export function calculateBatterySnoozeTimestamp(
  snoozeDays: number = 1,
  fromTimestamp: number = Date.now()
): number {
  const days = Math.max(1, Number(snoozeDays) || 1);
  return fromTimestamp + days * 24 * 60 * 60 * 1000;
}

/**
 * Formats period label in Portuguese (e.g., "15 Dias", "1 Mês", "3 Meses").
 */
export function formatBatteryPeriodLabel(unit: BatteryAlertPeriodUnit, val: number): string {
  const num = Math.max(1, Number(val) || 1);
  if (unit === 'MONTHS') {
    return num === 1 ? '1 Mês' : `${num} Meses`;
  }
  return num === 1 ? '1 Dia' : `${num} Dias`;
}

/**
 * Formats a timestamp into DD/MM/YYYY.
 */
export function formatTimestampToDate(timestamp?: number): string {
  if (!timestamp) return 'Não agendado';
  const d = new Date(timestamp);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
