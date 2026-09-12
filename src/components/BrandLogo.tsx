import React from 'react';
import { Plane } from 'lucide-react';
import { WhiteLabelTheme, ThemeMode } from '../types';
import { PRESET_LOGOS } from '../data/themeTokensData';
import { 
  getStoredConfiguredLogoUrl, 
  getStoredConfiguredLogoDarkUrl,
  getStoredConfiguredLogoIconId,
  getStoredLogoAdaptiveMode
} from '../services/brandingLogoStorage';

interface BrandLogoProps {
  theme: WhiteLabelTheme;
  themeMode?: ThemeMode;
  className?: string;
  iconClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBackground?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  theme,
  themeMode = 'light',
  className = '',
  iconClassName = '',
  size = 'md',
  showBackground = true,
}) => {
  const t = theme || ({} as WhiteLabelTheme);
  const sizeClasses = {
    xs: 'h-8 min-w-[32px] text-xs rounded-xl px-1.5',
    sm: 'h-10 sm:h-11 min-w-[40px] text-sm rounded-xl px-2',
    md: 'h-12 sm:h-13 min-w-[48px] text-base rounded-2xl px-2.5',
    lg: 'h-16 sm:h-18 min-w-[64px] text-lg rounded-2xl px-3.5',
    xl: 'h-24 sm:h-28 min-w-[96px] text-xl rounded-3xl px-5',
    '2xl': 'h-32 sm:h-36 min-w-[128px] text-2xl rounded-3xl px-6',
  };

  const iconSizes = {
    xs: 'w-4.5 h-4.5',
    sm: 'w-6 h-6',
    md: 'w-7 h-7 sm:w-8 sm:h-8',
    lg: 'w-9 h-9 sm:w-10 sm:h-10',
    xl: 'w-13 h-13',
    '2xl': 'w-16 h-16',
  };

  const tenantId = t.tenantId;
  
  // Strictly individualized logo for this company - no cross-company leakage
  const effectiveLogoUrl = (tenantId && tenantId !== 'ALL') 
    ? (getStoredConfiguredLogoUrl(tenantId) || (t.tenantId === tenantId ? t.logoUrl : undefined))
    : undefined;

  const effectiveLogoDarkUrl = (tenantId && tenantId !== 'ALL') 
    ? (getStoredConfiguredLogoDarkUrl(tenantId) || (t.tenantId === tenantId ? t.logoDarkUrl : undefined))
    : undefined;

  const effectiveAdaptiveMode = (tenantId && tenantId !== 'ALL')
    ? (getStoredLogoAdaptiveMode(tenantId) || (t.tenantId === tenantId ? t.logoAdaptiveMode : 'auto'))
    : 'auto';
    
  const effectiveLogoIconId = (tenantId && tenantId !== 'ALL')
    ? (getStoredConfiguredLogoIconId(tenantId) || (t.tenantId === tenantId ? t.logoIconId : undefined))
    : undefined;

  const selectedPresetLogo = effectiveLogoIconId 
    ? PRESET_LOGOS.find(l => l.id === effectiveLogoIconId)
    : null;

  // Determine active logo image URL based on current themeMode
  const activeLogoUrl = (themeMode === 'dark' && effectiveLogoDarkUrl)
    ? effectiveLogoDarkUrl
    : effectiveLogoUrl;

  const bgStyle = showBackground
    ? {
        background: `linear-gradient(135deg, ${t.primaryColor || '#059669'}, ${t.secondaryColor || t.primaryColor || '#0f766e'})`,
      }
    : { color: t.primaryColor || '#059669' };

  // 1. If custom uploaded image logo exists
  if (activeLogoUrl) {
    // Mode specific container & visual shield filter logic
    const mode = effectiveAdaptiveMode || 'auto';
    let filterClass = 'filter drop-shadow-xs transition-all duration-300 hover:scale-[1.03]';
    let containerShieldClass = showBackground 
      ? 'bg-white/95 dark:bg-slate-900/90 border border-emerald-400/60 dark:border-emerald-500/60 shadow-md backdrop-blur-md p-1.5 ring-2 ring-emerald-500/30 hover:ring-emerald-400'
      : '';

    if (mode === 'glass' || (mode === 'auto' && !effectiveLogoDarkUrl)) {
      // High contrast glass matte shield pill for single uploaded logos in dark mode
      containerShieldClass = showBackground
        ? 'bg-white dark:bg-[#042017]/95 border border-emerald-300 dark:border-emerald-500/60 shadow-md backdrop-blur-md p-1.5 ring-2 ring-emerald-500/30 hover:ring-emerald-400'
        : '';
    } else if (mode === 'halo' && themeMode === 'dark' && !effectiveLogoDarkUrl) {
      filterClass = 'filter drop-shadow-[0_0_8px_rgba(255,255,255,0.75)] transition-all duration-300 hover:scale-[1.03]';
    } else if (mode === 'invert' && themeMode === 'dark' && !effectiveLogoDarkUrl) {
      filterClass = 'filter invert brightness-125 contrast-125 transition-all duration-300 hover:scale-[1.03]';
    } else if (mode === 'raw') {
      containerShieldClass = showBackground ? 'bg-transparent p-0' : '';
    }

    return (
      <div 
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-300 max-w-[260px] sm:max-w-[320px] ${sizeClasses[size]} ${containerShieldClass} ${className}`}
        title={t.companyName || 'Logotipo da Empresa'}
      >
        <img
          src={activeLogoUrl}
          alt={t.companyName || 'Logo'}
          className={`w-auto h-full max-w-full object-contain ${filterClass}`}
          onError={(e) => {
            // Fallback if image fails to load
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  // 2. If vector preset logo is selected
  if (selectedPresetLogo) {
    return (
      <div
        className={`relative flex items-center justify-center text-white font-black transition-all duration-300 shadow-md ring-2 ring-white/30 border border-white/40 ${sizeClasses[size]} ${className}`}
        style={bgStyle}
        title={t.companyName || 'Logotipo da Empresa'}
      >
        {/* Subtle interior glare */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/30 rounded-[inherit] pointer-events-none" />
        
        <svg
          className={`${iconSizes[size]} fill-current drop-shadow-md relative z-10 ${iconClassName}`}
          viewBox={selectedPresetLogo.viewBox || "0 0 24 24"}
        >
          <path d={selectedPresetLogo.svgPath} />
        </svg>
      </div>
    );
  }

  // 3. Default plane / drone icon
  return (
    <div
      className={`relative flex items-center justify-center text-white font-black transition-all duration-300 shadow-md ring-2 ring-white/30 border border-white/40 ${sizeClasses[size]} ${className}`}
      style={bgStyle}
      title={t.companyName || 'AgroSys'}
    >
      {/* Subtle interior glare */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-white/30 rounded-[inherit] pointer-events-none" />
      
      <Plane className={`${iconSizes[size]} -rotate-45 drop-shadow-md relative z-10 ${iconClassName}`} />
    </div>
  );
};
