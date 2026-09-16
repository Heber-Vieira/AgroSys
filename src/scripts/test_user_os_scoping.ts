/**
 * Automated Verification Script for Pilot & Assistant Service Order Scoping
 */
import { USER_PROFILES, INITIAL_ORDERS, INITIAL_PILOTS, INITIAL_ASSISTANTS } from '../data/mockAppState';
import { 
  normalizePersonName, 
  doNamesMatch, 
  isServiceOrderAssignedToUser, 
  filterOrdersForUser 
} from '../utils/userPermissions';

console.log('================================================================');
console.log('🧪 TEST SUITE: ISOLAÇÃO DE ORDENS DE SERVIÇO POR PILOTO E AUXILIAR');
console.log('================================================================\n');

// 1. Test Name Normalization & Matching
console.log('1. Testando Normalização e Comparação de Nomes:');
const nameCases = [
  { a: 'Cmdt. Renan Valério', b: 'Renan Valerio', expected: true },
  { a: 'Cmdt. Renan Valério', b: 'Cmdt. Diego Santos', expected: false },
  { a: 'Rodrigo Albuquerque', b: 'Rodrigo Alcantara', expected: false },
  { a: 'Lucas Mendes', b: 'Lucas Mendes', expected: true },
  { a: 'Piloto Gabriel Mendonça', b: 'Gabriel Mendonca', expected: true },
  { a: 'Carlos Eduardo Ramos', b: 'Carlos Eduardo Ramos', expected: true },
];

let failedNameTests = 0;
for (const tc of nameCases) {
  const match = doNamesMatch(tc.a, tc.b);
  const pass = match === tc.expected;
  if (!pass) failedNameTests++;
  console.log(`   [${pass ? '✅ PASS' : '❌ FAIL'}] "${tc.a}" vs "${tc.b}" -> Got: ${match}, Expected: ${tc.expected}`);
}

if (failedNameTests > 0) {
  console.error(`\n❌ ${failedNameTests} testes de nome falharam!`);
  process.exit(1);
}

// 2. Test User Profiles Scope
console.log('\n2. Testando Filtragem de OS por Usuário e Cargo:');

// Pilots
const pilotRenan = USER_PROFILES.find(u => u.email === 'renan.piloto@ciclodrone.com.br')!;
const pilotDiego = USER_PROFILES.find(u => u.email === 'diego.piloto@aeroagro.com.br')!;
const pilotRodrigo = USER_PROFILES.find(u => u.email === 'rodrigo.piloto@aeroagro.com.br')!;

// Assistants
const assistantLucas = USER_PROFILES.find(u => u.email === 'lucas.calda@aeroagro.com.br')!;
const assistantCarlos = USER_PROFILES.find(u => u.email === 'carlos.calda@aeroagro.com.br')!;
const assistantRodrigo = USER_PROFILES.find(u => u.email === 'rodrigo.calda@ciclodrone.com.br')!;

// Admins & Master
const adminUser = USER_PROFILES.find(u => u.role === 'ADMIN')!;
const masterUser = USER_PROFILES.find(u => u.role === 'MASTER')!;

console.log(`- Total de OS no mockAppState: ${INITIAL_ORDERS.length}`);

// Test Renan (Pilot - Ciclodrone)
const ordersRenan = filterOrdersForUser(INITIAL_ORDERS, pilotRenan, INITIAL_PILOTS, INITIAL_ASSISTANTS);
console.log(`\n👨‍✈️ Piloto Renan Valério (${ordersRenan.length} OSs visualizadas):`);
ordersRenan.forEach(o => console.log(`   - ${o.code} | Piloto: ${o.pilotName} | Auxiliar: ${o.assistantName} | Status: ${o.status}`));
const renanHasForeign = ordersRenan.some(o => !doNamesMatch(o.pilotName, pilotRenan.name) && o.pilotId !== 'pilot-ciclo-1');
if (renanHasForeign || ordersRenan.length === 0) {
  console.error('❌ Piloto Renan visualizou OS de outro piloto ou nenhuma OS!');
  process.exit(1);
}

// Test Diego (Pilot - AeroAgro)
const ordersDiego = filterOrdersForUser(INITIAL_ORDERS, pilotDiego, INITIAL_PILOTS, INITIAL_ASSISTANTS);
console.log(`\n👨‍✈️ Piloto Diego Santos (${ordersDiego.length} OSs visualizadas):`);
ordersDiego.forEach(o => console.log(`   - ${o.code} | Piloto: ${o.pilotName} | Auxiliar: ${o.assistantName} | Status: ${o.status}`));
const diegoHasForeign = ordersDiego.some(o => !doNamesMatch(o.pilotName, pilotDiego.name) && o.pilotId !== 'pilot-1');
if (diegoHasForeign) {
  console.error('❌ Piloto Diego Santos visualizou OS de terceiros!');
  process.exit(1);
}

// Test Rodrigo Alcantara (Pilot - AeroAgro)
const ordersRodrigo = filterOrdersForUser(INITIAL_ORDERS, pilotRodrigo, INITIAL_PILOTS, INITIAL_ASSISTANTS);
console.log(`\n👨‍✈️ Piloto Rodrigo Alcantara (${ordersRodrigo.length} OSs visualizadas):`);
ordersRodrigo.forEach(o => console.log(`   - ${o.code} | Piloto: ${o.pilotName} | Auxiliar: ${o.assistantName} | Status: ${o.status}`));

// Test Lucas Mendes (Assistant - AeroAgro)
const ordersLucas = filterOrdersForUser(INITIAL_ORDERS, assistantLucas, INITIAL_PILOTS, INITIAL_ASSISTANTS);
console.log(`\n👷 Auxiliar Lucas Mendes (${ordersLucas.length} OSs visualizadas):`);
ordersLucas.forEach(o => console.log(`   - ${o.code} | Piloto: ${o.pilotName} | Auxiliar: ${o.assistantName} | Status: ${o.status}`));
const lucasHasForeign = ordersLucas.some(o => !doNamesMatch(o.assistantName, assistantLucas.name));
if (lucasHasForeign || ordersLucas.length === 0) {
  console.error('❌ Auxiliar Lucas Mendes visualizou OS sem seu nome como auxiliar!');
  process.exit(1);
}

// Test Carlos Eduardo Ramos (Assistant - AeroAgro)
const ordersCarlos = filterOrdersForUser(INITIAL_ORDERS, assistantCarlos, INITIAL_PILOTS, INITIAL_ASSISTANTS);
console.log(`\n👷 Auxiliar Carlos Eduardo Ramos (${ordersCarlos.length} OSs visualizadas):`);
ordersCarlos.forEach(o => console.log(`   - ${o.code} | Piloto: ${o.pilotName} | Auxiliar: ${o.assistantName} | Status: ${o.status}`));
const carlosHasForeign = ordersCarlos.some(o => !doNamesMatch(o.assistantName, assistantCarlos.name));
if (carlosHasForeign || ordersCarlos.length === 0) {
  console.error('❌ Auxiliar Carlos Ramos visualizou OS indevida!');
  process.exit(1);
}

// Test Admin / Master Scope
const ordersAdmin = filterOrdersForUser(INITIAL_ORDERS, adminUser, INITIAL_PILOTS, INITIAL_ASSISTANTS);
const ordersMaster = filterOrdersForUser(INITIAL_ORDERS, masterUser, INITIAL_PILOTS, INITIAL_ASSISTANTS);
console.log(`\n👑 Admin (${ordersAdmin.length} OSs) e Master (${ordersMaster.length} OSs) possuem visão gerencial completa.`);

if (ordersAdmin.length <= ordersDiego.length || ordersMaster.length !== INITIAL_ORDERS.length) {
  console.error('❌ Admin/Master não obteve visibilidade ampla!');
  process.exit(1);
}

console.log('\n================================================================');
console.log('✅ TODOS OS TESTES DE ESCOPO E ISOLAÇÃO DE OS FORAM APROVADOS COM SUCESSO!');
console.log('================================================================');
