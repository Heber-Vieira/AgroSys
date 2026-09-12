export interface ThemePalettePreset {
  id: string;
  name: string;
  tradeName?: string;
  tagline: string;
  primary: string;
  secondary: string;
  accent: string;
  surfaceLight: string;
  surfaceDark: string;
  cropFocus: string;
  description: string;
  category: 'clean' | 'warm' | 'tech' | 'organic';
  cnpj?: string;
  registryCreaMapa?: string;
  contactPhone?: string;
  contactEmail?: string;
  cityState?: string;
}

export interface PresetLogoBadge {
  id: string;
  name: string;
  category: string;
  svgPath: string;
  viewBox?: string;
}

export const PRESET_LOGOS: PresetLogoBadge[] = [
  {
    id: 'ciclodrone-helix',
    name: 'Ciclodrone Vórtice Aero',
    category: 'Aviação Agrícola',
    svgPath: 'M12 2L4 7v10l8 5 8-5V7l-8-5zm0 2.8l5.5 3.4v6.8L12 18.4l-5.5-3.4V8.2L12 4.8z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'agro-leaf-drone',
    name: 'AeroAgro Folha & Hélice',
    category: 'Agrícola Moderno',
    svgPath: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    viewBox: '0 0 24 24'
  },
  {
    id: 'precision-drone',
    name: 'Drone Precision Quad',
    category: 'Aeroespacial & GPS',
    svgPath: 'M12 3a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 12a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7 1a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm14 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-7-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'bio-sprout',
    name: 'Broto BioSustentável',
    category: 'Biológico & Orgânico',
    svgPath: 'M12 22v-9m0 0C12 7.5 7.5 3 2 3c0 5.5 4.5 10 10 10zm0 0c0-5.5 4.5-10 10-10 0 5.5-4.5 10-10 10z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'spray-droplet',
    name: 'Gota & Pulverização Alvo',
    category: 'Químico & Calda',
    svgPath: 'M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z',
    viewBox: '0 0 24 24'
  },
  {
    id: 'harvest-sun',
    name: 'Safra Solar & Campo',
    category: 'Grãos & Cana',
    svgPath: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0-5v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M1 12h3m14 0h3M4.22 19.78l2.12-2.12m11.32-11.32l2.12-2.12',
    viewBox: '0 0 24 24'
  },
  {
    id: 'geo-shield',
    name: 'Escudo GIS & Geometria',
    category: 'Conformidade & ANAC',
    svgPath: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
    viewBox: '0 0 24 24'
  }
];

export const PRESET_COMPANIES: ThemePalettePreset[] = [
  {
    id: 'ciclodrone',
    name: 'Ciclodrone',
    tradeName: 'Ciclodrone Aviação Agrícola & Tecnologia Ltda',
    tagline: 'Pulverização de Alta Precisão e Gestão Inteligente de Lavouras',
    primary: '#0284c7', // Azul Céu Aeroespacial / Cyan Tech
    secondary: '#0f766e', // Teal Floresta Profundo
    accent: '#f59e0b', // Âmbar Safra Vibrante
    surfaceLight: '#FFFFFF',
    surfaceDark: '#081320',
    cropFocus: 'Cana-de-açúcar, Soja, Milho, Café & Citros',
    description: 'Empresa de ponta em tecnologia aeroagrícola com drones DJI Agras T50/T40, telemetria em tempo real e calibração de calda.',
    category: 'tech',
    cnpj: '41.890.123/0001-77',
    registryCreaMapa: 'MAPA/SDA nº 24.890/2026 • ART CREA-SP 2026-1044',
    contactPhone: '(16) 99781-4400',
    contactEmail: 'operacoes@ciclodrone.com.br',
    cityState: 'Ribeirão Preto - SP'
  },
  {
    id: 'agro-clean-emerald',
    name: 'AeroAgro Esmeralda Clean',
    tradeName: 'AeroAgro Serviços Aeroagrícolas do Centro-Oeste',
    tagline: 'Pulverização Inteligente com Máxima Eficiência de Calda',
    primary: '#059669', // Verde Esmeralda Fresco e Elegante
    secondary: '#0f766e', // Teal Orgânico Refinado
    accent: '#f59e0b', // Âmbar Safra Quente
    surfaceLight: '#FFFFFF',
    surfaceDark: '#0f172a',
    cropFocus: 'Soja, Milho & Algodão',
    description: 'Paleta padrão moderna: fundo clean, verde esmeralda elegante e contrastes acolhedores.',
    category: 'clean',
    cnpj: '12.345.678/0001-90',
    registryCreaMapa: 'MAPA/SDA nº 18.942/2025 • ART CREA-MT 2026-8914',
    contactPhone: '(65) 99841-3200',
    contactEmail: 'operacoes@aeroagro.com.br',
    cityState: 'Rio Verde - GO'
  },
  {
    id: 'bio-menta-fresh',
    name: 'BioAero Menta & Campo',
    tradeName: 'BioAero Tecnologia Sustentável e Biológicos',
    tagline: 'Tecnologia Sustentável, Biológicos e Monitoramento NDVI',
    primary: '#10b981', // Menta Vibrante & Amigável
    secondary: '#0284c7', // Azul Céu Suave
    accent: '#ea580c', // Coral Fruticultura
    surfaceLight: '#FFFFFF',
    surfaceDark: '#090d16',
    cropFocus: 'Cana-de-açúcar, Citros & Café',
    description: 'Tons frescos e naturais que transmitem sustentabilidade e precisão.',
    category: 'organic',
    cnpj: '28.456.789/0001-12',
    registryCreaMapa: 'MAPA/SDA nº 21.004/2026 • ART CREA-SP 2026-3390',
    contactPhone: '(19) 99812-7700',
    contactEmail: 'contato@bioaero.agr.br',
    cityState: 'Piracicaba - SP'
  },
  {
    id: 'safra-dourada',
    name: 'TerraForte Safra Dourada',
    tradeName: 'TerraForte Operações Aéreas e Grãos',
    tagline: 'Operações Agrícolas de Alta Produtividade e Relevo',
    primary: '#15803d', // Verde Folha Profundo
    secondary: '#b45309', // Ocre Nobre da Terra
    accent: '#d97706', // Âmbar Dourado
    surfaceLight: '#FFFFFF',
    surfaceDark: '#131c17',
    cropFocus: 'Pastagens, Soja & Grãos',
    description: 'Inspirada no campo brasileiro: terra fértil, grãos dourados e folhas vivas.',
    category: 'warm',
    cnpj: '31.908.112/0001-44',
    registryCreaMapa: 'MAPA/SDA nº 19.882/2025 • ART CREA-GO 2026-7711',
    contactPhone: '(64) 99933-2200',
    contactEmail: 'contato@terraforte.agr.br',
    cityState: 'Jataí - GO'
  },
  {
    id: 'precision-slate',
    name: 'SulSpray Titânio & Precisão',
    tradeName: 'SulSpray Engenharia Aeroagrícola',
    tagline: 'Engenharia de Drones e Telemetria de Alta Performance',
    primary: '#047857', // Verde Floresta Puro
    secondary: '#334155', // Ardósia Neutra Executiva
    accent: '#eab308', // Amarelo Solar Alerta
    surfaceLight: '#FFFFFF',
    surfaceDark: '#0b0f19',
    cropFocus: 'Arroz Irrigado, Trigo & Silagem',
    description: 'Minimalista e executiva com equilíbrio visual limpo e alta legibilidade.',
    category: 'tech',
    cnpj: '19.789.012/0001-33',
    registryCreaMapa: 'MAPA/SDA nº 17.550/2025 • ART CREA-RS 2026-4402',
    contactPhone: '(51) 99876-1122',
    contactEmail: 'atendimento@sulspray.agr.br',
    cityState: 'Passo Fundo - RS'
  },
  {
    id: 'solar-energy',
    name: 'SolarDrone Campo Aberto',
    tradeName: 'SolarDrone Tecnologia Aérea para Hortifrúti',
    tagline: 'Alta Visibilidade em Telas Sob Luz Solar Intensa',
    primary: '#0d9488', // Teal Oceânico Luminoso
    secondary: '#16a34a', // Verde Campo Vivo
    accent: '#f97316', // Laranja Solar
    surfaceLight: '#FFFFFF',
    surfaceDark: '#10141e',
    cropFocus: 'Hortifrúti & Grandes Lavouras',
    description: 'Otimizada para tablets de campo com elementos nítidos e vibrantes.',
    category: 'clean',
    cnpj: '25.678.901/0001-88',
    registryCreaMapa: 'MAPA/SDA nº 22.110/2026 • ART CREA-BA 2026-6619',
    contactPhone: '(77) 99901-5544',
    contactEmail: 'solardrone@solardrone.agr.br',
    cityState: 'Luís Eduardo Magalhães - BA'
  }
];

export const DESIGN_SYSTEM_TOKENS_JSON = {
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "name": "AgroSys - Clean & Friendly Design Architecture",
  "version": "2.0.0",
  "modes": {
    "light": {
      "name": "Light Mode (Clean & Amigável - Padrão)",
      "canvas": "#F8FAFC",
      "surface": "#FFFFFF",
      "surfaceSubtle": "#F1F5F9",
      "border": "#E2E8F0",
      "textPrimary": "#0F172A",
      "textSecondary": "#475569",
      "textMuted": "#94A3B8"
    },
    "dark": {
      "name": "Dark Mode (Hangar & Noite - Grafite Neutro)",
      "canvas": "#090D16",
      "surface": "#0F172A",
      "surfaceSubtle": "#1E293B",
      "border": "#334155",
      "textPrimary": "#F8FAFC",
      "textSecondary": "#94A3B8",
      "textMuted": "#64748B"
    },
    "field": {
      "name": "High-Contrast Field Mode (Sob Luz Solar Direta)",
      "canvas": "#FFFFFF",
      "surface": "#FFFFFF",
      "surfaceSubtle": "#E2E8F0",
      "border": "#000000",
      "textPrimary": "#000000",
      "textSecondary": "#1E293B",
      "textMuted": "#334155"
    }
  },
  "colorScaleSteps": [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  "domainColors": {
    "agroEmerald": {
      "50": "#ecfdf5",
      "500": "#10b981",
      "600": "#059669",
      "700": "#047857",
      "900": "#064e3b"
    },
    "agroAmber": {
      "50": "#fffbeb",
      "500": "#f59e0b",
      "600": "#d97706",
      "700": "#b45309",
      "900": "#78350f"
    },
    "cleanSlate": {
      "50": "#f8fafc",
      "100": "#f1f5f9",
      "200": "#e2e8f0",
      "700": "#334155",
      "900": "#0f172a"
    },
    "weatherDeltaT": {
      "idealRange": { "min": 2.0, "max": 8.0, "color": "#059669", "label": "Ótimo para Aplicação" },
      "cautionLow": { "min": 0.0, "max": 2.0, "color": "#f59e0b", "label": "Gota não assenta / Orvalho" },
      "dangerHigh": { "min": 8.0, "max": 15.0, "color": "#ef4444", "label": "Evaporação Severa / Deriva" }
    }
  }
};

/**
 * Utilitário de geração de escala tonal (50 a 950) a partir de Hex primário
 */
export function generateToneScale(baseHex: string): Record<number, string> {
  // Converte Hex para HSL e gera variações de luminosidade
  const rgb = hexToRgb(baseHex);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

  const steps: Record<number, number> = {
    50: 97,
    100: 93,
    200: 84,
    300: 72,
    400: 60,
    500: 48,
    600: 38,
    700: 29,
    800: 21,
    900: 14,
    950: 8
  };

  const scale: Record<number, string> = {};
  for (const [step, lightness] of Object.entries(steps)) {
    const adjustedRgb = hslToRgb(hsl.h, Math.min(100, hsl.s * 1.05), lightness);
    scale[Number(step)] = rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }
  return scale;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const intVal = parseInt(clean, 16) || 0;
  return {
    r: (intVal >> 16) & 255,
    g: (intVal >> 8) & 255,
    b: intVal & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return { r: r * 255, g: g * 255, b: b * 255 };
}

/**
 * Extrai cor dominante de uma imagem carregada no cliente via HTML5 Canvas e gera DataURL persistente
 */
export async function extractPaletteFromImage(file: File): Promise<{ primary: string; secondary: string; dataUrl: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const dataUrl = (readerEvent.target?.result as string) || '';
      const img = document.createElement('img');
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ primary: '#059669', secondary: '#0f766e', dataUrl });
          return;
        }
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        const imageData = ctx.getImageData(0, 0, 100, 100).data;

        // Color bucket accumulator
        const colorCounts: Record<string, number> = {};
        for (let i = 0; i < imageData.length; i += 16) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          if (a > 128 && !(r > 240 && g > 240 && b > 240) && !(r < 25 && g < 25 && b < 25)) {
            // Quantize
            const qr = Math.round(r / 20) * 20;
            const qg = Math.round(g / 20) * 20;
            const qb = Math.round(b / 20) * 20;
            const key = rgbToHex(qr, qg, qb);
            colorCounts[key] = (colorCounts[key] || 0) + 1;
          }
        }

        const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]);
        const primary = sorted[0]?.[0] || '#059669';
        const secondary = sorted[1]?.[0] || '#0f766e';
        resolve({ primary, secondary, dataUrl });
      };
      img.onerror = () => {
        resolve({ primary: '#059669', secondary: '#0f766e', dataUrl });
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      resolve({ primary: '#059669', secondary: '#0f766e', dataUrl: '' });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calcula a luminância relativa de uma cor RGB (0 a 1) para WCAG 2.1
 */
export function getRelativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const toLinear = (c: number) => {
    const val = c / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calcula a taxa de contraste (1:1 a 21:1) entre duas cores Hex
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Avalia conformidade WCAG AA / AAA
 */
export function evaluateWcagCompliance(textColor: string, bgColor: string): {
  ratio: number;
  formattedRatio: string;
  isAaNormalText: boolean;
  isAaLargeText: boolean;
  isAaaNormalText: boolean;
  label: string;
} {
  const ratio = getContrastRatio(textColor, bgColor);
  const isAaNormalText = ratio >= 4.5;
  const isAaLargeText = ratio >= 3.0;
  const isAaaNormalText = ratio >= 7.0;

  let label = 'Abaixo de AA';
  if (isAaaNormalText) label = 'Excelente (WCAG AAA)';
  else if (isAaNormalText) label = 'Aprovado (WCAG AA)';
  else if (isAaLargeText) label = 'Adequado para Títulos (AA Large)';

  return {
    ratio,
    formattedRatio: `${ratio.toFixed(2)}:1`,
    isAaNormalText,
    isAaLargeText,
    isAaaNormalText,
    label,
  };
}

