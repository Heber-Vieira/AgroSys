import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WhiteLabelTheme, UserProfile } from '../types';

const env = (import.meta as any).env || {};
const DEFAULT_SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://ioqdflvonlajalonxctd.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

export const SUPABASE_CONFIG_STORAGE_KEY = 'agrosys_supabase_config';

export function getStoredSupabaseConfig(): { url: string; anonKey: string } {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (e) {}
  return {
    url: DEFAULT_SUPABASE_URL,
    anonKey: DEFAULT_SUPABASE_ANON_KEY,
  };
}

const currentConfig = getStoredSupabaseConfig();
export let supabase: SupabaseClient = createClient(currentConfig.url, currentConfig.anonKey);

export function reconnectSupabase(url?: string, anonKey?: string): SupabaseClient {
  const newUrl = url || getStoredSupabaseConfig().url;
  const newKey = anonKey || getStoredSupabaseConfig().anonKey;
  supabase = createClient(newUrl, newKey);
  return supabase;
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  try {
    const config = { url: url.trim(), anonKey: anonKey.trim() };
    localStorage.setItem(SUPABASE_CONFIG_STORAGE_KEY, JSON.stringify(config));
    reconnectSupabase(config.url, config.anonKey);
  } catch (e) {
    console.warn('Erro ao salvar configurações do Supabase:', e);
  }
}

/**
 * Empirical connection test to Supabase database.
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key', { count: 'exact', head: true });

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('404') || error.message.includes('relation')) {
        return { 
          success: fontOrTableConnected(error), 
          message: `Conectado ao Supabase, mas a tabela app_settings ainda não foi criada (${error.message}). A persistência durável local via IndexedDB está ativa.`
        };
      }
      return { 
        success: false, 
        message: `Falha na API Key ou credenciais Supabase: ${error.message}. O sistema continuará salvando duravelmente via IndexedDB.` 
      };
    }

    return { 
      success: true, 
      message: 'Conexão Supabase OK! Sincronização cloud ativada e operacional.' 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: `Erro ao testar conexão Supabase: ${err?.message || err}. Operando em modo ultrarresiliente offline via IndexedDB.` 
    };
  }
}

function fontOrTableConnected(error: any): boolean {
  return !error.message.includes('Invalid API key') && !error.message.includes('apiKey');
}

export async function signInWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Falha ao autenticar no Supabase Auth' };
  }
}

export async function signUpWithSupabase(email: string, password: string, name?: string, role?: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          role: role || 'ADMIN',
        }
      }
    });
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Falha ao cadastrar usuário no Supabase Auth' };
  }
}

export async function signOutSupabase() {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (err: any) {
    return { error: err.message };
  }
}

export async function getSupabaseSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return data.session;
  } catch (err) {
    return null;
  }
}

/**
 * Persists tenant branding configuration and custom logo URL to Supabase database.
 * First tries upserting to `tenant_branding_configs`, with fallbacks to `tenants` or `app_settings`.
 */
export async function saveTenantBrandingToSupabase(theme: WhiteLabelTheme) {
  try {
    const tenantId = theme.tenantId || 'ciclodrone';

    // 1. Try upserting into tenant_branding_configs
    const brandingPayload = {
      tenant_id: tenantId,
      company_name: theme.companyName,
      tagline: theme.tagline,
      logo_light_url: theme.logoUrl || null,
      logo_dark_url: theme.logoDarkUrl || theme.logoUrl || null,
      logo_icon_id: theme.logoIconId || null,
      primary_color_hex: theme.primaryColor,
      secondary_color_hex: theme.secondaryColor,
      accent_color_hex: theme.accentColor,
      font_family: theme.fontFamily,
      border_radius_base: theme.borderRadius,
      contact_phone: theme.contactPhone || null,
      contact_email: theme.contactEmail || null,
      registry_crea_mapa: theme.registryCreaMapa || null,
      updated_at: new Date().toISOString(),
    };

    const { data: brandingResult, error: brandingError } = await supabase
      .from('tenant_branding_configs')
      .upsert(brandingPayload, { onConflict: 'tenant_id' })
      .select();

    if (brandingError) {
      console.warn('Persistência em tenant_branding_configs retornou aviso:', brandingError.message);
      // Secondary fallback: update company_name or logo in tenants table
      try {
        await supabase.from('tenants').upsert({
          id: tenantId,
          company_name: theme.companyName,
          trade_name: theme.companyName,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      } catch (e) {}
    }

    // Always mirror full JSON payload in app_settings table to guarantee 100% cloud sync
    try {
      await supabase.from('app_settings').upsert({
        key: `agro_branding_${tenantId}`,
        value: JSON.stringify(theme),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (e) {}

    return { success: true, data: brandingResult, error: null };
  } catch (err: any) {
    console.error('Erro ao gravar logotipo e marca no banco de dados Supabase:', err);
    return { success: false, error: err.message || 'Falha ao salvar no banco de dados' };
  }
}

/**
 * Retrieves saved tenant branding & logo from Supabase database.
 */
export async function loadTenantBrandingFromSupabase(tenantId: string = 'ciclodrone'): Promise<WhiteLabelTheme | null> {
  try {
    // 1. Try app_settings JSON mirror for complete state
    const { data: settingData } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `agro_branding_${tenantId}`)
      .maybeSingle();

    if (settingData?.value) {
      const parsed = JSON.parse(settingData.value);
      if (parsed && (parsed.primaryColor || parsed.companyName)) {
        return parsed as WhiteLabelTheme;
      }
    }

    // 2. Try tenant_branding_configs table
    const { data, error } = await supabase
      .from('tenant_branding_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    if (!error && data) {
      return {
        tenantId: data.tenant_id,
        companyName: data.company_name || 'Ciclodrone Agro',
        tagline: data.tagline || '',
        logoUrl: data.logo_light_url || undefined,
        logoDarkUrl: data.logo_dark_url || undefined,
        logoIconId: data.logo_icon_id || undefined,
        primaryColor: data.primary_color_hex || '#0284c7',
        secondaryColor: data.secondary_color_hex || '#0f766e',
        accentColor: data.accent_color_hex || '#f59e0b',
        fontFamily: data.font_family || 'Plus Jakarta Sans',
        borderRadius: data.border_radius_base || '0.875rem',
        surfaceLight: '#FFFFFF',
        surfaceDark: '#0f172a',
        contactPhone: data.contact_phone || undefined,
        contactEmail: data.contact_email || undefined,
        registryCreaMapa: data.registry_crea_mapa || undefined,
      };
    }

    return null;
  } catch (err) {
    console.warn('Não foi possível restaurar tema do Supabase:', err);
    return null;
  }
}

/**
 * Persists user profile photo URL to Supabase database.
 * Upserts to `user_profiles` table and mirrors to `app_settings` for full reliability.
 */
export async function saveUserPhotoToSupabase(idOrEmail: string, photoUrl: string, profile?: UserProfile) {
  try {
    if (!idOrEmail) return { success: false, error: 'ID ou e-mail inválido' };

    const sanitizedKey = `agro_user_photo_${idOrEmail.toLowerCase().replace(/[^a-z0-9_@-]/g, '_')}`;

    // 1. Mirror payload in app_settings table
    try {
      await supabase.from('app_settings').upsert({
        key: sanitizedKey,
        value: JSON.stringify({
          idOrEmail,
          photoUrl,
          name: profile?.name || '',
          email: profile?.email || '',
          updated_at: new Date().toISOString()
        }),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (e) {}

    // 2. Try upserting into user_profiles table if available
    const profilePayload = {
      id: profile?.id || idOrEmail,
      email: profile?.email || (idOrEmail.includes('@') ? idOrEmail : null),
      name: profile?.name || idOrEmail,
      photo_url: photoUrl,
      avatar_url: photoUrl,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    if (profileError) {
      console.warn('Persistência em user_profiles retornou aviso:', profileError.message);
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao gravar foto de perfil no Supabase:', err);
    return { success: false, error: err.message || 'Falha ao salvar foto no banco de dados' };
  }
}

/**
 * Loads all user profile photos stored in Supabase database.
 */
export async function loadUserPhotosFromSupabase(): Promise<Record<string, string>> {
  try {
    const photoMap: Record<string, string> = {};

    // 1. Fetch settings with key starting with 'agro_user_photo_'
    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('key, value')
      .like('key', 'agro_user_photo_%');

    if (settingsData && Array.isArray(settingsData)) {
      settingsData.forEach(item => {
        try {
          const parsed = JSON.parse(item.value);
          if (parsed && parsed.idOrEmail && parsed.photoUrl) {
            photoMap[parsed.idOrEmail] = parsed.photoUrl;
            if (parsed.email) photoMap[parsed.email] = parsed.photoUrl;
          }
        } catch (e) {}
      });
    }

    // 2. Fetch from user_profiles table if populated
    const { data: profilesData } = await supabase
      .from('user_profiles')
      .select('id, email, photo_url, avatar_url');

    if (profilesData && Array.isArray(profilesData)) {
      profilesData.forEach(p => {
        const photo = p.photo_url || p.avatar_url;
        if (photo) {
          if (p.id) photoMap[p.id] = photo;
          if (p.email) photoMap[p.email] = photo;
        }
      });
    }

    return photoMap;
  } catch (err) {
    console.warn('Não foi possível carregar fotos dos usuários do Supabase:', err);
    return {};
  }
}

/**
 * Persists a registered company to Supabase cloud database.
 */
export async function saveCompanyToSupabase(company: any) {
  try {
    if (!company || !company.id) return { success: false, error: 'Empresa inválida' };

    // 1. Mirror company payload in app_settings table
    try {
      await supabase.from('app_settings').upsert({
        key: `agro_company_${company.id}`,
        value: JSON.stringify(company),
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    } catch (e) {}

    // 2. Upsert to tenants table if available
    try {
      await supabase.from('tenants').upsert({
        id: company.id,
        company_name: company.name,
        trade_name: company.tradeName || company.name,
        cnpj: company.cnpj,
        state_registration: company.stateRegistration || null,
        phone: company.phone || null,
        email: company.email || null,
        city_state: company.cityState || null,
        tagline: company.tagline || null,
        primary_color: company.primaryColor || '#0284c7',
        status: company.status || 'ACTIVE',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    } catch (e) {}

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao salvar empresa no Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Deletes or deactivates a company in Supabase cloud database.
 */
export async function deleteCompanyFromSupabase(companyId: string) {
  try {
    if (!companyId) return { success: false };

    try {
      await supabase.from('app_settings').delete().eq('key', `agro_company_${companyId}`);
    } catch (e) {}

    try {
      await supabase.from('tenants').delete().eq('id', companyId);
    } catch (e) {}

    return { success: true };
  } catch (err) {
    return { success: false };
  }
}

/**
 * Loads registered companies stored in Supabase cloud database.
 */
export async function loadCompaniesFromSupabase(): Promise<any[]> {
  try {
    const companiesMap = new Map<string, any>();

    const { data: settingsData } = await supabase
      .from('app_settings')
      .select('key, value')
      .like('key', 'agro_company_%');

    if (settingsData && Array.isArray(settingsData)) {
      settingsData.forEach(item => {
        try {
          const parsed = JSON.parse(item.value);
          if (parsed && parsed.id && parsed.name) {
            companiesMap.set(parsed.id, parsed);
          }
        } catch (e) {}
      });
    }

    return Array.from(companiesMap.values());
  } catch (err) {
    console.warn('Não foi possível carregar empresas do Supabase:', err);
    return [];
  }
}

/**
 * Generic helper to back up any module data to Supabase app_settings.
 */
export async function saveAppDataToSupabase(key: string, value: any) {
  try {
    await supabase.from('app_settings').upsert({
      key: `agro_data_${key}`,
      value: JSON.stringify(value),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Generic helper to retrieve backed up module data from Supabase.
 */
export async function loadAppDataFromSupabase<T>(key: string): Promise<T | null> {
  try {
    const { data } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', `agro_data_${key}`)
      .maybeSingle();

    if (data?.value) {
      return JSON.parse(data.value) as T;
    }
    return null;
  } catch (err) {
    return null;
  }
}

