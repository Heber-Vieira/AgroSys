/**
 * AgroSys - Dynamic Company Management Storage Service
 * Manages registered companies with persistent storage in localStorage.
 * Enables Master users to register, edit, and delete companies dynamically.
 */

import { RegisteredCompany, WhiteLabelTheme } from '../types';
import { INITIAL_REGISTERED_COMPANIES } from '../data/mockAppState';
import { PRESET_COMPANIES } from '../data/themeTokensData';
import { saveCompanyToSupabase, deleteCompanyFromSupabase } from './supabase';
import { 
  setStoredConfiguredLogoUrl, 
  setStoredConfiguredLogoDarkUrl,
  setStoredConfiguredLogoIconId,
  setStoredLogoAdaptiveMode 
} from './brandingLogoStorage';

export const REGISTERED_COMPANIES_STORAGE_KEY = 'agrosys_registered_companies';
export const COMPANIES_UPDATED_EVENT = 'agrosys_companies_updated';

// Helper to convert preset palette to RegisteredCompany
function convertPresetToRegisteredCompany(preset: typeof PRESET_COMPANIES[0]): RegisteredCompany {
  return {
    id: preset.id,
    name: preset.name,
    tradeName: preset.tradeName || preset.name,
    cnpj: preset.cnpj || '00.000.000/0001-00',
    stateRegistration: 'ISENTO',
    registryCreaMapa: preset.registryCreaMapa || 'MAPA/SDA Registro Ativo • ART CREA',
    phone: preset.contactPhone || '(16) 99781-4400',
    email: preset.contactEmail || 'contato@agrosys.agr.br',
    cityState: preset.cityState || 'Ribeirão Preto - SP',
    tagline: preset.tagline || 'Pulverização Agrícola de Alta Precisão',
    primaryColor: preset.primary,
    secondaryColor: preset.secondary,
    accentColor: preset.accent,
    surfaceLight: preset.surfaceLight || '#FFFFFF',
    surfaceDark: preset.surfaceDark || '#081320',
    cropFocus: preset.cropFocus || 'Soja, Milho, Cana-de-açúcar',
    description: preset.description || 'Empresa de aviação agrícola e pulverização por drones.',
    status: 'ACTIVE',
    createdAt: '2024-01-01',
  };
}

/**
 * Retrieve all registered companies from localStorage.
 * Seeds with INITIAL_REGISTERED_COMPANIES and PRESET_COMPANIES if no data is stored.
 */
export function getStoredRegisteredCompanies(): RegisteredCompany[] {
  try {
    const raw = localStorage.getItem(REGISTERED_COMPANIES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao ler empresas salvas do localStorage:', err);
  }

  // Build default initial list combining mock data and presets
  const companyMap = new Map<string, RegisteredCompany>();
  
  // 1. Add preset companies
  PRESET_COMPANIES.forEach(preset => {
    companyMap.set(preset.id, convertPresetToRegisteredCompany(preset));
  });

  // 2. Overlay initial registered companies
  INITIAL_REGISTERED_COMPANIES.forEach(comp => {
    companyMap.set(comp.id, {
      ...companyMap.get(comp.id),
      ...comp,
    });
  });

  const defaultList = Array.from(companyMap.values());
  saveStoredRegisteredCompanies(defaultList);
  return defaultList;
}

import { saveToDurableStorage, setIDBItem, STORES } from './dbStorageEngine';

/**
 * Persist registered companies to localStorage and notify listeners.
 */
export function saveStoredRegisteredCompanies(companies: RegisteredCompany[]): void {
  try {
    saveToDurableStorage(REGISTERED_COMPANIES_STORAGE_KEY, companies, STORES.SETTINGS);
    companies.forEach(comp => {
      if (comp && comp.id) {
        setIDBItem(STORES.COMPANIES, comp);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(COMPANIES_UPDATED_EVENT, { detail: companies }));
    }
  } catch (err) {
    console.error('Erro ao salvar empresas cadastradas:', err);
  }
}

/**
 * Helper to generate a slug ID from company name.
 */
export function generateCompanyId(name: string): string {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  const randomSuffix = Math.floor(100 + Math.random() * 900);
  return `${base || 'empresa'}-${randomSuffix}`;
}

/**
 * Add a new registered company.
 */
export function addRegisteredCompany(newCompany: Omit<RegisteredCompany, 'id'> & { id?: string }): RegisteredCompany {
  const companies = getStoredRegisteredCompanies();
  const id = newCompany.id && newCompany.id.trim().length > 0 
    ? newCompany.id.trim() 
    : generateCompanyId(newCompany.name);

  const fullCompany: RegisteredCompany = {
    ...newCompany,
    id,
    name: newCompany.name.trim(),
    tradeName: newCompany.tradeName?.trim() || newCompany.name.trim(),
    cnpj: newCompany.cnpj.trim(),
    registryCreaMapa: newCompany.registryCreaMapa?.trim() || 'MAPA/SDA nº Pendente • ART CREA',
    phone: newCompany.phone?.trim() || '',
    email: newCompany.email?.trim() || '',
    cityState: newCompany.cityState?.trim() || 'Brasil',
    tagline: newCompany.tagline?.trim() || 'Operações Aéreas e Pulverização de Precisão',
    primaryColor: newCompany.primaryColor || '#0284c7',
    secondaryColor: newCompany.secondaryColor || '#0f766e',
    accentColor: newCompany.accentColor || '#f59e0b',
    status: newCompany.status || 'ACTIVE',
    createdAt: newCompany.createdAt || new Date().toISOString().split('T')[0],
    logoUrl: newCompany.logoUrl,
    logoDarkUrl: newCompany.logoDarkUrl,
    logoIconId: newCompany.logoIconId,
    logoAdaptiveMode: newCompany.logoAdaptiveMode,
  };

  if (fullCompany.logoUrl) {
    setStoredConfiguredLogoUrl(id, fullCompany.logoUrl);
  }
  if (fullCompany.logoDarkUrl) {
    setStoredConfiguredLogoDarkUrl(id, fullCompany.logoDarkUrl);
  }
  if (fullCompany.logoIconId) {
    setStoredConfiguredLogoIconId(id, fullCompany.logoIconId);
  }
  if (fullCompany.logoAdaptiveMode) {
    setStoredLogoAdaptiveMode(id, fullCompany.logoAdaptiveMode);
  }

  // Add to top of list
  const updated = [fullCompany, ...companies.filter(c => c.id !== id)];
  saveStoredRegisteredCompanies(updated);
  saveCompanyToSupabase(fullCompany).catch(() => {});
  return fullCompany;
}

/**
 * Update an existing company.
 */
export function updateRegisteredCompany(company: RegisteredCompany): RegisteredCompany[] {
  const companies = getStoredRegisteredCompanies();
  const updated = companies.map(c => (c.id === company.id ? { ...c, ...company } : c));
  saveStoredRegisteredCompanies(updated);

  if (company.logoUrl !== undefined) {
    setStoredConfiguredLogoUrl(company.id, company.logoUrl);
  }
  if (company.logoDarkUrl !== undefined) {
    setStoredConfiguredLogoDarkUrl(company.id, company.logoDarkUrl);
  }
  if (company.logoIconId !== undefined) {
    setStoredConfiguredLogoIconId(company.id, company.logoIconId);
  }
  if (company.logoAdaptiveMode !== undefined) {
    setStoredLogoAdaptiveMode(company.id, company.logoAdaptiveMode);
  }

  saveCompanyToSupabase(company).catch(() => {});
  return updated;
}

/**
 * Delete a company by ID and clean up its stored preferences.
 */
export function deleteRegisteredCompany(companyId: string): { success: boolean; updatedList: RegisteredCompany[] } {
  const companies = getStoredRegisteredCompanies();
  if (companies.length <= 1) {
    return { success: false, updatedList: companies };
  }

  const updated = companies.filter(c => c.id !== companyId);
  saveStoredRegisteredCompanies(updated);
  deleteCompanyFromSupabase(companyId).catch(() => {});

  // Clean up any company-specific logos or theme overrides
  try {
    localStorage.removeItem(`agrosys_company_logo_url_${companyId}`);
    localStorage.removeItem(`agrosys_company_logo_dark_url_${companyId}`);
    localStorage.removeItem(`agrosys_company_logo_adaptive_mode_${companyId}`);
    localStorage.removeItem(`agrosys_company_logo_icon_${companyId}`);
    localStorage.removeItem(`agrosys_company_theme_${companyId}`);
  } catch (e) {
    console.warn('Erro ao limpar cache da empresa excluída:', e);
  }

  return { success: true, updatedList: updated };
}

/**
 * Retrieve a company by ID.
 */
export function getRegisteredCompanyById(id: string): RegisteredCompany | undefined {
  const companies = getStoredRegisteredCompanies();
  return companies.find(c => c.id === id);
}
