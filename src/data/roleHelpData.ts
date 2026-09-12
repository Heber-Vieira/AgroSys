import { UserRole } from '../types';

export interface RoleHelpItem {
  id: string;
  role: UserRole;
  roleTitle: string;
  roleSubtitle: string;
  badge: string;
  primaryColor: string;
  bgColor: string;
  borderColor: string;
  accentColor: string;
  description: string;
  keyResponsibilities: string[];
  workflowSteps: {
    order: number;
    title: string;
    description: string;
    screen: string;
    actionTip: string;
  }[];
  relevantModules: {
    moduleId: string;
    moduleName: string;
    purpose: string;
    howToUse: string;
  }[];
  regulatoryStandards: {
    code: string;
    agency: string;
    description: string;
    ruleDetail: string;
  }[];
  fieldTips: string[];
  faq: {
    question: string;
    answer: string;
  }[];
}

export const ROLE_HELP_DATA: Record<UserRole, RoleHelpItem> = {
  ADMIN: {
    id: 'help-admin',
    role: 'ADMIN',
    roleTitle: 'Administrador Geral & Responsável Técnico (RT)',
    roleSubtitle: 'Gestão 360°, frotas, equipes, matriz comercial, governança e conformidade legal',
    badge: 'Controle Total & Gestão Executiva',
    primaryColor: '#9333ea', // purple-600
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    accentColor: 'text-purple-600 dark:text-purple-400',
    description: 'Como Administrador e Responsável Técnico (RT), você comanda toda a esteira do negócio: desde a aprovação de ordens de serviço solicitadas por produtores rurais, precificação por relevo, alocação de pilotos e drones (SISANT), até o fechamento financeiro, cálculo de comissões e conformidade com ANAC, DECEA e MAPA.',
    keyResponsibilities: [
      'Aprovar ou recusar Ordens de Serviço (OS) com validação de talhão, produto e janela agronômica.',
      'Alocar a tríade operacional mandatória: Aeronave ativa no SISANT, Piloto credenciado e Auxiliar treinado.',
      'Configurar tabelas de preços por tipo de relevo (Plano, Encosta, Curvas de Nível) e faixas de volume.',
      'Acompanhar a saúde financeira em tempo real: faturamento bruto, margem líquida e comissões da tripulação.',
      'Garantir a conformidade regulatória: ART (CREA), Certificado de Aeronavegabilidade e diários de bordo.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Recebimento & Triagem de Solicitações',
        description: 'Verifique no módulo "Ordens de Serviço" as novas demandas criadas por produtores rurais.',
        screen: 'orders',
        actionTip: 'Confira a cultura, produto alvo, janela de aplicação recomendada e se o talhão está devidamente mapeado no GIS.',
      },
      {
        order: 2,
        title: 'Escalação da Tríade Operacional',
        description: 'Despache a OS designando o Drone disponível (ex: DJI Agras T40/T50), o Piloto com licença DECEA válida e o Auxiliar de solo com NR-31.',
        screen: 'fleet',
        actionTip: 'O sistema alerta caso alguma aeronave esteja com manutenção preventiva vencida ou piloto com licença suspensa.',
      },
      {
        order: 3,
        title: 'Ajuste e Simulação de Precificação',
        description: 'Ajuste multiplicadores para terrenos íngremes ou culturas sensíveis no módulo de Precificação.',
        screen: 'pricing',
        actionTip: 'Utilize o simulador de orçamento para emitir propostas comerciais transparentes aos produtores rurais.',
      },
      {
        order: 4,
        title: 'Supervisão de Operação e Telemetria',
        description: 'Monitore o mapa em tempo real para acompanhar deslocamentos, áreas aplicadas e telemetria pós-voo.',
        screen: 'telemetry',
        actionTip: 'Confira o percentual de sobreposição e o rendimento operacional efetivo (ha/hora) apurado dos logs.',
      },
      {
        order: 5,
        title: 'Fechamento Financeiro & Pagamento de Comissões',
        description: 'Ao término do serviço com assinatura do produtor, concilie os recebíveis e autorize o repasse de comissões aos tripulantes.',
        screen: 'financial',
        actionTip: 'O sistema calcula automaticamente as comissões escalonadas conforme o volume de hectares concluídos.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'dashboard',
        moduleName: 'Painel Geral',
        purpose: 'Visão macro com faturamento, hectares pulverizados, margens e status da frota.',
        howToUse: 'Consulte diariamente para acompanhar o ritmo operacional e as OS prioritárias do dia.',
      },
      {
        moduleId: 'orders',
        moduleName: 'Ordens de Serviço',
        purpose: 'Criação, edição, despacho e controle do ciclo de vida das missões de pulverização.',
        howToUse: 'Altere o status das OS entre Agendada, Em Deslocamento, Em Operação e Concluída.',
      },
      {
        moduleId: 'pricing',
        moduleName: 'Matriz de Precificação',
        purpose: 'Configuração da política comercial por hectare, hora ou calda, com descontos progressivos.',
        howToUse: 'Simule cotações na hora e ajuste o preço base por tipo de cultura e relevo.',
      },
      {
        moduleId: 'fleet',
        moduleName: 'Frota & Equipe',
        purpose: 'Controle de drones cadastrados na ANAC, pilotos com SARPAS/DECEA e auxiliares de campo.',
        howToUse: 'Acompanhe ciclos de bateria, histórico de manutenções preventivas e validades de habilitações.',
      },
      {
        moduleId: 'financial',
        moduleName: 'Financeiro & Comissões',
        purpose: 'Contas a receber dos produtores e contas a pagar de comissões aos profissionais de campo.',
        howToUse: 'Clique em "Liquidar" para marcar títulos faturados ou comissões já transferidas aos tripulantes.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'ANAC RBAC-E 94',
        agency: 'ANAC',
        description: 'Regulamento Brasileiro de Aviação Civil Especial para Drones Agrícolas.',
        ruleDetail: 'Exige cadastro SISANT válido para aeronaves Classe 3 (> 25 kg e até 150 kg) e manual de manutenção.',
      },
      {
        code: 'DECEA ICA 100-40',
        agency: 'DECEA',
        description: 'Instrução do Comando da Aeronáutica para acesso ao espaço aéreo.',
        ruleDetail: 'Exige solicitação e autorização via sistema SARPAS para qualquer voo com drone no território nacional.',
      },
      {
        code: 'Portaria MAPA nº 298/2021',
        agency: 'Ministério da Agricultura',
        description: 'Regras operacionais para aplicação aeroagrícola com aeronaves remotamente pilotadas.',
        ruleDetail: 'Obriga registro da empresa aplicadora no MAPA, Responsável Técnico Agrônomo com ART e guarda de relatórios de aplicação por 2 anos.',
      },
    ],
    fieldTips: [
      'Sempre emita a Anotação de Responsabilidade Técnica (ART) junto ao CREA antes de iniciar aplicações em novas fazendas.',
      'Monitore a margem líquida descontando combustível do gerador, depreciação das baterias e custos logísticos de deslocamento.',
      'Defina contratos com cláusula de janela meteorológica, resguardando a empresa caso vento ou Delta T impeçam o voo seguro.',
    ],
    faq: [
      {
        question: 'Como faço para criar uma nova Ordem de Serviço?',
        answer: 'Clique no botão verde "+ Nova Ordem de Serviço" no Painel ou na aba "Ordens de Serviço". Preencha o produtor, o talhão, o drone e a tripulação responsável. O valor e as comissões são calculados automaticamente.',
      },
      {
        question: 'Como alterar os valores das comissões de pilotos e auxiliares?',
        answer: 'Acesse o módulo "Precificação", onde estão as regras de comissão padrão (R$ 8,00 a R$ 12,00/ha para pilotos e R$ 3,00 a R$ 5,00/ha para auxiliares). Você pode ajustar esses parâmetros por tipo de terreno.',
      },
      {
        question: 'O que fazer se um produtor contestar a área aplicada?',
        answer: 'Acesse o módulo "Telemetria", selecione a OS e exiba o log geoespacial com o traçado real do drone (.DAT / KML). O relatório mostra a área exata coberta e a sobreposição da faixa.',
      },
    ],
  },

  USER: {
    id: 'help-user',
    role: 'USER',
    roleTitle: 'Usuário (Produtor Rural / Cliente Contratante)',
    roleSubtitle: 'Visão transparente da sua lavoura, talhões GIS, NDVI e controle de pedidos e faturas',
    badge: 'Produtor / Cliente Contratante',
    primaryColor: '#16a34a', // emerald-600
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Como Produtor Rural ou Gestor de Fazenda, você possui total transparência sobre as operações de pulverização em sua propriedade. Aqui você visualiza o mapa dos seus talhões georreferenciados, analisa a saúde da vegetação via índice NDVI de satélite, solicita aplicações com 1 clique e confere relatórios técnicos e faturas de forma simples.',
    keyResponsibilities: [
      'Acompanhar a evolução dos seus talhões e o índice NDVI de vigor da lavoura.',
      'Solicitar novas ordens de pulverização informando o talhão alvo e o prazo ideal de aplicação.',
      'Acompanhar o status em tempo real das equipes enviadas à sua propriedade.',
      'Assinar digitalmente o recebimento do serviço após a conferência do mapa de cobertura.',
      'Acessar as faturas e recibos discriminados com o custo exato por hectare.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Verificação dos Talhões & Vigor NDVI',
        description: 'Abra a aba "Talhões GIS" para examinar seus talhões mapeados. Ative a camada NDVI para identificar manchas de estresse na lavoura.',
        screen: 'gis',
        actionTip: 'Cores verdes indicam vegetação densa e saudável; tons amarelos/alaranjados sinalizam necessidade de inspeção ou pulverização.',
      },
      {
        order: 2,
        title: 'Solicitação Rápida de Pulverização',
        description: 'Clique em "Solicitar Pulverização" ou selecione um talhão no mapa para abrir o pedido do serviço.',
        screen: 'orders',
        actionTip: 'Informe a cultura, o produto ou alvo agronômico (ex: fungicida, desfolhante, inseticida) e a data desejada.',
      },
      {
        order: 3,
        title: 'Acompanhamento do Deslocamento & Voo',
        description: 'No seu Painel, confira o andamento: você saberá exatamente quando a equipe estiver em trânsito e quando o drone começar a aplicar.',
        screen: 'dashboard',
        actionTip: 'O sistema respeita as condições meteorológicas ideais; se houver vento excessivo, o voo é pausado para evitar desperdício de defensivo.',
      },
      {
        order: 4,
        title: 'Conferência do Mapa de Aplicação & Assinatura',
        description: 'Ao final do trabalho, visualize o mapa de cobertura com as faixas aplicadas pelo drone e assine digitalmente a conclusão.',
        screen: 'telemetry',
        actionTip: 'Você recebe o relatório de entrega contendo os litros de água utilizados, velocidade do vento durante a aplicação e área total coberta.',
      },
      {
        order: 5,
        title: 'Consulta de Faturas & Pagamentos',
        description: 'No módulo Financeiro, acesse suas faturas detalhadas com vencimento, hectares totais e chave Pix para pagamento facilitado.',
        screen: 'financial',
        actionTip: 'O valor cobrado é rigorosamente correspondente à área efetiva voada e validada pelo log de GPS da aeronave.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'dashboard',
        moduleName: 'Meu Painel',
        purpose: 'Resumo das pulverizações na sua fazenda, hectares já cobertos e serviços em andamento.',
        howToUse: 'Visualize rapidamente os próximos voos agendados e os resultados das últimas aplicações.',
      },
      {
        moduleId: 'gis',
        moduleName: 'Talhões GIS & NDVI',
        purpose: 'Visualizador geográfico dos seus talhões com alternância de camadas de vigor de biomassa.',
        howToUse: 'Clique em qualquer talhão para ver área (ha), declividade e histórico de aplicações.',
      },
      {
        moduleId: 'orders',
        moduleName: 'Minhas Ordens de Serviço',
        purpose: 'Lista de todos os pedidos de pulverização realizados na propriedade.',
        howToUse: 'Consulte o status (Agendada, Em Operação, Concluída) e os detalhes da tripulação designada.',
      },
      {
        moduleId: 'financial',
        moduleName: 'Minhas Faturas & Custos',
        purpose: 'Controle de custos por hectare e histórico de faturas a pagar ou já quitadas.',
        howToUse: 'Verifique o espelho de faturamento e comprove a economia gerada pela precisão do drone.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'Logística Reversa InpEV',
        agency: 'InpEV / Lei 9.974/2000',
        description: 'Destinação final de embalagens vazias de defensivos agrícolas.',
        ruleDetail: 'O produtor deve guardar o comprovante de devolução das embalagens tríplice-lavadas para fins de fiscalização ambiental.',
      },
      {
        code: 'Zona de Proteção Ambiental',
        agency: 'MAPA Portaria 298',
        description: 'Distâncias mínimas obrigatórias de corpos d’água e áreas urbanas.',
        ruleDetail: 'Drones respeitam distância de segurança de nascentes e habitações, garantindo segurança ao seu patrimônio.',
      },
    ],
    fieldTips: [
      'Agende a pulverização com antecedência para garantir a janela fenológica ideal da cultura.',
      'Disponibilize água limpa com pH adequado na sede ou carreador para o preparo rápido da calda.',
      'O drone evita o amassamento de plantas típico de tratores e pulverizadores terrestres, economizando até 4% da produção!',
    ],
    faq: [
      {
        question: 'O que significa o mapa de cores NDVI no talhão?',
        answer: 'NDVI é o Índice de Vegetação por Diferença Normalizada obtido por satélite. Áreas em verde escuro indicam plantas densas e vigorosas. Áreas amarelas ou avermelhadas indicam falhas, pragas, compactação ou estresse hídrico que exigem atenção agronômica.',
      },
      {
        question: 'Como tenho certeza de que o drone não deixou faixas sem aplicar (falhas)?',
        answer: 'O drone agrícola opera com GPS RTK centimétrico de alta precisão e planejamento automático de rota. No final do voo, você pode conferir na aba "Telemetria" o mapa de sobreposição completa das passadas.',
      },
      {
        question: 'Como faço para pagar uma fatura?',
        answer: 'No módulo "Financeiro", localize a fatura da sua OS e confira o valor e a data de vencimento. As instruções de pagamento e chave Pix estão disponíveis na fatura.',
      },
    ],
  },

  PILOT: {
    id: 'help-pilot',
    role: 'PILOT',
    roleTitle: 'Piloto de Drone Agrícola (Operador Remoto DECEA/CAAR)',
    roleSubtitle: 'Cockpit operacional, segurança de voo, portão meteorológico (Delta T), telemetria e comissões',
    badge: 'Piloto Remoto Certificado',
    primaryColor: '#2563eb', // blue-600
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    accentColor: 'text-blue-600 dark:text-blue-400',
    description: 'Como Piloto Remoto, a segurança de voo e a qualidade técnica da pulverização estão em suas mãos. Você é responsável por conferir a documentação pré-voo (SARPAS), validar o Portão Meteorológico calculando Delta T e velocidade do vento, operar a aeronave com precisão nas faixas estipuladas, importar os logs de telemetria (.DAT) e acompanhar suas comissões por hectare voado.',
    keyResponsibilities: [
      'Inspecionar o drone e baterias antes de cada missão de voo (Checklist pré-voo de células e hélices).',
      'Realizar a leitura meteorológica local obrigatória (Anemômetro + Psicrômetro) antes de decolar.',
      'Respeitar a trava impeditiva do Portão Meteorológico: Vento ≤ 15 km/h e Delta T entre 2°C e 8°C.',
      'Manter altura constante de voo (3 a 4 metros acima do dossel) e velocidade planejada (5 a 7 m/s).',
      'Importar o arquivo de telemetria após a missão para validar hectares cobertos e liberar sua comissão.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Inspeção de OS & Reconhecimento do Talhão',
        description: 'Acesse suas Ordens de Serviço designadas. Confira os limites do talhão, linhas de alta tensão, árvores e casas próximas no mapa GIS.',
        screen: 'orders',
        actionTip: 'Mude o status da OS para "Em Deslocamento" ao sair da base e para "Em Operação" ao chegar na área.',
      },
      {
        order: 2,
        title: 'Aferição Meteorológica & Liberação de Voo',
        description: 'Abra a aba "Clima & Delta T". Insira a temperatura do ar, umidade relativa e velocidade do vento lidos no seu medidor de campo.',
        screen: 'weather',
        actionTip: 'Se o indicador do Portão Meteorológico ficar verde ("Condições Favoráveis"), a decolagem está autorizada. Se ficar vermelho, aguarde a janela de clima.',
      },
      {
        order: 3,
        title: 'Coordenação com o Auxiliar de Solo',
        description: 'Confira com o auxiliar se a calda foi preparada na ordem química correta e se a quantidade de tanques planejada está pronta.',
        screen: 'spray-mix',
        actionTip: 'Nunca inicie a decolagem enquanto o auxiliar estiver abastecendo ou próximo aos rotores da aeronave.',
      },
      {
        order: 4,
        title: 'Execução do Voo & Gestão de Baterias',
        description: 'Execute as passadas mantendo o espaçamento de faixa (Swath) calibrado (geralmente 7 a 9 metros em drones como T40/T50).',
        screen: 'telemetry',
        actionTip: 'Acompanhe a tensão e temperatura das baterias LiPo/LFP; pouse sempre com margem de segurança de no mínimo 20% de carga.',
      },
      {
        order: 5,
        title: 'Importação do Log & Assinatura Técnica',
        description: 'Conecte o cartão SD ou rádio e importe o log do voo (.DAT / KML) para registrar hectares aplicados e liberar a comissão correspondente.',
        screen: 'telemetry',
        actionTip: 'Marque a OS como "Concluída". O valor da sua comissão (R$/ha) é imediatamente creditado no seu extrato.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'dashboard',
        moduleName: 'Cockpit do Piloto',
        purpose: 'Visão rápida das missões do dia, hectares a voar e comissão acumulada no mês.',
        howToUse: 'Acompanhe os atalhos para decolagem rápida e meteorologia.',
      },
      {
        moduleId: 'weather',
        moduleName: 'Clima & Portão Delta T',
        purpose: 'Calculadora psicrométrica em tempo real e trava impeditiva de segurança de voo.',
        howToUse: 'Mova os seletores de temperatura, umidade e vento para ver se o sistema autoriza a pulverização.',
      },
      {
        moduleId: 'telemetry',
        moduleName: 'Telemetria & Logs de Voo',
        purpose: 'Auditoria de trajeto do drone, sobreposição de faixas e vazão de pontas em L/min.',
        howToUse: 'Importe o arquivo de telemetria para comprovação de hectares voados perante a fazenda e o gestor.',
      },
      {
        moduleId: 'financial',
        moduleName: 'Minhas Comissões',
        purpose: 'Extrato financeiro com a remuneração acumulada por cada OS e hectare aplicado com sucesso.',
        howToUse: 'Filtre por período e confira o saldo disponível para pagamento.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'DECEA SARPAS NG',
        agency: 'DECEA',
        description: 'Solicitação de Acesso de Aeronaves Remotamente Pilotadas.',
        ruleDetail: 'Todo voo BVLOS ou EVLOS deve ter protocolo aprovado no sistema SARPAS antes de ligar os motores.',
      },
      {
        code: 'Portaria MAPA 298 - Art. 13',
        agency: 'MAPA',
        description: 'Limites meteorológicos estritos para pulverização com drones.',
        ruleDetail: 'Velocidade do vento não deve ultrapassar 15 km/h (preferência 3 a 10 km/h); temperatura < 30°C e UR > 55%.',
      },
      {
        code: 'CAAR (Curso de Aplicação Aeroagrícola Remota)',
        agency: 'MAPA / Entidades Credenciadas',
        description: 'Certificado de Habilitação do Piloto Agrícola.',
        ruleDetail: 'Obrigatoriedade de portar o certificado de conclusão do curso CAAR em toda operação aeroagrícola.',
      },
    ],
    fieldTips: [
      'Delta T ideal fica entre 2°C e 8°C. Delta T acima de 8°C causa rápida evaporação de microgotas antes de atingir as folhas.',
      'Em caso de perda de link (RTH - Return to Home), certifique-se de que a altitude de retorno configurada no rádio é superior à árvore mais alta do talhão.',
      'Sempre limpe os bicos atomizadores centrífugos com água limpa ao final de cada jornada para evitar travamento por resíduo de defensivo.',
    ],
    faq: [
      {
        question: 'O que fazer se o Portão Meteorológico estiver bloqueando a decolagem?',
        answer: 'Aguarde no carreador até que as condições melhorem. Geralmente, as melhores janelas de pulverização ocorrem no início da manhã (06h às 10h) ou no final da tarde (após as 16h30), quando a umidade é mais alta e os ventos diminuem.',
      },
      {
        question: 'Como funciona a comissão do piloto?',
        answer: 'A comissão é calculada por hectare efetivamente voado (R$/ha), conforme configurado na OS (ex: R$ 10,00/ha). Se você pulverizou 100 hectares em um dia, sua comissão diária será de R$ 1.000,00.',
      },
      {
        question: 'Como importar arquivos de log do DJI Agras?',
        answer: 'Na aba "Telemetria", clique no botão "Carregar Log (.DAT / KML)" ou arraste o arquivo gerado pelo controle inteligente. O sistema processa a malha de voo instantaneamente.',
      },
    ],
  },

  ASSISTANT: {
    id: 'help-assistant',
    role: 'ASSISTANT',
    roleTitle: 'Auxiliar de Pulverização (Operador de Solo / NR-31)',
    roleSubtitle: 'Preparo seguro de calda, cálculo de tanques, checklist de EPIs NR-31 e descarte InpEV',
    badge: 'Técnico de Calda & NR-31',
    primaryColor: '#d97706', // amber-600
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    accentColor: 'text-amber-600 dark:text-amber-400',
    description: 'Como Auxiliar de Pulverização e Operador de Solo, seu papel é fundamental para a eficiência e segurança da operação. Você comanda o preparo da calda com base no receituário agronômico, dimensiona o número exato de tanques conforme a capacidade do drone, segue rigorosamente a ordem físico-química de mistura para não entupir pontas, valida os EPIs obrigatórios pela NR-31 e executa a tríplice lavagem das embalagens vazias (InpEV).',
    keyResponsibilities: [
      'Vestir o conjunto completo de EPIs (NR-31) antes de manipular qualquer defensivo químico.',
      'Calcular o volume de água total e o fracionamento em tanques do drone (ex: tanques de 40L ou 50L).',
      'Cumprir estritamente a ordem química de adição ao tanque para evitar empelotamento e incompatibilidade.',
      'Auxiliar o abastecimento rápido e seguro da aeronave mantendo o carreador limpo e isolado.',
      'Executar a tríplice lavagem com perfuração no fundo das embalagens vazias e armazená-las no bag InpEV.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Checklist de Segurança & Vestimenta de EPIs (NR-31)',
        description: 'Abra a aba "Calda (NR-31)". Valide todos os EPIs: Macacão hidrorrepelente, Respirador com filtro químico, Luvas nitrílicas, Viseira de proteção e Botas de cano longo.',
        screen: 'spray-mix',
        actionTip: 'A vestimenta correta é obrigatória por lei e protege sua saúde contra respingos e inalação de vapores.',
      },
      {
        order: 2,
        title: 'Cálculo de Tanques e Volume de Água',
        description: 'Informe os hectares do talhão e a taxa de aplicação estipulada pelo agrônomo (ex: 10 L/ha). A calculadora informa quantos tanques serão necessários.',
        screen: 'spray-mix',
        actionTip: 'Exemplo: para 40 ha com taxa de 10 L/ha = 400 L totais de calda. Com tanque de 40L, serão necessários exatamente 10 tanques de voo.',
      },
      {
        order: 3,
        title: 'Preparo da Calda na Ordem Química Estrita',
        description: 'Adicione os produtos no misturador/tanque de apoio seguindo a ordem correta indicada pelo sistema:',
        screen: 'spray-mix',
        actionTip: '1º Corretor de pH/Água -> 2º Pós Molháveis (WP) -> 3º Grânulos (WG) -> 4º Suspensões (SC) -> 5º Concentrados (EC) -> 6º Adjuvantes.',
      },
      {
        order: 4,
        title: 'Abastecimento Seguro do Drone',
        description: 'Aproxime-se do drone somente com motores parados e autorização do piloto. Acople a mangueira rápida e abasteça sem derramamentos.',
        screen: 'spray-mix',
        actionTip: 'Mantenha um balde e kit de contenção de vazamentos sempre por perto no ponto de pouso.',
      },
      {
        order: 5,
        title: 'Tríplice Lavagem & Registro InpEV',
        description: 'Lave cada frasco esvaziado 3 vezes com água sob pressão, despeje a água da lavagem dentro do tanque da calda, fure o fundo e registre no sistema.',
        screen: 'spray-mix',
        actionTip: 'O registro de embalagens vazias recolhidas garante a pontuação ambiental da equipe e o fechamento da OS.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'spray-mix',
        moduleName: 'Calda (NR-31 & InpEV)',
        purpose: 'Calculadora de dimensionamento de tanques, guia visual de ordem de mistura e checklist de EPIs.',
        howToUse: 'Selecione a capacidade do drone e ajuste a taxa de aplicação para gerar o roteiro de mistura.',
      },
      {
        moduleId: 'orders',
        moduleName: 'Ordens de Serviço',
        purpose: 'Consulta dos produtos químicos receitados, dosagem por hectare e talhões do dia.',
        howToUse: 'Verifique a receita agronômica de cada lote antes de abrir as embalagens.',
      },
      {
        moduleId: 'financial',
        moduleName: 'Comissões de Solo',
        purpose: 'Extrato de comissão acumulada de suporte por hectare concluído na equipe.',
        howToUse: 'Acompanhe seus rendimentos e comprovações de dias trabalhados em campo.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'Norma Regulamentadora NR-31',
        agency: 'Ministério do Trabalho',
        description: 'Segurança e Saúde no Trabalho na Agricultura e Silvicultura.',
        ruleDetail: 'Exige fornecimento, higienização periódica e uso compulsório de EPIs específicos para manipulação de agrotóxicos.',
      },
      {
        code: 'Sistema Campo Limpo (InpEV)',
        agency: 'InpEV / Órgãos Ambientais',
        description: 'Logística reversa compulsória de embalagens vazias.',
        ruleDetail: 'Embalagens rígidas devem sofrer tríplice lavagem imediata, ser inutilizadas por furação no fundo e armazenadas em caixas lacradas.',
      },
      {
        code: 'Portaria MAPA 298 - Art. 15',
        agency: 'MAPA',
        description: 'Regras de apoio terrestre e carreador de abastecimento.',
        ruleDetail: 'Área de abastecimento deve manter distância de cursos hídricos e contar com kit de emergência para contenção de derramamentos.',
      },
    ],
    fieldTips: [
      'Nunca adicione óleo mineral ou adjuvante antes do pó molhável, pois o óleo encapsula o pó e cria grumos que entopem os bicos!',
      'Verifique o pH da água antes da mistura: águas muito alcalinas (pH > 7) degradam certos inseticidas por hidrólise alcalina em minutos.',
      'Troque as luvas nitrílicas caso apresentem furos ou fissuras; lave as luvas por fora antes de retirá-las das mãos.',
    ],
    faq: [
      {
        question: 'Por que a ordem química de adição ao tanque é tão importante?',
        answer: 'Diferentes formulações possuem tensoativos e solventes que reagem entre si. Se você colocar um concentrado emulsionável (EC) antes de um pó molhável (WP), o pó não irá se dispersar na água e formará uma pasta densa ("maionese"), entupindo a bomba e os filtros do drone.',
      },
      {
        question: 'Como funciona a tríplice lavagem obrigatória?',
        answer: 'Ao esvaziar o frasco de defensivo: 1) Coloque água limpa até 1/4 da capacidade; 2) Tampe bem e agite vigorosamente por 30 segundos; 3) Despeje a água no tanque de calda; 4) Repita esse procedimento mais 2 vezes; 5) Fure o fundo da embalagem para inutilizá-la.',
      },
      {
        question: 'Como o auxiliar recebe sua comissão?',
        answer: 'A cada hectare pulverizado com sucesso pela equipe na qual você atuou como operador de solo, um valor fixo por hectare (ex: R$ 4,00/ha) é creditado no seu extrato no módulo "Financeiro".',
      },
    ],
  },
};
