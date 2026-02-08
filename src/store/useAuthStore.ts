// Zustand Authentication Store
// Updated to support Firebase Auth Custom Claims

import { create } from 'zustand';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData, updateLastLogin, signIn, logOut } from '@/lib/firebase/auth';
import { getRoleFromToken, refreshToken, getCustomClaims, CustomClaims } from '@/lib/firebase/tokenRefresh';
import { User, UserRole } from '@/types';

// ============================================================================
// Store Types
// ============================================================================

interface AuthState {
  // State
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;

  // Custom Claims State (from ID token)
  tokenRole: UserRole | null;
  tokenSyncedAt: string | null;
  claimsVersion: number | null;

  // Waiting state (for Google Sign-In)
  isWaitingForUserData: boolean;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  initialize: () => () => void;
  clearError: () => void;

  // Token/Claims Actions
  refreshUserToken: () => Promise<void>;
  syncClaimsFromToken: () => Promise<void>;
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial State
  firebaseUser: null,
  user: null,
  loading: false,
  initializing: true,
  error: null,
  isWaitingForUserData: false,

  // Custom Claims State
  tokenRole: null,
  tokenSyncedAt: null,
  claimsVersion: null,

  // ============================================================================
  // Actions
  // ============================================================================

  /**
   * Initialize auth listener
   * Call this once in root layout to start listening to auth state
   */
  initialize: () => {
    // Safety check for Auth instance
    if (!auth) {
      console.error('Firebase Auth not initialized');
      set({
        initializing: false,
        error: 'Authentication system failed to initialize'
      });
      return () => { };
    }

    // Set a safety timeout to stop loading if Firebase hangs
    const safetyTimeout = setTimeout(() => {
      if (get().initializing) {
        console.warn('Auth initialization timed out, forcing fallback');
        set({ initializing: false });
      }
    }, 3000);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        clearTimeout(safetyTimeout);

        if (firebaseUser) {
          // Set waiting state at the start of user data fetch
          set({ isWaitingForUserData: true });
          
          try {
            // Fetch user data from Firestore with retry for new Google users
            let userData = null;
            let retries = 0;
            const maxRetries = 5;
            
            while (retries < maxRetries) {
              userData = await getUserData(firebaseUser.uid);
              if (userData) break;
              
              // User document might not exist yet (e.g., new Google sign-in)
              // Wait and retry with exponential backoff
              console.log(`User data not found, retry ${retries + 1}/${maxRetries}...`);
              await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, retries)));
              retries++;
            }

            if (userData) {
              // Update last login timestamp
              updateLastLogin(firebaseUser.uid).catch(console.error);

              // Sync custom claims from token
              const claims = await getCustomClaims(false);

              set({
                firebaseUser,
                user: userData,
                tokenRole: claims?.role as UserRole || userData.role,
                tokenSyncedAt: claims?.roleSyncedAt || null,
                claimsVersion: claims?.claimsVersion || null,
                initializing: false,
                isWaitingForUserData: false,
                error: null,
              });
            } else {
              // User exists in Auth but not in Firestore after all retries
              console.error('User not found in Firestore after retries');
              set({
                firebaseUser: null,
                user: null,
                tokenRole: null,
                tokenSyncedAt: null,
                claimsVersion: null,
                initializing: false,
                isWaitingForUserData: false,
                error: 'User data not found. Please contact support.',
              });
            }
          } catch (error: any) {
            console.error('Error fetching user data:', error);
            set({
              firebaseUser: null,
              user: null,
              tokenRole: null,
              tokenSyncedAt: null,
              claimsVersion: null,
              initializing: false,
              isWaitingForUserData: false,
              error: error.message || 'Failed to load user data',
            });
          }
        } else {
          // No user signed in
          set({
            firebaseUser: null,
            user: null,
            tokenRole: null,
            tokenSyncedAt: null,
            claimsVersion: null,
            initializing: false,
            isWaitingForUserData: false,
            error: null,
          });
        }
      },
      (error) => {
        clearTimeout(safetyTimeout);
        console.error('Auth state change error:', error);
        set({
          firebaseUser: null,
          user: null,
          tokenRole: null,
          tokenSyncedAt: null,
          claimsVersion: null,
          initializing: false,
          error: error.message || 'Authentication error',
        });
      }
    );

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  },

  /**
   * Login user
   */
  login: async (email: string, password: string) => {
    set({ loading: true, error: null });

    try {
      const userCredential = await signIn(email, password);
      const firebaseUser = userCredential.user;

      // Fetch user data from Firestore
      const userData = await getUserData(firebaseUser.uid);

      if (!userData) {
        throw new Error('User data not found in database');
      }

      if (!userData.isActive) {
        throw new Error('Your account has been deactivated. Please contact support.');
      }

      // Force refresh token to get latest claims
      const claims = await getCustomClaims(true);

      // Update last login
      await updateLastLogin(firebaseUser.uid);

      set({
        firebaseUser,
        user: userData,
        tokenRole: claims?.role as UserRole || userData.role,
        tokenSyncedAt: claims?.roleSyncedAt || null,
        claimsVersion: claims?.claimsVersion || null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      set({
        firebaseUser: null,
        user: null,
        tokenRole: null,
        tokenSyncedAt: null,
        claimsVersion: null,
        loading: false,
        error: error.message || 'Failed to login',
      });
      throw error;
    }
  },

  /**
   * Logout user
   */
  logout: async () => {
    set({ loading: true, error: null });

    try {
      await logOut();
      set({
        firebaseUser: null,
        user: null,
        tokenRole: null,
        tokenSyncedAt: null,
        claimsVersion: null,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      set({
        loading: false,
        error: error.message || 'Failed to logout',
      });
      throw error;
    }
  },

  /**
   * Set user data (useful for updates)
   */
  setUser: (user: User | null) => {
    set({ user });
  },

  /**
   * Set Firebase user
   */
  setFirebaseUser: (firebaseUser: FirebaseUser | null) => {
    set({ firebaseUser });
  },

  /**
   * Set loading state
   */
  setLoading: (loading: boolean) => {
    set({ loading });
  },

  /**
   * Set error message
   */
  setError: (error: string | null) => {
    set({ error });
  },

  /**
   * Clear error message
   */
  clearError: () => {
    set({ error: null });
  },

  // ============================================================================
  // Token/Claims Actions
  // ============================================================================

  /**
   * Refresh token and update claims in state
   * Call after role changes or periodically
   */
  refreshUserToken: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;

    try {
      // Force refresh to get latest claims
      await refreshToken(true);
      
      // Read new claims
      const claims = await getCustomClaims(false);

      if (claims) {
        set({
          tokenRole: claims.role as UserRole,
          tokenSyncedAt: claims.roleSyncedAt,
          claimsVersion: claims.claimsVersion,
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  },

  /**
   * Sync claims from token without forcing refresh
   * Useful for reading current state
   */
  syncClaimsFromToken: async () => {
    const claims = await getCustomClaims(false);
    if (claims) {
      set({
        tokenRole: claims.role as UserRole,
        tokenSyncedAt: claims.roleSyncedAt,
        claimsVersion: claims.claimsVersion,
      });
    }
  },
}));

// ============================================================================
// Convenience Selectors
// ============================================================================

/**
 * Check if user is authenticated
 */
export const useIsAuthenticated = () => {
  const user = useAuthStore((state) => state.user);
  return !!user;
};

/**
 * Get user role from Firestore (source of truth)
 */
export const useUserRole = () => {
  const user = useAuthStore((state) => state.user);
  return user?.role || null;
};

/**
 * Get user role from token claims (fast, but may be stale)
 */
export const useTokenRole = () => {
  return useAuthStore((state) => state.tokenRole);
};

/**
 * Check if user has specific role (from Firestore)
 */
export const useHasRole = (role: UserRole) => {
  const userRole = useUserRole();
  return userRole === role;
};

/**
 * Check if user has specific role from token (faster, may be stale)
 */
export const useHasTokenRole = (role: UserRole) => {
  const tokenRole = useTokenRole();
  return tokenRole === role;
};

/**
 * Check if user is Super Admin (from Firestore)
 */
export const useIsSuperAdmin = () => {
  return useHasRole(UserRole.SUPER_ADMIN);
};

/**
 * Check if user is Super Admin from token (faster)
 */
export const useIsSuperAdminFromToken = () => {
  return useHasTokenRole(UserRole.SUPER_ADMIN);
};

/**
 * Check if user is Admin (from Firestore)
 */
export const useIsAdmin = () => {
  return useHasRole(UserRole.ADMIN);
};

/**
 * Check if user is Admin from token (faster, includes super_admin)
 */
export const useIsAdminFromToken = () => {
  const tokenRole = useTokenRole();
  return tokenRole === UserRole.ADMIN || tokenRole === UserRole.SUPER_ADMIN;
};

/**
 * Check if user is Student (from Firestore)
 */
export const useIsStudent = () => {
  return useHasRole(UserRole.STUDENT);
};

/**
 * Check if user is Student from token (faster)
 */
export const useIsStudentFromToken = () => {
  return useHasTokenRole(UserRole.STUDENT);
};

/**
 * Check if token claims might be stale
 */
export const useAreClaimsStale = () => {
  const tokenSyncedAt = useAuthStore((state) => state.tokenSyncedAt);
  if (!tokenSyncedAt) return true;

  const syncedTime = new Date(tokenSyncedAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - syncedTime > maxAge;
};

/**
 * Get the effective role (prefers token for speed, falls back to Firestore)
 */
export const useEffectiveRole = () => {
  const tokenRole = useTokenRole();
  const userRole = useUserRole();
  return tokenRole || userRole || null;
};
