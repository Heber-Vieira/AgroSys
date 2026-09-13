/**
 * AgroSys - Empirical Test for System Login Logo & Supabase Synchronization
 */
import { 
  saveSystemBrandingToSupabase, 
  loadSystemBrandingFromSupabase,
  supabase 
} from '../services/supabase';
import { 
  DEFAULT_AGROSYS_SYSTEM_BRANDING, 
  SYSTEM_LOGO_PRESETS 
} from '../services/brandingLogoStorage';
import { WhiteLabelTheme } from '../types';

async function runTest() {
  console.log('=== INICIANDO TESTE DE PERSISTÊNCIA & SINCRONIZAÇÃO DO LOGOTIPO MASTER AGROSYS ===');

  // 1. Check Supabase connection
  console.log('\n[1/4] Verificando conectividade com o Supabase...');
  const { data: tenantCheck, error: tenantErr } = await supabase.from('tenants').select('id, name').limit(1);
  if (tenantErr) {
    console.error('❌ Falha na conexão com Supabase:', tenantErr);
    process.exit(1);
  }
  console.log('✅ Supabase conectado com sucesso. Amostra de tenants:', tenantCheck);

  // 2. Test Saving Custom System Logo (Base64 + Presets + Subtitle)
  console.log('\n[2/4] Gravando Logotipo Master do AgroSys no Supabase...');
  const sampleCustomBranding: WhiteLabelTheme = {
    ...DEFAULT_AGROSYS_SYSTEM_BRANDING,
    tenantId: 'system_agrosys',
    companyName: 'AgroSys Pro Enterprise',
    systemName: 'AgroSys Pro Cloud',
    systemSubtitle: 'Plataforma Inteligente de Gestão de Operações Aeroagrícolas',
    logoIconId: 'agrosys_precision',
    logoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    logoDarkUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    logoAdaptiveMode: 'auto',
    primaryColor: '#059669',
    secondaryColor: '#0284c7',
  };

  const saveRes = await saveSystemBrandingToSupabase(sampleCustomBranding);
  console.log('Resultado da gravação:', saveRes);
  if (!saveRes.success) {
    console.error('❌ Erro ao gravar logotipo no Supabase:', saveRes.error);
    process.exit(1);
  }
  console.log('✅ Logotipo gravado com sucesso no Supabase.');

  // 3. Test Loading System Logo from Supabase
  console.log('\n[3/4] Carregando Logotipo Master do AgroSys diretamente do Supabase...');
  const loadedBranding = await loadSystemBrandingFromSupabase();
  console.log('Branding recuperado do Supabase:', loadedBranding);

  if (!loadedBranding) {
    console.error('❌ Falha: loadSystemBrandingFromSupabase retornou null');
    process.exit(1);
  }

  // Assertions
  if (loadedBranding.systemName !== sampleCustomBranding.systemName) {
    console.error(`❌ Incompatibilidade em systemName: esperado "${sampleCustomBranding.systemName}", obtido "${loadedBranding.systemName}"`);
    process.exit(1);
  }
  if (loadedBranding.logoIconId !== sampleCustomBranding.logoIconId) {
    console.error(`❌ Incompatibilidade em logoIconId: esperado "${sampleCustomBranding.logoIconId}", obtido "${loadedBranding.logoIconId}"`);
    process.exit(1);
  }
  if (!loadedBranding.logoUrl || !loadedBranding.logoUrl.startsWith('data:image/png')) {
    console.error('❌ Incompatibilidade em logoUrl: esperado Data URL');
    process.exit(1);
  }
  console.log('✅ Todas as asserções de dados e persistência foram validadas com 100% de precisão!');

  // 4. Test Restoration to Default Official Logo
  console.log('\n[4/4] Restaurando Logotipo Oficial Padrão do AgroSys no Supabase...');
  const resetRes = await saveSystemBrandingToSupabase(DEFAULT_AGROSYS_SYSTEM_BRANDING);
  if (!resetRes.success) {
    console.error('❌ Erro ao restaurar padrão:', resetRes.error);
    process.exit(1);
  }
  const verifiedDefault = await loadSystemBrandingFromSupabase();
  console.log('Logotipo padrão verificado após restauração:', verifiedDefault?.systemName, verifiedDefault?.logoIconId);

  console.log('\n===============================================================');
  console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!');
  console.log('===============================================================');
}

runTest().catch((err) => {
  console.error('Erro fatal:', err);
  process.exit(1);
});
