import React from 'react';
import { Plane } from 'lucide-react';
import { WhiteLabelTheme } from '../types';
import { PRESET_LOGOS } from '../data/themeTokensData';
import { getStoredConfiguredLogoUrl, getStoredConfiguredLogoIconId } from '../services/brandingLogoStorage';

interface BrandLogoProps {
  theme: WhiteLabelTheme;
  className?: string;
  iconClassName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showBackground?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  theme,
  className = '',
  iconClassName = '',
  size = 'md',
  showBackground = true,
}) => {
  const t = theme || ({} as WhiteLabelTheme);
  const sizeClasses = {
    xs: 'w-7 h-7 text-xs rounded-lg',
    sm: 'w-9 h-9 text-sm rounded-xl',
    md: 'w-11 h-11 sm:w-12 sm:h-12 text-base rounded-2xl',
    lg: 'w-14 h-14 sm:w-16 sm:h-16 text-lg rounded-2xl',
    xl: 'w-20 h-20 text-xl rounded-3xl',
    '2xl': 'w-24 h-24 text-2xl rounded-3xl',
  };

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6 sm:w-7 sm:h-7',
    lg: 'w-8 h-8 sm:w-9 sm:h-9',
    xl: 'w-11 h-11',
    '2xl': 'w-14 h-14',
  };

  const effectiveLogoUrl = t.logoUrl || getStoredConfiguredLogoUrl();
  const effectiveLogoIconId = t.logoIconId || getStoredConfiguredLogoIconId();

  const selectedPresetLogo = effectiveLogoIconId 
    ? PRESET_LOGOS.find(l => l.id === effectiveLogoIconId)
    : null;

  const bgStyle = showBackground
    ? {
        background: `linear-gradient(135deg, ${t.primaryColor || '#059669'}, ${t.secondaryColor || t.primaryColor || '#0f766e'})`,
      }
    : { color: t.primaryColor || '#059669' };

  // 1. If custom uploaded image logo exists
  if (effectiveLogoUrl) {
    return (
      <div 
        className={`relative flex items-center justify-center overflow-hidden transition-all duration-200 border border-emerald-400/30 dark:border-emerald-500/40 shadow-md ${sizeClasses[size]} ${
          showBackground ? 'bg-white dark:bg-[#072a1e] p-1.5 ring-2 ring-emerald-500/20' : ''
        } ${className}`}
      >
        <img
          src={effectiveLogoUrl}
          alt={t.companyName || 'Logo'}
          className="w-full h-full object-contain filter drop-shadow-xs"
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
        className={`relative flex items-center justify-center text-white font-black transition-all duration-200 shadow-md ring-2 ring-white/20 border border-white/30 ${sizeClasses[size]} ${className}`}
        style={bgStyle}
      >
        {/* Subtle interior glare */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/25 rounded-[inherit] pointer-events-none" />
        
        <svg
          className={`${iconSizes[size]} fill-current drop-shadow-xs relative z-10 ${iconClassName}`}
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
      className={`relative flex items-center justify-center text-white font-black transition-all duration-200 shadow-md ring-2 ring-white/20 border border-white/30 ${sizeClasses[size]} ${className}`}
      style={bgStyle}
    >
      {/* Subtle interior glare */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/25 rounded-[inherit] pointer-events-none" />
      
      <Plane className={`${iconSizes[size]} -rotate-45 drop-shadow-xs relative z-10 ${iconClassName}`} />
    </div>
  );
};
