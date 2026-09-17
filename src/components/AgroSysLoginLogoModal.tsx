import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Image as ImageIcon, 
  RotateCcw, 
  Save, 
  Check, 
  Sun, 
  Moon, 
  Layers, 
  ShieldCheck, 
  Zap,
  Info
} from 'lucide-react';
import { WhiteLabelTheme } from '../types';
import { 
  getStoredSystemBranding, 
  saveStoredSystemBranding, 
  resetStoredSystemBranding, 
  DEFAULT_AGROSYS_SYSTEM_BRANDING,
  SYSTEM_LOGO_PRESETS 
} from '../services/brandingLogoStorage';
import DynamicBrandLogo from './DynamicBrandLogo';
import { showConfirm } from '../services/notificationService';

interface AgroSysLoginLogoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (newBranding: WhiteLabelTheme) => void;
}

export const AgroSysLoginLogoModal: React.FC<AgroSysLoginLogoModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [branding, setBranding] = useState<WhiteLabelTheme>(DEFAULT_AGROSYS_SYSTEM_BRANDING);
  const [activeTab, setActiveTab] = useState<'upload' | 'preset' | 'adaptive'>('upload');
  const [previewTheme, setPreviewTheme] = useState<'dark' | 'light'>('dark');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lightFileInputRef = useRef<HTMLInputElement>(null);
  const darkFileInputRef = useRef<HTMLInputElement>(null);

  // Initialize from storage on open
  useEffect(() => {
    if (isOpen) {
      const current = getStoredSystemBranding();
      setBranding({ ...current });
      setSaveSuccess(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process file upload and compress to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, targetMode: 'light' | 'dark') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorMsg('A imagem é muito grande. Escolha uma imagem de até 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Max dimensions for high DPI retina logos
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Keep PNG transparency if PNG/WebP, else JPEG
        const outputFormat = file.type.includes('png') || file.type.includes('webp') || file.type.includes('svg')
          ? 'image/png'
          : 'image/jpeg';
        
        const dataUrl = canvas.toDataURL(outputFormat, 0.92);

        setBranding(prev => {
          if (targetMode === 'light') {
            return {
              ...prev,
              logoUrl: dataUrl,
              logoDarkUrl: prev.logoDarkUrl || dataUrl, // Mirror if dark not yet set
            };
          } else {
            return {
              ...prev,
              logoDarkUrl: dataUrl,
            };
          }
        });
        setErrorMsg(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetId: string) => {
    setBranding(prev => ({
      ...prev,
      logoIconId: presetId,
      logoUrl: undefined, // Clear custom URL when picking preset
      logoDarkUrl: undefined,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    try {
      await saveStoredSystemBranding(branding);
      setSaveSuccess(true);
      if (onSaved) onSaved(branding);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro ao sincronizar logotipo com o Supabase.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    showConfirm({
      title: 'Restaurar Branding Padrão',
      message: 'Deseja restaurar o logotipo e o branding oficial do AgroSys para o padrão de fábrica?',
      confirmLabel: 'Sim, Restaurar',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: async () => {
        setIsSaving(true);
        try {
          await resetStoredSystemBranding();
          setBranding({ ...DEFAULT_AGROSYS_SYSTEM_BRANDING });
          setSaveSuccess(true);
          if (onSaved) onSaved(DEFAULT_AGROSYS_SYSTEM_BRANDING);
          setTimeout(() => {
            setSaveSuccess(false);
            onClose();
          }, 1000);
        } catch (err: any) {
          setErrorMsg('Erro ao restaurar logotipo padrão.');
        } finally {
          setIsSaving(false);
        }
      }
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">Logotipo Master da Tela de Login</h3>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AgroSys Cloud
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Personalize o logotipo do sistema AgroSys exibido na tela de login e sincronize no Supabase.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status feedback */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-3 text-sm text-rose-300">
              <Info className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-3 text-sm text-emerald-300 animate-fadeIn">
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
              <span className="font-semibold">Logotipo AgroSys sincronizado com sucesso no Supabase e banco local!</span>
            </div>
          )}

          {/* Live Preview Card */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" />
                Visualização Prévia em Tempo Real
              </label>
              <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    previewTheme === 'dark' 
                      ? 'bg-slate-800 text-emerald-400 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" /> Fundo Escuro
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    previewTheme === 'light' 
                      ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" /> Fundo Claro
                </button>
              </div>
            </div>

            <div className={`relative p-8 rounded-xl border flex flex-col items-center justify-center transition-all ${
              previewTheme === 'dark'
                ? 'bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-slate-800 shadow-inner'
                : 'bg-gradient-to-b from-slate-50 via-white to-slate-100 border-slate-300 shadow-inner'
            }`}>
              <div className="transform scale-110 flex items-center justify-center">
                <DynamicBrandLogo 
                  theme={branding} 
                  isDarkMode={previewTheme === 'dark'} 
                  size="xl" 
                />
              </div>

              {/* Sub-label preview */}
              <div className="mt-4 text-center">
                <span className={`text-xs font-semibold tracking-wide ${
                  previewTheme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {branding.systemName || 'AgroSys Enterprise'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-800 gap-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'upload'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-4 h-4" /> Enviar Imagem / Logo
            </button>
            <button
              onClick={() => setActiveTab('preset')}
              className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preset'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-4 h-4" /> Ícones Vetoriais Oficiais
            </button>
            <button
              onClick={() => setActiveTab('adaptive')}
              className={`flex items-center gap-2 pb-3 px-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'adaptive'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> Modos de Contraste & Nome
            </button>
          </div>

          {/* TAB 1: Upload Custom Images */}
          {activeTab === 'upload' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Light mode / universal logo */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-amber-400" />
                      Logotipo Principal / Fundo Claro
                    </span>
                    {branding.logoUrl && (
                      <button
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, logoUrl: undefined }))}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Imagem exibida preferencialmente em temas claros ou como logotipo padrão.
                  </p>
                  
                  <input
                    type="file"
                    ref={lightFileInputRef}
                    onChange={(e) => handleFileUpload(e, 'light')}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                  
                  <button
                    type="button"
                    onClick={() => lightFileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl bg-slate-900/40 hover:bg-slate-800/40 flex flex-col items-center justify-center gap-2 text-slate-300 transition-colors group"
                  >
                    <Upload className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    <span className="text-xs font-semibold">
                      {branding.logoUrl ? 'Substituir Imagem Principal' : 'Fazer Upload de Imagem'}
                    </span>
                    <span className="text-[10px] text-slate-500">PNG, SVG, JPG até 8MB</span>
                  </button>
                </div>

                {/* Dark mode logo */}
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <Moon className="w-4 h-4 text-cyan-400" />
                      Logotipo para Modo Escuro (Opcional)
                    </span>
                    {branding.logoDarkUrl && (
                      <button
                        type="button"
                        onClick={() => setBranding(prev => ({ ...prev, logoDarkUrl: undefined }))}
                        className="text-[11px] text-rose-400 hover:underline"
                      >
                        Remover
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Versão de alto contraste ou com tipografia branca para telas escuras.
                  </p>

                  <input
                    type="file"
                    ref={darkFileInputRef}
                    onChange={(e) => handleFileUpload(e, 'dark')}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => darkFileInputRef.current?.click()}
                    className="w-full py-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl bg-slate-900/40 hover:bg-slate-800/40 flex flex-col items-center justify-center gap-2 text-slate-300 transition-colors group"
                  >
                    <Upload className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    <span className="text-xs font-semibold">
                      {branding.logoDarkUrl ? 'Substituir Imagem Modo Escuro' : 'Upload Imagem Modo Escuro'}
                    </span>
                    <span className="text-[10px] text-slate-500">PNG transparente recomendado</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Vector Presets */}
          {activeTab === 'preset' && (
            <div className="space-y-4 animate-fadeIn">
              <p className="text-xs text-slate-400">
                Escolha um dos ícones vetoriais modernos do AgroSys desenvolvidos para alta resolução e contraste automático:
              </p>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {SYSTEM_LOGO_PRESETS.map((preset) => {
                  const isSelected = branding.logoIconId === preset.id && !branding.logoUrl;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`p-3.5 rounded-xl border flex flex-col items-center text-center gap-2 transition-all ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/20'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-emerald-400">
                        <DynamicBrandLogo 
                          theme={{ ...branding, logoIconId: preset.id, logoUrl: undefined }} 
                          isDarkMode={true}
                          size="md"
                        />
                      </div>
                      <span className="text-xs font-semibold">{preset.label}</span>
                      <span className="text-[10px] text-slate-500">{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Adaptive Contrast & System Text */}
          {activeTab === 'adaptive' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Nome do Sistema no Login
                  </label>
                  <input
                    type="text"
                    value={branding.systemName || 'AgroSys'}
                    onChange={(e) => setBranding(prev => ({ ...prev, systemName: e.target.value }))}
                    placeholder="AgroSys"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Subtítulo / Descrição da Plataforma
                  </label>
                  <input
                    type="text"
                    value={branding.systemSubtitle || 'Sistema de Gestão & Operações Agrícolas'}
                    onChange={(e) => setBranding(prev => ({ ...prev, systemSubtitle: e.target.value }))}
                    placeholder="Sistema de Gestão Agrícola"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-2">
                  Tratamento de Contraste do Logotipo
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'auto', title: 'Automático', desc: 'Inverte brilho de acordo com o fundo' },
                    { id: 'white', title: 'Branco / Claro', desc: 'Sempre exibe em tons claros' },
                    { id: 'original', title: 'Cores Originais', desc: 'Mantém cores exatas do upload' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setBranding(prev => ({ ...prev, logoAdaptiveMode: mode.id as any }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        branding.logoAdaptiveMode === mode.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                          : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-xs font-bold">{mode.title}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors border border-transparent hover:border-rose-500/20"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restaurar Padrão AgroSys
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar & Sincronizar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgroSysLoginLogoModal;
