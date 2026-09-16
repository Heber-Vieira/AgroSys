import { AppViewMode } from '../types';

export interface QuickActionItem {
  label: string;
  targetView: AppViewMode;
  targetTab?: string;
  description?: string;
}

export interface ModuleFeatureSummary {
  id: AppViewMode;
  title: string;
  subtitle: string;
  category: 'operacoes' | 'agronomia' | 'comercial' | 'frota' | 'sistema';
  categoryLabel: string;
  badge: string;
  highlightText: string;
  complianceOrValue: string;
  features: {
    iconName: 'check' | 'workflow' | 'shield' | 'map' | 'chart' | 'zap' | 'file' | 'calculator' | 'settings' | 'users' | 'database';
    title: string;
    description: string;
  }[];
  quickActions: QuickActionItem[];
}

export const MODULE_SUMMARIES: Record<AppViewMode, ModuleFeatureSummary> = {
  'spray-workflow': {
    id: 'spray-workflow',
    title: 'Esteira do Processo (10 Passos)',
    subtitle: 'Passo a passo operacional ponta a ponta do planejamento ao pós-voo',
    category: 'operacoes',
    categoryLabel: 'Operações de Voo',
    badge: 'Ciclo Completo MAPA',
    highlightText: 'Guia visual e sequencial que orienta toda a equipe desde o cadastro do produtor até a emissão do laudo final.',
    complianceOrValue: 'Garante 100% de conformidade com a Portaria MAPA 298/2021 e rastreabilidade total da aplicação.',
    features: [
      {
        iconName: 'workflow',
        title: 'Sequência em 10 Etapas Integradas',
        description: 'Fluxo contínuo cobrindo Orçamento → Talhão GIS → Ordem de Serviço → Calda WALES → Clima Delta T → Voo e Laudo.'
      },
      {
        iconName: 'shield',
        title: 'Checklists Obrigatórios de Segurança',
        description: 'Validação de pré-voo, checagem de EPIs (NR-31), isolamento de área e condições seguras para decolagem.'
      },
      {
        iconName: 'chart',
        title: 'Barra de Progresso & Indicadores de Etapa',
        description: 'Acompanhamento visual em tempo real do estágio de cada operação com atalhos diretos para as ferramentas.'
      }
    ],
    quickActions: [
      { label: 'Iniciar Nova Esteira', targetView: 'spray-workflow' },
      { label: 'Consultar Checklist MAPA', targetView: 'help' },
      { label: 'Avançar Etapa Operacional', targetView: 'spray-workflow' }
    ]
  },
  'orders': {
    id: 'orders',
    title: 'Ordens de Serviço (OS)',
    subtitle: 'Planejamento, despacho e execução de missões agrícolas',
    category: 'operacoes',
    categoryLabel: 'Operações de Voo',
    badge: 'Controle de Aplicações',
    highlightText: 'Central de controle para despachar, acompanhar e finalizar missões de pulverização e dispersão de sólidos.',
    complianceOrValue: 'Reduz erros de dosagem, evita sobreposição de faixas e registra o histórico completo de cada área tratada.',
    features: [
      {
        iconName: 'file',
        title: 'Criação e Despacho de Voo Inteligente',
        description: 'Definição de taxa de aplicação (L/ha), vazão, tamanho de gota, produto aplicado e velocidade recomendada.'
      },
      {
        iconName: 'users',
        title: 'Atribuição de Equipe e Aeronave',
        description: 'Designação ágil do piloto responsável, auxiliar de campo e drone certificado com base na escala de trabalho.'
      },
      {
        iconName: 'chart',
        title: 'Quadro Kanban e Filtros Avançados',
        description: 'Organização visual por status: Agendado, Em Trânsito, Em Operação, Concluído e Cancelado com busca instantânea.'
      }
    ],
    quickActions: [
      { label: 'Criar Nova OS', targetView: 'orders' },
      { label: 'Filtrar Missões em Voo', targetView: 'orders' },
      { label: 'Exportar Resumo de Aplicações', targetView: 'reports' }
    ]
  },
  'schedule': {
    id: 'schedule',
    title: 'Agenda Operacional',
    subtitle: 'Escala de equipes, cronograma de aplicações e gestão de datas',
    category: 'operacoes',
    categoryLabel: 'Operações de Voo',
    badge: 'Gestão de Tempo',
    highlightText: 'Visão em calendário dinâmico para planejar a rotina dos pilotos, disponibilidade de drones e janelas de pulverização.',
    complianceOrValue: 'Evita choques de escala e otimiza a produtividade da equipe em janelas meteorológicas favoráveis.',
    features: [
      {
        iconName: 'workflow',
        title: 'Calendário Mensal, Semanal e Diário',
        description: 'Visualização cronológica com marcação de cores por fazenda, cliente e status da operação.'
      },
      {
        iconName: 'users',
        title: 'Distribuição Balanceada de Pilotos',
        description: 'Prevenção de sobrecarga de trabalho com controle de jornadas e alocação de equipes de apoio.'
      },
      {
        iconName: 'zap',
        title: 'Alertas de Conflitos e Prazos Agronômicos',
        description: 'Avisos visuais sobre vencimento do período de carência ou necessidade urgente de aplicação contra pragas.'
      }
    ],
    quickActions: [
      { label: 'Agendar Aplicação', targetView: 'schedule' },
      { label: 'Ver Escala da Semana', targetView: 'schedule' },
      { label: 'Ajustar Data de OS', targetView: 'orders' }
    ]
  },
  'gis': {
    id: 'gis',
    title: 'Talhões Agrícolas (GIS)',
    subtitle: 'Mapeamento geoespacial de alta precisão com satélite e polígonos',
    category: 'operacoes',
    categoryLabel: 'Operações de Voo',
    badge: 'Mapeamento Satélite',
    highlightText: 'Ferramenta de geoprocessamento agrícola para delimitar talhões, calcular áreas úteis e identificar zonas sensíveis.',
    complianceOrValue: 'Delimitação precisa com cálculo exato de hectares, distâncias de segurança e barreiras ambientais.',
    features: [
      {
        iconName: 'map',
        title: 'Desenho e Edição de Polígonos de Talhões',
        description: 'Criação de geometrias vetoriais com cálculo instantâneo da área em hectares e perímetro do plantio.'
      },
      {
        iconName: 'shield',
        title: 'Zonas de Exclusão e Restrição MAPA',
        description: 'Marcação de APPs, corpos d’água, colmeias e áreas povoadas respeitando a faixa de amortecimento de 500m.'
      },
      {
        iconName: 'database',
        title: 'Importação e Exportação KML / GeoJSON',
        description: 'Compatibilidade total com arquivos gerados por softwares de planejamento de voo (DJI Terra, QGIS, etc.).'
      }
    ],
    quickActions: [
      { label: 'Cadastrar Novo Talhão', targetView: 'gis' },
      { label: 'Importar Arquivo KML', targetView: 'gis' },
      { label: 'Medir Distância de APP', targetView: 'gis' }
    ]
  },
  'telemetry': {
    id: 'telemetry',
    title: 'Telemetria de Voo',
    subtitle: 'Monitoramento ao vivo de parâmetros técnicos de voo e sensores',
    category: 'operacoes',
    categoryLabel: 'Operações de Voo',
    badge: 'Tempo Real',
    highlightText: 'Painel de instrumentação e acompanhamento em tempo real das métricas da aeronave em missão de pulverização.',
    complianceOrValue: 'Maior segurança operacional, diagnóstico preventivo de falhas de bico e registro fiel do perfil de voo.',
    features: [
      {
        iconName: 'zap',
        title: 'Instrumentos de Voo e Indicadores Críticos',
        description: 'Altitude de voo (AGL), velocidade de deslocamento (km/h), vazão de calda (L/min) e satélites RTK/GPS ativos.'
      },
      {
        iconName: 'chart',
        title: 'Nível e Temperatura das Baterias',
        description: 'Percentual de carga restante, voltagem por célula, temperatura das células e estimativa de tempo de retorno (RTH).'
      },
      {
        iconName: 'workflow',
        title: 'Histórico de Telemetria e Logs Gravados',
        description: 'Reprodução de trajetórias de voo para conferência de faixas aplicadas e auditoria de vazão por hectare.'
      }
    ],
    quickActions: [
      { label: 'Acessar Cockpit de Voo', targetView: 'telemetry' },
      { label: 'Verificar Status RTK', targetView: 'telemetry' },
      { label: 'Analisar Logs Recentes', targetView: 'telemetry' }
    ]
  },
  'spray-mix': {
    id: 'spray-mix',
    title: 'Cálculo de Calda (WALES)',
    subtitle: 'Sequência correta de tanque misturador e teste de jarro virtual',
    category: 'agronomia',
    categoryLabel: 'Agronomia & Calda',
    badge: 'Metodologia WALES',
    highlightText: 'Simulador agronômico para ordenar a adição de defensivos e adjuvantes no tanque, evitando a formação de grumos e entupimentos.',
    complianceOrValue: 'Garante a homogeneidade da calda, máxima eficiência biológica dos produtos e evita perdas financeiras por incompatibilidade química.',
    features: [
      {
        iconName: 'calculator',
        title: 'Sequência Padrão WALES Automatizada',
        description: 'W (WP/WG - Pó Molhável) → A (Agitação/Adjuvantes) → L (Líquidos/SC/SL) → E (EC - Emulsionáveis) → S (Surfactantes/Óleo).'
      },
      {
        iconName: 'shield',
        title: 'Teste de Jarro Virtual (Jar Test)',
        description: 'Validação preventiva de incompatibilidades físicas, precipitação, separação de fases e fitotoxicidade.'
      },
      {
        iconName: 'zap',
        title: 'Dimensionamento de Tanque e Hectares',
        description: 'Cálculo exato de quantos tanques de calda serão necessários com base na taxa de aplicação (L/ha) e volume do drone.'
      }
    ],
    quickActions: [
      { label: 'Simular Mistura WALES', targetView: 'spray-mix' },
      { label: 'Calcular Volume por Tanque', targetView: 'spray-mix' },
      { label: 'Ver Recomendações de Adjuvantes', targetView: 'spray-mix' }
    ]
  },
  'weather': {
    id: 'weather',
    title: 'Clima & Janela Delta T',
    subtitle: 'Previsão agrícola, cálculo de evaporação e risco de deriva',
    category: 'agronomia',
    categoryLabel: 'Agronomia & Calda',
    badge: 'Delta T: 2 a 8°C',
    highlightText: 'Análise meteorológica avançada focada na janela segura para aplicação aérea por drones.',
    complianceOrValue: 'Impede a evaporação precoce da gota e evita multas e contaminações por deriva de vento.',
    features: [
      {
        iconName: 'zap',
        title: 'Cálculo Automático da Janela Delta T',
        description: 'Cruzamento da temperatura e umidade relativa para determinar a taxa de evaporação das gotas (zona verde de 2°C a 8°C).'
      },
      {
        iconName: 'shield',
        title: 'Monitor de Vento e Risco de Deriva',
        description: 'Velocidade do vento com alertas para faixas seguras (3 a 10 km/h), rajadas críticas e direção predominante.'
      },
      {
        iconName: 'chart',
        title: 'Previsão Horária por Coordenada GPS',
        description: 'Previsão detalhada para a fazenda nos próximos 5 dias indicando as melhores janelas matinais e vespertinas de voo.'
      }
    ],
    quickActions: [
      { label: 'Consultar Delta T Agora', targetView: 'weather' },
      { label: 'Ver Gráfico de Vento', targetView: 'weather' },
      { label: 'Checar Previsão da Fazenda', targetView: 'weather' }
    ]
  },
  'reports': {
    id: 'reports',
    title: 'Relatórios Técnicos (MAPA)',
    subtitle: 'Emissão oficial de laudos de aplicação com ART e mapa de voo',
    category: 'agronomia',
    categoryLabel: 'Agronomia & Calda',
    badge: 'Conformidade Portaria 298',
    highlightText: 'Gerador profissional de laudos e relatórios agronômicos exigidos pela fiscalização do MAPA e órgãos ambientais.',
    complianceOrValue: 'Documento auditável com assinatura técnica, registro no CREA e rastreabilidade total do serviço prestado.',
    features: [
      {
        iconName: 'file',
        title: 'Laudo Completo da Aplicação',
        description: 'Discriminação do produto, dose/ha, volume de calda, bicos utilizados, piloto responsável e número da ART.'
      },
      {
        iconName: 'map',
        title: 'Inclusão Automática do Mapa e Trajetória',
        description: 'Mapa do talhão georreferenciado anexado ao laudo evidenciando a área coberta pelo voo.'
      },
      {
        iconName: 'check',
        title: 'Exportação em PDF de Alta Qualidade',
        description: 'Layout profissional com logotipo da empresa, brasão técnico e dados cadastrais para entrega imediata ao produtor.'
      }
    ],
    quickActions: [
      { label: 'Gerar Laudo MAPA em PDF', targetView: 'reports' },
      { label: 'Consultar Histórico de Laudos', targetView: 'reports' },
      { label: 'Anexar ART do Responsável', targetView: 'reports' }
    ]
  },
  'pricing': {
    id: 'pricing',
    title: 'Matriz de Preços por Ha',
    subtitle: 'Tabela de faixas de hectare, culturas e precificação dinâmica',
    category: 'comercial',
    categoryLabel: 'Comercial & Vendas',
    badge: 'Precificação Agrícola',
    highlightText: 'Configuração flexível de preços por hectare, considerando tamanho da área, tipo de cultura e volume de produto.',
    complianceOrValue: 'Assegura margens de lucro saudáveis e padronização nas propostas comerciais da empresa.',
    features: [
      {
        iconName: 'calculator',
        title: 'Tabela por Faixas de Área (Escala)',
        description: 'Descontos progressivos automáticos para grandes áreas (ex: 0-50ha, 51-200ha, 201-1000ha).'
      },
      {
        iconName: 'settings',
        title: 'Fatores por Tipo de Cultura e Relevo',
        description: 'Acréscimos para culturas com maior dificuldade de penetração (soja, café, citrus) ou relevos ondulados.'
      },
      {
        iconName: 'chart',
        title: 'Simulação Rápida de Receita e Margem',
        description: 'Estimativa instantânea de faturamento e lucro líquido descontando custos operacionais de equipe e bateria.'
      }
    ],
    quickActions: [
      { label: 'Editar Faixas de Preço', targetView: 'pricing' },
      { label: 'Cadastrar Cultura', targetView: 'pricing' },
      { label: 'Simular Proposta Comercial', targetView: 'quotations' }
    ]
  },
  'quotations': {
    id: 'quotations',
    title: 'Orçamentos Comerciais',
    subtitle: 'Elaboração e envio de propostas comerciais para produtores',
    category: 'comercial',
    categoryLabel: 'Comercial & Vendas',
    badge: 'Propostas & Negociação',
    highlightText: 'Crie propostas comerciais atraentes em segundos, calcule parcelas e converta orçamentos aceitos em OS com um clique.',
    complianceOrValue: 'Acelera o ciclo de vendas e transmite profissionalismo com propostas padronizadas e transparentes.',
    features: [
      {
        iconName: 'file',
        title: 'Montagem Rápida com Seleção de Talhões',
        description: 'Puxe automaticamente a área dos talhões cadastrados para calcular o valor total sem erros manuais.'
      },
      {
        iconName: 'calculator',
        title: 'Condições de Pagamento e Safra',
        description: 'Opções à vista, parcelado ou pagamento em grãos/safra com cálculo automático de juros ou descontos.'
      },
      {
        iconName: 'workflow',
        title: 'Conversão em 1 Clique para Ordem de Serviço',
        description: 'Quando o produtor aprova o orçamento, os dados migram instantaneamente para a esteira de execução.'
      }
    ],
    quickActions: [
      { label: 'Criar Nova Proposta', targetView: 'quotations' },
      { label: 'Enviar Orçamento ao Cliente', targetView: 'quotations' },
      { label: 'Converter em OS', targetView: 'orders' }
    ]
  },
  'financial': {
    id: 'financial',
    title: 'Financeiro & Comissões',
    subtitle: 'Faturamento, DRE, repasses a pilotos e adicionais NR-31',
    category: 'comercial',
    categoryLabel: 'Comercial & Financeiro',
    badge: 'DRE & Comissões',
    highlightText: 'Gestão financeira completa de receitas e despesas operacionais com cálculo automático de comissões por hectare.',
    complianceOrValue: 'Transparência total no repasse aos pilotos e controle rigoroso do fluxo de caixa e rentabilidade por voo.',
    features: [
      {
        iconName: 'calculator',
        title: 'Cálculo de Comissões por Hectare Aplicado',
        description: 'Rateio automático do valor/ha para piloto e auxiliar conforme as OSs concluídas e validadas.'
      },
      {
        iconName: 'shield',
        title: 'Adicional de Insalubridade e NR-31',
        description: 'Controle de adicionais de manuseio de defensivos e benefícios legais integrados na folha de repasse.'
      },
      {
        iconName: 'chart',
        title: 'DRE Operacional e Faturamento por Empresa',
        description: 'Gráficos de receitas brutas, custos com manutenção de frota, recargas e margem líquida consolidada.'
      }
    ],
    quickActions: [
      { label: 'Ver Extrato de Comissões', targetView: 'financial' },
      { label: 'Lançar Receita/Despesa', targetView: 'financial' },
      { label: 'Gerar Relatório DRE', targetView: 'financial' }
    ]
  },
  'fleet': {
    id: 'fleet',
    title: 'Frota de Drones & Baterias',
    subtitle: 'Aeronaves agrícolas, ciclos de recarga e manutenções preventivas',
    category: 'frota',
    categoryLabel: 'Frota & Manutenção',
    badge: 'Prontuário de Aeronaves',
    highlightText: 'Gestão completa dos ativos da empresa: drones pulverizadores, geradores, bombas de abastecimento e baterias de lítio.',
    complianceOrValue: 'Conformidade com a ANAC/DECEA e maximização da vida útil das baterias através de alarmes e modo storage.',
    features: [
      {
        iconName: 'zap',
        title: 'Monitor de Baterias Smart em Tempo Real',
        description: 'Controle individual de ciclos de carga, saúde (SoH), voltagem celular (mV) e alertas de temperatura elevada.'
      },
      {
        iconName: 'workflow',
        title: 'Plano de Manutenção Preventiva e Periódica',
        description: 'Agendamento e controle de horas de voo para troca de bicos, hélices, filtros e calibração de bombas.'
      },
      {
        iconName: 'shield',
        title: 'Documentação e Seguros Aeronáuticos (RETA)',
        description: 'Armazenamento dos registros ANAC, homologação ANATEL, apólices de seguro RETA e diário de bordo.'
      }
    ],
    quickActions: [
      { label: 'Cadastrar Novo Drone', targetView: 'fleet' },
      { label: 'Registrar Ciclo de Bateria', targetView: 'fleet' },
      { label: 'Agendar Revisão Técnica', targetView: 'fleet' }
    ]
  },
  'dashboard': {
    id: 'dashboard',
    title: 'Painel Geral Executivo (BI)',
    subtitle: 'Indicadores globais, inteligência preditiva e análise de desempenho',
    category: 'frota',
    categoryLabel: 'Business Intelligence',
    badge: 'Analytics & IA',
    highlightText: 'Painel executivo completo com gráficos interativos, KPIs consolidados e recomendações agronômicas geradas por IA.',
    complianceOrValue: 'Tomada de decisão baseada em dados reais de campo com controle granular de acesso para cada colaborador.',
    features: [
      {
        iconName: 'chart',
        title: 'Métricas Consolidadas em Tempo Real',
        description: 'Total de hectares pulverizados, faturamento médio por hectare, ranking de pilotos e taxa de prontidão de frota.'
      },
      {
        iconName: 'zap',
        title: 'Recomendações e Diagnósticos por IA',
        description: 'Insights preditivos sobre janelas climáticas, alertas de desgaste de baterias e oportunidades de melhoria operacional.'
      },
      {
        iconName: 'settings',
        title: 'Controle de Acessos dos Funcionários',
        description: 'Modal visual para Administradores definirem quais módulos e abas cada funcionário da empresa pode visualizar.'
      }
    ],
    quickActions: [
      { label: 'Ver Métricas do Mês', targetView: 'dashboard' },
      { label: 'Configurar Permissões de Acesso', targetView: 'dashboard' },
      { label: 'Alternar Visão Multi-Empresa', targetView: 'dashboard' }
    ]
  },
  'admin-management': {
    id: 'admin-management',
    title: 'Hub de Gestão & Cadastros',
    subtitle: 'Pilotos, clientes, empresas, tabelas salariais e auditoria',
    category: 'frota',
    categoryLabel: 'Gestão Corporativa',
    badge: 'Governança & Multi-Tenancy',
    highlightText: 'Central administrativa para gerenciar o ecossistema da empresa: equipes, clientes, contratos e segurança da informação.',
    complianceOrValue: 'Isolamento multi-tenant seguro e rastreabilidade total das ações com logs de auditoria exclusivos para Masters.',
    features: [
      {
        iconName: 'users',
        title: 'Gestão de Usuários, Pilotos e Auxiliares',
        description: 'Cadastros completos com fotos, senhas, certificados DECEA/ANAC, funções e salários base.'
      },
      {
        iconName: 'shield',
        title: 'Logs de Auditoria de Usuário (Master Only)',
        description: 'Registro inviolável de acessos, alterações, deleções, endereços IP e status HTTP de resposta do backend.'
      },
      {
        iconName: 'workflow',
        title: 'Gestão Multi-Empresa e Clientes Produtores',
        description: 'Administração de empresas conveniadas, filiais e banco de dados de propriedades agrícolas atendidas.'
      }
    ],
    quickActions: [
      { label: 'Cadastrar Novo Colaborador', targetView: 'admin-management' },
      { label: 'Ver Logs de Auditoria', targetView: 'admin-management' },
      { label: 'Cadastrar Cliente Produtor', targetView: 'admin-management' }
    ]
  },
  'branding': {
    id: 'branding',
    title: 'Logotipo & Identidade Visual',
    subtitle: 'Personalização de logotipo próprio, brasão da empresa e slogan',
    category: 'sistema',
    categoryLabel: 'Identidade da Marca',
    badge: 'White-Label Exclusivo',
    highlightText: 'Deixe o sistema com a identidade visual da sua empresa: faça upload de seu logotipo oficial ou escolha entre dezenas de brasões.',
    complianceOrValue: 'Fortalece a marca da sua empresa nos relatórios, propostas comerciais e telas do sistema para clientes e equipe.',
    features: [
      {
        iconName: 'file',
        title: 'Upload de Logotipo Próprio (PNG / SVG)',
        description: 'Carregamento otimizado com suporte a modo claro e escuro, transparência e pré-visualização em tempo real.'
      },
      {
        iconName: 'shield',
        title: 'Galeria de Brasões Agrícolas de Alta Definição',
        description: 'Seleção rápida de ícones modernos e elegantes de drones, folhas, águias e coroas para empresas sem logo pronto.'
      },
      {
        iconName: 'settings',
        title: 'Slogan e Cores Corporativas',
        description: 'Definição do nome fantasia, slogan de destaque e sincronização imediata em toda a interface do usuário.'
      }
    ],
    quickActions: [
      { label: 'Fazer Upload de Logo', targetView: 'branding' },
      { label: 'Escolher Brasão de Destaque', targetView: 'branding' },
      { label: 'Atualizar Slogan da Empresa', targetView: 'branding' }
    ]
  },
  'design-system': {
    id: 'design-system',
    title: 'Design System & Cores',
    subtitle: 'Tokens visuais, paleta HSL e componentes de interface',
    category: 'sistema',
    categoryLabel: 'Design & Interface',
    badge: 'Tokens Visuais',
    highlightText: 'Catálogo de padrões de interface do AgroSys: cores da marca, tipografia, elevações, botões e modais padronizados.',
    complianceOrValue: 'Garante harmonia visual, elegância, excelente legibilidade e total consistência em todos os dispositivos.',
    features: [
      {
        iconName: 'zap',
        title: 'Paleta HSL Harmonizada & Modo Escuro',
        description: 'Variáveis de cores calibradas para alto contraste, conforto visual sob luz solar intensa e elegância noturna.'
      },
      {
        iconName: 'settings',
        title: 'Biblioteca de Componentes e Botões',
        description: 'Padronização de inputs, badges, cards, tabelas responsivas e diálogos de confirmação.'
      },
      {
        iconName: 'chart',
        title: 'Diretrizes de Acessibilidade e Micro-interações',
        description: 'Animações fluidas, foco em botões e suporte completo a telas touch em tablets e smartphones de campo.'
      }
    ],
    quickActions: [
      { label: 'Explorar Tokens de Cor', targetView: 'design-system' },
      { label: 'Ver Componentes de UI', targetView: 'design-system' },
      { label: 'Testar Modo Escuro', targetView: 'design-system' }
    ]
  },
  'database': {
    id: 'database',
    title: 'Banco PostgreSQL & GIS',
    subtitle: 'Modelagem relacional, PostGIS na nuvem e sincronização offline',
    category: 'sistema',
    categoryLabel: 'Infraestrutura & Dados',
    badge: 'PostGIS & Supabase',
    highlightText: 'Estrutura de dados robusta com banco relacional na nuvem e suporte nativo a geometrias espaciais PostGIS.',
    complianceOrValue: 'Máxima segurança, tolerância a falhas, backups automáticos e operação contínua mesmo sem internet no campo.',
    features: [
      {
        iconName: 'database',
        title: 'Extensão Geoespacial PostGIS Integrada',
        description: 'Consultas espaciais de alta performance para cálculo de intersecções, sobreposição de faixas e áreas.'
      },
      {
        iconName: 'shield',
        title: 'Políticas de Segurança em Nível de Linha (RLS)',
        description: 'Isolamento estrito dos dados entre empresas conveniadas garantindo sigilo e confidencialidade total.'
      },
      {
        iconName: 'workflow',
        title: 'Sincronização Bidirecional Offline-First',
        description: 'Armazenamento local seguro via IndexedDB com reenvio automático assim que a conexão 4G/Wi-Fi for restabelecida.'
      }
    ],
    quickActions: [
      { label: 'Ver Modelagem do Banco', targetView: 'database' },
      { label: 'Checar Status de Sincronização', targetView: 'database' },
      { label: 'Consultar Esquema PostGIS', targetView: 'database' }
    ]
  },
  'docs': {
    id: 'docs',
    title: 'Documentação Técnica & APIs',
    subtitle: 'Manuais de arquitetura, esquemas de dados e endpoints REST',
    category: 'sistema',
    categoryLabel: 'Desenvolvimento & Integrações',
    badge: 'APIs & Manuais',
    highlightText: 'Guia completo para desenvolvedores, integradores de telemetria e agrônomos responsáveis por conexões de API.',
    complianceOrValue: 'Facilidade de integração com estações meteorológicas, softwares de telemetria e ERPs de fazendas.',
    features: [
      {
        iconName: 'file',
        title: 'Especificação de Endpoints RESTful',
        description: 'Documentação detalhada para envio de telemetria de voo, sincronização de OS e download de laudos em PDF.'
      },
      {
        iconName: 'settings',
        title: 'Esquemas de Dados e Tipagens TypeScript',
        description: 'Dicionário de tipos e validações de campos para garantir integridade e agilidade no desenvolvimento.'
      },
      {
        iconName: 'shield',
        title: 'Autenticação e Chaves de API Seguras',
        description: 'Diretrizes de geração de tokens JWT e controle de permissões por escopo de integração.'
      }
    ],
    quickActions: [
      { label: 'Acessar Guia de APIs', targetView: 'docs' },
      { label: 'Ver Exemplos de Payloads', targetView: 'docs' },
      { label: 'Consultar Dicionário de Dados', targetView: 'docs' }
    ]
  },
  'virtual-tour': {
    id: 'virtual-tour',
    title: 'Tour Guiado do Sistema',
    subtitle: 'Treinamento prático e passo a passo interativo de demonstração',
    category: 'sistema',
    categoryLabel: 'Treinamento & Ajuda',
    badge: 'Tutorial Interativo',
    highlightText: 'Apresentação interativa que ensina em poucos minutos como navegar pelo sistema, criar uma OS e gerar laudos.',
    complianceOrValue: 'Curva de aprendizado zero para novos operadores, reduzindo o tempo de capacitação de pilotos e administradores.',
    features: [
      {
        iconName: 'workflow',
        title: 'Demonstração Interativa Passo a Passo',
        description: 'Destaque visual dos botões principais com balões explicativos e dicas práticas sobre cada funcionalidade.'
      },
      {
        iconName: 'users',
        title: 'Trilha Adaptada por Perfil de Usuário',
        description: 'Conteúdo direcionado com foco nas necessidades de Pilotos, Produtores ou Administradores.'
      },
      {
        iconName: 'zap',
        title: 'Ativação Rápida a Qualquer Momento',
        description: 'Pode ser reiniciado sempre que um novo colaborador precisar de ambientação nas ferramentas do AgroSys.'
      }
    ],
    quickActions: [
      { label: 'Iniciar Tour do Sistema', targetView: 'virtual-tour' },
      { label: 'Ver Dicas Rápidas', targetView: 'help' },
      { label: 'Treinar Novo Piloto', targetView: 'virtual-tour' }
    ]
  },
  'help': {
    id: 'help',
    title: 'Ajuda & Boas Práticas',
    subtitle: 'Smart Navigator (Ctrl+K), normas MAPA 298/2021, ANAC e NR-31',
    category: 'sistema',
    categoryLabel: 'Treinamento & Ajuda',
    badge: 'Central Inteligente',
    highlightText: 'Central de conhecimento abrangente com localizador inteligente de funcionalidades em linguagem natural e normas legais.',
    complianceOrValue: 'Respostas imediatas para dúvidas operacionais e acesso direto à legislação aeronáutica e agronômica.',
    features: [
      {
        iconName: 'zap',
        title: 'Localizador Inteligente de Módulos (Ctrl + K)',
        description: 'Busca inteligente que entende o que você precisa e leva direto para a aba certa com respeito ao seu cargo.'
      },
      {
        iconName: 'shield',
        title: 'Guia de Normas Legais (MAPA, ANAC e NR-31)',
        description: 'Resumos práticos das exigências de segurança de voo, EPIs agrícolas e preenchimento de diário de bordo.'
      },
      {
        iconName: 'users',
        title: 'Conteúdo Personalizado por Perfil',
        description: 'Exibe somente as instruções e módulos que seu perfil de usuário está autorizado a utilizar.'
      }
    ],
    quickActions: [
      { label: 'Abrir Localizador Inteligente', targetView: 'help' },
      { label: 'Consultar Norma MAPA 298', targetView: 'help' },
      { label: 'Ver Checklist de EPIs NR-31', targetView: 'help' }
    ]
  },
  'hub': {
    id: 'hub',
    title: 'Central AgroSys',
    subtitle: 'Painel operacional integrado, atalhos rápidos e visão geral do sistema',
    category: 'sistema',
    categoryLabel: 'Navegação Principal',
    badge: 'Hub Operacional',
    highlightText: 'Central de controle que reúne métricas em tempo real, status das operações e atalhos customizados.',
    complianceOrValue: 'Visão unificada das atividades e acesso rápido a todos os módulos autorizados.',
    features: [
      {
        iconName: 'workflow',
        title: 'Métricas em Tempo Real',
        description: 'Acompanhe ordens de serviço ativas, hectares aplicados e tarefas pendentes.'
      },
      {
        iconName: 'zap',
        title: 'Acesso Rápido aos Módulos',
        description: 'Navegação instantânea para módulos operacionais, técnicos e cadastros.'
      },
      {
        iconName: 'shield',
        title: 'Segurança e Escopo de Acesso',
        description: 'Dados e ações customizados de acordo com o perfil e permissões do usuário conectado.'
      }
    ],
    quickActions: [
      { label: 'Ir para Ordens de Serviço', targetView: 'orders' },
      { label: 'Ver Esteira Operacional', targetView: 'spray-workflow' },
      { label: 'Consultar Clima', targetView: 'weather' }
    ]
  }
};
