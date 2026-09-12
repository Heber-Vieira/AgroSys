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
import { 
  ClipboardList, 
  MapPin, 
  Droplets, 
  Wind, 
  Activity, 
  DollarSign, 
  Calendar, 
  Printer, 
  FileText, 
  Plane, 
  ShieldCheck, 
  LayoutDashboard, 
  Palette, 
  HelpCircle, 
  Compass, 
  Search, 
  ArrowRight, 
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { formatInteger } from '../utils/formatters';
import { isMasterUser, hasAdminPrivileges } from '../utils/userPermissions';

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
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Operational metrics
  const activeOrdersCount = orders.filter(o => o.status === 'OPERATING' || o.status === 'IN_TRANSIT').length;
  const scheduledOrdersCount = orders.filter(o => o.status === 'SCHEDULED').length;
  const completedOrdersCount = orders.filter(o => o.status === 'COMPLETED').length;
  const totalAppliedHa = orders.reduce((acc, o) => acc + (o.sprayedHectares || 0), 0);
  const operationalDronesCount = drones.filter(d => d.status === 'READY' || d.status === 'IN_MISSION').length;

  // Minimalist items list
  const allItems: HubItem[] = useMemo(() => [
    // Operações & Voo
    {
      id: 'orders',
      title: 'Ordens de Serviço (OS)',
      subtitle: 'Planejamento e despacho de voo',
      category: 'operacoes',
      icon: <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: activeOrdersCount > 0 ? `${activeOrdersCount} em voo` : `${scheduledOrdersCount} agendadas`,
      tags: ['os', 'ordens', 'serviço', 'voo', 'despacho', 'aplicação'],
    },
    {
      id: 'gis',
      title: 'Talhões Agrícolas (GIS)',
      subtitle: 'Mapas de satélite e áreas úteis',
      category: 'operacoes',
      icon: <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />,
      iconBg: 'bg-cyan-100 dark:bg-cyan-950/80 text-cyan-600',
      statBadge: `${plots.length} talhões`,
      tags: ['gis', 'mapa', 'talhão', 'satélite', 'área'],
    },
    {
      id: 'schedule',
      title: 'Agenda Operacional',
      subtitle: 'Escala de equipes e cronograma',
      category: 'operacoes',
      icon: <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      iconBg: 'bg-teal-100 dark:bg-teal-950/80 text-teal-600',
      statBadge: `${orders.length} serviços`,
      tags: ['agenda', 'escala', 'calendário', 'piloto'],
    },
    {
      id: 'telemetry',
      title: 'Telemetria de Voo',
      subtitle: 'Altitude, vazão e baterias ao vivo',
      category: 'operacoes',
      icon: <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600',
      statBadge: 'Tempo Real',
      tags: ['telemetria', 'tempo real', 'altitude', 'vazão', 'bateria'],
    },

    // Agronomia & Calda
    {
      id: 'spray-mix',
      title: 'Cálculo de Calda (WALES)',
      subtitle: 'Tanque misturador e teste de jarro',
      category: 'agronomia',
      icon: <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: 'Metodologia WALES',
      tags: ['calda', 'mistura', 'wales', 'tanque', 'defensivo', 'dosagem'],
    },
    {
      id: 'weather',
      title: 'Clima & Janela Delta T',
      subtitle: 'Vento, umidade e risco de deriva',
      category: 'agronomia',
      icon: <Wind className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600',
      statBadge: 'Delta T: 2 a 8°C',
      tags: ['clima', 'vento', 'delta t', 'deriva', 'temperatura'],
    },

    // Comercial & Laudos
    ...(hasAdminPrivileges(currentUser) ? [{
      id: 'quotations',
      title: 'Orçamentos Comerciais',
      subtitle: 'Propostas por hectare p/ produtor',
      category: 'comercial' as const,
      icon: <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600',
      statBadge: `${quotations.length} propostas`,
      tags: ['orçamento', 'cotação', 'proposta', 'hectare'],
    }] : []),
    {
      id: 'reports',
      title: 'Relatórios Técnicos (MAPA)',
      subtitle: 'Laudos oficiais com mapa e ART',
      category: 'comercial',
      icon: <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: `${completedOrdersCount} laudos prontos`,
      tags: ['relatório', 'laudo', 'mapa', 'art', 'pdf'],
    },
    ...(hasAdminPrivileges(currentUser) ? [{
      id: 'financial',
      title: 'Financeiro & Comissões',
      subtitle: 'Faturamento e adicionais NR-31',
      category: 'comercial' as const,
      icon: <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />,
      iconBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600',
      statBadge: 'Comissões NR-31',
      tags: ['financeiro', 'comissão', 'faturamento', 'custos'],
    }] : []),

    // Frota & Gestão
    {
      id: 'dashboard',
      title: 'Painel Geral (BI)',
      subtitle: 'Indicadores e hectares aplicados',
      category: 'frota',
      icon: <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600',
      statBadge: `${formatInteger(totalAppliedHa)} ha total`,
      tags: ['painel', 'dashboard', 'bi', 'métricas'],
    },
    {
      id: 'fleet',
      title: 'Frota de Drones & Baterias',
      subtitle: 'Aeronaves, ciclos e manutenção',
      category: 'frota',
      icon: <Plane className="w-4 h-4 text-sky-600 dark:text-sky-400" />,
      iconBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-600',
      statBadge: `${operationalDronesCount}/${drones.length} operacionais`,
      tags: ['frota', 'drones', 'baterias', 'aeronaves'],
    },
    {
      id: 'admin-management',
      title: 'Gestão & Cadastros',
      subtitle: 'Pilotos, clientes e tabela de preço',
      category: 'frota',
      icon: <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />,
      iconBg: 'bg-purple-100 dark:bg-purple-950/80 text-purple-600',
      statBadge: isMasterUser(currentUser) ? '👑 Super Master' : (currentUser.role === 'ADMIN' ? 'Administrador' : 'Equipe'),
      tags: ['gestão', 'cadastro', 'pilotos', 'clientes'],
    },

    // Suporte & Sistema
    {
      id: 'branding',
      title: 'Logotipo & Identidade Visual',
      subtitle: 'Logotipo exclusivo da empresa e cores',
      category: 'sistema',
      icon: <Palette className="w-4 h-4 text-rose-600 dark:text-rose-400" />,
      iconBg: 'bg-rose-100 dark:bg-rose-950/80 text-rose-600',
      statBadge: theme.logoUrl ? '● Logo Próprio Ativo' : (theme.logoIconId ? '● Brasão Ativo' : '○ Logo Padrão Ativo'),
      tags: ['marca', 'white label', 'logo', 'empresa', 'logotipo'],
    },
    {
      id: 'virtual-tour',
      title: 'Tour Guiado do Sistema',
      subtitle: 'Passo a passo interativo',
      category: 'sistema',
      icon: <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
      iconBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-600',
      statBadge: 'Tutorial Rápido',
      tags: ['tour', 'guia', 'treinamento', 'tutorial'],
    },
    {
      id: 'help',
      title: 'Ajuda & Boas Práticas',
      subtitle: 'Normas MAPA 298/2021 e NR-31',
      category: 'sistema',
      icon: <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />,
      iconBg: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600',
      statBadge: 'Suporte & Normas',
      tags: ['ajuda', 'suporte', 'nr-31', 'mapa 298'],
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

  // Filter items
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
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
  }, [allItems, selectedCategory, searchTerm]);

  const categories = [
    { id: 'all', label: 'Todos', count: allItems.length },
    { id: 'operacoes', label: 'Operações', count: allItems.filter(c => c.category === 'operacoes').length },
    { id: 'agronomia', label: 'Agronomia', count: allItems.filter(c => c.category === 'agronomia').length },
    { id: 'comercial', label: 'Comercial', count: allItems.filter(c => c.category === 'comercial').length },
    { id: 'frota', label: 'Frota', count: allItems.filter(c => c.category === 'frota').length },
    { id: 'sistema', label: 'Sistema', count: allItems.filter(c => c.category === 'sistema').length },
  ];

  return (
    <div className="space-y-3 sm:space-y-3.5 animate-in fade-in duration-150 max-w-7xl mx-auto w-full my-auto">
      {/* Minimalist Top Strip: Cockpit & User in a single compact line */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
        {/* User Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <UserAvatar user={currentUser} size="xs" className="ring-1 ring-emerald-500/30 shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-50 truncate">
                Olá, {currentUser.name.split(' ')[0]}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-300/40">
                {currentUser.roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Compact Operational KPIs */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-[11px] font-semibold">
          <div className="flex items-center gap-1 px-2 py-0.8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <ClipboardList className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span className="font-black">{activeOrdersCount}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">OS em voo</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <Plane className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span className="font-black">{operationalDronesCount}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">drones</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <TrendingUp className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="font-black">{formatInteger(totalAppliedHa)}</span>
            <span className="text-slate-500 dark:text-slate-400 text-[10px]">ha</span>
          </div>

          <div className="hidden md:flex items-center gap-1 px-2 py-0.8 rounded-lg bg-emerald-50 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 border border-emerald-200/60 dark:border-emerald-800/60">
            <Wind className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span className="font-black text-emerald-600 dark:text-emerald-400">Delta T Seguro</span>
          </div>
        </div>
      </div>

      {/* Minimalist Search & Category Chips (Single tight row) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar módulo ou funcionalidade..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-[#072a1e] text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 border border-emerald-200/70 dark:border-emerald-800/70'
                }`}
              >
                <span>{cat.label}</span>
                <span className={`text-[9px] font-bold px-1 py-0.2 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'text-slate-400'
                }`}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Minimalist Cards Grid: Dense, space-efficient, direct click */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
        {filteredItems.map((item) => {
          return (
            <div
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="group relative p-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between min-h-[96px]"
              title={`Abrir ${item.title}`}
            >
              <div>
                {/* Top row: Icon + Chevron */}
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
                </div>

                {/* Title */}
                <h3 className="text-xs font-black text-emerald-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {item.title}
                </h3>

                {/* Subtitle */}
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              {/* Bottom badge */}
              <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-emerald-900/60 flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 truncate max-w-full">
                  {item.statBadge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ultra-compact Footer line */}
      <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 px-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
        <span className="truncate">
          AgroSys • Portaria MAPA 298/2021 & Metodologia WALES
        </span>

        <div className="flex items-center gap-3 shrink-0">
          {onStartLiveTour && (
            <button
              onClick={onStartLiveTour}
              className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
            >
              <Compass className="w-3 h-3" />
              <span>Tour Rápido</span>
            </button>
          )}
          <button
            onClick={() => onNavigate('help')}
            className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
          >
            <HelpCircle className="w-3 h-3" />
            <span>Ajuda</span>
          </button>
        </div>
      </div>
    </div>
  );
};
