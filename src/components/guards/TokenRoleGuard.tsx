'use client';

/**
 * TokenRoleGuard - Role-based route protection with token refresh
 * 
 * This guard uses Firebase Auth custom claims for fast role verification.
 * It automatically refreshes the token when needed and handles stale claims.
 * 
 * IMPORTANT: This is for UX protection only. Security enforcement happens
 * in Firestore rules. Never trust client-side role checks for security.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, useTokenRole } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';
import { areClaimsStale, refreshToken, startPeriodicRefresh, stopPeriodicRefresh } from '@/lib/firebase/tokenRefresh';

// ============================================================================
// Types
// ============================================================================

interface TokenRoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  /** Seconds between token refresh checks (default: 5 minutes) */
  refreshIntervalSeconds?: number;
  /** Whether to show loading state while checking */
  showLoading?: boolean;
  /** Whether to force token refresh on mount */
  forceRefreshOnMount?: boolean;
}

interface TokenRoleGuardState {
  isChecking: boolean;
  hasAccess: boolean;
  error: string | null;
}

// ============================================================================
// Main Component
// ============================================================================

export function TokenRoleGuard({
  children,
  allowedRoles,
  redirectTo,
  refreshIntervalSeconds = 300, // 5 minutes
  showLoading = true,
  forceRefreshOnMount = false,
}: TokenRoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing, firebaseUser, refreshUserToken } = useAuthStore();
  const tokenRole = useTokenRole();

  const [state, setState] = useState<TokenRoleGuardState>({
    isChecking: true,
    hasAccess: false,
    error: null,
  });

  // Generate unique key for this guard instance
  const guardKey = `guard-${pathname}`;

  /**
   * Check access and refresh token if needed
   */
  const checkAccess = useCallback(async () => {
    // Wait for auth initialization
    if (initializing) return;

    // Not authenticated
    if (!user || !firebaseUser) {
      const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
      router.push(loginUrl);
      return;
    }

    try {
      // Check if claims are stale
      const claimsStale = await areClaimsStale();

      // Refresh token if stale or forced
      if (claimsStale || forceRefreshOnMount) {
        console.log('[TokenRoleGuard] Claims stale or refresh forced, refreshing...');
        await refreshUserToken();
      }

      // Get fresh role from store (updated by refreshUserToken)
      const currentTokenRole = useAuthStore.getState().tokenRole;
      const currentUserRole = useAuthStore.getState().user?.role;

      // Check access using token role first (fast), fallback to user role
      const effectiveRole = currentTokenRole || currentUserRole;

      if (effectiveRole && allowedRoles.includes(effectiveRole)) {
        setState({
          isChecking: false,
          hasAccess: true,
          error: null,
        });
      } else {
        // Access denied - redirect
        setState({
          isChecking: false,
          hasAccess: false,
          error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        });

        const defaultRedirect = getDefaultRedirectForRole(effectiveRole);
        router.push(redirectTo || defaultRedirect);
      }
    } catch (error: any) {
      console.error('[TokenRoleGuard] Access check failed:', error);
      setState({
        isChecking: false,
        hasAccess: false,
        error: error.message || 'Failed to verify access',
      });
    }
  }, [initializing, user, firebaseUser, allowedRoles, pathname, router, redirectTo, forceRefreshOnMount, refreshUserToken]);

  // Initial access check
  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  // Periodic token refresh for long-lived sessions
  useEffect(() => {
    if (!firebaseUser || !state.hasAccess) return;

    // Start periodic refresh
    startPeriodicRefresh(guardKey, refreshIntervalSeconds * 1000);

    return () => {
      stopPeriodicRefresh(guardKey);
    };
  }, [firebaseUser, state.hasAccess, guardKey, refreshIntervalSeconds]);

  // Show loading while initializing or checking
  if (initializing || state.isChecking) {
    if (!showLoading) return null;

    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg-primary">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-neon-cyan mx-auto" />
          <p className="text-dark-text-secondary">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && !state.hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-bg-primary">
        <div className="text-center space-y-4 max-w-md px-4">
          <div className="text-red-500 text-5xl">⚠️</div>
          <h2 className="text-xl font-semibold text-dark-text-primary">Access Denied</h2>
          <p className="text-dark-text-secondary">{state.error}</p>
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 bg-neon-cyan text-black rounded hover:bg-neon-cyan/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Render children if access granted
  return state.hasAccess ? <>{children}</> : null;
}

// ============================================================================
// Convenience Guard Components
// ============================================================================

/**
 * Super Admin only guard (using token claims)
 */
export function SuperAdminTokenGuard({ children }: { children: React.ReactNode }) {
  return (
    <TokenRoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
      {children}
    </TokenRoleGuard>
  );
}

/**
 * Admin (Instructor) only guard using token
 * Also allows Super Admin
 */
export function AdminTokenGuard({ children }: { children: React.ReactNode }) {
  return (
    <TokenRoleGuard allowedRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]}>
      {children}
    </TokenRoleGuard>
  );
}

/**
 * Student only guard using token
 */
export function StudentTokenGuard({ children }: { children: React.ReactNode }) {
  return (
    <TokenRoleGuard allowedRoles={[UserRole.STUDENT]}>
      {children}
    </TokenRoleGuard>
  );
}

/**
 * Any authenticated user (using token for speed)
 */
export function AuthTokenGuard({ children }: { children: React.ReactNode }) {
  return (
    <TokenRoleGuard
      allowedRoles={[UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STUDENT]}
    >
      {children}
    </TokenRoleGuard>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get default redirect path based on user role
 */
function getDefaultRedirectForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/super-admin/dashboard';
    case UserRole.ADMIN:
      return '/admin/dashboard';
    case UserRole.STUDENT:
      return '/dashboard';
    default:
      return '/login';
  }
}
