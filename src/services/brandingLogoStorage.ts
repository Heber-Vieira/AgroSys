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

