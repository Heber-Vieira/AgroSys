import { saveUserPhotoToSupabase, loadUserPhotosFromSupabase, resolveUserData } from '../services/supabase';
import { getUserPhotoUrl, saveStoredUserPhoto, getStoredUserPhotos } from '../components/UserAvatar';
import { USER_PROFILES, INITIAL_PILOTS, INITIAL_ASSISTANTS } from '../data/mockAppState';

async function runEndToEndVerification() {
  console.log('================================================================');
  console.log('🚀 TESTE DE PONTA A PONTA: SINCRONIZAÇÃO E PERSISTÊNCIA DE FOTOS');
  console.log('================================================================\n');

  // Test 1: Resolve User Data
  console.log('1. Testando resolução automática de dados de usuário...');
  const resolvedHeber = resolveUserData('user-heber-vieira');
  console.log('   - Heber resolvido:', { name: resolvedHeber.name, email: resolvedHeber.email, role: resolvedHeber.role });
  if (resolvedHeber.name !== 'Heber Vieira' || resolvedHeber.email !== 'heber.vieira.hv@gmail.com') {
    throw new Error('Falha ao resolver Heber Vieira');
  }

  const resolvedPilot = resolveUserData('pilot-ciclo-1');
  console.log('   - Piloto Renan resolvido:', { name: resolvedPilot.name, doc: resolvedPilot.documentNumber, role: resolvedPilot.role });
  if (resolvedPilot.name !== 'Cmdt. Renan Valério') {
    throw new Error('Falha ao resolver piloto');
  }
  console.log('   ✅ Resolução de identidades OK!\n');

  // Test 2: Save Photos to Supabase
  console.log('2. Testando gravação no banco Supabase (user_profiles + tenants)...');
  const customHeberPhoto = 'https://images.unsplash.com/photo-1534528741775-customheber?q=80';
  const customPilotPhoto = 'https://images.unsplash.com/photo-1507003211169-custompilot?q=80';

  const res1 = await saveUserPhotoToSupabase('user-heber-vieira', customHeberPhoto);
  console.log('   - Gravação Heber:', res1);
  if (!res1.success) throw new Error('Falha ao salvar foto do Heber no Supabase');

  const res2 = await saveUserPhotoToSupabase('pilot-ciclo-1', customPilotPhoto);
  console.log('   - Gravação Piloto Renan:', res2);
  if (!res2.success) throw new Error('Falha ao salvar foto do Piloto no Supabase');

  console.log('   ✅ Gravação no Supabase DB OK!\n');

  // Test 3: Load Photos from Supabase
  console.log('3. Testando carregamento e indexação cruzada do banco de dados...');
  const cloudMap = await loadUserPhotosFromSupabase();
  console.log(`   - Total de chaves mapeadas no banco: ${Object.keys(cloudMap).length}`);

  const loadedHeber = cloudMap['user-heber-vieira'] || cloudMap['heber.vieira.hv@gmail.com'];
  console.log('   - Foto recuperada de Heber:', loadedHeber);
  if (loadedHeber !== customHeberPhoto) {
    throw new Error(`Foto do Heber não confere. Esperado: ${customHeberPhoto}, Obtido: ${loadedHeber}`);
  }

  const loadedPilot = cloudMap['pilot-ciclo-1'] || cloudMap['Cmdt. Renan Valério'] || cloudMap['334.881.992-05'];
  console.log('   - Foto recuperada do Piloto:', loadedPilot);
  if (loadedPilot !== customPilotPhoto) {
    throw new Error(`Foto do Piloto não confere. Esperado: ${customPilotPhoto}, Obtido: ${loadedPilot}`);
  }
  console.log('   ✅ Recuperação de dados do banco OK!\n');

  // Test 4: Priority in getUserPhotoUrl
  console.log('4. Testando precedência em getUserPhotoUrl (Stored vs Mock)...');
  // Mock localStorage with cloudMap
  (global as any).localStorage = {
    _data: { 'agrodrone_user_custom_photos': JSON.stringify(cloudMap) },
    getItem(k: string) { return this._data[k] || null; },
    setItem(k: string, v: string) { this._data[k] = v; },
    removeItem(k: string) { delete this._data[k]; }
  };

  const heberResolved = getUserPhotoUrl({
    userId: 'user-heber-vieira',
    name: 'Heber Vieira',
    email: 'heber.vieira.hv@gmail.com',
    photoUrl: 'https://images.unsplash.com/photo-old-mock-should-be-ignored',
  });
  console.log('   - URL resolvida para Heber:', heberResolved);
  if (heberResolved !== customHeberPhoto) {
    throw new Error(`Falha de precedência: ${heberResolved} não corresponde à foto do banco ${customHeberPhoto}`);
  }

  console.log('   ✅ Precedência validada: Foto sincronizada do banco SOBREPÕE o mock antigo com sucesso!\n');

  console.log('================================================================');
  console.log('🎉 SUCESSO ABSOLUTO: Todas as fotos de usuários sincronizadas!');
  console.log('================================================================');
}

runEndToEndVerification().catch(err => {
  console.error('❌ ERRO NO TESTE:', err);
  process.exit(1);
});
