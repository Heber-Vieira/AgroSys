import React, { useEffect, useState } from 'react';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Eye, 
  Layers, 
  Play, 
  Maximize2, 
  Minimize2,
  HelpCircle,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { AppViewMode, WhiteLabelTheme, UserProfile } from '../types';

export interface LiveTourStep {
  id: string;
  stepIndex: number;
  title: string;
  targetView: AppViewMode;
  targetViewLabel: string;
  badge: string;
  role: 'ADMIN' | 'PILOT' | 'ASSISTANT' | 'USER' | 'TODOS';
  highlightArea: string;
  description: string;
  practicalTip: string;
  suggestedAction: string;
}

export const LIVE_TOUR_STEPS: LiveTourStep[] = [
  {
    id: 'step-dashboard',
    stepIndex: 1,
    title: '1. Painel Geral & Indicadores de Safra (Cockpit Operacional)',
    targetView: 'dashboard',
    targetViewLabel: 'Painel',
    badge: 'Visão 360°',
    role: 'TODOS',
    highlightArea: 'Métricas de hectares aplicados, ordens em andamento e alertas em tempo real.',
    description: 'Centraliza o resumo executivo da safra agrícola. Acompanhe a área total pulverizada, os voos em andamento, o faturamento acumulado e atalhos rápidos de meteorologia e suporte.',
    practicalTip: 'Alterne o perfil no topo (Administrador, Produtor, Piloto ou Ajudante) para ver como o painel se adapta instantaneamente a cada função.',
    suggestedAction: 'Observe as métricas gerais e o banner meteorológico.'
  },
  {
    id: 'step-orders',
    stepIndex: 2,
    title: '2. Ordens de Serviço & Ciclo de Voo (Field Service)',
    targetView: 'orders',
    targetViewLabel: 'Ordens de Serviço',
    badge: 'Gestão de Campo',
    role: 'ADMIN',
    highlightArea: 'Fluxo da OS (Agendada → Em Deslocamento → Operando → Fechada) e Certificados Oficiais.',
    description: 'Aqui você cria novas ordens de serviço, vincula o talhão GIS, o drone homologado e a tripulação. Controle o status do voo em tempo real e gere o Certificado Oficial com a sua marca personalizada.',
    practicalTip: 'Clique em "Certificado com Marca" em qualquer OS para ver o relatório oficial emitido com o logotipo e registro CREA da sua empresa.',
    suggestedAction: 'Experimente avançar o status de uma OS de "Agendada" para "Em Deslocamento".'
  },
  {
    id: 'step-gis',
    stepIndex: 3,
    title: '3. Mapeamento Geoespacial & Talhões PostGIS',
    targetView: 'gis',
    targetViewLabel: 'Talhões GIS',
    badge: 'Mapeamento Satélite',
    role: 'ADMIN',
    highlightArea: 'Polígonos georreferenciados, cálculo de área e matriz de declividade.',
    description: 'Interface GIS com mapas de satélite para delimitação de talhões, análise de relevo, cálculo automático de hectares e identificação de obstáculos para plano de voo seguro.',
    practicalTip: 'Talhões com relevo ondulado ou montanhoso recebem multiplicadores na matriz de precificação devido à complexidade da pilotagem.',
    suggestedAction: 'Selecione um talhão na lista lateral para inspecionar seus vértices e histórico.'
  },
  {
    id: 'step-spray-mix',
    stepIndex: 4,
    title: '4. Calculadora de Calda & Sequência de Mistura (NR-31)',
    targetView: 'spray-mix',
    targetViewLabel: 'Calda (NR-31)',
    badge: 'Segurança Agronômica',
    role: 'ASSISTANT',
    highlightArea: 'Cálculo de tanques, ordem estrita de defensivos e checklist de EPIs.',
    description: 'Calcula o volume total de calda e a quantidade exata de cada insumo por tanque. Garante a sequência agronômica correta de adição (pH → WG → SC → EC → Adjuvante) para evitar empelotamento.',
    practicalTip: 'A ordem correta de mistura é mandatória pela NR-31 e evita o entupimento de bicos e filtros do drone.',
    suggestedAction: 'Altere a taxa de aplicação de 10 para 15 L/ha e veja a recalibração automática.'
  },
  {
    id: 'step-weather',
    stepIndex: 5,
    title: '5. Estação Meteorológica & Portão de Decolagem (Delta T)',
    targetView: 'weather',
    targetViewLabel: 'Clima & Delta T',
    badge: 'Segurança de Voo',
    role: 'PILOT',
    highlightArea: 'Termohigroanemômetro psicrométrico com bloqueio automático contra deriva.',
    description: 'Mede vento, temperatura e umidade relativa. O sistema calcula o Delta T psicrométrico em tempo real. Se o vento for > 15 km/h ou Delta T > 8°C, a decolagem é bloqueada pelo sistema para evitar deriva e evaporação.',
    practicalTip: 'A faixa ouro para aplicação com drone é Delta T entre 2°C e 8°C com vento entre 3 e 10 km/h.',
    suggestedAction: 'Mova os controles do simulador de vento e temperatura para ver o portão de voo abrir e fechar.'
  },
  {
    id: 'step-telemetry',
    stepIndex: 6,
    title: '6. Telemetria de Voo & Importação de Logs DJI / XAG',
    targetView: 'telemetry',
    targetViewLabel: 'Telemetria',
    badge: 'Auditoria de Voo',
    role: 'PILOT',
    highlightArea: 'Processamento de malha RTK, faixas de aplicação e eficiência ha/h.',
    description: 'Importa arquivos de telemetria dos drones (.DAT / .KML). Audita a sobreposição de faixas RTK, velocidade média, altura sobre o dossel, vazão dos bicos e desgaste das baterias.',
    practicalTip: 'A uniformidade RTK acima de 95% comprova a qualidade do serviço prestado ao produtor rural.',
    suggestedAction: 'Dê play no simulador de voo para assistir o traçado das passadas do drone.'
  },
  {
    id: 'step-pricing',
    stepIndex: 7,
    title: '7. Matriz Inteligente de Precificação Aeroagrícola',
    targetView: 'pricing',
    targetViewLabel: 'Precificação',
    badge: 'Formação de Preço',
    role: 'ADMIN',
    highlightArea: 'R$/ha base, multiplicadores de relevo, cultura e descontos por escala.',
    description: 'Configure regras dinâmicas de preços. O sistema calcula automaticamente o valor justo por hectare considerando cultura, relevo, taxa de aplicação e volume total contratado.',
    practicalTip: 'Descontos de escala acima de 300 hectares incentivam o fechamento de grandes áreas de fazendas.',
    suggestedAction: 'Consulte as regras por relevo (Plano, Suave-Ondulado e Montanhoso).'
  },
  {
    id: 'step-financial',
    stepIndex: 8,
    title: '8. Financeiro, DRE & Rateio de Comissões da Tripulação',
    targetView: 'financial',
    targetViewLabel: 'Financeiro',
    badge: 'Fluxo de Caixa',
    role: 'ADMIN',
    highlightArea: 'Contas a Receber, Contas a Pagar, comissões de pilotos e ajudantes e DRE.',
    description: 'Ao concluir uma OS, o sistema gera a duplicata do cliente e provisiona as comissões da tripulação de campo automaticamente, sem necessidade de planilhas manuais.',
    practicalTip: 'Veja a DRE consolidada com a margem líquida da empresa em cada hectare pulverizado.',
    suggestedAction: 'Analise o extrato de comissões por piloto e ajudante.'
  },
  {
    id: 'step-branding',
    stepIndex: 9,
    title: '9. Estúdio de Marca & Identidade White Label',
    targetView: 'branding',
    targetViewLabel: 'Marca & Cores',
    badge: 'White Label',
    role: 'ADMIN',
    highlightArea: 'Upload de logotipo, paleta de cores primárias, tipografia e dados CREA/MAPA.',
    description: 'Personalize todo o sistema com a identidade visual da sua empresa de aviação agrícola. Escolha cores, faça upload do logo, audite o contraste WCAG e configure os dados oficiais que saem nos certificados.',
    practicalTip: 'Todas as alterações de marca persistem no navegador e refletem em tempo real em todas as telas.',
    suggestedAction: 'Experimente trocar para uma das empresas de exemplo ou alterar a cor primária.'
  },
  {
    id: 'step-admin-management',
    stepIndex: 10,
    title: '10. Gestão de Cadastros, Drones & Políticas Salariais',
    targetView: 'admin-management',
    targetViewLabel: 'Gestão & Cadastros',
    badge: 'Controle Total',
    role: 'ADMIN',
    highlightArea: 'Cadastro de usuários RBAC, frotas homologadas ANAC, pilotos DECEA e comissões.',
    description: 'Módulo exclusivo para Administradores: cadastre novos usuários, controle o prefixo e manutenção de drones, gerencie dados dos clientes rurais e ajuste salários base e taxas de comissão.',
    practicalTip: 'Somente usuários com perfil de Administrador possuem acesso a este módulo de governança.',
    suggestedAction: 'Explore as abas de Drones, Clientes e Políticas Salariais.'
  }
];

interface InteractiveTourOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  theme: WhiteLabelTheme;
  currentUser: UserProfile;
  currentStepIndex: number;
  setCurrentStepIndex: (index: number) => void;
  onNavigate: (view: AppViewMode) => void;
  onOpenSimulator: () => void;
}

export const InteractiveTourOverlay: React.FC<InteractiveTourOverlayProps> = ({
  isOpen,
  onClose,
  theme,
  currentUser,
  currentStepIndex,
  setCurrentStepIndex,
  onNavigate,
  onOpenSimulator,
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  const totalSteps = LIVE_TOUR_STEPS.length;
  const currentStep = LIVE_TOUR_STEPS[currentStepIndex] || LIVE_TOUR_STEPS[0];

  // When step changes, navigate to the target view automatically
  useEffect(() => {
    if (isOpen && currentStep) {
      onNavigate(currentStep.targetView);
    }
  }, [isOpen, currentStepIndex, currentStep, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      const next = currentStepIndex + 1;
      setCurrentStepIndex(next);
      onNavigate(LIVE_TOUR_STEPS[next].targetView);
    } else {
      // Completed tour
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prev = currentStepIndex - 1;
      setCurrentStepIndex(prev);
      onNavigate(LIVE_TOUR_STEPS[prev].targetView);
    }
  };

  const handleSelectStep = (idx: number) => {
    setCurrentStepIndex(idx);
    onNavigate(LIVE_TOUR_STEPS[idx].targetView);
  };

  return (
    <>
      {/* Subtle screen border highlight indicating active live tour */}
      <div 
        className="fixed inset-0 pointer-events-none z-40 border-4 sm:border-[6px] transition-colors duration-300 shadow-2xl"
        style={{ borderColor: `${theme.primaryColor}80` }}
      />

      {/* Floating Tour Header Badge (Always visible) */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-950/90 text-white border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs">
        <Compass className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
        <span className="font-bold">Modo Tour Guiado:</span>
        <span className="text-emerald-300 font-extrabold">{currentStep.targetViewLabel}</span>
        <span className="text-slate-400 font-mono text-[11px]">({currentStepIndex + 1}/{totalSteps})</span>
        
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          className="ml-2 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={isMinimized ? 'Expandir painel do tour' : 'Minimizar painel do tour'}
        >
          {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          title="Encerrar tour"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Minimized Dock Bar */}
      {isMinimized && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-slate-900/95 text-white border border-slate-700/80 rounded-2xl px-5 py-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-xs font-bold">{currentStep.title}</span>
          </div>

          <div className="flex items-center gap-1.5 pl-3 border-l border-slate-700">
            <button
              disabled={currentStepIndex === 0}
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-xs flex items-center gap-1"
            >
              {currentStepIndex === totalSteps - 1 ? 'Concluir' : 'Próxima Tela'}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMinimized(false)}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold ml-1 flex items-center gap-1"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Ver Detalhes</span>
            </button>
          </div>
        </div>
      )}

      {/* Full Expanded Floating Guided Card */}
      {!isMinimized && (
        <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-50 max-w-lg w-[calc(100vw-3rem)] bg-white dark:bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header & Controls */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div 
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                    {currentStep.badge}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Passo {currentStepIndex + 1} de {totalSteps}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {currentStep.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Minimizar painel para explorar a tela livremente"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Description & Highlight */}
          <div className="space-y-2.5 text-xs text-slate-800 dark:text-slate-100">
            <p className="leading-relaxed font-medium">
              {currentStep.description}
            </p>

            {/* Practical Tip */}
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 text-xs">
              <div className="font-bold flex items-center gap-1.5 mb-0.5 text-amber-900 dark:text-amber-200">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Dica Prática de Uso:
              </div>
              <p className="text-[11px] leading-relaxed">
                {currentStep.practicalTip}
              </p>
            </div>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-1.5 py-1">
            {LIVE_TOUR_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => handleSelectStep(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  idx === currentStepIndex
                    ? 'w-6 bg-emerald-500'
                    : idx < currentStepIndex
                    ? 'w-2 bg-emerald-300 dark:bg-emerald-800'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
                title={`Ir para o passo ${idx + 1}: ${step.targetViewLabel}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentStepIndex === 0}
                onClick={handlePrev}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Anterior
              </button>

              <button
                onClick={() => setIsMinimized(true)}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                title="Minimizar e interagir com os botões desta tela"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Explorar Tela</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSimulator}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border border-cyan-300/40 hover:bg-cyan-100 transition-colors flex items-center gap-1"
                title="Abrir o Laboratório de Simulação do Ciclo da OS"
              >
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
                <span className="hidden sm:inline">Simulador de OS</span>
              </button>

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <span>{currentStepIndex === totalSteps - 1 ? 'Concluir Tour' : 'Próxima Tela'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
