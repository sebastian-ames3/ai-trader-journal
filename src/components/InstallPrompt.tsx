'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Install Prompt Component
 *
 * Shows a prompt to install the app after 3 visits or 1 week of use.
 * Uses the native install prompt on Android and custom instructions on iOS.
 */
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isInStandaloneMode = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)
      );
    };

    if (isInStandaloneMode()) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
    setIsIOS(iOS);

    // Track visits
    const STORAGE_KEY = 'pwa-install-prompt';
    const visits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"count": 0, "dismissed": false, "firstVisit": null}');

    if (visits.dismissed) {
      return;
    }

    // Increment visit count
    visits.count += 1;
    if (!visits.firstVisit) {
      visits.firstVisit = new Date().toISOString();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));

    // Check if we should show the prompt
    const firstVisitDate = new Date(visits.firstVisit);
    const daysSinceFirstVisit = (Date.now() - firstVisitDate.getTime()) / (1000 * 60 * 60 * 24);

    const shouldShow = visits.count >= 3 || daysSinceFirstVisit >= 7;

    if (shouldShow) {
      // Show prompt after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      if (shouldShow) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      return;
    }

    if (deferredPrompt) {
      // Show native install prompt (Android/Chrome)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    const STORAGE_KEY = 'pwa-install-prompt';
    const visits = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    visits.dismissed = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-primary-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-foreground mb-1">Install AI Trader Journal</h3>

            {isIOS ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Install this app on your iPhone:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Tap the Share button</li>
                  <li>Scroll down and tap Add to Home Screen</li>
                  <li>Tap Add</li>
                </ol>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-3">
                Install the app for quick access and offline support
              </p>
            )}

            <div className="flex gap-2 mt-3">
              {!isIOS && deferredPrompt && (
                <Button
                  size="sm"
                  onClick={handleInstallClick}
                  className="flex-1"
                >
                  Install
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className={!isIOS && deferredPrompt ? '' : 'flex-1'}
              >
                {isIOS ? 'Got it' : 'Not now'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
