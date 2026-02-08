/**
 * Token Revocation on Role Change
 * 
 * CRITICAL SECURITY FIX: When a user's role is changed in Firestore,
 * this function immediately revokes all refresh tokens for that user.
 * 
 * EFFECT: User's existing ID token remains valid until expiration (60 min max),
 * but they cannot get NEW tokens after revocation. This forces re-authentication
 * where they receive updated claims.
 * 
 * Timeline:
 * - T+0: Role changed in Firestore
 * - T+1s: This function triggers and revokes tokens
 * - T+1s to T+60min: Existing sessions continue with OLD claims
 * - T+60min: ID token expires, user MUST re-authenticate
 * - After re-auth: User gets NEW token with updated claims
 * 
 * To reduce the 60-minute window, also reduce token lifetime in Firebase Console
 * from 3600 seconds to 1800 seconds (30 minutes).
 */

import { onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const db = getFirestore();

/**
 * Trigger: When a user's role field changes
 * Action: Revoke all refresh tokens for that user
 * 
 * This forces the user to re-authenticate, at which point they receive
 * updated custom claims reflecting their new role.
 */
export const revokeTokensOnRoleChange = onDocumentUpdated(
  {
    document: 'users/{uid}',
    region: 'asia-southeast1',
    memory: '256MiB',
    timeoutSeconds: 30,
  },
  async (event: any) => {
    const uid = event.params.uid;
    const beforeData = event.data?.before?.data();
    const afterData = event.data?.after?.data();

    // Check if role field changed
    const beforeRole = beforeData?.role;
    const afterRole = afterData?.role;

    if (beforeRole === afterRole) {
      // No role change, skip
      return;
    }

    logger.info('Role change detected, revoking refresh tokens', {
      uid,
      beforeRole,
      afterRole,
      timestamp: new Date().toISOString(),
    });

    try {
      // Revoke ALL refresh tokens for this user
      // This forces re-authentication on next token refresh
      await getAuth().revokeRefreshTokens(uid);

      // Record the revocation in Firestore for audit trail
      await db.collection('users').doc(uid).update({
        tokensRevokedAt: new Date().toISOString(),
        previousRole: beforeRole,
        roleChangedAt: new Date().toISOString(),
      });

      logger.info('Tokens revoked successfully', {
        uid,
        beforeRole,
        afterRole,
      });

      // Note: Custom claims will be synced by the existing syncUserRoleToClaims function
      // which also triggers on this document update
    } catch (error: any) {
      logger.error('Failed to revoke tokens on role change', {
        uid,
        error: error.message,
        code: error.code,
      });

      // Store error for investigation but don't block the role change
      await db.collection('users').doc(uid).update({
        tokenRevocationError: {
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });

      // Don't throw - we don't want to block the role change
      // The user will still get new claims, just with potential delay
    }
  }
);

/**
 * HTTP Callable: Manually revoke tokens for a user
 * Use for emergency access revocation
 */
export const emergencyRevokeTokens = async (uid: string, reason: string) => {
  try {
    await getAuth().revokeRefreshTokens(uid);

    await db.collection('users').doc(uid).update({
      tokensRevokedAt: new Date().toISOString(),
      tokenRevocationReason: reason,
    });

    logger.info('Emergency token revocation', { uid, reason });
    return { success: true };
  } catch (error: any) {
    logger.error('Emergency token revocation failed', { uid, error: error.message });
    return { success: false, error: error.message };
  }
};
