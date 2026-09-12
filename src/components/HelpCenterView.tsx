import React, { useState } from 'react';
import { 
  HelpCircle, 
  ShieldCheck, 
  User, 
  Plane, 
  Wrench, 
  CheckCircle2, 
  Circle, 
  ExternalLink, 
  Search, 
  Compass, 
  BookOpen, 
  AlertTriangle, 
  FileCheck2, 
  Sparkles, 
  Layers, 
  ArrowRight, 
  Printer, 
  X,
  ChevronDown,
  ChevronRight,
  Info
} from 'lucide-react';
import { UserProfile, UserRole, WhiteLabelTheme, AppViewMode } from '../types';
import { ROLE_HELP_DATA, RoleHelpItem } from '../data/roleHelpData';

interface HelpCenterViewProps {
  currentUser: UserProfile;
  theme: WhiteLabelTheme;
  onNavigate: (view: AppViewMode) => void;
  onStartTour: () => void;
  onStartLiveTour?: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const HelpCenterView: React.FC<HelpCenterViewProps> = ({
  currentUser,
  theme,
  onNavigate,
  onStartTour,
  onStartLiveTour,
  isModal = false,
  onCloseModal,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentUser.role);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'workflow' | 'modules' | 'regulations' | 'faq' | 'tips'>('workflow');
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, boolean>>({});
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(0);

  const roleHelp: RoleHelpItem = ROLE_HELP_DATA[selectedRole] || ROLE_HELP_DATA.ADMIN;

  const toggleChecklist = (itemKey: string) => {
    setCheckedChecklistItems(prev => ({
      ...prev,
      [itemKey]: !prev[itemKey],
    }));
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return <ShieldCheck className="w-4 h-4" />;
      case 'USER':
        return <User className="w-4 h-4" />;
      case 'PILOT':
        return <Plane className="w-4 h-4" />;
      case 'ASSISTANT':
        return <Wrench className="w-4 h-4" />;
    }
  };

  const completedStepsCount = roleHelp.workflowSteps.filter(s => checkedChecklistItems[`${selectedRole}-${s.order}`]).length;
  const progressPct = Math.round((completedStepsCount / roleHelp.workflowSteps.length) * 100);

  // Filtered FAQ
  const filteredFaqs = roleHelp.faq.filter(f => 
    f.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Workflow
  const filteredWorkflow = roleHelp.workflowSteps.filter(w =>
    w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.actionTip.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`space-y-6 ${isModal ? 'p-1 sm:p-2' : ''}`}>
      {/* Top Banner / Hero */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden">
        {/* Subtle background glow */}
        <div 
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ backgroundColor: roleHelp.primaryColor }}
        />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start sm:items-center gap-3.5">
            <div 
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: roleHelp.primaryColor }}
            >
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Central de Ajuda & Manuais por Perfil
                </h1>
                <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                  AgroSys
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Guia operacional completo com fluxos de trabalho, boas práticas de campo, normas legais e soluções para cada perfil.
              </p>
            </div>
          </div>

          <div className="print:hidden flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => {
                if (isModal && onCloseModal) onCloseModal();
                if (onStartLiveTour) onStartLiveTour();
                else onStartTour();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Tour Virtual Interativo</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-xs transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
              title="Imprimir Guia de Operação e Normas"
            >
              <Printer className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Imprimir Guia Manual</span>
            </button>
            
            {isModal && onCloseModal && (
              <button
                onClick={onCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Fechar Ajuda"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Search bar inside header */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar dúvidas, termos (ex: Delta T, EPI, NDVI, SARPAS, Calda)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 self-start sm:self-auto">
            <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>Perfil ativo na sessão: <strong className="text-slate-800 dark:text-slate-200">{currentUser.roleLabel}</strong></span>
          </div>
        </div>
      </div>

      {/* Role Switcher Tabs */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-xs">
        <div className="text-xs font-bold text-slate-400 dark:text-slate-500 px-3 py-1.5 uppercase tracking-wider">
          Selecione o Perfil para Visualizar o Guia Dedicado:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {(['ADMIN', 'USER', 'PILOT', 'ASSISTANT'] as UserRole[]).map((roleKey) => {
            const rData = ROLE_HELP_DATA[roleKey];
            const isSelected = selectedRole === roleKey;
            const isUserActiveProfile = currentUser.role === roleKey;

            return (
              <button
                key={roleKey}
                onClick={() => setSelectedRole(roleKey)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? `${rData.bgColor} ${rData.borderColor} shadow-xs ring-2 ring-emerald-500/20`
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {isUserActiveProfile && (
                  <span className="absolute top-2.5 right-2.5 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-emerald-500 text-white uppercase tracking-wider shadow-2xs">
                    Seu Perfil
                  </span>
                )}
                
                <div className="flex items-center gap-2 mb-1.5">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold"
                    style={{ backgroundColor: rData.primaryColor }}
                  >
                    {getRoleIcon(roleKey)}
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 dark:text-white">
                      {roleKey === 'ADMIN' ? 'Administrador' : roleKey === 'USER' ? 'Produtor Rural' : roleKey === 'PILOT' ? 'Piloto de Drone' : 'Auxiliar de Solo'}
                    </h3>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1">
                  {rData.badge}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Profile Highlight Card */}
      <div className={`rounded-2xl border p-5 sm:p-6 ${roleHelp.bgColor} ${roleHelp.borderColor} shadow-xs`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="text-xs font-black px-2.5 py-0.5 rounded-md text-white shadow-2xs flex items-center gap-1.5"
                style={{ backgroundColor: roleHelp.primaryColor }}
              >
                {getRoleIcon(selectedRole)}
                {roleHelp.roleTitle}
              </span>
              {selectedRole === currentUser.role && (
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-300/40">
                  ✓ Perfil Conectado
                </span>
              )}
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1.5">
              {roleHelp.roleSubtitle}
            </h2>
          </div>

          {/* Quick Progress on Checklist */}
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Progresso do Treinamento</div>
              <div className="text-sm font-black text-slate-900 dark:text-white">{completedStepsCount} de {roleHelp.workflowSteps.length} etapas ({progressPct}%)</div>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center font-black text-xs relative overflow-hidden"
                 style={{ borderTopColor: roleHelp.primaryColor }}>
              <span>{progressPct}%</span>
            </div>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-4 leading-relaxed">
          {roleHelp.description}
        </p>

        {/* Key Responsibilities Pill Grid */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
            Principais Responsabilidades & Escopo de Ação:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {roleHelp.keyResponsibilities.map((resp, idx) => (
              <div 
                key={idx}
                className="flex items-start gap-2 text-xs bg-white/70 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>{resp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inner View Navigation Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('workflow')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'workflow'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Fluxo de Trabalho Passo a Passo ({roleHelp.workflowSteps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('modules')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'modules'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Módulos Recomendados ({roleHelp.relevantModules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('regulations')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'regulations'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Normas & Leis ({roleHelp.regulatoryStandards.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'faq'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Dúvidas Frequentes ({roleHelp.faq.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('tips')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'tips'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Dicas de Ouro & Segurança ({roleHelp.fieldTips.length})</span>
        </button>
      </div>

      {/* Tab 1: Workflow Step by Step (Interactive Checklist) */}
      {activeTab === 'workflow' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Marque as etapas conforme você as executa ou conclui o treinamento prático:</span>
            <button
              onClick={() => {
                const allChecked: Record<string, boolean> = {};
                roleHelp.workflowSteps.forEach(s => {
                  allChecked[`${selectedRole}-${s.order}`] = true;
                });
                setCheckedChecklistItems(allChecked);
              }}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
            >
              Marcar Todas como Concluídas
            </button>
          </div>

          <div className="space-y-3">
            {filteredWorkflow.map((step) => {
              const itemKey = `${selectedRole}-${step.order}`;
              const isChecked = !!checkedChecklistItems[itemKey];

              return (
                <div
                  key={step.order}
                  className={`border rounded-2xl p-4 sm:p-5 transition-all ${
                    isChecked
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => toggleChecklist(itemKey)}
                        className="mt-0.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer flex-shrink-0 transition-colors"
                        title={isChecked ? 'Marcar como pendente' : 'Marcar como concluída'}
                      >
                        {isChecked ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            Etapa {step.order}
                          </span>
                          <h3 className={`text-sm font-black ${isChecked ? 'line-through text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                            {step.title}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                          {step.description}
                        </p>

                        <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-900/60">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span><strong>Dica Prática:</strong> {step.actionTip}</span>
                        </div>
                      </div>
                    </div>

                    {/* Button to jump to screen */}
                    <button
                      onClick={() => {
                        if (isModal && onCloseModal) onCloseModal();
                        onNavigate(step.screen as AppViewMode);
                      }}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <span>Abrir Tela</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Recommended Modules */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleHelp.relevantModules.map((mod) => (
            <div
              key={mod.moduleId}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-emerald-500/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {mod.moduleName}
                  </h3>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500">
                    /{mod.moduleId}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                  {mod.purpose}
                </p>

                <div className="mt-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-700 dark:text-slate-300">Como Operar:</strong> {mod.howToUse}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    if (isModal && onCloseModal) onCloseModal();
                    onNavigate(mod.moduleId as AppViewMode);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-slate-950 flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer"
                >
                  <span>Acessar {mod.moduleName}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Regulatory Standards & Compliance */}
      {activeTab === 'regulations' && (
        <div className="space-y-4">
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Segurança Jurídica & Agronômica:</strong> O AgroSys foi estruturado para cumprir com rigor as exigências da ANAC, DECEA, MAPA, Ministério do Trabalho (NR-31) e InpEV. A inobservância dessas normas acarreta em penalidades e interdição operacional.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roleHelp.regulatoryStandards.map((reg, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      {reg.agency}
                    </span>
                    <FileCheck2 className="w-4 h-4 text-emerald-500" />
                  </div>

                  <h3 className="text-sm font-black text-slate-900 dark:text-white mt-2">
                    {reg.code}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {reg.description}
                  </p>

                  <p className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 text-slate-700 dark:text-slate-300 mt-3 leading-relaxed">
                    {reg.ruleDetail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 dark:text-slate-400">
              Nenhuma dúvida encontrada para o termo "{searchQuery}".
            </div>
          ) : (
            filteredFaqs.map((faq, idx) => {
              const isOpen = expandedFaqIndex === idx;

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs transition-colors"
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {faq.question}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 5: Gold Field Tips & Best Practices */}
      {activeTab === 'tips' && (
        <div className="space-y-3">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Recomendações técnicas refinadas a partir de centenas de horas de operação em lavouras comerciais:
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {roleHelp.fieldTips.map((tip, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-slate-900 dark:text-white">
                    Dica de Campo #{idx + 1}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                    {tip}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Call to Action / Help Shortcuts */}
      <div className="bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-600 dark:text-slate-400">
          <BookOpen className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          <span>Quer conhecer o ciclo completo de uma Ordem de Serviço na prática?</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (isModal && onCloseModal) onCloseModal();
              onStartTour();
            }}
            className="px-3.5 py-1.5 rounded-xl font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-950 hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Abrir Tour Virtual</span>
          </button>
        </div>
      </div>
    </div>
  );
};
