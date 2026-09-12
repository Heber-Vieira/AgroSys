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
import { HelpCircle, ArrowLeft, ArrowRight } from 'lucide-react';

import { 
  ThemeMode, 
  WhiteLabelTheme, 
  UserProfile, 
  ServiceOrder, 
  FarmPlot,
  AgriculturalDrone,
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
  USER_PROFILES, 
  INITIAL_PLOTS, 
  INITIAL_DRONES, 
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
import { playBatteryAlertSound } from './utils/batteryAudioAlert';
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
    const saved = localStorage.getItem('agrodrone_white_label_theme');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.primaryColor) {
          const matchedPreset = PRESET_COMPANIES.find(p => p.id === parsed.tenantId) || PRESET_COMPANIES[0];
          return {
            ...parsed,
            tenantId: parsed.tenantId || matchedPreset.id,
            companyName: parsed.companyName || matchedPreset.name,
            primaryColor: parsed.primaryColor || matchedPreset.primary,
            secondaryColor: parsed.secondaryColor || matchedPreset.secondary,
            accentColor: parsed.accentColor || matchedPreset.accent,
          };
        }
      } catch (err) {
        console.error('Falha ao restaurar tema do localStorage:', err);
      }
    }
    const defaultPreset = PRESET_COMPANIES[0]; // Ciclodrone
    return {
      tenantId: defaultPreset.id,
      companyName: defaultPreset.name,
      tagline: defaultPreset.tagline,
      primaryColor: defaultPreset.primary || '#0284c7',
      secondaryColor: defaultPreset.secondary || '#0f766e',
      accentColor: defaultPreset.accent || '#f59e0b',
      surfaceLight: '#FFFFFF',
      surfaceDark: '#081320',
      borderRadius: '0.875rem',
      fontFamily: 'Plus Jakarta Sans',
      contactPhone: defaultPreset.contactPhone || '(16) 99781-4400',
      contactEmail: defaultPreset.contactEmail || 'operacoes@ciclodrone.com.br',
      registryCreaMapa: defaultPreset.registryCreaMapa || 'MAPA/SDA nº 24.890/2026 • ART CREA-SP 2026-1044',
      brandStyle: 'modern',
      density: 'comfortable',
    };
  });

  // Active Company / Tenant ID
  const activeTenantId = theme.tenantId || 'ciclodrone';

  // Master Application State collections (Persisted to LocalStorage)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const loaded = loadAndMergeWithMock('agrodrone_users_fleet', USER_PROFILES);
    const allowedEmails = new Set(['heber.vieira.hv@gmail.com', 'thalesfelipe1@hotmail.com']);
    const filtered = loaded.filter(u => allowedEmails.has(u.email.toLowerCase()) || (u.id && u.id.startsWith('user-1')));
    return filtered.length > 0 ? filtered : USER_PROFILES;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('agrodrone_current_user');
    if (savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        if (parsed && (parsed.email === 'heber.vieira.hv@gmail.com' || parsed.email === 'thalesfelipe1@hotmail.com')) {
          return parsed;
        }
      } catch (e) {}
    }
    return USER_PROFILES[0];
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

  // Automatically update currentUser when company is switched if user belongs to a different company
  useEffect(() => {
    if (currentUser.companyId && currentUser.companyId !== activeTenantId && currentUser.role !== 'ADMIN') {
      const companyUser = allUsers.find(u => u.companyId === activeTenantId && u.role === 'ADMIN') 
        || allUsers.find(u => u.companyId === activeTenantId) 
        || allUsers[0];
      if (companyUser) {
        setCurrentUser(companyUser);
      }
    }
  }, [activeTenantId, allUsers]);

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
  // MULTI-TENANCY DATA ISOLATION: Scoped Data for Active Company
  // =========================================================================
  const orders = useMemo(() => 
    allOrders.filter(o => (o.companyId || 'ciclodrone') === activeTenantId), 
    [allOrders, activeTenantId]
  );

  const plots = useMemo(() => 
    allPlots.filter(p => (p.companyId || 'ciclodrone') === activeTenantId), 
    [allPlots, activeTenantId]
  );

  const drones = useMemo(() => 
    allDrones.filter(d => (d.companyId || 'ciclodrone') === activeTenantId), 
    [allDrones, activeTenantId]
  );

  const pilots = useMemo(() => 
    allPilots.filter(p => (p.companyId || 'ciclodrone') === activeTenantId), 
    [allPilots, activeTenantId]
  );

  const assistants = useMemo(() => 
    allAssistants.filter(a => (a.companyId || 'ciclodrone') === activeTenantId), 
    [allAssistants, activeTenantId]
  );

  const clients = useMemo(() => 
    allClients.filter(c => (c.companyId || 'ciclodrone') === activeTenantId), 
    [allClients, activeTenantId]
  );

  const quotations = useMemo(() => 
    allQuotations.filter(q => (q.companyId || 'ciclodrone') === activeTenantId), 
    [allQuotations, activeTenantId]
  );

  const financials = useMemo(() => 
    allFinancials.filter(f => (f.companyId || 'ciclodrone') === activeTenantId), 
    [allFinancials, activeTenantId]
  );

  const maintenanceLogs = useMemo(() => 
    allMaintenanceLogs.filter(m => (m.companyId || 'ciclodrone') === activeTenantId), 
    [allMaintenanceLogs, activeTenantId]
  );

  const pricingRules = useMemo(() => 
    allPricingRules.filter(r => (r.companyId || 'ciclodrone') === activeTenantId), 
    [allPricingRules, activeTenantId]
  );

  const users = useMemo(() => 
    allUsers.filter(u => u.role === 'ADMIN' || (u.companyId || 'ciclodrone') === activeTenantId), 
    [allUsers, activeTenantId]
  );

  // =========================================================================
  // MULTI-TENANCY SCOPED SETTERS: Modifies active company's data and preserves others
  // =========================================================================
  const setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>> = (action) => {
    setAllOrders(prevAll => {
      const currentScoped = prevAll.filter(o => (o.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: ServiceOrder) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(o => (o.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setPlots: React.Dispatch<React.SetStateAction<FarmPlot[]>> = (action) => {
    setAllPlots(prevAll => {
      const currentScoped = prevAll.filter(p => (p.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: FarmPlot) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(p => (p.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setDrones: React.Dispatch<React.SetStateAction<AgriculturalDrone[]>> = (action) => {
    setAllDrones(prevAll => {
      const currentScoped = prevAll.filter(d => (d.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: AgriculturalDrone) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(d => (d.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setPilots: React.Dispatch<React.SetStateAction<CrewPilot[]>> = (action) => {
    setAllPilots(prevAll => {
      const currentScoped = prevAll.filter(p => (p.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: CrewPilot) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(p => (p.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setAssistants: React.Dispatch<React.SetStateAction<CrewAssistant[]>> = (action) => {
    setAllAssistants(prevAll => {
      const currentScoped = prevAll.filter(a => (a.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: CrewAssistant) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(a => (a.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setClients: React.Dispatch<React.SetStateAction<ClientProducer[]>> = (action) => {
    setAllClients(prevAll => {
      const currentScoped = prevAll.filter(c => (c.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: ClientProducer) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(c => (c.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setQuotations: React.Dispatch<React.SetStateAction<SprayQuotation[]>> = (action) => {
    setAllQuotations(prevAll => {
      const currentScoped = prevAll.filter(q => (q.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: SprayQuotation) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(q => (q.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setMaintenanceLogs: React.Dispatch<React.SetStateAction<DroneMaintenanceLog[]>> = (action) => {
    setAllMaintenanceLogs(prevAll => {
      const currentScoped = prevAll.filter(m => (m.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: DroneMaintenanceLog) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(m => (m.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setPricingRules: React.Dispatch<React.SetStateAction<PricingMatrixRule[]>> = (action) => {
    setAllPricingRules(prevAll => {
      const currentScoped = prevAll.filter(r => (r.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: PricingMatrixRule) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(r => (r.companyId || 'ciclodrone') !== activeTenantId);
      return [...otherCompanies, ...tagged];
    });
  };

  const setUsers: React.Dispatch<React.SetStateAction<UserProfile[]>> = (action) => {
    setAllUsers(prevAll => {
      const currentScoped = prevAll.filter(u => u.role === 'ADMIN' || (u.companyId || 'ciclodrone') === activeTenantId);
      const resolved = typeof action === 'function' ? (action as any)(currentScoped) : action;
      const tagged = resolved.map((item: UserProfile) => ({ ...item, companyId: item.companyId || activeTenantId }));
      const otherCompanies = prevAll.filter(u => u.role !== 'ADMIN' && (u.companyId || 'ciclodrone') !== activeTenantId);
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
          return parsed;
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
  useEffect(() => {
    if (!batteryAlertSettings.enabled) {
      setShowBatteryAlertBanner(false);
      return;
    }

    const checkIntervalMs = 10000; // Check every 10 seconds
    const timer = setInterval(() => {
      const now = Date.now();
      const nextTime = batteryAlertSettings.nextAlertTimestamp || now;

      // Trigger condition: Next time reached OR any drone in active fleet has battery health alert
      const hasUnhealthyBattery = drones.some(d => (d.batteryHealthPct && d.batteryHealthPct < (batteryAlertSettings.minHealthThresholdPct || 85)));
      if (now >= nextTime || hasUnhealthyBattery) {
        setShowBatteryAlertBanner(true);

        // Play audio alert if enabled
        if (batteryAlertSettings.soundEnabled) {
          playBatteryAlertSound(batteryAlertSettings.soundType, batteryAlertSettings.soundVolume);
        }

        // Schedule next alert based on configured Days / Months
        const unit = batteryAlertSettings.periodUnit || 'DAYS';
        const val = batteryAlertSettings.periodValue || (unit === 'MONTHS' ? 1 : 15);
        const periodMs = unit === 'MONTHS' ? val * 30 * 24 * 60 * 60 * 1000 : val * 24 * 60 * 60 * 1000;
        const nextMs = now + periodMs;

        setBatteryAlertSettings((prev) => ({
          ...prev,
          lastAlertTimestamp: now,
          nextAlertTimestamp: nextMs,
        }));
      }
    }, checkIntervalMs);

    return () => clearInterval(timer);
  }, [batteryAlertSettings, drones]);

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
        if (cloudBranding && (cloudBranding.companyName || cloudBranding.logoUrl)) {
          setTheme(prev => ({
            ...prev,
            ...cloudBranding,
          }));
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

    // Persist to local storage
    try {
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
      <LoginView
        theme={theme}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthenticated(true);
        }}
        availableUsers={allUsers}
        setUsers={setAllUsers}
      />
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
      onSelectUser={setCurrentUser}
      onUpdateUserPhoto={handleUpdateUserPhoto}
      onLogout={() => setIsAuthenticated(false)}
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

        {/* Administration & Governance Modules (Restricted to ADMIN) */}
        {currentView === 'admin-management' && (
          <AdminManagementHubView
            currentUser={currentUser}
            users={users}
            setUsers={setUsers}
            drones={drones}
            setDrones={setDrones}
            pilots={pilots}
            setPilots={setPilots}
            assistants={assistants}
            setAssistants={setAssistants}
            clients={clients}
            setClients={setClients}
            compensation={compensation}
            setCompensation={setCompensation}
            onSwitchToAdmin={() => {
              const adminUser = users.find(u => u.role === 'ADMIN') || USER_PROFILES[0];
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
          setBatteryAlertSettings((prev) => {
            const snoozeDays = prev.snoozeDays || 3;
            return {
              ...prev,
              nextAlertTimestamp: Date.now() + snoozeDays * 24 * 60 * 60 * 1000,
            };
          });
        }}
        onRecordInspection={() => {
          setShowBatteryAlertBanner(false);
          setBatteryAlertSettings((prev) => {
            const unit = prev.periodUnit || 'DAYS';
            const val = prev.periodValue || (unit === 'MONTHS' ? 1 : 15);
            const periodMs = unit === 'MONTHS' ? val * 30 * 24 * 60 * 60 * 1000 : val * 24 * 60 * 60 * 1000;
            return {
              ...prev,
              lastAlertTimestamp: Date.now(),
              nextAlertTimestamp: Date.now() + periodMs,
            };
          });
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
    </AppLayout>
  );
}
