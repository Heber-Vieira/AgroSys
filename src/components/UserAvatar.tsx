import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, CrewPilot, CrewAssistant, UserRole } from '../types';
import { Camera, Upload, X, Check, Trash2, ShieldCheck, User, Plane, Wrench, Sparkles } from 'lucide-react';
import { saveUserPhotoToSupabase } from '../services/supabase';
import { showToast } from '../services/notificationService';

export const USER_PHOTO_STORAGE_KEY = 'agrodrone_user_custom_photos';

// High-quality curated professional photos for agriculture & drone operations
export const PRESET_USER_AVATARS = [
  {
    id: 'admin-male',
    label: 'Engenheiro Agrônomo (Admin)',
    role: 'ADMIN' as UserRole,
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'admin-female',
    label: 'Diretora Agrícola (Admin)',
    role: 'ADMIN' as UserRole,
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pilot-male-1',
    label: 'Piloto Remoto de Voo',
    role: 'PILOT' as UserRole,
    url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pilot-male-2',
    label: 'Comandante DECEA',
    role: 'PILOT' as UserRole,
    url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'pilot-female',
    label: 'Pilota de Drone Agras',
    role: 'PILOT' as UserRole,
    url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'assistant-male-1',
    label: 'Técnico de Calda (NR-31)',
    role: 'ASSISTANT' as UserRole,
    url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'assistant-male-2',
    label: 'Auxiliar de Logística & Solo',
    role: 'ASSISTANT' as UserRole,
    url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'client-producer-1',
    label: 'Produtor Rural / Fazendeiro',
    role: 'USER' as UserRole,
    url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'client-producer-2',
    label: 'Produtora Rural / Cliente',
    role: 'USER' as UserRole,
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
  },
];

export const PRESET_AVATARS: Record<UserRole, typeof PRESET_USER_AVATARS> = {
  MASTER: PRESET_USER_AVATARS.filter(a => a.role === 'ADMIN'),
  ADMIN: PRESET_USER_AVATARS.filter(a => a.role === 'ADMIN'),
  PILOT: PRESET_USER_AVATARS.filter(a => a.role === 'PILOT'),
  ASSISTANT: PRESET_USER_AVATARS.filter(a => a.role === 'ASSISTANT'),
  USER: PRESET_USER_AVATARS.filter(a => a.role === 'USER'),
};

/**
 * Get stored custom user photos map from localStorage
 */
export function getStoredUserPhotos(): Record<string, string> {
  try {
    const raw = localStorage.getItem(USER_PHOTO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Get stored photo for a specific user ID or CPF
 */
export function getStoredUserPhoto(id: string): string | undefined {
  const photos = getStoredUserPhotos();
  return photos[id];
}

/**
 * Persist a user or crew photo and broadcast update
 */
export function saveStoredUserPhoto(idOrCpf: string, photoUrl: string, profile?: UserProfile) {
  try {
    const current = getStoredUserPhotos();
    if (photoUrl) {
      current[idOrCpf] = photoUrl;
    } else {
      delete current[idOrCpf];
    }
    localStorage.setItem(USER_PHOTO_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('agrodrone-user-photo-updated', {
      detail: { id: idOrCpf, photoUrl }
    }));

    // Async save to Supabase DB
    saveUserPhotoToSupabase(idOrCpf, photoUrl, profile).catch(err => {
      console.warn('Falha ao salvar foto do usuário no Supabase DB:', err);
    });
  } catch (e) {
    console.warn('Falha ao salvar foto do usuário no storage:', e);
  }
}

/**
 * Resolves the best photo URL for a user/employee based on explicit URL, local storage, or role fallback.
 */
export function getUserPhotoUrl(params?: {
  id?: string;
  userId?: string;
  photoUrl?: string;
  avatarUrl?: string;
  name?: string;
  role?: UserRole | string;
}): string {
  if (!params) return '';

  // 1. Direct photoUrl or avatarUrl
  if (params.photoUrl && params.photoUrl.trim()) return params.photoUrl.trim();
  if (params.avatarUrl && params.avatarUrl.trim()) return params.avatarUrl.trim();

  // 2. Check localStorage by ID
  const searchId = params.id || params.userId;
  if (searchId) {
    const map = getStoredUserPhotos();
    if (map[searchId]) return map[searchId];
  }

  // 3. Match presets based on name or role
  const nameLower = (params.name || '').toLowerCase();
  if (nameLower.includes('rafael')) return PRESET_USER_AVATARS[0].url;
  if (nameLower.includes('marcos')) return PRESET_USER_AVATARS[7].url;
  if (nameLower.includes('diego')) return PRESET_USER_AVATARS[2].url;
  if (nameLower.includes('rodrigo')) return PRESET_USER_AVATARS[3].url;
  if (nameLower.includes('lucas')) return PRESET_USER_AVATARS[5].url;
  if (nameLower.includes('carlos')) return PRESET_USER_AVATARS[6].url;

  // Fallback preset by role
  const role = params.role as UserRole;
  if (role === 'ADMIN') return PRESET_USER_AVATARS[0].url;
  if (role === 'PILOT') return PRESET_USER_AVATARS[2].url;
  if (role === 'ASSISTANT') return PRESET_USER_AVATARS[5].url;
  if (role === 'USER') return PRESET_USER_AVATARS[7].url;

  return '';
}

interface UserAvatarProps {
  user?: UserProfile | CrewPilot | CrewAssistant | null;
  photoUrl?: string;
  avatarUrl?: string;
  name?: string;
  role?: UserRole | string;
  userId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  rounded?: string;
  className?: string;
  editable?: boolean;
  onEditClick?: () => void;
  showRoleBadge?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  photoUrl,
  avatarUrl,
  name,
  role,
  userId,
  size = 'md',
  rounded = 'rounded-full',
  className = '',
  editable = false,
  onEditClick,
  showRoleBadge = false,
}) => {
  const resolvedName = name || (user as any)?.name || 'Usuário';
  const resolvedRole = (role || (user as any)?.role || 'USER') as UserRole;
  const resolvedUserId = userId || (user as any)?.id || '';
  const initial = resolvedName.trim().charAt(0).toUpperCase() || 'U';

  const [currentPhoto, setCurrentPhoto] = useState<string>(() => {
    return getUserPhotoUrl({
      userId: resolvedUserId,
      photoUrl: photoUrl || (user as any)?.photoUrl,
      avatarUrl: avatarUrl || (user as any)?.avatarUrl,
      name: resolvedName,
      role: resolvedRole,
    });
  });

  const [hasError, setHasError] = useState(false);

  // Listen for storage photo updates
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail && detail.id === resolvedUserId) {
        setCurrentPhoto(detail.photoUrl);
        setHasError(false);
      }
    };
    window.addEventListener('agrodrone-user-photo-updated', handleUpdate);
    return () => window.removeEventListener('agrodrone-user-photo-updated', handleUpdate);
  }, [resolvedUserId]);

  // Update whenever props change
  useEffect(() => {
    const nextUrl = getUserPhotoUrl({
      userId: resolvedUserId,
      photoUrl: photoUrl || (user as any)?.photoUrl,
      avatarUrl: avatarUrl || (user as any)?.avatarUrl,
      name: resolvedName,
      role: resolvedRole,
    });
    setCurrentPhoto(nextUrl);
    setHasError(false);
  }, [user, photoUrl, avatarUrl, name, role, resolvedUserId]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
    '2xl': 'w-28 h-28 text-3xl',
  };

  const roleBadgeIcon = () => {
    switch (resolvedRole) {
      case 'ADMIN': return <ShieldCheck className="w-3 h-3 text-purple-600" />;
      case 'PILOT': return <Plane className="w-3 h-3 text-sky-600" />;
      case 'ASSISTANT': return <Wrench className="w-3 h-3 text-amber-600" />;
      default: return <User className="w-3 h-3 text-emerald-600" />;
    }
  };

  const roleBg = () => {
    switch (resolvedRole) {
      case 'ADMIN': return 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-200 border-purple-300 dark:border-purple-700';
      case 'PILOT': return 'bg-sky-100 dark:bg-sky-950 text-sky-900 dark:text-sky-200 border-sky-300 dark:border-sky-700';
      case 'ASSISTANT': return 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700';
      default: return 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700';
    }
  };

  return (
    <div className={`relative inline-block flex-shrink-0 group/avatar ${className}`}>
      <div
        className={`${sizeClasses[size]} ${rounded} overflow-hidden flex items-center justify-center font-black border transition-all ${
          editable ? 'cursor-pointer hover:ring-2 hover:ring-emerald-500' : ''
        } ${roleBg()}`}
        onClick={editable ? onEditClick : undefined}
      >
        {currentPhoto && !hasError ? (
          <img
            src={currentPhoto}
            alt={resolvedName}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span>{initial}</span>
        )}

        {/* Hover Camera Overlay if Editable */}
        {editable && (
          <div className={`absolute inset-0 bg-black/45 ${rounded} opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white`}>
            <Camera className="w-4 h-4 text-emerald-300 drop-shadow-sm" />
          </div>
        )}
      </div>

      {/* Optional small role icon badge on corner */}
      {showRoleBadge && (
        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center">
          {roleBadgeIcon()}
        </div>
      )}
    </div>
  );
};

interface UserPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: UserProfile | CrewPilot | CrewAssistant | null;
  currentPhotoUrl?: string;
  onSavePhoto: (newPhotoUrl: string) => void;
  title?: string;
}

export const UserPhotoUploadModal: React.FC<UserPhotoUploadModalProps> = ({
  isOpen,
  onClose,
  user,
  currentPhotoUrl,
  onSavePhoto,
  title = 'Alterar Foto do Perfil',
}) => {
  const [photoInput, setPhotoInput] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolvedName = (user as any)?.name || 'Colaborador';
  const resolvedRole = ((user as any)?.role || 'USER') as UserRole;
  const initialUrl = currentPhotoUrl || (user as any)?.photoUrl || (user as any)?.avatarUrl || '';

  useEffect(() => {
    if (isOpen) {
      setPhotoInput(initialUrl || getUserPhotoUrl({
        userId: (user as any)?.id,
        name: resolvedName,
        role: resolvedRole,
      }));
    }
  }, [isOpen, initialUrl, user, resolvedName, resolvedRole]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessing(true);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Crop and compress to high quality square (400x400)
          const canvas = document.createElement('canvas');
          const maxDim = 600;
          let width = img.width;
          let height = img.height;

          // Compute square crop coordinates
          const minDim = Math.min(width, height);
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          canvas.width = Math.min(minDim, maxDim);
          canvas.height = Math.min(minDim, maxDim);

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              img,
              startX,
              startY,
              minDim,
              minDim,
              0,
              0,
              canvas.width,
              canvas.height
            );
            const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
            setPhotoInput(dataUrl);
            setIsProcessing(false);
          }
        };
        img.onerror = () => {
          setIsProcessing(false);
          showToast('Não foi possível ler a imagem selecionada. Verifique o formato do arquivo.', 'error');
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApply = () => {
    onSavePhoto(photoInput.trim());
    onClose();
  };

  const handleClear = () => {
    setPhotoInput('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-emerald-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {resolvedName} • {((user as any)?.roleLabel) || resolvedRole}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Visual Preview */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
            <div className="relative">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-3 border-emerald-500 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                {photoInput ? (
                  <img
                    src={photoInput}
                    alt={resolvedName}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-400">
                    {resolvedName.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              {photoInput && (
                <button
                  type="button"
                  onClick={handleClear}
                  title="Remover foto"
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-rose-600 text-white shadow-xs hover:bg-rose-700 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1 min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-400 block">
                Visualização do Perfil
              </span>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-base truncate">
                {resolvedName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Esta imagem será exibida nas ordens de serviço, relatórios de aplicação, certificados e painéis do sistema.
              </p>
            </div>
          </div>

          {/* Tab Selector for Upload Method */}
          <div className="grid grid-cols-3 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Do Dispositivo
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('presets')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'presets'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Galeria de Perfis
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('url')}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                activeTab === 'url'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Link (URL)
            </button>
          </div>

          {/* TAB 1: UPLOAD FROM DEVICE */}
          {activeTab === 'upload' && (
            <div className="space-y-3">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors group bg-slate-50/50 dark:bg-slate-800/30"
              >
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                  {isProcessing ? 'Processando e otimizando imagem...' : 'Clique ou arraste uma foto para cá'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Formatos suportados: PNG, JPG, JPEG ou WebP (Ajuste automático 1:1)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          )}

          {/* TAB 2: PRESETS GALLERY */}
          {activeTab === 'presets' && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Selecione um perfil ilustrativo homologado:
              </span>
              <div className="grid grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {PRESET_USER_AVATARS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setPhotoInput(preset.url)}
                    className={`p-2 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      photoInput === preset.url
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-full object-cover shadow-2xs"
                    />
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM URL */}
          {activeTab === 'url' && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Cole a URL direta da imagem:
              </label>
              <input
                type="url"
                placeholder="https://exemplo.com/minha-foto.jpg"
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Foto</span>
          </button>
        </div>
      </div>
    </div>
  );
};
