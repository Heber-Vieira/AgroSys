/**
 * AgroSys - AI Analysis & Executive Insights Settings Service
 * Controls master activation/deactivation of AI Insights across the Executive BI Dashboard.
 * 
 * Rules:
 * - Only Master Administrators (isMasterUser) can toggle AI Analysis ON or OFF globally.
 * - When activated, the Executive BI renders predictive AI insights, agronomic recommendations,
 *   and anomaly detection based on spray logs, batteries, and financial results.
 * - When deactivated, the AI analysis module is suspended across all company dashboards.
 */

import { isMasterUser } from '../utils/userPermissions';
import { UserProfile } from '../types';

export const AI_ANALYSIS_STORAGE_KEY = 'agrosys_ai_analysis_enabled';

// Event dispatched when Master toggles AI analysis state
export const AI_ANALYSIS_UPDATED_EVENT = 'agrosys_ai_analysis_updated';

/**
 * Checks if AI Analysis & Executive Insights are globally activated.
 * Default is TRUE.
 */
export function isAIAnalysisActive(): boolean {
  try {
    const raw = localStorage.getItem(AI_ANALYSIS_STORAGE_KEY);
    if (raw !== null) {
      return JSON.parse(raw) === true;
    }
  } catch (e) {}
  return true; // Default to active
}

/**
 * Toggles AI Analysis state.
 * STRICT: Only Master users are allowed to change this setting.
 */
export function setAIAnalysisActive(
  enabled: boolean, 
  currentUser?: UserProfile | null
): { success: boolean; message: string } {
  if (currentUser && !isMasterUser(currentUser)) {
    return {
      success: false,
      message: 'Acesso Negado: Apenas Administradores Masters podem ativar ou desativar a Análise por IA no AgroSys.'
    };
  }

  try {
    localStorage.setItem(AI_ANALYSIS_STORAGE_KEY, JSON.stringify(enabled));
    window.dispatchEvent(new CustomEvent(AI_ANALYSIS_UPDATED_EVENT, { detail: enabled }));
    return {
      success: true,
      message: enabled 
        ? 'Análise Inteligente por IA ativada com sucesso para todo o sistema!' 
        : 'Análise Inteligente por IA desativada temporariamente pelo Administrador Master.'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao salvar configuração de IA: ${err?.message || err}`
    };
  }
}
