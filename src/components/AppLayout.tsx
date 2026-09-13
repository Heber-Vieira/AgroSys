import React, { useState } from 'react';
import { 
  AppViewMode, 
  UserProfile, 
  WhiteLabelTheme, 
  ThemeMode, 
  ServiceOrder, 
  AgriculturalDrone,
  RegisteredCompany 
} from '../types';
import { Navbar } from './Navbar';
import { 
  ArrowLeft, 
  ArrowRight,
  LayoutGrid,
  ClipboardList,
  Calendar,
  Workflow,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Building2,
  Droplets,
  MapPin,
  Activity,
  DollarSign,
  Plane,
  Palette,
  HelpCircle,
  ShieldCheck,
  Compass,
  FileText,
  Sliders,
  Database,
  ChevronDown
} from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { BrandLogo } from './BrandLogo';
import { isMasterUser } from '../utils/userPermissions';
import { getStoredRegisteredCompanies } from '../services/companyStorage';
import { getCompanyTheme } from '../services/brandingLogoStorage';

interface AppLayoutProps {
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: WhiteLabelTheme;
  setTheme: React.Dispatch<React.SetStateAction<WhiteLabelTheme>>;
  currentUser: UserProfile;
  availableUsers?: UserProfile[];
  onSelectUser?: (user: UserProfile) => void;
  onUpdateUserPhoto?: (userId: string, photoUrl: string) => void;
  onLogout?: () => void;
  onStartTour?: () => void;
  onStartLiveTour?: () => void;
  onOpenHelp?: () => void;
  onOpenReportModal?: (orderId?: string) => void;
  orders?: ServiceOrder[];
  drones?: AgriculturalDrone[];
  children: React.ReactNode;
}

// Human-friendly title mapper for view headers
function getViewTitle(view: AppViewMode): string {
  switch (view) {
    case 'hub': return 'Central de Módulos';
    case 'spray-workflow': return 'Esteira & Passo a Passo do Processo de Pulverização';
    case 'dashboard': return 'Painel Executivo & Métricas';
    case 'orders': return 'Ordens de Serviço (OS)';
    case 'gis': return 'Talhões & Mapas GIS';
    case 'spray-mix': return 'Cálculo de Calda (WALES)';
    case 'weather': return 'Clima & Janela Delta T';
    case 'telemetry': return 'Telemetria de Voo ao Vivo';
    case 'pricing': return 'Matriz de Preços por Hectare';
    case 'fleet': return 'Frota de Drones & Equipes de Voo';
    case 'financial': return 'Comissões & Lançamentos Financeiros';
    case 'schedule': return 'Agenda & Escala Operacional';
    case 'admin-management': return 'Hub de Administração & Cadastros';
    case 'branding': return 'Branding Studio & Marca White Label';
    case 'design-system': return 'Design System & Cores';
    case 'reports': return 'Relatórios Técnicos de Pulverização';
    case 'quotations': return 'Orçamentos Comerciais';
    case 'docs': return 'Documentação Técnica & APIs';
    case 'database': return 'Esquema de Banco PostgreSQL & GIS';
    case 'virtual-tour': return 'Tour Virtual Guia Rápido';
    case 'help': return 'Central de Ajuda & Manuais Operacionais';
    default: return 'Visão Geral';
  }
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  setCurrentView,
  themeMode,
  setThemeMode,
  theme,
  setTheme,
  currentUser,
  availableUsers,
  onSelectUser,
  onUpdateUserPhoto,
  onLogout,
  onStartTour,
  onStartLiveTour,
  onOpenHelp,
  onOpenReportModal,
  children,
}) => {
  const isScheduleView = currentView === 'schedule';
  const isHubView = currentView === 'hub';
  const isMaster = isMasterUser(currentUser);

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const registeredCompanies = getStoredRegisteredCompanies();

  const handleSelectCompany = (companyId: string) => {
    if (companyId === 'ALL') {
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
      return;
    }
    const compTheme = getCompanyTheme(companyId);
    setTheme(compTheme);
  };

  const navSections: {
    label: string;
    items: { id: AppViewMode; title: string; icon: React.ReactNode; badge?: string }[];
  }[] = [
    {
      label: 'Operações & Campo',
      items: [
        { id: 'hub', title: 'Central de Módulos', icon: <LayoutGrid className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
        { id: 'orders', title: 'Ordens de Serviço (OS)', icon: <ClipboardList className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
        { id: 'spray-workflow', title: 'Esteira Passo a Passo (10 Passos)', icon: <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />, badge: 'MAPA' },
        { id: 'gis', title: 'Talhões & Mapas GIS', icon: <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> },
        { id: 'schedule', title: 'Agenda & Escala Operacional', icon: <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400" /> },
        { id: 'telemetry', title: 'Telemetria de Voo ao Vivo', icon: <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
      ],
    },
    {
      label: 'Agronomia & Aplicação',
      items: [
        { id: 'spray-mix', title: 'Cálculo de Calda (WALES)', icon: <Droplets className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
        { id: 'weather', title: 'Clima & Janela Delta T', icon: <Activity className="w-4 h-4 text-teal-600 dark:text-teal-400" /> },
        { id: 'reports', title: 'Relatórios Técnicos', icon: <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
      ],
    },
    {
      label: 'Comercial & Frota',
      items: [
        { id: 'fleet', title: 'Frota de Drones & Equipes', icon: <Plane className="w-4 h-4 text-sky-600 dark:text-sky-400" /> },
        { id: 'pricing', title: 'Matriz de Preços por Hectare', icon: <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> },
        { id: 'quotations', title: 'Orçamentos Comerciais', icon: <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
        { id: 'financial', title: 'Comissões & Financeiro', icon: <DollarSign className="w-4 h-4 text-teal-600 dark:text-teal-400" /> },
        { id: 'dashboard', title: 'Painel Executivo & Métricas', icon: <Sliders className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
      ],
    },
    {
      label: 'Governança & Suporte',
      items: [
        { id: 'admin-management', title: 'Hub de Administração & Cadastros', icon: <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" /> },
        { id: 'branding', title: 'Branding Studio & Marca', icon: <Palette className="w-4 h-4 text-rose-600 dark:text-rose-400" /> },
        { id: 'design-system', title: 'Design System & Cores', icon: <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> },
        { id: 'database', title: 'Esquema PostgreSQL & GIS', icon: <Database className="w-4 h-4 text-slate-600 dark:text-slate-400" /> },
        { id: 'docs', title: 'Documentação Técnica & APIs', icon: <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
        { id: 'virtual-tour', title: 'Tour Virtual do Sistema', icon: <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" /> },
        { id: 'help', title: 'Central de Ajuda & MAPA', icon: <HelpCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" /> },
      ],
    },
  ];

  return (
    <div className={`min-h-[100dvh] sm:min-h-screen ${isScheduleView ? 'sm:h-screen sm:overflow-hidden' : ''} flex flex-col bg-emerald-50/50 dark:bg-[#051811] text-emerald-950 dark:text-emerald-50 selection:bg-emerald-500 selection:text-white transition-colors duration-200 pb-16 sm:pb-0`}>
      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Sticky Reusable Top Navbar */}
        <Navbar
          currentView={currentView}
          setCurrentView={setCurrentView}
          themeMode={themeMode}
          setThemeMode={setThemeMode}
          theme={theme}
          setTheme={setTheme}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onStartTour={onStartTour}
          onStartLiveTour={onStartLiveTour}
          onOpenHelp={onOpenHelp}
          onOpenReportModal={onOpenReportModal}
          currentUser={currentUser}
          availableUsers={availableUsers}
          onSelectUser={onSelectUser}
          onUpdateUserPhoto={onUpdateUserPhoto}
          onLogout={onLogout}
        />

        {/* Main Content Area with Header Breadcrumb */}
        <main className={`flex-1 w-full max-w-[1600px] mx-auto px-2 sm:px-4 lg:px-6 ${
          isScheduleView 
            ? 'py-1.5 pb-2 flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden' 
            : isHubView 
            ? 'py-1.5 sm:py-2 pb-2 sm:pb-3 flex flex-col justify-between min-h-0' 
            : 'py-2.5 sm:py-4 pb-8'
        }`}>
          {/* Sub-page Header & Navigation Trail (Hidden on main Hub view) */}
          {currentView !== 'hub' && (
            <div className={`print:hidden ${isScheduleView ? 'mb-1.5 py-1 px-2.5' : 'mb-3 py-2 px-3'} flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs shrink-0`}>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <button
                  onClick={() => setCurrentView('hub')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-extrabold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
                  title="Fechar este módulo e retornar à Central de Módulos"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Central de Módulos</span>
                </button>

                <div className="hidden xs:flex items-center gap-1.5 text-xs truncate">
                  <span className="text-slate-400 dark:text-emerald-400/60 font-medium">Início</span>
                  <span className="text-slate-400 dark:text-emerald-500/60">/</span>
                  <span className="font-extrabold text-emerald-900 dark:text-emerald-200 truncate">
                    {getViewTitle(currentView)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 truncate max-w-[140px] xs:max-w-none">
                  🏢 {theme.companyName}
                </span>
                <button
                  onClick={() => setCurrentView('hub')}
                  className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>Módulos</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Child View */}
          {children}
        </main>

        {/* Global Footer (Hidden on Schedule View, Hub View, or Mobile to keep viewport clean) */}
        {!isScheduleView && !isHubView && (
          <footer className="print:hidden border-t border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-[#041c14]/60 backdrop-blur-xs py-6 mt-auto text-center text-xs text-emerald-800/80 dark:text-emerald-300/80 hidden sm:block">
            <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-emerald-950 dark:text-white">
                  {theme.companyName}
                </span>
                <span>•</span>
                <span>AgroSys v1.0 • Gestão Completa de Pulverização por Drones</span>
              </div>
              <div className="flex items-center gap-4 text-emerald-700/70 dark:text-emerald-400/70 flex-wrap justify-center">
                <span>ANAC / DECEA Compliance</span>
                <span>•</span>
                <span>PostgreSQL & PostGIS</span>
                <span>•</span>
                <span>NR-31 & InpEV</span>
                <span>•</span>
                <span>Multi-Tenant Isolado</span>
              </div>
            </div>
          </footer>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION DOCK (iOS & Android thumb-friendly, with safe-area padding) */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#062016]/95 backdrop-blur-md border-t border-emerald-200/80 dark:border-emerald-800/80 px-2 py-1.5 pb-safe shadow-lg flex items-center justify-around">
        <button
          type="button"
          onClick={() => setCurrentView('hub')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentView === 'hub'
              ? 'text-emerald-700 dark:text-emerald-300 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-emerald-600'
          }`}
        >
          <LayoutGrid className={`w-5 h-5 ${currentView === 'hub' ? 'text-emerald-600 dark:text-emerald-400 scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5">Central</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('orders')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentView === 'orders'
              ? 'text-emerald-700 dark:text-emerald-300 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-emerald-600'
          }`}
        >
          <ClipboardList className={`w-5 h-5 ${currentView === 'orders' ? 'text-emerald-600 dark:text-emerald-400 scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5">OS</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('schedule')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentView === 'schedule'
              ? 'text-emerald-700 dark:text-emerald-300 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-emerald-600'
          }`}
        >
          <Calendar className={`w-5 h-5 ${currentView === 'schedule' ? 'text-emerald-600 dark:text-emerald-400 scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5">Agenda</span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('spray-workflow')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            currentView === 'spray-workflow'
              ? 'text-emerald-700 dark:text-emerald-300 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-emerald-600'
          }`}
        >
          <Workflow className={`w-5 h-5 ${currentView === 'spray-workflow' ? 'text-emerald-600 dark:text-emerald-400 scale-110' : ''} transition-transform`} />
          <span className="text-[10px] mt-0.5">Esteira</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMobileDrawerOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] ${
            isMobileDrawerOpen
              ? 'text-emerald-700 dark:text-emerald-300 font-black'
              : 'text-slate-500 dark:text-slate-400 font-semibold hover:text-emerald-600'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* MOBILE SLIDE-OVER DRAWER (Full navigation across all 18+ modules) */}
      {isMobileDrawerOpen && (
        <div className="sm:hidden fixed inset-0 z-50 flex">
          {/* Dark Backdrop */}
          <div 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-out Drawer Panel */}
          <div className="relative z-50 w-[85vw] max-w-[340px] bg-white dark:bg-[#072a1e] border-r border-emerald-200 dark:border-emerald-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-left duration-200 pt-safe pb-safe">
            {/* Drawer Header */}
            <div className="p-4 border-b border-emerald-100 dark:border-emerald-800/70 flex items-center justify-between gap-3 bg-emerald-50/70 dark:bg-emerald-950/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <BrandLogo theme={theme} themeMode={themeMode} size="sm" showBackground />
                <div className="min-w-0">
                  <h3 className="font-black text-sm text-emerald-950 dark:text-white truncate">
                    {theme.companyName}
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    AgroSys Mobile
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-1.5 rounded-xl hover:bg-emerald-200/50 dark:hover:bg-emerald-900/60 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                title="Fechar Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active User Card & Master Switcher */}
            <div className="p-3 border-b border-emerald-100 dark:border-emerald-800/60 bg-white dark:bg-[#072a1e] space-y-2">
              <div className="flex items-center gap-3">
                <UserAvatar user={currentUser} size="md" showRoleBadge />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-black text-emerald-950 dark:text-white truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {currentUser.email}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5">
                    {isMaster ? (
                      <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                        👑 SUPER MASTER
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {currentUser.roleLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Company Switcher for Master User in Mobile Drawer */}
              {isMaster && (
                <div className="pt-1.5">
                  <label className="text-[9px] font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider block mb-1">
                    Alternar Empresa (Modo Master)
                  </label>
                  <div className="relative">
                    <select
                      value={theme.tenantId || 'ciclodrone'}
                      onChange={(e) => handleSelectCompany(e.target.value)}
                      className="w-full text-xs font-black bg-amber-50 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 rounded-xl px-2.5 py-1.5 appearance-none focus:outline-none cursor-pointer"
                    >
                      <option value="ALL" className="bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 font-black">
                        🌐 Visão Global (Todas)
                      </option>
                      {registeredCompanies.map(comp => (
                        <option key={comp.id} value={comp.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold">
                          🏢 {comp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-amber-700 dark:text-amber-300 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Nav Sections */}
            <div className="flex-1 overflow-y-auto touch-scroll p-3 space-y-4">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-emerald-400/60 px-2 block">
                    {section.label}
                  </span>
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = currentView === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setCurrentView(item.id);
                            setIsMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className={isActive ? 'text-white' : ''}>{item.icon}</span>
                            <span className="truncate">{item.title}</span>
                          </div>
                          {item.badge && (
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-3 border-t border-emerald-100 dark:border-emerald-800/70 bg-emerald-50/50 dark:bg-emerald-950/40 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-[#072a1e] border border-emerald-200/80 dark:border-emerald-800/80 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors cursor-pointer"
                >
                  {themeMode === 'light' ? (
                    <>
                      <Moon className="w-4 h-4 text-cyan-500" />
                      <span>Modo Escuro</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>Modo Claro</span>
                    </>
                  )}
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileDrawerOpen(false);
                      onLogout();
                    }}
                    className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Sair do AgroSys"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sair</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
