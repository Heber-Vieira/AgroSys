import React, { useState, useRef } from 'react';
import { Palette, Upload, Sparkles, Sun, Moon, SunMedium, Sliders, Check, Copy, Shield, AlertTriangle, Wind, Droplets, Thermometer } from 'lucide-react';
import { ThemeMode, WhiteLabelTheme } from '../types';
import { generateToneScale, extractPaletteFromImage, DESIGN_SYSTEM_TOKENS_JSON, PRESET_COMPANIES } from '../data/themeTokensData';

interface DesignSystemViewProps {
  theme: WhiteLabelTheme;
  setTheme: React.Dispatch<React.SetStateAction<WhiteLabelTheme>>;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

export const DesignSystemView: React.FC<DesignSystemViewProps> = ({
  theme,
  setTheme,
  themeMode,
  setThemeMode,
}) => {
  const [copiedTokens, setCopiedTokens] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'css' | 'json' | 'tailwind'>('css');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryScale = generateToneScale(theme.primaryColor);
  const secondaryScale = generateToneScale(theme.secondaryColor);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extracted = await extractPaletteFromImage(file);
      setTheme(prev => ({
        ...prev,
        primaryColor: extracted.primary,
        secondaryColor: extracted.secondary,
        logoUrl: URL.createObjectURL(file),
      }));
    } catch (err) {
      console.error('Falha ao extrair cores do logo:', err);
    }
  };

  const cssVariablesSnippet = `:root {
  /* Dynamic White Label Tokens - Tenant: ${theme.companyName} */
  --color-primary: ${theme.primaryColor};
  --color-primary-50: ${primaryScale[50]};
  --color-primary-500: ${primaryScale[500]};
  --color-primary-700: ${primaryScale[700]};
  --color-primary-900: ${primaryScale[900]};

  --color-secondary: ${theme.secondaryColor};
  --color-secondary-50: ${secondaryScale[50]};
  --color-secondary-500: ${secondaryScale[500]};

  --color-accent: ${theme.accentColor};
  --font-family: '${theme.fontFamily}', sans-serif;
  --radius-base: ${theme.borderRadius};
}

/* Modo Campo (Alto Contraste Sob Sol a Pino) */
[data-theme="field"] {
  --bg-canvas: #FFFFFF;
  --bg-surface: #FFFFFF;
  --border-strong: #000000;
  --text-high-contrast: #000000;
}`;

  const tailwindSnippet = `// Exemplo de integração Tailwind CSS v4 / v3
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: 'var(--color-primary-50)',
          500: 'var(--color-primary-500)',
          700: 'var(--color-primary-700)',
          DEFAULT: 'var(--color-primary)',
        },
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
      }
    }
  }
};`;

  const copySnippet = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTokens(true);
    setTimeout(() => setCopiedTokens(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-emerald-950 text-white rounded-2xl p-6 sm:p-8 border border-emerald-800/30 shadow-xl relative overflow-hidden">
        <div className="max-w-3xl relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              White Label Engine 2.0
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
              WCAG AA Sun-Ready
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Design System & Injeção Dinâmica de Marca
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Arquitetura de tokens para multi-tenancy customizável. Faça upload do logotipo da empresa agrícola para 
            extrair a paleta automaticamente ou ajuste manualmente as cores primárias, secundárias e contraste de campo.
          </p>
        </div>
      </div>

      {/* Interactive Controls & Logo Extractor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Brand & Logo Customization */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Customização de Marca
            </h3>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
              White Label
            </span>
          </div>

          {/* Logo Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Logotipo da Empresa Agrícola
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-emerald-500 dark:hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-slate-50 dark:bg-slate-900/40"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Upload className="w-6 h-6 mx-auto mb-2 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Clique para enviar o logo (.PNG ou .SVG)
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Extração automática da paleta primária via HTML5 Canvas
              </p>
            </div>
          </div>

          {/* Company Name & Tagline */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Razão Social / Nome de Exibição
              </label>
              <input
                type="text"
                value={theme.companyName}
                onChange={(e) => setTheme({ ...theme, companyName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Slogan / Tagline Operacional
              </label>
              <input
                type="text"
                value={theme.tagline}
                onChange={(e) => setTheme({ ...theme, tagline: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Color Pickers */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Ajuste Manual da Paleta Hexadecimal
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Primária
                </label>
                <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {theme.primaryColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Secundária
                </label>
                <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {theme.secondaryColor}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Destaque
                </label>
                <div className="flex items-center gap-1.5 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                    className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
                    {theme.accentColor}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-2">
              Carregar Temas Agro Pré-Configurados:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_COMPANIES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setTheme(prev => ({
                    ...prev,
                    tenantId: p.id,
                    companyName: p.name,
                    tagline: p.tagline,
                    primaryColor: p.primary,
                    secondaryColor: p.secondary,
                    accentColor: p.accent,
                  }))}
                  className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-400 transition-all text-xs"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.primary }} />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.secondary }} />
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {p.name.split(' ')[0]}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {p.cropFocus}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center & Right: Live Component Preview with Injected Theme */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mode Switcher Tabs for Preview */}
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Modo de Visualização do Campo:
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setThemeMode('light')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  themeMode === 'light'
                    ? 'bg-slate-100 text-slate-900 border border-slate-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                Light Mode
              </button>
              <button
                onClick={() => setThemeMode('dark')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  themeMode === 'dark'
                    ? 'bg-slate-900 text-white border border-slate-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-blue-400" />
                Dark Mode (Hangar)
              </button>
              <button
                onClick={() => setThemeMode('field')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  themeMode === 'field'
                    ? 'bg-amber-400 text-black border-2 border-black font-extrabold shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <SunMedium className="w-3.5 h-3.5" />
                Modo Sol a Pino (Field)
              </button>
            </div>
          </div>

          {/* Generated Tonal Scale Preview */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2.5">
              Escala Tonal Gerada da Cor Primária ({theme.primaryColor})
            </h4>
            <div className="grid grid-cols-11 gap-1 rounded-xl overflow-hidden p-1 bg-slate-100 dark:bg-slate-900">
              {Object.entries(primaryScale).map(([step, hex]) => (
                <div key={step} className="text-center group">
                  <div
                    className="h-9 rounded-lg transition-transform group-hover:scale-105 shadow-2xs"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[9px] font-mono text-slate-500 block mt-1">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview Cards using Dynamic Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Agricultural Drone Telemetry HUD */}
            <div className="p-5 rounded-2xl border transition-all bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      DJI Agras T40 - Prefixo PP-AGR01
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Piloto: Carlos Mendes (DECEA 98421)
                    </span>
                  </div>
                </div>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-xs"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Em Operação
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Área Aplicada</span>
                  <span className="text-sm font-black font-mono text-slate-900 dark:text-white">
                    42.5 ha
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Rendimento</span>
                  <span className="text-sm font-black font-mono" style={{ color: theme.secondaryColor }}>
                    18.2 ha/h
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Bateria</span>
                  <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                    68% (Ciclo 41)
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs text-slate-500">Taxa planejada: 10 L/ha</span>
                <button
                  className="px-3 py-1 text-xs font-bold rounded-lg text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  Acessar Telemetria
                </button>
              </div>
            </div>

            {/* Card 2: Climate & Delta T Monitor */}
            <div className="p-5 rounded-2xl border transition-all bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Thermometer className="w-4 h-4 text-amber-500" />
                  Monitor Climático em Tempo Real
                </h4>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Seguro para Pulverizar
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Thermometer className="w-3 h-3" /> Temp.
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">25.4 °C</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Droplets className="w-3 h-3 text-blue-500" /> Umidade
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">64 %</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                    <Wind className="w-3 h-3 text-cyan-500" /> Vento
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">6.2 km/h</span>
                </div>
              </div>

              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                    Delta T Aferido: 4.2 °C
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    Faixa ideal (2.0°C a 8.0°C) - Gota estável sem evaporação
                  </span>
                </div>
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-black shadow-xs"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  OK
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Export Tabs */}
      <div className="bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-slate-200">Exportação de Tokens do Design System</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setActiveCodeTab('css')}
                className={`px-3 py-1 rounded-md transition-colors ${activeCodeTab === 'css' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                CSS Variables
              </button>
              <button
                onClick={() => setActiveCodeTab('tailwind')}
                className={`px-3 py-1 rounded-md transition-colors ${activeCodeTab === 'tailwind' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Tailwind Config
              </button>
              <button
                onClick={() => setActiveCodeTab('json')}
                className={`px-3 py-1 rounded-md transition-colors ${activeCodeTab === 'json' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Design Tokens (JSON)
              </button>
            </div>

            <button
              onClick={() => {
                const text = activeCodeTab === 'css' ? cssVariablesSnippet :
                             activeCodeTab === 'tailwind' ? tailwindSnippet :
                             JSON.stringify(DESIGN_SYSTEM_TOKENS_JSON, null, 2);
                copySnippet(text);
              }}
              className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium rounded-lg text-xs transition-colors cursor-pointer"
            >
              {copiedTokens ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTokens ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        <pre className="p-4 sm:p-6 text-xs font-mono overflow-x-auto text-emerald-300 leading-relaxed max-h-[350px]">
          {activeCodeTab === 'css' && cssVariablesSnippet}
          {activeCodeTab === 'tailwind' && tailwindSnippet}
          {activeCodeTab === 'json' && JSON.stringify(DESIGN_SYSTEM_TOKENS_JSON, null, 2)}
        </pre>
      </div>
    </div>
  );
};
