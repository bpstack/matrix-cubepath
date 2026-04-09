import { useState, useEffect } from 'react';
import { useUiStore } from '../../stores/ui.store';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const language = useUiStore((s) => s.language);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('matrix-pwa-dismissed') === 'true');

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  useEffect(() => {
    if (isStandalone || dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isStandalone, dismissed]);

  useEffect(() => {
    if (isStandalone || dismissed) return;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    if (isIOS && isSafari && !deferredPrompt) {
      setShowIOSPrompt(true);
    }
  }, [isStandalone, dismissed, deferredPrompt]);

  if (isStandalone || dismissed) return null;

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('matrix-pwa-dismissed', 'true');
    setDeferredPrompt(null);
    setShowIOSPrompt(false);
  };

  if (!deferredPrompt && !showIOSPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-matrix-surface border border-matrix-border rounded-lg shadow-lg p-4 max-w-xs">
      <p className="text-sm text-gray-200 mb-1 font-medium">
        {language === 'es' ? 'Instalar Matrix' : 'Install Matrix'}
      </p>
      <p className="text-xs text-matrix-muted mb-3">
        {showIOSPrompt
          ? language === 'es'
            ? 'Pulsa Compartir y luego "Añadir a pantalla de inicio"'
            : 'Tap Share then "Add to Home Screen"'
          : language === 'es'
            ? 'Accede más rápido desde tu dispositivo.'
            : 'Quick access from your device.'}
      </p>
      <div className="flex gap-2">
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 text-xs bg-matrix-accent text-black rounded font-medium hover:opacity-90 transition-opacity"
          >
            {language === 'es' ? 'Instalar' : 'Install'}
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-xs text-matrix-muted hover:text-gray-300 transition-colors"
        >
          {language === 'es' ? 'No, gracias' : 'No thanks'}
        </button>
      </div>
    </div>
  );
}
