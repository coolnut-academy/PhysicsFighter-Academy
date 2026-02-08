"use client";

import { InstallPrompt, StandaloneIndicator } from './InstallPrompt';
import { BottomNav, BottomNavSpacer } from '@/components/mobile';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { useAuthStore } from '@/store/useAuthStore';

interface PWAProviderProps {
  children: React.ReactNode;
  userRole?: 'student' | 'admin' | 'super-admin';
}

export function PWAProvider({ children, userRole = 'student' }: PWAProviderProps) {
  const { user } = useAuthStore();
  const showSidebar = user && userRole === 'student';

  return (
    <>
      {/* Status bar color for PWA */}
      <StandaloneIndicator />

      <div className="flex min-h-screen bg-paper-white relative">
        {/* Desktop Sidebar - Hidden on mobile, Visible on lg */}
        {showSidebar && (
          <div className="hidden lg:block shrink-0 sticky top-0 h-screen z-40">
            <StudentSidebar />
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 w-full min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <div className="lg:hidden">
        <BottomNav userRole={userRole} />
        <BottomNavSpacer />
      </div>

      {/* Install prompt for PWA */}
      <InstallPrompt />
    </>
  );
}
