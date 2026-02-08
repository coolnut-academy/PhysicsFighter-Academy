"use client";

import { InstallPrompt, StandaloneIndicator } from './InstallPrompt';
import { BottomNav, BottomNavSpacer } from '@/components/mobile';

interface PWAProviderProps {
  children: React.ReactNode;
  userRole?: 'student' | 'admin' | 'super-admin';
}

export function PWAProvider({ children, userRole = 'student' }: PWAProviderProps) {
  return (
    <>
      {/* Status bar color for PWA */}
      <StandaloneIndicator />
      
      {/* Main content */}
      <main className="min-h-screen">
        {children}
      </main>
      
      {/* Bottom navigation for mobile */}
      <BottomNav userRole={userRole} />
      <BottomNavSpacer />
      
      {/* Install prompt for PWA */}
      <InstallPrompt />
    </>
  );
}
