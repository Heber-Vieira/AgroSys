import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WhiteLabelTheme, UserProfile, ServiceOrder } from '../types';
import { USER_PROFILES, INITIAL_PILOTS, INITIAL_ASSISTANTS } from '../data/mockAppState';

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

import { logUserActivity } from './auditLoggerService';

function fontOrTableConnected(error: any): boolean {
  return !error.message.includes('Invalid API key') && !error.message.includes('apiKey');
}

export async function signInWithSupabase(email: string, password: string) {
  const startTime = performance.now();
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const durationMs = Math.round(performance.now() - startTime);
    logUserActivity({
      userId: data.user?.id || email,
      userName: data.user?.user_metadata?.name || email.split('@')[0],
      userEmail: email,
      action: 'LOGIN',
      details: { provider: 'supabase-password', authId: data.user?.id },
      responseStatus: 200,
      statusLabel: 'SUCCESS',
      durationMs,
    });

    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    logUserActivity({
      userId: email,
      userEmail: email,
      action: 'LOGIN_FAILED',
      details: { reason: err.message || 'Falha de autenticação' },
      responseStatus: 401,
      statusLabel: 'FAILURE',
      durationMs,
    });

    return { user: null, session: null, error: err.message || 'Falha ao autenticar no Supabase Auth' };
  }
}

export async function signUpWithSupabase(email: string, password: string, name?: string, role?: string) {
  const startTime = performance.now();
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

    const durationMs = Math.round(performance.now() - startTime);
    logUserActivity({
      userId: data.user?.id || email,
      userName: name || email.split('@')[0],
      userEmail: email,
      action: 'CREATE_USER',
      details: { role: role || 'ADMIN', registeredVia: 'Supabase SignUp' },
      responseStatus: 201,
      statusLabel: 'SUCCESS',
      durationMs,
    });

    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - startTime);
    logUserActivity({
      userId: email,
      userEmail: email,
      action: 'CREATE_USER',
      details: { reason: err.message || 'Falha ao registrar conta' },
      responseStatus: 400,
      statusLabel: 'FAILURE',
      durationMs,
    });

    return { user: null, session: null, error: err.message || 'Falha ao cadastrar usuário no Supabase Auth' };
  }
}

export async function signOutSupabase() {
  const startTime = performance.now();
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const currentUser = sessionData?.session?.user;

    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    const durationMs = Math.round(performance.now() - startTime);
    logUserActivity({
      userId: currentUser?.id || 'session-ended',
      userEmail: currentUser?.email || '',
      action: 'LOGOUT',
      details: { sessionEnded: true },
      responseStatus: 200,
      statusLabel: 'SUCCESS',
      durationMs,
    });

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

const THEME_META_REGEX = /<!--AGRO_THEME:([\s\S]*?)-->/;
const DATA_META_REGEX = /<!--AGRO_DATA_([a-zA-Z0-9_-]+):([\s\S]*?)-->/g;

export function extractThemeFromDescription(rawDescription?: string | null): Partial<WhiteLabelTheme> | null {
  if (!rawDescription) return null;
  const match = rawDescription.match(THEME_META_REGEX);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {}
  }
  return null;
}

export function cleanDescriptionText(rawDescription?: string | null): string {
  if (!rawDescription) return '';
  return rawDescription
    .replace(THEME_META_REGEX, '')
    .replace(/<!--AGRO_DATA_[\s\S]*?-->/g, '')
    .trim();
}

/**
 * Persists tenant branding configuration and custom logo URL to Supabase database.
 * Uses a resilient 3-layer architecture:
 * 1. tenants table (with safe native columns + JSON metadata comment in description)
 * 2. tenant_branding_configs table (if created/available)
 * 3. app_settings table (if created/available)
 */
export async function saveTenantBrandingToSupabase(theme: WhiteLabelTheme) {
  try {
    const tenantId = theme.tenantId || 'ciclodrone';
    const now = new Date().toISOString();

    // 1. Fetch current tenant description to preserve user notes & other tags
    let baseDescription = '';
    try {
      const { data: currentTenant } = await supabase
        .from('tenants')
        .select('description')
        .eq('id', tenantId)
        .maybeSingle();
      if (currentTenant?.description) {
        baseDescription = cleanDescriptionText(currentTenant.description);
      }
    } catch (e) {}

    const themeJson = JSON.stringify({
      logoUrl: theme.logoUrl,
      logoDarkUrl: theme.logoDarkUrl,
      logoIconId: theme.logoIconId,
      logoAdaptiveMode: theme.logoAdaptiveMode,
      fontFamily: theme.fontFamily,
      borderRadius: theme.borderRadius,
      companyName: theme.companyName,
      tagline: theme.tagline,
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      contactPhone: theme.contactPhone,
      contactEmail: theme.contactEmail,
      registryCreaMapa: theme.registryCreaMapa,
    });

    const packedDescription = `${baseDescription} <!--AGRO_THEME:${themeJson}-->`.trim();

    // 2. PRIMARY: Update tenants table with guaranteed native schema compatibility
    try {
      await supabase.from('tenants').update({
        name: theme.companyName,
        trade_name: theme.companyName,
        tagline: theme.tagline || null,
        primary_color: theme.primaryColor,
        secondary_color: theme.secondaryColor,
        accent_color: theme.accentColor,
        phone: theme.contactPhone || null,
        email: theme.contactEmail || null,
        registry_crea_mapa: theme.registryCreaMapa || null,
        description: packedDescription,
        updated_at: now,
      }).eq('id', tenantId);
    } catch (e) {
      console.warn('Aviso ao persistir branding em tenants:', e);
    }

    // 3. SECONDARY: Try upserting into tenant_branding_configs (if table exists)
    let brandingResult = null;
    try {
      const { data, error: brandingError } = await supabase
        .from('tenant_branding_configs')
        .upsert({
          tenant_id: tenantId,
          company_name: theme.companyName,
          tagline: theme.tagline,
          logo_light_url: theme.logoUrl || null,
          logo_dark_url: theme.logoDarkUrl || theme.logoUrl || null,
          logo_icon_id: theme.logoIconId || null,
          logo_adaptive_mode: theme.logoAdaptiveMode || 'auto',
          primary_color_hex: theme.primaryColor,
          secondary_color_hex: theme.secondaryColor,
          accent_color_hex: theme.accentColor,
          font_family: theme.fontFamily,
          border_radius_base: theme.borderRadius,
          contact_phone: theme.contactPhone || null,
          contact_email: theme.contactEmail || null,
          registry_crea_mapa: theme.registryCreaMapa || null,
          updated_at: now,
        }, { onConflict: 'tenant_id' })
        .select();

      if (!brandingError) brandingResult = data;
    } catch (e) {}

    // 4. TERTIARY: Mirror full JSON in app_settings (if table exists)
    try {
      await supabase.from('app_settings').upsert({
        key: `agro_branding_${tenantId}`,
        value: JSON.stringify(theme),
        updated_at: now,
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
    try {
      const { data: settingData, error: settingErr } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `agro_branding_${tenantId}`)
        .maybeSingle();

      if (!settingErr && settingData?.value) {
        const parsed = JSON.parse(settingData.value);
        if (parsed && (parsed.primaryColor || parsed.companyName)) {
          return parsed as WhiteLabelTheme;
        }
      }
    } catch (e) {}

    // 2. Try tenant_branding_configs table
    try {
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
          logoAdaptiveMode: data.logo_adaptive_mode || 'auto',
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
    } catch (e) {}

    // 3. PRIMARY GUARANTEED: Load from tenants table (always exists in Supabase)
    const { data: tenantData, error: tenantErr } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .maybeSingle();

    if (!tenantErr && tenantData) {
      const meta = extractThemeFromDescription(tenantData.description);
      return {
        tenantId: tenantData.id,
        companyName: tenantData.name || 'AgroSys',
        tagline: tenantData.tagline || '',
        logoUrl: meta?.logoUrl || (tenantData as any).logo_light_url || undefined,
        logoDarkUrl: meta?.logoDarkUrl || (tenantData as any).logo_dark_url || undefined,
        logoIconId: meta?.logoIconId || (tenantData as any).logo_icon_id || undefined,
        logoAdaptiveMode: meta?.logoAdaptiveMode || (tenantData as any).logo_adaptive_mode || 'auto',
        primaryColor: tenantData.primary_color || '#0284c7',
        secondaryColor: tenantData.secondary_color || '#0f766e',
        accentColor: tenantData.accent_color || '#f59e0b',
        fontFamily: meta?.fontFamily || (tenantData as any).font_family || 'Plus Jakarta Sans',
        borderRadius: meta?.borderRadius || (tenantData as any).border_radius_base || '0.875rem',
        surfaceLight: '#FFFFFF',
        surfaceDark: '#0f172a',
        contactPhone: tenantData.phone || undefined,
        contactEmail: tenantData.email || undefined,
        registryCreaMapa: tenantData.registry_crea_mapa || undefined,
      };
    }

    return null;
  } catch (err) {
    console.warn('Não foi possível restaurar tema do Supabase:', err);
    return null;
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves full user identity from mock datasets, local storage, or provided profile.
 */
export function resolveUserData(idOrEmailOrCpf: string, profile?: Partial<UserProfile>) {
  const query = (idOrEmailOrCpf || '').trim();
  const queryLower = query.toLowerCase();

  // 1. Match from USER_PROFILES
  const matchUser = USER_PROFILES.find(u => 
    u.id === query || 
    (u.email && u.email.toLowerCase() === queryLower) ||
    u.documentNumber === query ||
    (u.name && u.name.toLowerCase() === queryLower)
  );

  // 2. Match from INITIAL_PILOTS
  const matchPilot = INITIAL_PILOTS.find(p =>
    p.id === query ||
    p.cpf === query ||
    (p.name && p.name.toLowerCase() === queryLower)
  );

  // 3. Match from INITIAL_ASSISTANTS
  const matchAsst = INITIAL_ASSISTANTS.find(a =>
    a.id === query ||
    a.cpf === query ||
    (a.name && a.name.toLowerCase() === queryLower)
  );

  const name = profile?.name || matchUser?.name || matchPilot?.name || matchAsst?.name || query;
  const email = profile?.email || matchUser?.email || (query.includes('@') ? query : '');
  const documentNumber = (profile as any)?.documentNumber || (profile as any)?.cpf || matchUser?.documentNumber || matchPilot?.cpf || matchAsst?.cpf || '';
  const companyId = (profile as any)?.companyId || matchUser?.companyId || matchPilot?.companyId || matchAsst?.companyId || 'ciclodrone';
  const role = (profile as any)?.role || matchUser?.role || (matchPilot ? 'PILOT' : (matchAsst ? 'ASSISTANT' : 'USER'));
  const roleLabel = (profile as any)?.roleLabel || matchUser?.roleLabel || (matchPilot ? 'Piloto de Drone Remoto' : (matchAsst ? 'Auxiliar de Pulverização' : 'Colaborador'));

  return {
    id: query,
    name,
    email,
    documentNumber,
    companyId,
    role,
    roleLabel,
  };
}

/**
 * Persists user profile photo URL to Supabase database with multi-tier synchronization.
 * Handles both UUIDs and human-readable IDs, updating user_profiles table and
 * saving persistent backups in the cloud database.
 */
export async function saveUserPhotoToSupabase(idOrEmail: string, photoUrl: string, profile?: Partial<UserProfile>) {
  try {
    if (!idOrEmail) return { success: false, error: 'ID ou e-mail inválido' };
    const now = new Date().toISOString();
    const resolved = resolveUserData(idOrEmail, profile);
    const sanitizedKey = idOrEmail.toLowerCase().replace(/[^a-z0-9_@-]/g, '_');
    const isUuid = UUID_REGEX.test(idOrEmail);

    let updatedInProfiles = false;

    // 1. Try updating user_profiles by UUID if idOrEmail is a valid UUID
    if (isUuid) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            photo_url: photoUrl || null,
            avatar_url: photoUrl || null,
            updated_at: now,
          })
          .eq('id', idOrEmail)
          .select('id');

        if (!error && data && data.length > 0) {
          updatedInProfiles = true;
        }
      } catch (e) {}
    }

    // 2. Try updating user_profiles by email
    if (!updatedInProfiles && resolved.email) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            photo_url: photoUrl || null,
            avatar_url: photoUrl || null,
            updated_at: now,
          })
          .eq('email', resolved.email)
          .select('id');

        if (!error && data && data.length > 0) {
          updatedInProfiles = true;
        }
      } catch (e) {}
    }

    // 3. Try updating user_profiles by document_number (CPF or CNPJ)
    if (!updatedInProfiles && resolved.documentNumber) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            photo_url: photoUrl || null,
            avatar_url: photoUrl || null,
            updated_at: now,
          })
          .eq('document_number', resolved.documentNumber)
          .select('id');

        if (!error && data && data.length > 0) {
          updatedInProfiles = true;
        }
      } catch (e) {}
    }

    // 4. Try updating user_profiles by name
    if (!updatedInProfiles && resolved.name) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .update({
            photo_url: photoUrl || null,
            avatar_url: photoUrl || null,
            updated_at: now,
          })
          .eq('name', resolved.name)
          .select('id');

        if (!error && data && data.length > 0) {
          updatedInProfiles = true;
        }
      } catch (e) {}
    }

    // 5. If no existing user_profiles record matched, insert a new record with a valid UUID
    if (!updatedInProfiles) {
      try {
        const newUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'u-' + Date.now();
        if (UUID_REGEX.test(newUuid)) {
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert({
              id: newUuid,
              company_id: resolved.companyId || 'ciclodrone',
              name: resolved.name || idOrEmail,
              role: resolved.role || 'USER',
              role_label: resolved.roleLabel || 'Colaborador',
              email: resolved.email || `${sanitizedKey}@agrosys.agr.br`,
              document_number: resolved.documentNumber || null,
              photo_url: photoUrl || null,
              avatar_url: photoUrl || null,
              badge: resolved.roleLabel || 'Colaborador',
              status: 'ACTIVE',
              salary_base: (profile as any)?.salaryBase || 0,
              created_at: now,
              updated_at: now,
            });

          if (!insertError) {
            updatedInProfiles = true;
          }
        }
      } catch (e) {}
    }

    // 6. PRIMARY RESILIENT BACKUP: Save in tenants table description metadata
    try {
      const { data: tenant } = await supabase.from('tenants').select('description').eq('id', 'ciclodrone').maybeSingle();
      let currentDesc = tenant?.description || '';
      
      // Clean previous tags for this user
      const tagRegex = new RegExp(`<!--AGRO_USER_PHOTO_${sanitizedKey}:[\\s\\S]*?-->`, 'g');
      currentDesc = currentDesc.replace(tagRegex, '').trim();

      const payload = {
        idOrEmail,
        photoUrl,
        email: resolved.email,
        name: resolved.name,
        documentNumber: resolved.documentNumber,
        updated_at: now,
      };

      if (photoUrl) {
        currentDesc = `${currentDesc} <!--AGRO_USER_PHOTO_${sanitizedKey}:${JSON.stringify(payload)}-->`.trim();
      }

      await supabase.from('tenants').update({
        description: currentDesc,
        updated_at: now,
      }).eq('id', 'ciclodrone');
    } catch (e) {
      console.warn('Aviso ao salvar backup da foto do usuário no tenants:', e);
    }

    // 7. TERTIARY BACKUP: Mirror in app_settings table (if available)
    try {
      if (photoUrl) {
        await supabase.from('app_settings').upsert({
          key: `agro_user_photo_${sanitizedKey}`,
          value: JSON.stringify({
            idOrEmail,
            photoUrl,
            name: resolved.name,
            email: resolved.email,
            documentNumber: resolved.documentNumber,
            updated_at: now,
          }),
          updated_at: now,
        }, { onConflict: 'key' });
      } else {
        await supabase.from('app_settings').delete().eq('key', `agro_user_photo_${sanitizedKey}`);
      }
    } catch (e) {}

    return { success: true, error: null };
  } catch (err: any) {
    console.error('Erro ao gravar foto de perfil no Supabase:', err);
    return { success: false, error: err.message || 'Falha ao salvar foto no banco de dados' };
  }
}

/**
 * Loads all user profile photos stored in Supabase database with universal cross-indexing.
 */
export async function loadUserPhotosFromSupabase(): Promise<Record<string, string>> {
  try {
    const photoMap: Record<string, string> = {};

    // Helper to map a photo to all known identifiers of a user
    const mapPhotoToAllKeys = (photo: string, identifiers: { id?: string; email?: string; name?: string; documentNumber?: string }) => {
      if (!photo) return;
      if (identifiers.id) photoMap[identifiers.id] = photo;
      if (identifiers.email) photoMap[identifiers.email.toLowerCase()] = photo;
      if (identifiers.name) photoMap[identifiers.name] = photo;
      if (identifiers.documentNumber) photoMap[identifiers.documentNumber] = photo;

      // Cross-match against USER_PROFILES
      const u = USER_PROFILES.find(x => 
        (identifiers.id && x.id === identifiers.id) ||
        (identifiers.email && x.email?.toLowerCase() === identifiers.email.toLowerCase()) ||
        (identifiers.name && x.name?.toLowerCase() === identifiers.name.toLowerCase()) ||
        (identifiers.documentNumber && x.documentNumber === identifiers.documentNumber)
      );
      if (u) {
        photoMap[u.id] = photo;
        if (u.email) photoMap[u.email.toLowerCase()] = photo;
        if (u.name) photoMap[u.name] = photo;
        if (u.documentNumber) photoMap[u.documentNumber] = photo;
      }

      // Cross-match against INITIAL_PILOTS
      const p = INITIAL_PILOTS.find(x =>
        (identifiers.id && x.id === identifiers.id) ||
        (identifiers.name && x.name?.toLowerCase() === identifiers.name.toLowerCase()) ||
        (identifiers.documentNumber && x.cpf === identifiers.documentNumber)
      );
      if (p) {
        photoMap[p.id] = photo;
        if (p.name) photoMap[p.name] = photo;
        if (p.cpf) photoMap[p.cpf] = photo;
      }

      // Cross-match against INITIAL_ASSISTANTS
      const a = INITIAL_ASSISTANTS.find(x =>
        (identifiers.id && x.id === identifiers.id) ||
        (identifiers.name && x.name?.toLowerCase() === identifiers.name.toLowerCase()) ||
        (identifiers.documentNumber && x.cpf === identifiers.documentNumber)
      );
      if (a) {
        photoMap[a.id] = photo;
        if (a.name) photoMap[a.name] = photo;
        if (a.cpf) photoMap[a.cpf] = photo;
      }
    };

    // 1. Fetch from user_profiles table (primary database table)
    try {
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('id, email, name, document_number, photo_url, avatar_url');

      if (profilesData && Array.isArray(profilesData)) {
        profilesData.forEach(p => {
          const photo = p.photo_url || p.avatar_url;
          if (photo) {
            mapPhotoToAllKeys(photo, {
              id: p.id,
              email: p.email,
              name: p.name,
              documentNumber: p.document_number,
            });
          }
        });
      }
    } catch (e) {}

    // 2. Fetch from tenants description tags (resilient metadata layer)
    try {
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('description')
        .eq('id', 'ciclodrone')
        .maybeSingle();

      if (tenantData?.description) {
        const photoTags = tenantData.description.match(/<!--AGRO_USER_PHOTO_[^:]+:([\s\S]*?)-->/g) || [];
        photoTags.forEach((tag: string) => {
          const match = tag.match(/<!--AGRO_USER_PHOTO_[^:]+:([\s\S]*?)-->/);
          if (match && match[1]) {
            try {
              const parsed = JSON.parse(match[1]);
              if (parsed && parsed.photoUrl) {
                mapPhotoToAllKeys(parsed.photoUrl, {
                  id: parsed.idOrEmail,
                  email: parsed.email,
                  name: parsed.name,
                  documentNumber: parsed.documentNumber,
                });
              }
            } catch (e) {}
          }
        });
      }
    } catch (e) {}

    // 3. Enrich from app_settings if available
    try {
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value')
        .like('key', 'agro_user_photo_%');

      if (settingsData && Array.isArray(settingsData)) {
        settingsData.forEach(item => {
          try {
            const parsed = JSON.parse(item.value);
            if (parsed && parsed.photoUrl) {
              mapPhotoToAllKeys(parsed.photoUrl, {
                id: parsed.idOrEmail,
                email: parsed.email,
                name: parsed.name,
                documentNumber: parsed.documentNumber,
              });
            }
          } catch (e) {}
        });
      }
    } catch (e) {}

    return photoMap;
  } catch (err) {
    console.warn('Não foi possível carregar fotos dos usuários do Supabase:', err);
    return {};
  }
}

/**
 * Persists a UserProfile object to Supabase cloud database.
 */
export async function saveUserProfileToSupabase(user: UserProfile) {
  try {
    if (!user || (!user.id && !user.email)) return { success: false, error: 'Usuário inválido' };
    const now = new Date().toISOString();

    const isValidUuid = UUID_REGEX.test(user.id);

    // 1. Primary: Upsert to user_profiles table in Supabase
    try {
      if (isValidUuid) {
        await supabase.from('user_profiles').upsert({
          id: user.id,
          company_id: user.companyId || 'ciclodrone',
          name: user.name,
          role: user.role,
          role_label: user.roleLabel,
          email: user.email,
          document_number: user.documentNumber || null,
          phone: user.phone || null,
          farm_name: user.farmName || null,
          license_code: user.licenseCode || null,
          status: user.status || 'ACTIVE',
          salary_base: user.salaryBase || 0,
          password: user.password || null,
          hired_date: user.hiredDate || null,
          photo_url: user.photoUrl || user.avatarUrl || null,
          avatar_url: user.photoUrl || user.avatarUrl || null,
          badge: user.badge || user.roleLabel,
          is_master: user.isMaster || false,
          allowed_views: user.allowedViews || null,
          updated_at: now,
        }, { onConflict: 'id' });
      } else if (user.email) {
        await supabase.from('user_profiles').upsert({
          email: user.email,
          company_id: user.companyId || 'ciclodrone',
          name: user.name,
          role: user.role,
          role_label: user.roleLabel,
          document_number: user.documentNumber || null,
          phone: user.phone || null,
          farm_name: user.farmName || null,
          license_code: user.licenseCode || null,
          status: user.status || 'ACTIVE',
          salary_base: user.salaryBase || 0,
          password: user.password || null,
          hired_date: user.hiredDate || null,
          photo_url: user.photoUrl || user.avatarUrl || null,
          avatar_url: user.photoUrl || user.avatarUrl || null,
          badge: user.badge || user.roleLabel,
          is_master: user.isMaster || false,
          allowed_views: user.allowedViews || null,
          updated_at: now,
        }, { onConflict: 'email' });
      }
    } catch (e) {
      console.warn('Aviso ao salvar perfil de usuário na tabela user_profiles:', e);
    }

    // 2. Secondary: Mirror payload in app_settings table
    try {
      const key = user.id || `user_${user.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
      await supabase.from('app_settings').upsert({
        key: `agro_user_${key}`,
        value: JSON.stringify(user),
        updated_at: now,
      }, { onConflict: 'key' });
    } catch (e) {}

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao salvar usuário no Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Loads user profiles stored in Supabase cloud database.
 */
export async function loadUserProfilesFromSupabase(): Promise<UserProfile[]> {
  try {
    const userMap = new Map<string, UserProfile>();

    // 1. Load from app_settings (agro_user_*)
    try {
      const { data: settingsData } = await supabase
        .from('app_settings')
        .select('key, value')
        .like('key', 'agro_user_%');

      if (settingsData && Array.isArray(settingsData)) {
        settingsData.forEach(item => {
          try {
            const parsed = JSON.parse(item.value) as UserProfile;
            if (parsed && parsed.id && parsed.name) {
              userMap.set(parsed.id, parsed);
            }
          } catch (e) {}
        });
      }
    } catch (e) {}

    // 2. Load from user_profiles table
    try {
      const { data: dbProfiles } = await supabase
        .from('user_profiles')
        .select('*');

      if (dbProfiles && Array.isArray(dbProfiles)) {
        dbProfiles.forEach(p => {
          const id = p.id || `user-${p.email}`;
          if (!userMap.has(id)) {
            userMap.set(id, {
              id,
              companyId: p.company_id || 'ciclodrone',
              name: p.name,
              role: p.role,
              roleLabel: p.role_label,
              email: p.email,
              documentNumber: p.document_number,
              phone: p.phone,
              farmName: p.farm_name,
              licenseCode: p.license_code,
              status: p.status || 'ACTIVE',
              salaryBase: p.salary_base,
              password: p.password,
              hiredDate: p.hired_date,
              photoUrl: p.photo_url || p.avatar_url,
              avatarUrl: p.avatar_url || p.photo_url,
              badge: p.badge || p.role_label,
              isMaster: p.is_master,
              allowedViews: p.allowed_views,
            });
          }
        });
      }
    } catch (e) {}

    return Array.from(userMap.values());
  } catch (err) {
    console.warn('Erro ao carregar perfis de usuários do Supabase:', err);
    return [];
  }
}



/**
 * Persists a registered company to Supabase cloud database.
 */
export async function saveCompanyToSupabase(company: any) {
  try {
    if (!company || !company.id) return { success: false, error: 'Empresa inválida' };
    const now = new Date().toISOString();

    const cleanDesc = cleanDescriptionText(company.description || '');
    const meta = JSON.stringify({
      logoUrl: company.logoUrl,
      logoDarkUrl: company.logoDarkUrl,
      logoIconId: company.logoIconId,
      logoAdaptiveMode: company.logoAdaptiveMode,
      fontFamily: company.fontFamily,
      borderRadius: company.borderRadius,
      tagline: company.tagline,
      cropFocus: company.cropFocus,
    });
    const packedDesc = `${cleanDesc} <!--AGRO_THEME:${meta}-->`.trim();

    // 1. PRIMARY: Upsert to tenants table (with native columns only)
    try {
      await supabase.from('tenants').upsert({
        id: company.id,
        name: company.name,
        trade_name: company.tradeName || company.name,
        cnpj: company.cnpj || '',
        state_registration: company.stateRegistration || null,
        phone: company.phone || null,
        email: company.email || null,
        city_state: company.cityState || null,
        tagline: company.tagline || null,
        primary_color: company.primaryColor || '#0284c7',
        secondary_color: company.secondaryColor || '#0f766e',
        accent_color: company.accentColor || '#f59e0b',
        crop_focus: company.cropFocus || null,
        description: packedDesc,
        status: company.status || 'ACTIVE',
        updated_at: now,
      }, { onConflict: 'id' });
    } catch (e) {
      console.warn('Aviso ao salvar empresa no tenants:', e);
    }

    // 2. SECONDARY: Try tenant_branding_configs table if available
    try {
      await supabase.from('tenant_branding_configs').upsert({
        tenant_id: company.id,
        company_name: company.name,
        tagline: company.tagline,
        logo_light_url: company.logoUrl || null,
        logo_dark_url: company.logoDarkUrl || company.logoUrl || null,
        logo_icon_id: company.logoIconId || null,
        logo_adaptive_mode: company.logoAdaptiveMode || 'auto',
        primary_color_hex: company.primaryColor || '#0284c7',
        secondary_color_hex: company.secondaryColor || '#0f766e',
        accent_color_hex: company.accentColor || '#f59e0b',
        font_family: company.fontFamily || 'Plus Jakarta Sans',
        border_radius_base: company.borderRadius || '0.875rem',
        contact_phone: company.phone || null,
        contact_email: company.email || null,
        registry_crea_mapa: company.registryCreaMapa || null,
        updated_at: now,
      }, { onConflict: 'tenant_id' });
    } catch (e) {}

    // 3. TERTIARY: Mirror company payload in app_settings table (if available)
    try {
      await supabase.from('app_settings').upsert({
        key: `agro_company_${company.id}`,
        value: JSON.stringify(company),
        updated_at: now,
      }, { onConflict: 'key' });
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
      await supabase.from('tenant_branding_configs').delete().eq('tenant_id', companyId);
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

    // PRIMARY: Load from tenants table (guaranteed to exist in Supabase)
    try {
      const { data: tenantsData } = await supabase.from('tenants').select('*');
      if (tenantsData && Array.isArray(tenantsData)) {
        tenantsData.forEach(t => {
          if (t.id) {
            const meta = extractThemeFromDescription(t.description);
            companiesMap.set(t.id, {
              id: t.id,
              name: t.name,
              tradeName: t.trade_name || t.name,
              cnpj: t.cnpj,
              stateRegistration: t.state_registration,
              registryCreaMapa: t.registry_crea_mapa,
              phone: t.phone,
              email: t.email,
              cityState: t.city_state,
              tagline: t.tagline,
              primaryColor: t.primary_color || '#0284c7',
              secondaryColor: t.secondary_color || '#0f766e',
              accentColor: t.accent_color || '#f59e0b',
              logoUrl: meta?.logoUrl || (t as any).logo_light_url || undefined,
              logoDarkUrl: meta?.logoDarkUrl || (t as any).logo_dark_url || undefined,
              logoIconId: meta?.logoIconId || (t as any).logo_icon_id || undefined,
              logoAdaptiveMode: meta?.logoAdaptiveMode || (t as any).logo_adaptive_mode || 'auto',
              fontFamily: meta?.fontFamily || (t as any).font_family || 'Plus Jakarta Sans',
              borderRadius: meta?.borderRadius || (t as any).border_radius_base || '0.875rem',
              cropFocus: t.crop_focus,
              description: cleanDescriptionText(t.description),
              status: t.status || 'ACTIVE',
              createdAt: t.created_at,
            });
          }
        });
      }
    } catch (e) {
      console.warn('Falha ao carregar empresas de tenants:', e);
    }

    // SECONDARY: Enrich from tenant_branding_configs (if available)
    try {
      const { data: configsData } = await supabase.from('tenant_branding_configs').select('*');
      if (configsData && Array.isArray(configsData)) {
        configsData.forEach(c => {
          if (c.tenant_id && companiesMap.has(c.tenant_id)) {
            const existing = companiesMap.get(c.tenant_id);
            companiesMap.set(c.tenant_id, {
              ...existing,
              logoUrl: c.logo_light_url || existing.logoUrl,
              logoDarkUrl: c.logo_dark_url || existing.logoDarkUrl,
              logoIconId: c.logo_icon_id || existing.logoIconId,
              logoAdaptiveMode: c.logo_adaptive_mode || existing.logoAdaptiveMode,
              fontFamily: c.font_family || existing.fontFamily,
              borderRadius: c.border_radius_base || existing.borderRadius,
            });
          }
        });
      }
    } catch (e) {}

    // TERTIARY: Enrich from app_settings (if available)
    try {
      const { data: settingsData, error: settingsErr } = await supabase
        .from('app_settings')
        .select('key, value')
        .like('key', 'agro_company_%');

      if (!settingsErr && settingsData && Array.isArray(settingsData)) {
        settingsData.forEach(item => {
          try {
            const parsed = JSON.parse(item.value);
            if (parsed && parsed.id && parsed.name) {
              const existing = companiesMap.get(parsed.id);
              companiesMap.set(parsed.id, { ...existing, ...parsed });
            }
          } catch (e) {}
        });
      }
    } catch (e) {}

    return Array.from(companiesMap.values());
  } catch (err) {
    console.warn('Não foi possível carregar empresas do Supabase:', err);
    return [];
  }
}

/**
 * Generic helper to back up any module data to Supabase.
 * Multi-layer fallback:
 * 1. app_settings table
 * 2. tenants description JSON metadata on ciclodrone
 */
export async function saveAppDataToSupabase(key: string, value: any) {
  try {
    const now = new Date().toISOString();

    // 1. Try app_settings table
    try {
      const { error } = await supabase.from('app_settings').upsert({
        key: `agro_data_${key}`,
        value: JSON.stringify(value),
        updated_at: now
      }, { onConflict: 'key' });

      if (!error) return { success: true };
    } catch (e) {}

    // 2. Resilient fallback in tenants description for master tenant
    try {
      const { data: tenant } = await supabase.from('tenants').select('description').eq('id', 'ciclodrone').maybeSingle();
      let currentDesc = tenant?.description || '';
      const tagRegex = new RegExp(`<!--AGRO_DATA_${key}:[\\s\\S]*?-->`, 'g');
      currentDesc = currentDesc.replace(tagRegex, '').trim();
      const newDesc = `${currentDesc} <!--AGRO_DATA_${key}:${JSON.stringify(value)}-->`.trim();

      await supabase.from('tenants').update({
        description: newDesc,
        updated_at: now
      }).eq('id', 'ciclodrone');
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Generic helper to retrieve backed up module data from Supabase.
 */
export async function loadAppDataFromSupabase<T>(key: string): Promise<T | null> {
  try {
    // 1. Try app_settings table
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', `agro_data_${key}`)
        .maybeSingle();

      if (!error && data?.value) {
        return JSON.parse(data.value) as T;
      }
    } catch (e) {}

    // 2. Try tenants description fallback
    try {
      const { data: tenant } = await supabase.from('tenants').select('description').eq('id', 'ciclodrone').maybeSingle();
      if (tenant?.description) {
        const tagRegex = new RegExp(`<!--AGRO_DATA_${key}:([\\s\\S]*?)-->`);
        const match = tenant.description.match(tagRegex);
        if (match && match[1]) {
          return JSON.parse(match[1]) as T;
        }
      }
    } catch (e) {}

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Persists AgroSys Master System Login Branding & Logo to Supabase Cloud.
 */
export async function saveSystemBrandingToSupabase(branding: Partial<WhiteLabelTheme>) {
  try {
    const now = new Date().toISOString();

    // 1. Try app_settings table
    try {
      await supabase.from('app_settings').upsert({
        key: 'agro_system_branding',
        value: JSON.stringify(branding),
        updated_at: now,
      }, { onConflict: 'key' });
    } catch (e) {}

    // 2. Resilient backup in tenants description on ciclodrone (master tenant)
    try {
      const { data: tenant } = await supabase.from('tenants').select('description').eq('id', 'ciclodrone').maybeSingle();
      let currentDesc = tenant?.description || '';
      const tagRegex = /<!--AGRO_SYSTEM_BRANDING:[\s\S]*?-->/g;
      currentDesc = currentDesc.replace(tagRegex, '').trim();
      const newDesc = `${currentDesc} <!--AGRO_SYSTEM_BRANDING:${JSON.stringify(branding)}-->`.trim();

      await supabase.from('tenants').update({
        description: newDesc,
        updated_at: now,
      }).eq('id', 'ciclodrone');
    } catch (e) {
      console.warn('Aviso ao salvar branding do sistema no tenants:', e);
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erro ao salvar branding do sistema no Supabase:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Retrieves saved AgroSys Master System Login Branding & Logo from Supabase Cloud.
 */
export async function loadSystemBrandingFromSupabase(): Promise<Partial<WhiteLabelTheme> | null> {
  try {
    // 1. Try app_settings table
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'agro_system_branding')
        .maybeSingle();

      if (!error && data?.value) {
        return JSON.parse(data.value);
      }
    } catch (e) {}

    // 2. Try tenants description tag on ciclodrone
    try {
      const { data: tenant } = await supabase.from('tenants').select('description').eq('id', 'ciclodrone').maybeSingle();
      if (tenant?.description) {
        const match = tenant.description.match(/<!--AGRO_SYSTEM_BRANDING:([\s\S]*?)-->/);
        if (match && match[1]) {
          return JSON.parse(match[1]);
        }
      }
    } catch (e) {}

    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Persists Service Orders (OS) list to Supabase database (service_orders table or app_settings fallback).
 */
export async function saveServiceOrdersToSupabase(orders: ServiceOrder[]): Promise<{ success: boolean; error?: string }> {
  try {
    const now = new Date().toISOString();

    // 1. Try upserting into service_orders table
    try {
      const rows = orders.map(order => ({
        id: order.id,
        company_id: order.companyId || 'ciclodrone',
        code: order.code,
        client_id: order.clientId,
        client_name: order.clientName,
        farm_name: order.farmName,
        plot_id: order.plotId,
        plot_name: order.plotName,
        crop: order.crop,
        service_type: order.targetPestOrGoal,
        status: order.status,
        scheduled_date: order.scheduledDate,
        start_time: order.startTime || '08:00',
        end_time: order.endTime || '12:00',
        target_hectares: order.targetHectares,
        sprayed_hectares: order.sprayedHectares,
        drone_id: order.droneId,
        pilot_id: order.pilotId,
        assistant_id: order.assistantId,
        spray_rate_l_ha: order.sprayRateLHa,
        total_gross_value: order.totalGrossValue || 0,
        weather_safe_approved: order.weatherSafeApproved || false,
        mix_prepared_approved: order.mixPreparedApproved || false,
        digital_signed: order.digitalSigned || false,
        created_at: order.createdAt || now,
        completed_at: order.completedAt || null,
        full_json: JSON.stringify(order)
      }));

      const { error } = await supabase.from('service_orders').upsert(rows, { onConflict: 'id' });
      if (!error) {
        await saveAppDataToSupabase('orders_fleet', orders);
        return { success: true };
      }
    } catch (e) {}

    // 2. Fallback to app_settings storage
    return await saveAppDataToSupabase('orders_fleet', orders);
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * Loads Service Orders from Supabase cloud storage (service_orders table or app_settings fallback).
 */
export async function loadServiceOrdersFromSupabase(): Promise<ServiceOrder[] | null> {
  try {
    // 1. Try querying service_orders table
    try {
      const { data, error } = await supabase.from('service_orders').select('*');
      if (!error && data && data.length > 0) {
        return data.map((row: any) => {
          if (row.full_json) {
            try {
              const parsed = JSON.parse(row.full_json);
              return {
                ...parsed,
                status: row.status || parsed.status,
                sprayedHectares: row.sprayed_hectares !== undefined && row.sprayed_hectares !== null ? Number(row.sprayed_hectares) : parsed.sprayedHectares,
                completedAt: row.completed_at || parsed.completedAt,
                createdAt: row.created_at || parsed.createdAt,
              };
            } catch (e) {}
          }
          return {
            id: row.id,
            companyId: row.company_id || 'ciclodrone',
            code: row.code || row.order_code,
            clientId: row.client_id,
            clientName: row.client_name,
            farmName: row.farm_name,
            plotId: row.plot_id,
            plotName: row.plot_name,
            crop: row.crop,
            targetHectares: Number(row.target_hectares || row.planned_target_hectares || 0),
            sprayedHectares: Number(row.sprayed_hectares || row.actual_sprayed_hectares || 0),
            targetPestOrGoal: row.service_type || row.target_pest_or_goal || 'Pulverização Agrícola',
            status: row.status,
            scheduledDate: row.scheduled_date || row.scheduled_start_date,
            sprayRateLHa: Number(row.spray_rate_l_ha || row.planned_spray_rate_l_ha || 10),
            droneId: row.drone_id,
            droneModel: row.drone_model || 'Drone Agrícola',
            droneAnac: row.drone_anac || 'ANAC-AGRO',
            pilotId: row.pilot_id,
            pilotName: row.pilot_name || 'Piloto Agrícola',
            assistantId: row.assistant_id,
            assistantName: row.assistant_name || 'Auxiliar de Campo',
            pricingModel: 'PER_HECTARE',
            baseRatePerHa: 75.00,
            totalGrossValue: Number(row.total_gross_value || 0),
            pilotCommission: Number(row.pilot_commission || 0),
            assistantCommission: Number(row.assistant_commission || 0),
            weatherSafeApproved: Boolean(row.weather_safe_approved),
            mixPreparedApproved: Boolean(row.mix_prepared_approved),
            digitalSigned: Boolean(row.digital_signed),
            createdAt: row.created_at || new Date().toISOString(),
            completedAt: row.completed_at || row.finished_at || undefined,
          } as ServiceOrder;
        });
      }
    } catch (e) {}

    // 2. Try app_settings fallback
    const appSettingsOrders = await loadAppDataFromSupabase<ServiceOrder[]>('orders_fleet');
    if (appSettingsOrders && Array.isArray(appSettingsOrders) && appSettingsOrders.length > 0) {
      return appSettingsOrders;
    }
  } catch (err) {
    console.warn('Erro ao carregar Ordens de Serviço do Supabase:', err);
  }
  return null;
}


