import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Upload, 
  Sparkles, 
  Sun, 
  Moon, 
  SunMedium, 
  Check, 
  Copy, 
  Shield, 
  Wind, 
  Droplets, 
  Thermometer,
  Plane,
  Building2,
  FileCheck2,
  Download,
  RotateCcw,
  Eye,
  CheckCircle2,
  Layers,
  Type,
  Phone,
  Award,
  Trash2,
  FileText,
  Smartphone,
  MapPin,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { ThemeMode, WhiteLabelTheme, UserProfile } from '../types';
import { 
  generateToneScale, 
  extractPaletteFromImage, 
  evaluateWcagCompliance,
  PRESET_COMPANIES,
  PRESET_LOGOS
} from '../data/themeTokensData';
import { BrandLogo } from './BrandLogo';

interface AdminBrandingStudioProps {
  theme: WhiteLabelTheme;
  setTheme: React.Dispatch<React.SetStateAction<WhiteLabelTheme>>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  currentUser: UserProfile;
  onSwitchToAdmin?: () => void;
  onNavigate?: (view: string) => void;
}

export const AdminBrandingStudio: React.FC<AdminBrandingStudioProps> = ({
  theme,
  setTheme,
  themeMode,
  setThemeMode,
  currentUser,
  onSwitchToAdmin,
  onNavigate,
}) => {
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('Alterações aplicadas com sucesso!');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'css' | 'json' | 'tailwind'>('css');
  const [activeSubTab, setActiveSubTab] = useState<'palette' | 'logo' | 'typography' | 'company' | 'preview'>('palette');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const primaryScale = generateToneScale(theme.primaryColor);
  const secondaryScale = generateToneScale(theme.secondaryColor);

  // WCAG evaluations
  const primaryOnWhite = evaluateWcagCompliance(theme.primaryColor, '#FFFFFF');
  const textOnPrimary = evaluateWcagCompliance('#FFFFFF', theme.primaryColor);
  const accentOnWhite = evaluateWcagCompliance(theme.accentColor, '#FFFFFF');

  const isAdmin = currentUser.role === 'ADMIN';

  const showToast = (msg: string = 'Alterações salvas e sincronizadas!') => {
    setToastMessage(msg);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extracted = await extractPaletteFromImage(file);
      setTheme(prev => ({
        ...prev,
        primaryColor: extracted.primary,
        secondaryColor: extracted.secondary,
        logoUrl: extracted.dataUrl,
        logoIconId: undefined,
      }));
      showToast('Logotipo carregado e paleta extraída com sucesso!');
    } catch (err) {
      console.error('Falha ao processar logotipo:', err);
    }
  };

  const handleSelectPresetLogo = (logoId: string) => {
    setTheme(prev => ({
      ...prev,
      logoIconId: logoId,
      logoUrl: undefined,
    }));
    showToast('Brasão vetorial selecionado!');
  };

  const handleRemoveCustomLogo = () => {
    setTheme(prev => ({
      ...prev,
      logoUrl: undefined,
      logoIconId: undefined,
    }));
    showToast('Logotipo removido. Restaurado ícone padrão.');
  };

  const handleApplyPresetTheme = (presetId: string) => {
    const found = PRESET_COMPANIES.find(p => p.id === presetId);
    if (!found) return;

    setTheme(prev => ({
      ...prev,
      tenantId: found.id,
      companyName: found.name,
      tagline: found.tagline,
      primaryColor: found.primary,
      secondaryColor: found.secondary,
      accentColor: found.accent,
      surfaceLight: found.surfaceLight || '#FFFFFF',
      surfaceDark: found.surfaceDark || '#0f172a',
    }));
    showToast(`Tema "${found.name}" aplicado!`);
  };

  const handleResetToCleanDefault = () => {
    const cleanDefault = PRESET_COMPANIES[0];
    setTheme({
      tenantId: cleanDefault.id,
      companyName: cleanDefault.name,
      tagline: cleanDefault.tagline,
      primaryColor: cleanDefault.primary,
      secondaryColor: cleanDefault.secondary,
      accentColor: cleanDefault.accent,
      surfaceLight: '#FFFFFF',
      surfaceDark: '#0f172a',
      borderRadius: '0.875rem',
      fontFamily: 'Plus Jakarta Sans',
      contactPhone: '(65) 99841-3200',
      contactEmail: 'operacoes@aeroagro.com.br',
      registryCreaMapa: 'MAPA/SDA nº 18.942/2025 • ART CREA-MT 2026-8914',
      brandStyle: 'modern',
      density: 'comfortable',
    });
    showToast('Padrão Clean & Amigável restaurado!');
  };

  const exportToJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(theme, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `agrosys-theme-${theme.tenantId || 'custom'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Tema exportado para arquivo .JSON!');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && (parsed.primaryColor || parsed.companyName)) {
          setTheme(prev => ({
            ...prev,
            ...parsed
          }));
          showToast('Configuração de tema importada com sucesso!');
        }
      } catch (err) {
        console.error('Erro ao importar JSON de tema:', err);
      }
    };
    reader.readAsText(file);
  };

  const cssVariablesSnippet = `:root {
  /* AgroSys - Dynamic Clean & Friendly Tokens */
  --color-primary: ${theme.primaryColor};
  --color-primary-50: ${primaryScale[50]};
  --color-primary-500: ${primaryScale[500]};
  --color-primary-700: ${primaryScale[700]};
  --color-primary-900: ${primaryScale[900]};

  --color-secondary: ${theme.secondaryColor};
  --color-secondary-50: ${secondaryScale[50]};
  --color-secondary-500: ${secondaryScale[500]};

  --color-accent: ${theme.accentColor};
  --surface-light: ${theme.surfaceLight || '#FFFFFF'};
  --surface-dark: ${theme.surfaceDark || '#0f172a'};
  --font-family: '${theme.fontFamily || 'Plus Jakarta Sans'}', sans-serif;
  --radius-theme: ${theme.borderRadius || '0.875rem'};
}`;

  const tailwindSnippet = `// tailwind.config.js - AgroSys White Label
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '${primaryScale[50]}',
          500: '${primaryScale[500]}',
          600: '${theme.primaryColor}',
          700: '${primaryScale[700]}',
          DEFAULT: '${theme.primaryColor}',
        },
        secondary: '${theme.secondaryColor}',
        accent: '${theme.accentColor}',
      },
      borderRadius: {
        theme: '${theme.borderRadius || '0.875rem'}',
      },
      fontFamily: {
        sans: ['${theme.fontFamily || 'Plus Jakarta Sans'}', 'sans-serif'],
      }
    }
  }
};`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(type);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400/40 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Top Banner with Admin Context */}
      <div className="bg-gradient-to-br from-emerald-50 via-emerald-100/40 to-emerald-50/70 dark:from-[#062c20] dark:via-[#093a2b] dark:to-[#062c20] text-emerald-950 dark:text-emerald-50 rounded-3xl p-6 sm:p-8 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs relative overflow-hidden">
        <div className="w-full relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-3 py-1 text-xs font-black rounded-full bg-emerald-500/15 text-emerald-900 dark:text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Área Exclusiva do Administrador
            </span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-2xs">
              <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Paleta Clean & Amigável
            </span>
            <span className="px-3 py-1 text-xs font-bold rounded-full bg-sky-500/15 text-sky-900 dark:text-sky-300 border border-sky-400/30 shadow-2xs">
              Contraste Solar WCAG AAA
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-emerald-950 dark:text-emerald-50 flex items-center gap-3">
                <span>Personalização de Marca & Identidade Visual</span>
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-relaxed max-w-3xl">
                Configure a paleta de cores institucional, logotipo corporativo, fontes e dados técnicos. 
                Todas as alterações são aplicadas instantaneamente em toda a plataforma, no aplicativo móvel e nos relatórios de campo.
              </p>
            </div>

            {/* Current Active Brand Badge */}
            <div className="bg-white/90 dark:bg-emerald-950/80 shadow-xs rounded-2xl p-3.5 border border-emerald-200/80 dark:border-emerald-700 flex items-center gap-3 min-w-[200px]">
              <BrandLogo theme={theme} size="md" />
              <div className="overflow-hidden">
                <span className="text-xs font-black text-emerald-950 dark:text-white block truncate">{theme.companyName}</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block truncate font-semibold">{theme.tagline || 'AgroSys'}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions Row */}
          <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-4 border-t border-emerald-200/70 dark:border-emerald-800/70">
            <button
              onClick={handleResetToCleanDefault}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Restaurar valores padrão do sistema"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Padrão Clean</span>
            </button>

            <button
              onClick={exportToJson}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Baixar arquivo JSON com as configurações do tema"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Tema (.JSON)</span>
            </button>

            <input
              ref={jsonInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              onClick={() => jsonInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-100/80 dark:bg-emerald-950/80 hover:bg-emerald-200/80 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Importar tema previamente exportado"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar Tema (.JSON)</span>
            </button>

            <button
              onClick={() => showToast('Configurações de marca gravadas com sucesso!')}
              className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 flex items-center gap-2 cursor-pointer ml-auto"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Aplicar & Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Non-admin alert warning */}
      {!isAdmin && (
        <div className="bg-amber-500/15 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Você está visualizando as configurações como <strong>{currentUser.roleLabel}</strong>. 
              Para salvar modificações em produção, certifique-se de alternar para o perfil de <strong>Administrador</strong>.
            </span>
          </div>
          {onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs whitespace-nowrap cursor-pointer"
            >
              Alternar para Administrador
            </button>
          )}
        </div>
      )}

      {/* Subtabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-emerald-200/80 dark:border-emerald-800/80">
        {[
          { id: 'palette', label: '1. Paletas & Cores', icon: Palette, badge: 'Clean & Solar' },
          { id: 'logo', label: '2. Logotipo & Brasão', icon: Upload, badge: theme.logoUrl ? 'Imagem Própria' : 'Vetor' },
          { id: 'typography', label: '3. Tipografia & Formas', icon: Type, badge: theme.fontFamily || 'Plus Jakarta' },
          { id: 'company', label: '4. Dados Institucionais', icon: FileCheck2, badge: 'MAPA/CREA' },
          { id: 'preview', label: '5. Simulador & Relatórios', icon: Eye, badge: 'Ao Vivo' },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-white/20 text-white' : 'bg-emerald-200/80 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-300'
              }`}>
                {tab.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. PALETTES & COLORS */}
      {activeSubTab === 'palette' && (
        <div className="space-y-6">
          {/* Preset Palettes Grid */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Paletas Pré-configuradas de Alto Desempenho
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                  Clique em qualquer perfil abaixo para carregar uma identidade cromática equilibrada e testada no campo.
                </p>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                {PRESET_COMPANIES.length} Opções Disponíveis
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pt-1">
              {PRESET_COMPANIES.map((preset) => {
                const isSelected = theme.tenantId === preset.id || theme.primaryColor.toLowerCase() === preset.primary.toLowerCase();
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleApplyPresetTheme(preset.id)}
                    className={`p-3 rounded-xl border-2 transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-white dark:bg-slate-800/95 shadow-2xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200/80 dark:border-slate-700/80 hover:border-emerald-400 dark:hover:border-emerald-600 bg-white dark:bg-slate-800/90 hover:bg-emerald-50/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1">
                          <div
                            className="w-4 h-4 rounded-full shadow-2xs border border-white/40"
                            style={{ backgroundColor: preset.primary }}
                          />
                          <div
                            className="w-3.5 h-3.5 rounded-full shadow-2xs -ml-1.5 border border-white/40"
                            style={{ backgroundColor: preset.secondary }}
                          />
                          <div
                            className="w-3 h-3 rounded-full shadow-2xs -ml-1.5 border border-white/40"
                            style={{ backgroundColor: preset.accent }}
                          />
                        </div>
                        {isSelected && (
                          <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-600 text-white flex items-center gap-0.5">
                            <Check className="w-2.5 h-2.5" /> Ativo
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                        {preset.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {preset.tagline}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[9px] font-mono text-slate-400">
                      <span>Primária: {preset.primary}</span>
                      <span>Realce: {preset.accent}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Color Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Primary Color */}
            <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: theme.primaryColor }} />
                  Cor Primária Institucional
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase">{theme.primaryColor}</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                Usada em botões principais, cabeçalhos de tabela, rotas no mapa GIS e destaques corporativos.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => {
                    setTheme({ ...theme, primaryColor: e.target.value });
                    showToast();
                  }}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-emerald-200 dark:border-emerald-700 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={theme.primaryColor}
                  onChange={(e) => {
                    setTheme({ ...theme, primaryColor: e.target.value });
                    showToast();
                  }}
                  className="flex-1 px-3 py-2 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs font-mono font-bold uppercase text-emerald-950 dark:text-white"
                />
              </div>

              {/* Tonal scale preview */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Escala Tonal Automática (50 - 900)</span>
                <div className="flex h-4 rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-700">
                  <div className="flex-1" style={{ backgroundColor: primaryScale[50] }} title="50" />
                  <div className="flex-1" style={{ backgroundColor: primaryScale[100] }} title="100" />
                  <div className="flex-1" style={{ backgroundColor: primaryScale[300] }} title="300" />
                  <div className="flex-1" style={{ backgroundColor: primaryScale[500] }} title="500" />
                  <div className="flex-1" style={{ backgroundColor: primaryScale[700] }} title="700" />
                  <div className="flex-1" style={{ backgroundColor: primaryScale[900] }} title="900" />
                </div>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: theme.secondaryColor }} />
                  Cor Secundária (Apoio & Calda)
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase">{theme.secondaryColor}</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                Usada em subtítulos, tanques de calda, status de auxiliares e cards informativos.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={theme.secondaryColor}
                  onChange={(e) => {
                    setTheme({ ...theme, secondaryColor: e.target.value });
                    showToast();
                  }}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-emerald-200 dark:border-emerald-700 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={theme.secondaryColor}
                  onChange={(e) => {
                    setTheme({ ...theme, secondaryColor: e.target.value });
                    showToast();
                  }}
                  className="flex-1 px-3 py-2 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs font-mono font-bold uppercase text-emerald-950 dark:text-white"
                />
              </div>

              {/* Secondary tonal preview */}
              <div className="pt-2">
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block mb-1">Escala Secundária Automática</span>
                <div className="flex h-4 rounded-lg overflow-hidden border border-emerald-200 dark:border-emerald-700">
                  <div className="flex-1" style={{ backgroundColor: secondaryScale[50] }} title="50" />
                  <div className="flex-1" style={{ backgroundColor: secondaryScale[200] }} title="200" />
                  <div className="flex-1" style={{ backgroundColor: secondaryScale[500] }} title="500" />
                  <div className="flex-1" style={{ backgroundColor: secondaryScale[700] }} title="700" />
                </div>
              </div>
            </div>

            {/* Accent Color */}
            <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-1.5">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: theme.accentColor }} />
                  Cor de Realce & Safra
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 uppercase">{theme.accentColor}</span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
                Usada em alertas climáticos, portão Delta T ótimo, badges de comissão e ações prioritárias.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="color"
                  value={theme.accentColor}
                  onChange={(e) => {
                    setTheme({ ...theme, accentColor: e.target.value });
                    showToast();
                  }}
                  className="w-10 h-10 rounded-xl cursor-pointer border border-emerald-200 dark:border-emerald-700 bg-transparent p-0.5"
                />
                <input
                  type="text"
                  value={theme.accentColor}
                  onChange={(e) => {
                    setTheme({ ...theme, accentColor: e.target.value });
                    showToast();
                  }}
                  className="flex-1 px-3 py-2 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs font-mono font-bold uppercase text-emerald-950 dark:text-white"
                />
              </div>

              {/* Accent sample badge */}
              <div className="pt-2 flex items-center gap-2">
                <span 
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full text-slate-950 shadow-xs"
                  style={{ backgroundColor: theme.accentColor }}
                >
                  Exemplo: Safra Soja 2026/27
                </span>
              </div>
            </div>
          </div>

          {/* WCAG 2.1 Accessibility Status */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 text-emerald-950 dark:text-emerald-50 rounded-3xl p-6 border border-emerald-200/80 dark:border-emerald-800/80 shadow-xs">
            <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4" />
              Auditoria de Acessibilidade & Contraste WCAG 2.1 (Visibilidade Solar)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-700 dark:text-emerald-300 block text-[11px]">Texto Branco no Fundo Primário</span>
                  <span className="font-bold text-emerald-950 dark:text-white">Razão: {textOnPrimary.ratio}:1</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  textOnPrimary.isAaNormalText ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                }`}>
                  {textOnPrimary.isAaaNormalText ? 'WCAG AAA' : textOnPrimary.isAaNormalText ? 'WCAG AA' : 'Baixo'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-700 dark:text-emerald-300 block text-[11px]">Primária no Fundo Branco</span>
                  <span className="font-bold text-emerald-950 dark:text-white">Razão: {primaryOnWhite.ratio}:1</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  primaryOnWhite.isAaNormalText ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-800 dark:text-rose-300'
                }`}>
                  {primaryOnWhite.isAaaNormalText ? 'WCAG AAA' : primaryOnWhite.isAaNormalText ? 'WCAG AA' : 'Baixo'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                <div>
                  <span className="text-emerald-700 dark:text-emerald-300 block text-[11px]">Realce no Fundo Branco</span>
                  <span className="font-bold text-emerald-950 dark:text-white">Razão: {accentOnWhite.ratio}:1</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  accentOnWhite.isAaNormalText ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                }`}>
                  {accentOnWhite.isAaNormalText ? 'Aprovado' : 'Atenção'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. LOGO & BRAND BADGES */}
      {activeSubTab === 'logo' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Upload Box */}
            <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Upload do Logotipo Próprio
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Envie o logotipo da sua empresa em formato <strong>.PNG</strong> com fundo transparente, <strong>.SVG</strong> ou <strong>.JPG</strong>.
              </p>

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-emerald-100/40 dark:bg-emerald-950/40 group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                  Clique para selecionar imagem do dispositivo
                </p>
                <p className="text-[10px] text-emerald-700/70 dark:text-emerald-400 mt-1">
                  Extração automática de cores e persistência local via Base64
                </p>
              </div>

              {theme.logoUrl && (
                <div className="p-3.5 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src={theme.logoUrl} alt="Logo Carregado" className="w-10 h-10 object-contain rounded-lg bg-white p-1 shadow-2xs border border-emerald-200" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 dark:text-white block">Logotipo Personalizado</span>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">● Ativo em todo o sistema</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCustomLogo}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    title="Remover logotipo personalizado"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Built-in Vector Logos Library */}
            <div className="lg:col-span-2 bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Biblioteca de Brasões do Agronegócio Integrada
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                    Caso não possua logotipo próprio em PNG, selecione um dos 6 brasões vetoriais de alta precisão.
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {PRESET_LOGOS.length} Modelos Nativos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
                {PRESET_LOGOS.map((logo) => {
                  const isSelected = !theme.logoUrl && theme.logoIconId === logo.id;
                  return (
                    <div
                      key={logo.id}
                      onClick={() => handleSelectPresetLogo(logo.id)}
                      className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col items-center text-center group ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-100/90 dark:bg-emerald-950/80 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-emerald-200/80 dark:border-emerald-800/70 hover:border-emerald-400 dark:hover:border-emerald-600 bg-emerald-100/40 dark:bg-[#083023]/60 hover:bg-emerald-100/70'
                      }`}
                    >
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-3 shadow-sm transition-transform group-hover:scale-105"
                        style={{ backgroundColor: theme.primaryColor }}
                      >
                        <svg className="w-6 h-6 fill-current" viewBox={logo.viewBox || "0 0 24 24"}>
                          <path d={logo.svgPath} />
                        </svg>
                      </div>

                      <span className="text-xs font-bold text-emerald-950 dark:text-white">
                        {logo.name}
                      </span>
                      <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400 mt-0.5">
                        {logo.category}
                      </span>

                      {isSelected && (
                        <span className="mt-2 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-600 text-white flex items-center gap-1">
                          <Check className="w-3 h-3" /> Selecionado
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Logo Context Preview Mockup */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Pré-visualização do Logotipo em Aplicações Reais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Header Navbar Mockup */}
              <div className="p-4 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">1. Barra Superior (Navbar)</span>
                <div className="p-3 bg-white dark:bg-emerald-900/40 rounded-xl shadow-xs border border-emerald-200 dark:border-emerald-700 flex items-center gap-3">
                  <BrandLogo theme={theme} size="sm" />
                  <div className="overflow-hidden">
                    <span className="text-xs font-black text-emerald-950 dark:text-white block truncate">{theme.companyName}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block truncate">{theme.tagline}</span>
                  </div>
                </div>
              </div>

              {/* PDF Report Header Mockup */}
              <div className="p-4 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">2. Cabeçalho de Relatório / OS</span>
                <div className="p-3 bg-white text-slate-900 rounded-xl shadow-xs border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BrandLogo theme={theme} size="sm" />
                    <div>
                      <span className="text-[11px] font-black block">{theme.companyName}</span>
                      <span className="text-[9px] text-slate-500 block">Laudo de Pulverização</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ART CONCLUÍDA
                  </span>
                </div>
              </div>

              {/* Mobile App Icon Mockup */}
              <div className="p-4 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase">3. Ícone do Aplicativo Móvel</span>
                <div className="flex items-center gap-3 p-3 bg-white dark:bg-emerald-900/40 rounded-xl shadow-xs border border-emerald-200 dark:border-emerald-700">
                  <BrandLogo theme={theme} size="lg" className="rounded-2xl shadow-md" />
                  <div>
                    <span className="text-xs font-black text-emerald-950 dark:text-white block">{theme.companyName}</span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">App Piloto & Campo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. TYPOGRAPHY & SHAPES */}
      {activeSubTab === 'typography' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Typography Choice */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <Type className="w-4 h-4 text-purple-500" />
              Família Tipográfica
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              Escolha a fonte principal aplicada instantaneamente a títulos, tabelas e telemetria.
            </p>

            <div className="space-y-2.5 pt-2">
              {[
                { name: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans (Padrão Clean & Moderno)', desc: 'Excelente legibilidade técnica, ótima para números de GPS e telemetria.' },
                { name: 'Outfit', label: 'Outfit (Geométrica & Amigável)', desc: 'Tons arredondados e calorosos para interfaces rurais acolhedoras.' },
                { name: 'DM Sans', label: 'DM Sans (Minimalista & Executiva)', desc: 'Alta densidade de informação para relatórios financeiros e ARTs.' },
                { name: 'Inter', label: 'Inter (Padrão de Sistema)', desc: 'Neutro, funcional e universalmente compatível.' },
              ].map((f) => (
                <div
                  key={f.name}
                  onClick={() => {
                    setTheme({ ...theme, fontFamily: f.name });
                    showToast(`Fonte alterada para "${f.name}"`);
                  }}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                    theme.fontFamily === f.name
                      ? 'border-emerald-500 bg-emerald-100/90 dark:bg-emerald-950/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-emerald-200/80 dark:border-emerald-800/70 hover:border-emerald-400 bg-emerald-100/40 dark:bg-[#083023]/60'
                  }`}
                >
                  <div>
                    <span 
                      className="text-xs font-bold text-emerald-950 dark:text-white block"
                      style={{ fontFamily: f.name }}
                    >
                      {f.label}
                    </span>
                    <span className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5 block">
                      {f.desc}
                    </span>
                  </div>
                  {theme.fontFamily === f.name && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Border Radius Choice */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <Layers className="w-4 h-4 text-teal-500" />
              Arredondamento de Cantos dos Cartões
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
              Controla a suavidade visual dos cartões, botões e caixas de diálogo.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { radius: '0.5rem', label: 'Compacto (8px)', desc: 'Técnico e reto' },
                { radius: '0.75rem', label: 'Moderno (12px)', desc: 'Equilibrado' },
                { radius: '0.875rem', label: 'Amigável (14px)', desc: 'Padrão AgroSys Clean' },
                { radius: '1.25rem', label: 'Curvo (20px)', desc: 'Orgânico e fluido' },
              ].map((r) => (
                <div
                  key={r.radius}
                  onClick={() => {
                    setTheme({ ...theme, borderRadius: r.radius });
                    showToast(`Arredondamento ajustado para ${r.label}`);
                  }}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                    theme.borderRadius === r.radius
                      ? 'border-emerald-500 bg-emerald-100/90 dark:bg-emerald-950/80 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-emerald-200/80 dark:border-emerald-800/70 hover:border-emerald-400 bg-emerald-100/40 dark:bg-[#083023]/60'
                  }`}
                >
                  <div
                    className="w-10 h-10 mx-auto mb-2 border-2 border-emerald-500 bg-emerald-500/20 shadow-xs"
                    style={{ borderRadius: r.radius }}
                  />
                  <span className="text-xs font-bold text-emerald-950 dark:text-white block">
                    {r.label}
                  </span>
                  <span className="text-[10px] text-emerald-700/70 dark:text-emerald-400 mt-0.5 block">
                    {r.desc}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. COMPANY & REPORT INFO */}
      {activeSubTab === 'company' && (
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-amber-500" />
              Identidade Corporativa em Relatórios de Pulverização
            </h3>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Estes dados são impressos automaticamente no cabeçalho e rodapé dos laudos técnicos, ARTs e certificados de entrega aos produtores.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                Razão Social / Nome da Empresa
              </label>
              <input
                type="text"
                value={theme.companyName}
                onChange={(e) => setTheme({ ...theme, companyName: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs font-bold text-emerald-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                Slogan / Tagline Operacional
              </label>
              <input
                type="text"
                value={theme.tagline}
                onChange={(e) => setTheme({ ...theme, tagline: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs text-emerald-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                Telefone de Plantão / WhatsApp de Campo
              </label>
              <input
                type="text"
                value={theme.contactPhone || ''}
                onChange={(e) => setTheme({ ...theme, contactPhone: e.target.value })}
                placeholder="(65) 99841-3200"
                className="w-full px-3.5 py-2.5 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs text-emerald-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                E-mail de Operações / Suporte Técnico
              </label>
              <input
                type="email"
                value={theme.contactEmail || ''}
                onChange={(e) => setTheme({ ...theme, contactEmail: e.target.value })}
                placeholder="operacoes@aeroagro.com.br"
                className="w-full px-3.5 py-2.5 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs text-emerald-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                Registro MAPA / CREA / ART do Responsável Técnico (RT)
              </label>
              <input
                type="text"
                value={theme.registryCreaMapa || ''}
                onChange={(e) => setTheme({ ...theme, registryCreaMapa: e.target.value })}
                placeholder="MAPA/SDA nº 18.942/2025 • ART CREA-MT 2026-8914"
                className="w-full px-3.5 py-2.5 bg-emerald-100/50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-700 rounded-xl text-xs text-emerald-950 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. SANDBOX, CERTIFICATES & CODE EXPORT */}
      {activeSubTab === 'preview' && (
        <div className="space-y-6">
          {/* Live Component Sandbox */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-200/60 dark:border-emerald-800/60">
              <div>
                <h3 className="text-base font-bold text-emerald-950 dark:text-emerald-50 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  Sandbox Interativo ao Vivo
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  Teste em tempo real como seus componentes, métricas e logotipo aparecem nos três modos de luminosidade.
                </p>
              </div>

              {/* Theme Mode Toggle inside Sandbox */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-700">
                <button
                  onClick={() => setThemeMode('light')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    themeMode === 'light' ? 'bg-white text-emerald-950 shadow-xs' : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Light Clean</span>
                </button>
                <button
                  onClick={() => setThemeMode('dark')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    themeMode === 'dark' ? 'bg-emerald-900 text-white shadow-xs' : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>Dark Grafite</span>
                </button>
                <button
                  onClick={() => setThemeMode('field')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    themeMode === 'field' ? 'bg-amber-400 text-black font-black shadow-xs' : 'text-emerald-700 dark:text-emerald-300'
                  }`}
                >
                  <SunMedium className="w-3.5 h-3.5" />
                  <span>Sol a Pino</span>
                </button>
              </div>
            </div>

            {/* Sandbox Mock UI Canvas */}
            <div className="p-4 sm:p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-white/80 dark:bg-[#041c14]/80 space-y-4">
              {/* Mock Header */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                <div className="flex items-center gap-3">
                  <BrandLogo theme={theme} size="sm" />
                  <div>
                    <span className="text-xs font-bold text-emerald-950 dark:text-white block">
                      {theme.companyName}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400">
                      {theme.tagline}
                    </span>
                  </div>
                </div>

                <button
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Ação Rápida
                </button>
              </div>

              {/* Mock 2 Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Área Aplicada Hoje</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: theme.primaryColor }}
                    >
                      ● Em Voo
                    </span>
                  </div>
                  <div className="text-xl font-black text-emerald-950 dark:text-white">
                    84.2 ha <span className="text-xs font-normal text-emerald-700 dark:text-emerald-400">/ 120 ha</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Portão Delta T</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: theme.accentColor }}
                    >
                      4.2 °C (Ideal)
                    </span>
                  </div>
                  <div className="text-xl font-black text-emerald-950 dark:text-white">
                    Vento: 8 km/h <span className="text-xs font-normal text-emerald-600 font-bold">● Seguro</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Official Application Certificate Mockup (Branded Report) */}
          <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-emerald-950 dark:text-white">
                  Certificado Oficial de Aplicação da Sua Empresa
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                Modelo MAPA / CREA
              </span>
            </div>

            {/* Certificate Paper */}
            <div className="bg-white text-slate-900 p-6 rounded-2xl border-2 border-emerald-200 space-y-4 font-sans shadow-xs">
              {/* Report Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-emerald-200">
                <div className="flex items-center gap-3">
                  <BrandLogo theme={theme} size="md" />
                  <div>
                    <h4 className="text-sm font-black text-slate-950 uppercase">{theme.companyName}</h4>
                    <p className="text-[10px] text-slate-600">{theme.tagline}</p>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">{theme.registryCreaMapa || 'MAPA/SDA nº 18.942/2025'}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-slate-950 block">CERTIFICADO DE APLICAÇÃO Nº 2026-084</span>
                  <span className="text-[10px] text-slate-500">Data de Emissão: 09/09/2026</span>
                </div>
              </div>

              {/* Grid with Field Data */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">Cliente / Fazenda</span>
                  <span className="font-bold text-slate-900">Agropecuária São José</span>
                </div>
                <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">Talhão / Cultura</span>
                  <span className="font-bold text-slate-900">Talhão 04 - Soja (84 ha)</span>
                </div>
                <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">Drone Homologado</span>
                  <span className="font-bold text-slate-900">DJI Agras T40 (PP-DRN-01)</span>
                </div>
                <div className="p-2.5 bg-emerald-50/40 rounded-lg border border-emerald-200">
                  <span className="text-[10px] text-slate-500 block">Delta T Médio</span>
                  <span className="font-bold text-emerald-700">4.1 °C (Faixa Segura)</span>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="pt-4 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
                <div className="w-full sm:w-1/2 pt-2 border-t border-slate-400">
                  <span className="text-[10px] font-bold text-slate-800 block">Piloto Remoto Responsável</span>
                  <span className="text-[9px] text-slate-500">Certificado ANAC CAER nº 2024-9128</span>
                </div>
                <div className="w-full sm:w-1/2 pt-2 border-t border-slate-400">
                  <span className="text-[10px] font-bold text-slate-800 block">Engenheiro Agrônomo / RT</span>
                  <span className="text-[9px] text-slate-500">{theme.registryCreaMapa || 'CREA-MT 2026-8914'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Export Code Box */}
          <div className="bg-emerald-950 text-emerald-100 rounded-3xl border border-emerald-800 overflow-hidden shadow-xl">
            <div className="flex items-center justify-between px-5 py-3 bg-[#032016] border-b border-emerald-800 text-xs">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-200">Exportação de Código dos Tokens</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex bg-[#052e20] p-0.5 rounded-lg text-xs">
                  <button
                    onClick={() => setActiveCodeTab('css')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeCodeTab === 'css' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-300 hover:text-white'}`}
                  >
                    CSS Variables
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('tailwind')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeCodeTab === 'tailwind' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-300 hover:text-white'}`}
                  >
                    Tailwind Config
                  </button>
                  <button
                    onClick={() => setActiveCodeTab('json')}
                    className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${activeCodeTab === 'json' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-300 hover:text-white'}`}
                  >
                    Design Tokens JSON
                  </button>
                </div>

                <button
                  onClick={() => {
                    const text = activeCodeTab === 'css' ? cssVariablesSnippet :
                                 activeCodeTab === 'tailwind' ? tailwindSnippet :
                                 JSON.stringify(theme, null, 2);
                    copyToClipboard(text, activeCodeTab);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 bg-emerald-900 hover:bg-emerald-800 text-emerald-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                >
                  {copiedCode === activeCodeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode === activeCodeTab ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <pre className="p-5 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed max-h-[300px]">
              {activeCodeTab === 'css' && cssVariablesSnippet}
              {activeCodeTab === 'tailwind' && tailwindSnippet}
              {activeCodeTab === 'json' && JSON.stringify(theme, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
