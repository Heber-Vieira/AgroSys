import React, { useState, useRef, useEffect } from 'react';
import { 
  Sun, 
  Moon, 
  SunMedium, 
  ChevronDown,
  Wifi,
  WifiOff,
  Camera,
  LogOut,
  UserCheck,
  Building2,
  Menu,
  Workflow
} from 'lucide-react';
import { ThemeMode, WhiteLabelTheme, AppViewMode, UserProfile, RegisteredCompany } from '../types';
import { PRESET_COMPANIES } from '../data/themeTokensData';
import { isMasterUser } from '../utils/userPermissions';
import { BrandLogo } from './BrandLogo';
import { UserAvatar, UserPhotoUploadModal, saveStoredUserPhoto } from './UserAvatar';
import { getCompanyTheme } from '../services/brandingLogoStorage';
import { getStoredRegisteredCompanies, COMPANIES_UPDATED_EVENT } from '../services/companyStorage';

export type { AppViewMode };

interface NavbarProps {
  currentView: AppViewMode;
  setCurrentView: (view: AppViewMode) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  theme: WhiteLabelTheme;
  setTheme: React.Dispatch<React.SetStateAction<WhiteLabelTheme>>;
  onOpenMobileDrawer?: () => void;
  onStartTour?: () => void;
  onStartLiveTour?: () => void;
  onOpenHelp?: () => void;
  onOpenReportModal?: (orderId?: string) => void;
  currentUser?: UserProfile;
  availableUsers?: UserProfile[];
  onSelectUser?: (user: UserProfile) => void;
  onUpdateUserPhoto?: (userId: string, photoUrl: string) => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  themeMode,
  setThemeMode,
  theme,
  setTheme,
  onOpenMobileDrawer,
  currentUser,
  availableUsers,
  onSelectUser,
  onUpdateUserPhoto,
  onLogout,
}) => {
  const isMaster = isMasterUser(currentUser);
  const [isOfflineSimulated, setIsOfflineSimulated] = useState<boolean>(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState<boolean>(false);
  const [registeredCompanies, setRegisteredCompanies] = useState<RegisteredCompany[]>(() => getStoredRegisteredCompanies());

  const userMenuRef = useRef<HTMLDivElement>(null);

  // Synchronize dynamic registered companies on storage updates
  useEffect(() => {
    const handleCompaniesUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<RegisteredCompany[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setRegisteredCompanies(customEvent.detail);
      } else {
        setRegisteredCompanies(getStoredRegisteredCompanies());
      }
    };
    window.addEventListener(COMPANIES_UPDATED_EVENT, handleCompaniesUpdated);
    return () => window.removeEventListener(COMPANIES_UPDATED_EVENT, handleCompaniesUpdated);
  }, []);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSavePhoto = (newPhotoUrl: string) => {
    if (!currentUser) return;
    saveStoredUserPhoto(currentUser.id, newPhotoUrl, currentUser);
    if (onUpdateUserPhoto) {
      onUpdateUserPhoto(currentUser.id, newPhotoUrl);
    } else if (onSelectUser) {
      onSelectUser({
        ...currentUser,
        photoUrl: newPhotoUrl,
        avatarUrl: newPhotoUrl,
      });
    }
  };

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

  return (
    <>
      <header className="print:hidden sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors bg-emerald-50/95 dark:bg-[#072a1e]/95 border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs safe-top">
        {/* Sleek, Minimalist, Compact Top Bar */}
        <div className="w-full max-w-[1600px] mx-auto px-2.5 sm:px-4 lg:px-6 h-13 sm:h-14 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand / Logo + Mobile Menu Drawer Trigger */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            {onOpenMobileDrawer && (
              <button
                type="button"
                onClick={onOpenMobileDrawer}
                className="sm:hidden p-1.5 rounded-xl bg-white/90 dark:bg-emerald-950/80 hover:bg-emerald-100 dark:hover:bg-emerald-900 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100 shadow-2xs active:scale-95 cursor-pointer flex items-center justify-center min-w-[36px] min-h-[36px] shrink-0"
                title="Abrir Menu de Módulos"
                aria-label="Abrir Menu Principal"
              >
                <Menu className="w-4 h-4 text-emerald-700 dark:text-emerald-300" />
              </button>
            )}

            <div 
              onClick={() => setCurrentView('hub')}
              className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none group py-0.5 min-w-0"
              title="Ir para a Página Inicial (Hub de Módulos)"
            >
              {/* High-visibility Brand Emblem Frame */}
              <div className="relative flex-shrink-0 flex items-center">
                <BrandLogo 
                  theme={theme} 
                  themeMode={themeMode}
                  size="sm" 
                  showBackground={true}
                  className="shadow-md hover:shadow-lg transition-all duration-300 group-hover:scale-105" 
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-xs sm:text-base lg:text-lg tracking-tight text-emerald-950 dark:text-emerald-50 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
                    {theme.companyName}
                  </span>
                  <span 
                    className="hidden sm:inline-block text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border shadow-2xs whitespace-nowrap"
                    style={{
                      backgroundColor: `${theme.primaryColor}20`,
                      color: theme.primaryColor,
                      borderColor: `${theme.primaryColor}40`,
                    }}
                  >
                    AgroSys
                  </span>
                </div>
                <p className="text-[11px] font-medium text-emerald-800/90 dark:text-emerald-300/90 hidden md:block truncate max-w-[200px] lg:max-w-[280px]">
                  {theme.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Right Controls: Essential tools, Company Switcher, Theme & User */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Direct Shortcut to Spray Workflow Guide (Desktop & Tablet) */}
            <button
              onClick={() => setCurrentView('spray-workflow')}
              title="Abrir Esteira Operacional & Passo a Passo de Pulverização (10 Etapas)"
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                currentView === 'spray-workflow'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white/90 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-100/70 border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs'
              }`}
            >
              <Workflow className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Passo a Passo</span>
            </button>

            {/* Offline/Online Simulator Indicator */}
            <button
              onClick={() => setIsOfflineSimulated(!isOfflineSimulated)}
              title={isOfflineSimulated ? 'Operando Offline (Fila Local)' : 'Online (Satélite / Nuvem)'}
              className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isOfflineSimulated
                  ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40'
                  : 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isOfflineSimulated ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden xl:inline">Offline</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="hidden xl:inline">Online</span>
                </>
              )}
            </button>

            {/* Company Selector for Master / Locked Company Badge for Company Admins (Desktop & Tablet) */}
            {isMaster ? (
              <div className="relative hidden sm:flex items-center">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/25 to-amber-500/20 dark:from-amber-500/30 dark:via-yellow-500/35 dark:to-amber-500/30 border border-amber-400/90 dark:border-amber-400 rounded-xl px-2 sm:px-2.5 py-1 shadow-2xs ring-1 ring-amber-400/40">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-lg bg-amber-500/30 dark:bg-amber-500/40 border border-amber-400/60 shadow-2xs" title="Acesso Master Total Multi-Empresa">
                    <span className="text-xs select-none">👑</span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-950 dark:text-amber-100 hidden md:inline">
                      SUPER MASTER
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <select
                      value={theme.tenantId || 'ciclodrone'}
                      onChange={(e) => handleSelectCompany(e.target.value)}
                      className="text-xs font-black bg-transparent text-amber-950 dark:text-amber-100 focus:outline-none cursor-pointer pr-4 max-w-[120px] sm:max-w-[170px] md:max-w-[210px] truncate appearance-none"
                      title="Alternar Empresa em Modo MASTER (Acesso Multi-Empresas Global)"
                      aria-label="Selecionar Empresa Ativa (Modo Master)"
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
                    <ChevronDown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-300 absolute right-0 pointer-events-none" />
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="hidden sm:flex items-center gap-1.5 bg-white/90 dark:bg-emerald-950/80 border border-emerald-200/90 dark:border-emerald-800/90 rounded-xl px-2.5 sm:px-3 py-1.5 shadow-2xs"
                title={`Empresa Vinculada: ${theme.companyName} (Acesso Restrito à Unidade)`}
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-xs font-black text-emerald-950 dark:text-emerald-100 truncate max-w-[120px] sm:max-w-[170px] md:max-w-[210px]">
                  {theme.companyName}
                </span>
              </div>
            )}

            {/* Minimalist Theme Mode Toggle */}
            <button
              type="button"
              onClick={() => {
                if (themeMode === 'light') setThemeMode('dark');
                else setThemeMode('light');
              }}
              className="p-1.5 sm:p-2 rounded-xl bg-white/90 dark:bg-emerald-950/80 hover:bg-white dark:hover:bg-emerald-900 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-100 shadow-2xs transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center min-w-[34px] min-h-[34px]"
              title={
                themeMode === 'light'
                  ? 'Modo de exibição: Claro (Clique para alternar para Escuro)'
                  : 'Modo de exibição: Escuro (Clique para alternar para Claro)'
              }
              aria-label="Alternar modo de exibição visual"
            >
              {themeMode === 'light' && (
                <Sun className="w-4 h-4 text-amber-500 transition-transform duration-200" />
              )}
              {themeMode === 'dark' && (
                <Moon className="w-4 h-4 text-cyan-400 transition-transform duration-200" />
              )}
            </button>

            {/* Current User Profile Identification */}
            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 pl-1 sm:pl-1.5 pr-2 sm:pr-2.5 py-1 rounded-xl bg-white/90 hover:bg-white dark:bg-emerald-950/80 dark:hover:bg-emerald-900/80 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-2xs group min-h-[38px]"
                  title={`Usuário conectado: ${currentUser.name} (${currentUser.roleLabel})`}
                  aria-expanded={isUserMenuOpen}
                >
                  <UserAvatar
                    user={currentUser}
                    size="sm"
                    showRoleBadge
                    className="ring-1 ring-emerald-500/40 group-hover:scale-105 transition-transform"
                  />
                  <div className="text-left hidden sm:block min-w-0 max-w-[110px] md:max-w-[140px]">
                    <div className="text-xs font-black text-emerald-950 dark:text-emerald-50 truncate leading-tight group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                      {currentUser.name.split(' ')[0]}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700/90 dark:text-emerald-300/90 truncate leading-none">
                      {currentUser.roleLabel}
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* User Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-3">
                    {/* Header with profile info */}
                    <div className="flex items-center gap-3 pb-3 border-b border-emerald-100 dark:border-emerald-800/60">
                      <div 
                        onClick={() => {
                          setIsPhotoModalOpen(true);
                          setIsUserMenuOpen(false);
                        }}
                        className="cursor-pointer relative group flex-shrink-0"
                        title="Clique para alterar foto"
                      >
                        <UserAvatar
                          user={currentUser}
                          size="md"
                          editable
                          onEditClick={() => {
                            setIsPhotoModalOpen(true);
                            setIsUserMenuOpen(false);
                          }}
                          showRoleBadge
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-emerald-950 dark:text-white truncate">
                          {currentUser.name}
                        </h4>
                        <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 truncate">
                          {currentUser.email}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          {isMaster ? (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30 flex items-center gap-1">
                              👑 SUPER MASTER
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                              {currentUser.roleLabel}
                            </span>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200">
                            🏢 {theme.companyName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Change profile photo button */}
                    <button
                      onClick={() => {
                        setIsPhotoModalOpen(true);
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 border border-emerald-200/70 dark:border-emerald-800/70 transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        Alterar Foto de Perfil
                      </span>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Trocar</span>
                    </button>



                    {/* Logout */}
                    {onLogout && (
                      <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/60">
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sair da Conta</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modal para Alterar Foto de Perfil */}
      {currentUser && (
        <UserPhotoUploadModal
          isOpen={isPhotoModalOpen}
          onClose={() => setIsPhotoModalOpen(false)}
          user={currentUser}
          currentPhotoUrl={currentUser.photoUrl || currentUser.avatarUrl}
          onSavePhoto={handleSavePhoto}
        />
      )}
    </>
  );
};
