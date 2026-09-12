import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  X, 
  ShieldCheck, 
  Trash2,
  Sparkles
} from 'lucide-react';
import { 
  ToastItem, 
  ConfirmDialogOptions, 
  TOAST_EVENT, 
  CONFIRM_EVENT 
} from '../../services/notificationService';

export const AgroSysToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogOptions | null>(null);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ToastItem>;
      if (customEvent.detail) {
        const newToast = customEvent.detail;
        setToasts((prev) => [...prev, newToast]);

        // Auto remove after duration
        const duration = newToast.duration || 3500;
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, duration);
      }
    };

    const handleConfirmEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ConfirmDialogOptions>;
      if (customEvent.detail) {
        setConfirmDialog(customEvent.detail);
      }
    };

    window.addEventListener(TOAST_EVENT, handleToastEvent);
    window.addEventListener(CONFIRM_EVENT, handleConfirmEvent);

    return () => {
      window.removeEventListener(TOAST_EVENT, handleToastEvent);
      window.removeEventListener(CONFIRM_EVENT, handleConfirmEvent);
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleConfirmAction = () => {
    if (confirmDialog) {
      confirmDialog.onConfirm();
      setConfirmDialog(null);
    }
  };

  const handleCancelAction = () => {
    if (confirmDialog) {
      if (confirmDialog.onCancel) confirmDialog.onCancel();
      setConfirmDialog(null);
    }
  };

  return (
    <>
      {/* Toast Stack - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-[calc(100vw-3rem)]">
        {toasts.map((toast) => {
          let bgClass = 'bg-slate-900/95 text-white border-slate-700/80 shadow-slate-950/30';
          let icon = <Info className="w-5 h-5 flex-shrink-0 text-sky-400" />;

          if (toast.type === 'success') {
            bgClass = 'bg-emerald-700/95 text-white border-emerald-500/50 shadow-emerald-950/30';
            icon = <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-200" />;
          } else if (toast.type === 'error') {
            bgClass = 'bg-rose-700/95 text-white border-rose-500/50 shadow-rose-950/30';
            icon = <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-200" />;
          } else if (toast.type === 'warning') {
            bgClass = 'bg-amber-600/95 text-slate-950 border-amber-400/50 shadow-amber-950/30';
            icon = <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-950" />;
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200 transition-all ${bgClass}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0 pr-1">
                {toast.title && (
                  <h5 className="text-xs font-black tracking-wide uppercase mb-0.5 leading-tight">
                    {toast.title}
                  </h5>
                )}
                <p className="text-xs font-bold leading-snug break-words">
                  {toast.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="opacity-70 hover:opacity-100 p-1 rounded-lg transition-opacity cursor-pointer -mr-1 -mt-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirmation Modal in AgroSys standard */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 p-6 space-y-5">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
                confirmDialog.isDestructive 
                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800' 
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
              }`}>
                {confirmDialog.isDestructive ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <ShieldCheck className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block mb-0.5">
                  Confirmação do Sistema AgroSys
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                  {confirmDialog.title}
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-emerald-800/60">
              <button
                type="button"
                onClick={handleCancelAction}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-emerald-950/60 transition-colors cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Cancelar'}
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-transform active:scale-95 cursor-pointer flex items-center gap-2 ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-950/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-950/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{confirmDialog.confirmLabel || 'Confirmar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
