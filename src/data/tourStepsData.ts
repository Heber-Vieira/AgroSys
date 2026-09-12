import { TourStep } from '../types';

export const TOUR_STEPS: TourStep[] = [
  {
    stepIndex: 1,
    id: 'step-scheduling-crew',
    title: '1. Agendamento & Alocação da Tríade Operacional',
    role: 'DISPATCHER',
    targetElementId: 'os-triad-card',
    badge: 'Field Service',
    description: 'Nesta etapa, o despachante seleciona o produtor, a fazenda e o talhão mapeado no PostGIS. A inteligência operacional aloca a tríade mandatória: Drone (prefixo ANAC), Piloto Remoto credenciado DECEA e Ajudante de Solo.',
    actionRequired: 'CLICK',
    tipText: 'A alocação verifica automaticamente se o Piloto possui CMA e certidão DECEA vigentes, e se o Drone está com plano de manutenção em dia.'
  },
  {
    stepIndex: 2,
    id: 'step-spray-mix-calculation',
    title: '2. Preparo de Calda & Ordem de Mistura Segura',
    role: 'PILOT',
    targetElementId: 'spray-mix-card',
    badge: 'Receituário & Calda',
    description: 'A calculadora de calda processa a taxa de aplicação (L/ha) x área do talhão. Determina o número exato de tanques e a sequência agronômica estrita de adição dos insumos para evitar precipitação ou incompatibilidade física.',
    actionRequired: 'INPUT_CHECK',
    tipText: 'Sequência mandatória: 1º Condicionador de água, 2º Grânulos dispersíveis (WP/WG), 3º Suspensões concentradas (SC), 4º Concentrados emulsionáveis (EC) e 5º Adjuvantes.'
  },
  {
    stepIndex: 3,
    id: 'step-weather-gate',
    title: '3. Checagem Climática Impeditiva & Delta T',
    role: 'PILOT',
    targetElementId: 'weather-hud-card',
    badge: 'Segurança de Voo',
    description: 'Antes da decolagem, o piloto afere temperatura, umidade e vento. O sistema calcula o Delta T psicrométrico. Se o vento for > 15 km/h ou Delta T > 8°C (alto risco de deriva e evaporação de microgotas), a decolagem é bloqueada pelo sistema.',
    actionRequired: 'APPROVE',
    tipText: 'Faixa ideal de pulverização com drone: Delta T entre 2°C e 8°C, vento entre 3 e 10 km/h e UR acima de 55%.'
  },
  {
    stepIndex: 4,
    id: 'step-telemetry-import',
    title: '4. Telemetria do Drone (Log DJI / XAG)',
    role: 'PILOT',
    targetElementId: 'telemetry-card',
    badge: 'Auditoria de Voo',
    description: 'Após a operação, o log de voo é importado. O motor geoespacial compara a malha pulverizada real com o polígono planejado do talhão, apurando a área efetiva (ha), sobreposição, tempo de voo e ciclos de bateria.',
    actionRequired: 'CLICK',
    tipText: 'Compatível com logs nativos DJI Agriculture (.dat / .kml) e XAG Flight Cloud, garantindo auditoria anti-fraude.'
  },
  {
    stepIndex: 5,
    id: 'step-technical-closure',
    title: '5. Validação Técnica & Logística Reversa de Embalagens',
    role: 'PILOT',
    targetElementId: 'closure-signature-card',
    badge: 'Checklist Final',
    description: 'O piloto assina digitalmente a OS, confirma a contagem de embalagens vazias recolhidas para o descarte ecológico obrigatório (InpEV) e submete a OS para faturamento imediato.',
    actionRequired: 'APPROVE',
    tipText: 'O registro de devolução de embalagens vazias atende às normas ambientais e do MAPA para aeroagrícola.'
  },
  {
    stepIndex: 6,
    id: 'step-automatic-billing',
    title: '6. Faturamento Automático & Rateio de Comissões',
    role: 'FINANCIAL_ADMIN',
    targetElementId: 'financial-billing-card',
    badge: 'Fechamento Financeiro',
    description: 'O motor financeiro aplica a Matriz de Precificação configurada (R$/ha base x multiplicador de declive - descontos de escala). Instantaneamente gera o Contas a Receber do produtor e apura a comissão líquida do Piloto e do Ajudante no Contas a Pagar.',
    actionRequired: 'READ',
    tipText: 'Totalmente automatizado! O fluxo de caixa é atualizado em tempo real sem retrabalho de planilhas.'
  }
];

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  completedSteps: number[];
  selectedRole: 'PILOT' | 'DISPATCHER' | 'FINANCIAL_ADMIN' | 'ALL';
  isDismissed: boolean;
}
