/**
 * AgroSys - Persistent Branding Logo Service
 * Ensures logo configuration is strictly individualized per company / tenant ID.
 * Protects each company's custom logo image or vector logo across switches and sessions.
 * If a company has not configured a custom logo, the system adopts the default logo.
 */

import { WhiteLabelTheme } from '../types';
import { PRESET_COMPANIES } from '../data/themeTokensData';

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

export function setStoredConfiguredLogoUrl(companyId: string, url?: string | null): void {
  try {
    if (!companyId || companyId === 'ALL') return;
    const key = `agrosys_company_logo_url_${companyId}`;
    if (url && url.trim().length > 0) {
      localStorage.setItem(key, url);
    } else {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn(`Erro ao salvar logo configurado para ${companyId}:`, e);
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
    if (iconId && iconId.trim().length > 0) {
      localStorage.setItem(key, iconId);
    } else {
      localStorage.removeItem(key);
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
  const preset = PRESET_COMPANIES.find(p => p.id === companyId) || PRESET_COMPANIES[0];
  
  // Isolated logo retrieval strictly for this specific company
  const companyLogoUrl = getStoredConfiguredLogoUrl(companyId);
  const companyLogoIconId = getStoredConfiguredLogoIconId(companyId);

  // Optional custom palette or customizations saved specifically for this company
  let customOverrides: Partial<WhiteLabelTheme> = {};
  try {
    const raw = localStorage.getItem(`agrosys_company_theme_${companyId}`);
    if (raw) {
      customOverrides = JSON.parse(raw);
    }
  } catch (e) {}

  return {
    tenantId: preset.id,
    companyName: customOverrides.companyName || preset.name,
    tagline: customOverrides.tagline || preset.tagline,
    primaryColor: customOverrides.primaryColor || preset.primary,
    secondaryColor: customOverrides.secondaryColor || preset.secondary,
    accentColor: customOverrides.accentColor || preset.accent,
    surfaceLight: customOverrides.surfaceLight || preset.surfaceLight || '#FFFFFF',
    surfaceDark: customOverrides.surfaceDark || preset.surfaceDark || '#081320',
    borderRadius: customOverrides.borderRadius || '0.875rem',
    fontFamily: customOverrides.fontFamily || 'Plus Jakarta Sans',
    contactPhone: customOverrides.contactPhone || preset.contactPhone || '(16) 99781-4400',
    contactEmail: customOverrides.contactEmail || preset.contactEmail || 'contato@agrosys.agr.br',
    registryCreaMapa: customOverrides.registryCreaMapa || preset.registryCreaMapa || '',
    brandStyle: 'modern',
    density: 'comfortable',
    // Strictly individualized logo: undefined if not configured by the company admin
    logoUrl: companyLogoUrl,
    logoIconId: companyLogoIconId,
  };
}

