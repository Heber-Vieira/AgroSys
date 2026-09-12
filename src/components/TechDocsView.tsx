import React, { useState } from 'react';
import { FileText, Copy, Check, Terminal, Layers, Compass, CheckCircle2, DollarSign, CloudRain } from 'lucide-react';
import { WhiteLabelTheme } from '../types';

interface TechDocsViewProps {
  theme: WhiteLabelTheme;
  onNavigateToTab: (tab: 'docs' | 'database' | 'design-system' | 'virtual-tour') => void;
}

export const TechDocsView: React.FC<TechDocsViewProps> = ({ theme, onNavigateToTab }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-8 w-full">
      {/* Hero Presentation */}
      <div className="bg-gradient-to-br from-white via-emerald-50/20 to-slate-50 dark:from-slate-900 dark:via-emerald-950/20 dark:to-slate-900 text-slate-900 dark:text-white rounded-3xl p-8 sm:p-10 border border-slate-200/80 dark:border-slate-800 shadow-xs relative overflow-hidden">
        <div className="w-full relative z-10 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 shadow-2xs">
              Arquitetura de Solução AgTech
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-800 dark:text-sky-300 border border-sky-400/30 shadow-2xs">
              Aeroagrícola & Drones
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30 shadow-2xs">
              API-First & Offline-First
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
            Especificação Técnica & Modelagem: Gestão de Pulverização com Drones
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Documento de engenharia de software e diretrizes UI/UX para a plataforma de pulverização aeroagrícola com drones.
            Projetada para suportar alta tolerância a falhas no campo, cálculo dinâmico de calda, conformidade com DECEA/ANAC,
            precificação flexível e motor White Label dinâmico.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => onNavigateToTab('database')}
              className="px-4 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              Explorar Modelo PostGIS
            </button>
            <button
              onClick={() => onNavigateToTab('design-system')}
              className="px-4 py-2.5 rounded-xl font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              Testar Design System White Label
            </button>
            <button
              onClick={() => onNavigateToTab('virtual-tour')}
              className="px-4 py-2.5 rounded-xl font-bold bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
            >
              Simular Tour da OS
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: MODELAGEM DE BANCO DE DADOS (POSTGIS) */}
      <section className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Modelagem do Banco de Dados Relacional & Geoespacial (PostGIS)
              </h2>
              <span className="text-xs text-slate-500">
                Suporte nativo a geometrias planas, índices espaciais GIST e rastreabilidade da tríade operacional
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('database')}
            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            Ver DDL Completo →
          </button>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none text-xs leading-relaxed space-y-4">
          <p>
            A modelagem foi concebida sob o padrão <strong>PostgreSQL 15+</strong> enriquecido com a extensão <strong>PostGIS 3.3+</strong> para cálculo milimétrico de polígonos de talhões agrícolas (WGS84 SRID 4326) e trajetórias de voo dos drones.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 not-prose">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                Matriz de Precificação Flexível
              </h4>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs">
                <li>• Suporta 3 modelos de cobrança: <code>PER_HECTARE</code> (R$/ha), <code>PER_FLIGHT_HOUR</code> (R$/h de voo) e <code>PER_LITER_MIX</code> (R$/L de calda).</li>
                <li>• Fator de dificuldade configurável (ex: <code>difficulty_multiplier = 1.25</code> para relevos acidentados ou pastagens com tocos).</li>
                <li>• Descontos progressivos escalonados por volume acumulado na safra.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs mb-2 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-500" />
                Comissões & Integração Financeira
              </h4>
              <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-xs">
                <li>• Cálculo parametrizável para o <strong>Piloto Remoto</strong> (ex: R$ 8,00/ha ou 12% bruto) e para o <strong>Ajudante de Solo</strong> (ex: R$ 3,00/ha).</li>
                <li>• Geração instantânea de contas a pagar (provisão de comissão) sincronizada ao fechamento da OS.</li>
                <li>• Geração automática do Contas a Receber (duplicata) contra o produtor rural.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: ARQUITETURA DO DESIGN SYSTEM & WHITE LABEL */}
      <section className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Arquitetura de Design System & Injeção Dinâmica White Label
              </h2>
              <span className="text-xs text-slate-500">
                Tokenização CSS nativa, temas Light/Dark/Field e algoritmo de extração de paleta do logo
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('design-system')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
          >
            Abrir Playground →
          </button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-4 leading-relaxed">
          <p>
            O Design System utiliza variáveis CSS dinâmicas (<code>CSS Custom Properties</code>) injetadas no elemento raiz (<code>:root</code> ou <code>[data-tenant]</code>). 
            Dessa forma, qualquer alteração na identidade visual da empresa parceira reflete instantaneamente em botões, cartões, gráficos de telemetria e HUDs climáticos sem necessidade de recompilação do bundle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Modo Claro (Administrativo)
              </span>
              <p className="text-[11px] text-slate-500">
                Fundo limpo off-white (#F8FAFC), contraste suave e tipografia legível para escritórios e despachantes em telas calibradas.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                Modo Escuro (Hangar & Noturno)
              </span>
              <p className="text-[11px] text-slate-500">
                Preto azulado espacial (#0B1120), ideal para preparação de voos noturnos ou iluminação reduzida na carretinha de apoio.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border-2 border-black bg-amber-50 text-black">
              <span className="font-bold block mb-1">
                Modo Campo (Sob Luz Solar Intensa)
              </span>
              <p className="text-[11px] text-slate-800">
                Contraste máximo, bordas pretas reforçadas e fontes com tracking ampliado para leitura rápida em tablets sob sol a pino.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: FLUXO LÓGICO DO TOUR VIRTUAL */}
      <section className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                Lógica de Estados e Fluxo do Tour Virtual Inteligente
              </h2>
              <span className="text-xs text-slate-500">
                Máquina de estados finita guiando do agendamento geoespacial ao rateio financeiro
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateToTab('virtual-tour')}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
          >
            Iniciar Tour Interativo →
          </button>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-3">
          <p>
            O Tour Virtual opera como uma <strong>Máquina de Estados Finita (FSM)</strong> desacoplada, registrando em <code>localStorage</code> e no banco o progresso de cada operador por perfil (Despachante, Piloto, Financeiro).
          </p>

          <div className="space-y-2 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">PASSO 1:</span>
              <span><strong>Agendamento & Alocação da Tríade:</strong> Valida licença DECEA do Piloto, conformidade ANAC do Drone e dados do Talhão GIS.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">PASSO 2:</span>
              <span><strong>Preparo de Calda:</strong> Determina L/ha, tanques e checa a ordem estrita (Condicionador &gt; WP &gt; SC &gt; EC &gt; Adjuvante).</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">PASSO 3:</span>
              <span><strong>Checagem Climática & Delta T:</strong> Interrompe a decolagem se vento &gt; 15 km/h ou Delta T fora da faixa de 2°C a 8°C.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">PASSO 4:</span>
              <span><strong>Telemetria do Drone:</strong> Ingestão do log binário (.DAT DJI / XAG Cloud) com área efetiva apurada vs planejada.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">PASSO 5:</span>
              <span><strong>Fechamento Técnico:</strong> Assinatura digital do piloto e contagem de embalagens para logística reversa InpEV.</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">PASSO 6:</span>
              <span><strong>Faturamento & Comissões:</strong> Cálculo automático de R$/ha, retenções, duplicatas a receber e comissões da tripulação.</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
