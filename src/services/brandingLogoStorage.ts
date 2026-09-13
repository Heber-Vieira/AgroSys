/**
 * AgroSys - Persistent Branding Logo Service
 * Ensures logo configuration is strictly individualized per company / tenant ID.
 * Protects each company's custom logo image or vector logo across switches and sessions.
 * If a company has not configured a custom logo, the system adopts the default logo.
 */

import { RegisteredCompany, WhiteLabelTheme } from '../types';
import { PRESET_COMPANIES } from '../data/themeTokensData';
import { getStoredRegisteredCompanies } from './companyStorage';

export function getStoredConfiguredLogoUrl(companyId?: string): string | undefined {
  try {
    if (!companyId || companyId === 'ALL') return undefined;
    const key = `agrosys_company_logo_url_${companyId}`;
    const saved = localStorage.getItem(key);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn(`Erro ao ler logo configurado para ${companyId}:`, e);
  }
  return undefined;
}

import { saveToDurableStorage, setIDBItem, deleteIDBItem, STORES } from './dbStorageEngine';

export function setStoredConfiguredLogoUrl(companyId: string, url?: string | null): void {
  try {
    if (!companyId || companyId === 'ALL') return;
    const key = `agrosys_company_logo_url_${companyId}`;
    if (typeof url === 'string') {
      if (url.trim().length > 0) {
        saveToDurableStorage(key, url, STORES.SETTINGS);
        setIDBItem(STORES.BRANDINGS, { tenantId: companyId, logoUrl: url });
      } else {
        localStorage.removeItem(key);
        deleteIDBItem(STORES.SETTINGS, key);
      }
    } else if (url === null) {
      localStorage.removeItem(key);
      deleteIDBItem(STORES.SETTINGS, key);
    }
  } catch (e) {
    console.warn(`Erro ao salvar logo configurado para ${companyId}:`, e);
  }
}

export function getStoredConfiguredLogoDarkUrl(companyId?: string): string | undefined {
  try {
    if (!companyId || companyId === 'ALL') return undefined;
    const key = `agrosys_company_logo_dark_url_${companyId}`;
    const saved = localStorage.getItem(key);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn(`Erro ao ler logo escuro configurado para ${companyId}:`, e);
  }
  return undefined;
}

export function setStoredConfiguredLogoDarkUrl(companyId: string, url?: string | null): void {
  try {
    if (!companyId || companyId === 'ALL') return;
    const key = `agrosys_company_logo_dark_url_${companyId}`;
    if (typeof url === 'string') {
      if (url.trim().length > 0) {
        saveToDurableStorage(key, url, STORES.SETTINGS);
        setIDBItem(STORES.BRANDINGS, { tenantId: companyId, logoDarkUrl: url });
      } else {
        localStorage.removeItem(key);
        deleteIDBItem(STORES.SETTINGS, key);
      }
    } else if (url === null) {
      localStorage.removeItem(key);
      deleteIDBItem(STORES.SETTINGS, key);
    }
  } catch (e) {
    console.warn(`Erro ao salvar logo escuro configurado para ${companyId}:`, e);
  }
}

export function getStoredLogoAdaptiveMode(companyId?: string): 'auto' | 'glass' | 'halo' | 'invert' | 'raw' | undefined {
  try {
    if (!companyId || companyId === 'ALL') return undefined;
    const key = `agrosys_company_logo_adaptive_mode_${companyId}`;
    const saved = localStorage.getItem(key);
    if (saved && ['auto', 'glass', 'halo', 'invert', 'raw'].includes(saved)) {
      return saved as 'auto' | 'glass' | 'halo' | 'invert' | 'raw';
    }
  } catch (e) {
    console.warn(`Erro ao ler modo adaptativo de logo para ${companyId}:`, e);
  }
  return undefined;
}

export function setStoredLogoAdaptiveMode(companyId: string, mode?: string | null): void {
  try {
    if (!companyId || companyId === 'ALL') return;
    const key = `agrosys_company_logo_adaptive_mode_${companyId}`;
    if (typeof mode === 'string' && mode.trim().length > 0) {
      saveToDurableStorage(key, mode, STORES.SETTINGS);
      setIDBItem(STORES.BRANDINGS, { tenantId: companyId, logoAdaptiveMode: mode });
    } else {
      localStorage.removeItem(key);
      deleteIDBItem(STORES.SETTINGS, key);
    }
  } catch (e) {
    console.warn(`Erro ao salvar modo adaptativo de logo para ${companyId}:`, e);
  }
}

export function getStoredConfiguredLogoIconId(companyId?: string): string | undefined {
  try {
    if (!companyId || companyId === 'ALL') return undefined;
    const key = `agrosys_company_logo_icon_${companyId}`;
    const saved = localStorage.getItem(key);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn(`Erro ao ler logo icon id para ${companyId}:`, e);
  }
  return undefined;
}

export function setStoredConfiguredLogoIconId(companyId: string, iconId?: string | null): void {
  try {
    if (!companyId || companyId === 'ALL') return;
    const key = `agrosys_company_logo_icon_${companyId}`;
    if (typeof iconId === 'string') {
      if (iconId.trim().length > 0) {
        saveToDurableStorage(key, iconId, STORES.SETTINGS);
        setIDBItem(STORES.BRANDINGS, { tenantId: companyId, logoIconId: iconId });
      } else {
        localStorage.removeItem(key);
        deleteIDBItem(STORES.SETTINGS, key);
      }
    } else if (iconId === null) {
      localStorage.removeItem(key);
      deleteIDBItem(STORES.SETTINGS, key);
    }
  } catch (e) {
    console.warn(`Erro ao salvar logo icon id para ${companyId}:`, e);
  }
}

/**
 * Builds the complete, isolated WhiteLabelTheme for a given company.
 * Guarantees that if a company has not configured its own logo, logoUrl and logoIconId
 * are undefined so the system automatically falls back to the default AgroSys logo.
 */
export function getCompanyTheme(companyId: string = 'ciclodrone'): WhiteLabelTheme {
  const allCompanies = getStoredRegisteredCompanies();
  const registered = allCompanies.find(c => c.id === companyId);
  const preset = PRESET_COMPANIES.find(p => p.id === companyId) || PRESET_COMPANIES[0];

  const primaryColor = registered?.primaryColor || preset?.primary || '#0284c7';
  const secondaryColor = registered?.secondaryColor || preset?.secondary || '#0f766e';
  const accentColor = registered?.accentColor || preset?.accent || '#f59e0b';
  const companyName = registered?.name || preset?.name || 'AgroSys';
  const tagline = registered?.tagline || preset?.tagline || 'Pulverização Agrícola de Alta Precisão';
  const contactPhone = registered?.phone || preset?.contactPhone || '(16) 99781-4400';
  const contactEmail = registered?.email || preset?.contactEmail || 'contato@agrosys.agr.br';
  const registryCreaMapa = registered?.registryCreaMapa || preset?.registryCreaMapa || '';
  
  // Isolated logo retrieval strictly for this specific company across all storage layers
  const companyLogoUrl = getStoredConfiguredLogoUrl(companyId) || registered?.logoUrl;
  const companyLogoDarkUrl = getStoredConfiguredLogoDarkUrl(companyId) || registered?.logoDarkUrl;
  const companyLogoIconId = getStoredConfiguredLogoIconId(companyId) || registered?.logoIconId;
  const companyAdaptiveMode = getStoredLogoAdaptiveMode(companyId) || registered?.logoAdaptiveMode || 'auto';

  // Optional custom palette or customizations saved specifically for this company
  let customOverrides: Partial<WhiteLabelTheme> = {};
  try {
    const raw = localStorage.getItem(`agrosys_company_theme_${companyId}`);
    if (raw) {
      customOverrides = JSON.parse(raw);
    }
  } catch (e) {}

  const finalLogoUrl = companyLogoUrl || customOverrides.logoUrl;
  const finalLogoDarkUrl = companyLogoDarkUrl || customOverrides.logoDarkUrl;
  const finalLogoIconId = companyLogoIconId || customOverrides.logoIconId;
  const finalAdaptiveMode = customOverrides.logoAdaptiveMode || companyAdaptiveMode;

  return {
    tenantId: companyId,
    companyName: customOverrides.companyName || companyName,
    tagline: customOverrides.tagline || tagline,
    primaryColor: customOverrides.primaryColor || primaryColor,
    secondaryColor: customOverrides.secondaryColor || secondaryColor,
    accentColor: customOverrides.accentColor || accentColor,
    surfaceLight: customOverrides.surfaceLight || registered?.surfaceLight || preset?.surfaceLight || '#FFFFFF',
    surfaceDark: customOverrides.surfaceDark || registered?.surfaceDark || preset?.surfaceDark || '#081320',
    borderRadius: customOverrides.borderRadius || '0.875rem',
    fontFamily: customOverrides.fontFamily || 'Plus Jakarta Sans',
    contactPhone: customOverrides.contactPhone || contactPhone,
    contactEmail: customOverrides.contactEmail || contactEmail,
    registryCreaMapa: customOverrides.registryCreaMapa || registryCreaMapa,
    brandStyle: 'modern',
    density: 'comfortable',
    // Strictly individualized logo: undefined if not configured by the company admin
    logoUrl: finalLogoUrl,
    logoDarkUrl: finalLogoDarkUrl,
    logoIconId: finalLogoIconId,
    logoAdaptiveMode: finalAdaptiveMode,
  };
}

export const AGROSYS_SYSTEM_THEME_STORAGE_KEY = 'agrosys_system_master_branding';
export const AGROSYS_SYSTEM_LOGO_KEY = 'agrosys_system_master_logo_url';
export const AGROSYS_SYSTEM_LOGO_DARK_KEY = 'agrosys_system_master_logo_dark_url';
export const AGROSYS_SYSTEM_LOGO_ICON_KEY = 'agrosys_system_master_logo_icon';
export const AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY = 'agrosys_system_master_logo_adaptive_mode';
export const SYSTEM_LOGO_UPDATED_EVENT = 'agrosys_system_logo_updated';

export interface SystemLogoPreset {
  id: string;
  label: string;
  description: string;
  svgPath: string;
  viewBox?: string;
}

export const SYSTEM_LOGO_PRESETS: SystemLogoPreset[] = [
  {
    id: 'agro-leaf-drone',
    label: 'AgroSys Oficial (Hélice & Folha)',
    description: 'Ícone emblemático de tecnologia aeroagrícola',
    svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    viewBox: '0 0 24 24',
  },
  {
    id: 'ciclodrone-helix',
    label: 'Vórtice Aeroespacial',
    description: 'Vórtice aerodinâmico e hexágono de voo',
    svgPath: 'M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5.5 3.4v6.8L12 18.4l-5.5-3.4V8.2L12 4.8z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'precision-drone',
    label: 'Quadrotor Precision GPS',
    description: 'Quatro rotores e telemetria de precisão',
    svgPath: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'bio-sprout',
    label: 'BioSprout Sustentável',
    description: 'Cultivo sustentável e aplicação biológica',
    svgPath: 'M12 22v-9m0 0C12 7.5 7.5 3 2 3c0 5.5 4.5 10 10 10zm0 0c0-5.5 4.5-10 10-10 0 5.5-4.5 10-10 10z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'spray-droplet',
    label: 'Gota Alvo de Pulverização',
    description: 'Calibração e diâmetro de gota VMD',
    svgPath: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
    viewBox: '0 0 24 24',
  },
  {
    id: 'geo-shield',
    label: 'Escudo GIS & ANAC',
    description: 'Segurança operacional e limites geográficos',
    svgPath: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    viewBox: '0 0 24 24',
  },
];

export const DEFAULT_AGROSYS_SYSTEM_BRANDING: WhiteLabelTheme = {
  tenantId: 'system_agrosys',
  companyName: 'AGROSYS',
  tagline: 'Plataforma Inteligente de Gestão de Operações Aeroagrícolas & Telemetria',
  primaryColor: '#059669',
  secondaryColor: '#0f766e',
  accentColor: '#f59e0b',
  surfaceLight: '#FFFFFF',
  surfaceDark: '#081320',
  borderRadius: '0.875rem',
  fontFamily: 'Plus Jakarta Sans',
  contactPhone: '(16) 99781-4400',
  contactEmail: 'operacoes@agrosys.agr.br',
  registryCreaMapa: 'MAPA/SDA Registro Geral • AgroSys Platform',
  brandStyle: 'modern',
  density: 'comfortable',
  logoIconId: 'agro-leaf-drone',
  logoAdaptiveMode: 'auto',
};

/**
 * Retrieves the AgroSys Master System Branding & Logo for the Login Page.
 */
export function getStoredSystemBranding(): WhiteLabelTheme {
  try {
    const raw = localStorage.getItem(AGROSYS_SYSTEM_THEME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.companyName || parsed.primaryColor || parsed.logoUrl || parsed.logoIconId)) {
        return {
          ...DEFAULT_AGROSYS_SYSTEM_BRANDING,
          ...parsed,
          logoUrl: localStorage.getItem(AGROSYS_SYSTEM_LOGO_KEY) || parsed.logoUrl,
          logoDarkUrl: localStorage.getItem(AGROSYS_SYSTEM_LOGO_DARK_KEY) || parsed.logoDarkUrl,
          logoIconId: localStorage.getItem(AGROSYS_SYSTEM_LOGO_ICON_KEY) || parsed.logoIconId || 'agro-leaf-drone',
          logoAdaptiveMode: (localStorage.getItem(AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY) as any) || parsed.logoAdaptiveMode || 'auto',
        };
      }
    }
  } catch (e) {
    console.warn('Erro ao ler branding do sistema:', e);
  }

  const customLogoUrl = localStorage.getItem(AGROSYS_SYSTEM_LOGO_KEY) || undefined;
  const customLogoDarkUrl = localStorage.getItem(AGROSYS_SYSTEM_LOGO_DARK_KEY) || undefined;
  const customLogoIconId = localStorage.getItem(AGROSYS_SYSTEM_LOGO_ICON_KEY) || 'agro-leaf-drone';
  const customAdaptiveMode = (localStorage.getItem(AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY) as any) || 'auto';

  return {
    ...DEFAULT_AGROSYS_SYSTEM_BRANDING,
    logoUrl: customLogoUrl,
    logoDarkUrl: customLogoDarkUrl,
    logoIconId: customLogoIconId,
    logoAdaptiveMode: customAdaptiveMode,
  };
}

import { saveSystemBrandingToSupabase } from './supabase';

/**
 * Persists updated AgroSys Master System Logo & Branding in localStorage, IndexedDB, and Supabase Database.
 */
export async function saveStoredSystemBranding(branding: Partial<WhiteLabelTheme>): Promise<void> {
  try {
    const current = getStoredSystemBranding();
    const merged: WhiteLabelTheme = {
      ...current,
      ...branding,
      tenantId: 'system_agrosys',
    };

    // 1. Save to LocalStorage & Durable IndexedDB
    localStorage.setItem(AGROSYS_SYSTEM_THEME_STORAGE_KEY, JSON.stringify(merged));
    saveToDurableStorage(AGROSYS_SYSTEM_THEME_STORAGE_KEY, merged, STORES.SETTINGS);

    if (merged.logoUrl) {
      localStorage.setItem(AGROSYS_SYSTEM_LOGO_KEY, merged.logoUrl);
      saveToDurableStorage(AGROSYS_SYSTEM_LOGO_KEY, merged.logoUrl, STORES.SETTINGS);
    } else {
      localStorage.removeItem(AGROSYS_SYSTEM_LOGO_KEY);
      deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_LOGO_KEY);
    }

    if (merged.logoDarkUrl) {
      localStorage.setItem(AGROSYS_SYSTEM_LOGO_DARK_KEY, merged.logoDarkUrl);
      saveToDurableStorage(AGROSYS_SYSTEM_LOGO_DARK_KEY, merged.logoDarkUrl, STORES.SETTINGS);
    } else {
      localStorage.removeItem(AGROSYS_SYSTEM_LOGO_DARK_KEY);
      deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_LOGO_DARK_KEY);
    }

    if (merged.logoIconId) {
      localStorage.setItem(AGROSYS_SYSTEM_LOGO_ICON_KEY, merged.logoIconId);
      saveToDurableStorage(AGROSYS_SYSTEM_LOGO_ICON_KEY, merged.logoIconId, STORES.SETTINGS);
    }

    if (merged.logoAdaptiveMode) {
      localStorage.setItem(AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY, merged.logoAdaptiveMode);
      saveToDurableStorage(AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY, merged.logoAdaptiveMode, STORES.SETTINGS);
    }

    setIDBItem(STORES.BRANDINGS, { tenantId: 'system_agrosys', ...merged });

    // 2. Dispatch update event across browser tabs / views
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYSTEM_LOGO_UPDATED_EVENT, { detail: merged }));
    }

    // 3. Persist to Supabase Cloud Database
    await saveSystemBrandingToSupabase(merged);
  } catch (err) {
    console.error('Erro ao salvar branding do sistema AgroSys:', err);
  }
}

/**
 * Resets AgroSys Master System Logo & Branding back to official clean default.
 */
export async function resetStoredSystemBranding(): Promise<void> {
  try {
    localStorage.removeItem(AGROSYS_SYSTEM_THEME_STORAGE_KEY);
    localStorage.removeItem(AGROSYS_SYSTEM_LOGO_KEY);
    localStorage.removeItem(AGROSYS_SYSTEM_LOGO_DARK_KEY);
    localStorage.removeItem(AGROSYS_SYSTEM_LOGO_ICON_KEY);
    localStorage.removeItem(AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY);

    deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_THEME_STORAGE_KEY);
    deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_LOGO_KEY);
    deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_LOGO_DARK_KEY);
    deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_LOGO_ICON_KEY);
    deleteIDBItem(STORES.SETTINGS, AGROSYS_SYSTEM_ADAPTIVE_MODE_KEY);

    deleteIDBItem(STORES.BRANDINGS, 'system_agrosys');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYSTEM_LOGO_UPDATED_EVENT, { detail: DEFAULT_AGROSYS_SYSTEM_BRANDING }));
    }

    await saveSystemBrandingToSupabase(DEFAULT_AGROSYS_SYSTEM_BRANDING);
  } catch (err) {
    console.error('Erro ao resetar branding do sistema AgroSys:', err);
  }
}

