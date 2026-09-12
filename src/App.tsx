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
import { DraggableHelpButton } from './components/DraggableHelpButton';
import { AgroSysToastContainer } from './components/common/AgroSysToastContainer';
import { HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';

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
import { isMasterUser, normalizeUserProfile } from './utils/userPermissions';
import { 
  getStoredConfiguredLogoUrl, 
  setStoredConfiguredLogoUrl, 
  getStoredConfiguredLogoIconId, 
  setStoredConfiguredLogoIconId,
  getCompanyTheme 
} from './services/brandingLogoStorage';
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
import { loadTenantBrandingFromSupabase, loadUserPhotosFromSupabase } from './services/supabase';
import { USER_PHOTO_STORAGE_KEY } from './components/UserAvatar';

// Helper to merge stored arrays with initial mock data so all companies have default records
function loadAndMergeWithMock<T extends { id: string; companyId?: string }>(
  storageKey: string,
  initialArray: T[]
): T[] {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed: T[] = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Find items in initialArray that are not in parsed by id
        const existingIds = new Set(parsed.map(item => item.id));
        const missingInitial = initialArray.filter(item => !existingIds.has(item.id));
        return [...parsed, ...missingInitial];
      }
    }
  } catch (e) {
    console.warn(`Erro ao carregar ${storageKey} do localStorage:`, e);
  }
  return initialArray;
}

export default function App() {
  // Navigation View - Defaults to the Home Hub Cards Page
  const [currentView, setCurrentView] = useState<AppViewMode>('hub');

  // Theme & White Label with LocalStorage persistence
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('agrodrone_theme_mode');
    if (saved === 'dark' || saved === 'field' || saved === 'light') return saved;
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
    return raw.map(normalizeUserProfile);
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

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_users_fleet', JSON.stringify(allUsers));
    } catch (e) {
      console.warn('Falha ao salvar usuários no localStorage:', e);
    }
  }, [allUsers]);

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

  const [allPilots, setAllPilots] = useState<CrewPilot[]>(() => 
    loadAndMergeWithMock('agrodrone_pilots_fleet', INITIAL_PILOTS)
  );
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_pilots_fleet', JSON.stringify(allPilots));
    } catch (e) {}
  }, [allPilots]);

  const [allAssistants, setAllAssistants] = useState<CrewAssistant[]>(() => 
    loadAndMergeWithMock('agrodrone_assistants_fleet', INITIAL_ASSISTANTS)
  );
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

  const pilots = useMemo(() => 
    isGlobalView ? allPilots : allPilots.filter(p => (p.companyId || 'ciclodrone') === activeTenantId), 
    [allPilots, activeTenantId, isGlobalView]
  );

  const assistants = useMemo(() => 
    isGlobalView ? allAssistants : allAssistants.filter(a => (a.companyId || 'ciclodrone') === activeTenantId), 
    [allAssistants, activeTenantId, isGlobalView]
  );

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
      if (activeTenantId === 'ALL') {
        return typeof action === 'function' ? (action as any)(prevAll) : action;
      }
      const currentScoped = prevAll.filter(u => u.role === 'ADMIN' || u.role === 'MASTER' || u.isMaster || (u.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: UserProfile) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(u => u.role !== 'ADMIN' && u.role !== 'MASTER' && !u.isMaster && (u.companyId || 'ciclodrone') !== activeTenantId);
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

  // Sync battery alert settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_battery_alert_config', JSON.stringify(batteryAlertSettings));
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
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, photoUrl, avatarUrl: photoUrl } : u));
    if (currentUser.id === userId) {
      setCurrentUser(prev => ({ ...prev, photoUrl, avatarUrl: photoUrl }));
    }
    setAllPilots(prev => prev.map(p => (p.id === userId || p.cpf === currentUser.documentNumber) ? { ...p, photoUrl, avatarUrl: photoUrl } : p));
    setAllAssistants(prev => prev.map(a => (a.id === userId || a.cpf === currentUser.documentNumber) ? { ...a, photoUrl, avatarUrl: photoUrl } : a));
  };

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

  // Hydrate tenant branding, custom logo & user photos from Supabase database on initial mount
  useEffect(() => {
    async function restoreCloudState() {
      try {
        const cloudBranding = await loadTenantBrandingFromSupabase();
        if (cloudBranding && (cloudBranding.companyName || cloudBranding.logoUrl || cloudBranding.logoIconId)) {
          const tId = cloudBranding.tenantId || 'ciclodrone';
          if (cloudBranding.logoUrl) {
            setStoredConfiguredLogoUrl(tId, cloudBranding.logoUrl);
          }
          if (cloudBranding.logoIconId) {
            setStoredConfiguredLogoIconId(tId, cloudBranding.logoIconId);
          }
          setTheme(prev => {
            if (prev.tenantId === tId) {
              return {
                ...prev,
                ...cloudBranding,
                logoUrl: cloudBranding.logoUrl || getStoredConfiguredLogoUrl(tId),
                logoIconId: cloudBranding.logoIconId || getStoredConfiguredLogoIconId(tId),
              };
            }
            return prev;
          });
        }

        // Hydrate user profile photos from Supabase DB
        const cloudPhotos = await loadUserPhotosFromSupabase();
        if (cloudPhotos && Object.keys(cloudPhotos).length > 0) {
          try {
            const rawStored = localStorage.getItem(USER_PHOTO_STORAGE_KEY);
            const currentStored: Record<string, string> = rawStored ? JSON.parse(rawStored) : {};
            const merged = { ...currentStored, ...cloudPhotos };
            localStorage.setItem(USER_PHOTO_STORAGE_KEY, JSON.stringify(merged));
            
            // Broadcast photo update event to UI components
            Object.entries(cloudPhotos).forEach(([id, photoUrl]) => {
              window.dispatchEvent(new CustomEvent('agrodrone-user-photo-updated', {
                detail: { id, photoUrl }
              }));
            });

            // Sync with allUsers state if matching photo found
            setAllUsers(prev => prev.map(u => {
              const photo = cloudPhotos[u.id] || cloudPhotos[u.email];
              return photo ? { ...u, photoUrl: photo, avatarUrl: photo } : u;
            }));
          } catch (e) {}
        }
      } catch (err) {
        console.warn('Falha ao restaurar dados do Supabase:', err);
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
    } else if (themeMode === 'field') {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'field');
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
        } else {
          setStoredConfiguredLogoUrl(tId, null);
        }
        if (theme.logoIconId) {
          setStoredConfiguredLogoIconId(tId, theme.logoIconId);
        } else {
          setStoredConfiguredLogoIconId(tId, null);
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
          />
        )}

        {/* Operational Modules */}
        {currentView === 'dashboard' && (
          <DashboardView
            currentUser={currentUser}
            orders={orders}
            plots={plots}
            drones={drones}
            financials={financials}
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
            drones={drones}
            pilots={pilots}
            assistants={assistants}
            clients={clients}
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
            plots={plots}
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
            drones={drones}
            pilots={pilots}
            assistants={assistants}
            clients={clients}
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
            users={currentUser.role === 'MASTER' || currentUser.isMaster ? allUsers : users}
            setUsers={currentUser.role === 'MASTER' || currentUser.isMaster ? setAllUsers : setUsers}
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

      {/* Global Toast and Notification Container */}
      <AgroSysToastContainer />
    </AppLayout>
  );
}
