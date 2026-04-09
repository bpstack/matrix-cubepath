import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { useUiStore } from '../../stores/ui.store';

export function ServiceWorkerRegister() {
  const language = useUiStore((s) => s.language);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      if (registration) {
        // Check for updates every 60 minutes
        setInterval(() => registration.update(), 60 * 60 * 1000);
      }
    },
  });

  useEffect(() => {
    // Cleanup on unmount
    return () => setNeedRefresh(false);
  }, [setNeedRefresh]);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-matrix-surface border border-matrix-border rounded-lg shadow-lg p-4 max-w-xs">
      <p className="text-sm text-gray-200 mb-3">
        {language === 'es' ? 'Nueva versión disponible.' : 'New version available.'}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 text-xs bg-matrix-accent text-black rounded font-medium hover:opacity-90 transition-opacity"
        >
          {language === 'es' ? 'Actualizar' : 'Update'}
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="px-3 py-1.5 text-xs text-matrix-muted hover:text-gray-300 transition-colors"
        >
          {language === 'es' ? 'Después' : 'Later'}
        </button>
      </div>
    </div>
  );
}
