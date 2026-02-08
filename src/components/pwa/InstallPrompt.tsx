"use client";

import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { Download, X } from 'lucide-react';

export function InstallPrompt() {
  const { isInstallable, isStandalone, install, dismiss } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has dismissed the prompt recently (within 7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    if (isInstallable && !isStandalone) {
      if (!dismissedAt || Date.now() - parseInt(dismissedAt) > sevenDays) {
        // Show prompt after a short delay
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 2000);
        return () => clearTimeout(timer);
      }
    }
  }, [isInstallable, isStandalone]);

  const handleDismiss = () => {
    setShowPrompt(false);
    dismiss();
  };

  const handleInstall = async () => {
    await install();
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 safe-area-bottom">
      <div className="mx-auto max-w-md animate-slide-up">
        <div className="arcade-card bg-white p-4 relative overflow-hidden">
          {/* Decorative corner accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-fighter-red" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-fighter-red" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-fighter-red" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-fighter-red" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-start gap-4 pr-8">
            {/* App Icon */}
            <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 border-ink-black shadow-arcade">
              <img 
                src="/icons/icon-192x192.png" 
                alt="Physics Fighter Academy"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3 className="font-heading text-lg font-bold text-ink-black leading-tight">
                เพิ่มลงหน้าจอหลัก
              </h3>
              <p className="mt-1 text-sm text-gray-600 leading-snug">
                ติดตั้ง Physics Fighter Academy เพื่อเข้าถึงได้รวดเร็วและใช้งานแบบ Offline
              </p>
            </div>
          </div>

          {/* Install button */}
          <button
            onClick={handleInstall}
            className="mt-4 w-full arcade-button flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            <span>ติดตั้งแอพ</span>
          </button>

          {/* iOS hint */}
          {isIOSSafari() && (
            <p className="mt-3 text-xs text-gray-500 text-center">
              แตะที่ <span className="inline-flex items-center px-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg></span> แล้วเลือก &quot;เพิ่มลงหน้าจอหลัก&quot;
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
  return isIOS && isSafari;
}

// Standalone mode indicator (shows when running as PWA)
export function StandaloneIndicator() {
  const { isStandalone } = usePWA();
  
  if (!isStandalone) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-[env(safe-area-inset-top)] bg-fighter-red" />
  );
}
