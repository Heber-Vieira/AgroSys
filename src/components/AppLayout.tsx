import React from 'react';
import { 
  AppViewMode, 
  UserProfile, 
  WhiteLabelTheme, 
  ThemeMode, 
  ServiceOrder, 
  AgriculturalDrone 
} from '../types';
import { Navbar } from './Navbar';
import { ArrowLeft, ArrowRight } from 'lucide-react';

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

  return (
    <div className={`min-h-screen ${isScheduleView ? 'h-screen overflow-hidden' : ''} flex flex-col bg-emerald-50/50 dark:bg-[#051811] text-emerald-950 dark:text-emerald-50 selection:bg-emerald-500 selection:text-white transition-colors duration-200`}>
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
        <main className={`flex-1 w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 ${
          isScheduleView ? 'py-1.5 pb-2 flex flex-col min-h-0 overflow-hidden' : 'py-2.5 sm:py-4 pb-8'
        } ${currentView === 'hub' ? 'flex flex-col justify-center' : ''}`}>
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40">
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

        {/* Global Footer (Hidden on Schedule View to fit 100% of viewport) */}
        {!isScheduleView && (
          <footer className="print:hidden border-t border-emerald-200/80 dark:border-emerald-800/80 bg-emerald-50/60 dark:bg-[#041c14]/60 backdrop-blur-xs py-6 mt-auto text-center text-xs text-emerald-800/80 dark:text-emerald-300/80">
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
    </div>
  );
};
