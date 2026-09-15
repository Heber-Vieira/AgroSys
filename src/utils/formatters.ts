/**
 * Utilitários de Formatação de Números, Moeda e Grandezas Padrão Brasileiro (pt-BR)
 * 
 * Regras Oficiais:
 * - Separador de MILHARES: Ponto (.)  -> Ex: 1.000 | 15.420 | 1.250.000
 * - Separador de DECIMAIS: Vírgula (,) -> Ex: 10,5 | 1.234,56 | 0,75
 */

/**
 * Converte valor de entrada (com vírgula ou ponto) para número seguro
 */
export function toSafeNumber(val: number | string | null | undefined): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim().replace(/\s/g, '');
  if (!str) return 0;

  // If string has both dot and comma (e.g. "1.234,56" or "1,234.56")
  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      // Brazilian format: 1.234,56 -> remove dots, replace comma with dot
      const num = parseFloat(str.replace(/\./g, '').replace(',', '.'));
      return isNaN(num) ? 0 : num;
    } else {
      // US format: 1,234.56 -> remove commas
      const num = parseFloat(str.replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    }
  }

  // If string has only comma: "1234,56" -> replace with dot
  if (str.includes(',')) {
    const num = parseFloat(str.replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }

  // If string has multiple dots (e.g. "1.000.000") -> thousands dots
  if ((str.match(/\./g) || []).length > 1) {
    const num = parseFloat(str.replace(/\./g, ''));
    return isNaN(num) ? 0 : num;
  }

  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converte string digitada pelo usuário em número de ponto flutuante, aceitando vírgula ou ponto
 */
export function parseInputNumber(val: number | string | null | undefined): number {
  return toSafeNumber(val);
}

/**
 * Formata um número com número fixo de casas decimais usando ponto para milhar e vírgula para decimal.
 * Ex: formatDecimal(10.5, 1) -> "10,5"
 * Ex: formatDecimal(1234.56, 2) -> "1.234,56"
 * Ex: formatDecimal(15000, 0) -> "15.000"
 */
export function formatDecimal(val: number | string | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : toSafeNumber(val);
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formata um número inteiro com separador de milhares.
 * Ex: formatInteger(1500) -> "1.500"
 * Ex: formatInteger(1000000) -> "1.000.000"
 */
export function formatInteger(val: number | string | null | undefined): string {
  return formatDecimal(val, 0);
}

/**
 * Formata um número com até X casas decimais (sem zeros desnecessários à direita).
 * Ex: formatNumber(10.5, 2) -> "10,5"
 * Ex: formatNumber(1500, 2) -> "1.500"
 * Ex: formatNumber(1500.25, 2) -> "1.500,25"
 */
export function formatNumber(val: number | string | null | undefined, maxDecimals = 2): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : toSafeNumber(val);
  return num.toLocaleString('pt-BR', {
    maximumFractionDigits: maxDecimals,
  });
}

/**
 * Formata valor em moeda brasileira Real (R$) com separador de milhar e centavos.
 * Ex: formatBRL(1500.5) -> "R$ 1.500,50"
 * Ex: formatBRL(1250000) -> "R$ 1.250.000,00"
 */
export function formatBRL(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return 'R$ 0,00';
  const num = typeof val === 'number' ? (isNaN(val) ? 0 : val) : toSafeNumber(val);
  return num.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Alias para formatBRL
 */
export const formatCurrency = formatBRL;

/**
 * Formata área em hectares com separador de milhar e vírgula decimal.
 * Ex: formatHectares(1500.5) -> "1.500,5 ha"
 * Ex: formatHectares(48) -> "48,0 ha" ou "48 ha" dependendo dos decimais
 */
export function formatHectares(val: number | string | null | undefined, decimals = 1): string {
  return `${formatDecimal(val, decimals)} ha`;
}

/**
 * Formata percentual com separador de milhar e vírgula decimal.
 * Ex: formatPercent(98.5) -> "98,5%"
 * Ex: formatPercent(10) -> "10,0%"
 */
export function formatPercent(val: number | string | null | undefined, decimals = 1): string {
  return `${formatDecimal(val, decimals)}%`;
}

/**
 * Formata volume em Litros com separador de milhar e vírgula decimal.
 * Ex: formatVolume(1250.5) -> "1.250,5 L"
 */
export function formatVolume(val: number | string | null | undefined, decimals = 1): string {
  return `${formatDecimal(val, decimals)} L`;
}

/**
 * Formata horas com separador de milhar e vírgula decimal.
 * Ex: formatHours(120.5) -> "120,5 h"
 */
export function formatHours(val: number | string | null | undefined, decimals = 1): string {
  return `${formatDecimal(val, decimals)} h`;
}

/**
 * Formata data no padrão oficial brasileiro (DD/MM/AAAA) a partir de string ISO (YYYY-MM-DD), Date ou timestamp.
 * Respeita corretamente o fuso horário local do navegador (GMT-3) para timestamps com 'T'.
 * Ex: formatDateBR('2026-09-15T02:37:00Z') -> "14/09/2026" (Horário de Brasília)
 * Ex: formatDateBR('2026-09-14') -> "14/09/2026"
 */
export function formatDateBR(val: string | number | Date | null | undefined): string {
  if (!val) return '—';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '—';
    // Se já estiver no padrão DD/MM/AAAA
    if (/^\d{2}\/\d{2}\/\d{4}/.test(trimmed)) {
      return trimmed.substring(0, 10);
    }
    // Se tiver 'T' (timestamp ISO completo), converter respeitando o fuso local do navegador
    if (trimmed.includes('T')) {
      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        }
      } catch (e) {}
    }
    // Se for formato apenas de data YYYY-MM-DD sem componente de hora
    const isoDateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateOnly) {
      const [, year, month, day] = isoDateOnly;
      return `${day}/${month}/${year}`;
    }
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}
  return String(val);
}

/**
 * Formata data e hora no padrão oficial brasileiro (DD/MM/AAAA às HH:MM).
 * Respeita corretamente o fuso horário local do navegador (GMT-3).
 * Ex: formatDateTimeBR('2026-09-15T02:37:00Z') -> "14/09/2026 às 23:37"
 * Ex: formatDateTimeBR('2026-09-14', '08:00') -> "14/09/2026 às 08:00"
 */
export function formatDateTimeBR(val: string | number | Date | null | undefined, defaultTime = '08:00'): string {
  if (!val) return '—';
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return '—';
    // Se já tiver formato DD/MM/AAAA às HH:MM
    if (/^\d{2}\/\d{2}\/\d{4}\s+às\s+\d{2}:\d{2}/.test(trimmed)) {
      return trimmed;
    }
    // Se tiver formato ISO completo com 'T'
    if (trimmed.includes('T')) {
      try {
        const d = new Date(trimmed);
        if (!isNaN(d.getTime())) {
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          return `${day}/${month}/${year} às ${hours}:${minutes}`;
        }
      } catch (e) {}
    }
    // Se for formato apenas de data YYYY-MM-DD
    const isoDateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoDateOnly) {
      const [, year, month, day] = isoDateOnly;
      return `${day}/${month}/${year} às ${defaultTime}`;
    }
  }
  try {
    const d = new Date(val);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} às ${hours}:${minutes}`;
    }
  } catch (e) {}
  return String(val);
}

