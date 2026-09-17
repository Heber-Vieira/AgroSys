import React, { useState, useMemo } from 'react';
import { 
  AppViewMode, 
  UserProfile, 
  WhiteLabelTheme, 
  ServiceOrder, 
  FarmPlot, 
  AgriculturalDrone, 
  SprayQuotation,
  FinancialEntry
} from '../types';
import { showToast as showAgroToast } from '../services/notificationService';
import { canUserAccessView, hasAdminPrivileges, isMasterUser, filterOrdersForUser } from '../utils/userPermissions';
import { formatInteger } from '../utils/formatters';
import { 
  ClipboardList, 
  Workflow, 
  Calendar, 
  MapPin, 
  Activity, 
  Droplets, 
  Wind, 
  Plane, 
  FileCheck2, 
  DollarSign, 
  BookOpen, 
  HelpCircle, 
  Search, 
  ArrowRight, 
  Sparkles, 
  Sliders, 
  Palette, 
  Database, 
  Compass, 
  ShieldCheck, 
  TrendingUp, 
  Zap,
  Users,
  Lock,
  LayoutDashboard,
  Printer,
  FileText,
  GripVertical,
  RotateCcw
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { ModuleSummaryBalloon } from './ModuleSummaryBalloon';

interface HomeHubViewProps {
  currentUser: UserProfile;
  theme: WhiteLabelTheme;
  orders: ServiceOrder[];
  plots: FarmPlot[];
  drones: AgriculturalDrone[];
  quotations: SprayQuotation[];
  financials: FinancialEntry[];
  onNavigate: (view: AppViewMode) => void;
  onOpenNewOS?: () => void;
  onOpenReportModal?: (orderId?: string) => void;
  onStartLiveTour?: () => void;
  onOpenAccessControl?: () => void;
}

interface HubItem {
  id: AppViewMode;
  title: string;
  subtitle: string;
  category: 'operacoes' | 'agronomia' | 'comercial' | 'frota' | 'sistema';
  icon: React.ReactNode;
  iconBg: string;
  statBadge: string;
  tags: string[];
}

export const HomeHubView: React.FC<HomeHubViewProps> = ({
  currentUser,
  theme,
  orders = [],
  plots = [],
  drones = [],
  quotations = [],
  onNavigate,
  onStartLiveTour,
  onOpenAccessControl,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSummaryModule, setSelectedSummaryModule] = useState<AppViewMode | null>(null);

  // Card reordering state with persistence per user
  const storageKey = `agrosys_hub_card_order_${currentUser.id || 'default'}`;
  const [cardOrder, setCardOrder] = useState<AppViewMode[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load card order from localStorage', e);
    }
    return [];
  });

  const [draggedItemId, setDraggedItemId] = useState<AppViewMode | null>(null);
  const [dragOverItemId, setDragOverItemId] = useState<AppViewMode | null>(null);
  const [isDraggingActive, setIsDraggingActive] = useState<boolean>(false);
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<AppViewMode | null>(null);

  // Reordering function when dropping item
  const handleReorder = (sourceId: AppViewMode, targetId: AppViewMode) => {
    if (sourceId === targetId) return;

    const defaultIds = allItems.map(i => i.id);
    const currentOrderedIds = cardOrder.length > 0
      ? [
          ...cardOrder.filter(id => defaultIds.includes(id)),
          ...defaultIds.filter(id => !cardOrder.includes(id))
        ]
      : [...defaultIds];

    const sourceIndex = currentOrderedIds.indexOf(sourceId);
    const targetIndex = currentOrderedIds.indexOf(targetId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newOrder = [...currentOrderedIds];
    newOrder.splice(sourceIndex, 1);
    newOrder.splice(targetIndex, 0, sourceId);

    setCardOrder(newOrder);
    setRecentlyDroppedId(sourceId);
    setTimeout(() => {
      setRecentlyDroppedId(null);
    }, 850);

    try {
      localStorage.setItem(storageKey, JSON.stringify(newOrder));
      showAgroToast('Ordem dos módulos reorganizada!', 'success');
    } catch (e) {
      console.error('Failed to save card order', e);
    }
  };

  const handleResetOrder = () => {
    setCardOrder([]);
    try {
      localStorage.removeItem(storageKey);
      showAgroToast('Ordem padrão dos módulos restaurada.', 'info');
    } catch (e) {
      console.error(e);
    }
  };

  // 1. Data Isolation & RBAC: Precision Filtering for Current User (Pilots/Assistants/Clients)
  const userScopedOrders = useMemo(() => {
    return filterOrdersForUser(orders, currentUser, undefined, undefined);
  }, [orders, currentUser]);

  // Operational metrics
  const activeOrdersCount = userScopedOrders.filter(o => o.status === 'OPERATING' || o.status === 'IN_TRANSIT').length;
  const scheduledOrdersCount = userScopedOrders.filter(o => o.status === 'SCHEDULED').length;
  const completedOrdersCount = userScopedOrders.filter(o => o.status === 'COMPLETED').length;
  const totalAppliedHa = userScopedOrders.reduce((acc, o) => acc + (o.sprayedHectares || 0), 0);
  const operationalDronesCount = drones.filter(d => d.operationalStatus === 'READY' || d.operationalStatus === 'FLYING').length;

  // Full 20 modules list (exactly 4 rows x 5 columns = 20 cards on desktop)
  const allItems: HubItem[] = useMemo(() => [
    // Linha 1: Executivo & Operações (5 cards)
    {
      id: 'dashboard',
      title: 'Painel Geral Executivo (BI)',
      subtitle: 'Indicadores globais e hectares aplicados',
      category: 'frota',
      icon: <LayoutDashboard className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600',
      statBadge: `${formatInteger(totalAppliedHa)} ha total`,
      tags: ['painel', 'dashboard', 'bi', 'métricas', 'executivo', 'geral'],
    },
    {
      id: 'spray-workflow',
      title: 'Esteira do Processo (10 Passos)',
      subtitle: 'Passo a passo operacional ponta a ponta',
      category: 'operacoes',
      icon: <Workflow className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: 'Ciclo Completo',
      tags: ['passo a passo', 'esteira', 'workflow', 'processo', 'pulverização', 'mapa'],
    },
    {
      id: 'orders',
      title: 'Ordens de Serviço (OS)',
      subtitle: 'Planejamento e despacho de voo',
      category: 'operacoes',
      icon: <ClipboardList className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: activeOrdersCount > 0 ? `${activeOrdersCount} em voo` : `${scheduledOrdersCount} agendadas`,
      tags: ['os', 'ordens', 'serviço', 'voo', 'despacho', 'aplicação'],
    },
    {
      id: 'schedule',
      title: 'Agenda Operacional',
      subtitle: 'Escala de equipes e cronograma de voos',
      category: 'operacoes',
      icon: <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      iconBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-600',
      statBadge: `${orders.length} agendamentos`,
      tags: ['agenda', 'escala', 'calendário', 'piloto'],
    },
    {
      id: 'gis',
      title: 'Talhões Agrícolas (GIS)',
      subtitle: 'Mapas de satélite, limites e áreas úteis',
      category: 'operacoes',
      icon: <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600',
      statBadge: `${plots.length} talhões cadastrados`,
      tags: ['gis', 'mapa', 'talhão', 'satélite', 'área'],
    },

    // Linha 2: Telemetria & Agronomia & Comercial (5 cards)
    {
      id: 'telemetry',
      title: 'Telemetria de Voo',
      subtitle: 'Altitude, vazão e telemetria ao vivo',
      category: 'operacoes',
      icon: <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600',
      statBadge: 'Tempo Real',
      tags: ['telemetria', 'tempo real', 'altitude', 'vazão', 'bateria'],
    },
    {
      id: 'spray-mix',
      title: 'Cálculo de Calda (WALES)',
      subtitle: 'Tanque misturador e teste de jarro',
      category: 'agronomia',
      icon: <Droplets className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: 'Metodologia WALES',
      tags: ['calda', 'mistura', 'wales', 'tanque', 'defensivo', 'dosagem'],
    },
    {
      id: 'weather',
      title: 'Clima & Janela Delta T',
      subtitle: 'Vento, umidade e risco de deriva',
      category: 'agronomia',
      icon: <Wind className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600',
      statBadge: 'Delta T: 2 a 8°C',
      tags: ['clima', 'vento', 'delta t', 'deriva', 'temperatura'],
    },
    {
      id: 'reports',
      title: 'Relatórios Técnicos (MAPA)',
      subtitle: 'Laudos oficiais com mapa e ART',
      category: 'agronomia',
      icon: <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: `${completedOrdersCount} laudos emitidos`,
      tags: ['relatório', 'laudo', 'mapa', 'art', 'pdf'],
    },
    {
      id: 'pricing',
      title: 'Matriz de Preços por Ha',
      subtitle: 'Tabela de faixas e culturas agrícolas',
      category: 'comercial',
      icon: <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: 'Preços por Hectare',
      tags: ['preço', 'matriz', 'tabela', 'hectare', 'faixa'],
    },

    // Linha 3: Comercial, Frota & Identidade (5 cards)
    {
      id: 'quotations',
      title: 'Orçamentos Comerciais',
      subtitle: 'Propostas por hectare p/ produtor',
      category: 'comercial',
      icon: <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600',
      statBadge: `${quotations.length} orçamentos`,
      tags: ['orçamento', 'cotação', 'proposta', 'hectare'],
    },
    {
      id: 'financial',
      title: 'Financeiro & Comissões',
      subtitle: 'Faturamento, repasses e adicionais NR-31',
      category: 'comercial',
      icon: <TrendingUp className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
      iconBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-600',
      statBadge: 'Comissões & DRE',
      tags: ['financeiro', 'comissão', 'faturamento', 'custos'],
    },
    {
      id: 'fleet',
      title: 'Frota de Drones & Baterias',
      subtitle: 'Aeronaves, ciclos de carga e manutenção',
      category: 'frota',
      icon: <Plane className="w-5 h-5 text-sky-600 dark:text-sky-400" />,
      iconBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-600',
      statBadge: `${operationalDronesCount}/${drones.length} operacionais`,
      tags: ['frota', 'drones', 'baterias', 'aeronaves'],
    },
    {
      id: 'admin-management',
      title: 'Hub de Gestão & Cadastros',
      subtitle: 'Pilotos, clientes, empresas e contratos',
      category: 'frota',
      icon: <ShieldCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600',
      statBadge: isMasterUser(currentUser) ? '👑 Super Master' : (currentUser.role === 'ADMIN' ? 'Administrador' : 'Equipe'),
      tags: ['gestão', 'cadastro', 'pilotos', 'clientes'],
    },
    {
      id: 'branding',
      title: 'Logotipo & Identidade Visual',
      subtitle: 'Logotipo exclusivo da empresa e cores da marca',
      category: 'sistema',
      icon: <Palette className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-600',
      statBadge: theme.logoUrl ? '● Logo Próprio Ativo' : (theme.logoIconId ? '● Brasão Ativo' : '○ Padrão Ativo'),
      tags: ['marca', 'white label', 'logo', 'empresa', 'logotipo'],
    },

    // Linha 4: Sistema, Banco & Suporte (5 cards)
    {
      id: 'design-system',
      title: 'Design System & Cores',
      subtitle: 'Tokens visuais, paleta HSL e tipografia',
      category: 'sistema',
      icon: <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600',
      statBadge: 'Tokens de Marca',
      tags: ['design', 'cores', 'paleta', 'tokens', 'tema'],
    },
    {
      id: 'database',
      title: 'Banco PostgreSQL & GIS',
      subtitle: 'Modelagem relacional e PostGIS na nuvem',
      category: 'sistema',
      icon: <Database className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
      iconBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600',
      statBadge: 'PostGIS & Supabase',
      tags: ['banco', 'postgres', 'sql', 'postgis', 'supabase'],
    },
    {
      id: 'docs',
      title: 'Documentação Técnica & APIs',
      subtitle: 'Arquitetura de dados e endpoints REST',
      category: 'sistema',
      icon: <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600',
      statBadge: 'Manuais & APIs',
      tags: ['documentação', 'api', 'manual', 'técnico'],
    },
  ], [
    activeOrdersCount, 
    scheduledOrdersCount, 
    completedOrdersCount, 
    orders.length, 
    plots.length, 
    drones.length, 
    operationalDronesCount, 
    quotations.length, 
    totalAppliedHa, 
    theme.companyName, 
    currentUser.role
  ]);

  // Filter items allowed for current user strictly and sort by custom order
  const userAllowedItems = useMemo(() => {
    const allowed = allItems.filter(item => canUserAccessView(currentUser, item.id));
    if (cardOrder.length === 0) return allowed;

    const orderMap = new Map<AppViewMode, number>();
    cardOrder.forEach((id, index) => orderMap.set(id, index));

    return [...allowed].sort((a, b) => {
      const indexA = orderMap.has(a.id) ? (orderMap.get(a.id) as number) : 9999;
      const indexB = orderMap.has(b.id) ? (orderMap.get(b.id) as number) : 9999;
      return indexA - indexB;
    });
  }, [allItems, currentUser, cardOrder]);

  // Filter items by category and search term
  const filteredItems = useMemo(() => {
    return userAllowedItems.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const query = searchTerm.toLowerCase().trim();
        return item.title.toLowerCase().includes(query) ||
          item.subtitle.toLowerCase().includes(query) ||
          item.tags.some(t => t.toLowerCase().includes(query));
      }
      return true;
    });
  }, [userAllowedItems, selectedCategory, searchTerm]);

  const categories = [
    { id: 'all', label: 'Todos', count: userAllowedItems.length },
    { id: 'operacoes', label: 'Operações', count: userAllowedItems.filter(c => c.category === 'operacoes').length },
    { id: 'agronomia', label: 'Agronomia', count: userAllowedItems.filter(c => c.category === 'agronomia').length },
    { id: 'comercial', label: 'Comercial', count: userAllowedItems.filter(c => c.category === 'comercial').length },
    { id: 'frota', label: 'Frota & BI', count: userAllowedItems.filter(c => c.category === 'frota').length },
    { id: 'sistema', label: 'Sistema & Suporte', count: userAllowedItems.filter(c => c.category === 'sistema').length },
  ];

  return (
    <div className="min-h-full flex flex-col justify-between space-y-2 animate-in fade-in duration-150 max-w-7xl mx-auto w-full px-0.5 py-0.5 pb-6 sm:pb-1">
      {/* Integrated Ultra-Compact Top Bar: User + KPIs + Esteira Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs shrink-0">
        {/* User Info & Role */}
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar user={currentUser} size="xs" className="ring-1 ring-emerald-500/30 shrink-0" />
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-black text-emerald-950 dark:text-emerald-50 truncate">
              Olá, {currentUser.name.split(' ')[0]}
            </span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300/40">
              {currentUser.roleLabel}
            </span>
          </div>
        </div>

        {/* Operational KPIs Pills */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <ClipboardList className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="font-black">{activeOrdersCount}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">OS em voo</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <Plane className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span className="font-black">{operationalDronesCount}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">drones</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <TrendingUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="font-black">{formatInteger(totalAppliedHa)}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">ha</span>
          </div>

          <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <Wind className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span className="font-black text-emerald-600 dark:text-emerald-400 text-[10px]">Delta T Seguro</span>
          </div>
        </div>

        {/* Action Buttons: Gestão de Acessos for Admins + Esteira */}
        <div className="flex items-center gap-1.5 shrink-0">
          {hasAdminPrivileges(currentUser) && onOpenAccessControl && (
            <button
              onClick={onOpenAccessControl}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Configurar permissões e acessos dos funcionários da empresa"
            >
              <Users className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Gestão de Acessos</span>
            </button>
          )}

          {canUserAccessView(currentUser, 'spray-workflow') && (
            <button
              onClick={() => onNavigate('spray-workflow')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              title="Abrir Esteira do Processo & Passo a Passo MAPA (10 Etapas)"
            >
              <Workflow className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Esteira (10 Passos)</span>
              <span className="xs:hidden">Esteira</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Minimalist Search & Category Chips & Drag-and-Drop Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 shrink-0">
        {/* Search Field + Drag hint */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-[200px]">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar módulo..."
              className="w-full pl-7 pr-6 py-1 rounded-lg bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
          
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold transition-all duration-300 select-none ${
            isDraggingActive
              ? 'bg-emerald-600 text-white shadow-md animate-pulse border border-emerald-400'
              : 'text-slate-500 dark:text-slate-400 bg-emerald-50/60 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60'
          }`}>
            <GripVertical className={`w-3.5 h-3.5 ${isDraggingActive ? 'animate-bounce' : ''}`} />
            <span>{isDraggingActive ? 'Modo Reorganização • Solte sobre o destino' : 'Arraste os cards para reorganizar'}</span>
          </span>
        </div>

        {/* Category Chips and Reset Button */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-scroll py-0.5 max-w-full">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-[#072a1e] text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-emerald-200/70 dark:border-emerald-800/70'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'text-slate-400'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}

          {cardOrder.length > 0 && (
            <button
              onClick={handleResetOrder}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 shadow-2xs transition-all cursor-pointer shrink-0 ml-1"
              title="Restaurar a ordem padrão dos módulos"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="text-[10px]">Restaurar Ordem</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid of Allowed Modules */}
      {filteredItems.length === 0 ? (
        <div className="p-8 my-4 text-center bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhum módulo disponível nesta categoria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Não há módulos liberados para o seu perfil no momento ou nenhum atende aos critérios de busca digitados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-2 sm:gap-2.5 flex-1 min-h-0 content-start">
          {filteredItems.map((item) => {
            const isBeingDragged = draggedItemId === item.id;
            const isDragTarget = dragOverItemId === item.id && !isBeingDragged;
            const isJustDropped = recentlyDroppedId === item.id;

            return (
              <div
                key={item.id}
                id={`module-card-${item.id}`}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', item.id);
                  e.dataTransfer.effectAllowed = 'move';
                  setDraggedItemId(item.id);
                  setIsDraggingActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  if (draggedItemId && draggedItemId !== item.id && dragOverItemId !== item.id) {
                    setDragOverItemId(item.id);
                  }
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  if (draggedItemId && draggedItemId !== item.id) {
                    setDragOverItemId(item.id);
                  }
                }}
                onDragLeave={(e) => {
                  const currentTarget = e.currentTarget;
                  if (!currentTarget.contains(e.relatedTarget as Node)) {
                    if (dragOverItemId === item.id) {
                      setDragOverItemId(null);
                    }
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedItemId && draggedItemId !== item.id) {
                    handleReorder(draggedItemId, item.id);
                  }
                  setDraggedItemId(null);
                  setDragOverItemId(null);
                }}
                onDragEnd={() => {
                  setDraggedItemId(null);
                  setDragOverItemId(null);
                  setTimeout(() => {
                    setIsDraggingActive(false);
                  }, 150);
                }}
                onClick={() => {
                  if (!isDraggingActive) {
                    onNavigate(item.id);
                  }
                }}
                className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 cubic-bezier(0.34,1.56,0.64,1) cursor-grab active:cursor-grabbing select-none flex flex-col justify-between min-h-[80px] sm:min-h-[86px] lg:min-h-[90px] ${
                  isBeingDragged
                    ? 'opacity-40 scale-95 border-2 border-dashed border-emerald-500 bg-drag-placeholder shadow-inner rotate-1 z-0'
                    : isDragTarget
                    ? 'ring-2 ring-emerald-500 scale-[1.05] -translate-y-1 rotate-[-1deg] shadow-xl border-emerald-400 bg-emerald-100/90 dark:bg-emerald-900/90 z-20 animate-card-drag-target'
                    : isJustDropped
                    ? 'animate-drop-snap border-emerald-500 ring-2 ring-emerald-400/80 z-10 bg-emerald-50/70 dark:bg-emerald-950/70'
                    : isDraggingActive
                    ? 'bg-white dark:bg-[#072a1e] border-emerald-200/80 dark:border-emerald-800/80 opacity-90 scale-[0.99]'
                    : 'bg-white dark:bg-[#072a1e] border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5'
                }`}
                title={`Arraste para mover ou clique para abrir ${item.title}`}
              >
                {/* Floating Visual Badges for Drag Dynamics */}
                {isDragTarget && (
                  <div className="absolute -top-2.5 -right-1 bg-emerald-600 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white dark:border-emerald-900 flex items-center gap-0.5 animate-bounce z-30">
                    <ArrowRight className="w-2.5 h-2.5 rotate-90" />
                    <span>Soltar Aqui</span>
                  </div>
                )}

                {isBeingDragged && (
                  <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/10 rounded-xl backdrop-blur-[1px] pointer-events-none z-20">
                    <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-200 bg-white/95 dark:bg-emerald-950/95 px-2.5 py-1 rounded-full shadow-md border border-emerald-400/80 flex items-center gap-1">
                      <GripVertical className="w-3 h-3 text-emerald-600" />
                      <span>Movendo...</span>
                    </span>
                  </div>
                )}

                {isJustDropped && (
                  <div className="absolute -top-2.5 -right-1 bg-emerald-500 text-white text-[9.5px] font-black px-2 py-0.5 rounded-full shadow-lg border border-white dark:border-emerald-900 flex items-center gap-1 animate-pulse z-30">
                    <Sparkles className="w-2.5 h-2.5" />
                    <span>Reorganizado!</span>
                  </div>
                )}

                <div>
                  {/* Top row: Grip Handle + Icon + Title + Arrow */}
                  <div className="flex items-center justify-between gap-1.5 mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div 
                        className={`transition-colors shrink-0 ${
                          isBeingDragged || isDragTarget
                            ? 'text-emerald-600 dark:text-emerald-400 scale-110'
                            : 'text-slate-300 dark:text-emerald-900/60 group-hover:text-emerald-500 dark:group-hover:text-emerald-400'
                        }`}
                        title="Arraste para reposicionar"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                      <div className={`w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-lg flex items-center justify-center shrink-0 shadow-2xs transition-transform group-hover:scale-105 ${item.iconBg}`}>
                        {item.icon}
                      </div>
                      <h3 className="text-xs font-black text-emerald-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight truncate">
                        {item.title}
                      </h3>
                    </div>

                    <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-colors bg-slate-50 dark:bg-emerald-950/60 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60">
                      <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Subtitle */}
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate leading-normal pl-5">
                    {item.subtitle}
                  </p>
                </div>

                {/* Bottom badge + Ver Resumo action */}
                <div className="mt-1 pt-1 border-t border-slate-100 dark:border-emerald-900/50 flex items-center justify-between">
                  <span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded border truncate max-w-full text-emerald-700 dark:text-emerald-300 bg-emerald-50/90 dark:bg-emerald-950/90 border-emerald-200/60 dark:border-emerald-800/60">
                    {item.statBadge}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSummaryModule(item.id);
                    }}
                    className="text-[8.5px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer hover:underline flex items-center gap-0.5"
                    title="Abrir balão com resumo explicativo do módulo"
                  >
                    <span>Resumo</span>
                    <Sparkles className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ultra-compact Footer line */}
      <div className="py-1 flex items-center justify-between gap-2 text-[10px] text-slate-500 dark:text-slate-400 px-1 border-t border-emerald-200/60 dark:border-emerald-800/60 shrink-0">
        <span className="truncate">
          AgroSys • Portaria MAPA 298/2021 & Metodologia WALES
        </span>

        <div className="flex items-center gap-2.5 shrink-0">
          {onStartLiveTour && (
            <button
              onClick={onStartLiveTour}
              className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Compass className="w-3 h-3" />
              <span>Tour Rápido</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('help')}
            className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Ajuda</span>
          </button>
        </div>
      </div>

      {/* Interactive Module Summary Balloon Modal */}
      <ModuleSummaryBalloon
        moduleId={selectedSummaryModule}
        isOpen={!!selectedSummaryModule}
        onClose={() => setSelectedSummaryModule(null)}
        onNavigate={(view) => {
          setSelectedSummaryModule(null);
          onNavigate(view);
        }}
        availableModules={filteredItems.map(i => i.id)}
      />
    </div>
  );
};
