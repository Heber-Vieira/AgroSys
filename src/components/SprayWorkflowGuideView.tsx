import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  CloudSun, 
  Calendar, 
  ClipboardList, 
  FlaskConical, 
  Plane, 
  FileCheck2, 
  Wallet, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  Check, 
  Play, 
  RotateCcw, 
  Layers, 
  Sliders, 
  Compass, 
  Clock, 
  TrendingUp, 
  HelpCircle,
  Eye,
  Award,
  Workflow,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  AppViewMode, 
  UserProfile, 
  WhiteLabelTheme, 
  ServiceOrder, 
  FarmPlot, 
  AgriculturalDrone, 
  SprayQuotation, 
  FinancialEntry 
} from '../types';
import { formatCurrency, formatInteger, formatDecimal } from '../utils/formatters';

interface SprayWorkflowGuideViewProps {
  currentUser: UserProfile;
  theme: WhiteLabelTheme;
  orders?: ServiceOrder[];
  plots?: FarmPlot[];
  drones?: AgriculturalDrone[];
  quotations?: SprayQuotation[];
  financials?: FinancialEntry[];
  onNavigate: (view: AppViewMode) => void;
  onOpenNewOS?: () => void;
  onOpenReportModal?: (orderId?: string) => void;
}

export interface WorkflowStep {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  category: 'onboarding' | 'comercial' | 'planejamento' | 'campo' | 'fechamento';
  categoryLabel: string;
  icon: React.ElementType;
  targetView: AppViewMode;
  actionButtonLabel: string;
  actionType?: 'navigate' | 'modal_os' | 'modal_report';
  estimatedDuration: string;
  regulatoryRequirement: string;
  summary: string;
  checklistItems: string[];
  operationalTips: string[];
  keyParameters: { label: string; value: string; hint: string }[];
  fieldSafetyRules: string[];
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    slug: 'cadastro-empresa',
    title: '1. Credenciamento da Empresa & Frota',
    subtitle: 'Estruturação jurídica, Responsabilidade Técnica e ativos aéreos',
    category: 'onboarding',
    categoryLabel: 'Estruturação & Frota',
    icon: Building2,
    targetView: 'fleet',
    actionButtonLabel: 'Gerenciar Frota & Pilotos',
    estimatedDuration: 'Configuração Inicial',
    regulatoryRequirement: 'MAPA/SDA Portaria 298/2021 & ANAC RBAC-E 94',
    summary: 'Cadastro formal da operadora aeroagrícola com registro no MAPA/SDA, anotação da ART de Cargo/Função no CREA pelo Responsável Técnico (Eng. Agrônomo) e registro da frota de drones.',
    checklistItems: [
      'Registro da empresa ativo no MAPA / SDA',
      'Responsável Técnico (Eng. Agrônomo) com ART CREA emitida',
      'Cadastro de Drones com prefixo ANAC / SISANT e homologação Anatel',
      'Pilotos remotos habilitados com CAER / Certificado de Piloto Remoto',
      'Baterias etiquetadas e cadastradas com controle de ciclos de carga'
    ],
    operationalTips: [
      'Mantenha as certidões do CREA e registro MAPA atualizados nas configurações da marca.',
      'Defina os limites de ciclos de recarga das baterias LiPo para alertar antes de quedas de voltagem.'
    ],
    keyParameters: [
      { label: 'Exigência Legal', value: 'Registro MAPA & CREA', hint: 'Obrigatório para emissão de relatórios' },
      { label: 'Ativos Principais', value: 'Drones, Baterias, Pilotos', hint: 'Escala e controle de inventário' },
      { label: 'Módulo Relacionado', value: 'Gestão de Frota & Studio', hint: 'Acesse para adicionar aeronaves' }
    ],
    fieldSafetyRules: [
      'Nunca opere drones agrícolas sem seguro RETA obrigatório.',
      'Certifique-se de que os pilotos portem o CMA ou declaração de aptidão física em dia.'
    ]
  },
  {
    id: 2,
    slug: 'cadastro-produtor-gis',
    title: '2. Cadastro do Produtor & Delimitação GIS',
    subtitle: 'Mapeamento georreferenciado e obstáculos do talhão',
    category: 'onboarding',
    categoryLabel: 'Mapeamento & GIS',
    icon: MapPin,
    targetView: 'gis',
    actionButtonLabel: 'Acessar Mapeamento GIS',
    estimatedDuration: '15 - 30 min por fazenda',
    regulatoryRequirement: 'Coordenadas WGS84 & Buffer de Segurança',
    summary: 'Cadastro do produtor rural contratante, fazenda e delimitação precisa dos talhões por satélite ou importação de arquivos KML/GeoJSON, demarcando redes elétricas e áreas de preservação permanente (APP).',
    checklistItems: [
      'Cadastro de dados cadastrais e fiscais do produtor (CPF/CNPJ e IE)',
      'Importação de KML ou desenho manual do polígono do talhão agrícola',
      'Identificação da cultura, variedade, espaçamento e estádio fenológico',
      'Demarcação de áreas de restrição (casas, cursos d’água, apiários e fiação)'
    ],
    operationalTips: [
      'Gere um buffer de segurança mínimo de 30 metros de cursos d’água e moradias conforme exigência MAPA.',
      'Salve o polígono para reutilização em pulverizações futuras na mesma safra.'
    ],
    keyParameters: [
      { label: 'Formato Geográfico', value: 'KML / GeoJSON / WGS84', hint: 'Compatível com DJI Agras e XAG' },
      { label: 'Buffer Obrigatório', value: '30m de corpos hídricos', hint: 'Evita contaminação ambiental' },
      { label: 'Módulo Relacionado', value: 'Talhões Agrícolas (GIS)', hint: 'Visualização em satélite' }
    ],
    fieldSafetyRules: [
      'Identifique postes e torres de alta tensão antes de carregar o plano de voo no rádio.',
      'Respeite a distância mínima de 500 metros de núcleos populacionais e criações de animais.'
    ]
  },
  {
    id: 3,
    slug: 'orcamento-proposta',
    title: '3. Orçamento Inteligente & Proposta Comercial',
    subtitle: 'Precificação por hectare, dosagem de calda e envio de proposta',
    category: 'comercial',
    categoryLabel: 'Comercial & Precificação',
    icon: DollarSign,
    targetView: 'quotations',
    actionButtonLabel: 'Criar Novo Orçamento',
    estimatedDuration: '5 - 10 min',
    regulatoryRequirement: 'Discriminação de Alvo Biológico e Dosagens',
    summary: 'Cálculo automatizado do valor da aplicação com base na área (ha), taxa de calda, complexidade de terreno, defensivos químicos/biológicos inclusos e taxa de deslocamento.',
    checklistItems: [
      'Seleção do produtor, fazenda e talhão alvo',
      'Definição do modelo de precificação (Por Hectare, Volume de Calda ou Hora)',
      'Inclusão dos insumos agrícolas e alvos biológicos (pragas/doenças)',
      'Aplicação de descontos por volume e taxa de deslocamento operacional',
      'Geração e envio da proposta comercial em PDF ou link direto de WhatsApp'
    ],
    operationalTips: [
      'Utilize a Matriz de Precificação para garantir margem de contribuição saudável.',
      'Ao aprovar o orçamento, converta-o com um clique em Ordem de Serviço.'
    ],
    keyParameters: [
      { label: 'Base de Cálculo', value: 'R$/ha + Deslocamento', hint: 'Com margem de defensivos opcional' },
      { label: 'Conversão em 1 Clique', value: 'Orçamento ➔ OS Aprovada', hint: 'Evita redigitação de dados' },
      { label: 'Módulo Relacionado', value: 'Orçamentos & Cotações', hint: 'Impressão e envio profissional' }
    ],
    fieldSafetyRules: [
      'Nunca feche proposta sem conferir a bula do defensivo para validar dosagens recomendadas.',
      'Defina prazos de validade da proposta devido à volatilidade de preços de combustíveis e defensivos.'
    ]
  },
  {
    id: 4,
    slug: 'portao-climatico',
    title: '4. Verificação do Portão Climático (Weather Gate)',
    subtitle: 'Análise de Delta T, vento, umidade e bloqueio anti-deriva',
    category: 'planejamento',
    categoryLabel: 'Meteorologia & Segurança',
    icon: CloudSun,
    targetView: 'weather',
    actionButtonLabel: 'Verificar Portão Climático',
    estimatedDuration: 'Contínua em Tempo Real',
    regulatoryRequirement: 'Portaria 298/2021: Vento 3-10 km/h, UR > 50%, Temp < 30°C',
    summary: 'Avaliação em tempo real dos parâmetros micrometeorológicos locais. O sistema calcula automaticamente o Delta T (°C) para garantir o espectro de gotas ideal e evitar evaporação prematura ou deriva.',
    checklistItems: [
      'Leitura da velocidade do vento (Faixa ideal: 3 a 10 km/h)',
      'Conferência da umidade relativa do ar (Ideal > 55%, Mínimo 50%)',
      'Temperatura ambiente (Máxima recomendada 30°C)',
      'Cálculo do Delta T (Faixa verde ideal: 2,0 °C a 8,0 °C)',
      'Direção do vento em relação a áreas sensíveis vizinhas'
    ],
    operationalTips: [
      'Ative os alarmes sonoros e estrobo visual do Weather Operator Panel durante o voo.',
      'Programe a periodicidade de checagem meteorológica para a cada 15 ou 20 minutos.'
    ],
    keyParameters: [
      { label: 'Delta T Ideal', value: '2.0 °C a 8.0 °C', hint: 'Evita evaporação e inversão térmica' },
      { label: 'Vento Seguro', value: '3 a 10 km/h', hint: 'Sem vento = deriva por inversão' },
      { label: 'Módulo Relacionado', value: 'Portão Climático / Estação', hint: 'Simulador e alarmes sonoros' }
    ],
    fieldSafetyRules: [
      'SUSPENDA a aplicação se o vento ultrapassar 12 km/h ou se a umidade cair abaixo de 50%.',
      'Nunca aplique com vento zero em dias quentes (risco crítico de inversão térmica e deriva).'
    ]
  },
  {
    id: 5,
    slug: 'agendamento-escala',
    title: '5. Agendamento & Escala sem Conflitos',
    subtitle: 'Alocação de pilotos, auxiliares e aeronaves no calendário',
    category: 'planejamento',
    categoryLabel: 'Agenda & Logística',
    icon: Calendar,
    targetView: 'schedule',
    actionButtonLabel: 'Abrir Agenda Operacional',
    estimatedDuration: '5 min',
    regulatoryRequirement: 'Controle de Jornada e Rastreabilidade de Piloto',
    summary: 'Programação de voos no calendário com detecção inteligente de conflitos de horário. Impede que a mesma aeronave ou o mesmo piloto sejam escalados simultaneamente para ordens distintas.',
    checklistItems: [
      'Escolha de data e turno de aplicação (Manhã, Tarde ou Noturno)',
      'Alocação de Piloto Remoto e Auxiliar de Pista disponíveis',
      'Designação do Drone e conjuntos de baterias com carga balanceada',
      'Verificação automática do motor de prevenção de conflitos de agenda'
    ],
    operationalTips: [
      'Priorize aplicações com herbicidas sistêmicos nos primeiros turnos da manhã com vento favorável.',
      'Verifique se a manutenção preventiva do drone está em dia antes de alocá-lo.'
    ],
    keyParameters: [
      { label: 'Motor Anti-Conflito', value: 'Ativo em Tempo Real', hint: 'Detecta sobreposição de aeronaves' },
      { label: 'Turnos', value: 'Matutino / Vespertino / Noturno', hint: 'Adequação à janela de pulverização' },
      { label: 'Módulo Relacionado', value: 'Agenda Operacional', hint: 'Visão mensal, semanal e diária' }
    ],
    fieldSafetyRules: [
      'Respeite o tempo de descanso dos pilotos remotos para evitar fadiga visual e operacional.',
      'Confirme se as baterias reservas estão em local ventilado e protegidas do sol direto.'
    ]
  },
  {
    id: 6,
    slug: 'ordem-servico',
    title: '6. Emissão da Ordem de Serviço (OS)',
    subtitle: 'Formalização da missão com código único e coordenadas',
    category: 'campo',
    categoryLabel: 'Operações de Campo',
    icon: ClipboardList,
    targetView: 'orders',
    actionButtonLabel: 'Gerenciar Ordens de Serviço',
    actionType: 'modal_os',
    estimatedDuration: '5 min',
    regulatoryRequirement: 'Número Rastreável da OS exigido pelo MAPA',
    summary: 'Geração da Ordem de Serviço oficial com código sequencial rastreável, consolidação de todos os dados do cliente, talhões selecionados, taxa de aplicação (L/ha), defensivos e equipe de voo.',
    checklistItems: [
      'Geração de código único da OS (ex: OS-2026-084)',
      'Definição da taxa de aplicação nominal (ex: 10,0 L/ha)',
      'Vinculação da receita agronômica / ART correspondente',
      'Emissão do mapa de voo com linhas de navegação e pontos de recarga'
    ],
    operationalTips: [
      'Imprima ou sincronize a OS no modo offline do aplicativo para acesso no meio da lavoura.',
      'Altere o status para "EM TRÂNSITO" ao sair da base e "EM OPERAÇÃO" ao ligar o drone.'
    ],
    keyParameters: [
      { label: 'Taxa Nominal', value: '5 a 15 L/ha (Ultra Baixo Volume)', hint: 'Calibração do bico centrífugo' },
      { label: 'Rastreabilidade', value: 'Código OS + Mapa GIS', hint: 'Auditoria técnica garantida' },
      { label: 'Módulo Relacionado', value: 'Ordens de Serviço (OS)', hint: 'Controle de status em tempo real' }
    ],
    fieldSafetyRules: [
      'A aplicação só deve ser iniciada com a Ordem de Serviço formalmente emitida.',
      'Mantenha uma via física ou digital da OS disponível no veículo de apoio para fiscalização.'
    ]
  },
  {
    id: 7,
    slug: 'preparacao-calda',
    title: '7. Preparação da Calda & Mistura Segura',
    subtitle: 'Ordem de adição no tanque, dosagem e teste de compatibilidade',
    category: 'campo',
    categoryLabel: 'Agronomia & Calda',
    icon: FlaskConical,
    targetView: 'spray-mix',
    actionButtonLabel: 'Calculadora de Calda',
    estimatedDuration: '10 - 20 min',
    regulatoryRequirement: 'Uso de EPI Completo e Descarte Correto',
    summary: 'Cálculo exato dos volumes de água e produtos por tanque de drone (ex: 40L ou 50L) e respeito estrito à ordem de adição dos defensivos para evitar floculação, decantação ou entupimento de bicos.',
    checklistItems: [
      'Cálculo do volume de calda por tanque com base na capacidade do drone',
      'Ordem correta: Água (70%) ➔ Condicionador/Redutor pH ➔ WP ➔ WG ➔ SC ➔ EC ➔ SL ➔ Adjuvante',
      'Realização prévia do teste de jarra (Jar Test) em caso de produtos inéditos',
      'Uso obrigatório de EPI (Macacão hidro-repelente, máscara com filtro de carvão, luvas de nitrila e viseira)'
    ],
    operationalTips: [
      'Use a Calculadora de Calda integrada para obter a dosagem exata por tanque de 40L, 50L ou 70L.',
      'Monitore o pH da calda: a maioria dos inseticidas e fungicidas atua melhor com pH entre 4,5 e 5,5.'
    ],
    keyParameters: [
      { label: 'Ordem Mnemônica', value: 'W-A-L-E-S (Sólidos antes de Líquidos)', hint: 'Evita entupimento de filtros' },
      { label: 'Adjuvante', value: 'Sempre por último no tanque', hint: 'Reduz espuma e melhora espalhamento' },
      { label: 'Módulo Relacionado', value: 'Preparo de Calda & Mistura', hint: 'Biblioteca de bulas e cálculo' }
    ],
    fieldSafetyRules: [
      'PROIBIDO preparar calda sem o EPI completo exigido na bula de cada defensivo.',
      'Efetue a tríplice lavagem das embalagens vazias e perfure o fundo para descarte no InpEV.'
    ]
  },
  {
    id: 8,
    slug: 'execucao-pulverizacao',
    title: '8. Execução da Pulverização & Telemetria',
    subtitle: 'Voo autônomo, faixa de deposição e monitoramento de fluxo',
    category: 'campo',
    categoryLabel: 'Voo & Aplicação',
    icon: Plane,
    targetView: 'telemetry',
    actionButtonLabel: 'Painel de Telemetria',
    estimatedDuration: 'Conforme área (ex: 20-30 ha/h)',
    regulatoryRequirement: 'Altitude Máxima de Voo e Detecção de Obstáculos',
    summary: 'Execução do plano de pulverização pelo drone agrícola com acompanhamento contínuo de altitude operacional (2,5 a 4,0 m sobre a cultura), velocidade de voo, vazão de bicos e ciclos de baterias.',
    checklistItems: [
      'Checklist pré-voo: Calibração de bússola, link RTK fixo e integridade das hélices',
      'Teste de fluxo do sistema de bombeamento e rotação dos atomizadores centrífugos',
      'Monitoramento da faixa de deposição (Swath de 7,0 a 9,5 m conforme drone)',
      'Controle rigoroso de pouso com bateria acima de 20% para preservar as células LiPo'
    ],
    operationalTips: [
      'Mantenha a velocidade de voo constante (18 a 25 km/h) para uniformidade de deposição de gotas.',
      'Em cabeceiras com árvores, configure a subida automática e desaceleração prévia.'
    ],
    keyParameters: [
      { label: 'Altura sobre o dossel', value: '2,5 m a 3,5 m', hint: 'Garante vórtice de penetração' },
      { label: 'Faixa Efetiva', value: '7,0 a 9,5 m (DJI T40/T50)', hint: 'Evita faixas não cobertas' },
      { label: 'Módulo Relacionado', value: 'Telemetria & Diagnóstico', hint: 'Gráficos de fluxo e bateria' }
    ],
    fieldSafetyRules: [
      'Mantenha o drone na linha de visada visual direta (BVLOS apenas com autorização específica).',
      'Nunca se aproxime da aeronave antes da parada total dos motores após o pouso.'
    ]
  },
  {
    id: 9,
    slug: 'relatorio-tecnico-rta',
    title: '9. Emissão do Relatório Técnico (RTA)',
    subtitle: 'Comprovação agronômica com assinatura do RT e Piloto',
    category: 'fechamento',
    categoryLabel: 'Documentação & MAPA',
    icon: FileCheck2,
    targetView: 'reports',
    actionButtonLabel: 'Emitir Relatório de Aplicação',
    actionType: 'modal_report',
    estimatedDuration: '3 min',
    regulatoryRequirement: 'Portaria MAPA 298/2021: Guarda obrigatória por 2 anos',
    summary: 'Geração imediata do Relatório Técnico de Aplicação (RTA) formal contendo todos os dados operacionais, meteorologia real, mapa de cobertura, dosagens aplicadas e assinatura digital do RT e Piloto.',
    checklistItems: [
      'Consolidação da área total pulverizada e volume total de calda aplicado',
      'Inclusão dos dados meteorológicos médios observados durante a missão',
      'Assinatura digital do Piloto Remoto e do Responsável Técnico (CREA/MAPA)',
      'Exportação em PDF padronizado com cabeçalho oficial da empresa e QR Code',
      'Envio do relatório concluído ao produtor rural contratante'
    ],
    operationalTips: [
      'O AgroSys gera o RTA já formatado e compatível com as exigências de auditoria do MAPA.',
      'Guarde uma cópia digital assinada no arquivo da empresa pelo período legal de 2 anos.'
    ],
    keyParameters: [
      { label: 'Formato Legal', value: 'PDF Assinado + ART CREA', hint: 'Validade jurídica e pericial' },
      { label: 'Guarda Obrigatória', value: '24 meses (2 anos)', hint: 'Exigência dos fiscais federais' },
      { label: 'Módulo Relacionado', value: 'Relatórios Técnicos (RTA)', hint: 'Emissão e impressão direta' }
    ],
    fieldSafetyRules: [
      'Todos os dados de telemetria e clima inseridos no RTA devem corresponder estritamente à realidade.',
      'O RT deve assinar apenas após validar a compatibilidade da aplicação com a receita agronômica.'
    ]
  },
  {
    id: 10,
    slug: 'faturamento-comissoes',
    title: '10. Faturamento, Recebimento & Comissões',
    subtitle: 'Baixa financeira, contas a receber e comissão da tripulação',
    category: 'fechamento',
    categoryLabel: 'Financeiro & Comissões',
    icon: Wallet,
    targetView: 'financial',
    actionButtonLabel: 'Acessar Gestão Financeira',
    estimatedDuration: '5 min',
    regulatoryRequirement: 'Controle Fiscal e Remuneração de Equipe',
    summary: 'Lançamento das contas a receber referente ao serviço executado, controle de recebimento (PIX, boleto ou prazo safra) e cálculo automático da comissão por hectare para pilotos e auxiliares.',
    checklistItems: [
      'Geração da fatura / cobrança com base nos hectares efetivamente pulverizados',
      'Registro no fluxo de caixa (Contas a Receber)',
      'Cálculo de comissão de pilotos e auxiliares com base na política cadastrada',
      'Fechamento de DRE operacional do serviço e cálculo de margem líquida'
    ],
    operationalTips: [
      'Configure as políticas de comissão por hectare no módulo de Gestão Administrativa.',
      'Faça a conciliação do recebimento para liberar o pagamento da equipe com precisão.'
    ],
    keyParameters: [
      { label: 'Comissão de Equipe', value: 'R$/ha conforme política', hint: 'Pilotos e auxiliares motivados' },
      { label: 'Margem do Serviço', value: 'DRE Automatizado', hint: 'Receita líquida por voo' },
      { label: 'Módulo Relacionado', value: 'Financeiro & Comissões', hint: 'Gráficos e lançamentos' }
    ],
    fieldSafetyRules: [
      'Garanta a conformidade trabalhista com o pagamento pontual das comissões operacionais.',
      'Mantenha as notas fiscais de prestação de serviços vinculadas aos respectivos relatórios de aplicação.'
    ]
  }
];

export const SprayWorkflowGuideView: React.FC<SprayWorkflowGuideViewProps> = ({
  currentUser,
  theme,
  orders = [],
  plots = [],
  drones = [],
  quotations = [],
  financials = [],
  onNavigate,
  onOpenNewOS,
  onOpenReportModal,
}) => {
  // Navigation & View Mode State
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'all-expanded' | 'stepper' | 'pipeline' | 'checklist'>('all-expanded');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  
  // Interactive Step Checklist Completion State (Persisted in localStorage)
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('agrosys_workflow_completed_steps');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return { 1: true };
  });

  // Track expanded cards in 'all-expanded' view (default: first 3 open, others collapsible)
  const [expandedStepIds, setExpandedStepIds] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    WORKFLOW_STEPS.forEach(s => {
      initial[s.id] = true;
    });
    return initial;
  });

  const toggleStepExpansion = (stepId: number) => {
    setExpandedStepIds(prev => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleExpandAll = () => {
    const all: Record<number, boolean> = {};
    WORKFLOW_STEPS.forEach(s => { all[s.id] = true; });
    setExpandedStepIds(all);
  };

  const handleCollapseAll = () => {
    setExpandedStepIds({});
  };

  const toggleStepCompletion = (stepId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCompletedSteps(prev => {
      const updated = { ...prev, [stepId]: !prev[stepId] };
      try {
        localStorage.setItem('agrosys_workflow_completed_steps', JSON.stringify(updated));
      } catch (err) {}
      return updated;
    });
  };

  const handleMarkAllSteps = (done: boolean) => {
    const updated: Record<number, boolean> = {};
    WORKFLOW_STEPS.forEach(s => { updated[s.id] = done; });
    setCompletedSteps(updated);
    try {
      localStorage.setItem('agrosys_workflow_completed_steps', JSON.stringify(updated));
    } catch (e) {}
  };

  const handleResetWorkflowProgress = () => {
    const fresh = { 1: true };
    setCompletedSteps(fresh);
    localStorage.setItem('agrosys_workflow_completed_steps', JSON.stringify(fresh));
  };

  const currentStep = WORKFLOW_STEPS[activeStepIndex] || WORKFLOW_STEPS[0];
  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = Math.round((completedCount / WORKFLOW_STEPS.length) * 100);

  // Handle CTA button click based on step action
  const handleStepAction = (step: WorkflowStep) => {
    if (step.actionType === 'modal_os' && onOpenNewOS) {
      onOpenNewOS();
    } else if (step.actionType === 'modal_report' && onOpenReportModal) {
      onOpenReportModal(orders[0]?.id);
    } else {
      onNavigate(step.targetView);
    }
  };

  const filteredSteps = useMemo(() => {
    if (selectedFilterCategory === 'all') return WORKFLOW_STEPS;
    return WORKFLOW_STEPS.filter(s => s.category === selectedFilterCategory);
  }, [selectedFilterCategory]);

  return (
    <div className="space-y-3.5 max-w-7xl mx-auto pb-8">
      {/* Minimalist Hero Header Banner */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/80 dark:from-[#062c20] dark:via-[#093a2b] dark:to-[#062c20] text-emerald-950 dark:text-emerald-50 rounded-2xl p-3 sm:p-4 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Title & Quick Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs flex-shrink-0">
              <Workflow className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-emerald-950 dark:text-white truncate">
                  Caminho Lógico & Esteira de Pulverização
                </h1>
                <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-900 dark:text-emerald-300 border border-emerald-400/40">
                  10 Etapas MAPA
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 truncate">
                Ciclo completo com drones: credenciamento, GIS, orçamento, clima, calda, voo, RTA e faturamento.
              </p>
            </div>
          </div>

          {/* View Mode Segmented Controls */}
          <div className="flex items-center justify-between md:justify-end gap-2 flex-wrap">
            <div className="flex items-center bg-white/90 dark:bg-slate-900/90 p-0.5 rounded-xl border border-emerald-200/80 dark:border-emerald-700/80 shadow-2xs gap-0.5">
              <button
                onClick={() => setViewMode('all-expanded')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'all-expanded' 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
                }`}
                title="Visualizar todas as 10 etapas"
              >
                <Layers className="w-3 h-3" />
                <span>Todas as 10 Etapas</span>
              </button>
              <button
                onClick={() => setViewMode('stepper')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'stepper' 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
                }`}
                title="Navegação sequencial passo a passo"
              >
                <Sliders className="w-3 h-3" />
                <span>Passo a Passo</span>
              </button>
              <button
                onClick={() => setViewMode('pipeline')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'pipeline' 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
                }`}
                title="Visualização em esteira por categoria"
              >
                <Workflow className="w-3 h-3" />
                <span>Esteira</span>
              </button>
              <button
                onClick={() => setViewMode('checklist')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'checklist' 
                    ? 'bg-emerald-600 text-white shadow-2xs' 
                    : 'text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800'
                }`}
                title="Checklist rápido de conformidade MAPA"
              >
                <FileCheck2 className="w-3 h-3" />
                <span>Checklist</span>
              </button>
            </div>

            {/* Compact Progress Meter */}
            <div className="flex items-center gap-2 bg-white/80 dark:bg-emerald-950/80 px-2.5 py-1 rounded-xl border border-emerald-200/70 dark:border-emerald-800">
              <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                {completedCount}/10 ({progressPercent}%)
              </span>
              <div className="w-16 bg-emerald-100 dark:bg-emerald-900/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-600 dark:bg-emerald-400 h-full rounded-full transition-all duration-300" 
                  style={{ width: `${progressPercent}%` }} 
                />
              </div>
              <button 
                onClick={handleResetWorkflowProgress}
                className="text-slate-400 hover:text-emerald-700 dark:hover:text-emerald-300 cursor-pointer p-0.5"
                title="Reiniciar progresso"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 0: ALL 10 STEPS EXPANDED (MINIMALIST ACCORDION / HIGH-DENSITY) */}
      {viewMode === 'all-expanded' && (
        <div className="space-y-3">
          {/* Controls Bar: Category Pills + Expand/Collapse All */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Todos (10)' },
                { id: 'onboarding', label: '1. Estruturação (2)' },
                { id: 'comercial', label: '2. Comercial (1)' },
                { id: 'planejamento', label: '3. Planejamento (2)' },
                { id: 'campo', label: '4. Campo & Voo (3)' },
                { id: 'fechamento', label: '5. Fechamento (2)' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFilterCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedFilterCategory === cat.id
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center">
              <button
                onClick={handleExpandAll}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                title="Expandir todos os cartões"
              >
                <Maximize2 className="w-3 h-3 text-emerald-600" />
                <span>Expandir Todos</span>
              </button>
              <button
                onClick={handleCollapseAll}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 cursor-pointer flex items-center gap-1"
                title="Recolher todos os cartões"
              >
                <Minimize2 className="w-3 h-3 text-slate-500" />
                <span>Recolher Todos</span>
              </button>
            </div>
          </div>

          {/* Compact Step Cards List */}
          <div className="space-y-2.5">
            {filteredSteps.map((step) => {
              const Icon = step.icon;
              const isDone = completedSteps[step.id];
              const isExpanded = !!expandedStepIds[step.id];

              return (
                <div 
                  key={step.id} 
                  id={`step-card-${step.id}`}
                  className={`bg-white dark:bg-slate-900/95 rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                    isDone 
                      ? 'border-emerald-300/80 dark:border-emerald-800/80' 
                      : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {/* Slim Step Header Bar */}
                  <div 
                    onClick={() => toggleStepExpansion(step.id)}
                    className="p-2.5 sm:p-3 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0 shadow-2xs">
                        {step.id}
                      </div>
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 flex-shrink-0">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {step.title}
                          </h2>
                          <span className="hidden md:inline text-[10px] font-bold uppercase px-1.5 py-0.2 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                            {step.categoryLabel}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {step.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => toggleStepCompletion(step.id, e)}
                        className={`px-2 py-1 rounded-lg text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                          isDone
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={isDone ? 'Concluída' : 'Marcar como concluída'}
                      >
                        {isDone ? <Check className="w-3 h-3 text-emerald-600" /> : <Circle className="w-3 h-3 text-slate-400" />}
                        <span className="hidden sm:inline text-[11px]">{isDone ? 'Feita' : 'Pendente'}</span>
                      </button>

                      <button
                        onClick={() => handleStepAction(step)}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                        title={step.actionButtonLabel}
                      >
                        <span className="hidden sm:inline text-[11px]">{step.actionButtonLabel}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => toggleStepExpansion(step.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title={isExpanded ? 'Recolher detalhes' : 'Expandir detalhes'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Minimalist Content Body */}
                  {isExpanded && (
                    <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900">
                      {/* Description & Regulatory Requirement */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                          <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1 mb-0.5">
                            <Info className="w-3 h-3 text-emerald-600" />
                            Procedimento Operacional
                          </span>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                            {step.summary}
                          </p>
                        </div>

                        <div className="bg-sky-50/70 dark:bg-sky-950/40 p-2.5 rounded-xl border border-sky-200 dark:border-sky-800/60">
                          <span className="text-[11px] font-bold text-sky-950 dark:text-sky-300 flex items-center gap-1 mb-0.5">
                            <ShieldCheck className="w-3 h-3 text-sky-600" />
                            Norma MAPA
                          </span>
                          <p className="text-xs text-sky-900/90 dark:text-sky-200/90 leading-relaxed font-semibold">
                            {step.regulatoryRequirement}
                          </p>
                        </div>
                      </div>

                      {/* Key Parameters Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {step.keyParameters.map((param, pIdx) => (
                          <div key={pIdx} className="p-2 bg-emerald-50/40 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/50">
                            <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                              {param.label}
                            </span>
                            <span className="text-xs font-black text-emerald-950 dark:text-white mt-0.5 block">
                              {param.value}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                              {param.hint}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 2-Column Breakdown: Checklist vs Safety */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-0.5">
                        <div className="bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                          <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Checklist de Execução</span>
                          </h3>
                          <ul className="space-y-1">
                            {step.checklistItems.map((item, cIdx) => (
                              <li key={cIdx} className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                                <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[8px] font-black flex-shrink-0 mt-0.5">
                                  {cIdx + 1}
                                </span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="bg-amber-50/40 dark:bg-amber-950/20 p-3 rounded-xl border border-amber-200/70 dark:border-amber-800/50 space-y-1.5">
                          <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Segurança & Dicas</span>
                          </h3>
                          <ul className="space-y-1">
                            {step.fieldSafetyRules.map((rule, rIdx) => (
                              <li key={rIdx} className="flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-300">
                                <span className="text-amber-600 font-bold">•</span>
                                <span>{rule}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 1: STEPPER VIEW (PASSO A PASSO SEQUENCIAL MINIMALISTA) */}
      {viewMode === 'stepper' && (
        <div className="space-y-3">
          {/* Step Selector Horizontal Timeline Bar */}
          <div className="bg-white dark:bg-slate-900/90 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs">
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {WORKFLOW_STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isSelected = activeStepIndex === idx;
                const isDone = completedSteps[step.id];

                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStepIndex(idx)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-2xs ring-2 ring-emerald-600/30'
                        : isDone
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 hover:bg-emerald-100/60'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      {isDone ? (
                        <CheckCircle2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'}`} />
                      ) : (
                        <Icon className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span>{step.id}. {step.title.replace(/^\d+\.\s*/, '')}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Minimalist Detail Card */}
          <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {/* Step Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-50 via-white to-emerald-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-2xs flex-shrink-0">
                    {React.createElement(currentStep?.icon || Building2, { className: 'w-5 h-5' })}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {currentStep.categoryLabel}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">•</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" />
                        {currentStep.estimatedDuration}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-slate-950 dark:text-white">
                      {currentStep.title}
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {currentStep.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => toggleStepCompletion(currentStep.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1 cursor-pointer ${
                      completedSteps[currentStep.id]
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {completedSteps[currentStep.id] ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Circle className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{completedSteps[currentStep.id] ? 'Concluída' : 'Marcar como Feita'}</span>
                  </button>

                  <button
                    onClick={() => handleStepAction(currentStep)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{currentStep.actionButtonLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Step Body Content Grid */}
            <div className="p-3.5 sm:p-4 space-y-3">
              {/* Summary & Regulatory Box */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-700/70 space-y-1">
                  <span className="text-[11px] font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Info className="w-3 h-3 text-emerald-600" />
                    Procedimento Operacional
                  </span>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {currentStep.summary}
                  </p>
                </div>

                <div className="bg-sky-50/70 dark:bg-sky-950/40 p-3 rounded-xl border border-sky-200 dark:border-sky-800/60 space-y-1">
                  <span className="text-[11px] font-bold text-sky-950 dark:text-sky-300 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-sky-600" />
                    Exigência Legal MAPA
                  </span>
                  <p className="text-xs text-sky-900/90 dark:text-sky-200/90 leading-relaxed font-semibold">
                    {currentStep.regulatoryRequirement}
                  </p>
                </div>
              </div>

              {/* Key Parameters Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {currentStep.keyParameters.map((param, pIdx) => (
                  <div key={pIdx} className="p-2.5 bg-emerald-50/40 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/60 dark:border-emerald-800/60">
                    <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">
                      {param.label}
                    </span>
                    <span className="text-xs font-black text-emerald-950 dark:text-white mt-0.5 block">
                      {param.value}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                      {param.hint}
                    </span>
                  </div>
                ))}
              </div>

              {/* Checklist vs Safety Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-0.5">
                <div className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Checklist de Execução</span>
                  </h3>
                  <ul className="space-y-1.5">
                    {currentStep.checklistItems.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="w-3.5 h-3.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[9px] font-black flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-amber-50/40 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200/70 dark:border-amber-800/50 space-y-2">
                  <div>
                    <h3 className="text-xs font-bold text-amber-950 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Regras de Segurança de Campo</span>
                    </h3>
                    <ul className="space-y-1">
                      {currentStep.fieldSafetyRules.map((rule, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-xs text-amber-900 dark:text-amber-300">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-amber-200/50 dark:border-amber-800/40">
                    <h4 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 mb-0.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Dica Pro AgroSys</span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {currentStep.operationalTips?.[0] || 'Siga rigorosamente as orientações técnicas e parâmetros do fabricante.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stepper Footer Navigation */}
            <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Etapa Anterior</span>
              </button>

              <span className="text-xs font-bold text-slate-500">
                Etapa {activeStepIndex + 1} de {WORKFLOW_STEPS.length}
              </span>

              <button
                disabled={activeStepIndex === WORKFLOW_STEPS.length - 1}
                onClick={() => setActiveStepIndex(prev => Math.min(WORKFLOW_STEPS.length - 1, prev + 1))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white disabled:opacity-40 hover:bg-emerald-700 cursor-pointer flex items-center gap-1.5"
              >
                <span>Próxima Etapa</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: PIPELINE KANBAN (ESTEIRA MINIMALISTA) */}
      {viewMode === 'pipeline' && (
        <div className="space-y-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {[
              { id: 'all', label: 'Todos os 10 Passos' },
              { id: 'onboarding', label: '1. Estruturação & GIS' },
              { id: 'comercial', label: '2. Comercial' },
              { id: 'planejamento', label: '3. Clima & Agenda' },
              { id: 'campo', label: '4. Calda & Voo' },
              { id: 'fechamento', label: '5. RTA & Financeiro' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  selectedFilterCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredSteps.map((step) => {
              const Icon = step.icon;
              const isDone = completedSteps[step.id];

              return (
                <div
                  key={step.id}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 shadow-2xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-700 shadow-2xs'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                          {step.id}
                        </div>
                        <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                          <Icon className="w-3 h-3" />
                        </div>
                        <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 truncate">
                          {step.categoryLabel}
                        </span>
                      </div>

                      <button
                        onClick={(e) => toggleStepCompletion(step.id, e)}
                        className={`p-1 rounded-md border transition-all cursor-pointer ${
                          isDone 
                            ? 'bg-emerald-600 text-white border-emerald-600' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:text-emerald-600'
                        }`}
                        title={isDone ? 'Concluída' : 'Marcar como concluída'}
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>

                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-1">
                      {step.title}
                    </h3>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {step.subtitle}
                    </p>

                    <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70 text-[10px] text-slate-600 dark:text-slate-300 truncate">
                      <span className="font-bold text-slate-800 dark:text-slate-200 mr-1">Norma:</span>
                      {step.regulatoryRequirement}
                    </div>
                  </div>

                  <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => {
                        setActiveStepIndex(step.id - 1);
                        setViewMode('stepper');
                      }}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Detalhes</span>
                    </button>

                    <button
                      onClick={() => handleStepAction(step)}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-[11px]">{step.actionButtonLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: COMPLIANCE CHECKLIST (LISTA MINIMALISTA DE ALTA DENSIDADE) */}
      {viewMode === 'checklist' && (
        <div className="bg-white dark:bg-slate-900/95 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs p-3.5 sm:p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Checklist de Conformidade Técnica & MAPA Portaria 298/2021</span>
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Audite e confirme os requisitos legais de cada etapa antes da missão.
              </p>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={() => handleMarkAllSteps(true)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 hover:bg-emerald-100 cursor-pointer"
              >
                Marcar Todos
              </button>
              <button
                onClick={() => handleMarkAllSteps(false)}
                className="px-2 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
              >
                Desmarcar Todos
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            {WORKFLOW_STEPS.map((step) => {
              const isDone = completedSteps[step.id];

              return (
                <div
                  key={step.id}
                  onClick={() => toggleStepCompletion(step.id)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isDone 
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800' 
                      : 'bg-slate-50/70 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-4.5 h-4.5 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${
                      isDone 
                        ? 'bg-emerald-600 border-emerald-600 text-white' 
                        : 'border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-800'
                    }`}>
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isDone ? 'text-emerald-950 dark:text-emerald-200' : 'text-slate-900 dark:text-white'} truncate`}>
                          {step.title}
                        </span>
                        <span className="hidden md:inline text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex-shrink-0">
                          {step.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Norma: {step.regulatoryRequirement}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepAction(step);
                    }}
                    className="px-2 py-1 rounded-lg text-[11px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 flex-shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ir</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

