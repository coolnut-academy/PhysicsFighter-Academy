/**
 * Google Authentication
 * 
 * Adds Google Sign-In capability to the existing auth system.
 * User creation logic runs on first login via the existing auth flow.
 */

import { 
  GoogleAuthProvider, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential 
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { User, UserRole, COLLECTIONS } from '@/types';

const googleProvider = new GoogleAuthProvider();

/**
 * Create user document in Firestore
 */
async function createUserDocument(firebaseUser: any): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  
  const userData: Omit<User, 'id'> = {
    role: UserRole.STUDENT,
    profile: {
      firstName: firebaseUser.displayName?.split(' ')[0] || '',
      lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || undefined,
    },
    createdAt: serverTimestamp() as any,
    updatedAt: serverTimestamp() as any,
    isActive: true,
  };

  await setDoc(userRef, userData);
  console.log('User document created for:', firebaseUser.uid);
}

/**
 * Ensure user document exists (with retry)
 */
async function ensureUserDocument(firebaseUser: any, maxRetries = 3): Promise<void> {
  const userRef = doc(db, COLLECTIONS.USERS, firebaseUser.uid);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('Creating user document, attempt:', attempt + 1);
        await createUserDocument(firebaseUser);
        
        // Wait a bit and verify
        await new Promise(resolve => setTimeout(resolve, 500));
        const verifyDoc = await getDoc(userRef);
        
        if (verifyDoc.exists()) {
          console.log('User document verified');
          return;
        }
      } else {
        console.log('User document already exists');
        return;
      }
    } catch (error) {
      console.error('Error ensuring user document, attempt:', attempt + 1, error);
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
  
  throw new Error('Failed to create user document after retries');
}

/**
 * Sign in with Google using popup
 * Creates user document on first login
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    console.log('Starting Google sign-in...');
    const userCredential = await signInWithPopup(auth, googleProvider);
    const firebaseUser = userCredential.user;
    
    console.log('Google sign-in successful, uid:', firebaseUser.uid);

    // Ensure user document exists (with retry)
    await ensureUserDocument(firebaseUser);

    return userCredential;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

/**
 * Alternative: Sign in with Google using redirect (for popup blockers)
 * Call this from login page, then handle result in useEffect
 */
export async function signInWithGoogleRedirect(): Promise<void> {
  await signInWithRedirect(auth, googleProvider);
}

/**
 * Handle redirect result after Google sign-in
 * Call this in useEffect on login page
 */
export async function handleGoogleRedirectResult(): Promise<UserCredential | null> {
  try {
    console.log('Checking Google redirect result...');
    const result = await getRedirectResult(auth);
    if (result) {
      const firebaseUser = result.user;
      console.log('Redirect result found, uid:', firebaseUser.uid);
      
      // Ensure user document exists
      await ensureUserDocument(firebaseUser);

      return result;
    }
    return null;
  } catch (error: any) {
    console.error('Google redirect error:', error);
    throw new Error(error.message || 'Failed to complete Google sign in');
  }
}
