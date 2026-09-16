import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, UserActivityLog } from '../types';
import { 
  getUserActivityLogs, 
  logUserActivity, 
  checkAuditLogsTableStatus, 
  syncPendingAuditLogsToCloud 
} from '../services/auditLoggerService';
import { isMasterUser } from '../utils/userPermissions';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  FileText, 
  User, 
  Globe, 
  Clock, 
  Activity, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Database,
  Terminal,
  Eye,
  X,
  Copy,
  Check,
  Server,
  Link,
  Layers
} from 'lucide-react';

interface AuditLogsViewProps {
  currentUser: UserProfile;
}

const AUDIT_SQL_SCHEMA = `-- =========================================================================
-- AgroSys - Script de Migração: Logs de Auditoria & Relacionamentos
-- =========================================================================

-- 1. TABELA PRINCIPAL DE LOGS DE AUDITORIA DE USUÁRIOS
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id TEXT PRIMARY KEY DEFAULT ('log-' || extract(epoch from now())::bigint || '-' || substr(md5(random()::text), 1, 6)),
    user_id TEXT,
    user_name TEXT,
    user_email TEXT,
    company_id TEXT,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT DEFAULT '127.0.0.1',
    response_status INTEGER DEFAULT 200,
    status_label TEXT DEFAULT 'SUCCESS',
    user_role TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),

    -- Relacionamento com Empresa (public.tenants)
    CONSTRAINT fk_audit_company 
        FOREIGN KEY (company_id) 
        REFERENCES public.tenants(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,

    -- Relacionamento com Usuário (public.user_profiles)
    CONSTRAINT fk_audit_user 
        FOREIGN KEY (user_id) 
        REFERENCES public.user_profiles(id) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE
);

-- 2. ÍNDICES DE PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.user_activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_company_id ON public.user_activity_logs (company_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.user_activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON public.user_activity_logs (action);
CREATE INDEX IF NOT EXISTS idx_audit_response_status ON public.user_activity_logs (response_status);
CREATE INDEX IF NOT EXISTS idx_audit_details_gin ON public.user_activity_logs USING gin (details);

-- 3. POLÍTICAS RLS (Row Level Security)
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow insert audit logs" ON public.user_activity_logs;
CREATE POLICY "Allow insert audit logs"
    ON public.user_activity_logs
    FOR INSERT
    TO public
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow select audit logs" ON public.user_activity_logs;
CREATE POLICY "Allow select audit logs"
    ON public.user_activity_logs
    FOR SELECT
    TO public
    USING (true);

-- 4. TABELAS COMPLEMENTARES
CREATE TABLE IF NOT EXISTS public.app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on app_settings" ON public.app_settings;
CREATE POLICY "Allow all on app_settings" ON public.app_settings FOR ALL TO public USING (true) WITH CHECK (true);`;

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<UserActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dbSource, setDbSource] = useState<'supabase' | 'indexeddb'>('indexeddb');
  const [dbStatus, setDbStatus] = useState<{ isConnected: boolean; tableExists: boolean; rowCount?: number; error?: string }>({
    isConnected: false,
    tableExists: false,
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [inspectLog, setInspectLog] = useState<UserActivityLog | null>(null);
  const [isDbModalOpen, setIsDbModalOpen] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  const checkDbStatus = async () => {
    const status = await checkAuditLogsTableStatus();
    setDbStatus(status);
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await checkDbStatus();
      const res = await getUserActivityLogs(currentUser);
      setIsAuthorized(res.authorized);
      if (!res.authorized) {
        setErrorMessage(res.error || 'Acesso Restrito: Somente administradores masters podem visualizar os logs de auditoria.');
      } else {
        setLogs(res.logs);
        if (res.source) setDbSource(res.source);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar logs de auditoria.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingAuditLogsToCloud();
      if (res.success) {
        setSyncToast(`✅ ${res.syncedCount} logs sincronizados com o Supabase com sucesso!`);
        await fetchLogs();
      } else {
        setSyncToast(`⚠️ Sincronização pendente: ${res.error || 'Tabela pública não encontrada no Supabase'}`);
      }
    } catch (e: any) {
      setSyncToast(`❌ Falha ao sincronizar: ${e.message}`);
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncToast(null), 4000);
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(AUDIT_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  useEffect(() => {
    fetchLogs();
  }, [currentUser]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Search text match
      const query = searchQuery.toLowerCase().trim();
      const matchSearch = !query || 
        (log.userName && log.userName.toLowerCase().includes(query)) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
        (log.userId && log.userId.toLowerCase().includes(query)) ||
        (log.ipAddress && log.ipAddress.toLowerCase().includes(query)) ||
        (log.action && log.action.toLowerCase().includes(query)) ||
        (log.companyId && log.companyId.toLowerCase().includes(query)) ||
        (JSON.stringify(log.details || {}).toLowerCase().includes(query));

      // Action match
      const matchAction = selectedAction === 'ALL' || log.action === selectedAction;

      // Status match
      let matchStatus = true;
      if (selectedStatus === '200') matchStatus = log.responseStatus >= 200 && log.responseStatus < 300;
      else if (selectedStatus === '401_403') matchStatus = log.responseStatus === 401 || log.responseStatus === 403;
      else if (selectedStatus === '500') matchStatus = log.responseStatus >= 500;

      return matchSearch && matchAction && matchStatus;
    });
  }, [logs, searchQuery, selectedAction, selectedStatus]);

  // Statistics
  const stats = useMemo(() => {
    const total = logs.length;
    const logins = logs.filter(l => l.action === 'LOGIN').length;
    const mutations = logs.filter(l => l.action.startsWith('CREATE') || l.action.startsWith('UPDATE')).length;
    const deletions = logs.filter(l => l.action.startsWith('DELETE')).length;
    const errors = logs.filter(l => l.responseStatus >= 400 || l.statusLabel === 'DENIED' || l.statusLabel === 'FAILURE').length;

    return { total, logins, mutations, deletions, errors };
  }, [logs]);

  // Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = ['ID', 'Data/Hora', 'User ID', 'Nome', 'Email', 'Ação', 'IP', 'Status HTTP', 'Status', 'Duração (ms)'];
    const rows = filteredLogs.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleString('pt-BR'),
      l.userId,
      `"${l.userName || ''}"`,
      `"${l.userEmail || ''}"`,
      l.action,
      l.ipAddress,
      l.responseStatus,
      l.statusLabel,
      l.durationMs || 0
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Audit the export action
    logUserActivity({
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      companyId: currentUser.companyId,
      action: 'DATA_EXPORT',
      details: { exportType: 'CSV', recordCount: filteredLogs.length },
      responseStatus: 200,
    });
  };

  // Unauthorized Screen
  if (!isAuthorized) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 backdrop-blur-xl">
          <div className="w-16 h-16 bg-red-500/20 text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Acesso Restrito ao Usuário Master</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            {errorMessage || 'Os logs de auditoria de atividade de usuário contêm dados sensíveis de segurança e estão disponíveis exclusivamente para Administradores Masters.'}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-lg text-xs font-mono text-slate-300 border border-slate-700">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            Tentativa de acesso não autorizado registrada na auditoria (HTTP 403)
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  Logs de Auditoria de Usuário
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                    Master Admin Only
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Rastreamento completo de atividades, acessos, endereços IP e mutações de dados na plataforma.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchLogs}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition-all border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar CSV ({filteredLogs.length})
            </button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs">Total Registros</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats.total}</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs">Logins</span>
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats.logins}</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs">Mutações (Criação/Edição)</span>
              <Database className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats.mutations}</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs">Deleções</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">{stats.deletions}</div>
          </div>

          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-xs">Alertas / Bloqueios</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-xl font-bold text-red-400">{stats.errors}</div>
          </div>
        </div>
      </div>

      {/* Database Sync Status & Actions Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl flex items-center justify-center ${
            dbStatus.tableExists 
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Sincronização com Banco de Dados</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                dbStatus.tableExists 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
              }`}>
                {dbStatus.tableExists ? '🟢 Supabase Cloud Ativo' : '🟡 IndexedDB Durável (Local)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dbStatus.tableExists 
                ? `Tabela public.user_activity_logs conectada com integridade referencial (${dbStatus.rowCount ?? logs.length} registros).`
                : 'Logs persistindo no IndexedDB durável. Execute o script SQL no Supabase para sincronização cloud.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleSyncCloud}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition-all border border-slate-700 disabled:opacity-50 cursor-pointer shadow-xs"
            title="Sincronizar logs locais com o banco de dados Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Banco'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDbModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition-all border border-purple-500/40 cursor-pointer shadow-xs"
            title="Ver estrutura do banco de dados e script SQL de migração"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Estrutura SQL & Tabelas</span>
          </button>
        </div>
      </div>

      {syncToast && (
        <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center justify-between animate-in fade-in">
          <span>{syncToast}</span>
          <button onClick={() => setSyncToast(null)} className="text-slate-400 hover:text-white p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por usuário, email, IP ou ação..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Action Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
            >
              <option value="ALL">Todas as Ações</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="LOGIN_FAILED">Falha de Login</option>
              <option value="CREATE_USER">Criação de Usuário</option>
              <option value="UPDATE_USER">Edição de Usuário</option>
              <option value="DELETE_USER">Exclusão de Usuário</option>
              <option value="CREATE_CLIENT">Criação de Cliente</option>
              <option value="UPDATE_CLIENT">Edição de Cliente</option>
              <option value="DELETE_CLIENT">Exclusão de Cliente</option>
              <option value="COMPANY_BRANDING_UPDATE">Atualização de Marca</option>
              <option value="ACCESS_DENIED">Acesso Negado</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500/50"
          >
            <option value="ALL">Todos os Status HTTP</option>
            <option value="200">200/201 (Sucesso)</option>
            <option value="401_403">401/403 (Negado / Não Autorizado)</option>
            <option value="500">500 (Erro Servidor)</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Data / Hora</th>
                <th className="py-3.5 px-4">Usuário</th>
                <th className="py-3.5 px-4">Ação Realizada</th>
                <th className="py-3.5 px-4">IP Cliente</th>
                <th className="py-3.5 px-4">Status HTTP</th>
                <th className="py-3.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Carregando registros de auditoria...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Nenhum registro de log encontrado para os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.responseStatus >= 200 && log.responseStatus < 300;
                  const isDenied = log.responseStatus === 403 || log.responseStatus === 401;

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(log.createdAt).toLocaleString('pt-BR')}
                        </div>
                      </td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5">
                            {log.userName || log.userEmail || 'Usuário Desconhecido'}
                            {log.userRole === 'MASTER' && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded">
                                MASTER
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {log.userEmail || log.userId}
                          </div>
                        </div>
                      </td>

                      {/* Action Badge */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${getActionBadgeStyle(log.action)}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* IP Address */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-slate-500" />
                          {log.ipAddress || '127.0.0.1'}
                        </div>
                      </td>

                      {/* Status Code */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                          isSuccess 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                            : isDenied 
                            ? 'bg-red-500/10 text-red-400 border-red-500/30' 
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {isSuccess ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {log.responseStatus} {log.statusLabel}
                        </span>
                      </td>

                      {/* Inspection Action */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setInspectLog(log)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Database Schema & Migration Modal */}
      {isDbModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-5 sm:p-7 space-y-4 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Estrutura de Tabelas & Relacionamentos de Auditoria
                  </h3>
                  <p className="text-xs text-slate-400">
                    Definição DDL em PostgreSQL para a tabela <code className="text-emerald-400">public.user_activity_logs</code> no Supabase.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDbModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Relational Schema Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-emerald-400" /> Tabela Principal
                </span>
                <span className="font-mono font-bold text-white block">public.user_activity_logs</span>
                <p className="text-[10px] text-slate-500">Eventos, IPs, ações, status HTTP e payloads JSON.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                  <Link className="w-3.5 h-3.5 text-blue-400" /> FK: Empresas
                </span>
                <span className="font-mono font-bold text-white block">company_id → tenants(id)</span>
                <p className="text-[10px] text-slate-500">ON DELETE SET NULL / UPDATE CASCADE</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-1">
                <span className="text-slate-400 font-bold block flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-400" /> FK: Usuários
                </span>
                <span className="font-mono font-bold text-white block">user_id → user_profiles(id)</span>
                <p className="text-[10px] text-slate-500">ON DELETE SET NULL / UPDATE CASCADE</p>
              </div>
            </div>

            {/* SQL Script Block */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  Script SQL DDL (Executar no SQL Editor do Supabase)
                </span>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 text-xs transition-all cursor-pointer shadow-xs"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copiado!' : 'Copiar SQL'}</span>
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
                {AUDIT_SQL_SCHEMA}
              </pre>
            </div>

            {/* Quick Steps */}
            <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 text-xs text-slate-400 space-y-1">
              <span className="font-bold text-slate-300 block">Como aplicar no Supabase:</span>
              <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-400">
                <li>Acesse o painel do <strong>Supabase Dashboard</strong> do projeto AgroSys.</li>
                <li>Clique em <strong>SQL Editor</strong> no menu lateral esquerdo.</li>
                <li>Clique no botão <strong>"Copiar SQL"</strong> acima e cole no editor.</li>
                <li>Clique em <strong>"Run"</strong> para criar as tabelas, relacionamentos e índices.</li>
              </ol>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={checkDbStatus}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Testar Conexão Novamente</span>
              </button>
              <button
                type="button"
                onClick={() => setIsDbModalOpen(false)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Payload Modal */}
      {inspectLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Inspeção Detalhada do Log</h3>
              </div>
              <button
                onClick={() => setInspectLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">ID do Registro</span>
                <span className="font-mono text-slate-300">{inspectLog.id}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Data & Hora</span>
                <span className="font-mono text-slate-300">{new Date(inspectLog.createdAt).toLocaleString('pt-BR')}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">Usuário</span>
                <span className="font-medium text-white">{inspectLog.userName || inspectLog.userId}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-slate-500 block">IP de Origem</span>
                <span className="font-mono text-emerald-400">{inspectLog.ipAddress}</span>
              </div>
            </div>

            {/* Payload JSON */}
            <div>
              <span className="text-xs text-slate-400 font-medium block mb-1">Payload & Metadados (JSON)</span>
              <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono text-emerald-300 overflow-x-auto max-h-60">
                {JSON.stringify(inspectLog.details || {}, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getActionBadgeStyle(action: string): string {
  if (action === 'LOGIN' || action === 'LOGOUT') {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  }
  if (action.startsWith('CREATE') || action.startsWith('UPDATE')) {
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  }
  if (action.startsWith('DELETE')) {
    return 'bg-red-500/10 text-red-400 border-red-500/30';
  }
  if (action === 'ACCESS_DENIED' || action === 'LOGIN_FAILED') {
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  }
  return 'bg-slate-800 text-slate-300 border-slate-700';
}
