// Firebase Authentication Utilities
import {
          signInWithEmailAndPassword,
          createUserWithEmailAndPassword,
          signOut,
          sendPasswordResetEmail,
          updateProfile,
          User as FirebaseUser,
          UserCredential,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, COLLECTIONS } from '@/types';

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string): Promise<UserCredential> {
          try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    return userCredential;
          } catch (error: any) {
                    console.error('Sign in error:', error);
                    throw new Error(error.message || 'Failed to sign in');
          }
}

/**
 * Register new user (creates both Auth and Firestore user)
 */
export async function registerUser(
          email: string,
          password: string,
          firstName: string,
          lastName: string,
          role: UserRole = UserRole.STUDENT
): Promise<UserCredential> {
          try {
                    // Create auth user
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const firebaseUser = userCredential.user;

                    // Update display name
                    await updateProfile(firebaseUser, {
                              displayName: `${firstName} ${lastName}`,
                    });

                    // Create user document in Firestore
                    const userData: Omit<User, 'id'> = {
                              role,
                              profile: {
                                        firstName,
                                        lastName,
                                        email,
                              },
                              createdAt: serverTimestamp() as any,
                              updatedAt: serverTimestamp() as any,
                              isActive: true,
                    };

                    await setDoc(doc(db, COLLECTIONS.USERS, firebaseUser.uid), userData);

                    return userCredential;
          } catch (error: any) {
                    console.error('Registration error:', error);
                    throw new Error(error.message || 'Failed to register');
          }
}

/**
 * Sign out current user
 */
export async function logOut(): Promise<void> {
          try {
                    await signOut(auth);
          } catch (error: any) {
                    console.error('Sign out error:', error);
                    throw new Error(error.message || 'Failed to sign out');
          }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<void> {
          try {
                    await sendPasswordResetEmail(auth, email);
          } catch (error: any) {
                    console.error('Password reset error:', error);
                    throw new Error(error.message || 'Failed to send password reset email');
          }
}

/**
 * Get user data from Firestore by UID
 */
export async function getUserData(uid: string): Promise<User | null> {
          try {
                    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));

                    if (!userDoc.exists()) {
                              return null;
                    }

                    return {
                              id: userDoc.id,
                              ...userDoc.data(),
                    } as User;
          } catch (error: any) {
                    console.error('Get user data error:', error);
                    throw new Error(error.message || 'Failed to fetch user data');
          }
}

/**
 * Update user's last login timestamp
 */
export async function updateLastLogin(uid: string): Promise<void> {
          try {
                    await setDoc(
                              doc(db, COLLECTIONS.USERS, uid),
                              {
                                        lastLoginAt: serverTimestamp(),
                              },
                              { merge: true }
                    );
          } catch (error: any) {
                    console.error('Update last login error:', error);
                    // Don't throw error - this is non-critical
          }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser(): FirebaseUser | null {
          return auth.currentUser;
}
