"use client";

import { PWAProvider } from '@/components/pwa';
import { useAuthStore } from '@/store/useAuthStore';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const user = useAuthStore((state) => state.user);
  
  // Determine user role for navigation
  const getUserRole = () => {
    if (!user) return 'student';
    if (user.role === 'super_admin') return 'super-admin';
    if (user.role === 'admin') return 'admin';
    return 'student';
  };

  return (
    <PWAProvider userRole={getUserRole()}>
      {children}
    </PWAProvider>
  );
}
