/**
 * AgroSys - Persistent Branding Logo Service
 * Ensures the company configured logo is permanently preserved and protected
 * across company switches, theme alterations, and sessions.
 */

const CONFIGURED_LOGO_URL_KEY = 'agrosys_company_configured_logo_url';
const CONFIGURED_LOGO_ICON_KEY = 'agrosys_company_configured_logo_icon_id';

export function getStoredConfiguredLogoUrl(): string | undefined {
  try {
    const saved = localStorage.getItem(CONFIGURED_LOGO_URL_KEY);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn('Erro ao ler logo configurado do localStorage:', e);
  }
  return undefined;
}

export function setStoredConfiguredLogoUrl(url?: string | null): void {
  try {
    if (url && url.trim().length > 0) {
      localStorage.setItem(CONFIGURED_LOGO_URL_KEY, url);
    } else if (url === null) {
      localStorage.removeItem(CONFIGURED_LOGO_URL_KEY);
    }
  } catch (e) {
    console.warn('Erro ao salvar logo configurado no localStorage:', e);
  }
}

export function getStoredConfiguredLogoIconId(): string | undefined {
  try {
    const saved = localStorage.getItem(CONFIGURED_LOGO_ICON_KEY);
    if (saved && saved.trim().length > 0) {
      return saved;
    }
  } catch (e) {
    console.warn('Erro ao ler logo icon id do localStorage:', e);
  }
  return undefined;
}

export function setStoredConfiguredLogoIconId(iconId?: string | null): void {
  try {
    if (iconId && iconId.trim().length > 0) {
      localStorage.setItem(CONFIGURED_LOGO_ICON_KEY, iconId);
    } else if (iconId === null) {
      localStorage.removeItem(CONFIGURED_LOGO_ICON_KEY);
    }
  } catch (e) {
    console.warn('Erro ao salvar logo icon id no localStorage:', e);
  }
}
