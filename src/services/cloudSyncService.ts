/**
 * AgroSys - Cloud Sync & Hydration Engine
 * Guarantees that all user customizations, brandings, custom logos (light/dark),
 * battery alarm periodicities, and weather panel configurations are permanently
 * persisted in the Supabase database and reliably restored even after total browser cache clears.
 */

import { BatteryAlertSettings, WeatherAlertSettings, WhiteLabelTheme, RegisteredCompany } from '../types';
import { 
  supabase, 
  saveAppDataToSupabase, 
  loadAppDataFromSupabase, 
  loadTenantBrandingFromSupabase,
  loadCompaniesFromSupabase,
  saveCompanyToSupabase,
  loadUserPhotosFromSupabase
} from './supabase';
import { 
  setStoredConfiguredLogoUrl, 
  setStoredConfiguredLogoDarkUrl, 
  setStoredConfiguredLogoIconId,
  setStoredLogoAdaptiveMode 
} from './brandingLogoStorage';
import { getStoredRegisteredCompanies, saveStoredRegisteredCompanies } from './companyStorage';
import { USER_PHOTO_STORAGE_KEY } from '../components/UserAvatar';

import { 
  restoreDurableStorageToLocalStorage, 
  saveToDurableStorage, 
  setIDBItem, 
  STORES 
} from './dbStorageEngine';

export const BATTERY_ALERT_STORAGE_KEY = 'agrodrone_battery_alert_config';
export const WEATHER_ALERT_STORAGE_KEY = 'agrodrone_weather_alert_config';

export const DEFAULT_WEATHER_ALERT_SETTINGS: WeatherAlertSettings = {
  periodicitySeconds: 900, // 15 minutos padrão
  isInhibited: false,
  soundEnabled: true,
  soundType: 'CHIME',
  soundVolume: 0.5,
  visualStrobeEnabled: true,
  screenEdgeAlertEnabled: true,
  readingAlertEnabled: true,
  recordingMode: 'manual',
};

/**
 * Persists Battery Alert Settings & Periodicities to both local storage, IndexedDB, and Supabase Cloud.
 */
export async function saveBatteryAlertSettingsToCloud(settings: BatteryAlertSettings): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Save to durable storage (localStorage + IndexedDB)
    await saveToDurableStorage(BATTERY_ALERT_STORAGE_KEY, settings, STORES.ALARMS);
    await setIDBItem(STORES.ALARMS, { key: BATTERY_ALERT_STORAGE_KEY, value: settings });

    // 2. Persist to Supabase app_settings cloud storage
    const cloudRes = await saveAppDataToSupabase('battery_alert_config', settings);
    return cloudRes;
  } catch (err: any) {
    console.warn('Erro ao salvar periodicidade de baterias na nuvem:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Loads Battery Alert Settings from Supabase or local durable storage fallback.
 */
export async function loadBatteryAlertSettingsFromCloud(): Promise<BatteryAlertSettings | null> {
  try {
    // 1. Fetch from cloud database first
    const cloudData = await loadAppDataFromSupabase<BatteryAlertSettings>('battery_alert_config');
    if (cloudData && typeof cloudData.periodValue === 'number') {
      await saveToDurableStorage(BATTERY_ALERT_STORAGE_KEY, cloudData, STORES.ALARMS);
      return cloudData;
    }

    // 2. Fallback to durable local storage
    const localRaw = localStorage.getItem(BATTERY_ALERT_STORAGE_KEY);
    if (localRaw) {
      return JSON.parse(localRaw) as BatteryAlertSettings;
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações de bateria da nuvem:', err);
  }
  return null;
}

/**
 * Persists Weather Alert Station Settings & Periodicities to local storage, IndexedDB, and Supabase Cloud.
 */
export async function saveWeatherAlertSettingsToCloud(settings: WeatherAlertSettings): Promise<{ success: boolean; error?: string }> {
  try {
    await saveToDurableStorage(WEATHER_ALERT_STORAGE_KEY, settings, STORES.ALARMS);
    await setIDBItem(STORES.ALARMS, { key: WEATHER_ALERT_STORAGE_KEY, value: settings });
    const cloudRes = await saveAppDataToSupabase('weather_alert_config', settings);
    return cloudRes;
  } catch (err: any) {
    console.warn('Erro ao salvar periodicidade meteorológica na nuvem:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Loads Weather Alert Station Settings from Supabase or local durable storage fallback.
 */
export async function loadWeatherAlertSettingsFromCloud(): Promise<WeatherAlertSettings> {
  try {
    const cloudData = await loadAppDataFromSupabase<WeatherAlertSettings>('weather_alert_config');
    if (cloudData && typeof cloudData.periodicitySeconds === 'number') {
      await saveToDurableStorage(WEATHER_ALERT_STORAGE_KEY, cloudData, STORES.ALARMS);
      return cloudData;
    }

    const localRaw = localStorage.getItem(WEATHER_ALERT_STORAGE_KEY);
    if (localRaw) {
      return { ...DEFAULT_WEATHER_ALERT_SETTINGS, ...JSON.parse(localRaw) };
    }
  } catch (err) {
    console.warn('Erro ao carregar configurações meteorológicas da nuvem:', err);
  }
  return DEFAULT_WEATHER_ALERT_SETTINGS;
}

/**
 * Retrieves all registered company brandings and custom logos saved in Supabase.
 */
export async function loadAllTenantBrandingsFromSupabase(): Promise<Record<string, WhiteLabelTheme>> {
  const brandings: Record<string, WhiteLabelTheme> = {};
  try {
    // 1. Fetch from app_settings with prefix 'agro_branding_'
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('key, value')
      .like('key', 'agro_branding_%');

    if (settingsData && Array.isArray(settingsData)) {
      settingsData.forEach(row => {
        try {
          const tId = row.key.replace('agro_branding_', '');
          const parsed = JSON.parse(row.value);
          if (parsed && (parsed.companyName || parsed.primaryColor || parsed.logoUrl)) {
            brandings[tId] = parsed;
          }
        } catch (e) {}
      });
    }

    // 2. Fetch from tenant_branding_configs table as complement
    const { data: configsData } = await supabase
      .from('tenant_branding_configs')
      .select('*');

    if (configsData && Array.isArray(configsData)) {
      configsData.forEach(c => {
        const tId = c.tenant_id;
        if (tId && !brandings[tId]) {
          brandings[tId] = {
            tenantId: tId,
            companyName: c.company_name || 'AgroSys',
            tagline: c.tagline || '',
            logoUrl: c.logo_light_url || undefined,
            logoDarkUrl: c.logo_dark_url || undefined,
            logoIconId: c.logo_icon_id || undefined,
            primaryColor: c.primary_color_hex || '#0284c7',
            secondaryColor: c.secondary_color_hex || '#0f766e',
            accentColor: c.accent_color_hex || '#f59e0b',
            fontFamily: c.font_family || 'Plus Jakarta Sans',
            borderRadius: c.border_radius_base || '0.875rem',
            surfaceLight: '#FFFFFF',
            surfaceDark: '#0f172a',
            contactPhone: c.contact_phone || undefined,
            contactEmail: c.contact_email || undefined,
            registryCreaMapa: c.registry_crea_mapa || undefined,
          };
        }
      });
    }
  } catch (err) {
    console.warn('Erro ao carregar marcas de empresas da nuvem:', err);
  }
  return brandings;
}

export interface CloudHydrationResult {
  brandings: Record<string, WhiteLabelTheme>;
  companies: RegisteredCompany[];
  batteryAlertSettings: BatteryAlertSettings | null;
  weatherAlertSettings: WeatherAlertSettings;
  userPhotos: Record<string, string>;
}

/**
 * Centralized Global Boot Hydration Routine.
 * Executed on application start to guarantee that all user configurations, logos,
 * and alarm periodicities are restored from IndexedDB / Supabase even if browser cache is 100% empty.
 */
export async function hydrateAllCloudData(): Promise<CloudHydrationResult> {
  // STEP 1: Self-healing restore from durable IndexedDB back into localStorage if cache was cleared
  try {
    await restoreDurableStorageToLocalStorage();
  } catch (e) {
    console.warn('Falha no auto-restauro do IndexedDB:', e);
  }

  const result: CloudHydrationResult = {
    brandings: {},
    companies: getStoredRegisteredCompanies(),
    batteryAlertSettings: (() => {
      try {
        const raw = localStorage.getItem(BATTERY_ALERT_STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch (e) { return null; }
    })(),
    weatherAlertSettings: (() => {
      try {
        const raw = localStorage.getItem(WEATHER_ALERT_STORAGE_KEY);
        return raw ? { ...DEFAULT_WEATHER_ALERT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_WEATHER_ALERT_SETTINGS;
      } catch (e) { return DEFAULT_WEATHER_ALERT_SETTINGS; }
    })(),
    userPhotos: {},
  };

  try {
    // STEP 2: Fetch Cloud Database Ground Truth
    const [
      cloudBrandings,
      cloudCompanies,
      cloudBatterySettings,
      cloudWeatherSettings,
      cloudPhotos,
    ] = await Promise.all([
      loadAllTenantBrandingsFromSupabase(),
      loadCompaniesFromSupabase(),
      loadBatteryAlertSettingsFromCloud(),
      loadWeatherAlertSettingsFromCloud(),
      loadUserPhotosFromSupabase(),
    ]);

    // 1. Hydrate Brandings & Logos from cloud if available
    if (cloudBrandings && Object.keys(cloudBrandings).length > 0) {
      result.brandings = cloudBrandings;
      Object.entries(cloudBrandings).forEach(([tenantId, theme]) => {
        if (theme.logoUrl) {
          setStoredConfiguredLogoUrl(tenantId, theme.logoUrl);
        }
        if (theme.logoDarkUrl) {
          setStoredConfiguredLogoDarkUrl(tenantId, theme.logoDarkUrl);
        }
        if (theme.logoIconId) {
          setStoredConfiguredLogoIconId(tenantId, theme.logoIconId);
        }
        if (theme.logoAdaptiveMode) {
          setStoredLogoAdaptiveMode(tenantId, theme.logoAdaptiveMode);
        }
        try {
          saveToDurableStorage(`agrosys_company_theme_${tenantId}`, theme, STORES.SETTINGS);
        } catch (e) {}
      });
    }

    // 2. Hydrate Registered Companies
    if (cloudCompanies && cloudCompanies.length > 0) {
      const currentLocal = getStoredRegisteredCompanies();
      const companyMap = new Map<string, RegisteredCompany>();
      
      // Seed with local/preset first
      currentLocal.forEach(c => companyMap.set(c.id, c));
      
      // Override/merge with cloud ground truth
      cloudCompanies.forEach(c => {
        if (c.id) {
          const merged: RegisteredCompany = {
            ...(companyMap.get(c.id) || ({} as RegisteredCompany)),
            ...c,
          };
          companyMap.set(c.id, merged);
          
          if (c.logoUrl) setStoredConfiguredLogoUrl(c.id, c.logoUrl);
          if (c.logoDarkUrl) setStoredConfiguredLogoDarkUrl(c.id, c.logoDarkUrl);
          if (c.logoIconId) setStoredConfiguredLogoIconId(c.id, c.logoIconId);
          if (c.logoAdaptiveMode) setStoredLogoAdaptiveMode(c.id, c.logoAdaptiveMode);
        }
      });

      const fullList = Array.from(companyMap.values());
      saveStoredRegisteredCompanies(fullList);
      result.companies = fullList;
    }

    // 3. Hydrate Battery Alert Settings & Periodicities
    if (cloudBatterySettings) {
      result.batteryAlertSettings = cloudBatterySettings;
      await saveToDurableStorage(BATTERY_ALERT_STORAGE_KEY, cloudBatterySettings, STORES.ALARMS);
    }

    // 4. Hydrate Weather Alert Station Settings & Periodicities
    if (cloudWeatherSettings) {
      result.weatherAlertSettings = cloudWeatherSettings;
      await saveToDurableStorage(WEATHER_ALERT_STORAGE_KEY, cloudWeatherSettings, STORES.ALARMS);
    }

    // 5. Hydrate User Photos
    if (cloudPhotos && Object.keys(cloudPhotos).length > 0) {
      result.userPhotos = cloudPhotos;
      try {
        const rawStored = localStorage.getItem(USER_PHOTO_STORAGE_KEY);
        const currentStored = rawStored ? JSON.parse(rawStored) : {};
        const mergedPhotos = { ...currentStored, ...cloudPhotos };
        await saveToDurableStorage(USER_PHOTO_STORAGE_KEY, mergedPhotos, STORES.SETTINGS);
      } catch (e) {}
    }
  } catch (err) {
    console.warn('Aviso durante hidratação da nuvem:', err);
  }

  return result;
}
