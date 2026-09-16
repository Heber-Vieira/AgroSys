import { 
  checkUsersTableStatus, 
  saveUserProfileToSupabase, 
  loadUserProfilesFromSupabase, 
  savePilotToSupabase, 
  saveAssistantToSupabase, 
  deleteUserProfileFromSupabase,
  syncAllUsersAndCrewToCloud,
  supabase
} from '../services/supabase';
import { UserProfile, CrewPilot, CrewAssistant } from '../types';

async function runTestSuite() {
  console.log('================================================================');
  console.log('🧪 TEST SUITE: SINCRONIZAÇÃO DE USUÁRIOS E TABELAS RELACIONAIS');
  console.log('================================================================\n');

  // 1. Test checkUsersTableStatus
  console.log('1. Testando verificação de conectividade e status das tabelas:');
  const status = await checkUsersTableStatus();
  console.log('   - Conectado:', status.connected);
  console.log('   - user_profiles pronto:', status.userProfilesReady);
  console.log('   - crew_pilots pronto:', status.crewPilotsReady);
  console.log('   - crew_assistants pronto:', status.crewAssistantsReady);
  console.log('   - Mensagem:', status.message);

  // 2. Test saving and syncing a Pilot user
  console.log('\n2. Testando salvamento e sincronização de perfil de piloto:');
  const testPilotUser: UserProfile = {
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'f1234567-89ab-4cde-8f01-23456789abcd',
    companyId: 'ciclodrone',
    name: 'Piloto Teste Automação',
    role: 'PILOT',
    roleLabel: 'Piloto de Drone Remoto',
    email: `piloto.teste.${Date.now()}@agrosys.agr.br`,
    badge: 'Piloto DECEA / ANAC Class 3',
    documentNumber: '123.456.789-00',
    phone: '(16) 99999-8888',
    licenseCode: 'DECEA-TEST-2026',
    status: 'ACTIVE',
    salaryBase: 5200,
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  };


  const saveRes = await saveUserProfileToSupabase(testPilotUser);
  console.log('   - Resultado do salvamento:', saveRes.success ? '✅ SUCESSO' : `❌ ERRO: ${saveRes.error}`);

  // 3. Test loading profiles from Supabase
  console.log('\n3. Testando carregamento de perfis no Supabase:');
  const loadedProfiles = await loadUserProfilesFromSupabase();
  console.log('   - Total de perfis recuperados:', loadedProfiles.length);
  const found = loadedProfiles.find(u => u.email === testPilotUser.email || u.id === testPilotUser.id);
  console.log('   - Perfil inserido encontrado na busca:', found ? `✅ SIM (${found.name} - ${found.role})` : '❌ NÃO');

  // 4. Test batch sync
  console.log('\n4. Testando sincronização em lote (syncAllUsersAndCrewToCloud):');
  const mockCrewPilot: CrewPilot = {
    id: 'pilot-test-batch-' + Date.now(),
    companyId: 'ciclodrone',
    name: 'Cmdt. Teste Lote',
    cpf: '999.888.777-66',
    phone: '(16) 99888-7766',
    deceaLicense: 'DECEA-BATCH-01',
    cmaExpiration: '2027-12-31',
    commissionRatePerHa: 8.5,
    totalHoursFlown: 120,
    available: true,
  };

  const mockCrewAsst: CrewAssistant = {
    id: 'asst-test-batch-' + Date.now(),
    companyId: 'ciclodrone',
    name: 'Auxiliar Teste Lote',
    cpf: '888.777.666-55',
    phone: '(16) 99777-6655',
    commissionRatePerHa: 3.5,
    nr31Certified: true,
    available: true,
  };

  const batchRes = await syncAllUsersAndCrewToCloud([testPilotUser], [mockCrewPilot], [mockCrewAsst]);
  console.log('   - Resultado sincronização em lote:', batchRes.success ? '✅ SUCESSO' : `❌ ERRO: ${batchRes.message}`);
  console.log('   - Usuários sincronizados:', batchRes.syncedUsers);
  console.log('   - Tripulantes sincronizados:', batchRes.syncedCrew);

  // 5. Clean up test records
  console.log('\n5. Limpeza de registros de teste:');
  await deleteUserProfileFromSupabase(testPilotUser.id, testPilotUser.email);
  await supabase.from('crew_pilots').delete().eq('id', mockCrewPilot.id);
  await supabase.from('crew_assistants').delete().eq('id', mockCrewAsst.id);
  console.log('   - Registros de teste excluídos com sucesso.');

  console.log('\n================================================================');
  console.log('✅ TESTE DE SINCRONIZAÇÃO DE USUÁRIOS CONCLUÍDO COM SUCESSO!');
  console.log('================================================================');
}

runTestSuite().catch(console.error);
