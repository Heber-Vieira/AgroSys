/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Navbar, AppViewMode } from './components/Navbar';
import { AppLayout } from './components/AppLayout';
import { DashboardView } from './components/DashboardView';
import { ServiceOrdersView } from './components/ServiceOrdersView';
import { ReportsView } from './components/ReportsView';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { GisPlotsView } from './components/GisPlotsView';
import { SprayMixView } from './components/SprayMixView';
import { WeatherGateView } from './components/WeatherGateView';
import { TelemetryView } from './components/TelemetryView';
import { PricingMatrixView } from './components/PricingMatrixView';
import { FleetDronesView } from './components/FleetDronesView';
import { FinancialCommissionsView } from './components/FinancialCommissionsView';
import { DatabaseSchemaView } from './components/DatabaseSchemaView';
import { DesignSystemView } from './components/DesignSystemView';
import { AdminBrandingStudio } from './components/AdminBrandingStudio';
import { AdminManagementHubView } from './components/AdminManagementHubView';
import { VirtualTourView } from './components/VirtualTourView';
import { InteractiveTourOverlay } from './components/InteractiveTourOverlay';
import { TechDocsView } from './components/TechDocsView';
import { HelpCenterView } from './components/HelpCenterView';
import { LoginView } from './components/LoginView';
import { SprayReportModal } from './components/SprayReportModal';
import { QuotationsView } from './components/QuotationsView';
import { HomeHubView } from './components/HomeHubView';
import { SprayWorkflowGuideView } from './components/SprayWorkflowGuideView';
import { EmployeeAccessControlModal } from './components/EmployeeAccessControlModal';
import { DraggableHelpButton } from './components/DraggableHelpButton';
import { AgroSysToastContainer } from './components/common/AgroSysToastContainer';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { HelpCircle, ArrowLeft, ArrowRight, Lock, LayoutGrid } from 'lucide-react';

import { 
  ThemeMode, 
  WhiteLabelTheme, 
  UserProfile, 
  ServiceOrder, 
  FarmPlot, 
  AgriculturalDrone,
  DroneBatteryAsset,
  CrewPilot, 
  CrewAssistant, 
  PricingMatrixRule, 
  FinancialEntry, 
  ClientProducer, 
  CompensationPolicy, 
  DroneMaintenanceLog, 
  BatteryAlertSettings, 
  SprayQuotation
} from './types';
import { PRESET_COMPANIES, generateToneScale } from './data/themeTokensData';
import { 
  isMasterUser, 
  normalizeUserProfile, 
  canUserAccessView,
  deduplicateUserProfiles,
  deduplicateCrewPilots,
  deduplicateCrewAssistants,
  syncCompanyPilots,
  syncCompanyAssistants
} from './utils/userPermissions';
import { 
  getStoredConfiguredLogoUrl, 
  setStoredConfiguredLogoUrl, 
  getStoredConfiguredLogoDarkUrl,
  setStoredConfiguredLogoDarkUrl,
  getStoredLogoAdaptiveMode,
  setStoredLogoAdaptiveMode,
  getStoredConfiguredLogoIconId, 
  setStoredConfiguredLogoIconId,
} from './services/brandingLogoStorage';
import { getCompanyTheme } from './services/brandingLogoStorage';
import { getStoredRegisteredCompanies } from './services/companyStorage';
import { 
  USER_PROFILES, 
  INITIAL_PLOTS, 
  INITIAL_DRONES, 
  INITIAL_DRONE_BATTERIES,
  INITIAL_PILOTS, 
  INITIAL_ASSISTANTS, 
  INITIAL_ORDERS, 
  INITIAL_PRICING_RULES, 
  INITIAL_FINANCIALS,
  INITIAL_CLIENTS,
  INITIAL_COMPENSATION_POLICY,
  INITIAL_MAINTENANCE_LOGS,
  INITIAL_BATTERY_ALERT_SETTINGS,
  INITIAL_QUOTATIONS
} from './data/mockAppState';
import { BatteryAlertOverlay } from './components/BatteryAlertOverlay';
import { DroneBatteryManagerModal } from './components/DroneBatteryManagerModal';
import { playBatteryAlertSound } from './utils/batteryAudioAlert';
import { 
  calculateNextBatteryAlertTimestamp, 
  calculateBatterySnoozeTimestamp, 
  formatBatteryPeriodLabel, 
  formatTimestampToDate 
} from './utils/batteryAlertUtils';
import { showToast } from './services/notificationService';
import { 
  loadTenantBrandingFromSupabase, 
  loadUserPhotosFromSupabase, 
  saveAppDataToSupabase, 
  saveUserProfileToSupabase,
  loadUserProfilesFromSupabase,
  subscribeToUserProfiles
} from './services/supabase';
import { USER_PHOTO_STORAGE_KEY } from './components/UserAvatar';
import { hydrateAllCloudData, saveBatteryAlertSettingsToCloud, saveServiceOrdersToCloud, loadServiceOrdersFromCloud } from './services/cloudSyncService';
import { useNetworkStatus } from './hooks/useNetworkStatus';
// Helper to merge stored arrays with initial mock data so all companies have default records
function loadAndMergeWithMock<T extends { id: string; companyId?: string; email?: string; cpf?: string }>(
  storageKey: string,
  initialArray: T[]
): T[] {
  try {
    const deletedRaw = localStorage.getItem('agrodrone_deleted_user_ids');
    const deletedSet = new Set<string>();
    if (deletedRaw) {
      try {
        const parsedDeleted: string[] = JSON.parse(deletedRaw);
        if (Array.isArray(parsedDeleted)) {
          parsedDeleted.forEach(id => deletedSet.add(id.toLowerCase().trim()));
        }
      } catch (e) {}
    }

    const isUserOrCrewStore = storageKey.includes('users') || storageKey.includes('pilots') || storageKey.includes('assistants');

    const isDeleted = (item: T): boolean => {
      if (!isUserOrCrewStore || !item) return false;
      if (item.id && deletedSet.has(item.id.toLowerCase().trim())) return true;
      if (item.email && deletedSet.has(item.email.toLowerCase().trim())) return true;
      if (item.cpf && deletedSet.has(item.cpf.trim())) return true;
      return false;
    };

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed: T[] = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const activeParsed = parsed.filter(item => !isDeleted(item));
        const existingIds = new Set(activeParsed.map(item => item.id));
        const missingInitial = initialArray.filter(item => !existingIds.has(item.id) && !isDeleted(item));
        const combined = [...activeParsed, ...missingInitial];

        if (storageKey === 'agrodrone_orders_fleet') {
          return combined.map((item: any) => {
            const initialMatch: any = (initialArray as any[]).find(m => m.id === item.id);
            if (item.id === 'os-ciclo-001') {
              return {
                ...item,
                status: 'COMPLETED',
                sprayedHectares: 120.0,
                digitalSigned: true,
                createdAt: item.createdAt || '2026-09-10T08:00:00.000Z',
                completedAt: '2026-09-14T10:30:00.000Z',
              } as T;
            }
            if (item.status === 'COMPLETED' && !item.completedAt) {
              return {
                ...item,
                completedAt: initialMatch?.completedAt || '2026-09-14T10:30:00.000Z',
                createdAt: item.createdAt || initialMatch?.createdAt || (item.scheduledDate ? `${item.scheduledDate}T08:00:00.000Z` : '2026-09-10T08:00:00.000Z'),
              } as T;
            }
            return item;
          });
        }
        return combined;
      }
    }

    return initialArray.filter(item => !isDeleted(item));
  } catch (e) {
    console.warn(`Erro ao carregar ${storageKey} do localStorage:`, e);
  }
  return initialArray;
}

export default function App() {
  // Navigation View - Defaults to the Home Hub Cards Page
  const [currentView, setCurrentView] = useState<AppViewMode>('hub');
  
  // Global Network Status (Offline-First support)
  const { isActuallyOffline } = useNetworkStatus();
  const initialNetworkState = React.useRef(isActuallyOffline);

  useEffect(() => {
    // Only show toast on actual transition, not initial render
    if (initialNetworkState.current !== isActuallyOffline) {
      if (isActuallyOffline) {
        showToast('Conexão perdida. Operando de forma resiliente em modo Offline (Fila de Sincronização Local ativada).', 'warning');
      } else {
        showToast('Conexão reestabelecida! Sincronizando dados pendentes com a nuvem...', 'success');
        hydrateAllCloudData().catch(e => console.warn('Erro na hidratação pós-reconexão', e));
      }
      initialNetworkState.current = isActuallyOffline;
    }
  }, [isActuallyOffline]);

  // Theme & White Label with LocalStorage persistence
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('agrodrone_theme_mode');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light';
  });

  const [theme, setTheme] = useState<WhiteLabelTheme>(() => {
    // If there's a saved currentUser from previous session:
    const savedUserRaw = localStorage.getItem('agrodrone_current_user');
    let initialCompanyId = 'ciclodrone';
    if (savedUserRaw) {
      try {
        const u = JSON.parse(savedUserRaw);
        if (u && !isMasterUser(u) && u.companyId) {
          initialCompanyId = u.companyId;
        }
      } catch (e) {}
    } else {
      const savedTheme = localStorage.getItem('agrodrone_white_label_theme');
      if (savedTheme) {
        try {
          const t = JSON.parse(savedTheme);
          if (t && t.tenantId) initialCompanyId = t.tenantId;
        } catch (e) {}
      }
    }
    return getCompanyTheme(initialCompanyId);
  });

  // Active Company / Tenant ID
  const activeTenantId = theme.tenantId || 'ciclodrone';

  // Master Application State collections (Persisted to LocalStorage)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const raw = loadAndMergeWithMock('agrodrone_users_fleet', USER_PROFILES);
    return deduplicateUserProfiles(raw);
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('agrodrone_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.id || parsed.email)) {
          return normalizeUserProfile(parsed);
        }
      } catch (e) {}
    }
    return normalizeUserProfile(USER_PROFILES[0]); // Heber Vieira (MASTER)
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [isAccessControlModalOpen, setIsAccessControlModalOpen] = useState<boolean>(false);

  // Sync users to localStorage and Supabase Cloud
  useEffect(() => {
    try {
      const deduplicated = deduplicateUserProfiles(allUsers);
      localStorage.setItem('agrodrone_users_fleet', JSON.stringify(deduplicated));
      saveAppDataToSupabase('users_fleet', deduplicated).catch(e => console.warn('Aviso ao sincronizar usuários com Supabase:', e));
      deduplicated.forEach(u => saveUserProfileToSupabase(u).catch(() => {}));
    } catch (e) {
      console.warn('Falha ao salvar usuários no localStorage:', e);
    }
  }, [allUsers]);

  // Initial Cloud User Hydration & Realtime Subscription
  useEffect(() => {
    let isMounted = true;

    const fetchAndMergeUsers = async () => {
      try {
        const cloudUsers = await loadUserProfilesFromSupabase();
        if (!isMounted || !cloudUsers) return;

        const deletedRaw = localStorage.getItem('agrodrone_deleted_user_ids');
        const deletedSet = new Set<string>();
        if (deletedRaw) {
          try {
            const parsedDeleted: string[] = JSON.parse(deletedRaw);
            if (Array.isArray(parsedDeleted)) {
              parsedDeleted.forEach(id => deletedSet.add(id.toLowerCase().trim()));
            }
          } catch (e) {}
        }

        setAllUsers(prevUsers => {
          // NOTE: Do NOT re-include USER_PROFILES (mocks) here — they are already
          // present in prevUsers via loadAndMergeWithMock on initial load.
          // Re-including them would resurrect deleted mock users on every cloud sync.
          const cloudFiltered = cloudUsers.filter(u => {
            if (!u) return false;
            if (u.id && deletedSet.has(u.id.toLowerCase().trim())) return false;
            if (u.email && deletedSet.has(u.email.toLowerCase().trim())) return false;
            if (u.documentNumber && deletedSet.has(u.documentNumber.trim())) return false;
            return true;
          });
          const combined = [...prevUsers, ...cloudFiltered];
          const merged = deduplicateUserProfiles(combined);
          try {
            localStorage.setItem('agrodrone_users_fleet', JSON.stringify(merged));
          } catch (e) {}
          return merged;
        });
      } catch (err) {
        console.warn('Erro ao carregar usuários da nuvem:', err);
      }
    };

    fetchAndMergeUsers();
    hydrateAllCloudData().catch(e => console.warn('Aviso na hidratação geral:', e));

    const unsubscribe = subscribeToUserProfiles(() => {
      fetchAndMergeUsers();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Sync currentUser to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_current_user', JSON.stringify(currentUser));
    } catch (e) {}
  }, [currentUser]);

  // Automatically synchronize tenant theme when an admin or regular user logs in with a specific companyId
  useEffect(() => {
    const isMaster = isMasterUser(currentUser);
    if (!isMaster && currentUser.companyId && currentUser.companyId !== theme.tenantId) {
      setTheme(getCompanyTheme(currentUser.companyId));
    }
  }, [currentUser, theme.tenantId]);

  // Master collections with automatic mock merging for multi-tenancy
  const [allOrders, setAllOrders] = useState<ServiceOrder[]>(() => 
    loadAndMergeWithMock('agrodrone_orders_fleet', INITIAL_ORDERS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_orders_fleet', JSON.stringify(allOrders));
      saveServiceOrdersToCloud(allOrders).catch(() => {});
    } catch (e) {}
  }, [allOrders]);

  const [allPlots, setAllPlots] = useState<FarmPlot[]>(() => 
    loadAndMergeWithMock('agrodrone_plots_fleet', INITIAL_PLOTS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_plots_fleet', JSON.stringify(allPlots));
    } catch (e) {}
  }, [allPlots]);

  const [allDrones, setAllDrones] = useState<AgriculturalDrone[]>(() => 
    loadAndMergeWithMock('agrodrone_drones_fleet', INITIAL_DRONES)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_drones_fleet', JSON.stringify(allDrones));
    } catch (e) {}
  }, [allDrones]);

  const [allBatteries, setAllBatteries] = useState<DroneBatteryAsset[]>(() => 
    loadAndMergeWithMock('agrodrone_batteries_fleet', INITIAL_DRONE_BATTERIES)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_batteries_fleet', JSON.stringify(allBatteries));
    } catch (e) {}
  }, [allBatteries]);

  const [allMaintenanceLogs, setAllMaintenanceLogs] = useState<DroneMaintenanceLog[]>(() => 
    loadAndMergeWithMock('agrodrone_maintenance_logs', INITIAL_MAINTENANCE_LOGS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_maintenance_logs', JSON.stringify(allMaintenanceLogs));
    } catch (e) {}
  }, [allMaintenanceLogs]);

  const [allPilots, setAllPilots] = useState<CrewPilot[]>(() => {
    const raw = loadAndMergeWithMock('agrodrone_pilots_fleet', INITIAL_PILOTS);
    const sanitized = (raw || []).filter(p => p && p.id !== 'user-heber-vieira' && p.id !== 'user-thales-vieira' && !p.name?.toLowerCase().includes('heber'));
    return deduplicateCrewPilots(sanitized);
  });
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_pilots_fleet', JSON.stringify(allPilots));
    } catch (e) {}
  }, [allPilots]);

  const [allAssistants, setAllAssistants] = useState<CrewAssistant[]>(() => {
    const raw = loadAndMergeWithMock('agrodrone_assistants_fleet', INITIAL_ASSISTANTS);
    const sanitized = (raw || []).filter(a => a && a.id !== 'user-heber-vieira' && a.id !== 'user-thales-vieira' && !a.name?.toLowerCase().includes('heber'));
    return deduplicateCrewAssistants(sanitized);
  });
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_assistants_fleet', JSON.stringify(allAssistants));
    } catch (e) {}
  }, [allAssistants]);

  const [allClients, setAllClients] = useState<ClientProducer[]>(() => 
    loadAndMergeWithMock('agrodrone_clients_fleet', INITIAL_CLIENTS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_clients_fleet', JSON.stringify(allClients));
    } catch (e) {}
  }, [allClients]);

  const [allQuotations, setAllQuotations] = useState<SprayQuotation[]>(() => 
    loadAndMergeWithMock('agrodrone_quotations_fleet', INITIAL_QUOTATIONS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_quotations_fleet', JSON.stringify(allQuotations));
    } catch (e) {}
  }, [allQuotations]);

  const [allPricingRules, setAllPricingRules] = useState<PricingMatrixRule[]>(() => 
    loadAndMergeWithMock('agrodrone_pricing_rules_fleet', INITIAL_PRICING_RULES)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_pricing_rules_fleet', JSON.stringify(allPricingRules));
    } catch (e) {}
  }, [allPricingRules]);

  const [allFinancials, setAllFinancials] = useState<FinancialEntry[]>(() => 
    loadAndMergeWithMock('agrodrone_financials_fleet', INITIAL_FINANCIALS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_financials_fleet', JSON.stringify(allFinancials));
    } catch (e) {}
  }, [allFinancials]);

  const [compensation, setCompensation] = useState<CompensationPolicy>(INITIAL_COMPENSATION_POLICY);

  // =========================================================================
  // MULTI-TENANCY DATA ISOLATION: Scoped Data for Active Company or Global View
  // =========================================================================
  const isGlobalView = activeTenantId === 'ALL';

  const orders = useMemo(() => 
    isGlobalView ? allOrders : allOrders.filter(o => (o.companyId || 'ciclodrone') === activeTenantId), 
    [allOrders, activeTenantId, isGlobalView]
  );

  const plots = useMemo(() => 
    isGlobalView ? allPlots : allPlots.filter(p => (p.companyId || 'ciclodrone') === activeTenantId), 
    [allPlots, activeTenantId, isGlobalView]
  );

  const drones = useMemo(() => 
    isGlobalView ? allDrones : allDrones.filter(d => (d.companyId || 'ciclodrone') === activeTenantId), 
    [allDrones, activeTenantId, isGlobalView]
  );

  const pilots = useMemo(() => {
    return syncCompanyPilots(allPilots, allUsers, activeTenantId, isGlobalView, INITIAL_PILOTS);
  }, [allPilots, allUsers, activeTenantId, isGlobalView]);

  const assistants = useMemo(() => {
    return syncCompanyAssistants(allAssistants, allUsers, activeTenantId, isGlobalView, INITIAL_ASSISTANTS);
  }, [allAssistants, allUsers, activeTenantId, isGlobalView]);

  const clients = useMemo(() => 
    isGlobalView ? allClients : allClients.filter(c => (c.companyId || 'ciclodrone') === activeTenantId), 
    [allClients, activeTenantId, isGlobalView]
  );

  const quotations = useMemo(() => 
    isGlobalView ? allQuotations : allQuotations.filter(q => (q.companyId || 'ciclodrone') === activeTenantId), 
    [allQuotations, activeTenantId, isGlobalView]
  );

  const financials = useMemo(() => 
    isGlobalView ? allFinancials : allFinancials.filter(f => (f.companyId || 'ciclodrone') === activeTenantId), 
    [allFinancials, activeTenantId, isGlobalView]
  );

  const maintenanceLogs = useMemo(() => 
    isGlobalView ? allMaintenanceLogs : allMaintenanceLogs.filter(m => (m.companyId || 'ciclodrone') === activeTenantId), 
    [allMaintenanceLogs, activeTenantId, isGlobalView]
  );

  const batteries = useMemo(() => 
    isGlobalView ? allBatteries : allBatteries.filter(b => (b.companyId || 'ciclodrone') === activeTenantId), 
    [allBatteries, activeTenantId, isGlobalView]
  );

  const pricingRules = useMemo(() => 
    isGlobalView ? allPricingRules : allPricingRules.filter(r => (r.companyId || 'ciclodrone') === activeTenantId), 
    [allPricingRules, activeTenantId, isGlobalView]
  );

  const users = useMemo(() => 
    isGlobalView 
      ? allUsers 
      : allUsers.filter(u => !isMasterUser(u) && (u.companyId || 'ciclodrone') === activeTenantId), 
    [allUsers, activeTenantId, isGlobalView]
  );

  // =========================================================================
  // MULTI-TENANCY SCOPED SETTERS: Modifies active company's data and preserves others
  // =========================================================================
  const setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>> = (action) => {
    setAllOrders(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(o => (o.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: ServiceOrder) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(o => (o.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setPlots: React.Dispatch<React.SetStateAction<FarmPlot[]>> = (action) => {
    setAllPlots(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(p => (p.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: FarmPlot) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(p => (p.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setDrones: React.Dispatch<React.SetStateAction<AgriculturalDrone[]>> = (action) => {
    setAllDrones(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(d => (d.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: AgriculturalDrone) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(d => (d.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setBatteries: React.Dispatch<React.SetStateAction<DroneBatteryAsset[]>> = (action) => {
    setAllBatteries(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(b => (b.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: DroneBatteryAsset) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(b => (b.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setPilots: React.Dispatch<React.SetStateAction<CrewPilot[]>> = (action) => {
    setAllPilots(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(p => (p.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: CrewPilot) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(p => (p.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setAssistants: React.Dispatch<React.SetStateAction<CrewAssistant[]>> = (action) => {
    setAllAssistants(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(a => (a.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: CrewAssistant) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(a => (a.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setClients: React.Dispatch<React.SetStateAction<ClientProducer[]>> = (action) => {
    setAllClients(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(c => (c.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: ClientProducer) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(c => (c.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setQuotations: React.Dispatch<React.SetStateAction<SprayQuotation[]>> = (action) => {
    setAllQuotations(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(q => (q.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: SprayQuotation) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(q => (q.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setMaintenanceLogs: React.Dispatch<React.SetStateAction<DroneMaintenanceLog[]>> = (action) => {
    setAllMaintenanceLogs(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(m => (m.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: DroneMaintenanceLog) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(m => (m.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setPricingRules: React.Dispatch<React.SetStateAction<PricingMatrixRule[]>> = (action) => {
    setAllPricingRules(prevAll => {
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(r => (r.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: PricingMatrixRule) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(r => (r.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>> = (action) => {
    setAllUsers(prevAll => {
      if (activeTenantId === 'ALL' || isMasterUser(currentUser)) {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(u => u.role === 'ADMIN' || u.role === 'MASTER' || u.isMaster || (u.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: UserProfile) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(u => (u.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  // Battery Alert Settings & Periodic Timer State
  const [batteryAlertSettings, setBatteryAlertSettings] = useState<BatteryAlertSettings>(() => {
    const saved = localStorage.getItem('agrodrone_battery_alert_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.periodValue === 'number') {
          return {
            ...INITIAL_BATTERY_ALERT_SETTINGS,
            ...parsed,
          };
        }
      } catch (e) {
        console.warn('Falha ao carregar configurações de alertas de bateria:', e);
      }
    }
    return INITIAL_BATTERY_ALERT_SETTINGS;
  });

  const [showBatteryAlertBanner, setShowBatteryAlertBanner] = useState<boolean>(false);

  // Sync battery alert settings to localStorage and Supabase Cloud
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_battery_alert_config', JSON.stringify(batteryAlertSettings));
      saveBatteryAlertSettingsToCloud(batteryAlertSettings).catch(() => {});
    } catch (e) {
      console.warn('Falha ao salvar configurações de alertas de bateria:', e);
    }
  }, [batteryAlertSettings]);

  // Periodic Timer Effect for Battery Health Checks
  // Respeita estritamente a periodicidade configurada em Dias ou Meses e o reconhecimento do alarme
  useEffect(() => {
    if (!batteryAlertSettings.enabled) {
      setShowBatteryAlertBanner(false);
      return;
    }

    const checkIntervalMs = 5000; // Avalia o relógio a cada 5 segundos
    const timer = setInterval(() => {
      const now = Date.now();
      const nextTime = batteryAlertSettings.nextAlertTimestamp;

      // Se nextAlertTimestamp não estiver definido, calcula com base na periodicidade
      if (!nextTime) {
        const nextMs = calculateNextBatteryAlertTimestamp(batteryAlertSettings, now);
        setBatteryAlertSettings(prev => ({
          ...prev,
          nextAlertTimestamp: nextMs,
        }));
        return;
      }

      // O alerta só é disparado quando a data agendada for atingida ou ultrapassada
      if (now >= nextTime) {
        setShowBatteryAlertBanner(prevShow => {
          if (!prevShow) {
            // Emite o aviso sonoro apenas uma vez ao abrir o alerta
            if (batteryAlertSettings.soundEnabled) {
              playBatteryAlertSound(batteryAlertSettings.soundType, batteryAlertSettings.soundVolume);
            }
            return true;
          }
          return prevShow;
        });
      }
    }, checkIntervalMs);

    return () => clearInterval(timer);
  }, [
    batteryAlertSettings.enabled, 
    batteryAlertSettings.nextAlertTimestamp, 
    batteryAlertSettings.periodUnit, 
    batteryAlertSettings.periodValue, 
    batteryAlertSettings.soundEnabled, 
    batteryAlertSettings.soundType, 
    batteryAlertSettings.soundVolume
  ]);

  // Handler for photo updates
  const handleUpdateUserPhoto = (userId: string, photoUrl: string) => {
    setAllUsers(prev => prev.map(u => (u.id === userId || (u.email && u.email.toLowerCase() === userId.toLowerCase())) ? { ...u, photoUrl, avatarUrl: photoUrl } : u));
    setCurrentUser(prev => (prev.id === userId || (prev.email && prev.email.toLowerCase() === userId.toLowerCase())) ? { ...prev, photoUrl, avatarUrl: photoUrl } : prev);
    setAllPilots(prev => prev.map(p => (p.id === userId || p.cpf === userId || p.name === userId) ? { ...p, photoUrl, avatarUrl: photoUrl } : p));
    setAllAssistants(prev => prev.map(a => (a.id === userId || a.cpf === userId || a.name === userId) ? { ...a, photoUrl, avatarUrl: photoUrl } : a));
  };

  // Global listener for photo updates anywhere in the app
  useEffect(() => {
    const handleGlobalPhotoUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (!detail) return;
      const { id, userId, email, name, documentNumber, photoUrl } = detail;
      if (photoUrl !== undefined) {
        const matches = (target: { id?: string; email?: string; name?: string; documentNumber?: string; cpf?: string }) => {
          if (!target) return false;
          if (id && (target.id === id || target.email?.toLowerCase() === id.toLowerCase() || target.documentNumber === id || target.cpf === id || target.name === id)) return true;
          if (userId && target.id === userId) return true;
          if (email && target.email?.toLowerCase() === email.toLowerCase()) return true;
          if (documentNumber && (target.documentNumber === documentNumber || target.cpf === documentNumber)) return true;
          if (name && target.name?.toLowerCase() === name.toLowerCase()) return true;
          return false;
        };

        setCurrentUser(prev => matches(prev) ? { ...prev, photoUrl, avatarUrl: photoUrl } : prev);
        setAllUsers(prev => prev.map(u => matches(u) ? { ...u, photoUrl, avatarUrl: photoUrl } : u));
        setAllPilots(prev => prev.map(p => matches(p) ? { ...p, photoUrl, avatarUrl: photoUrl } : p));
        setAllAssistants(prev => prev.map(a => matches(a) ? { ...a, photoUrl, avatarUrl: photoUrl } : a));
      }
    };
    window.addEventListener('agrodrone-user-photo-updated', handleGlobalPhotoUpdate);
    return () => window.removeEventListener('agrodrone-user-photo-updated', handleGlobalPhotoUpdate);
  }, []);

  // Modal State
  const [showNewOSModal, setShowNewOSModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  
  // Drone Battery Manager Modal State
  const [isBatteryModalOpen, setIsBatteryModalOpen] = useState<boolean>(false);
  const [selectedBatteryDroneId, setSelectedBatteryDroneId] = useState<string | undefined>(undefined);

  const handleOpenBatteryManager = (droneId?: string) => {
    setSelectedBatteryDroneId(droneId);
    setIsBatteryModalOpen(true);
  };

  // Global Spray Technical Report Modal State
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportSelectedOrderId, setReportSelectedOrderId] = useState<string | undefined>(undefined);

  const handleOpenReportModal = (orderId?: string) => {
    setReportSelectedOrderId(orderId || orders[0]?.id);
    setShowReportModal(true);
  };

  // Interactive Live Tour State
  const [isLiveTourActive, setIsLiveTourActive] = useState<boolean>(false);
  const [liveTourStepIndex, setLiveTourStepIndex] = useState<number>(0);

  const startLiveTour = () => {
    setIsLiveTourActive(true);
    setLiveTourStepIndex(0);
  };

  // Hydrate all tenant brandings, custom logos, alarm periodicities & user photos from Supabase on initial mount
  useEffect(() => {
    async function restoreCloudState() {
      try {
        const hydration = await hydrateAllCloudData();

        // 1. Hydrate active theme branding & logos
        const activeTId = theme.tenantId || 'ciclodrone';
        const cloudBranding = hydration.brandings[activeTId] || (activeTId === 'ciclodrone' ? Object.values(hydration.brandings)[0] : undefined);
        if (cloudBranding && (cloudBranding.companyName || cloudBranding.logoUrl || cloudBranding.logoDarkUrl || cloudBranding.logoIconId)) {
          setTheme(prev => ({
            ...prev,
            ...cloudBranding,
            logoUrl: cloudBranding.logoUrl || getStoredConfiguredLogoUrl(activeTId),
            logoDarkUrl: cloudBranding.logoDarkUrl || getStoredConfiguredLogoDarkUrl(activeTId),
            logoIconId: cloudBranding.logoIconId || getStoredConfiguredLogoIconId(activeTId),
            logoAdaptiveMode: cloudBranding.logoAdaptiveMode || getStoredLogoAdaptiveMode(activeTId),
          }));
        }

        // 2. Hydrate battery alert settings & periodicities
        if (hydration.batteryAlertSettings) {
          setBatteryAlertSettings(prev => ({
            ...prev,
            ...hydration.batteryAlertSettings,
          }));
        }

        // 3. Hydrate user profile photos from Supabase Cloud
        if (hydration.userPhotos && Object.keys(hydration.userPhotos).length > 0) {
          const photoMap = hydration.userPhotos;

          setAllUsers(prev => prev.map(u => {
            const photo = photoMap[u.id] || (u.email && photoMap[u.email.toLowerCase()]) || (u.email && photoMap[u.email]) || photoMap[u.name] || (u.documentNumber && photoMap[u.documentNumber]);
            return photo ? { ...u, photoUrl: photo, avatarUrl: photo } : u;
          }));

          setCurrentUser(prev => {
            const photo = photoMap[prev.id] || (prev.email && photoMap[prev.email.toLowerCase()]) || (prev.email && photoMap[prev.email]) || photoMap[prev.name] || (prev.documentNumber && photoMap[prev.documentNumber]);
            return photo ? { ...prev, photoUrl: photo, avatarUrl: photo } : prev;
          });

          setAllPilots(prev => prev.map(p => {
            const photo = photoMap[p.id] || (p.cpf && photoMap[p.cpf]) || photoMap[p.name];
            return photo ? { ...p, photoUrl: photo, avatarUrl: photo } : p;
          }));

          setAllAssistants(prev => prev.map(a => {
            const photo = photoMap[a.id] || (a.cpf && photoMap[a.cpf]) || photoMap[a.name];
            return photo ? { ...a, photoUrl: photo, avatarUrl: photo } : a;
          }));

          window.dispatchEvent(new CustomEvent('agrodrone-user-photo-updated', {
            detail: { photos: photoMap }
          }));
        }
      } catch (err) {
        console.warn('Falha ao restaurar dados do Supabase:', err);
        // 5. Hydrate Service Orders (OS) from Cloud / IndexedDB
        try {
          const cloudOrders = await loadServiceOrdersFromCloud();
          if (cloudOrders && cloudOrders.length > 0) {
            setAllOrders(prev => {
              const existingMap = new Map<string, ServiceOrder>();
              prev.forEach(o => existingMap.set(o.id, o));
              cloudOrders.forEach(o => existingMap.set(o.id, { ...(existingMap.get(o.id) || {}), ...o }));
              return Array.from(existingMap.values());
            });
          }
        } catch (e) {}
      }
    }
    restoreCloudState();
  }, []);

  // Dynamically apply theme class to html/body and inject CSS variables
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }

    // Persist to local storage & ensure configured logo is preserved strictly for this company
    try {
      const tId = theme.tenantId;
      if (tId && tId !== 'ALL') {
        if (theme.logoUrl) {
          setStoredConfiguredLogoUrl(tId, theme.logoUrl);
        }
        if (theme.logoIconId) {
          setStoredConfiguredLogoIconId(tId, theme.logoIconId);
        }
        localStorage.setItem(`agrosys_company_theme_${tId}`, JSON.stringify(theme));
      }
      localStorage.setItem('agrodrone_white_label_theme', JSON.stringify(theme));
      localStorage.setItem('agrodrone_theme_mode', themeMode);
    } catch (e) {
      console.warn('LocalStorage quota or access issue:', e);
    }

    // Inject dynamic CSS custom properties for White Label
    const primaryScale = generateToneScale(theme.primaryColor);
    const secondaryScale = generateToneScale(theme.secondaryColor);

    root.style.setProperty('--color-primary', theme.primaryColor);
    root.style.setProperty('--color-primary-50', primaryScale[50]);
    root.style.setProperty('--color-primary-100', primaryScale[100]);
    root.style.setProperty('--color-primary-300', primaryScale[300]);
    root.style.setProperty('--color-primary-500', primaryScale[500]);
    root.style.setProperty('--color-primary-600', theme.primaryColor);
    root.style.setProperty('--color-primary-700', primaryScale[700]);
    root.style.setProperty('--color-primary-900', primaryScale[900]);

    root.style.setProperty('--color-secondary', theme.secondaryColor);
    root.style.setProperty('--color-secondary-50', secondaryScale[50]);
    root.style.setProperty('--color-secondary-500', secondaryScale[500]);

    root.style.setProperty('--color-accent', theme.accentColor);
    root.style.setProperty('--radius-theme', theme.borderRadius || '0.875rem');
    root.style.setProperty('--font-family', `"${theme.fontFamily || 'Plus Jakarta Sans'}", sans-serif`);

    // Dynamic document font and title
    document.body.style.fontFamily = `"${theme.fontFamily || 'Plus Jakarta Sans'}", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    document.title = "AgroSys - Gestão de Pulverização Agrícola";
  }, [themeMode, theme]);

  const handleSelectPlotForOS = (plot: FarmPlot) => {
    setCurrentView('orders');
    setShowNewOSModal(true);
  };

  const getViewTitle = (view: AppViewMode): string => {
    switch (view) {
      case 'orders': return 'Ordens de Serviço (OS)';
      case 'reports': return 'Relatórios Técnicos (MAPA / CREA)';
      case 'quotations': return 'Orçamentos Comerciais';
      case 'schedule': return 'Agenda & Escala Operacional';
      case 'gis': return 'Talhões Agrícolas (GIS)';
      case 'spray-mix': return 'Cálculo de Calda & Mistura (WALES)';
      case 'weather': return 'Clima & Janela Delta T';
      case 'telemetry': return 'Telemetria de Voo em Tempo Real';
      case 'pricing': return 'Tabela de Precificação por Hectare';
      case 'fleet': return 'Frota de Drones & Baterias';
      case 'financial': return 'Comissões & Financeiro';
      case 'admin-management': return 'Gestão Corporativa & Cadastros';
      case 'branding': return 'Personalização White Label & Marca';
      case 'design-system': return 'Design System & Componentes';
      case 'docs': return 'Arquitetura do Sistema';
      case 'database': return 'Modelagem de Banco de Dados';
      case 'virtual-tour': return 'Tour Interativo';
      case 'help': return 'Central de Ajuda & Suporte';
      default: return 'Painel Geral';
    }
  };

  // If user is not authenticated, render Login Screen
  if (!isAuthenticated) {
    return (
      <>
        <LoginView
          theme={theme}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsAuthenticated(true);
            setCurrentView('hub');
            if (!isMasterUser(user) && user.companyId) {
              setTheme(getCompanyTheme(user.companyId));
            }
          }}
          availableUsers={allUsers}
          setUsers={setAllUsers}
        />
        <AgroSysToastContainer />
      </>
    );
  }

  return (
    <AppLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      themeMode={themeMode}
      setThemeMode={setThemeMode}
      theme={theme}
      setTheme={setTheme}
      currentUser={currentUser}
      availableUsers={users}
      onSelectUser={(u) => {
        setCurrentUser(u);
        setCurrentView('hub');
        if (!isMasterUser(u) && u.companyId) {
          setTheme(getCompanyTheme(u.companyId));
        }
      }}
      onUpdateUserPhoto={handleUpdateUserPhoto}
      onLogout={() => {
        setIsAuthenticated(false);
        setCurrentView('hub');
      }}
      onStartTour={() => setCurrentView('virtual-tour')}
      onStartLiveTour={startLiveTour}
      onOpenHelp={() => setShowHelpModal(true)}
      onOpenReportModal={handleOpenReportModal}
      orders={orders}
      drones={drones}
    >

        {/* Nova Página Inicial (Cards Interativos & Explicativos) */}
        {currentView === 'hub' && (
          <HomeHubView
            currentUser={currentUser}
            theme={theme}
            orders={orders}
            plots={plots}
            drones={drones}
            quotations={quotations}
            financials={financials}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
            onOpenNewOS={() => {
              setCurrentView('orders');
              setShowNewOSModal(true);
            }}
            onOpenReportModal={handleOpenReportModal}
            onStartLiveTour={startLiveTour}
            onOpenAccessControl={() => setIsAccessControlModalOpen(true)}
          />
        )}

        {/* Access Restricted Barrier Guard */}
        {!canUserAccessView(currentUser, currentView) && currentView !== 'hub' ? (
          <div className="max-w-4xl mx-auto p-6 sm:p-12 my-8 text-center bg-slate-900/90 border border-amber-500/40 rounded-3xl shadow-2xl space-y-4 text-white">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg text-center">
              <Lock className="w-8 h-8 mx-auto" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">Acesso Restrito ao Módulo</h2>
            <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              Seu perfil de colaborador não possui autorização para acessar o módulo <strong className="text-amber-400 font-mono">{getViewTitle(currentView)}</strong>.
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Caso necessite utilizar esta funcionalidade, entre em contato com o Administrador da sua empresa para solicitar liberação no painel de <strong>Gestão de Acessos</strong>.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => setCurrentView('hub')}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Voltar à Central de Módulos</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Integrated End-to-End Spraying Process Workflow Guide */}
            {currentView === 'spray-workflow' && (
              <ErrorBoundary 
                fallbackTitle="Guia Passo a Passo de Pulverização" 
                onReset={() => setCurrentView('hub')}
              >
                <SprayWorkflowGuideView
                  currentUser={currentUser}
                  theme={theme}
                  orders={orders}
                  plots={plots}
                  drones={drones}
                  quotations={quotations}
                  financials={financials}
                  onNavigate={(view) => setCurrentView(view as AppViewMode)}
                  onOpenNewOS={() => {
                    setCurrentView('orders');
                    setShowNewOSModal(true);
                  }}
                  onOpenReportModal={handleOpenReportModal}
                />
              </ErrorBoundary>
            )}

            {/* Operational Modules */}
            {currentView === 'dashboard' && (
              <DashboardView
                currentUser={currentUser}
                orders={orders}
                plots={plots}
                drones={drones}
                batteries={batteries}
                clients={clients}
                pilots={pilots}
                assistants={assistants}
                financials={financials}
                allUsers={allUsers}
                onSaveUserPermissions={(userId, allowedViews) => {
                  setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedViews } : u));
                  if (currentUser.id === userId) {
                    setCurrentUser(prev => ({ ...prev, allowedViews }));
                  }
                }}
                registeredCompanies={getStoredRegisteredCompanies()}
                activeCompanyId={theme.tenantId}
                onNavigate={(view) => setCurrentView(view as AppViewMode)}
                onOpenNewOSModal={() => {
                  setCurrentView('orders');
                  setShowNewOSModal(true);
                }}
                onOpenNewOS={() => {
                  setCurrentView('orders');
                  setShowNewOSModal(true);
                }}
                onStartLiveTour={startLiveTour}
                onOpenReportModal={handleOpenReportModal}
              />
            )}

        {currentView === 'orders' && (
          <ServiceOrdersView
            currentUser={currentUser}
            theme={theme}
            orders={orders}
            setOrders={setOrders}
            plots={plots}
            setPlots={setPlots}
            drones={drones}
            pilots={pilots}
            assistants={assistants}
            clients={clients}
            setClients={setClients}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
            showNewOSModal={showNewOSModal}
            setShowNewOSModal={setShowNewOSModal}
          />
        )}

        {currentView === 'reports' && (
          <ReportsView
            currentUser={currentUser}
            theme={theme}
            orders={orders}
            plots={plots}
            drones={drones}
            pilots={pilots}
            assistants={assistants}
            clients={clients}
            onOpenReportModal={handleOpenReportModal}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
          />
        )}

        {currentView === 'quotations' && (
          <QuotationsView
            currentUser={currentUser}
            theme={theme}
            quotations={quotations}
            setQuotations={setQuotations}
            clients={clients}
            setClients={setClients}
            plots={plots}
            setPlots={setPlots}
            drones={drones}
            orders={orders}
            setOrders={setOrders}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
          />
        )}

        {currentView === 'schedule' && (
          <ScheduleCalendarView
            currentUser={currentUser}
            theme={theme}
            orders={orders}
            setOrders={setOrders}
            plots={plots}
            setPlots={setPlots}
            drones={drones}
            pilots={pilots}
            assistants={assistants}
            clients={clients}
            setClients={setClients}
            onNavigateToOS={() => setCurrentView('orders')}
          />
        )}

        {currentView === 'gis' && (
          <GisPlotsView
            currentUser={currentUser}
            plots={plots}
            setPlots={setPlots}
            onSelectPlotForOS={handleSelectPlotForOS}
          />
        )}

        {currentView === 'spray-mix' && (
          <SprayMixView 
            currentUser={currentUser} 
            plots={plots}
            orders={orders}
            drones={drones}
            theme={theme}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
          />
        )}

        {currentView === 'weather' && (
          <WeatherGateView currentUser={currentUser} plots={plots} />
        )}

        {currentView === 'telemetry' && (
          <TelemetryView currentUser={currentUser} />
        )}

        {currentView === 'pricing' && (
          <PricingMatrixView
            currentUser={currentUser}
            pricingRules={pricingRules}
            setPricingRules={setPricingRules}
          />
        )}

        {currentView === 'fleet' && (
          <FleetDronesView
            currentUser={currentUser}
            drones={drones}
            setDrones={setDrones}
            batteries={batteries}
            setBatteries={setBatteries}
            onOpenBatteryManager={handleOpenBatteryManager}
            pilots={pilots}
            setPilots={setPilots}
            assistants={assistants}
            setAssistants={setAssistants}
            maintenanceLogs={maintenanceLogs}
            setMaintenanceLogs={setMaintenanceLogs}
            theme={theme}
            onOpenAdminManagement={() => setCurrentView('admin-management')}
            onOpenBatteryAlerts={() => setShowBatteryAlertBanner(true)}
          />
        )}

        {currentView === 'financial' && (
          <FinancialCommissionsView
            currentUser={currentUser}
            orders={orders}
            financials={financials}
          />
        )}

        {/* Administration & Governance Modules (Accessible to Master & Company Admins) */}
        {currentView === 'admin-management' && (
          <AdminManagementHubView
            currentUser={currentUser}
            users={isMasterUser(currentUser) ? allUsers : users}
            setUsers={isMasterUser(currentUser) ? setAllUsers : setUsers}
            drones={drones}
            setDrones={setDrones}
            batteries={batteries}
            setBatteries={setBatteries}
            onOpenBatteryManager={handleOpenBatteryManager}
            pilots={pilots}
            setPilots={setPilots}
            assistants={assistants}
            setAssistants={setAssistants}
            clients={clients}
            setClients={setClients}
            compensation={compensation}
            setCompensation={setCompensation}
            onSwitchToAdmin={() => {
              const adminUser = allUsers.find(u => u.role === 'MASTER') || allUsers.find(u => u.role === 'ADMIN') || USER_PROFILES[0];
              setCurrentUser(adminUser);
            }}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
            onOpenAccessControl={() => setIsAccessControlModalOpen(true)}
            pricingRules={pricingRules}
            setPricingRules={setPricingRules}
            maintenanceLogs={maintenanceLogs}
            setMaintenanceLogs={setMaintenanceLogs}
            theme={theme}
            setTheme={setTheme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
          />
        )}

        {/* Technical Architecture & Documentation Modules */}
        {currentView === 'docs' && (
          <TechDocsView 
            theme={theme} 
            onNavigateToTab={(tab) => setCurrentView(tab as AppViewMode)} 
          />
        )}

        {currentView === 'database' && (
          <DatabaseSchemaView />
        )}

        {/* Branding Studio & Design System */}
        {currentView === 'branding' && (
          <AdminBrandingStudio
            currentUser={currentUser}
            theme={theme}
            setTheme={setTheme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            onSwitchToAdmin={() => {
              const adminUser = users.find(u => u.role === 'ADMIN') || USER_PROFILES[0];
              setCurrentUser(adminUser);
            }}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
          />
        )}

        {currentView === 'design-system' && (
          <AdminBrandingStudio
            currentUser={currentUser}
            theme={theme}
            setTheme={setTheme}
            themeMode={themeMode}
            setThemeMode={setThemeMode}
            onSwitchToAdmin={() => {
              const adminUser = users.find(u => u.role === 'ADMIN') || USER_PROFILES[0];
              setCurrentUser(adminUser);
            }}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
          />
        )}

        {currentView === 'virtual-tour' && (
          <VirtualTourView 
            currentUser={currentUser} 
            theme={theme}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
          />
        )}

        {currentView === 'help' && (
          <HelpCenterView
            currentUser={currentUser}
            theme={theme}
            onNavigate={(view) => setCurrentView(view as AppViewMode)}
            onStartTour={() => setCurrentView('virtual-tour')}
            onStartLiveTour={startLiveTour}
          />
        )}
      </>
    )}

      {/* Persistent Floating Draggable Help/Tour Button (Hidden on initial home page 'hub' and full help views) */}
      {currentView !== 'hub' && currentView !== 'help' && currentView !== 'virtual-tour' && (
        <div className="print:hidden">
          <DraggableHelpButton
            onOpenHelp={() => setShowHelpModal(true)}
            onStartTour={() => setCurrentView('virtual-tour')}
            onStartLiveTour={startLiveTour}
            theme={theme}
            currentView={currentView}
          />
        </div>
      )}

      {/* Global Battery Inspection Alert Overlay */}
      <BatteryAlertOverlay
        currentUser={currentUser}
        drones={drones}
        setDrones={setDrones}
        settings={batteryAlertSettings}
        setSettings={setBatteryAlertSettings}
        showAlertBanner={showBatteryAlertBanner}
        onDismissAlert={() => setShowBatteryAlertBanner(false)}
        onSnoozeAlert={() => {
          setShowBatteryAlertBanner(false);
          const snoozeDays = batteryAlertSettings.snoozeDays || 1;
          const nextMs = calculateBatterySnoozeTimestamp(snoozeDays, Date.now());
          setBatteryAlertSettings((prev) => ({
            ...prev,
            nextAlertTimestamp: nextMs,
          }));
          showToast(
            `Alerta de baterias adiado por ${snoozeDays} ${snoozeDays === 1 ? 'dia' : 'dias'}. Próximo aviso: ${formatTimestampToDate(nextMs)}.`,
            'info',
            'Alerta Adiado'
          );
        }}
        onRecordInspection={() => {
          setShowBatteryAlertBanner(false);
          const now = Date.now();
          const nextMs = calculateNextBatteryAlertTimestamp(batteryAlertSettings, now);
          setBatteryAlertSettings((prev) => ({
            ...prev,
            lastAlertTimestamp: now,
            nextAlertTimestamp: nextMs,
          }));
          showToast(
            `Inspeção confirmada e alarme de baterias reconhecido! Próxima checagem: ${formatTimestampToDate(nextMs)}.`,
            'success',
            'Alarme Reconhecido'
          );
        }}
        onSaveSettings={(newSettings) => {
          const nextMs = calculateNextBatteryAlertTimestamp(newSettings, Date.now());
          const updated: BatteryAlertSettings = {
            ...newSettings,
            nextAlertTimestamp: nextMs,
          };
          setBatteryAlertSettings(updated);
          showToast(
            `Periodicidade salva (a cada ${formatBatteryPeriodLabel(newSettings.periodUnit, newSettings.periodValue)}). Próxima checagem: ${formatTimestampToDate(nextMs)}.`,
            'success',
            'Configurações Atualizadas'
          );
        }}
      />

      {/* Global Help Modal (Accessible from any screen without losing state) */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-[#041c14]/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-5xl bg-emerald-50 dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 rounded-3xl shadow-2xl p-4 sm:p-6 my-auto max-h-[90vh] overflow-y-auto">
            <HelpCenterView
              isModal
              onCloseModal={() => setShowHelpModal(false)}
              currentUser={currentUser}
              theme={theme}
              onNavigate={(view) => {
                setCurrentView(view);
                setShowHelpModal(false);
              }}
              onStartTour={() => {
                setCurrentView('virtual-tour');
                setShowHelpModal(false);
              }}
              onStartLiveTour={() => {
                setShowHelpModal(false);
                startLiveTour();
              }}
            />
          </div>
        </div>
      )}

      {/* Interactive Floating Live Tour Overlay */}
      <InteractiveTourOverlay
        isOpen={isLiveTourActive}
        onClose={() => setIsLiveTourActive(false)}
        theme={theme}
        currentUser={currentUser}
        currentStepIndex={liveTourStepIndex}
        setCurrentStepIndex={setLiveTourStepIndex}
        onNavigate={(view) => setCurrentView(view)}
        onOpenSimulator={() => {
          setIsLiveTourActive(false);
          setCurrentView('virtual-tour');
        }}
      />

      {/* GLOBAL SPRAY TECHNICAL REPORT MODAL */}
      <SprayReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        serviceOrders={orders}
        selectedOrderId={reportSelectedOrderId}
        theme={theme}
        currentUser={currentUser}
        clients={clients}
        plots={plots}
        drones={drones}
        pilots={pilots}
        assistants={assistants}
      />

      {/* GLOBAL DRONE BATTERY MANAGER MODAL */}
      <DroneBatteryManagerModal
        isOpen={isBatteryModalOpen}
        onClose={() => setIsBatteryModalOpen(false)}
        drones={drones}
        initialDroneId={selectedBatteryDroneId}
        batteries={batteries}
        setBatteries={setBatteries}
        currentUser={currentUser}
        theme={theme}
      />

      {/* GLOBAL EMPLOYEE ACCESS CONTROL MODAL */}
      {isAccessControlModalOpen && (
        <EmployeeAccessControlModal
          isOpen={isAccessControlModalOpen}
          onClose={() => setIsAccessControlModalOpen(false)}
          currentUser={currentUser}
          allUsers={allUsers}
          onSaveUserPermissions={(userId, allowedViews) => {
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, allowedViews } : u));
            if (currentUser.id === userId) {
              setCurrentUser(prev => ({ ...prev, allowedViews }));
            }
          }}
          registeredCompanies={getStoredRegisteredCompanies()}
          activeCompanyId={theme.tenantId}
        />
      )}

      {/* Global Toast and Notification Container */}
      <AgroSysToastContainer />
    </AppLayout>
  );
}
