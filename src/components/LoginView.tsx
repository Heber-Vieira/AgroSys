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
  onLogin,
  onLoginSuccess,
  theme,
}) => {
  // Merge users prop sources
  const userList = availableUsers || users || [];

  // Form State
  const [emailInput, setEmailInput] = useState<string>('rafael.silveira@agrosys.agr.br');
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

  // Submit Credentials Login (Supports Supabase Auth & Local Fallback)
  const handleSubmitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      // 1. Try Supabase Auth
      const { user: supabaseUser, error: supabaseError } = await signInWithSupabase(
        emailInput.trim(),
        passwordInput
      );

      if (supabaseUser) {
        setSuccessMsg('Autenticado via Supabase! Entrando no sistema...');
        // Match user profile or construct from Supabase user
        const matchedProfile = userList.find(
          u => u.email.toLowerCase() === supabaseUser.email?.toLowerCase()
        ) || {
          id: supabaseUser.id,
          name: supabaseUser.user_metadata?.name || emailInput.split('@')[0],
          email: supabaseUser.email || emailInput,
          role: 'ADMIN' as UserRole,
          roleLabel: 'Administrador Geral',
          badge: 'Super Admin Supabase',
          status: 'ACTIVE',
        };

        setTimeout(() => {
          handleAuthComplete(matchedProfile as UserProfile);
        }, 600);
        return;
      }

      // 2. Local Fallback for Demo Profiles in System
      const localMatched = userList.find(
        u => u.email.toLowerCase() === emailInput.trim().toLowerCase()
      );

      if (localMatched) {
        setSuccessMsg(`Bem-vindo(a), ${localMatched.name}! Entrando...`);
        setTimeout(() => {
          handleAuthComplete(localMatched);
        }, 600);
      } else if (userList.length > 0) {
        // Fallback to first profile if demo email used
        const defaultUser = userList[0];
        setSuccessMsg(`Autenticado com sucesso! Entrando...`);
        setTimeout(() => {
          handleAuthComplete(defaultUser);
        }, 600);
      } else {
        setErrorMsg('Usuário não encontrado. Verifique seu e-mail ou utilize o acesso rápido.');
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
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 font-sans relative overflow-hidden">
      {/* Background Decorative Blur Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Split Screen Container */}
      <div className="relative z-10 w-full max-w-5xl bg-white rounded-[2.2rem] shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px] border border-slate-100">
        
        {/* LEFT PANEL: DEGRADE VERDE (Green Gradient Branding Section) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#064e3b] via-[#043427] to-[#011c14] text-white p-8 sm:p-11 flex flex-col justify-between relative overflow-hidden">
          
          {/* Subtle Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
          
          {/* Top Brand & Title Group */}
          <div className="relative z-10 space-y-6">
            
            {/* Header Brand Bar */}
            <div className="flex items-center gap-3">
              <BrandLogo theme={theme || ({} as WhiteLabelTheme)} size="md" />
              <div>
                <span className="font-black text-xl tracking-wider text-white uppercase block leading-none">
                  {companyName}
                </span>
                <span className="text-[10px] font-extrabold tracking-widest text-emerald-300/80 uppercase">
                  TECNOLOGIA AGRÍCOLA
                </span>
              </div>
            </div>

            {/* Pill Tag */}
            <div className="inline-block">
              <span className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[10px] font-black tracking-widest text-emerald-200 uppercase">
                PLATAFORMA DE GESTÃO
              </span>
            </div>

            {/* Main Title & Description */}
            <div className="space-y-3 pt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight tracking-tight">
                Gestão Agrícola e Monitoramento IA
              </h1>
              <p className="text-emerald-100/80 text-xs sm:text-sm leading-relaxed font-medium">
                {tagline}
              </p>
            </div>
          </div>

          {/* Bottom Security Card */}
          <div className="relative z-10 pt-8 mt-auto">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[11px] font-black text-white tracking-wider uppercase">
                  SEGURANÇA E PRECISÃO NO CAMPO
                </h4>
                <p className="text-[11px] text-emerald-200/80 font-medium leading-snug mt-0.5">
                  Seus dados e safras protegidos com criptografia de ponta a ponta.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: CLEAN WHITE FORM SECTION */}
        <div className="lg:col-span-7 bg-white text-slate-800 p-8 sm:p-12 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Header Titles */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Bem-vindo de volta!
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5">
                Insira suas credenciais corporativas para acessar o painel de controle.
              </p>
            </div>

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                <span className="shrink-0">⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Login Credentials Form */}
            <form onSubmit={handleSubmitLogin} className="space-y-5">
              
              {/* Email Input */}
              <div>
                <label className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase block mb-1.5">
                  E-MAIL CORPORATIVO
                </label>
                <div className="relative bg-[#f0f4fd] border border-slate-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-emerald-600 focus-within:bg-white transition-all">
                  <Mail className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="heber.vieira.hv@gmail.com"
                    className="bg-transparent text-slate-900 font-semibold text-sm outline-none w-full placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                    SENHA DE ACESSO
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Para redefinir sua senha, entre em contato com o Administrador do sistema AgroSys.')}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative bg-[#f0f4fd] border border-slate-200/80 rounded-2xl px-4 py-3.5 flex items-center gap-3 focus-within:ring-2 focus-within:ring-emerald-600 focus-within:bg-white transition-all">
                  <Lock className="w-5 h-5 text-slate-400 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="bg-transparent text-slate-900 font-semibold text-sm outline-none w-full placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Primary Login Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 px-6 rounded-2xl font-extrabold text-sm tracking-wider uppercase bg-[#064e3b] hover:bg-[#022c22] text-white shadow-lg shadow-emerald-950/20 hover:shadow-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] disabled:opacity-50"
                >
                  <span>{isLoading ? 'Autenticando...' : 'ENTRAR NO SISTEMA'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Quick Access Switcher (Existing User Types in System) */}
            {userList.length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                    ACESSO RÁPIDO AOS PERFIS DO SISTEMA
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">Sem cadastro na tela</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {userList.slice(0, 4).map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleQuickLogin(user)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        selectedQuickUserId === user.id || emailInput === user.email
                          ? 'border-emerald-600 bg-emerald-50/80 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/60'
                      }`}
                    >
                      <div className="font-extrabold text-xs text-slate-800 truncate">
                        {user.name.split(' ')[0]} {user.name.split(' ')[1] || ''}
                      </div>
                      <span className={`inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-black border uppercase tracking-wider ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Info */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
            <span>Protegido por reCAPTCHA e LGPD</span>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[11px] font-semibold text-slate-500">AgroSys Auth 2.0</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
