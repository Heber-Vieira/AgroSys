import React from 'react';
import { Plane, Leaf, Compass, Shield, Zap, Sparkles } from 'lucide-react';
import { WhiteLabelTheme } from '../types';
import { PRESET_LOGOS } from '../data/themeTokensData';
import { SYSTEM_LOGO_PRESETS } from '../services/brandingLogoStorage';

export interface DynamicBrandLogoProps {
  theme?: Partial<WhiteLabelTheme>;
  isDarkMode?: boolean;
  className?: string;
  iconClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBackground?: boolean;
  variant?: 'gradient' | 'white';
}

export const DynamicBrandLogo: React.FC<DynamicBrandLogoProps> = ({
  theme,
  isDarkMode = true,
  className = '',
  iconClassName = '',
  size = 'md',
  showBackground = true,
  variant = 'gradient',
}) => {
  const t = theme || {};

  const sizeClasses = {
    xs: 'h-8 min-w-[32px] text-xs rounded-xl px-1.5',
    sm: 'h-10 min-w-[40px] text-sm rounded-xl px-2',
    md: 'h-12 min-w-[48px] text-base rounded-2xl px-2.5',
    lg: 'h-16 min-w-[64px] text-lg rounded-2xl px-3.5',
    xl: 'h-24 min-w-[96px] text-xl rounded-3xl px-5',
    '2xl': 'h-32 min-w-[128px] text-2xl rounded-3xl px-6',
  };

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-9 h-9',
    xl: 'w-13 h-13',
    '2xl': 'w-16 h-16',
  };

  const primaryColor = t.primaryColor || '#059669';
  const secondaryColor = t.secondaryColor || '#0284c7';

  const isWhiteBg = variant === 'white';

  // 1. Check for custom image upload URL
  const activeImageUrl = isWhiteBg
    ? (t.logoUrl || t.logoDarkUrl)
    : (isDarkMode && t.logoDarkUrl ? t.logoDarkUrl : t.logoUrl);

  if (activeImageUrl) {
    const adaptiveMode = t.logoAdaptiveMode || 'auto';
    let filterClass = 'filter drop-shadow-xs transition-transform duration-300';
    let containerClass = showBackground 
      ? isWhiteBg
        ? 'bg-white border border-slate-200/90 shadow-md p-1.5'
        : isDarkMode 
          ? 'bg-slate-900/90 border border-emerald-500/40 shadow-lg backdrop-blur-md'
          : 'bg-white/95 border border-slate-200 shadow-md backdrop-blur-md'
      : '';

    if (!isWhiteBg && (adaptiveMode === 'invert' || (adaptiveMode as string) === 'white') && isDarkMode) {
      filterClass = 'filter brightness-200 contrast-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]';
    } else if (!isWhiteBg && adaptiveMode === 'auto' && isDarkMode && !t.logoDarkUrl) {
      containerClass += ' ring-2 ring-emerald-500/20';
    }

    return (
      <div 
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 ${sizeClasses[size]} ${containerClass} ${className}`}
        title={t.systemName || t.companyName || 'AgroSys Logo'}
      >
        <img
          src={activeImageUrl}
          alt={t.systemName || t.companyName || 'Logo'}
          className={`w-auto h-full max-w-full object-contain ${filterClass}`}
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 2. Check for vector preset logo
  const iconId = t.logoIconId || 'agro-leaf-drone';
  const systemPreset = SYSTEM_LOGO_PRESETS.find(p => p.id === iconId);
  const generalPreset = PRESET_LOGOS.find(p => p.id === iconId);

  const containerBgClass = isWhiteBg
    ? 'bg-white text-emerald-700 border border-slate-200/80 shadow-md ring-2 ring-white/60'
    : 'text-white shadow-lg ring-2 ring-white/20 border border-white/30';

  const bgStyle = (!isWhiteBg && showBackground)
    ? {
        background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
      }
    : (!isWhiteBg && !showBackground)
    ? { color: primaryColor }
    : {};

  const vectorSvgColor = isWhiteBg ? primaryColor : undefined;

  if (systemPreset) {
    return (
      <div
        className={`relative flex items-center justify-center font-black transition-all duration-300 ${sizeClasses[size]} ${containerBgClass} ${className}`}
        style={bgStyle}
        title={t.systemName || systemPreset.label}
      >
        {!isWhiteBg && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/30 rounded-[inherit] pointer-events-none" />
        )}
        <svg
          className={`${iconSizes[size]} fill-current ${isWhiteBg ? 'drop-shadow-xs' : 'drop-shadow-md'} relative z-10 ${iconClassName}`}
          style={vectorSvgColor ? { color: vectorSvgColor } : {}}
          viewBox={systemPreset.viewBox || "0 0 24 24"}
        >
          <path d={systemPreset.svgPath} />
        </svg>
      </div>
    );
  }

  if (generalPreset) {
    return (
      <div
        className={`relative flex items-center justify-center font-black transition-all duration-300 ${sizeClasses[size]} ${containerBgClass} ${className}`}
        style={bgStyle}
        title={t.companyName || generalPreset.name}
      >
        {!isWhiteBg && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/30 rounded-[inherit] pointer-events-none" />
        )}
        <svg
          className={`${iconSizes[size]} fill-current ${isWhiteBg ? 'drop-shadow-xs' : 'drop-shadow-md'} relative z-10 ${iconClassName}`}
          style={vectorSvgColor ? { color: vectorSvgColor } : {}}
          viewBox={generalPreset.viewBox || "0 0 24 24"}
        >
          <path d={generalPreset.svgPath} />
        </svg>
      </div>
    );
  }

  // 3. Official Default AgroSys Fallback
  return (
    <div
      className={`relative flex items-center justify-center font-black transition-all duration-300 ${sizeClasses[size]} ${containerBgClass} ${className}`}
      style={bgStyle}
      title={t.systemName || 'AgroSys'}
    >
      {!isWhiteBg && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/30 rounded-[inherit] pointer-events-none" />
      )}
      <Plane 
        className={`${iconSizes[size]} -rotate-45 ${isWhiteBg ? 'drop-shadow-xs' : 'drop-shadow-md'} relative z-10 ${iconClassName}`}
        style={vectorSvgColor ? { color: vectorSvgColor } : {}}
      />
    </div>
  );
};

export default DynamicBrandLogo;
