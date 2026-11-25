import { Download, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaBanner() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [updateWaiting, setUpdateWaiting] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };

    const onSwUpdate = (e: Event) => {
      const detail = (e as CustomEvent<ServiceWorker>).detail;
      if (detail) setUpdateWaiting(detail);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('schi-sw-update', onSwUpdate);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('schi-sw-update', onSwUpdate);
    };
  }, []);

  if (updateWaiting) {
    return (
      <div className="border-b border-brand-200 bg-brand-50 px-4 py-2 text-xs text-brand-900">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <span className="font-medium">A new version of SHALOM CONNECTHUB INDIA is ready.</span>
          <button
            type="button"
            onClick={() => {
              updateWaiting.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }}
            className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-3 py-1 font-semibold text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Update Now
          </button>
        </div>
      </div>
    );
  }

  if (!installEvent || dismissed) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-950">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <span className="font-medium">
          Install <strong>SHALOM CONNECTHUB INDIA</strong> for quick mobile access across India.
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={async () => {
              await installEvent.prompt();
              await installEvent.userChoice;
              setInstallEvent(null);
            }}
            className="inline-flex items-center gap-1 rounded-md bg-brand-700 px-3 py-1 font-semibold text-white"
          >
            <Download className="h-3.5 w-3.5" /> Install App
          </button>
          <button
            type="button"
            aria-label="Dismiss install prompt"
            onClick={() => setDismissed(true)}
            className="rounded p-1 text-amber-900 hover:bg-amber-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
