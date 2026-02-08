"use client";

import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  deferredPrompt: BeforeInstallPromptEvent | null;
}

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    deferredPrompt: null,
  });

  useEffect(() => {
    // Check if running in standalone mode (PWA installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    setState(prev => ({ ...prev, isStandalone }));

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: e as BeforeInstallPromptEvent,
      }));
    };

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed (service worker is active)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setState(prev => ({ ...prev, isInstalled: true }));
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!state.deferredPrompt) return;

    await state.deferredPrompt.prompt();
    const choiceResult = await state.deferredPrompt.userChoice;

    if (choiceResult.outcome === 'accepted') {
      setState(prev => ({
        ...prev,
        isInstallable: false,
        isInstalled: true,
        deferredPrompt: null,
      }));
    }
  }, [state.deferredPrompt]);

  const dismiss = useCallback(() => {
    setState(prev => ({
      ...prev,
      isInstallable: false,
    }));
    // Store dismissal in localStorage to not show again for a while
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  }, []);

  return {
    ...state,
    install,
    dismiss,
  };
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
}

export function useTouchDevice() {
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  return isTouch;
}

export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const styles = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(styles.getPropertyValue('--sat') || '0'),
        right: parseInt(styles.getPropertyValue('--sar') || '0'),
        bottom: parseInt(styles.getPropertyValue('--sab') || '0'),
        left: parseInt(styles.getPropertyValue('--sal') || '0'),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    return () => window.removeEventListener('resize', updateSafeArea);
  }, []);

  return safeArea;
}
