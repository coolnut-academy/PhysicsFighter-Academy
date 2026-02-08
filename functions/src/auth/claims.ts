/**
 * Firebase Auth Custom Claims Management
 * 
 * This module handles the synchronization of user roles between
 * Firestore (source of truth) and Firebase Auth custom claims (cached).
 * 
 * Security Model:
 * - Firestore users.role is the SOURCE OF TRUTH
 * - Custom claims are a SYNCHRONIZED CACHE only
 * - All role changes MUST go through Firestore
 * - Custom claims have MAX 1000 bytes limit
 */

import { logger } from 'firebase-functions';
import { auth } from '../config/firebase';
import { isValidRole, ValidRole } from '../utils/validation';

/**
 * Custom Claims Structure
 * 
 * NOTE: Keep this under 1000 bytes per Firebase limits.
 * Current structure: ~100-200 bytes typical size.
 */
export interface CustomClaims {
  /** User's authorization role */
  role: ValidRole;
  /** When claims were last synced (ISO 8601) */
  roleSyncedAt: string;
  /** Claims version for future migrations */
  claimsVersion: number;
}

/** Current version of claims structure */
const CURRENT_CLAIMS_VERSION = 1;

/** Maximum time before claims are considered stale (milliseconds) */
const CLAIMS_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Creates the custom claims object for a user
 */
export function createCustomClaims(role: ValidRole): CustomClaims {
  return {
    role,
    roleSyncedAt: new Date().toISOString(),
    claimsVersion: CURRENT_CLAIMS_VERSION,
  };
}

/**
 * Syncs a user's role from Firestore to their Auth custom claims
 * 
 * @param uid - Firebase Auth UID
 * @param role - The role to set
 * @returns Promise resolving to success status
 */
export async function syncRoleToClaims(uid: string, role: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate role before setting
    if (!isValidRole(role)) {
      logger.error('Attempted to set invalid role in claims', { uid, role });
      return { success: false, error: `Invalid role: ${role}` };
    }

    const claims = createCustomClaims(role);
    
    // Set custom claims on the user
    await auth.setCustomUserClaims(uid, claims);
    
    logger.info('Successfully synced role to custom claims', {
      uid,
      role,
      syncedAt: claims.roleSyncedAt,
    });

    return { success: true };
  } catch (error: any) {
    logger.error('Failed to sync role to custom claims', {
      uid,
      role,
      error: error.message,
      code: error.code,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Clears custom claims for a user (e.g., on account deactivation)
 */
export async function clearCustomClaims(uid: string): Promise<{ success: boolean; error?: string }> {
  try {
    await auth.setCustomUserClaims(uid, null);
    logger.info('Cleared custom claims for user', { uid });
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to clear custom claims', {
      uid,
      error: error.message,
    });
    return { success: false, error: error.message };
  }
}

/**
 * Gets the current custom claims for a user
 */
export async function getCustomClaims(uid: string): Promise<CustomClaims | null> {
  try {
    const userRecord = await auth.getUser(uid);
    const claims = userRecord.customClaims as CustomClaims | undefined;
    return claims || null;
  } catch (error: any) {
    logger.error('Failed to get custom claims', { uid, error: error.message });
    return null;
  }
}

/**
 * Checks if claims are stale and need refresh
 */
export function areClaimsStale(claims: CustomClaims): boolean {
  const syncedAt = new Date(claims.roleSyncedAt).getTime();
  const now = Date.now();
  return (now - syncedAt) > CLAIMS_MAX_AGE_MS;
}

/**
 * Validates that existing claims match expected structure
 */
export function validateClaimsStructure(claims: unknown): claims is CustomClaims {
  if (!claims || typeof claims !== 'object') return false;
  
  const c = claims as Record<string, unknown>;
  
  return (
    typeof c.role === 'string' &&
    isValidRole(c.role) &&
    typeof c.roleSyncedAt === 'string' &&
    typeof c.claimsVersion === 'number'
  );
}
