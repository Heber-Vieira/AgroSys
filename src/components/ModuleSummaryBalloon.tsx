import React, { useEffect, useCallback } from 'react';
import { AppViewMode } from '../types';
import { MODULE_SUMMARIES, ModuleFeatureSummary } from '../data/moduleSummariesData';
import { 
  X, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  ShieldCheck, 
  Workflow, 
  MapPin, 
  TrendingUp, 
  Zap, 
  FileText, 
  Calculator, 
  Sliders, 
  Users, 
  Database,
  CheckCircle2,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface ModuleSummaryBalloonProps {
  moduleId: AppViewMode | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: AppViewMode) => void;
  availableModules?: AppViewMode[];
}

export const ModuleSummaryBalloon: React.FC<ModuleSummaryBalloonProps> = ({
  moduleId,
  isOpen,
  onClose,
  onNavigate,
  availableModules = Object.keys(MODULE_SUMMARIES) as AppViewMode[]
}) => {
  if (!isOpen || !moduleId) return null;

  const currentModule: ModuleFeatureSummary | undefined = MODULE_SUMMARIES[moduleId];
  const currentIndex = availableModules.indexOf(moduleId);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      const prevId = availableModules[currentIndex - 1];
      // Select previous
      const element = document.getElementById(`module-card-${prevId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex, availableModules]);

  const handleNext = useCallback(() => {
    if (currentIndex < availableModules.length - 1) {
      const nextId = availableModules[currentIndex + 1];
      const element = document.getElementById(`module-card-${nextId}`);
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [currentIndex, availableModules]);

  // Keyboard navigation: ESC, Left, Right
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!currentModule) return null;

  const renderFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'workflow': return <Workflow className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'shield': return <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />;
      case 'map': return <MapPin className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />;
      case 'chart': return <TrendingUp className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />;
      case 'zap': return <Zap className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />;
      case 'file': return <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />;
      case 'calculator': return <Calculator className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />;
      case 'settings': return <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />;
      case 'users': return <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'database': return <Database className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />;
      default: return <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />;
    }
  };

  const getCategoryTheme = (cat: string) => {
    switch (cat) {
      case 'operacoes':
        return {
          badgeBg: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
          gradient: 'from-emerald-600 to-teal-700',
          accent: 'text-emerald-600 dark:text-emerald-400',
        };
      case 'agronomia':
        return {
          badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
          gradient: 'from-amber-600 to-orange-700',
          accent: 'text-amber-600 dark:text-amber-400',
        };
      case 'comercial':
        return {
          badgeBg: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
          gradient: 'from-purple-600 to-indigo-700',
          accent: 'text-purple-600 dark:text-purple-400',
        };
      case 'frota':
        return {
          badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
          gradient: 'from-sky-600 to-blue-700',
          accent: 'text-sky-600 dark:text-sky-400',
        };
      case 'sistema':
      default:
        return {
          badgeBg: 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
          gradient: 'from-indigo-600 to-blue-700',
          accent: 'text-indigo-600 dark:text-indigo-400',
        };
    }
  };

  const themeStyle = getCategoryTheme(currentModule.category);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-[#07241a] rounded-2xl shadow-2xl border border-emerald-500/30 dark:border-emerald-700/50 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with gradient banner */}
        <div className={`p-4 sm:p-5 bg-gradient-to-r ${themeStyle.gradient} text-white relative flex items-start justify-between gap-3 shrink-0`}>
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white shadow-2xs">
                  {currentModule.categoryLabel}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/20 text-white/90">
                  {currentModule.badge}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-white leading-tight">
                {currentModule.title}
              </h2>
              <p className="text-xs text-white/80 line-clamp-1 mt-0.5 font-medium">
                {currentModule.subtitle}
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-white/20"
            title="Fechar balão explicativo (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-700 dark:text-slate-200">
          {/* Highlight description block */}
          <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-300">
                Sobre este Módulo
              </h4>
              <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 mt-0.5 leading-relaxed">
                {currentModule.highlightText}
              </p>
            </div>
          </div>

          {/* All functionalities list */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Funcionalidades Inclusas no Módulo ({currentModule.features.length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {currentModule.features.map((feat, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    onClose();
                    onNavigate(currentModule.id);
                  }}
                  className="p-3 rounded-xl bg-slate-50/90 dark:bg-[#061e16] border border-slate-200/80 dark:border-emerald-900/60 hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/40 transition-all flex items-start gap-3 cursor-pointer group"
                  title={`Acessar ${feat.title} no módulo ${currentModule.title}`}
                >
                  <div className="p-2 rounded-lg bg-white dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800/80 shadow-2xs group-hover:scale-105 transition-transform">
                    {renderFeatureIcon(feat.iconName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center justify-between gap-1.5">
                      <span>{feat.title}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                    </h4>
                    <p className="text-[11.5px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                      {feat.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance & Value Box */}
          <div className="p-3 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/50 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Valor Operacional & Conformidade
              </h4>
              <p className="text-xs text-teal-900 dark:text-teal-200 mt-0.5 leading-relaxed">
                {currentModule.complianceOrValue}
              </p>
            </div>
          </div>

          {/* Quick Actions Interactive Buttons */}
          {currentModule.quickActions && currentModule.quickActions.length > 0 && (
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Atalhos & Ações Frequentes:</span>
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  Clique para executar
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {currentModule.quickActions.map((action, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                      onNavigate(action.targetView);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/80 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 text-emerald-900 dark:text-emerald-200 border border-emerald-300/80 dark:border-emerald-700/80 shadow-2xs hover:shadow-md hover:scale-[1.03] active:scale-95 transition-all duration-150 cursor-pointer group"
                    title={`Abrir ${action.label} no módulo ${action.targetView}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 group-hover:text-white transition-colors" />
                    <span>{action.label}</span>
                    <ArrowRight className="w-3 h-3 text-emerald-500 dark:text-emerald-400 group-hover:text-white group-hover:translate-x-0.5 transition-all opacity-70 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with Navigation CTA */}
        <div className="p-3 sm:p-4 bg-slate-50/80 dark:bg-[#051a13] border-t border-slate-200 dark:border-emerald-900/60 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <button
            onClick={() => {
              onClose();
              onNavigate(currentModule.id);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <span>Acessar Módulo Agora</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
