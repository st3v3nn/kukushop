import { useEffect, useState, useCallback } from 'react';
import { Download, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean;
};

const isStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as NavigatorWithStandalone).standalone === true
  );
};

const isMobileOrAndroid = () => {
  if (typeof window === 'undefined') return false;
  return (
    /android/i.test(window.navigator.userAgent) ||
    window.matchMedia('(max-width: 767px)').matches
  );
};

export const PwaInstallButton = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Sync prompt from global in case it was captured before component mounted
  const syncPrompt = useCallback(() => {
    if (window.deferredPrompt && !installPrompt) {
      setInstallPrompt(window.deferredPrompt as BeforeInstallPromptEvent);
    }
  }, [installPrompt]);

  useEffect(() => {
    // Already installed — never show
    if (isStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    const mobile = isMobileOrAndroid();
    setIsMobile(mobile);

    // Sync any prompt already caught in main.tsx
    syncPrompt();

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      window.deferredPrompt = event;
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setVisible(false);
      window.deferredPrompt = null;
    };

    const handleResize = () => {
      setIsMobile(isMobileOrAndroid());
      if (isStandaloneMode()) setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('resize', handleResize);

    // Poll every 500ms for up to 10s in case prompt arrives late
    let polls = 0;
    const pollInterval = setInterval(() => {
      polls++;
      if (window.deferredPrompt) {
        setInstallPrompt(window.deferredPrompt as BeforeInstallPromptEvent);
        clearInterval(pollInterval);
      }
      if (polls >= 20) clearInterval(pollInterval);
    }, 500);

    // Show the banner after a short delay so it doesn't flash on load
    const showTimer = setTimeout(() => setVisible(true), 1200);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', handleResize);
      clearInterval(pollInterval);
      clearTimeout(showTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hide for installed users, dismissed, and desktop without a native prompt
  if (isInstalled || dismissed) return null;
  // Only show on mobile/android OR when we have a native prompt (desktop with prompt)
  if (!isMobile && !installPrompt) return null;

  const install = async () => {
    // Re-check global in case it arrived after initial mount
    const prompt = installPrompt ?? (window.deferredPrompt as BeforeInstallPromptEvent | undefined);
    if (!prompt || installing) return;

    setInstalling(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        setVisible(false);
        setInstallPrompt(null);
        window.deferredPrompt = null;
      }
    } catch {
      // silently fail — browser may have already dismissed the prompt
    } finally {
      setInstalling(false);
    }
  };

  const hasPrompt = !!(installPrompt ?? window.deferredPrompt);

  return (
    <div
      role="banner"
      aria-label="Install Kuku ni Sisi app"
      className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      }`}
      style={{ width: 'min(92vw, 26rem)' }}
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl"
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
          boxShadow: '0 8px 32px rgba(249,115,22,0.5), 0 2px 8px rgba(0,0,0,0.2)',
        }}
      >
        {/* App icon */}
        <div className="flex-shrink-0 h-10 w-10 rounded-xl overflow-hidden shadow-md bg-white/20">
          <img src="/icon-192x192.png" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm leading-tight">Add to Home Screen</p>
          <p className="text-orange-100 text-xs leading-tight mt-0.5 truncate">
            Install Kuku ni Sisi for the best experience
          </p>
        </div>

        {/* Install button — only clickable when native prompt is available */}
        <button
          onClick={install}
          disabled={!hasPrompt || installing}
          className={`flex-shrink-0 flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-bold transition-all active:scale-95 shadow-md
            ${hasPrompt
              ? 'text-orange-600 hover:bg-orange-50 cursor-pointer'
              : 'text-orange-300 cursor-default opacity-60'
            }
            disabled:opacity-60`}
          aria-label="Install app"
        >
          <Download className={`h-3.5 w-3.5 ${installing ? 'animate-bounce' : ''}`} />
          {installing ? 'Adding…' : 'Install'}
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 ml-1 rounded-full p-1 text-orange-200 hover:text-white hover:bg-white/20 transition-colors"
          aria-label="Dismiss install prompt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
