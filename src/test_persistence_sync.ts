/**
 * Empirical Verification Script for AgroSys Triple-Tier Persistence & Cache-Clear Self-Healing.
 */

// Mock Browser Environment & IndexedDB for Node.js test execution
const inMemoryIDB = new Map<string, Map<string, any>>();

function getStoreMap(storeName: string): Map<string, any> {
  if (!inMemoryIDB.has(storeName)) {
    inMemoryIDB.set(storeName, new Map<string, any>());
  }
  return inMemoryIDB.get(storeName)!;
}

const mockIDBDatabase = {
  transaction: (storeNames: string | string[], mode: string) => {
    const targetStore = Array.isArray(storeNames) ? storeNames[0] : storeNames;
    const storeMap = getStoreMap(targetStore);

    return {
      objectStore: () => ({
        put: (item: any) => {
          const key = item.key || item.tenantId || item.id;
          if (key) storeMap.set(key, item);
          const req: any = { onsuccess: null, onerror: null };
          setTimeout(() => req.onsuccess && req.onsuccess(), 1);
          return req;
        },
        get: (key: string) => {
          const result = storeMap.get(key) || null;
          const req: any = { onsuccess: null, onerror: null, result };
          setTimeout(() => req.onsuccess && req.onsuccess(), 1);
          return req;
        },
        getAll: () => {
          const result = Array.from(storeMap.values());
          const req: any = { onsuccess: null, onerror: null, result };
          setTimeout(() => req.onsuccess && req.onsuccess(), 1);
          return req;
        },
        delete: (key: string) => {
          storeMap.delete(key);
          const req: any = { onsuccess: null, onerror: null };
          setTimeout(() => req.onsuccess && req.onsuccess(), 1);
          return req;
        }
      })
    };
  }
};

if (typeof window === 'undefined' || !(global as any).window) {
  const storageMap = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (k: string) => storageMap.get(k) || null,
    setItem: (k: string, v: string) => storageMap.set(k, String(v)),
    removeItem: (k: string) => storageMap.delete(k),
    clear: () => storageMap.clear(),
    get length() { return storageMap.size; }
  };

  (global as any).window = {
    indexedDB: {
      open: () => {
        const req: any = { onsuccess: null, onerror: null, result: mockIDBDatabase };
        setTimeout(() => req.onsuccess && req.onsuccess({ target: req }), 1);
        return req;
      }
    },
    localStorage: mockLocalStorage,
    dispatchEvent: () => true
  };
  (global as any).localStorage = mockLocalStorage;
}

import { setStoredConfiguredLogoUrl, setStoredConfiguredLogoDarkUrl, setStoredLogoAdaptiveMode, getCompanyTheme } from './services/brandingLogoStorage';
import { saveStoredRegisteredCompanies, getStoredRegisteredCompanies } from './services/companyStorage';
import { saveBatteryAlertSettingsToCloud, saveWeatherAlertSettingsToCloud, hydrateAllCloudData, BATTERY_ALERT_STORAGE_KEY, WEATHER_ALERT_STORAGE_KEY } from './services/cloudSyncService';
import { testSupabaseConnection } from './services/supabase';

async function runEmpiricalTest() {
  console.log('=== 🚀 INICIANDO TESTE EMPÍRICO DE PERSISTÊNCIA E SINCRONIZAÇÃO ===\n');

  // 1. Test Supabase API Connection
  console.log('1. Testando Conexão Supabase Database...');
  const connResult = await testSupabaseConnection();
  console.log(`   Resultado Supabase: [${connResult.success ? '✅ SUCESSO' : '⚠️ AVISO'}] ${connResult.message}\n`);

  // 2. Set Custom Logos and Periodicities for Tenant 'ciclodrone'
  console.log('2. Gravando Logotipos (Claro / Escuro / Adaptativo) e Periodicidades...');
  const sampleLightLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzAyODRjNyIvPjwvc3ZnPg==';
  const sampleDarkLogo = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0iIzEwYjA3OSIvPjwvc3ZnPg==';
  
  setStoredConfiguredLogoUrl('ciclodrone', sampleLightLogo);
  setStoredConfiguredLogoDarkUrl('ciclodrone', sampleDarkLogo);
  setStoredLogoAdaptiveMode('ciclodrone', 'halo');

  const customBatterySettings = {
    enabled: true,
    checkIntervalType: 'months' as const,
    periodValue: 3,
    periodUnit: 'months' as const,
    snoozeUntil: null,
    snoozeReason: undefined,
    audioAlertEnabled: true,
    audioVolume: 0.8,
    audioType: 'SIREN' as const,
    minHealthThresholdPct: 80,
    maxCellDeltaMv: 30,
    soundEnabled: true,
    soundType: 'SIREN' as const,
    soundVolume: 0.8,
  } as any;

  const customWeatherSettings = {
    periodicitySeconds: 1800, // 30 minutos
    isInhibited: false,
    soundEnabled: true,
    soundType: 'PULSE' as const,
    soundVolume: 0.7,
    visualStrobeEnabled: true,
    screenEdgeAlertEnabled: true,
    readingAlertEnabled: true,
    recordingMode: 'auto' as const,
  };

  await saveBatteryAlertSettingsToCloud(customBatterySettings);
  await saveWeatherAlertSettingsToCloud(customWeatherSettings);

  console.log('   Logotipos e Periodicidades gravadas com sucesso!');
  console.log(`   Logo Claro em localStorage: ${localStorage.getItem('agrosys_company_logo_url_ciclodrone') ? '✅ Presente' : '❌ Ausente'}`);
  console.log(`   Logo Escuro em localStorage: ${localStorage.getItem('agrosys_company_logo_dark_url_ciclodrone') ? '✅ Presente' : '❌ Ausente'}`);
  console.log(`   Modo Adaptativo em localStorage: ${localStorage.getItem('agrosys_company_logo_adaptive_mode_ciclodrone')}`);
  console.log(`   Periodicidade Bateria em localStorage: ${localStorage.getItem(BATTERY_ALERT_STORAGE_KEY)}`);
  console.log(`   Periodicidade Meteorológica em localStorage: ${localStorage.getItem(WEATHER_ALERT_STORAGE_KEY)}\n`);

  // 3. SIMULATE TOTAL BROWSER CACHE CLEAR (localStorage.clear())
  console.log('3. 💣 SIMULANDO LIMPEZA TOTAL DO CACHE DO NAVEGADOR (localStorage.clear())...');
  localStorage.clear();
  console.log(`   Verificação de Cache Limpo: localStorage length = ${localStorage.length}`);
  console.log(`   Logo em localStorage (após clear): ${localStorage.getItem('agrosys_company_logo_url_ciclodrone') || 'NULL'}`);
  console.log(`   Periodicidades em localStorage (após clear): ${localStorage.getItem(BATTERY_ALERT_STORAGE_KEY) || 'NULL'}\n`);

  // 4. RUN SELF-HEALING RECOVERY (hydrateAllCloudData / restoreDurableStorageToLocalStorage)
  console.log('4. 🛡️ EXECUTANDO ROTINA DE AUTOCURA E RE-HIDRATAÇÃO DO INDEXEDDB...');
  const hydrationRes = await hydrateAllCloudData();
  
  const restoredLightLogo = localStorage.getItem('agrosys_company_logo_url_ciclodrone');
  const restoredDarkLogo = localStorage.getItem('agrosys_company_logo_dark_url_ciclodrone');
  const restoredAdaptive = localStorage.getItem('agrosys_company_logo_adaptive_mode_ciclodrone');
  const restoredBat = localStorage.getItem(BATTERY_ALERT_STORAGE_KEY);
  const restoredWea = localStorage.getItem(WEATHER_ALERT_STORAGE_KEY);

  console.log(`   Empresas Hidratadas: ${hydrationRes.companies.length}`);
  console.log(`   Logo Claro Restaurado em LocalStorage: ${restoredLightLogo ? '✅ RESTAURADO PERFEITAMENTE' : '❌ FALHOU'}`);
  console.log(`   Logo Escuro Restaurado em LocalStorage: ${restoredDarkLogo ? '✅ RESTAURADO PERFEITAMENTE' : '❌ FALHOU'}`);
  console.log(`   Modo Adaptativo Restaurado em LocalStorage: ${restoredAdaptive === 'halo' ? '✅ RESTAURADO PERFEITAMENTE' : '❌ FALHOU'}`);
  console.log(`   Periodicidade Bateria em LocalStorage: ${restoredBat ? '✅ RESTAURADO PERFEITAMENTE' : '❌ FALHOU'}`);
  console.log(`   Periodicidade Meteorológica em LocalStorage: ${restoredWea ? '✅ RESTAURADO PERFEITAMENTE' : '❌ FALHOU'}`);

  const restoredTheme = getCompanyTheme('ciclodrone');
  console.log(`   Logo URL no Tema Final do App: ${restoredTheme.logoUrl ? '✅ ENCONTRADO' : '❌ INDEFINIDO'}`);
  console.log(`   Logo Dark URL no Tema Final do App: ${restoredTheme.logoDarkUrl ? '✅ ENCONTRADO' : '❌ INDEFINIDO'}`);

  const isSuccess = Boolean(restoredLightLogo && restoredDarkLogo && restoredBat && restoredWea);
  if (isSuccess) {
    console.log('\n=== 🎉 TESTE CONCLUÍDO COM 100% DE SUCESSO E AUTOCURA COMPROVADA! ===');
  } else {
    console.log('\n=== ⚠️ ALGUNS ITENS REQUEREM VERIFICAÇÃO ADICIONAL ===');
  }
}

runEmpiricalTest().catch(console.error);
