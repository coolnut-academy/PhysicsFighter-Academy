/**
 * Scheduled Enrollment Expiration
 * 
 * This module handles the scheduled expiration of enrollments.
 * It runs periodically to find and expire enrollments past their expiration date.
 * 
 * Key Properties:
 * - Idempotent: Safe to run multiple times
 * - Batched: Handles large volumes efficiently
 * - Monitored: Tracks performance metrics
 * - Resilient: Continues on individual errors
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { shouldExpire } from './access';

const db = getFirestore();

// ============================================================================
// Configuration
// ============================================================================

const REGION = 'asia-southeast1';
const SCHEDULE = 'every 1 minutes'; // Run every minute
const BATCH_SIZE = 500; // Firestore limit for 'in' queries, safe for batch writes
const MAX_RUNTIME_SECONDS = 60;

// ============================================================================
// Metrics Tracking
// ============================================================================

interface ExpirationMetrics {
  runStartTime: Timestamp;
  enrollmentsChecked: number;
  enrollmentsExpired: number;
  batchesProcessed: number;
  errors: number;
  processingTimeMs: number;
}

async function logMetrics(metrics: ExpirationMetrics): Promise<void> {
  logger.info('Expiration job metrics', metrics);
  
  // Store metrics for monitoring
  try {
    await db.collection('systemMetrics').doc('enrollmentExpiration').set({
      ...metrics,
      lastRun: FieldValue.serverTimestamp(),
    }, { merge: true });
  } catch (error) {
    logger.error('Failed to log metrics', error);
  }
}

// ============================================================================
// Main Scheduled Function
// ============================================================================

/**
 * Scheduled: Expire enrollments past their expiration date
 * 
 * Runs every minute to:
 * 1. Query enrollments where expiresAt <= now AND accessGranted == true
 * 2. Update them to accessGranted = false, status = 'expired'
 * 3. Log metrics for monitoring
 * 
 * Edge Cases Handled:
 * - Large volumes: Processed in batches
 * - Partial failures: Continues on batch errors
 * - Long runtime: Uses cursors for pagination
 * - Duplicate runs: Idempotent updates (same result if run twice)
 */
export const expireEnrollments = onSchedule(
  {
    schedule: SCHEDULE,
    region: REGION,
    timeZone: 'UTC', // Use UTC for consistency
    memory: '512MiB', // Higher memory for batch operations
    timeoutSeconds: MAX_RUNTIME_SECONDS,
  },
  async (event: any) => {
    const runStartTime = Timestamp.now();
    const metrics: ExpirationMetrics = {
      runStartTime,
      enrollmentsChecked: 0,
      enrollmentsExpired: 0,
      batchesProcessed: 0,
      errors: 0,
      processingTimeMs: 0,
    };

    logger.info('Starting enrollment expiration job', { 
      scheduledTime: event.scheduleTime 
    });

    try {
      let lastDoc: any = null;
      let hasMore = true;
      let totalProcessed = 0;

      // Process in batches until no more enrollments or time limit reached
      while (hasMore && totalProcessed < 10000) { // Safety limit
        // const batchStartTime = Date.now();

        // Build query
        let query = db.collection('enrollments')
          .where('accessGranted', '==', true)
          .where('expiresAt', '<=', runStartTime)
          .orderBy('expiresAt') // Order for consistent pagination
          .limit(BATCH_SIZE);

        if (lastDoc) {
          query = query.startAfter(lastDoc);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
          hasMore = false;
          logger.info('No more enrollments to expire');
          continue;
        }

        // Process batch
        const toExpire: Array<{ id: string; ref: any; data: any }> = [];
        
        for (const doc of snapshot.docs) {
          const data = doc.data();
          
          // Double-check (defense in depth)
          if (shouldExpire(data, runStartTime)) {
            toExpire.push({ id: doc.id, ref: doc.ref, data });
          }
        }

        metrics.enrollmentsChecked += snapshot.docs.length;

        // Update batch
        if (toExpire.length > 0) {
          const batch = db.batch();
          
          for (const enrollment of toExpire) {
            batch.update(enrollment.ref, {
              accessGranted: false,
              status: 'expired',
              accessDenialReason: 'expired',
              accessComputedAt: FieldValue.serverTimestamp(),
              // Optional: track when expiration was processed
              expiredAt: FieldValue.serverTimestamp(),
            });
          }

          try {
            await batch.commit();
            metrics.enrollmentsExpired += toExpire.length;
            logger.info('Batch expired', { 
              count: toExpire.length,
              firstId: toExpire[0]?.id,
              lastId: toExpire[toExpire.length - 1]?.id,
            });
          } catch (error: any) {
            logger.error('Batch expiration failed', { 
              error: error.message,
              count: toExpire.length,
            });
            metrics.errors += toExpire.length;
          }
        }

        metrics.batchesProcessed++;
        totalProcessed += snapshot.docs.length;
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        hasMore = snapshot.docs.length === BATCH_SIZE;

        // Check runtime limit
        const elapsedMs = Date.now() - runStartTime.toMillis();
        if (elapsedMs > (MAX_RUNTIME_SECONDS - 5) * 1000) {
          logger.warn('Approaching timeout, stopping batch processing', {
            elapsedMs,
            totalProcessed,
          });
          break;
        }

        // Small delay to prevent Firestore throttling
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      metrics.processingTimeMs = Date.now() - runStartTime.toMillis();
      await logMetrics(metrics);

      logger.info('Enrollment expiration job complete', metrics);

    } catch (error: any) {
      logger.error('Expiration job failed', { error: error.message });
      metrics.processingTimeMs = Date.now() - runStartTime.toMillis();
      await logMetrics(metrics);
      throw error;
    }
  }
);

// ============================================================================
// Immediate Expiration (HTTP Callable)
// ============================================================================

/**
 * HTTP Callable: Immediately expire a specific enrollment
 * 
 * Use case: Admin wants to revoke access immediately
 * Permission: super_admin or course owner
 */
export async function expireEnrollmentImmediately(
  enrollmentId: string,
  reason: string = 'manual_revoke'
): Promise<{ success: boolean; error?: string }> {
  try {
    const ref = db.collection('enrollments').doc(enrollmentId);
    const doc = await ref.get();

    if (!doc.exists) {
      return { success: false, error: 'Enrollment not found' };
    }

    await ref.update({
      accessGranted: false,
      status: 'cancelled',
      accessDenialReason: 'cancelled',
      accessComputedAt: FieldValue.serverTimestamp(),
      cancelledAt: FieldValue.serverTimestamp(),
      cancellationReason: reason,
    });

    logger.info('Enrollment immediately expired', { enrollmentId, reason });
    return { success: true };
  } catch (error: any) {
    logger.error('Failed to expire enrollment', { enrollmentId, error: error.message });
    return { success: false, error: error.message };
  }
}

// ============================================================================
// Validation Function (HTTP Callable)
// ============================================================================

/**
 * HTTP Callable: Validate enrollment access
 * 
 * Forces immediate access check and returns result.
 * Use when student attempts to access course content.
 */
export async function validateEnrollmentAccess(
  enrollmentId: string
): Promise<{
  granted: boolean;
  reason?: string;
  expiresAt?: Timestamp;
  timeRemainingMs?: number;
}> {
  try {
    const doc = await db.collection('enrollments').doc(enrollmentId).get();

    if (!doc.exists) {
      return { granted: false, reason: 'not_found' };
    }

    const data = doc.data();
    const serverTime = Timestamp.now();

    // If access is already denied, return immediately
    if (data?.accessGranted === false) {
      return {
        granted: false,
        reason: data.accessDenialReason || 'unknown',
        expiresAt: data.expiresAt,
      };
    }

    // If access is granted, double-check with current server time
    // This handles the case where scheduled function hasn't run yet
    const { calculateAccess } = await import('./access');
    const calculation = calculateAccess(data || {}, serverTime);

    // If calculation differs from stored value, update it
    if (calculation.granted !== data?.accessGranted) {
      await doc.ref.update({
        accessGranted: calculation.granted,
        accessComputedAt: calculation.computedAt,
        accessDenialReason: calculation.reason,
        ...(calculation.reason === 'expired' ? { status: 'expired' } : {}),
      });
      
      logger.info('Access validation updated enrollment', {
        enrollmentId,
        previous: data?.accessGranted,
        current: calculation.granted,
      });
    }

    return {
      granted: calculation.granted,
      reason: calculation.reason || undefined,
      expiresAt: data?.expiresAt,
      timeRemainingMs: calculation.granted && data?.expiresAt
        ? data.expiresAt.toMillis() - serverTime.toMillis()
        : undefined,
    };
  } catch (error: any) {
    logger.error('Access validation failed', { enrollmentId, error: error.message });
    return { granted: false, reason: 'error' };
  }
}
