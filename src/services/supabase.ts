import { createClient } from '@supabase/supabase-js';
import { WhiteLabelTheme } from '../types';

const env = (import.meta as any).env || {};
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://ioqdflvonlajalonxctd.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvcWRmbHZvbmxhamFsb254Y3RkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwODY1OTgsImV4cCI6MjEwNDY2MjU5OH0.tJk65svQxF6U_cjYff1QgsEJaegSn8IJ3hnOtYbvkD0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export async function signInWithSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return { user: data.user, session: data.session, error: null };
  } catch (err: any) {
    return { user: null, session: null, error: err.message || 'Falha ao autenticar no Supabase' };
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
      logo_dark_url: theme.logoUrl || null,
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
      await supabase.from('tenants').upsert({
        id: tenantId,
        company_name: theme.companyName,
        trade_name: theme.companyName,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' }).catch(() => {});
    }

    // Always mirror full JSON payload in app_settings table to guarantee 100% cloud sync
    await supabase.from('app_settings').upsert({
      key: `agro_branding_${tenantId}`,
      value: JSON.stringify(theme),
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' }).catch(() => {});

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
        logoUrl: data.logo_light_url || data.logo_dark_url || undefined,
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

