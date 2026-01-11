'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useUserRole } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

// ============================================================================
// Role Guard Component
// ============================================================================

interface RoleGuardProps {
          children: React.ReactNode;
          allowedRoles: UserRole[];
          redirectTo?: string;
}

/**
 * Role-based route guard component
 * Protects routes by checking user's role against allowed roles
 * 
 * @example
 * // In admin layout
 * <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
 *   {children}
 * </RoleGuard>
 */
export function RoleGuard({ children, allowedRoles, redirectTo }: RoleGuardProps) {
          const router = useRouter();
          const pathname = usePathname();
          const { user, initializing } = useAuthStore();
          const userRole = useUserRole();

          useEffect(() => {
                    // Wait for initialization
                    if (initializing) return;

                    // If not authenticated, redirect to login
                    if (!user) {
                              router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
                              return;
                    }

                    // If user role is not in allowed roles, redirect
                    if (userRole && !allowedRoles.includes(userRole)) {
                              const defaultRedirect = getDefaultRedirectForRole(userRole);
                              router.push(redirectTo || defaultRedirect);
                              return;
                    }
          }, [user, userRole, initializing, allowedRoles, router, redirectTo, pathname]);

          // Show loading while initializing
          if (initializing) {
                    return (
                              <div className="min-h-screen flex items-center justify-center bg-dark-bg-primary">
                                        <div className="text-center space-y-4">
                                                  <Loader2 className="w-12 h-12 animate-spin text-neon-cyan mx-auto" />
                                                  <p className="text-dark-text-secondary">Loading...</p>
                                        </div>
                              </div>
                    );
          }

          // If not authenticated, show nothing (will redirect)
          if (!user) {
                    return null;
          }

          // If role not allowed, show nothing (will redirect)
          if (userRole && !allowedRoles.includes(userRole)) {
                    return null;
          }

          // User is authenticated and has correct role
          return <>{children}</>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default redirect path based on user role
 */
function getDefaultRedirectForRole(role: UserRole): string {
          switch (role) {
                    case UserRole.SUPER_ADMIN:
                              return '/super-admin/dashboard';
                    case UserRole.ADMIN:
                              return '/admin/dashboard';
                    case UserRole.STUDENT:
                              return '/dashboard';
                    default:
                              return '/';
          }
}

// ============================================================================
// Convenience Guard Components
// ============================================================================

/**
 * Super Admin only guard
 */
export function SuperAdminGuard({ children }: { children: React.ReactNode }) {
          return <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>{children}</RoleGuard>;
}

/**
 * Admin (Instructor) only guard
 * Also allows Super Admin
 */
export function AdminGuard({ children }: { children: React.ReactNode }) {
          return (
                    <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
                              {children}
                    </RoleGuard>
          );
}

/**
 * Student only guard
 */
export function StudentGuard({ children }: { children: React.ReactNode }) {
          return <RoleGuard allowedRoles={[UserRole.STUDENT]}>{children}</RoleGuard>;
}

/**
 * Authenticated users only (any role)
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
          return (
                    <RoleGuard
                              allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT]}
                    >
                              {children}
                    </RoleGuard>
          );
}
