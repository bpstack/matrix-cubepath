import { useToastStore } from '../../stores/toast.store';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  const colors = {
    error: 'bg-red-500/90 text-white',
    warn: 'bg-amber-500/90 text-white',
    info: 'bg-blue-500/90 text-white',
    success: 'bg-green-500/90 text-white',
  };

  const icons = {
    error: '✕',
    warn: '⚠',
    info: 'ℹ',
    success: '✓',
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`${colors[toast.type]} px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 transition-opacity duration-200`}
        >
          <span className="text-lg">{icons[toast.type]}</span>
          <span className="flex-1 text-sm">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="opacity-70 hover:opacity-100 transition-opacity">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
