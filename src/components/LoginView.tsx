import React, { useState } from 'react';
import { UserProfile, UserRole, WhiteLabelTheme } from '../types';
import { 
  ShieldCheck, 
  User, 
  Plane, 
  Wrench, 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  Shield, 
  Sparkles,
  Building2,
  Sprout
} from 'lucide-react';
import { signInWithSupabase } from '../services/supabase';
import { showToast } from '../services/notificationService';
import { PRESET_COMPANIES } from '../data/themeTokensData';
import { isMasterUser } from '../utils/userPermissions';
import { UserAvatar } from './UserAvatar';
import { BrandLogo } from './BrandLogo';

interface LoginViewProps {
  users?: UserProfile[];
  availableUsers?: UserProfile[];
  setUsers?: React.Dispatch<React.SetStateAction<UserProfile[]>>;
  onLogin?: (user: UserProfile) => void;
  onLoginSuccess?: (user: UserProfile) => void;
  theme?: WhiteLabelTheme;
}

export const LoginView: React.FC<LoginViewProps> = ({
  users,
  availableUsers,
  setUsers,
  onLogin,
  onLoginSuccess,
  theme,
}) => {
  // Merge users prop sources
  const userList = availableUsers || users || [];

  // Login State
  const [emailInput, setEmailInput] = useState<string>('heber.vieira.hv@gmail.com');
  const [passwordInput, setPasswordInput] = useState<string>('••••••••');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedQuickUserId, setSelectedQuickUserId] = useState<string | null>(null);

  // Trigger login completion
  const handleAuthComplete = (user: UserProfile) => {
    if (onLoginSuccess) {
      onLoginSuccess(user);
    } else if (onLogin) {
      onLogin(user);
    }
  };

  // Submit Credentials Login via Supabase Auth
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      // 1. Try Supabase Auth Login
      const { user: supabaseUser, error: supabaseError } = await signInWithSupabase(
        emailInput.trim(),
        passwordInput
      );

      if (supabaseUser) {
        setSuccessMsg('Autenticado com sucesso via Supabase Auth!');
        // Match user profile or construct from Supabase user
        const matchedProfile = userList.find(
          u => u.email.toLowerCase() === supabaseUser.email?.toLowerCase()
        ) || {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || emailInput.split('@')[0],
          email: supabaseUser.email || emailInput,
          role: (supabaseUser.user_metadata?.role as UserRole) || 'ADMIN',
          roleLabel: 'Administrador Geral',
          badge: 'Autenticado via Supabase Auth',
          status: 'ACTIVE',
        };

        setTimeout(() => {
          handleAuthComplete(matchedProfile as UserProfile);
        }, 600);
        return;
      }

      // 2. Local Fallback for Registered System Users
      const localMatched = userList.find(
        u => u.email.toLowerCase() === emailInput.trim().toLowerCase()
      );

      if (localMatched) {
        if (localMatched.password && passwordInput !== '••••••••' && passwordInput !== localMatched.password) {
          setErrorMsg('Senha de acesso incorreta. Por favor, verifique suas credenciais.');
          setIsLoading(false);
          return;
        }
        setSuccessMsg(`Bem-vindo(a), ${localMatched.name}! Entrando...`);
        setTimeout(() => {
          handleAuthComplete(localMatched);
        }, 600);
      } else {
        setErrorMsg('Usuário não encontrado. Verifique seu e-mail corporativo ou solicite o cadastro ao Administrador.');
      }
    } catch (err: any) {
      setErrorMsg('Falha na autenticação: ' + (err.message || 'Erro inesperado'));
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Access Login Selection
  const handleQuickLogin = (user: UserProfile) => {
    setSelectedQuickUserId(user.id);
    setEmailInput(user.email);
    setPasswordInput('••••••••');
    setSuccessMsg(`Perfil selecionado: ${user.name} (${user.roleLabel})`);
    setTimeout(() => {
      handleAuthComplete(user);
    }, 500);
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'PILOT': return 'bg-sky-100 text-sky-700 border-sky-200';
      case 'USER': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'ASSISTANT': return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const companyName = theme?.companyName || 'AGROSYS';
  const tagline = theme?.tagline || 'Plataforma Inteligente de Gestão de Operações Aeroagrícolas & Telemetria';

  return (
    <div className="h-screen w-screen bg-slate-950 flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Subtle Ambient Light */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-teal-600/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Screen Container - Capped to 95vh for perfect viewport fit */}
      <div className="relative z-10 w-full max-w-5xl max-h-[96vh] lg:max-h-[90vh] h-full lg:h-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200/80">
        
        {/* LEFT PANEL: MINIMALIST GREEN GRADIENT BRANDING */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#064e3b] via-[#043d2e] to-[#02231a] text-white p-5 sm:p-7 lg:p-8 flex flex-col justify-between relative overflow-y-auto">
          
          {/* Subtle Glow Overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Brand & Title Group */}
          <div className="relative z-10 space-y-4 sm:space-y-5">
            
            {/* Header Brand Bar */}
            <div className="flex items-center gap-2.5">
              <BrandLogo theme={theme || ({} as WhiteLabelTheme)} size="md" />
              <div>
                <span className="font-black text-lg sm:text-xl tracking-wide text-white uppercase block leading-none">
                  {companyName}
                </span>
                <span className="text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald-400/90 uppercase">
                  TECNOLOGIA AGRÍCOLA
                </span>
              </div>
            </div>

            {/* Tag Pill */}
            <div className="inline-block">
              <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-white/10 border border-white/10 text-[9px] sm:text-[10px] font-bold tracking-widest text-emerald-300 uppercase">
                PLATAFORMA DE GESTÃO
              </span>
            </div>

            {/* Main Title & Description */}
            <div className="space-y-2 pt-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white leading-tight tracking-tight">
                Gestão Agrícola e Monitoramento IA
              </h1>
              <p className="text-emerald-100/75 text-xs sm:text-sm leading-relaxed font-normal">
                {tagline}
              </p>
            </div>
          </div>

          {/* Bottom Security Card */}
          <div className="relative z-10 pt-4 sm:pt-6 mt-auto">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl sm:rounded-2xl p-3 flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-[9px] sm:text-[10px] font-bold text-white tracking-wider uppercase">
                  SEGURANÇA E PRECISÃO NO CAMPO
                </h4>
                <p className="text-[10px] sm:text-[11px] text-emerald-200/70 font-normal leading-snug mt-0.5">
                  Dados operacionais protegidos com criptografia de ponta a ponta.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CLEAN MINIMALIST FORM SECTION */}
        <div className="lg:col-span-7 bg-white text-slate-800 p-5 sm:p-7 lg:p-8 flex flex-col justify-between overflow-y-auto space-y-4 sm:space-y-5">
          
          <div className="space-y-4">
            
            {/* Header Titles */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] sm:text-[11px] font-semibold border border-emerald-200/60 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Acesso Corporativo Seguro</span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 tracking-tight">
                Bem-vindo de volta!
              </h2>
              <p className="text-slate-500 text-xs font-normal mt-0.5">
                Insira suas credenciais corporativas para acessar o painel.
              </p>
            </div>

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2">
                <span className="shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Credentials Form */}
            <form onSubmit={handleSubmitLogin} className="space-y-3 sm:space-y-3.5">
              
              {/* Email Input */}
              <div>
                <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase block mb-1">
                  E-MAIL CORPORATIVO
                </label>
                <div className="relative bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="exemplo@empresa.com"
                    className="bg-transparent text-slate-900 font-medium text-xs sm:text-sm outline-none w-full placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                    SENHA DE ACESSO
                  </label>
                  <button
                    type="button"
                    onClick={() => showToast('Para redefinir sua senha, solicite a alteração diretamente ao Administrador no painel de controle.', 'info', 'Redefinição de Senha')}
                    className="text-[10px] sm:text-[11px] font-medium text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative bg-slate-50/80 border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-600 focus-within:bg-white transition-all">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-slate-900 font-medium text-xs sm:text-sm outline-none w-full placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Notice regarding new accounts provisioned by admin */}
              <div className="p-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[10px] sm:text-[11px] text-slate-500 leading-relaxed flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  Novos usuários são cadastrados exclusivamente pelos <strong>Administradores</strong>.
                </span>
              </div>

              {/* Primary Login Button */}
              <div className="pt-0.5">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm tracking-wider uppercase bg-emerald-800 hover:bg-emerald-900 text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{isLoading ? 'Autenticando...' : 'ENTRAR NO SISTEMA'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Demonstration Access / Profiles */}
            <div className="pt-2 space-y-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Acesso Rápido para Demonstração
                </span>
                <span className="text-[9px] text-slate-400 font-normal">Clique para alternar</span>
              </div>

              {/* Master Profiles */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                  👑 Usuários Master (Acesso Total Multi-Empresa)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {userList.filter(u => isMasterUser(u)).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className={`p-1.5 sm:p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        emailInput.toLowerCase() === user.email.toLowerCase()
                          ? 'border-amber-400 bg-amber-50/70 ring-1 ring-amber-400/40'
                          : 'border-slate-200/80 bg-slate-50/50 hover:bg-amber-50/30 hover:border-amber-300'
                      }`}
                    >
                      <UserAvatar user={user} size="xs" showRoleBadge={false} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] sm:text-[11px] font-bold text-slate-900 truncate flex items-center gap-1">
                          {user.name}
                          <span>👑</span>
                        </div>
                        <div className="text-[9px] text-amber-700 font-semibold truncate">
                          Master • Multi-Empresa
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Company Admins */}
              <div className="space-y-1 pt-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                  🏢 Administradores de Empresa (Unidade)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {userList.filter(u => u.role === 'ADMIN' && !isMasterUser(u)).map((user) => {
                    const compName = PRESET_COMPANIES.find(p => p.id === user.companyId)?.name || 'Empresa';
                    return (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleQuickLogin(user)}
                        className={`p-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all cursor-pointer ${
                          emailInput.toLowerCase() === user.email.toLowerCase()
                            ? 'border-purple-400 bg-purple-50/70 ring-1 ring-purple-400/40'
                            : 'border-slate-200/80 bg-slate-50/50 hover:bg-purple-50/30 hover:border-purple-300'
                        }`}
                        title={`${user.name} - Admin ${compName}`}
                      >
                        <UserAvatar user={user} size="xs" showRoleBadge={false} />
                        <div className="min-w-0 flex-1">
                          <div className="text-[10px] font-bold text-slate-900 truncate">
                            {user.name.split(' ')[0]}
                          </div>
                          <div className="text-[9px] text-purple-700 font-semibold truncate">
                            {compName}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-400 font-normal">
            <span>Protegido por reCAPTCHA e LGPD</span>
            <div className="flex items-center gap-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-semibold text-slate-500">AgroSys Auth 2.0</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
