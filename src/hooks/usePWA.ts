import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAInfo {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  isIOS: boolean;
  canInstall: boolean;
  install: () => Promise<void>;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA(): PWAInfo {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    const registerSW = async () => {
      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('PWA: Service Worker registered', registration);
          
          // Listen for updates
          registration.addEventListener('updatefound', () => {
            console.log('PWA: New service worker found');
          });
          
        } catch (error) {
          console.error('PWA: Service Worker registration failed', error);
        }
      }
    };

    registerSW();

    // Check if already installed
    const checkInstalled = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      setIsInstalled(isStandaloneMode || isIOSStandalone);
    };

    checkInstalled();

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('PWA: Install prompt available');
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('PWA: App installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const canInstall = Boolean((isInstallable && deferredPrompt) || (isIOS && !isInstalled));

  const install = async (): Promise<void> => {
    if (!deferredPrompt) {
      throw new Error('No install prompt available');
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA: User accepted install prompt');
      } else {
        console.log('PWA: User dismissed install prompt');
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('PWA: Install failed', error);
      throw error;
    }
  };

  return {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    canInstall,
    install,
    deferredPrompt
  };
}