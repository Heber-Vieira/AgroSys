/**
 * AgroSys Standard Notification & Toast Service
 * Unifies all system alerts, toasts, and confirmation dialogs into the AgroSys visual standard.
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  title?: string;
  duration?: number;
}

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export const TOAST_EVENT = 'agrosys-toast-event';
export const CONFIRM_EVENT = 'agrosys-confirm-event';

/**
 * Emits a standard AgroSys toast notification
 */
export function showToast(message: string, type: ToastType = 'success', title?: string, duration: number = 3500) {
  const toast: ToastItem = {
    id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    message,
    type,
    title,
    duration,
  };

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: toast }));
  }
}

/**
 * Emits a standard AgroSys confirmation modal dialog
 */
export function showConfirm(options: ConfirmDialogOptions) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONFIRM_EVENT, { detail: options }));
  }
}

export const agroSysNotification = {
  success: (msg: string, title?: string, duration?: number) => showToast(msg, 'success', title, duration),
  error: (msg: string, title?: string, duration?: number) => showToast(msg, 'error', title, duration),
  warning: (msg: string, title?: string, duration?: number) => showToast(msg, 'warning', title, duration),
  info: (msg: string, title?: string, duration?: number) => showToast(msg, 'info', title, duration),
  confirm: showConfirm,
};

// Intercept window.alert in browser environment to render with AgroSys theme
if (typeof window !== 'undefined') {
  window.alert = (msg?: any) => {
    const text = String(msg || '');
    if (text.toLowerCase().includes('erro') || text.toLowerCase().includes('falha') || text.toLowerCase().includes('inválid')) {
      showToast(text, 'error');
    } else if (text.toLowerCase().includes('aviso') || text.toLowerCase().includes('atenção') || text.toLowerCase().includes('selecione') || text.toLowerCase().includes('informe')) {
      showToast(text, 'warning');
    } else if (text.toLowerCase().includes('sucesso') || text.toLowerCase().includes('salvo') || text.toLowerCase().includes('aprovado') || text.toLowerCase().includes('enviado')) {
      showToast(text, 'success');
    } else {
      showToast(text, 'info');
    }
  };
}
