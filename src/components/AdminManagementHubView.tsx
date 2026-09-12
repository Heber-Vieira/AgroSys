import React, { useState } from 'react';
import { BrazilCityAutocomplete } from './common/BrazilCityAutocomplete';
import { 
  UserProfile, 
  AgriculturalDrone, 
  CrewPilot, 
  CrewAssistant, 
  ClientProducer, 
  CompensationPolicy,
  UserRole,
  PricingMatrixRule,
  DroneMaintenanceLog,
  WhiteLabelTheme,
  ThemeMode,
  DroneBatteryAsset
} from '../types';
import { showToast as showAgroToast, showConfirm } from '../services/notificationService';
import { 
  ShieldCheck, 
  Users, 
  Plane, 
  Briefcase, 
  DollarSign, 
  Plus, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle, 
  Lock, 
  Search, 
  Filter,
  Sliders,
  Palette,
  Compass,
  HelpCircle, 
  Sparkles, 
  BatteryCharging, 
  MapPin, 
  Phone, 
  Mail, 
  FileText, 
  Building2, 
  Award,
  CheckCircle2,
  TrendingUp,
  Clock,
  Camera,
  Upload,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';
import { DronePhoto, DroneBadge, DronePhotoUploadModal, PRESET_DRONE_PHOTOS, getDronePhotoUrl } from './DronePhotoBadge';
import { UserAvatar, UserPhotoUploadModal, saveStoredUserPhoto, PRESET_AVATARS, getUserPhotoUrl } from './UserAvatar';
import { PricingMatrixView } from './PricingMatrixView';
import { FleetDronesView } from './FleetDronesView';
import { AdminBrandingStudio } from './AdminBrandingStudio';
import { formatBRL, formatDecimal, parseInputNumber } from '../utils/formatters';
import { PRESET_COMPANIES } from '../data/themeTokensData';
import { isMasterUser } from '../utils/userPermissions';
import { getCompanyTheme } from '../services/brandingLogoStorage';

interface AdminManagementHubViewProps {
  currentUser: UserProfile;
  users: UserProfile[];
  setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  drones: AgriculturalDrone[];
  setDrones: React.Dispatch<React.SetStateAction<AgriculturalDrone[]>>;
  batteries?: DroneBatteryAsset[];
  setBatteries?: React.Dispatch<React.SetStateAction<DroneBatteryAsset[]>>;
  onOpenBatteryManager?: (droneId?: string) => void;
  pilots: CrewPilot[];
  setPilots: React.Dispatch<React.SetStateAction<CrewPilot[]>>;
  assistants: CrewAssistant[];
  setAssistants: React.Dispatch<React.SetStateAction<CrewAssistant[]>>;
  clients: ClientProducer[];
  setClients: React.Dispatch<React.SetStateAction<ClientProducer[]>>;
  compensation: CompensationPolicy;
  setCompensation: React.Dispatch<React.SetStateAction<CompensationPolicy>>;
  onSwitchToAdmin?: () => void;
  onNavigate?: (view: string) => void;
  pricingRules?: PricingMatrixRule[];
  setPricingRules?: React.Dispatch<React.SetStateAction<PricingMatrixRule[]>>;
  maintenanceLogs?: DroneMaintenanceLog[];
  setMaintenanceLogs?: React.Dispatch<React.SetStateAction<DroneMaintenanceLog[]>>;
  theme?: WhiteLabelTheme;
  setTheme?: React.Dispatch<React.SetStateAction<WhiteLabelTheme>>;
  themeMode?: ThemeMode;
  setThemeMode?: (mode: ThemeMode) => void;
}

type AdminTab = 'users' | 'drones' | 'clients' | 'compensation' | 'pricing' | 'fleet' | 'branding';

export const AdminManagementHubView: React.FC<AdminManagementHubViewProps> = ({
  currentUser,
  users,
  setUsers,
  drones,
  setDrones,
  batteries = [],
  setBatteries,
  onOpenBatteryManager,
  pilots,
  setPilots,
  assistants,
  setAssistants,
  clients,
  setClients,
  compensation,
  setCompensation,
  onSwitchToAdmin,
  onNavigate,
  pricingRules = [],
  setPricingRules = () => {},
  maintenanceLogs = [],
  setMaintenanceLogs = () => {},
  theme,
  setTheme = () => {},
  themeMode = 'light',
  setThemeMode = () => {},
}) => {
  const isMaster = isMasterUser(currentUser);
  const isCompanyAdmin = currentUser.role === 'ADMIN';
  const hasAdminAccess = isMaster || isCompanyAdmin;

  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>(() => {
    return (theme?.tenantId && theme.tenantId !== 'ALL') ? theme.tenantId : 'ALL';
  });
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (theme?.tenantId) {
      setSelectedCompanyFilter(theme.tenantId);
    }
  }, [theme?.tenantId]);

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [activeUserPhotoModal, setActiveUserPhotoModal] = useState<UserProfile | null>(null);
  const [userFormData, setUserFormData] = useState<Partial<UserProfile>>({
    name: '',
    role: 'USER',
    roleLabel: 'Usuário / Produtor Rural',
    email: '',
    badge: 'Produtor Rural',
    documentNumber: '',
    phone: '',
    farmName: '',
    licenseCode: '',
    status: 'ACTIVE',
    salaryBase: 0,
    photoUrl: '',
    companyId: currentUser.companyId || theme?.tenantId || 'ciclodrone',
  });

  // User Password Form State
  const [userPasswordInput, setUserPasswordInput] = useState<string>('');
  const [userConfirmPasswordInput, setUserConfirmPasswordInput] = useState<string>('');
  const [showUserPassword, setShowUserPassword] = useState<boolean>(false);

  // Drone Modal State
  const [isDroneModalOpen, setIsDroneModalOpen] = useState(false);
  const [editingDrone, setEditingDrone] = useState<AgriculturalDrone | null>(null);
  const [activeDronePhotoModal, setActiveDronePhotoModal] = useState<AgriculturalDrone | null>(null);
  const [droneFormData, setDroneFormData] = useState<Partial<AgriculturalDrone>>({
    brand: 'DJI_AGRICULTURE',
    modelName: 'DJI Agras T20P',
    serialNumber: '',
    anacPrefix: 'PP-AGR-',
    deceaRegistration: 'SARPAS-',
    tankCapacityL: 20,
    maxPayloadKg: 25,
    totalFlightHours: 0,
    batteryStatusPct: 100,
    operationalStatus: 'READY',
    nextMaintenanceHours: 50,
    photoUrl: '',
  });

  // Client Modal State
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientProducer | null>(null);
  const [clientFormData, setClientFormData] = useState<Partial<ClientProducer>>({
    name: '',
    tradeName: '',
    cpfCnpj: '',
    stateRegistration: '',
    phone: '',
    email: '',
    cityState: '',
    farmNames: [''],
    totalHectaresRegistered: 100,
    creditLimit: 50000,
    paymentTermsDays: 30,
    status: 'ACTIVE',
    notes: '',
  });

  // Compensation Form State
  const [compForm, setCompForm] = useState<CompensationPolicy>(compensation);
  const [simulatedHa, setSimulatedHa] = useState<number>(120);

  // Formatted string states for monetary salary inputs
  const [userSalaryInput, setUserSalaryInput] = useState<string>('0,00');
  const [pilotSalaryInput, setPilotSalaryInput] = useState<string>(() => formatDecimal(compensation.pilotBaseSalary, 2));
  const [assistantSalaryInput, setAssistantSalaryInput] = useState<string>(() => formatDecimal(compensation.assistantBaseSalary, 2));

  const showToast = (msg: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    setToastMessage(msg);
    showAgroToast(msg, type);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // RBAC Check: Only MASTER or ADMIN has permission
  if (!hasAdminAccess) {
    return (
      <div className="max-w-4xl mx-auto my-8 p-8 bg-white dark:bg-slate-900 border-2 border-rose-300 dark:border-rose-900/60 rounded-3xl shadow-2xl text-center space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            Acesso Restrito • Exclusivo para Administradores
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Permissão Insuficiente para Gestão de Cadastros e Valores
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Você está conectado atualmente como <strong>{currentUser.name}</strong> com perfil de <strong>{currentUser.roleLabel}</strong>. 
            Por normas de governança e proteção de dados (LGPD / ANAC), o cadastro e edição de usuários, drones, clientes e valores salariais/comissões é restrito a Administradores Gerais e Usuários Master.
          </p>
        </div>

        {onSwitchToAdmin && (
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onSwitchToAdmin}
              className="px-6 py-3 rounded-xl font-extrabold text-xs bg-purple-600 hover:bg-purple-700 text-white shadow-lg transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Alternar para Perfil de Administrador</span>
            </button>
            {onNavigate && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-3 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
              >
                Voltar ao Painel Geral
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // USER CRUD HANDLERS
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserFormData({
      name: '',
      role: isMaster ? 'ADMIN' : 'PILOT',
      roleLabel: isMaster ? 'Administrador da Empresa' : 'Piloto de Drone Remoto',
      email: '',
      badge: isMaster ? 'Administrador Empresa' : 'Piloto DECEA / ANAC',
      documentNumber: '',
      phone: '',
      farmName: '',
      licenseCode: '',
      status: 'ACTIVE',
      salaryBase: isMaster ? 5500 : 4800,
      photoUrl: '',
      companyId: isMaster 
        ? (selectedCompanyFilter !== 'ALL' ? selectedCompanyFilter : (theme?.tenantId || 'ciclodrone'))
        : (currentUser.companyId || theme?.tenantId || 'ciclodrone'),
    });
    setUserSalaryInput(isMaster ? '5.500,00' : '4.800,00');
    setUserPasswordInput('');
    setUserConfirmPasswordInput('');
    setShowUserPassword(false);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: UserProfile) => {
    // If not master, prevent editing master users
    if (!isMaster && (u.isMaster || u.role === 'MASTER')) {
      showToast('Você não possui permissão para editar um usuário Master.', 'warning');
      return;
    }
    setEditingUser(u);
    setUserFormData({ ...u, photoUrl: getUserPhotoUrl(u), companyId: u.companyId || 'ciclodrone' });
    setUserSalaryInput(u.salaryBase ? formatDecimal(u.salaryBase, 2) : '0,00');
    setUserPasswordInput(u.password || '');
    setUserConfirmPasswordInput(u.password || '');
    setShowUserPassword(false);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.name || !userFormData.email) {
      showToast('Por favor, preencha ao menos o nome e o e-mail.');
      return;
    }

    if (!editingUser) {
      if (!userPasswordInput) {
        showToast('Por favor, cadastre uma senha de acesso para o novo usuário.');
        return;
      }
      if (userPasswordInput.length < 6) {
        showToast('A senha de acesso deve possuir no mínimo 6 caracteres.');
        return;
      }
      if (userPasswordInput !== userConfirmPasswordInput) {
        showToast('A confirmação de senha não confere com a senha digitada.');
        return;
      }
    } else if (userPasswordInput && userPasswordInput !== userConfirmPasswordInput) {
      showToast('A confirmação de senha não confere com a senha digitada.');
      return;
    }

    const roleLabels: Record<UserRole, string> = {
      MASTER: 'Usuário Master (Acesso Total)',
      ADMIN: 'Administrador da Empresa',
      USER: 'Usuário / Produtor Rural',
      PILOT: 'Piloto de Drone Remoto',
      ASSISTANT: 'Auxiliar de Pulverização',
    };

    const role = userFormData.role || 'USER';
    const roleLabel = roleLabels[role] || 'Colaborador';
    const photoUrl = userFormData.photoUrl || undefined;
    const targetCompanyId = userFormData.companyId || (isMaster ? (theme?.tenantId || 'ciclodrone') : (currentUser.companyId || 'ciclodrone'));

    if (editingUser) {
      // Update existing
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        ...userFormData,
        companyId: targetCompanyId,
        password: userPasswordInput || u.password || '123456',
        photoUrl,
        avatarUrl: photoUrl,
        role,
        roleLabel,
      } as UserProfile : u));

      if (photoUrl) {
        saveStoredUserPhoto(editingUser.id, photoUrl);
      }

      // Also sync with crew pilot/assistant if relevant
      if (role === 'PILOT') {
        setPilots(prev => prev.map(p => (p.cpf === editingUser.documentNumber || p.id === editingUser.id) ? {
          ...p,
          name: userFormData.name || p.name,
          phone: userFormData.phone || p.phone,
          deceaLicense: userFormData.licenseCode || p.deceaLicense,
          photoUrl: photoUrl || p.photoUrl,
          avatarUrl: photoUrl || p.avatarUrl,
          companyId: targetCompanyId,
        } : p));
      } else if (role === 'ASSISTANT') {
        setAssistants(prev => prev.map(a => (a.cpf === editingUser.documentNumber || a.id === editingUser.id) ? {
          ...a,
          name: userFormData.name || a.name,
          phone: userFormData.phone || a.phone,
          photoUrl: photoUrl || a.photoUrl,
          avatarUrl: photoUrl || a.avatarUrl,
          companyId: targetCompanyId,
        } : a));
      }

      showToast(`Usuário "${userFormData.name}" atualizado com sucesso!`);
    } else {
      // Create new
      const newId = `user-${Date.now()}`;
      const newUser: UserProfile = {
        id: newId,
        name: userFormData.name || 'Novo Usuário',
        role,
        roleLabel,
        email: userFormData.email || '',
        badge: userFormData.badge || roleLabel,
        documentNumber: userFormData.documentNumber,
        phone: userFormData.phone,
        farmName: userFormData.farmName,
        licenseCode: userFormData.licenseCode,
        status: userFormData.status || 'ACTIVE',
        salaryBase: userFormData.salaryBase || 0,
        password: userPasswordInput,
        hiredDate: new Date().toISOString().split('T')[0],
        photoUrl,
        avatarUrl: photoUrl,
        companyId: targetCompanyId,
        isMaster: role === 'MASTER',
      };

      if (photoUrl) {
        saveStoredUserPhoto(newId, photoUrl);
      }

      setUsers(prev => [...prev, newUser]);

      // If created a pilot, add to crew pilots
      if (role === 'PILOT') {
        setPilots(prev => [...prev, {
          id: `pilot-${Date.now()}`,
          name: newUser.name,
          cpf: newUser.documentNumber || '000.000.000-00',
          phone: newUser.phone || '(00) 00000-0000',
          deceaLicense: newUser.licenseCode || 'DECEA-SARPAS-BR-0000',
          cmaExpiration: '2027-12-31',
          commissionRatePerHa: compensation.pilotCommissionPerHa || 8.00,
          totalHoursFlown: 0,
          available: true,
          photoUrl,
          avatarUrl: photoUrl,
          companyId: targetCompanyId,
        }]);
      } else if (role === 'ASSISTANT') {
        setAssistants(prev => [...prev, {
          id: `assistant-${Date.now()}`,
          name: newUser.name,
          cpf: newUser.documentNumber || '000.000.000-00',
          phone: newUser.phone || '(00) 00000-0000',
          commissionRatePerHa: compensation.assistantCommissionPerHa || 3.00,
          nr31Certified: true,
          available: true,
          photoUrl,
          avatarUrl: photoUrl,
          companyId: targetCompanyId,
        }]);
      }

      showToast(`Novo usuário "${newUser.name}" cadastrado com sucesso na empresa ${PRESET_COMPANIES.find(p => p.id === targetCompanyId)?.name || 'selecionada'}!`);
    }

    setIsUserModalOpen(false);
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUser.id) {
      showToast('Você não pode excluir o usuário conectado no momento.', 'warning');
      return;
    }
    const targetUser = users.find(u => u.id === id);
    if (!isMaster && targetUser && (targetUser.isMaster || targetUser.role === 'MASTER')) {
      showToast('Você não possui permissão para excluir um usuário Master.', 'warning');
      return;
    }
    showConfirm({
      title: 'Remover Usuário',
      message: `Tem certeza que deseja remover o usuário ${name}?`,
      confirmLabel: 'Sim, Remover',
      cancelLabel: 'Cancelar',
      isDanger: true,
      onConfirm: () => {
        setUsers(prev => prev.filter(u => u.id !== id));
        showToast(`Usuário "${name}" removido.`);
      }
    });
  };

  const handleToggleUserStatus = (u: UserProfile) => {
    const nextStatus = u.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
    setUsers(prev => prev.map(item => item.id === u.id ? { ...item, status: nextStatus } : item));
    showToast(`Status de ${u.name} alterado para ${nextStatus === 'ACTIVE' ? 'Ativo' : 'Inativo'}.`);
  };

  // DRONE CRUD HANDLERS
  const handleOpenNewDrone = () => {
    setEditingDrone(null);
    setDroneFormData({
      brand: 'DJI_AGRICULTURE',
      modelName: 'DJI Agras T20P',
      serialNumber: `AGR-SN-${Math.floor(100000 + Math.random() * 900000)}`,
      anacPrefix: `PP-AGR-${String(drones.length + 1).padStart(2, '0')}`,
      deceaRegistration: `SARPAS-${Math.floor(10000 + Math.random() * 90000)}-BR`,
      tankCapacityLiters: 20,
      maxPayloadKg: 25,
      totalFlightHours: 0,
      batteryStatusPct: 100,
      operationalStatus: 'READY',
      nextMaintenanceHours: 50,
      photoUrl: '',
    });
    setIsDroneModalOpen(true);
  };

  const handleOpenEditDrone = (d: AgriculturalDrone) => {
    setEditingDrone(d);
    setDroneFormData({ ...d });
    setIsDroneModalOpen(true);
  };

  const handleSaveDrone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!droneFormData.modelName || !droneFormData.anacPrefix) {
      showToast('Preencha o modelo e o prefixo ANAC.', 'warning');
      return;
    }

    const resolvedPhoto = droneFormData.photoUrl || PRESET_DRONE_PHOTOS[droneFormData.modelName.toLowerCase().includes('t50') ? 't50' : droneFormData.modelName.toLowerCase().includes('t40') ? 't40' : droneFormData.modelName.toLowerCase().includes('xag') ? 'xag' : 't20p']?.url || '';

    if (editingDrone) {
      setDrones(prev => prev.map(d => d.id === editingDrone.id ? {
        ...d,
        ...droneFormData,
        tankCapacityLiters: Number(droneFormData.tankCapacityLiters) || 20,
        maxPayloadKg: Number(droneFormData.maxPayloadKg) || 25,
        totalFlightHours: Number(droneFormData.totalFlightHours) || 0,
        batteryStatusPct: Number(droneFormData.batteryStatusPct) || 100,
        nextMaintenanceHours: Number(droneFormData.nextMaintenanceHours) || 50,
        photoUrl: resolvedPhoto,
      } as AgriculturalDrone : d));
      showToast(`Drone ${droneFormData.anacPrefix} atualizado com sucesso!`);
    } else {
      const newDrone: AgriculturalDrone = {
        id: `drone-${Date.now()}`,
        brand: droneFormData.brand || 'DJI_AGRICULTURE',
        modelName: droneFormData.modelName || 'DJI Agras T40',
        serialNumber: droneFormData.serialNumber || `AGR-SN-${Date.now()}`,
        anacPrefix: droneFormData.anacPrefix || 'PP-AGR-XX',
        deceaRegistration: droneFormData.deceaRegistration || 'SARPAS-0000-BR',
        tankCapacityLiters: Number(droneFormData.tankCapacityLiters) || 40,
        maxPayloadKg: Number(droneFormData.maxPayloadKg) || 40,
        totalFlightHours: Number(droneFormData.totalFlightHours) || 0,
        batteryStatusPct: Number(droneFormData.batteryStatusPct) || 100,
        operationalStatus: droneFormData.operationalStatus || 'READY',
        nextMaintenanceHours: Number(droneFormData.nextMaintenanceHours) || 50,
        photoUrl: resolvedPhoto,
      };
      setDrones(prev => [...prev, newDrone]);
      showToast(`Drone ${newDrone.anacPrefix} cadastrado com sucesso!`);
    }
    setIsDroneModalOpen(false);
  };

  const handleDeleteDrone = (id: string, prefix: string) => {
    showConfirm({
      title: 'Remover Drone',
      message: `Deseja remover o drone com prefixo ${prefix} da frota?`,
      confirmLabel: 'Sim, Remover',
      cancelLabel: 'Cancelar',
      isDanger: true,
      onConfirm: () => {
        setDrones(prev => prev.filter(d => d.id !== id));
        showToast(`Drone ${prefix} removido da frota.`);
      }
    });
  };

  // CLIENT CRUD HANDLERS
  const handleOpenNewClient = () => {
    setEditingClient(null);
    setClientFormData({
      name: '',
      tradeName: '',
      cpfCnpj: '',
      stateRegistration: '',
      phone: '',
      email: '',
      cityState: 'Rio Verde - GO',
      farmNames: ['Fazenda Nova'],
      totalHectaresRegistered: 500,
      creditLimit: 80000,
      paymentTermsDays: 30,
      status: 'ACTIVE',
      notes: '',
    });
    setIsClientModalOpen(true);
  };

  const handleOpenEditClient = (c: ClientProducer) => {
    setEditingClient(c);
    setClientFormData({ ...c });
    setIsClientModalOpen(true);
  };

  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormData.name || !clientFormData.cpfCnpj) {
      showToast('Preencha o nome do produtor e o CPF/CNPJ.', 'warning');
      return;
    }

    if (editingClient) {
      setClients(prev => prev.map(c => c.id === editingClient.id ? {
        ...c,
        ...clientFormData,
      } as ClientProducer : c));
      showToast(`Produtor "${clientFormData.name}" atualizado com sucesso!`);
    } else {
      const newClient: ClientProducer = {
        id: `client-${Date.now()}`,
        name: clientFormData.name || '',
        tradeName: clientFormData.tradeName || clientFormData.name,
        cpfCnpj: clientFormData.cpfCnpj || '',
        stateRegistration: clientFormData.stateRegistration || '',
        phone: clientFormData.phone || '',
        email: clientFormData.email || '',
        cityState: clientFormData.cityState || 'Goiás',
        farmNames: clientFormData.farmNames && clientFormData.farmNames.length > 0 ? clientFormData.farmNames : ['Fazenda Principal'],
        totalHectaresRegistered: Number(clientFormData.totalHectaresRegistered) || 0,
        creditLimit: Number(clientFormData.creditLimit) || 0,
        paymentTermsDays: Number(clientFormData.paymentTermsDays) || 30,
        status: clientFormData.status || 'ACTIVE',
        notes: clientFormData.notes || '',
      };
      setClients(prev => [...prev, newClient]);
      showToast(`Cliente "${newClient.name}" cadastrado com sucesso!`);
    }
    setIsClientModalOpen(false);
  };

  const handleDeleteClient = (id: string, name: string) => {
    showConfirm({
      title: 'Remover Produtor / Cliente',
      message: `Deseja remover o cliente ${name}?`,
      confirmLabel: 'Sim, Remover',
      cancelLabel: 'Cancelar',
      isDanger: true,
      onConfirm: () => {
        setClients(prev => prev.filter(c => c.id !== id));
        showToast(`Cliente ${name} removido.`);
      }
    });
  };

  // COMPENSATION POLICY HANDLER
  const handleSaveCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    setCompensation(compForm);

    // Sync pilots commission rates
    setPilots(prev => prev.map(p => ({
      ...p,
      commissionRatePerHa: compForm.pilotCommissionPerHa,
    })));

    // Sync assistants commission rates
    setAssistants(prev => prev.map(a => ({
      ...a,
      commissionRatePerHa: compForm.assistantCommissionPerHa,
    })));

    showToast('Tabela salarial e políticas de comissão salvas com sucesso em todo o sistema!');
  };

  // Filtered lists
  const filteredUsers = users.filter(u => {
    const userIsMasterProfile = isMasterUser(u);

    // RULE: Master users DO NOT appear on specific company registration lists.
    // They only appear in Global Multi-Company ('ALL').
    if (selectedCompanyFilter !== 'ALL' && userIsMasterProfile) {
      return false;
    }

    // If not master, enforce tenant isolation strictly and exclude Master users
    if (!isMaster) {
      if (userIsMasterProfile) {
        return false;
      }
      const userTenant = u.companyId || 'ciclodrone';
      const currentTenant = currentUser.companyId || theme?.tenantId || 'ciclodrone';
      if (userTenant !== currentTenant) {
        return false;
      }
    } else if (selectedCompanyFilter !== 'ALL') {
      const userTenant = u.companyId || 'ciclodrone';
      if (userTenant !== selectedCompanyFilter) {
        return false;
      }
    }

    return (
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.roleLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.documentNumber && u.documentNumber.includes(searchQuery)) ||
      (u.companyId && u.companyId.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const filteredDrones = drones.filter(d => 
    d.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.anacPrefix.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.tradeName && c.tradeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.cpfCnpj.includes(searchQuery) ||
    c.cityState.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 px-3.5 py-2 bg-slate-900 text-white dark:bg-emerald-600 rounded-xl shadow-xl border border-emerald-400/40 flex items-center gap-2 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-slate-50 dark:from-slate-900 dark:via-purple-950/30 dark:to-slate-900 text-slate-900 dark:text-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-400/30 flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3 h-3" />
                Painel Administrativo
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                Governança & Cadastros
              </span>
            </div>
            <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Gestão Corporativa & Cadastros Gerais
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl leading-relaxed">
              Colaboradores, frota de drones, clientes rurais, salários base e tabela de comissões por hectare.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                if (activeTab === 'users') handleOpenNewUser();
                else if (activeTab === 'drones') handleOpenNewDrone();
                else if (activeTab === 'clients') handleOpenNewClient();
              }}
              className="px-3 py-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {activeTab === 'users' && 'Novo Usuário'}
                {activeTab === 'drones' && 'Novo Drone'}
                {activeTab === 'clients' && 'Novo Cliente'}
                {activeTab === 'compensation' && 'Recalcular'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center justify-start sm:justify-center gap-1.5 bg-white dark:bg-slate-800/90 p-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-2xs overflow-x-auto">
        <div className="flex items-center flex-wrap gap-1 justify-start sm:justify-center">
          <button
            onClick={() => { setActiveTab('users'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Usuários ({users.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('drones'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'drones'
                ? 'bg-sky-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Frota ({drones.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('clients'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Clientes ({clients.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('compensation'); setSearchQuery(''); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'compensation'
                ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Salários & Comissões</span>
          </button>

          <button
            onClick={() => { setActiveTab('pricing'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'pricing'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Precificação</span>
          </button>

          <button
            onClick={() => { setActiveTab('fleet'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'fleet'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Frota & Equipe</span>
          </button>

          <button
            onClick={() => { setActiveTab('branding'); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'branding'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>Logotipo & Marca</span>
          </button>
        </div>

        {/* Search Bar for items */}
        {activeTab !== 'compensation' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: USERS & CREW MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-600" />
                {isMaster ? 'Equipe & Usuários Multi-Empresas (Visão Master)' : `Equipe & Usuários • ${theme?.companyName || 'Empresa'}`}
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {isMaster 
                  ? 'Controle total sobre administradores, pilotos e operadores de todas as empresas registradas.'
                  : 'Cadastro e gestão de novos pilotos, auxiliares e operadores vinculados exclusivamente à sua empresa.'
                }
              </p>
            </div>
            <button
              onClick={handleOpenNewUser}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isMaster ? 'Cadastrar Novo Administrador / Usuário' : 'Adicionar Colaborador'}</span>
            </button>
          </div>

          {/* Master Company Filter Pills */}
          {isMaster && (
            <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-50 dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mr-1">
                <Building2 className="w-3.5 h-3.5 text-purple-600" />
                Filtrar por Empresa:
              </span>
              <button
                onClick={() => {
                  setSelectedCompanyFilter('ALL');
                  if (setTheme) {
                    setTheme(prev => ({
                      ...prev,
                      tenantId: 'ALL',
                      companyName: 'Visão Global (Todas as Empresas)',
                      tagline: 'Gestão Centralizada Multi-Empresa AgroSys',
                      primaryColor: '#059669',
                      secondaryColor: '#047857',
                      accentColor: '#10b981',
                      logoUrl: undefined,
                      logoIconId: undefined,
                    }));
                  }
                }}
                className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                  selectedCompanyFilter === 'ALL'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                🌐 Todas as Empresas ({users.length})
              </button>
              {PRESET_COMPANIES.map(comp => {
                const compCount = users.filter(u => !isMasterUser(u) && (u.companyId || 'ciclodrone') === comp.id).length;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSelectedCompanyFilter(comp.id);
                      if (setTheme) {
                        setTheme(getCompanyTheme(comp.id));
                      }
                    }}
                    className={`px-2.5 py-1 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedCompanyFilter === comp.id
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>🏢 {comp.name}</span>
                    <span className="opacity-70 text-[10px]">({compCount})</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredUsers.map((u) => {
              const roleColors: Record<UserRole, string> = {
                MASTER: 'bg-amber-100/90 text-amber-900 dark:bg-amber-950/80 dark:text-amber-200 border-amber-300/80 font-black',
                ADMIN: 'bg-purple-100/90 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-300/80 font-bold',
                USER: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/80',
                PILOT: 'bg-blue-100/90 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300/80',
                ASSISTANT: 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/80',
              };

              const compPreset = PRESET_COMPANIES.find(p => p.id === u.companyId);
              const companyName = u.isMaster || u.role === 'MASTER' ? 'Multi-Empresa Global' : (compPreset?.name || theme?.companyName || 'Ciclodrone');

              return (
                <div 
                  key={u.id}
                  className={`bg-white dark:bg-slate-800/95 border rounded-2xl p-3.5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                    u.status === 'INACTIVE' 
                      ? 'border-slate-200 dark:border-slate-800 opacity-60' 
                      : u.isMaster || u.role === 'MASTER'
                      ? 'border-amber-300 dark:border-amber-700/80 bg-gradient-to-b from-amber-50/20 to-white dark:from-amber-950/20 dark:to-slate-800/95'
                      : 'border-slate-200/80 dark:border-slate-700/80 hover:border-purple-400 dark:hover:border-purple-500'
                  }`}
                >
                  <div>
                    {/* Header: Avatar, Name, Role & Action Buttons */}
                    <div className="flex items-start justify-between gap-1.5 mb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          onClick={() => setActiveUserPhotoModal(u)}
                          className="relative cursor-pointer group shrink-0"
                          title="Clique para alterar foto de perfil"
                        >
                          <UserAvatar
                            user={u}
                            size="sm"
                            editable
                            onEditClick={() => setActiveUserPhotoModal(u)}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight flex items-center gap-1">
                            {u.name}
                            {(u.isMaster || u.role === 'MASTER') && <span title="Usuário Super Master">👑</span>}
                          </h3>
                          <span className={`inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded-md border ${roleColors[u.role] || roleColors.USER} truncate max-w-full`}>
                            {u.isMaster || u.role === 'MASTER' ? '👑 SUPER MASTER' : u.roleLabel}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setActiveUserPhotoModal(u)}
                          title="Alterar Foto de Perfil"
                          className="p-1 rounded-md bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          title="Editar Dados e Salário"
                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name)}
                          title="Excluir Usuário"
                          className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Compact Details Grid */}
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                          <Building2 className="w-3 h-3 shrink-0 text-purple-500" /> Empresa:
                        </span>
                        <span className="font-semibold text-purple-700 dark:text-purple-300 truncate max-w-[150px]" title={companyName}>
                          {u.isMaster || u.role === 'MASTER' ? '👑 Multi-Empresa' : companyName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                          <Mail className="w-3 h-3 shrink-0" /> E-mail:
                        </span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]" title={u.email}>
                          {u.email}
                        </span>
                      </div>

                      {u.phone && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                            <Phone className="w-3 h-3 shrink-0" /> Tel:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {u.phone}
                          </span>
                        </div>
                      )}

                      {u.documentNumber && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                            <FileText className="w-3 h-3 shrink-0" /> CPF/CNPJ:
                          </span>
                          <span className="font-mono text-slate-700 dark:text-slate-300 text-[10px]">
                            {u.documentNumber}
                          </span>
                        </div>
                      )}

                      {u.licenseCode && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                            <Award className="w-3 h-3 shrink-0 text-blue-500" /> Licença:
                          </span>
                          <span className="font-mono text-blue-600 dark:text-blue-400 font-bold text-[10px] truncate max-w-[130px]">
                            {u.licenseCode}
                          </span>
                        </div>
                      )}

                      {u.farmName && (
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-slate-400 flex items-center gap-1 text-[10px]">
                            <MapPin className="w-3 h-3 shrink-0 text-emerald-500" /> Fazenda:
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[140px]" title={u.farmName}>
                            {u.farmName}
                          </span>
                        </div>
                      )}

                      {u.salaryBase !== undefined && u.salaryBase > 0 && (
                        <div className="flex items-center justify-between pt-0.5 font-bold text-slate-900 dark:text-white">
                          <span className="text-slate-400 text-[10px]">Salário:</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                            {formatBRL(u.salaryBase)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Status & ID */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <button
                      onClick={() => handleToggleUserStatus(u)}
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                        u.status === 'INACTIVE'
                          ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                          : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                      }`}
                    >
                      {u.status === 'INACTIVE' ? '● Inativo' : '● Ativo'}
                    </button>

                    <span className="text-[9px] font-mono text-slate-400">
                      ID: {u.id}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DRONES & FLEET MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'drones' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Plane className="w-4 h-4 text-blue-600" />
              Frota de Drones & Certificações ANAC / DECEA
            </h2>
            <div className="flex items-center gap-2">
              {onOpenBatteryManager && (
                <button
                  onClick={() => onOpenBatteryManager()}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>Banco de Baterias ({batteries.length})</span>
                </button>
              )}
              <button
                onClick={handleOpenNewDrone}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar Novo Drone</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredDrones.map((d) => {
              const statusBadge = {
                READY: { label: 'Pronto p/ Voo', color: 'bg-emerald-100/90 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/80' },
                FLYING: { label: 'Em Operação', color: 'bg-blue-100/90 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-300/80 animate-pulse' },
                MAINTENANCE: { label: 'Em Manutenção', color: 'bg-rose-100/90 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300/80' },
                CHARGING: { label: 'Carregando Hub', color: 'bg-amber-100/90 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/80' },
              }[d.operationalStatus];

              const dronePacks = batteries.filter(b => b.droneId === d.id);
              const readyPacks = dronePacks.filter(b => b.status === 'READY');

              return (
                <div
                  key={d.id}
                  className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-500 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Photo, Model, Prefix & Actions */}
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          onClick={() => setActiveDronePhotoModal(d)}
                          className="relative group/pic cursor-pointer shrink-0"
                          title="Clique para alterar foto"
                        >
                          <DronePhoto
                            drone={d}
                            size="sm"
                            rounded="rounded-lg"
                            className="border border-slate-200 dark:border-slate-700 shadow-2xs transition-transform group-hover/pic:scale-105"
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                            {d.modelName}
                          </h3>
                          <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400 block truncate">
                            {d.anacPrefix}
                          </span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => setActiveDronePhotoModal(d)}
                          title="Alterar Foto do Drone"
                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 transition-colors cursor-pointer"
                        >
                          <Camera className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleOpenEditDrone(d)}
                          title="Editar Aeronave"
                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteDrone(d.id, d.anacPrefix)}
                          title="Remover Aeronave"
                          className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Status Pill & Battery Badge */}
                    <div className="mb-2 flex items-center gap-1.5 flex-wrap">
                      <span className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      {onOpenBatteryManager && (
                        <button
                          onClick={() => onOpenBatteryManager(d.id)}
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 transition-all flex items-center gap-1 cursor-pointer"
                          title="Configurar e gerenciar baterias vinculadas a este drone"
                        >
                          <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                          <span>{dronePacks.length} packs ({readyPacks.length} prontos)</span>
                        </button>
                      )}
                    </div>

                    {/* Quick Specs Chips */}
                    <div className="grid grid-cols-2 gap-1.5 my-2 text-center">
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 block">Tanque Calda</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {d.tankCapacityL} L
                        </span>
                      </div>
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                        <span className="text-[9px] text-slate-400 block">Horas Voo</span>
                        <span className="text-xs font-black text-slate-900 dark:text-white font-mono">
                          {d.totalFlightHours.toFixed(1).replace('.', ',')} h
                        </span>
                      </div>
                    </div>

                    {/* Details List */}
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 text-[10px]">DECEA:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[10px] truncate max-w-[130px]">{d.deceaRegistration}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 text-[10px]">Bateria:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px]">
                          <BatteryCharging className="w-3 h-3" />
                          {d.batteryStatusPct}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 text-[10px]">Revisão:</span>
                        <span className={`font-bold text-[10px] ${d.nextMaintenanceHours < 20 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          em {d.nextMaintenanceHours}h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[9px] text-slate-400 font-medium">Payload: {d.maxPayloadKg}kg</span>
                    <div className="flex items-center gap-2">
                      {onOpenBatteryManager && (
                        <button
                          onClick={() => onOpenBatteryManager(d.id)}
                          className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Zap className="w-2.5 h-2.5" /> Baterias
                        </button>
                      )}
                      <button
                        onClick={() => {
                          const nextStatuses: AgriculturalDrone['operationalStatus'][] = ['READY', 'FLYING', 'CHARGING', 'MAINTENANCE'];
                          const currIndex = nextStatuses.indexOf(d.operationalStatus);
                          const next = nextStatuses[(currIndex + 1) % nextStatuses.length];
                          setDrones(prev => prev.map(item => item.id === d.id ? { ...item, operationalStatus: next } : item));
                          showToast(`Status do drone ${d.anacPrefix} alterado.`);
                        }}
                        className="text-[10px] font-extrabold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Status →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLIENTS & PRODUCERS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Carteira de Clientes, Fazendas & Limites de Crédito
            </h2>
            <button
              onClick={handleOpenNewClient}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Cadastrar Novo Cliente</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredClients.map((c) => {
              return (
                <div
                  key={c.id}
                  className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Name, TradeName & Action Buttons */}
                    <div className="flex items-start justify-between gap-1.5 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white truncate leading-tight">
                          {c.name}
                        </h3>
                        {c.tradeName && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate font-medium mt-0.5">
                            {c.tradeName}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenEditClient(c)}
                          title="Editar Cliente"
                          className="p-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteClient(c.id, c.name)}
                          title="Remover Cliente"
                          className="p-1 rounded-md bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700/60 pt-2">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 text-[10px]">CPF/CNPJ:</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[10px]">{c.cpfCnpj}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 text-[10px]">Contato:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200 text-[10px]">{c.phone}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-slate-400 text-[10px]">UF/Cidade:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[10px] truncate max-w-[130px]">{c.cityState}</span>
                      </div>

                      {/* Fazendas Chips */}
                      {c.farmNames && c.farmNames.length > 0 && (
                        <div className="pt-1">
                          <span className="text-[9px] font-bold text-slate-400 block mb-0.5">
                            Fazendas ({c.farmNames.length}):
                          </span>
                          <div className="flex flex-wrap gap-1 max-h-12 overflow-y-auto">
                            {c.farmNames.map((f, idx) => (
                              <span key={idx} className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                                🌱 {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Credit & Terms Chips */}
                      <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 text-center">
                        <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50">
                          <span className="text-[8px] text-slate-400 block">Crédito</span>
                          <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300 font-mono">
                            {formatBRL(c.creditLimit)}
                          </span>
                        </div>
                        <div className="p-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                          <span className="text-[8px] text-slate-400 block">Prazo</span>
                          <span className="text-[11px] font-black text-blue-700 dark:text-blue-300">
                            {c.paymentTermsDays}d
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer Status */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <span className="text-[9px] font-medium text-slate-400">
                      Área: {c.totalHectaresRegistered} ha
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      c.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {c.status === 'ACTIVE' ? 'Ativo' : 'Bloqueado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SALARIES & COMMISSION COMPENSATION POLICIES */}
      {/* ========================================================================= */}
      {activeTab === 'compensation' && (
        <div className="space-y-3">
          <form onSubmit={handleSaveCompensation} className="space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              {/* Pilot Compensation Rules */}
              <div className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      <Plane className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        Remuneração de Pilotos (CLT + Comissões)
                      </h3>
                      <span className="text-[10px] text-slate-400">Aeronaves remotas e voo agrícola</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-200/60 dark:border-blue-800/60">
                    ANAC / DECEA
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Salário Fixo Base Mensal (R$)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                          R$
                        </span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={pilotSalaryInput}
                        onChange={(e) => {
                          setPilotSalaryInput(e.target.value);
                          const parsed = parseInputNumber(e.target.value);
                          setCompForm(prev => ({ ...prev, pilotBaseSalary: parsed }));
                        }}
                        onBlur={() => {
                          setPilotSalaryInput(formatDecimal(compForm.pilotBaseSalary, 2));
                        }}
                        className="w-full pl-9 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="4.800,00"
                      />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Valor em Moeda (BRL):</span>
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {formatBRL(compForm.pilotBaseSalary)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Comissão por Hectare (R$/ha)
                      </label>
                      <input
                        type="number"
                        step="0.25"
                        value={compForm.pilotCommissionPerHa}
                        onChange={(e) => setCompForm({ ...compForm, pilotCommissionPerHa: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Adic. Periculosidade (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={compForm.pilotHazardPayPct}
                        onChange={(e) => setCompForm({ ...compForm, pilotHazardPayPct: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 space-y-1.5">
                    <span className="font-extrabold text-blue-900 dark:text-blue-300 block text-[11px]">
                      🎯 Bônus de Alta Produtividade Diária
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Meta Diária (ha):</label>
                        <input
                          type="number"
                          value={compForm.pilotDailyGoalBonusHa}
                          onChange={(e) => setCompForm({ ...compForm, pilotDailyGoalBonusHa: Number(e.target.value) })}
                          className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-0.5">Valor do Bônus (R$):</label>
                        <input
                          type="number"
                          value={compForm.pilotDailyGoalBonusValue}
                          onChange={(e) => setCompForm({ ...compForm, pilotDailyGoalBonusValue: Number(e.target.value) })}
                          className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assistant Compensation Rules */}
              <div className="bg-white dark:bg-slate-800/95 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/80">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-slate-900 dark:text-white">
                        Remuneração de Auxiliares de Calda
                      </h3>
                      <span className="text-[10px] text-slate-400">Preparo de calda, baterias e NR-31</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/80 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-800/60">
                    NR-31 & InpEV
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                      Salário Fixo Base Mensal (R$)
                    </label>
                    <div className="relative rounded-lg shadow-2xs">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-400 font-mono">
                          R$
                        </span>
                      </div>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={assistantSalaryInput}
                        onChange={(e) => {
                          setAssistantSalaryInput(e.target.value);
                          const parsed = parseInputNumber(e.target.value);
                          setCompForm(prev => ({ ...prev, assistantBaseSalary: parsed }));
                        }}
                        onBlur={() => {
                          setAssistantSalaryInput(formatDecimal(compForm.assistantBaseSalary, 2));
                        }}
                        className="w-full pl-9 pr-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                        placeholder="2.650,00"
                      />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Valor em Moeda (BRL):</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {formatBRL(compForm.assistantBaseSalary)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Comissão de Solo (R$/ha)
                      </label>
                      <input
                        type="number"
                        step="0.10"
                        value={compForm.assistantCommissionPerHa}
                        onChange={(e) => setCompForm({ ...compForm, assistantCommissionPerHa: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-amber-600 dark:text-amber-400 focus:ring-2 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1 text-[11px]">
                        Adic. Insalubridade (%)
                      </label>
                      <input
                        type="number"
                        step="1"
                        value={compForm.assistantNr31InsalubrityPct}
                        onChange={(e) => setCompForm({ ...compForm, assistantNr31InsalubrityPct: Number(e.target.value) })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/40 space-y-1.5">
                    <span className="font-extrabold text-amber-900 dark:text-amber-300 block text-[11px]">
                      🧪 Bônus por Zero Contaminação e Logística InpEV
                    </span>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-0.5">Bônus Diário por Destinação Correta (R$):</label>
                      <input
                        type="number"
                        value={compForm.assistantDailyGoalBonusValue}
                        onChange={(e) => setCompForm({ ...compForm, assistantDailyGoalBonusValue: Number(e.target.value) })}
                        className="w-full px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono text-emerald-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Operational Simulator */}
            <div className="bg-slate-900 text-white p-3.5 rounded-xl border border-slate-800 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-xs font-black">
                    Simulador em Tempo Real: Custo de Tripulação por Jornada de Aplicação
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[11px] text-slate-300">Hectares simulados no dia:</span>
                  <input
                    type="number"
                    value={simulatedHa}
                    onChange={(e) => setSimulatedHa(Math.max(1, Number(e.target.value)))}
                    className="w-16 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-white font-mono font-bold text-center text-xs"
                  />
                  <span className="text-[11px] text-slate-400">ha</span>
                </div>
              </div>

              {(() => {
                const pilotCom = simulatedHa * compForm.pilotCommissionPerHa + (simulatedHa >= compForm.pilotDailyGoalBonusHa ? compForm.pilotDailyGoalBonusValue : 0);
                const assistantCom = simulatedHa * compForm.assistantCommissionPerHa + (simulatedHa >= 80 ? compForm.assistantDailyGoalBonusValue : 0);
                const totalCrewDay = pilotCom + assistantCom;

                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block mb-0.5">Comissão Piloto ({formatDecimal(simulatedHa, 0)} ha)</span>
                      <span className="text-base font-black font-mono text-blue-400">
                        {formatBRL(pilotCom)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Taxa: {formatBRL(compForm.pilotCommissionPerHa)}/ha {simulatedHa >= compForm.pilotDailyGoalBonusHa && `+ Bônus ${formatBRL(compForm.pilotDailyGoalBonusValue)}`}
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60">
                      <span className="text-[11px] text-slate-400 block mb-0.5">Comissão Auxiliar ({formatDecimal(simulatedHa, 0)} ha)</span>
                      <span className="text-base font-black font-mono text-amber-400">
                        {formatBRL(assistantCom)}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Taxa: {formatBRL(compForm.assistantCommissionPerHa)}/ha + Apoio NR-31
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-800/80 border border-emerald-500/30">
                      <span className="text-[11px] text-slate-400 block mb-0.5">Custo Total Variável da Tripulação</span>
                      <span className="text-base font-black font-mono text-emerald-400">
                        {formatBRL(totalCrewDay)}
                      </span>
                      <p className="text-[10px] text-emerald-300 mt-0.5">
                        {formatBRL(totalCrewDay / simulatedHa)} / hectare aplicado
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar e Aplicar Novas Regras Salariais e Comissões</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'pricing' && (
        <PricingMatrixView
          currentUser={currentUser}
          pricingRules={pricingRules}
          setPricingRules={setPricingRules}
        />
      )}

      {activeTab === 'fleet' && (
        <FleetDronesView
          currentUser={currentUser}
          drones={drones}
          setDrones={setDrones}
          pilots={pilots}
          setPilots={setPilots}
          assistants={assistants}
          setAssistants={setAssistants}
          maintenanceLogs={maintenanceLogs}
          setMaintenanceLogs={setMaintenanceLogs}
          onOpenAdminManagement={() => setActiveTab('users')}
        />
      )}

      {activeTab === 'branding' && theme && (
        <AdminBrandingStudio
          currentUser={currentUser}
          theme={theme}
          setTheme={setTheme}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          onSwitchToAdmin={onSwitchToAdmin}
          onNavigate={onNavigate}
        />
      )}

      {activeTab === 'virtual-tour' && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
           <p className="text-sm text-slate-600 dark:text-slate-300">Conteúdo de Tour Virtual</p>
        </div>
      )}

      {activeTab === 'help' && (
        <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
           <p className="text-sm text-slate-600 dark:text-slate-300">Conteúdo de Ajuda & Manuais</p>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT USER */}
      {/* ========================================================================= */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingUser ? `Editar Colaborador: ${editingUser.name}` : 'Cadastrar Novo Usuário / Colaborador'}
                </h3>
              </div>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 mt-4">
              {/* Photo Upload & Preview Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Foto do Usuário / Colaborador</span>
                  </label>
                  {userFormData.photoUrl && (
                    <button
                      type="button"
                      onClick={() => setUserFormData({ ...userFormData, photoUrl: '' })}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                    >
                      Remover Foto
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative group/avatar cursor-pointer flex-shrink-0">
                    <UserAvatar
                      user={{
                        id: editingUser?.id || 'temp',
                        name: userFormData.name || 'U',
                        role: userFormData.role || 'USER',
                        roleLabel: userFormData.roleLabel || 'Colaborador',
                        email: userFormData.email || '',
                        badge: userFormData.badge || 'Agro',
                        photoUrl: userFormData.photoUrl,
                      }}
                      size="lg"
                      showRoleBadge
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-100 hover:bg-purple-200 dark:bg-purple-950/60 dark:hover:bg-purple-900/80 text-purple-800 dark:text-purple-300 font-bold text-xs cursor-pointer transition-colors shadow-2xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Fazer Upload do Arquivo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (loadEvent) => {
                                const result = loadEvent.target?.result as string;
                                if (result) {
                                  setUserFormData({ ...userFormData, photoUrl: result });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <span className="text-[11px] text-slate-400">ou selecione um avatar rápido:</span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {PRESET_AVATARS[userFormData.role || 'USER']?.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setUserFormData({ ...userFormData, photoUrl: preset.url })}
                          className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-transform hover:scale-110 flex-shrink-0 cursor-pointer ${
                            userFormData.photoUrl === preset.url
                              ? 'border-purple-600 ring-2 ring-purple-400'
                              : 'border-slate-300 dark:border-slate-600 hover:border-purple-400'
                          }`}
                          title={preset.label}
                        >
                          <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={userFormData.photoUrl || ''}
                        onChange={(e) => setUserFormData({ ...userFormData, photoUrl: e.target.value })}
                        placeholder="Ou cole o link direto da imagem (URL https://...)"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={userFormData.name || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: Cmdt. Marcos Silva"
                  />
                </div>

                {/* Company Selection Field */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Empresa Vinculada *
                  </label>
                  {isMaster ? (
                    <select
                      value={userFormData.companyId || 'ciclodrone'}
                      onChange={(e) => setUserFormData({ ...userFormData, companyId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                    >
                      {PRESET_COMPANIES.map(comp => (
                        <option key={comp.id} value={comp.id}>
                          🏢 {comp.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="w-full px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 truncate">
                        <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate">{PRESET_COMPANIES.find(p => p.id === (currentUser.companyId || theme?.tenantId))?.name || theme?.companyName || 'Empresa Local'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium shrink-0">(Sua Empresa)</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Perfil / Função no Sistema *
                  </label>
                  <select
                    value={userFormData.role || (isMaster ? 'ADMIN' : 'PILOT')}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {isMaster ? (
                      <>
                        <option value="ADMIN">🛡️ Administrador da Empresa (Gestão Local da Empresa)</option>
                        <option value="PILOT">✈️ Piloto de Drone (DECEA / Operações de Voo)</option>
                        <option value="ASSISTANT">🧪 Auxiliar de Pulverização (Calda & NR-31)</option>
                        <option value="USER">🌾 Produtor Rural / Cliente (Acompanhamento & OS)</option>
                        <option value="MASTER">👑 Super Master (Privilégio Total Multi-Empresa)</option>
                      </>
                    ) : (
                      <>
                        <option value="PILOT">✈️ Piloto de Drone (DECEA / Operações de Voo)</option>
                        <option value="ASSISTANT">🧪 Auxiliar de Pulverização (Calda & NR-31)</option>
                        <option value="USER">🌾 Produtor Rural / Cliente (Acompanhamento & OS)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    value={userFormData.email || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="marcos@empresa.com.br"
                  />
                </div>

                {/* Password Fields */}
                <div className="sm:col-span-2 bg-purple-50/70 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200/80 dark:border-purple-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase text-purple-950 dark:text-purple-200 flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      {editingUser ? 'Senha de Acesso (Deixe em branco para manter)' : 'Cadastro de Senha de Acesso *'}
                    </label>
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                      Mínimo 6 caracteres
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Senha do Usuário {!editingUser && '*'}
                      </label>
                      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-purple-500">
                        <input
                          type={showUserPassword ? 'text' : 'password'}
                          required={!editingUser}
                          value={userPasswordInput}
                          onChange={(e) => setUserPasswordInput(e.target.value)}
                          className="bg-transparent font-mono text-xs text-slate-900 dark:text-white outline-none w-full placeholder-slate-400"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUserPassword(!showUserPassword)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer transition-colors"
                        >
                          {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Confirmar Senha {!editingUser && '*'}
                      </label>
                      <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-purple-500">
                        <input
                          type={showUserPassword ? 'text' : 'password'}
                          required={!editingUser}
                          value={userConfirmPasswordInput}
                          onChange={(e) => setUserConfirmPasswordInput(e.target.value)}
                          className="bg-transparent font-mono text-xs text-slate-900 dark:text-white outline-none w-full placeholder-slate-400"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={userFormData.phone || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="(64) 99999-8888"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CPF / CNPJ
                  </label>
                  <input
                    type="text"
                    value={userFormData.documentNumber || ''}
                    onChange={(e) => setUserFormData({ ...userFormData, documentNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="000.000.000-00"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Salário Base Mensal (R$)
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        R$
                      </span>
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={userSalaryInput}
                      onChange={(e) => {
                        const raw = e.target.value;
                        setUserSalaryInput(raw);
                        const parsed = parseInputNumber(raw);
                        setUserFormData(prev => ({ ...prev, salaryBase: parsed }));
                      }}
                      onBlur={() => {
                        const val = userFormData.salaryBase || 0;
                        setUserSalaryInput(formatDecimal(val, 2));
                      }}
                      className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="0,00"
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Formato Monetário:</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {formatBRL(userFormData.salaryBase || 0)}
                    </span>
                  </div>
                </div>

                {userFormData.role === 'PILOT' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Código / Licença DECEA SARPAS / ANAC
                    </label>
                    <input
                      type="text"
                      value={userFormData.licenseCode || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, licenseCode: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-blue-600 font-bold"
                      placeholder="DECEA-SARPAS-BR-8921"
                    />
                  </div>
                )}

                {userFormData.role === 'USER' && (
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Fazenda Vinculada / Propriedade Rural
                    </label>
                    <input
                      type="text"
                      value={userFormData.farmName || ''}
                      onChange={(e) => setUserFormData({ ...userFormData, farmName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-semibold"
                      placeholder="Fazenda Santa Fé (Rio Verde - GO)"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer"
                >
                  {editingUser ? 'Atualizar Colaborador' : 'Cadastrar Colaborador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT DRONE */}
      {/* ========================================================================= */}
      {isDroneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Plane className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingDrone ? `Editar Drone: ${editingDrone.anacPrefix}` : 'Cadastrar Novo Drone Agrícola'}
                </h3>
              </div>
              <button
                onClick={() => setIsDroneModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDrone} className="space-y-4 mt-4 text-xs">
              {/* Quick Model Selector Chips */}
              <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 block">
                  ⚡ Preenchimento Rápido por Modelo Homologado:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { model: 'DJI Agras T20P', brand: 'DJI_AGRICULTURE', tank: 20, payload: 25, photo: PRESET_DRONE_PHOTOS.t20p.url },
                    { model: 'DJI Agras T40', brand: 'DJI_AGRICULTURE', tank: 40, payload: 50, photo: PRESET_DRONE_PHOTOS.t40.url },
                    { model: 'DJI Agras T50', brand: 'DJI_AGRICULTURE', tank: 50, payload: 50, photo: PRESET_DRONE_PHOTOS.t50.url },
                    { model: 'XAG P100 Pro', brand: 'XAG', tank: 50, payload: 50, photo: PRESET_DRONE_PHOTOS.xag.url },
                  ].map((preset) => (
                    <button
                      key={preset.model}
                      type="button"
                      onClick={() => {
                        setDroneFormData(prev => ({
                          ...prev,
                          modelName: preset.model,
                          brand: preset.brand as any,
                          tankCapacityL: preset.tank,
                          maxPayloadKg: preset.payload,
                          photoUrl: preset.photo,
                        }));
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                        droneFormData.modelName === preset.model
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-emerald-400'
                      }`}
                    >
                      <img
                        src={preset.photo}
                        alt={preset.model}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-[11px] truncate">{preset.model}</div>
                        <div className="text-[9px] opacity-80">{preset.tank}L Tanque</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photo Upload & Preview Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    Foto da Aeronave (Exibida em todo o sistema)
                  </label>
                  {droneFormData.photoUrl && (
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                      ✓ Foto Selecionada
                    </span>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-700 shadow-xs bg-slate-900 flex-shrink-0 relative group">
                    <DronePhoto
                      modelName={droneFormData.modelName || 'Drone'}
                      photoUrl={droneFormData.photoUrl}
                      size="xl"
                      rounded="rounded-2xl"
                      className="w-full h-full"
                    />
                  </div>

                  <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer inline-flex items-center gap-1.5 transition-colors">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Carregar do Dispositivo</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              const file = e.target.files[0];
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const img = new Image();
                                img.onload = () => {
                                  const canvas = document.createElement('canvas');
                                  const maxDim = 1000;
                                  let width = img.width;
                                  let height = img.height;
                                  if (width > height && width > maxDim) {
                                    height = Math.round((height * maxDim) / width);
                                    width = maxDim;
                                  } else if (height > maxDim) {
                                    width = Math.round((width * maxDim) / height);
                                    height = maxDim;
                                  }
                                  canvas.width = width;
                                  canvas.height = height;
                                  const ctx = canvas.getContext('2d');
                                  if (ctx) {
                                    ctx.drawImage(img, 0, 0, width, height);
                                    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                                    setDroneFormData(prev => ({ ...prev, photoUrl: dataUrl }));
                                  }
                                };
                                img.src = ev.target?.result as string;
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          const fallback = getDronePhotoUrl({ modelName: droneFormData.modelName });
                          setDroneFormData(prev => ({ ...prev, photoUrl: fallback }));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                      >
                        Foto Padrão do Modelo
                      </button>
                    </div>

                    <input
                      type="url"
                      placeholder="Ou cole o link da foto (URL)..."
                      value={droneFormData.photoUrl || ''}
                      onChange={(e) => setDroneFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                      className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fabricante / Marca *
                  </label>
                  <select
                    value={droneFormData.brand || 'DJI_AGRICULTURE'}
                    onChange={(e) => setDroneFormData({ ...droneFormData, brand: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                  >
                    <option value="DJI_AGRICULTURE">DJI Agriculture</option>
                    <option value="XAG">XAG Smart Agriculture</option>
                    <option value="EFT_JMR">EFT / JMR Agrícola</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo do Drone *
                  </label>
                  <input
                    type="text"
                    required
                    value={droneFormData.modelName || ''}
                    onChange={(e) => setDroneFormData({ ...droneFormData, modelName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    placeholder="Ex: DJI Agras T50 / T40"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prefixo ANAC (Identificação) *
                  </label>
                  <input
                    type="text"
                    required
                    value={droneFormData.anacPrefix || ''}
                    onChange={(e) => setDroneFormData({ ...droneFormData, anacPrefix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-blue-600"
                    placeholder="PP-AGR-03"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Registro DECEA SARPAS
                  </label>
                  <input
                    type="text"
                    value={droneFormData.deceaRegistration || ''}
                    onChange={(e) => setDroneFormData({ ...droneFormData, deceaRegistration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    placeholder="SARPAS-98215-BR"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Capacidade do Tanque (Litros)
                  </label>
                  <input
                    type="number"
                    value={droneFormData.tankCapacityL || 40}
                    onChange={(e) => setDroneFormData({ ...droneFormData, tankCapacityL: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payload Máximo (kg)
                  </label>
                  <input
                    type="number"
                    value={droneFormData.maxPayloadKg || 50}
                    onChange={(e) => setDroneFormData({ ...droneFormData, maxPayloadKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Horas Totais de Voo Acumuladas
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={droneFormData.totalFlightHours || 0}
                    onChange={(e) => setDroneFormData({ ...droneFormData, totalFlightHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status Operacional
                  </label>
                  <select
                    value={droneFormData.operationalStatus || 'READY'}
                    onChange={(e) => setDroneFormData({ ...droneFormData, operationalStatus: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
                  >
                    <option value="READY">🟢 Pronto para Voo</option>
                    <option value="FLYING">🔵 Em Operação / Em Voo</option>
                    <option value="CHARGING">🟡 Carregando Baterias</option>
                    <option value="MAINTENANCE">🔴 Em Manutenção Preventiva</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDroneModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer"
                >
                  {editingDrone ? 'Atualizar Drone' : 'Salvar Drone'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT CLIENT */}
      {/* ========================================================================= */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 my-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingClient ? `Editar Cliente: ${editingClient.name}` : 'Cadastrar Novo Produtor Rural / Cliente'}
                </h3>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome / Razão Social *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientFormData.name || ''}
                    onChange={(e) => setClientFormData({ ...clientFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                    placeholder="Ex: Grupo Agropecuário Silva"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Fantasia
                  </label>
                  <input
                    type="text"
                    value={clientFormData.tradeName || ''}
                    onChange={(e) => setClientFormData({ ...clientFormData, tradeName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    placeholder="Fazendas Santa Fé"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    CPF / CNPJ *
                  </label>
                  <input
                    type="text"
                    required
                    value={clientFormData.cpfCnpj || ''}
                    onChange={(e) => setClientFormData({ ...clientFormData, cpfCnpj: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold"
                    placeholder="12.345.678/0001-90"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Inscrição Estadual (IE)
                  </label>
                  <input
                    type="text"
                    value={clientFormData.stateRegistration || ''}
                    onChange={(e) => setClientFormData({ ...clientFormData, stateRegistration: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
                    placeholder="10.892.441-0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={clientFormData.phone || ''}
                    onChange={(e) => setClientFormData({ ...clientFormData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                    placeholder="(64) 99888-7766"
                  />
                </div>

                <div className="sm:col-span-2">
                  <BrazilCityAutocomplete
                    label="Município e UF de Cadastro do Cliente (Busca Automática IBGE)"
                    value={clientFormData.cityState || ''}
                    onChange={(cityStateStr) => setClientFormData({ ...clientFormData, cityState: cityStateStr })}
                    placeholder="Digite e busque a cidade do cliente (ex: Rio Verde - GO)..."
                    helperText="A cidade cadastrada aqui é vinculada automaticamente como cidade meteorológica de referência em agendamentos e Ordens de Serviço."
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Limite de Crédito para Pulverizações (R$)
                  </label>
                  <input
                    type="number"
                    value={clientFormData.creditLimit || 50000}
                    onChange={(e) => setClientFormData({ ...clientFormData, creditLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono font-bold text-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Prazo Padrão de Faturamento (Dias)
                  </label>
                  <input
                    type="number"
                    value={clientFormData.paymentTermsDays || 30}
                    onChange={(e) => setClientFormData({ ...clientFormData, paymentTermsDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Fazendas (Separe por vírgulas)
                  </label>
                  <input
                    type="text"
                    value={clientFormData.farmNames ? clientFormData.farmNames.join(', ') : ''}
                    onChange={(e) => setClientFormData({ 
                      ...clientFormData, 
                      farmNames: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                    })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-emerald-700 dark:text-emerald-300"
                    placeholder="Fazenda Santa Fé, Retiro do Sol, Gleba Norte"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer"
                >
                  {editingClient ? 'Salvar Alterações' : 'Cadastrar Produtor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drone Photo Upload Modal */}
      <DronePhotoUploadModal
        isOpen={Boolean(activeDronePhotoModal)}
        onClose={() => setActiveDronePhotoModal(null)}
        drone={activeDronePhotoModal}
        onSavePhoto={(newPhotoUrl) => {
          if (!activeDronePhotoModal) return;
          setDrones(prev => prev.map(d => d.id === activeDronePhotoModal.id ? { ...d, photoUrl: newPhotoUrl } : d));
          showToast(`Foto do drone ${activeDronePhotoModal.anacPrefix} atualizada!`);
        }}
      />

      {/* User / Employee Photo Upload Modal */}
      <UserPhotoUploadModal
        isOpen={Boolean(activeUserPhotoModal)}
        onClose={() => setActiveUserPhotoModal(null)}
        user={activeUserPhotoModal}
        onSavePhoto={(newPhotoUrl) => {
          if (!activeUserPhotoModal) return;
          saveStoredUserPhoto(activeUserPhotoModal.id, newPhotoUrl);
          setUsers(prev => prev.map(u => u.id === activeUserPhotoModal.id ? { ...u, photoUrl: newPhotoUrl, avatarUrl: newPhotoUrl } : u));
          setPilots(prev => prev.map(p => (p.id === activeUserPhotoModal.id || p.cpf === activeUserPhotoModal.documentNumber) ? { ...p, photoUrl: newPhotoUrl, avatarUrl: newPhotoUrl } : p));
          setAssistants(prev => prev.map(a => (a.id === activeUserPhotoModal.id || a.cpf === activeUserPhotoModal.documentNumber) ? { ...a, photoUrl: newPhotoUrl, avatarUrl: newPhotoUrl } : a));
          showToast(`Foto de "${activeUserPhotoModal.name}" atualizada com sucesso!`);
        }}
        title={`Alterar Foto de Perfil: ${activeUserPhotoModal?.name || ''}`}
      />
    </div>
  );
};
