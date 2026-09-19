/**
 * AgroSys - Smart Feature Navigator Data Registry
 * Maps all features, modules, sub-tabs, and search keywords to user roles.
 * Ensures strict role isolation: users only see and navigate to features they are authorized to use.
 */

import { UserRole, AppViewMode, UserProfile } from '../types';

export interface SmartFeatureItem {
  id: string;
  title: string;
  category: 'Segurança & Governança' | 'Gestão Corporativa' | 'Identidade Visual' | 'Financeiro & RH' | 'Operações & Frota' | 'Clima & Agronomia' | 'Operações de Campo' | 'Conformidade Ambiental' | 'Gestão Operacional' | 'Mapeamento Agronômico' | 'Aviação & Análise' | 'Comercial' | 'Financeiro' | 'Agronomia' | 'Treinamento';
  description: string;
  moduleName: string;
  tabName?: string;
  targetView: AppViewMode;
  targetTab?: string;
  keywords: string[];
  allowedRoles: UserRole[];
  badgeText?: string;
  isMasterOnly?: boolean;
}

export const SMART_FEATURES_REGISTRY: SmartFeatureItem[] = [
  {
    id: 'audit-logs',
    title: 'Logs de Auditoria de Usuário (User Activity Logs)',
    category: 'Segurança & Governança',
    description: 'Histórico detalhado de acessos, mutações de dados, exclusões, endereços IP e status HTTP de resposta.',
    moduleName: 'Painel Administrativo',
    tabName: '📋 Logs de Auditoria',
    targetView: 'admin-management',
    targetTab: 'audit_logs',
    keywords: ['logs', 'auditoria', 'ip', 'segurança', 'historico', 'acesso', 'deleção', 'status', 'master', 'respostas', 'atividade'],
    allowedRoles: ['MASTER'],
    badgeText: '👑 Master Only',
    isMasterOnly: true,
  },
  {
    id: 'companies-management',
    title: 'Cadastro e Gestão de Empresas (Multi-Tenancy)',
    category: 'Gestão Corporativa',
    description: 'Criar, editar e excluir empresas no ecossistema AgroSys, definir CNPJ, CREA/MAPA e logotipos.',
    moduleName: 'Painel Administrativo',
    tabName: '🏢 Empresas',
    targetView: 'admin-management',
    targetTab: 'companies',
    keywords: ['empresa', 'empresas', 'cnpj', 'crea', 'mapa', 'tenant', 'multi-empresa', 'logo', 'cadastrar empresa', 'unidade'],
    allowedRoles: ['MASTER'],
    badgeText: '👑 Master Only',
    isMasterOnly: true,
  },
  {
    id: 'branding-studio',
    title: 'Estúdio de Marca & Personalização White-Label',
    category: 'Identidade Visual',
    description: 'Customização de cores da marca (primária, secundária, destaque), uploads de logotipo claro/escuro e slogan.',
    moduleName: 'Estúdio de Marca',
    tabName: '🎨 Logotipo & Cores',
    targetView: 'branding',
    targetTab: 'branding',
    keywords: ['logo', 'logotipo', 'marca', 'cor', 'cores', 'white-label', 'slogan', 'personalização', 'tema', 'identidade visual'],
    allowedRoles: ['MASTER', 'ADMIN'],
    badgeText: 'Admin / Master',
  },
  {
    id: 'users-management',
    title: 'Cadastro de Usuários, Pilotos e Auxiliares',
    category: 'Gestão Corporativa',
    description: 'Gerenciar colaboradores, definir senhas, atribuir cargos (Master, Admin, Piloto, Auxiliar, Produtor), salários e fotos.',
    moduleName: 'Painel Administrativo',
    tabName: '👥 Usuários',
    targetView: 'admin-management',
    targetTab: 'users',
    keywords: ['usuario', 'usuarios', 'colaboradores', 'piloto', 'auxiliar', 'senha', 'cargo', 'perfil', 'foto', 'decea', 'anac', 'salario'],
    allowedRoles: ['MASTER', 'ADMIN'],
    badgeText: 'Admin / Master',
  },
  {
    id: 'compensation-policy',
    title: 'Tabela Salarial & Comissões por Hectare',
    category: 'Financeiro & RH',
    description: 'Definição de salário base de pilotos e auxiliares, valor de comissão por hectare (R$/ha) e adicional de insalubridade NR-31.',
    moduleName: 'Painel Administrativo',
    tabName: '💲 Salários & Comissões',
    targetView: 'admin-management',
    targetTab: 'compensation',
    keywords: ['salario', 'comissao', 'comissões', 'hectare', 'nr31', 'insalubridade', 'bonus', 'rh', 'pagamento', 'recalculo'],
    allowedRoles: ['MASTER', 'ADMIN'],
    badgeText: 'Admin / Master',
  },
  {
    id: 'smart-batteries',
    title: 'Monitor de Saúde e Ciclos de Baterias (Smart Batteries)',
    category: 'Operações & Frota',
    description: 'Controle de ciclos de carga, temperatura, desbalanço de células em mV, modo storage (armazenamento 50%) e alarmes sonoros.',
    moduleName: 'Frota & Equipe',
    tabName: '⚡ Baterias Smart',
    targetView: 'fleet',
    targetTab: 'batteries',
    keywords: ['bateria', 'baterias', 'ciclos', 'saude', 'soh', 'storage', 'armazenamento', 'inchaço', 'temperatura', 'cooling', 'resfriamento', 'alarme', 'voltagem'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT', 'ASSISTANT'],
  },
  {
    id: 'weather-station',
    title: 'Centro Meteorológico & Portão de Trava Delta T',
    category: 'Clima & Agronomia',
    description: 'Aferição de vento (km/h), temperatura, umidade relativa, cálculo automático de Delta T e aferição manual Kestrel.',
    moduleName: 'Centro Meteorológico',
    tabName: '🌡️ Estação Delta T',
    targetView: 'weather',
    targetTab: 'delta-t',
    keywords: ['clima', 'tempo', 'vento', 'delta t', 'kestrel', 'estação', 'laudo', 'temperatura', 'umidade', 'deriva', 'janela', 'chuva', 'previsão'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT', 'ASSISTANT', 'USER'],
  },
  {
    id: 'spray-mix-calculator',
    title: 'Calculadora de Calda & Ordem de Mistura (NR-31)',
    category: 'Operações de Campo',
    description: 'Cálculo exato de dosagem de agrotóxicos por hectare, sequência correta de mistura no tanque e checklist de EPIs NR-31.',
    moduleName: 'Preparo de Calda',
    tabName: '🧪 Ordem de Mistura',
    targetView: 'spray-mix',
    targetTab: 'calculator',
    keywords: ['calda', 'mistura', 'dosagem', 'tanque', 'epi', 'nr31', 'nr-31', 'ph', 'adjuvante', 'produto', 'receita', 'sequência'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT', 'ASSISTANT'],
  },
  {
    id: 'inpev-washing',
    title: 'Tríplice Lavagem & Logística Reversa InpEV',
    category: 'Conformidade Ambiental',
    description: 'Protocolo obrigatório de tríplice lavagem de embalagens vazias e registro de devolução para o Campo Limpo InpEV.',
    moduleName: 'Preparo de Calda',
    tabName: '♻️ InpEV & Embalagens',
    targetView: 'spray-mix',
    targetTab: 'inpev',
    keywords: ['inpev', 'embalagem', 'embalagens', 'lavagem', 'triplice', 'descarte', 'reciclagem', 'campo limpo', 'meio ambiente'],
    allowedRoles: ['MASTER', 'ADMIN', 'ASSISTANT', 'PILOT', 'USER'],
  },
  {
    id: 'service-orders',
    title: 'Ordens de Serviço & Despacho de Missões',
    category: 'Gestão Operacional',
    description: 'Criar, aprovar, agendar e despachar Ordens de Serviço (OS) alocando drone, piloto, auxiliar e talhão.',
    moduleName: 'Ordens de Serviço',
    tabName: '📋 Lista de OS',
    targetView: 'orders',
    targetTab: 'orders-list',
    keywords: ['os', 'ordem', 'ordens', 'serviço', 'despacho', 'agendar', 'aplicação', 'alocação', 'solicitar', 'missao', 'status'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT', 'ASSISTANT', 'USER'],
  },
  {
    id: 'gis-plots-ndvi',
    title: 'Talhões GIS, Polígonos & Vigor Vegetal NDVI',
    category: 'Mapeamento Agronômico',
    description: 'Mapeamento geográfico de lavouras em satélite, análise de estresse hídrico/pragas via índice NDVI e área em hectares.',
    moduleName: 'Talhões GIS',
    tabName: '🗺️ Mapa de Talhões',
    targetView: 'gis',
    targetTab: 'plots-map',
    keywords: ['gis', 'talhao', 'talhões', 'ndvi', 'mapa', 'poligono', 'hectares', 'cultura', 'soja', 'milho', 'satelite', 'estresse'],
    allowedRoles: ['MASTER', 'ADMIN', 'USER', 'PILOT'],
  },
  {
    id: 'flight-telemetry',
    title: 'Telemetria de Voo & Laudos Técnicos Pós-Voo',
    category: 'Aviação & Análise',
    description: 'Importação de arquivo de voo (.DAT / SD Card), validação de taxa de sobreposição e emissão de laudo técnico oficial.',
    moduleName: 'Telemetria & Voo',
    tabName: '📡 Importar Log .DAT',
    targetView: 'telemetry',
    targetTab: 'telemetry-import',
    keywords: ['telemetria', 'voo', 'log', 'dat', 'sarpas', 'decea', 'anac', 'cobertura', 'laudo', 'gps', 'rtk', 'sobreposição'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT'],
  },
  {
    id: 'quotations-management',
    title: 'Gerador de Orçamentos & Cotações Comerciais',
    category: 'Comercial',
    description: 'Elaboração de propostas comerciais com desconto por volume de hectares e conversão em Ordem de Serviço com 1 clique.',
    moduleName: 'Orçamentos',
    tabName: '📄 Cotações',
    targetView: 'quotations',
    targetTab: 'quotations-list',
    keywords: ['orçamento', 'orçamentos', 'cotação', 'cotações', 'proposta', 'valor', 'desconto', 'conversao', 'comercial'],
    allowedRoles: ['MASTER', 'ADMIN'],
  },
  {
    id: 'pricing-rules',
    title: 'Matriz de Precificação & Regras de Cobrança',
    category: 'Comercial',
    description: 'Definição do valor cobrado por hectare (R$/ha) por tipo de cultura, inclinação do terreno (relevo) e mínimos operacionais.',
    moduleName: 'Matriz de Precificação',
    tabName: '📊 Regras de Preço',
    targetView: 'pricing',
    targetTab: 'pricing-rules',
    keywords: ['preço', 'precificação', 'tabela', 'regra', 'relevo', 'desconto', 'hectare', 'cobrança', 'matriz'],
    allowedRoles: ['MASTER', 'ADMIN'],
  },
  {
    id: 'financial-invoices',
    title: 'Faturamento, Extrato de Faturas & Recebíveis',
    category: 'Financeiro',
    description: 'Consulta de faturas com vencimento, chave Pix copia-e-cola, demonstrativo de recebíveis e relatórios fiscais.',
    moduleName: 'Financeiro',
    tabName: '💳 Faturas & Pagamentos',
    targetView: 'financial',
    targetTab: 'invoices',
    keywords: ['financeiro', 'fatura', 'faturas', 'pix', 'pagamento', 'recibo', 'cobrança', 'extrato', 'custo', 'comissão'],
    allowedRoles: ['MASTER', 'ADMIN', 'USER', 'PILOT', 'ASSISTANT'],
  },
  {
    id: 'chemical-leaflets',
    title: 'Biblioteca de Bulas Agronômicas & Agrotóxicos',
    category: 'Agronomia',
    description: 'Consulta completa de defensivos químicos, doses recomendadas por hectare, tempo de reentrada e carência antes da colheita.',
    moduleName: 'Bulas & Documentos',
    tabName: '📚 Acervo de Bulas',
    targetView: 'docs',
    targetTab: 'leaflets',
    keywords: ['bula', 'bulas', 'defensivo', 'quimico', 'agrotóxico', 'fungicida', 'herbicida', 'carência', 'ingrediente ativo', 'dose'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT', 'ASSISTANT', 'USER'],
  },
  {
    id: 'spray-workflow-guide',
    title: 'Guia Interativo do Ciclo Completo de Pulverização',
    category: 'Treinamento',
    description: 'Passo a passo visual explicativo de todas as etapas operacionais, do orçamento ao laudo final.',
    moduleName: 'Guia de Fluxo',
    tabName: '🔄 Passo a Passo',
    targetView: 'spray-workflow',
    targetTab: 'workflow',
    keywords: ['guia', 'passo a passo', 'fluxo', 'treinamento', 'manual', 'como usar', 'etapas'],
    allowedRoles: ['MASTER', 'ADMIN', 'PILOT', 'ASSISTANT', 'USER'],
  },
  {
    id: 'executive-dashboard-bi',
    title: 'Painel Geral Executivo (BI) & Análises',
    category: 'Gestão Corporativa',
    description: 'Painel completo com gráficos de faturamento, pulverizações, desempenho de equipe/drone e métricas consolidadas da empresa.',
    moduleName: 'Painel Executivo',
    tabName: '📈 BI & Análises',
    targetView: 'dashboard',
    targetTab: 'bi-overview',
    keywords: ['bi', 'dashboard', 'painel', 'executivo', 'grafico', 'faturamento', 'desempenho', 'metricas', 'analytics', 'geral', 'empresa', 'pulverizações'],
    allowedRoles: ['MASTER', 'ADMIN'],
    badgeText: 'Admin / Master',
  },
  {
    id: 'ai-analysis',
    title: 'Central de Análise por IA & Inteligência Preditiva',
    category: 'Aviação & Análise',
    description: 'Recomendações geradas por Inteligência Artificial sobre clima, vida útil de baterias, faturamento e otimização operacional.',
    moduleName: 'Painel Executivo',
    tabName: '🧠 Análise IA',
    targetView: 'dashboard',
    targetTab: 'ai-analysis',
    keywords: ['ia', 'ai', 'inteligencia', 'artificial', 'analise', 'preditiva', 'recomendações', 'insights', 'machine', 'learning', 'ativar ia'],
    allowedRoles: ['MASTER', 'ADMIN'],
    badgeText: 'Admin / Master',
  },
];

import { canUserAccessView } from '../utils/userPermissions';

export function getAuthorizedFeatures(userOrRole: UserRole | UserProfile, isMaster: boolean = false): SmartFeatureItem[] {
  return SMART_FEATURES_REGISTRY.filter(item => {
    if (typeof userOrRole === 'object' && userOrRole !== null) {
      return canUserAccessView(userOrRole, item.targetView);
    }
    if (isMaster) return true;
    return item.allowedRoles.includes(userOrRole as UserRole);
  });
}
