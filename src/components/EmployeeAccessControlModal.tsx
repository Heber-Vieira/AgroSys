import React, { useState } from 'react';
import { UserProfile, AppViewMode, RegisteredCompany } from '../types';
import { isMasterUser, getDefaultRoleViews } from '../utils/userPermissions';
import { 
  ShieldCheck, 
  UserCheck, 
  X, 
  Check, 
  Lock, 
  Unlock, 
  Layers, 
  Save, 
  RotateCcw, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface EmployeeAccessControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  allUsers: UserProfile[];
  onSaveUserPermissions: (userId: string, allowedViews: AppViewMode[]) => void;
  registeredCompanies: RegisteredCompany[];
  activeCompanyId?: string;
}

interface ModuleOption {
  id: AppViewMode;
  name: string;
  category: 'Operacional' | 'Agronomia & Clima' | 'Comercial & Frota' | 'Gestão & Sistema';
  description: string;
}

const AVAILABLE_MODULES: ModuleOption[] = [
  { id: 'hub', name: 'Central de Módulos (Hub)', category: 'Operacional', description: 'Visão geral rápida e atalhos operacionais' },
  { id: 'dashboard', name: 'Painel Geral Executivo (BI)', category: 'Gestão & Sistema', description: 'Gráficos, KPIs, finanças e recomendações' },
  { id: 'orders', name: 'Ordens de Serviço (OS)', category: 'Operacional', description: 'Criação, triagem e despacho de missões' },
  { id: 'spray-workflow', name: 'Esteira Passo a Passo (10 Etapas)', category: 'Operacional', description: 'Guia visual do fluxo de pulverização' },
  { id: 'schedule', name: 'Agenda & Escala Operacional', category: 'Operacional', description: 'Calendário de agendamento de equipes e drones' },
  { id: 'gis', name: 'Talhões & Mapas GIS (NDVI)', category: 'Agronomia & Clima', description: 'Mapeamento satelital e saúde de lavouras' },
  { id: 'weather', name: 'Centro Meteorológico & Delta T', category: 'Agronomia & Clima', description: 'Vento, temperatura, umidade e laudo climático' },
  { id: 'spray-mix', name: 'Cálculo de Calda & NR-31', category: 'Agronomia & Clima', description: 'Dosagem, ordem de mistura e EPIs' },
  { id: 'telemetry', name: 'Telemetria de Voo ao Vivo', category: 'Operacional', description: 'Logs .DAT, faixas aplicadas e GPS RTK' },
  { id: 'fleet', name: 'Frota de Drones & Baterias', category: 'Comercial & Frota', description: 'Aeronaves, ciclos de baterias e manutenção' },
  { id: 'quotations', name: 'Orçamentos Comerciais', category: 'Comercial & Frota', description: 'Cotação por hectare e propostas para clientes' },
  { id: 'pricing', name: 'Matriz de Precificação', category: 'Comercial & Frota', description: 'Tabela de preços por cultura e relevo' },
  { id: 'reports', name: 'Relatórios Técnicos Oficiais', category: 'Gestão & Sistema', description: 'Emissão de laudos de aplicação IN MAPA 19' },
  { id: 'financial', name: 'Comissões & Faturamento', category: 'Gestão & Sistema', description: 'Extratos, pagamentos e repasses' },
  { id: 'admin-management', name: 'Hub de Administração & Cadastros', category: 'Gestão & Sistema', description: 'Gestão de usuários, empresas e políticas salariais' },
  { id: 'branding', name: 'Studio de Marca & White Label', category: 'Gestão & Sistema', description: 'Customização de logotipo, cores da marca e slogans' },
  { id: 'database', name: 'Esquema PostgreSQL & PostGIS', category: 'Gestão & Sistema', description: 'Estrutura relacional de dados e consultas geoespaciais' },
  { id: 'design-system', name: 'Design System & Cores', category: 'Gestão & Sistema', description: 'Tokens visuais, paleta HSL e guia tipográfico' },
  { id: 'virtual-tour', name: 'Tour Virtual Guiado', category: 'Gestão & Sistema', description: 'Passo a passo interativo de demonstração da plataforma' },
  { id: 'docs', name: 'Biblioteca de Bulas Químicas', category: 'Agronomia & Clima', description: 'Acervo de defensivos e períodos de carência' },
  { id: 'help', name: 'Central de Ajuda & Manuais', category: 'Gestão & Sistema', description: 'Navegador inteligente e manuais por perfil' },
];

export const EmployeeAccessControlModal: React.FC<EmployeeAccessControlModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allUsers,
  onSaveUserPermissions,
  registeredCompanies,
  activeCompanyId,
}) => {
  const isMaster = isMasterUser(currentUser);

  // Filter employees that can be managed by current user
  const manageableUsers = React.useMemo(() => {
    return allUsers.filter(u => {
      // If Master, can manage all non-master employees or filter by active company
      if (isMaster) {
        if (activeCompanyId && activeCompanyId !== 'ALL') {
          return u.companyId === activeCompanyId;
        }
        return true;
      }
      // Company Admin can only manage employees belonging to their own company
      const userCompany = u.companyId || 'ciclodrone';
      const adminCompany = currentUser.companyId || 'ciclodrone';
      return userCompany === adminCompany && !isMasterUser(u);
    });
  }, [allUsers, isMaster, activeCompanyId, currentUser.companyId]);

  const [selectedUserId, setSelectedUserId] = useState<string>(() => {
    return manageableUsers[0]?.id || '';
  });

  // Keep selectedUserId synchronized if manageableUsers changes or selectedUserId is invalid
  React.useEffect(() => {
    if (manageableUsers.length > 0 && (!selectedUserId || !manageableUsers.some(u => u.id === selectedUserId))) {
      setSelectedUserId(manageableUsers[0].id);
    }
  }, [manageableUsers, selectedUserId]);

  const selectedUser = manageableUsers.find(u => u.id === selectedUserId) || manageableUsers[0];

  // Current selected permissions
  const [selectedViews, setSelectedViews] = useState<AppViewMode[]>([]);

  // Synchronize permissions state whenever selectedUserId or selectedUser changes
  React.useEffect(() => {
    if (selectedUser) {
      if (selectedUser.allowedViews && Array.isArray(selectedUser.allowedViews)) {
        setSelectedViews([...selectedUser.allowedViews]);
      } else {
        setSelectedViews(getDefaultRoleViews(selectedUser.role));
      }
    }
  }, [selectedUser?.id, selectedUser?.allowedViews, selectedUser?.role]);

  const handleSelectUser = (user: UserProfile) => {
    setSelectedUserId(user.id);
    if (user.allowedViews && Array.isArray(user.allowedViews)) {
      setSelectedViews([...user.allowedViews]);
    } else {
      setSelectedViews(getDefaultRoleViews(user.role));
    }
  };

  const toggleViewPermission = (viewId: AppViewMode) => {
    setSelectedViews(prev => {
      if (prev.includes(viewId)) {
        return prev.filter(v => v !== viewId);
      } else {
        return [...prev, viewId];
      }
    });
  };

  const handleGrantAll = () => {
    setSelectedViews(AVAILABLE_MODULES.map(m => m.id));
  };

  const handleResetToRoleDefault = () => {
    if (selectedUser) {
      setSelectedViews(getDefaultRoleViews(selectedUser.role));
    }
  };

  const handleSave = () => {
    if (!selectedUser) return;
    onSaveUserPermissions(selectedUser.id, selectedViews);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-4xl w-full p-5 sm:p-6 shadow-2xl space-y-5 text-slate-900 dark:text-white my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Gestão de Acessos & Permissões de Funcionários
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  {isMaster ? 'Visão Master' : 'Administrador da Empresa'}
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Selecione o colaborador da sua empresa e defina exatamente quais módulos e abas ele terá autorização para acessar.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Selection Row */}
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block mb-2">
            1. Selecione o Colaborador para Configurar Permissões:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800">
            {manageableUsers.map((u) => {
              const isSelected = selectedUser?.id === u.id;
              const hasCustom = u.allowedViews && Array.isArray(u.allowedViews);

              return (
                <button
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500/15 dark:bg-emerald-600/20 border-emerald-500 text-slate-900 dark:text-white shadow-2xs ring-1 ring-emerald-500'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <UserAvatar user={u} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold truncate flex items-center gap-1">
                      {u.name}
                      {hasCustom && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" title="Possui permissões personalizadas" />
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">{u.roleLabel}</div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {selectedUser && (
          <>
            {/* Selected User Details Pill */}
            <div className="bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <UserAvatar user={selectedUser} size="md" />
                <div>
                  <span className="font-bold text-slate-900 dark:text-white text-sm block">{selectedUser.name}</span>
                  <span className="text-slate-600 dark:text-slate-400 text-xs">{selectedUser.email} • Cargo: <strong className="text-emerald-600 dark:text-emerald-400">{selectedUser.roleLabel}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleResetToRoleDefault}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  title="Restaura os acessos padrão do cargo"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Padrão do Cargo</span>
                </button>

                <button
                  type="button"
                  onClick={handleGrantAll}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Liberar Todos ({AVAILABLE_MODULES.length})</span>
                </button>
              </div>
            </div>

            {/* Modules Checkbox Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <span>2. Escolha os Módulos e Abas Liberados:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  {selectedViews.length} de {AVAILABLE_MODULES.length} módulos ativos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = selectedViews.includes(mod.id);

                  return (
                    <div
                      key={mod.id}
                      onClick={() => toggleViewPermission(mod.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer select-none flex items-start gap-3 ${
                        isChecked
                          ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500/60 shadow-2xs'
                          : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/80 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                        isChecked
                          ? 'bg-emerald-600 dark:bg-emerald-500 text-white dark:text-slate-950 shadow-2xs'
                          : 'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <h4 className={`text-xs font-black truncate ${isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                            {mod.name}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                          {mod.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Modal Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            <span>As permissões entram em vigor imediatamente após salvar.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30 transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Permissões do Funcionário</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
