import React, { useState, useEffect, useRef } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon, Sparkles, RefreshCw, Plane } from 'lucide-react';
import { AgriculturalDrone } from '../types';
import { showToast } from '../services/notificationService';

export const PRESET_DRONE_PHOTOS: Record<string, { name: string; url: string; tag: string }> = {
  t20p: {
    name: 'DJI Agras T20P (Oficial)',
    url: 'https://images.unsplash.com/photo-1527977966376-1c8408f9f108?auto=format&fit=crop&w=800&q=85',
    tag: 'Tanque 20L • Bicos Centrífugos',
  },
  t40: {
    name: 'DJI Agras T40 (Oficial)',
    url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=85',
    tag: 'Tanque 40L • Radar Phased Array',
  },
  t50: {
    name: 'DJI Agras T50 (Oficial)',
    url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?auto=format&fit=crop&w=800&q=85',
    tag: 'Tanque 50L • Duplo Rotor Coaxial',
  },
  xag: {
    name: 'XAG P100 Pro (Oficial)',
    url: 'https://images.unsplash.com/photo-1521405924368-64c5b84bec60?auto=format&fit=crop&w=800&q=85',
    tag: 'Tanque 50L • Atomizadores Revospray',
  },
};

/**
 * Resolve the most accurate photo URL for a drone, checking:
 * 1. Explicit photoUrl prop
 * 2. User-uploaded custom photo in localStorage by droneId
 * 3. User-uploaded custom photo in localStorage by modelName
 * 4. Default preset matching model name keywords (T20P, T40, T50, XAG)
 */
export function getDronePhotoUrl(params?: {
  droneId?: string;
  modelName?: string;
  photoUrl?: string;
}): string {
  if (!params) return PRESET_DRONE_PHOTOS.t40.url;

  // 1. Direct photoUrl if present and not empty
  if (params.photoUrl && params.photoUrl.trim().length > 0) {
    return params.photoUrl;
  }

  // 2. LocalStorage override by drone ID
  if (typeof window !== 'undefined' && params.droneId) {
    const savedById = localStorage.getItem(`agrodrone_drone_photo_${params.droneId}`);
    if (savedById && savedById.length > 10) return savedById;
  }

  // 3. LocalStorage override by model name
  if (typeof window !== 'undefined' && params.modelName) {
    const normalizedModel = params.modelName.trim().toLowerCase();
    const savedByModel = localStorage.getItem(`agrodrone_model_photo_${normalizedModel}`);
    if (savedByModel && savedByModel.length > 10) return savedByModel;
  }

  // 4. Match model name keywords
  const model = (params.modelName || '').toUpperCase();
  if (model.includes('T20P') || model.includes('T20-P') || model.includes('T20 P') || model.includes('T20')) {
    return PRESET_DRONE_PHOTOS.t20p.url;
  }
  if (model.includes('T50') || model.includes('T-50')) {
    return PRESET_DRONE_PHOTOS.t50.url;
  }
  if (model.includes('T40') || model.includes('T-40')) {
    return PRESET_DRONE_PHOTOS.t40.url;
  }
  if (model.includes('XAG') || model.includes('P100') || model.includes('V40')) {
    return PRESET_DRONE_PHOTOS.xag.url;
  }

  return PRESET_DRONE_PHOTOS.t40.url;
}

export interface DronePhotoProps {
  drone?: Partial<AgriculturalDrone> | null;
  modelName?: string;
  droneId?: string;
  photoUrl?: string;
  size?: '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'banner';
  className?: string;
  rounded?: string;
  alt?: string;
  onUploadClick?: () => void;
  showUploadBadge?: boolean;
}

/**
 * Reusable DronePhoto component with automatic fallback, crisp borders, and optional quick-upload trigger.
 */
export const DronePhoto: React.FC<DronePhotoProps> = ({
  drone,
  modelName,
  droneId,
  photoUrl,
  size = 'sm',
  className = '',
  rounded = 'rounded-xl',
  alt,
  onUploadClick,
  showUploadBadge = false,
}) => {
  const resolvedModel = modelName || drone?.modelName || 'Drone Agrícola';
  const resolvedId = droneId || drone?.id;
  const initialUrl = getDronePhotoUrl({
    droneId: resolvedId,
    modelName: resolvedModel,
    photoUrl: photoUrl || drone?.photoUrl,
  });

  const [currentSrc, setCurrentSrc] = useState<string>(initialUrl);
  const [hasError, setHasError] = useState<boolean>(false);

  // Re-sync when props change or photo updated
  useEffect(() => {
    const updated = getDronePhotoUrl({
      droneId: resolvedId,
      modelName: resolvedModel,
      photoUrl: photoUrl || drone?.photoUrl,
    });
    setCurrentSrc(updated);
    setHasError(false);
  }, [drone?.photoUrl, photoUrl, resolvedId, resolvedModel]);

  // Listen to custom global events when photos are saved
  useEffect(() => {
    const handleGlobalUpdate = () => {
      const updated = getDronePhotoUrl({
        droneId: resolvedId,
        modelName: resolvedModel,
        photoUrl: photoUrl || drone?.photoUrl,
      });
      setCurrentSrc(updated);
      setHasError(false);
    };

    window.addEventListener('agrodrone_drone_photo_updated', handleGlobalUpdate);
    return () => window.removeEventListener('agrodrone_drone_photo_updated', handleGlobalUpdate);
  }, [resolvedId, resolvedModel, photoUrl, drone?.photoUrl]);

  const sizeClasses: Record<string, string> = {
    '2xs': 'w-5 h-5 min-w-[20px] text-[9px]',
    xs: 'w-7 h-7 min-w-[28px] text-[10px]',
    sm: 'w-9 h-9 min-w-[36px] text-xs',
    md: 'w-12 h-12 min-w-[48px] text-sm',
    lg: 'w-16 h-16 min-w-[64px] text-base',
    xl: 'w-24 h-24 min-w-[96px] text-lg',
    '2xl': 'w-32 h-32 min-w-[128px] text-xl',
    banner: 'w-full h-36 sm:h-44 object-cover',
  };

  const containerSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <div
      className={`relative inline-flex items-center justify-center flex-shrink-0 overflow-hidden bg-emerald-950 border border-emerald-300/40 dark:border-emerald-700/60 shadow-xs ${rounded} ${containerSize} ${className} group`}
      title={`${resolvedModel} - Clique para alterar foto`}
    >
      {!hasError ? (
        <img
          src={currentSrc}
          alt={alt || resolvedModel}
          referrerPolicy="no-referrer"
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${rounded}`}
        />
      ) : (
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-900 to-emerald-950 text-white font-bold p-1 ${rounded}`}>
          <Plane className="w-1/2 h-1/2 text-emerald-400 opacity-90" />
          {size !== '2xs' && size !== 'xs' && (
            <span className="text-[9px] font-black uppercase tracking-tighter truncate max-w-full px-0.5">
              {resolvedModel.replace('DJI Agras ', '')}
            </span>
          )}
        </div>
      )}

      {/* Model Name pill overlay on larger banners */}
      {size === 'banner' && (
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white text-xs">
          <span className="font-bold truncate">{resolvedModel}</span>
          {onUploadClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUploadClick();
              }}
              className="flex items-center gap-1 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded-lg font-bold transition-colors cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              Trocar Foto
            </button>
          )}
        </div>
      )}

      {/* Quick Upload Badge button if enabled */}
      {showUploadBadge && onUploadClick && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onUploadClick();
          }}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
          title="Alterar Foto do Drone"
        >
          <Camera className="w-4 h-4 drop-shadow-md text-emerald-300" />
        </button>
      )}
    </div>
  );
};

export interface DroneBadgeProps {
  drone?: Partial<AgriculturalDrone> | null;
  droneModel?: string;
  droneAnac?: string;
  droneId?: string;
  photoUrl?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showAnac?: boolean;
  showCapacity?: boolean;
  capacityL?: number;
  className?: string;
  onClick?: () => void;
  onUploadPhoto?: () => void;
}

/**
 * High-craft badge that pairs the Drone photo with its model name and ANAC prefix.
 * Guaranteed to display consistently wherever drone information is rendered.
 */
export const DroneBadge: React.FC<DroneBadgeProps> = ({
  drone,
  droneModel,
  droneAnac,
  droneId,
  photoUrl,
  size = 'sm',
  showAnac = true,
  showCapacity = false,
  capacityL,
  className = '',
  onClick,
  onUploadPhoto,
}) => {
  const model = droneModel || drone?.modelName || 'Drone Agrícola';
  const anac = droneAnac || drone?.anacPrefix;
  const cap = capacityL ?? drone?.tankCapacityL;
  const id = droneId || drone?.id;
  const photo = photoUrl || drone?.photoUrl;

  const photoSizes: Record<string, '2xs' | 'xs' | 'sm' | 'md'> = {
    xs: 'xs',
    sm: 'sm',
    md: 'md',
    lg: 'md',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer hover:opacity-90' : ''} ${className}`}
    >
      <DronePhoto
        drone={drone}
        modelName={model}
        droneId={id}
        photoUrl={photo}
        size={photoSizes[size] || 'sm'}
        rounded="rounded-xl"
        onUploadClick={onUploadPhoto}
        showUploadBadge={Boolean(onUploadPhoto)}
      />

      <div className="flex flex-col min-w-0 text-left leading-tight">
        <span className={`font-bold text-emerald-950 dark:text-white truncate ${
          size === 'xs' ? 'text-xs' : size === 'lg' ? 'text-base font-black' : 'text-xs sm:text-sm'
        }`}>
          {model}
        </span>

        {(showAnac && anac) || (showCapacity && cap !== undefined) ? (
          <div className="flex items-center gap-1.5 text-[10px] text-emerald-700/90 dark:text-emerald-300/90 font-mono">
            {showAnac && anac && <span>{anac}</span>}
            {showAnac && anac && showCapacity && cap !== undefined && <span>•</span>}
            {showCapacity && cap !== undefined && <span>{cap}L Tanque</span>}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export interface DronePhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  drone: Partial<AgriculturalDrone> | null;
  onSavePhoto: (newPhotoUrl: string) => void;
}

/**
 * High-craft modal to upload/edit photos for any drone.
 * Supports:
 * - Drag-and-drop file upload
 * - File browser input
 * - Automatic client-side canvas compression for snappy storage
 * - Preset photos (T20P, T40, T50, XAG)
 * - Custom URL input
 * - LocalStorage sync + global event broadcast
 */
export const DronePhotoUploadModal: React.FC<DronePhotoUploadModalProps> = ({
  isOpen,
  onClose,
  drone,
  onSavePhoto,
}) => {
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (drone) {
      const current = getDronePhotoUrl({
        droneId: drone.id,
        modelName: drone.modelName,
        photoUrl: drone.photoUrl,
      });
      setSelectedPhotoUrl(current);
      setCustomUrlInput('');
    }
  }, [drone, isOpen]);

  if (!isOpen || !drone) return null;

  // Compress image to fast Base64 Data URL
  const handleFileProcess = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Por favor, selecione um arquivo de imagem válido (JPG, PNG, WebP).', 'warning', 'Formato Inválido');
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setSelectedPhotoUrl(dataUrl);
        }
        setIsProcessing(false);
      };
      img.onerror = () => {
        setIsProcessing(false);
        showToast('Erro ao processar a imagem selecionada.', 'error', 'Erro na Imagem');
      };
      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSave = () => {
    const finalUrl = customUrlInput.trim().length > 0 ? customUrlInput.trim() : selectedPhotoUrl;

    if (!finalUrl) {
      showToast('Selecione ou envie uma imagem antes de salvar.', 'warning', 'Imagem Necessária');
      return;
    }

    // Persist in localStorage for this drone and model name
    try {
      if (drone.id) {
        localStorage.setItem(`agrodrone_drone_photo_${drone.id}`, finalUrl);
      }
      if (drone.modelName) {
        localStorage.setItem(`agrodrone_model_photo_${drone.modelName.trim().toLowerCase()}`, finalUrl);
      }
    } catch (e) {
      console.warn('Falha ao salvar foto no localStorage:', e);
    }

    // Dispatch global event so all DronePhoto and DroneBadge components update immediately
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('agrodrone_drone_photo_updated', {
        detail: { droneId: drone.id, modelName: drone.modelName, photoUrl: finalUrl }
      }));
    }

    onSavePhoto(finalUrl);
    onClose();
  };

  const handleResetDefault = () => {
    if (drone.id) {
      localStorage.removeItem(`agrodrone_drone_photo_${drone.id}`);
    }
    if (drone.modelName) {
      localStorage.removeItem(`agrodrone_model_photo_${drone.modelName.trim().toLowerCase()}`);
    }
    const defaultPhoto = getDronePhotoUrl({ modelName: drone.modelName });
    setSelectedPhotoUrl(defaultPhoto);
    setCustomUrlInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-950/70 border-b border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-emerald-950 dark:text-white">
                Foto do Drone: {drone.modelName || 'Aeronave'}
              </h3>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Prefixo: <span className="font-mono font-bold">{drone.anacPrefix || 'S/N'}</span> • Tanque: {drone.tankCapacityL || 40}L
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/50 dark:hover:bg-emerald-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {/* Live Preview Card */}
          <div className="relative rounded-2xl overflow-hidden border border-emerald-300/70 dark:border-emerald-700/80 bg-slate-900 h-44 flex items-center justify-center group shadow-inner">
            {selectedPhotoUrl ? (
              <img
                src={selectedPhotoUrl}
                alt={drone.modelName || 'Drone'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-slate-400">
                <ImageIcon className="w-10 h-10 mx-auto mb-1 opacity-50" />
                <span>Nenhuma foto selecionada</span>
              </div>
            )}

            <div className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-bold text-[11px] border border-white/20">
              Prévia ao Vivo do Drone
            </div>

            <div className="absolute bottom-2 right-2">
              <button
                type="button"
                onClick={handleResetDefault}
                className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-emerald-300 text-[10px] font-bold border border-white/20 flex items-center gap-1 transition-colors cursor-pointer"
                title="Restaurar foto de fábrica original"
              >
                <RefreshCw className="w-3 h-3" />
                Restaurar Padrão
              </button>
            </div>
          </div>

          {/* Drag and drop upload zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 scale-[1.01]'
                : 'border-emerald-300 dark:border-emerald-700 hover:border-emerald-400 bg-emerald-50/40 dark:bg-[#06241a]/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
              className="hidden"
            />
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto mb-2 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div className="font-bold text-sm text-emerald-950 dark:text-white mb-0.5">
              {isProcessing ? 'Processando imagem...' : 'Clique para enviar foto ou arraste o arquivo aqui'}
            </div>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">
              Suporta fotos em JPG, PNG ou WebP de alta resolução (câmera, galeria ou arquivo de campo).
            </p>
          </div>

          {/* Preset Photo Selection */}
          <div className="space-y-2">
            <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Ou escolha uma Foto Oficial Homologada:
            </span>

            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESET_DRONE_PHOTOS).map(([key, item]) => {
                const isSelected = selectedPhotoUrl === item.url;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setSelectedPhotoUrl(item.url);
                      setCustomUrlInput('');
                    }}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-900/60'
                    }`}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className={`text-[10px] truncate ${isSelected ? 'text-emerald-100' : 'text-emerald-700 dark:text-emerald-300'}`}>
                        {item.tag}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Web URL input */}
          <div className="space-y-1">
            <label className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
              Link de Imagem Externa (Opcional):
            </label>
            <input
              type="url"
              placeholder="https://exemplo.com/foto-do-meu-drone.jpg"
              value={customUrlInput}
              onChange={(e) => {
                setCustomUrlInput(e.target.value);
                if (e.target.value.trim().length > 10) {
                  setSelectedPhotoUrl(e.target.value.trim());
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-emerald-50 dark:bg-emerald-950/70 border-t border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isProcessing}
            className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Salvar Foto do Drone</span>
          </button>
        </div>
      </div>
    </div>
  );
};
