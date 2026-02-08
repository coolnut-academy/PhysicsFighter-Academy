/**
 * Firestore Triggers for Auth Custom Claims Synchronization
 * 
 * These Cloud Functions listen to changes in the users collection
 * and synchronize the role field to Firebase Auth custom claims.
 * 
 * TRIGGER: onWrite on users/{uid}
 * - Triggers on create, update, or delete
 * - Syncs role to custom claims on create/update
 * - Clears claims on delete
 * 
 * SECURITY: Role validation is performed before syncing to prevent
 * unauthorized elevation. See validation.ts for rules.
 */

import { onDocumentWritten, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { auth } from '../config/firebase';
import { syncRoleToClaims, clearCustomClaims, validateClaimsStructure } from './claims';
import { 
  validateRoleTransition, 
  normalizeRole,
  isValidRole
} from '../utils/validation';

const db = getFirestore();

/**
 * Get the caller's role from the event context or auth
 * In production, this comes from the authenticated request context
 * In Firestore triggers, we need to determine from the operation
 */
async function getCallerRole(event: any): Promise<{ role: string | null; uid: string | null }> {
  // For v2 functions, auth context is in event.authType and event.auth
  if (event.authType === 'ADMIN') {
    // This is a service account/admin operation
    // We need to track the actual user making the change via a field in the document
    return { role: 'super_admin', uid: event.auth?.uid || null };
  }
  
  if (event.authType === 'USER' && event.auth?.uid) {
    // Get the user's role from their claims or Firestore
    try {
      const userRecord = await auth.getUser(event.auth.uid);
      const claims = userRecord.customClaims;
      if (claims && isValidRole(claims.role)) {
        return { role: claims.role, uid: event.auth.uid };
      }
      
      // Fallback to Firestore
      const userDoc = await db.collection('users').doc(event.auth.uid).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        if (data && isValidRole(data.role)) {
          return { role: data.role, uid: event.auth.uid };
        }
      }
    } catch (error) {
      logger.warn('Could not determine caller role', { error, uid: event.auth?.uid });
    }
  }
  
  return { role: null, uid: event.auth?.uid || null };
}

/**
 * Main trigger: onWrite for users/{uid}
 * 
 * Handles all write operations (create, update, delete) on user documents.
 * This is the primary trigger for role synchronization.
 */
export const syncUserRoleToClaims = onDocumentWritten(
  {
    document: 'users/{uid}',
    region: 'asia-southeast1', // Adjust to your region
    // Memory and timeout configuration
    memory: '256MiB',
    timeoutSeconds: 30,
    // Retry configuration - don't retry on validation failures
    maxInstances: 10,
  },
  async (event: any) => {
    const uid = event.params.uid;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Case 1: User document deleted - clear claims
    if (!afterData) {
      logger.info('User document deleted, clearing custom claims', { uid });
      const result = await clearCustomClaims(uid);
      if (!result.success) {
        logger.error('Failed to clear claims on delete', { uid, error: result.error });
        // Don't throw - document is already deleted
      }
      return;
    }

    // Case 2: User document created or updated
    const newRole = normalizeRole(afterData.role || 'student');
    const previousRole = beforeData ? normalizeRole(beforeData.role || 'student') : null;
    const isNewUser = !beforeData;

    // Get caller information for validation
    const caller = await getCallerRole(event);

    logger.info('Processing user document change', {
      uid,
      isNewUser,
      previousRole,
      newRole,
      callerRole: caller.role,
      callerUid: caller.uid,
    });

    // Validate the role transition
    const validation = validateRoleTransition({
      newRole,
      previousRole,
      callerRole: caller.role,
      isNewUser,
      targetUid: uid,
      callerUid: caller.uid,
    });

    if (!validation.valid) {
      logger.error('Role validation failed', {
        uid,
        error: validation.error,
        code: validation.code,
      });
      
      // For updates that fail validation, we should revert the document
      // However, this could cause infinite loops - better to alert and manual fix
      // In a production system, send an alert to admins
      if (!isNewUser && validation.code === 'UNAUTHORIZED_ASSIGNMENT') {
        // Revert the role change
        try {
          await event.data!.before!.ref.update({
            role: previousRole,
            _revertedAt: new Date().toISOString(),
            _revertReason: validation.code,
          });
          logger.warn('Reverted unauthorized role change', { uid, previousRole });
        } catch (revertError) {
          logger.error('Failed to revert unauthorized role change', { uid, revertError });
        }
      }
      
      // Don't throw - let the function complete, but the claims won't be updated
      return;
    }

    // Check if role actually changed (for updates)
    if (!isNewUser && previousRole === newRole) {
      logger.debug('Role unchanged, skipping claims sync', { uid, role: newRole });
      
      // Still validate that claims are correct (healing mechanism)
      try {
        const userRecord = await auth.getUser(uid);
        const existingClaims = userRecord.customClaims;
        
        if (!existingClaims || !validateClaimsStructure(existingClaims)) {
          logger.info('Claims missing or invalid, re-syncing', { uid });
          const result = await syncRoleToClaims(uid, newRole);
          if (!result.success) {
            logger.error('Failed to heal claims', { uid, error: result.error });
          }
        }
      } catch (error: any) {
        logger.error('Error during claims healing check', { uid, error: error.message });
      }
      
      return;
    }

    // Sync role to custom claims
    const result = await syncRoleToClaims(uid, newRole);
    
    if (!result.success) {
      logger.error('Failed to sync role to claims', { 
        uid, 
        role: newRole, 
        error: result.error 
      });
      // Throw to trigger retry
      throw new Error(`Failed to sync role: ${result.error}`);
    }

    // Update the syncedAt timestamp in the document for audit
    try {
      await event.data!.after!.ref.update({
        _claimsSyncedAt: new Date().toISOString(),
      });
    } catch (updateError) {
      // Non-critical - just for audit
      logger.warn('Failed to update synced timestamp', { uid, updateError });
    }

    logger.info('Successfully synced user role to claims', {
      uid,
      role: newRole,
      isNewUser,
    });
  }
);

/**
 * Separate trigger for deletes (optional, as onWrite handles this)
 * Kept for explicit clarity and potential different retry behavior
 */
export const onUserDeleted = onDocumentDeleted(
  {
    document: 'users/{uid}',
    region: 'asia-southeast1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (event: any) => {
    const uid = event.params.uid;
    logger.info('User document deleted', { uid });
    
    const result = await clearCustomClaims(uid);
    if (!result.success) {
      logger.error('Failed to clear claims on delete', { uid, error: result.error });
    }
  }
);

/**
 * HTTP Callable: Force refresh claims for a user
 * 
 * Use case: Manual healing when claims get out of sync
 * Permission: super_admin only
 */
export const forceRefreshClaims = onDocumentUpdated(
  {
    document: 'adminOperations/{operationId}',
    region: 'asia-southeast1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (event: any) => {
    // This is a placeholder for an HTTP callable function
    // In production, use onCall for direct API invocation
    logger.debug('Admin operation processed', { operationId: event.params.operationId });
  }
);

/**
 * Scheduled function: Audit and heal stale claims
 * 
 * Runs periodically to check for users whose claims may be out of sync
 * with their Firestore role. This is a safety net.
 * 
 * NOTE: Enable this only if needed - it reads all user documents
 */
/*
export const auditClaims = onSchedule({
  schedule: '0 2 * * *', // Daily at 2 AM
  region: 'asia-southeast1',
  memory: '512MiB',
  timeoutSeconds: 300,
}, async (context) => {
  logger.info('Starting claims audit');
  
  // This would iterate through users and check claims consistency
  // Implementation omitted for brevity - consider using cursor-based pagination
  // for large user bases
});
*/
