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
    roleSubtitle: 'Gestão 360°, frotas, baterias, clima, comercial e governança',
    badge: 'Controle Total & Gestão Executiva',
    primaryColor: '#9333ea', // purple-600
    bgColor: 'bg-purple-50 dark:bg-purple-950/40',
    borderColor: 'border-purple-200 dark:border-purple-800',
    accentColor: 'text-purple-600 dark:text-purple-400',
    description: 'Como Administrador e Responsável Técnico (RT), você comanda toda a esteira do negócio: desde a aprovação de ordens de serviço, gestão e acompanhamento do Centro Meteorológico, monitoramento dos Ciclos e Saúde das Baterias (Smart Batteries), até o fechamento financeiro, cálculo de comissões e emissão de laudos técnicos.',
    keyResponsibilities: [
      'Aprovar Ordens de Serviço (OS) com validação de talhão, produto e janela agronômica.',
      'Alocar a tríade operacional: Aeronave (SISANT), Piloto (DECEA) e Auxiliar (NR-31).',
      'Monitorar a estação meteorológica (Portão Delta T) para liberação de laudos técnicos.',
      'Gerenciar ciclos, saúde e alertas de armazenamento prolongado de Baterias Inteligentes.',
      'Acompanhar a saúde financeira, comissões de tripulação e faturamento.',
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
        title: 'Escalação da Frota e Monitoramento de Baterias',
        description: 'Despache a OS designando o Drone e verifique o painel de "Baterias" para garantir que haja baterias suficientes com ciclos e saúde adequados para a missão.',
        screen: 'fleet',
        actionTip: 'No Painel de Baterias, se alguma bateria estiver com "Aviso de Temperatura" ou "Desequilíbrio de Célula", retenha-a na base para manutenção.',
      },
      {
        order: 3,
        title: 'Supervisão do Centro Meteorológico (Delta T)',
        description: 'Durante a operação, acompanhe o Clima via satélite e estação remota para assegurar que a equipe de campo esteja atuando dentro das normas (Vento < 15km/h e Delta T ideal).',
        screen: 'weather',
        actionTip: 'Utilize os dados validados do Centro Meteorológico para compor e emitir o Laudo Técnico de Pulverização após a conclusão.',
      },
      {
        order: 4,
        title: 'Telemetria e Laudos Pós-Voo',
        description: 'Monitore o mapa em tempo real para acompanhar deslocamentos, áreas aplicadas e gere os laudos com anexo das condições climáticas do dia.',
        screen: 'telemetry',
        actionTip: 'Confira o percentual de sobreposição, rendimento e o histórico de temperatura no log de voo.',
      },
      {
        order: 5,
        title: 'Fechamento Financeiro & Comissões',
        description: 'Ao término do serviço com assinatura do produtor, concilie os recebíveis e autorize o repasse de comissões.',
        screen: 'financial',
        actionTip: 'O sistema calcula automaticamente as comissões escalonadas conforme o volume de hectares concluídos.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'weather',
        moduleName: 'Centro Meteorológico',
        purpose: 'Hub de monitoramento climático (Vento, Delta T, Umidade, Temperatura) via API Open-Meteo e Estações locais.',
        howToUse: 'Verifique radares de chuva em tempo real e emita Laudos Climáticos que isentam a empresa em caso de deriva não intencional.',
      },
      {
        moduleId: 'fleet',
        moduleName: 'Frota, Equipe & Baterias',
        purpose: 'Controle de aeronaves, validades de pilotos, e gestão avançada de saúde de baterias (Smart Batteries).',
        howToUse: 'Acompanhe contagem de ciclos (até 1500) e coloque baterias ociosas no modo "Storage" (Armazenamento a 50%) para preservar vida útil.',
      },
      {
        moduleId: 'orders',
        moduleName: 'Ordens de Serviço',
        purpose: 'Criação, edição, despacho e controle do ciclo de vida das missões.',
        howToUse: 'Altere o status das OS entre Agendada, Em Deslocamento, Em Operação e Concluída.',
      },
      {
        moduleId: 'pricing',
        moduleName: 'Matriz de Precificação',
        purpose: 'Configuração da política comercial por hectare, hora ou calda.',
        howToUse: 'Simule cotações na hora e ajuste o preço base.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'MAPA Portaria 298 - Laudos',
        agency: 'Ministério da Agricultura',
        description: 'Guarda e emissão de laudos de aplicação.',
        ruleDetail: 'O RT deve armazenar registros contendo mapas de aplicação e dados meteorológicos exatos de cada voo por até 2 anos.',
      },
      {
        code: 'ANAC RBAC-E 94',
        agency: 'ANAC',
        description: 'Regulamento Brasileiro de Aviação Civil Especial para Drones.',
        ruleDetail: 'Exige cadastro SISANT válido para aeronaves e diário de manutenção (incluindo baterias e ciclos) atualizado.',
      },
    ],
    fieldTips: [
      'Emita a Anotação de Responsabilidade Técnica (ART) junto ao CREA antes de iniciar aplicações.',
      'Sempre anexe o Relatório do Centro Meteorológico à nota fiscal para proteger-se legalmente em disputas sobre eficácia ou deriva.',
      'Substitua ou descarte adequadamente baterias com mais de 1000 ciclos que apresentarem inchaço ou diferença de tensão celular acima de 0.1V.',
    ],
    faq: [
      {
        question: 'Como monitorar a saúde e os alertas das Baterias no sistema?',
        answer: 'Abra o Painel de Alertas de Baterias e clique na listagem completa. O sistema mostrará ícones coloridos para Vida Útil, Temperatura, Ciclos, Desbalanceamento e se estão prontas para voo ou necessitando armazenamento (Storage).',
      },
      {
        question: 'De onde o Centro Meteorológico capta os dados climáticos?',
        answer: 'O sistema utiliza a Open-Meteo API com geolocalização exata da fazenda e também permite a calibração manual fina pelos pilotos na base operando instrumentos locais (Kestrel) para compensar microclimas.',
      },
      {
        question: 'Como faço para criar uma nova Ordem de Serviço?',
        answer: 'Clique em "+ Nova Ordem de Serviço" na aba "Ordens de Serviço". Preencha o produtor, o talhão, o drone e a tripulação responsável.',
      },
    ],
  },

  USER: {
    id: 'help-user',
    role: 'USER',
    roleTitle: 'Usuário (Produtor Rural / Cliente Contratante)',
    roleSubtitle: 'Visão transparente da lavoura, relatórios climáticos, NDVI e acompanhamento de faturas',
    badge: 'Produtor / Cliente Contratante',
    primaryColor: '#16a34a', // emerald-600
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    description: 'Como Produtor Rural, você possui total transparência. Visualize o mapa dos seus talhões, acompanhe o laudo climático gerado automaticamente para garantir que sua aplicação foi feita sob condições ideais e confira as faturas e relatórios técnicos (incluindo mapas de deposição) diretamente no seu painel.',
    keyResponsibilities: [
      'Acompanhar a evolução dos seus talhões e o índice NDVI.',
      'Solicitar ordens de pulverização informando o prazo ideal.',
      'Verificar o Laudo Meteorológico (Delta T / Vento) anexado à sua OS para validar a qualidade da aplicação.',
      'Assinar digitalmente o recebimento do serviço após a conferência do mapa de telemetria.',
      'Acessar as faturas e recibos discriminados.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Verificação dos Talhões & Vigor NDVI',
        description: 'Abra a aba "Talhões GIS" para examinar seus talhões mapeados. Ative a camada NDVI para identificar manchas de estresse na lavoura.',
        screen: 'gis',
        actionTip: 'Cores verdes indicam vegetação saudável; tons amarelos/alaranjados sinalizam necessidade de inspeção ou pulverização.',
      },
      {
        order: 2,
        title: 'Solicitação Rápida de Pulverização',
        description: 'Clique em "Solicitar Pulverização" ou selecione um talhão no mapa para abrir o pedido do serviço.',
        screen: 'orders',
        actionTip: 'Informe a cultura, o produto ou alvo agronômico e a data desejada.',
      },
      {
        order: 3,
        title: 'Acompanhamento e Checagem Climática',
        description: 'No seu Painel, confira quando o drone começa a aplicar. O serviço de drone garante qualidade pausando o voo automaticamente caso o vento fique forte.',
        screen: 'dashboard',
        actionTip: 'Acesse o Painel Climático ou o laudo da sua OS para ver a temperatura e vento exatos do momento do voo.',
      },
      {
        order: 4,
        title: 'Conferência do Mapa de Aplicação & Assinatura',
        description: 'Ao final, visualize o mapa de cobertura com as faixas aplicadas pelo drone e assine digitalmente a conclusão.',
        screen: 'telemetry',
        actionTip: 'Você recebe o relatório de entrega contendo os litros de água, condições de vento registradas e área total.',
      },
      {
        order: 5,
        title: 'Consulta de Faturas & Pagamentos',
        description: 'No módulo Financeiro, acesse suas faturas detalhadas com vencimento e chave Pix para pagamento.',
        screen: 'financial',
        actionTip: 'O valor cobrado corresponde rigorosamente à área validada pelo log de GPS da aeronave.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'weather',
        moduleName: 'Laudos Climáticos e Previsão',
        purpose: 'Consulta de segurança e viabilidade do voo.',
        howToUse: 'Consulte a qualquer momento se hoje é um bom dia para solicitar voos com base no alerta verde/vermelho do clima.',
      },
      {
        moduleId: 'gis',
        moduleName: 'Talhões GIS & NDVI',
        purpose: 'Visualizador geográfico dos seus talhões.',
        howToUse: 'Clique em qualquer talhão para ver área (ha), declividade e histórico.',
      },
      {
        moduleId: 'orders',
        moduleName: 'Minhas Ordens de Serviço',
        purpose: 'Lista de todos os pedidos realizados.',
        howToUse: 'Consulte o status (Agendada, Em Operação, Concluída).',
      },
      {
        moduleId: 'financial',
        moduleName: 'Minhas Faturas & Custos',
        purpose: 'Controle de custos e pagamentos.',
        howToUse: 'Verifique o faturamento e histórico de pagamentos.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'Logística Reversa InpEV',
        agency: 'InpEV / Lei 9.974/2000',
        description: 'Destinação final de embalagens vazias.',
        ruleDetail: 'O produtor deve guardar o comprovante de devolução das embalagens tríplice-lavadas.',
      },
      {
        code: 'Zona de Proteção Ambiental',
        agency: 'MAPA Portaria 298',
        description: 'Distâncias mínimas obrigatórias.',
        ruleDetail: 'Drones respeitam distância de segurança de nascentes e áreas povoadas.',
      },
    ],
    fieldTips: [
      'Agende a pulverização com antecedência para garantir a janela fenológica ideal.',
      'Disponibilize água limpa com pH adequado na sede ou carreador.',
      'O drone não amassa as plantas, o que pode aumentar sua produtividade final em até 4% em comparação ao trator.',
    ],
    faq: [
      {
        question: 'Onde encontro o relatório comprovando o Clima e Vento no dia do voo?',
        answer: 'Ao abrir os detalhes de uma Ordem de Serviço concluída (ou nas suas Faturas), você terá um botão para visualizar o "Laudo Técnico Meteorológico", atestando que a empresa operou dentro das normas do MAPA.',
      },
      {
        question: 'O que significa o mapa de cores NDVI no talhão?',
        answer: 'NDVI é o Índice de Vegetação. Áreas em verde escuro indicam vigor. Áreas amarelas ou avermelhadas indicam falhas ou estresse.',
      },
      {
        question: 'Como tenho certeza de que o drone não deixou faixas sem aplicar (falhas)?',
        answer: 'O drone possui GPS RTK centimétrico. Você confere na aba "Telemetria" o mapa exato da pulverização realizada.',
      },
    ],
  },

  PILOT: {
    id: 'help-pilot',
    role: 'PILOT',
    roleTitle: 'Piloto de Drone Agrícola (Operador Remoto DECEA/CAAR)',
    roleSubtitle: 'Cockpit operacional, segurança de voo, portão meteorológico completo e telemetria',
    badge: 'Piloto Remoto Certificado',
    primaryColor: '#2563eb', // blue-600
    bgColor: 'bg-blue-50 dark:bg-blue-950/40',
    borderColor: 'border-blue-200 dark:border-blue-800',
    accentColor: 'text-blue-600 dark:text-blue-400',
    description: 'Você é responsável pela segurança do voo, validação do Portão Meteorológico e pela Gestão Ativa das Smart Batteries. Verifique a telemetria do Kestrel para calibrar o sistema climático e gerencie adequadamente a temperatura de baterias (cooling) e o estado de Storage após missões longas.',
    keyResponsibilities: [
      'Inspecionar o drone e gerenciar o ciclo de Baterias (Cooling no balde, carga balanceada).',
      'Realizar a calibração meteorológica manual usando anemômetro (Kestrel) no Centro Meteorológico do app.',
      'Respeitar a trava impeditiva (Vento ≤ 15 km/h e Delta T entre 2°C e 8°C).',
      'Ativar o modo "Armazenamento" (Storage 50-60%) em baterias que ficarão sem uso por mais de 5 dias.',
      'Importar o arquivo de telemetria (.DAT) após a missão para validar hectares e comissões.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Inspeção Pré-voo e Gestão de Baterias',
        description: 'Verifique no Painel de Baterias as unidades designadas. Cheque visualmente se não há inchaço e garanta que não tenham alertas de superaquecimento ou desbalanceamento.',
        screen: 'orders',
        actionTip: 'Se uma bateria apresentar aviso de temperatura alta pós-voo, coloque-a no sistema de resfriamento (cooling water) antes de colocar no gerador.',
      },
      {
        order: 2,
        title: 'Aferição Meteorológica (Delta T) no App',
        description: 'Abra o Centro Meteorológico no sistema. O app puxa dados da internet, mas você deve "Calibrar" usando o botão manual e inserindo a leitura real do seu Kestrel local.',
        screen: 'weather',
        actionTip: 'Se a tela indicar alerta vermelho (Condições Adversas), a decolagem está contraindicada por risco de deriva ou baixa eficiência.',
      },
      {
        order: 3,
        title: 'Coordenação com o Auxiliar de Solo',
        description: 'Confira com o auxiliar se a calda foi preparada e os EPIs estão vestidos.',
        screen: 'spray-mix',
        actionTip: 'Nunca inicie a decolagem enquanto o auxiliar estiver próximo aos rotores.',
      },
      {
        order: 4,
        title: 'Execução do Voo',
        description: 'Execute as passadas mantendo o espaçamento e observe atentamente os alarmes de temperatura da bateria no controle.',
        screen: 'telemetry',
        actionTip: 'Pouse sempre com pelo menos 20% de carga. Descargas muito profundas degradam rapidamente as células LiPo/LFP.',
      },
      {
        order: 5,
        title: 'Telemetria, Storage e Comissões',
        description: 'Importe o log (.DAT). Ao finalizar as operações do dia, programe baterias não utilizadas para o ciclo de descarregamento (Storage Mode).',
        screen: 'telemetry',
        actionTip: 'Isso prolonga a vida útil dos equipamentos e garante sua comissão calculada com sucesso.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'weather',
        moduleName: 'Centro Meteorológico',
        purpose: 'Garante que os dados de Clima sejam validados localmente pelo Piloto antes da aplicação.',
        howToUse: 'Acesse o módulo, veja a previsão, e caso seu instrumento mostre vento diferente, clique em "Calibrar Manualmente".',
      },
      {
        moduleId: 'fleet',
        moduleName: 'Painel de Baterias (Health Monitor)',
        purpose: 'Previne incêndios e degradação rápida informando a saúde das smart batteries.',
        howToUse: 'Verifique alertas amarelos (Atenção) ou vermelhos (Perigo). Encaminhe para manutenção e ative Storage em baterias ociosas.',
      },
      {
        moduleId: 'telemetry',
        moduleName: 'Telemetria & Logs',
        purpose: 'Comprovação da rota percorrida e cálculo final da área trabalhada.',
        howToUse: 'Suba o arquivo do SD do controle da DJI ou XAG ao final da missão.',
      },
      {
        moduleId: 'dashboard',
        moduleName: 'Cockpit do Piloto',
        purpose: 'Atalhos para tarefas diárias e gestão de comissões.',
        howToUse: 'Acompanhe as missões do dia.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'Portaria MAPA 298 - Clima',
        agency: 'MAPA',
        description: 'Exigência de aferição climática.',
        ruleDetail: 'Vento de 3 a 15 km/h, Temperatura < 30°C e Umidade > 55% são regras estritas de bula e portaria. Seu log validado no Centro Meteorológico te isenta de passivos.',
      },
      {
        code: 'DECEA SARPAS NG',
        agency: 'DECEA',
        description: 'Solicitação de Acesso de Aeronaves.',
        ruleDetail: 'Todo voo deve ter protocolo aprovado no SARPAS antes de ligar motores.',
      },
    ],
    fieldTips: [
      'Delta T ideal fica entre 2°C e 8°C. Delta T alto seca a gota, Delta T baixo causa condensação excessiva.',
      'Baterias deixadas em 100% por mais de 5 dias podem inchar e perder até 30% da sua capacidade. Coloque-as em STORAGE (50-60%).',
      'Antes de guardar as baterias na caixa, certifique-se de que os conectores estão secos e limpos.',
    ],
    faq: [
      {
        question: 'O Centro Meteorológico está bloqueando meu voo. O que faço?',
        answer: 'Verifique se os dados estão puxando de uma estação distante. Use seu medidor Kestrel na beirada da lavoura e insira os dados exatos de vento e temperatura usando o recurso "Aferição Manual". Se o clima real estiver favorável, o sistema libera.',
      },
      {
        question: 'Como gerencio as baterias no final de uma temporada?',
        answer: 'Para longos períodos sem uso, TODAS as baterias devem ser carregadas/descarregadas até 50~60% (Modo Storage). Você recebe lembretes sobre isso no painel de notificações do sistema.',
      },
      {
        question: 'Como funciona a minha comissão?',
        answer: 'A comissão (R$/ha) é calculada pela área de telemetria confirmada em cada OS aprovada pelo cliente.',
      },
    ],
  },

  ASSISTANT: {
    id: 'help-assistant',
    role: 'ASSISTANT',
    roleTitle: 'Auxiliar de Pulverização (Operador de Solo / NR-31)',
    roleSubtitle: 'Preparo de calda, NR-31, manuseio de baterias com segurança e checagem climática',
    badge: 'Técnico de Calda & NR-31',
    primaryColor: '#d97706', // amber-600
    bgColor: 'bg-amber-50 dark:bg-amber-950/40',
    borderColor: 'border-amber-200 dark:border-amber-800',
    accentColor: 'text-amber-600 dark:text-amber-400',
    description: 'Como Auxiliar de Solo, seu papel garante a fluidez da missão. Você é responsável pelo preparo físico-químico da calda, logística e resfriamento contínuo das Baterias em campo, monitoramento do status climático (para interromper a mistura se for chover ou ventar) e pela lavagem final InpEV das embalagens.',
    keyResponsibilities: [
      'Vestir o conjunto de EPIs (NR-31) ao manusear químicos ou lavar embalagens.',
      'Controlar o circuito logístico das baterias de voo (Retirar > Resfriar > Carregar > Levar ao Drone).',
      'Verificar o Centro Meteorológico no sistema: Não iniciar calda longa se o piloto informar interrupção de voo por Delta T ou vento.',
      'Calcular o volume de água e ordem dos produtos.',
      'Executar a tríplice lavagem das embalagens vazias.',
    ],
    workflowSteps: [
      {
        order: 1,
        title: 'Checklist de EPIs e Baterias',
        description: 'Vista os EPIs corretos. Organize a estação de recarga no gerador, verifique cabos e prepare o tanque de resfriamento de baterias (cooling) em campo.',
        screen: 'spray-mix',
        actionTip: 'Se houver alerta de superaquecimento em bateria após o pouso, afunde-a no tanque com água limpa conforme orientação do fabricante (ex. Agras T40) e espere a temperatura baixar antes de iniciar a carga.',
      },
      {
        order: 2,
        title: 'Sincronia Climática e Dimensionamento',
        description: 'Sempre confirme com o piloto e no Painel Climático do app se o voo vai acontecer nas próximas horas antes de misturar centenas de litros de químico que podem vencer no tanque.',
        screen: 'weather',
        actionTip: 'Taxas altas de chuva na previsão indicam suspensão da missão.',
      },
      {
        order: 3,
        title: 'Preparo da Calda na Ordem Estrita',
        description: 'Adicione os produtos no misturador seguindo a ordem correta:',
        screen: 'spray-mix',
        actionTip: '1º Água/Corretor de pH -> 2º WP -> 3º WG -> 4º SC -> 5º EC -> 6º Adjuvantes.',
      },
      {
        order: 4,
        title: 'Abastecimento Seguro (Químico e Elétrico)',
        description: 'Aproxime-se do drone somente com motores parados. Troque a bateria descarregada por uma cheia, em seguida acople a mangueira e abasteça o tanque.',
        screen: 'spray-mix',
        actionTip: 'Segure a bateria pela alça com firmeza, pois pesam mais de 10kg, e certifique-se do clique da trava de segurança no trilho do drone.',
      },
      {
        order: 5,
        title: 'Tríplice Lavagem InpEV',
        description: 'Lave cada frasco esvaziado 3 vezes com água, despeje no tanque de calda, fure o fundo e registre no sistema.',
        screen: 'spray-mix',
        actionTip: 'Mantenha as embalagens devidamente guardadas e lavadas.',
      },
    ],
    relevantModules: [
      {
        moduleId: 'spray-mix',
        moduleName: 'Calda (NR-31 & InpEV)',
        purpose: 'Calculadora de tanques e checklist de EPIs.',
        howToUse: 'Selecione a capacidade do drone e gere o roteiro de mistura.',
      },
      {
        moduleId: 'weather',
        moduleName: 'Visão Climática Rápida',
        purpose: 'Alertas de vento ou chuva que interrompam o abastecimento.',
        howToUse: 'Fique de olho nas cores (Verde/Vermelho) antes de iniciar nova batida no misturador.',
      },
      {
        moduleId: 'orders',
        moduleName: 'Receita Agronômica',
        purpose: 'Consulta dos produtos químicos receitados e dosagem.',
        howToUse: 'Verifique a receita de cada lote antes de abrir.',
      },
    ],
    regulatoryStandards: [
      {
        code: 'NR-31',
        agency: 'Ministério do Trabalho',
        description: 'Uso de EPIs na Agricultura.',
        ruleDetail: 'Uso compulsório de macacão, máscara com filtro, luvas e botas para manuseio.',
      },
      {
        code: 'Logística de Baterias (IATA/Fabricantes)',
        agency: 'Fabricantes (DJI/XAG)',
        description: 'Manejo seguro de LiPo/LFP.',
        ruleDetail: 'Baterias quentes nunca devem ser carregadas imediatamente sob risco de incêndio ou dano estrutural.',
      },
      {
        code: 'Sistema Campo Limpo (InpEV)',
        agency: 'InpEV / Órgãos Ambientais',
        description: 'Logística reversa compulsória de embalagens vazias.',
        ruleDetail: 'Obrigatória tríplice lavagem imediata.',
      },
    ],
    fieldTips: [
      'Baterias não devem ser atiradas ou jogadas no chão, um impacto estrutural pode iniciar queima espontânea das células.',
      'Sempre limpe os respingos de calda dos contatos elétricos (pinos de conexão) do drone.',
      'Não prepare misturas (EC com WP) se não tem certeza de que o drone decolará em breve, sob risco de decantação ou empelotamento no fundo do tambor.',
    ],
    faq: [
      {
        question: 'O que devo fazer com baterias muito quentes ao retirar do drone?',
        answer: 'Coloque a bateria na caixa térmica com ar forçado ou no tanque/balde de resfriamento com água (se for um modelo compatível com refrigeração líquida, ex: bateria T40). Aguarde o led indicador confirmar temperatura baixa antes de ligar o carregador.',
      },
      {
        question: 'Por que a ordem química de adição ao tanque é importante?',
        answer: 'Diferentes formulações reagem entre si. Colocar um concentrado (EC) antes de um pó (WP) fará o pó encapsular, formando uma pasta grossa que entope o drone.',
      },
      {
        question: 'Como funciona a comissão de campo?',
        answer: 'Você recebe um valor fixo por hectare (R$/ha) de toda a área voada e pulverizada com sucesso pelo piloto da sua equipe.',
      },
    ],
  },
};
