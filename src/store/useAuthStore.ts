// Zustand Authentication Store
import { create } from 'zustand';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { getUserData, updateLastLogin, signIn, logOut } from '@/lib/firebase/auth';
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

          // Actions
          login: (email: string, password: string) => Promise<void>;
          logout: () => Promise<void>;
          setUser: (user: User | null) => void;
          setFirebaseUser: (firebaseUser: FirebaseUser | null) => void;
          setLoading: (loading: boolean) => void;
          setError: (error: string | null) => void;
          initialize: () => () => void; // Returns unsubscribe function
          clearError: () => void;
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

          // ============================================================================
          // Actions
          // ============================================================================

          /**
           * Initialize auth listener
           * Call this once in root layout to start listening to auth state
           */
          initialize: () => {
                    const unsubscribe = onAuthStateChanged(
                              auth,
                              async (firebaseUser) => {
                                        set({ initializing: true });

                                        if (firebaseUser) {
                                                  try {
                                                            // Fetch user data from Firestore
                                                            const userData = await getUserData(firebaseUser.uid);

                                                            if (userData) {
                                                                      // Update last login timestamp
                                                                      updateLastLogin(firebaseUser.uid).catch(console.error);

                                                                      set({
                                                                                firebaseUser,
                                                                                user: userData,
                                                                                initializing: false,
                                                                                error: null,
                                                                      });
                                                            } else {
                                                                      // User exists in Auth but not in Firestore
                                                                      console.error('User not found in Firestore');
                                                                      set({
                                                                                firebaseUser: null,
                                                                                user: null,
                                                                                initializing: false,
                                                                                error: 'User data not found. Please contact support.',
                                                                      });
                                                            }
                                                  } catch (error: any) {
                                                            console.error('Error fetching user data:', error);
                                                            set({
                                                                      firebaseUser: null,
                                                                      user: null,
                                                                      initializing: false,
                                                                      error: error.message || 'Failed to load user data',
                                                            });
                                                  }
                                        } else {
                                                  // No user signed in
                                                  set({
                                                            firebaseUser: null,
                                                            user: null,
                                                            initializing: false,
                                                            error: null,
                                                  });
                                        }
                              },
                              (error) => {
                                        console.error('Auth state change error:', error);
                                        set({
                                                  firebaseUser: null,
                                                  user: null,
                                                  initializing: false,
                                                  error: error.message || 'Authentication error',
                                        });
                              }
                    );

                    return unsubscribe;
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

                              // Update last login
                              await updateLastLogin(firebaseUser.uid);

                              set({
                                        firebaseUser,
                                        user: userData,
                                        loading: false,
                                        error: null,
                              });
                    } catch (error: any) {
                              console.error('Login error:', error);
                              set({
                                        firebaseUser: null,
                                        user: null,
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
 * Get user role
 */
export const useUserRole = () => {
          const user = useAuthStore((state) => state.user);
          return user?.role || null;
};

/**
 * Check if user has specific role
 */
export const useHasRole = (role: UserRole) => {
          const userRole = useUserRole();
          return userRole === role;
};

/**
 * Check if user is Super Admin
 */
export const useIsSuperAdmin = () => {
          return useHasRole(UserRole.SUPER_ADMIN);
};

/**
 * Check if user is Admin (Instructor)
 */
export const useIsAdmin = () => {
          return useHasRole(UserRole.ADMIN);
};

/**
 * Check if user is Student
 */
export const useIsStudent = () => {
          return useHasRole(UserRole.STUDENT);
};
