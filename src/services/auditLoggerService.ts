/**
 * AgroSys - User Activity Audit Logger Service
 * Captures, intercepts, and persists user activity audit logs (User Activity Logs).
 * 
 * Features:
 * - Registers User ID, Action, IP Address, Timestamp, Response Status, and Details.
 * - Restricts log viewing strictly to Master Administrators (isMasterUser).
 * - Multi-tier persistence: Supabase DB + Local Durable IndexedDB.
 * - Functional interceptor wrappers for server and client operations.
 */

import { UserActivityLog, AuditActionType, UserProfile } from '../types';
import { supabase } from './supabase';
import { isMasterUser } from '../utils/userPermissions';
import { saveToDurableStorage, getIDBItem, setIDBItem, STORES } from './dbStorageEngine';

export const AUDIT_LOGS_STORAGE_KEY = 'agrosys_user_activity_logs';

let cachedClientIp: string | null = null;
let ipFetchPromise: Promise<string> | null = null;

/**
 * Automatically detects the client's public IP address with timeout and fallback.
 */
export async function getClientIpAddress(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;

  if (ipFetchPromise) return ipFetchPromise;

  ipFetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const response = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.ip) {
          cachedClientIp = data.ip;
          return data.ip;
        }
      }
    } catch (err) {
      // Ignore network errors or timeouts gracefully
    }
    cachedClientIp = '127.0.0.1';
    return cachedClientIp;
  })();

  return ipFetchPromise;
}

export interface LogActivityParams {
  userId: string;
  userName?: string;
  userEmail?: string;
  companyId?: string;
  action: AuditActionType | string;
  details?: Record<string, any> | string;
  responseStatus?: number; // e.g. 200, 201, 400, 403, 500
  statusLabel?: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'WARNING';
  userRole?: string;
  durationMs?: number;
  ipAddress?: string;
}

/**
 * Creates and registers a new User Activity Audit Log entry.
 */
export async function logUserActivity(params: LogActivityParams): Promise<UserActivityLog> {
  const ipAddress = params.ipAddress || await getClientIpAddress();
  const responseStatus = params.responseStatus ?? 200;
  
  let statusLabel: 'SUCCESS' | 'FAILURE' | 'DENIED' | 'WARNING' = params.statusLabel ?? 'SUCCESS';
  if (!params.statusLabel) {
    if (responseStatus >= 200 && responseStatus < 300) {
      statusLabel = 'SUCCESS';
    } else if (responseStatus === 403 || responseStatus === 401) {
      statusLabel = 'DENIED';
    } else {
      statusLabel = 'FAILURE';
    }
  }

  const logEntry: UserActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: params.userId || 'anonymous',
    userName: params.userName || '',
    userEmail: params.userEmail || '',
    companyId: params.companyId || '',
    action: params.action,
    details: params.details || {},
    ipAddress,
    responseStatus,
    statusLabel,
    userRole: (params.userRole as any) || undefined,
    durationMs: params.durationMs,
    createdAt: new Date().toISOString(),
  };

  // 1. Save to Durable Local Storage (IndexedDB + localStorage)
  try {
    const existingLogs = getLocalAuditLogs();
    const updated = [logEntry, ...existingLogs].slice(0, 500); // Keep last 500 logs locally
    localStorage.setItem(AUDIT_LOGS_STORAGE_KEY, JSON.stringify(updated));
    await setIDBItem(STORES.SETTINGS, { key: AUDIT_LOGS_STORAGE_KEY, value: updated });
  } catch (err) {
    console.warn('Erro ao salvar log de auditoria no armazenamento local:', err);
  }

  // 2. Persist to Supabase DB Cloud Table `user_activity_logs`
  try {
    await supabase.from('user_activity_logs').insert([{
      user_id: logEntry.userId,
      user_name: logEntry.userName,
      user_email: logEntry.userEmail,
      company_id: logEntry.companyId,
      action: logEntry.action,
      details: typeof logEntry.details === 'object' ? logEntry.details : { raw: logEntry.details },
      ip_address: logEntry.ipAddress,
      response_status: logEntry.responseStatus,
      status_label: logEntry.statusLabel,
      user_role: logEntry.userRole,
      duration_ms: logEntry.durationMs,
      created_at: logEntry.createdAt,
    }]);
  } catch (err) {
    // Non-blocking fallback if database table is missing or network offline
    console.warn('Persistência do log no Supabase offline (armazenado em IndexedDB):', err);
  }

  return logEntry;
}

/**
 * Retrieves audit logs from local durable storage fallback.
 */
export function getLocalAuditLogs(): UserActivityLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export interface FetchAuditLogsFilters {
  searchQuery?: string;
  actionType?: string;
  statusFilter?: string;
  limit?: number;
}

/**
 * Retrieves User Activity Logs.
 * STRICT ACCESS CONTROL: Only Master Administrators can execute or view audit log data.
 */
export async function getUserActivityLogs(
  currentUser: UserProfile | null | undefined,
  filters: FetchAuditLogsFilters = {}
): Promise<{ logs: UserActivityLog[]; authorized: boolean; error?: string }> {
  // STRICT MASTER ADMIN CHECK
  if (!isMasterUser(currentUser)) {
    const deniedReason = 'Acesso Negado: Somente Administradores Masters possuem autorização para visualizar os logs de auditoria.';
    
    // Log unauthorized attempt
    if (currentUser) {
      logUserActivity({
        userId: currentUser.id,
        userName: currentUser.name,
        userEmail: currentUser.email,
        companyId: currentUser.companyId,
        action: 'ACCESS_DENIED',
        details: { attemptedResource: 'getUserActivityLogs', role: currentUser.role },
        responseStatus: 403,
        statusLabel: 'DENIED',
        userRole: currentUser.role,
      });
    }

    return { logs: [], authorized: false, error: deniedReason };
  }

  try {
    // 1. Fetch from Supabase Cloud Table
    let query = supabase
      .from('user_activity_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.limit) {
      query = query.limit(filters.limit);
    } else {
      query = query.limit(200);
    }

    if (filters.actionType && filters.actionType !== 'ALL') {
      query = query.eq('action', filters.actionType);
    }

    const { data, error } = await query;

    if (!error && data && Array.isArray(data) && data.length > 0) {
      const cloudLogs: UserActivityLog[] = data.map((item: any) => ({
        id: item.id || `db-${Math.random()}`,
        userId: item.user_id || 'unknown',
        userName: item.user_name || '',
        userEmail: item.user_email || '',
        companyId: item.company_id || '',
        action: item.action || 'UNKNOWN',
        details: item.details || {},
        ipAddress: item.ip_address || '127.0.0.1',
        responseStatus: item.response_status ?? 200,
        statusLabel: item.status_label || 'SUCCESS',
        userRole: item.user_role,
        durationMs: item.duration_ms,
        createdAt: item.created_at || new Date().toISOString(),
      }));

      return { logs: cloudLogs, authorized: true };
    }
  } catch (err: any) {
    console.warn('Erro ao carregar logs do Supabase, utilizando fallback local:', err);
  }

  // 2. Fallback to Local Storage / IndexedDB
  const localLogs = getLocalAuditLogs();
  return { logs: localLogs, authorized: true };
}

/**
 * Higher-order function / Interceptor wrapper to automatically track, time, and audit async actions.
 */
export function withAuditLog<TArgs extends any[], TResult>(
  action: AuditActionType | string,
  fn: (...args: TArgs) => Promise<TResult>,
  getMeta?: (args: TArgs, result?: TResult, error?: any) => {
    user?: UserProfile | null;
    userId?: string;
    userName?: string;
    userEmail?: string;
    companyId?: string;
    details?: Record<string, any>;
  }
) {
  return async (...args: TArgs): Promise<TResult> => {
    const startTime = performance.now();
    let result: TResult | undefined;
    let err: any;
    let status = 200;

    try {
      result = await fn(...args);
      return result;
    } catch (e: any) {
      err = e;
      status = e?.status || e?.statusCode || 500;
      throw e;
    } finally {
      const durationMs = Math.round(performance.now() - startTime);
      const meta = getMeta ? getMeta(args, result, err) : {};
      
      const user = meta.user;
      const userId = meta.userId || user?.id || 'system';
      const userName = meta.userName || user?.name || '';
      const userEmail = meta.userEmail || user?.email || '';
      const companyId = meta.companyId || user?.companyId || '';
      const details = meta.details || (err ? { error: err.message || String(err) } : {});

      logUserActivity({
        userId,
        userName,
        userEmail,
        companyId,
        action,
        details,
        responseStatus: err ? status : 200,
        statusLabel: err ? 'FAILURE' : 'SUCCESS',
        durationMs,
        userRole: user?.role,
      });
    }
  };
}
