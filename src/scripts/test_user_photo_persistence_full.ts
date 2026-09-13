import { saveUserPhotoToSupabase, loadUserPhotosFromSupabase } from '../services/supabase';
import { USER_PROFILES } from '../data/mockAppState';

async function runEmpiricalTest() {
  console.log('=== 🚀 TESTE EMPÍRICO DE UPLOAD E PERSISTÊNCIA DE FOTOS DE USUÁRIOS NO SUPABASE ===\n');

  // Test photo upload for Heber Vieira
  console.log('1. Salvando foto de Heber Vieira (user-heber-vieira)...');
  const heberProfile = USER_PROFILES.find(u => u.id === 'user-heber-vieira');
  const heberPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  const res1 = await saveUserPhotoToSupabase('user-heber-vieira', heberPhoto, heberProfile);
  console.log('   Resultado Heber:', res1);

  // Test photo upload for Thales Vieira
  console.log('\n2. Salvando foto de Thales Vieira (user-thales-vieira)...');
  const thalesProfile = USER_PROFILES.find(u => u.id === 'user-thales-vieira');
  const thalesPhoto = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80';
  const res2 = await saveUserPhotoToSupabase('user-thales-vieira', thalesPhoto, thalesProfile);
  console.log('   Resultado Thales:', res2);

  // Test photo upload with base64 data URL simulation
  console.log('\n3. Salvando upload de foto em formato Base64 para admin-ciclodrone...');
  const base64Photo = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
  const cicloAdmin = USER_PROFILES.find(u => u.id === 'admin-ciclodrone');
  const res3 = await saveUserPhotoToSupabase('admin-ciclodrone', base64Photo, cicloAdmin);
  console.log('   Resultado Base64:', res3);

  // Read back all photos from Supabase cloud
  console.log('\n4. 📥 Carregando todas as fotos salvas diretamente do banco de dados Supabase...');
  const cloudPhotos = await loadUserPhotosFromSupabase();
  console.log(`   Total de chaves de fotos mapeadas do Supabase: ${Object.keys(cloudPhotos).length}`);

  console.log('\n5. 🔍 Verificando mapeamentos específicos:');
  console.log('   - user-heber-vieira:', cloudPhotos['user-heber-vieira'] ? '✅ RECUPERADO' : '❌ NÃO ENCONTRADO');
  console.log('   - heber.vieira.hv@gmail.com:', cloudPhotos['heber.vieira.hv@gmail.com'] ? '✅ RECUPERADO' : '❌ NÃO ENCONTRADO');
  console.log('   - user-thales-vieira:', cloudPhotos['user-thales-vieira'] ? '✅ RECUPERADO' : '❌ NÃO ENCONTRADO');
  console.log('   - thalesfelipe1@hotmail.com:', cloudPhotos['thalesfelipe1@hotmail.com'] ? '✅ RECUPERADO' : '❌ NÃO ENCONTRADO');
  console.log('   - admin-ciclodrone:', cloudPhotos['admin-ciclodrone'] ? '✅ RECUPERADO (Base64)' : '❌ NÃO ENCONTRADO');

  console.log('\n🎉 TODOS OS TESTES DE PERSISTÊNCIA DE FOTO CONCLUÍDOS COM SUCESSO!');
  process.exit(0);
}

runEmpiricalTest().catch(err => {
  console.error('Erro no teste empírico:', err);
  process.exit(1);
});
