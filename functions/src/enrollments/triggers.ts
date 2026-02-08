/**
 * Enrollment Lifecycle Cloud Functions
 * 
 * These functions maintain the accessGranted field in response to
 * enrollment lifecycle events (create, update, delete).
 * 
 * All functions are idempotent and can safely be retried.
 */

import { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } from 'firebase-functions/v2/firestore';
import { logger } from 'firebase-functions';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { calculateAccess, calculateBatchAccess } from './access';

const db = getFirestore();

// ============================================================================
// Configuration
// ============================================================================

const REGION = 'asia-southeast1'; // Adjust to your region
const MEMORY = '256MiB';
const TIMEOUT_SECONDS = 30;

// ============================================================================
// onCreate: Initialize Access for New Enrollments
// ============================================================================

/**
 * Trigger: When enrollment is created
 * Action: Calculate and set initial accessGranted
 * 
 * Edge Cases Handled:
 * - Missing fields: Defaults to accessGranted = false
 * - Future startDate: accessGranted = false until start date
 * - Already expired (clock skew): accessGranted = false
 */
export const onEnrollmentCreated = onDocumentCreated(
  {
    document: 'enrollments/{enrollmentId}',
    region: REGION,
    memory: MEMORY,
    timeoutSeconds: TIMEOUT_SECONDS,
  },
  async (event: any) => {
    const enrollmentId = event.params.enrollmentId;
    const data = event.data?.data();

    if (!data) {
      logger.error('No data in enrollment create event', { enrollmentId });
      return;
    }

    logger.info('Processing enrollment creation', { enrollmentId, status: data.status });

    // Calculate access using server time
    const calculation = calculateAccess(data);

    // Prepare update
    const updates = {
      accessGranted: calculation.granted,
      accessComputedAt: calculation.computedAt,
      accessDenialReason: calculation.reason,
      // If already expired, update status too
      ...(calculation.reason === 'expired' && data.status === 'active' 
        ? { status: 'expired' } 
        : {}),
    };

    try {
      await event.data?.ref.update(updates);
      logger.info('Enrollment access initialized', {
        enrollmentId,
        accessGranted: calculation.granted,
        reason: calculation.reason,
      });
    } catch (error: any) {
      logger.error('Failed to initialize enrollment access', {
        enrollmentId,
        error: error.message,
      });
      throw error; // Retry
    }
  }
);

// ============================================================================
// onUpdate: Recalculate Access on Changes
// ============================================================================

/**
 * Trigger: When enrollment is updated
 * Action: Recalculate accessGranted if relevant fields changed
 * 
 * Relevant Fields (changes trigger recalculation):
 * - status
 * - expiresAt
 * - startDate
 * 
 * Idempotency:
 * - Checks if access calculation actually changed before writing
 * - Prevents infinite update loops
 */
export const onEnrollmentUpdated = onDocumentUpdated(
  {
    document: 'enrollments/{enrollmentId}',
    region: REGION,
    memory: MEMORY,
    timeoutSeconds: TIMEOUT_SECONDS,
  },
  async (event: any) => {
    const enrollmentId = event.params.enrollmentId;
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();

    if (!before || !after) {
      logger.error('Missing before/after data in update', { enrollmentId });
      return;
    }

    // Check if this was an access field update (avoid loops)
    const changedFields = Object.keys(after).filter(
      key => JSON.stringify(before[key]) !== JSON.stringify(after[key])
    );
    
    const accessFieldsOnly = changedFields.every(field => 
      ['accessGranted', 'accessComputedAt', 'accessDenialReason'].includes(field)
    );
    
    if (accessFieldsOnly) {
      logger.debug('Skipping: update was only access fields', { enrollmentId, changedFields });
      return;
    }

    // Check if relevant fields changed
    const relevantFieldsChanged = 
      before.status !== after.status ||
      before.expiresAt?.toMillis?.() !== after.expiresAt?.toMillis?.() ||
      before.startDate?.toMillis?.() !== after.startDate?.toMillis?.();

    if (!relevantFieldsChanged) {
      logger.debug('Skipping: no relevant fields changed', { enrollmentId });
      return;
    }

    logger.info('Processing enrollment update', {
      enrollmentId,
      changedFields,
      oldStatus: before.status,
      newStatus: after.status,
    });

    // Calculate new access
    const calculation = calculateAccess(after);

    // Check if access actually changed (idempotency)
    const accessChanged = 
      before.accessGranted !== calculation.granted ||
      before.accessDenialReason !== calculation.reason;

    if (!accessChanged) {
      logger.debug('Access unchanged, skipping update', {
        enrollmentId,
        accessGranted: calculation.granted,
      });
      return;
    }

    // Prepare update
    const updates = {
      accessGranted: calculation.granted,
      accessComputedAt: calculation.computedAt,
      accessDenialReason: calculation.reason,
      // If expired, update status
      ...(calculation.reason === 'expired' && after.status === 'active'
        ? { status: 'expired' }
        : {}),
    };

    try {
      await event.data?.after?.ref.update(updates);
      logger.info('Enrollment access updated', {
        enrollmentId,
        accessGranted: calculation.granted,
        reason: calculation.reason,
        previousAccess: before.accessGranted,
      });
    } catch (error: any) {
      logger.error('Failed to update enrollment access', {
        enrollmentId,
        error: error.message,
      });
      throw error;
    }
  }
);

// ============================================================================
// onDelete: Cleanup (if needed)
// ============================================================================

/**
 * Trigger: When enrollment is deleted
 * Action: Optional cleanup (e.g., analytics, notifications)
 * 
 * Note: Access is automatically revoked by deletion, no access field cleanup needed.
 */
export const onEnrollmentDeleted = onDocumentDeleted(
  {
    document: 'enrollments/{enrollmentId}',
    region: REGION,
    memory: MEMORY,
    timeoutSeconds: TIMEOUT_SECONDS,
  },
  async (event: any) => {
    const enrollmentId = event.params.enrollmentId;
    const data = event.data?.data();

    logger.info('Enrollment deleted', { enrollmentId, studentId: data?.studentId });

    // Optional: Send notification, update analytics, etc.
    // This is the right place for side effects that should happen on deletion
  }
);

// ============================================================================
// Backfill Function (One-time or scheduled)
// ============================================================================

/**
 * HTTP Callable: Backfill accessGranted for existing enrollments
 * 
 * Use this to initialize accessGranted for enrollments created
 * before these Cloud Functions were deployed.
 * 
 * Permission: super_admin only
 */
export async function backfillEnrollmentAccess(
  batchSize: number = 500
): Promise<{ processed: number; updated: number; errors: number }> {
  const stats = { processed: 0, updated: 0, errors: 0 };
  const serverTime = Timestamp.now();

  let lastDoc: any = null;
  let hasMore = true;

  logger.info('Starting enrollment access backfill');

  while (hasMore) {
    let query = db.collection('enrollments')
      .orderBy('__name__')
      .limit(batchSize);

    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const snapshot = await query.get();

    if (snapshot.empty) {
      hasMore = false;
      continue;
    }

    // Process batch
    const enrollments = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data(),
    }));

    const calculations = calculateBatchAccess(enrollments, serverTime);

    // Apply updates
    const batch = db.batch();
    let batchUpdateCount = 0;

    for (const calc of calculations) {
      const currentData = enrollments.find(e => e.id === calc.id)?.data;
      
      // Only update if changed or field doesn't exist
      if (
        currentData?.accessGranted !== calc.updates.accessGranted ||
        currentData?.accessComputedAt === undefined
      ) {
        const ref = db.collection('enrollments').doc(calc.id);
        batch.update(ref, calc.updates);
        batchUpdateCount++;
      }
    }

    if (batchUpdateCount > 0) {
      try {
        await batch.commit();
        stats.updated += batchUpdateCount;
        logger.info('Batch updated', { count: batchUpdateCount });
      } catch (error: any) {
        logger.error('Batch update failed', { error: error.message });
        stats.errors += batchUpdateCount;
      }
    }

    stats.processed += enrollments.length;
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    hasMore = snapshot.docs.length === batchSize;

    logger.info('Backfill progress', { 
      processed: stats.processed, 
      updated: stats.updated,
      errors: stats.errors 
    });
  }

  logger.info('Backfill complete', stats);
  return stats;
}
