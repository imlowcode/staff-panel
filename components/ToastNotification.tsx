import React, { useEffect } from 'react';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error';
}

interface ToastNotificationProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const Icons = {
    Success: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
    ),
    Error: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
    ),
    Close: () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    )
};

const ToastNotification: React.FC<ToastNotificationProps> = ({ toasts, removeToast }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: () => void }> = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  return (
    <div className="pointer-events-auto animate-slide-up flex items-center gap-3 min-w-[300px] p-4 rounded-xl backdrop-blur-md border shadow-2xl transition-all hover:scale-[1.02]"
         style={{
             backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
             borderColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
         }}
    >
      <div className={`p-2 rounded-full ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        {toast.type === 'success' ? <Icons.Success /> : <Icons.Error />}
      </div>
      
      <div className="flex-1">
          <h4 className={`text-xs font-black uppercase tracking-wider ${toast.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
              {toast.type === 'success' ? 'Успешно' : 'Ошибка'}
          </h4>
          <p className="text-sm font-medium text-white/90">{toast.message}</p>
      </div>

      <button onClick={onRemove} className="text-white/40 hover:text-white transition-colors">
        <Icons.Close />
      </button>
    </div>
  );
};

export default ToastNotification;