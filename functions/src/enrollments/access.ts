/**
 * Enrollment Access Calculation
 * 
 * This module provides the single source of truth for determining
 * if a student has access to a course based on their enrollment.
 * 
 * Access Model:
 * - accessGranted = true  → Student can access course content
 * - accessGranted = false → Student cannot access (expired/cancelled/etc.)
 * 
 * Deterministic: Uses server-side timestamp only (no client time)
 */

import { Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

// ============================================================================
// Types
// ============================================================================

export type EnrollmentStatus = 'active' | 'expired' | 'cancelled' | 'completed' | 'pending_payment';
export type AccessDenialReason = 'expired' | 'cancelled' | 'completed' | 'payment_pending' | 'not_started';

export interface EnrollmentData {
  status: EnrollmentStatus;
  expiresAt: Timestamp;
  startDate: Timestamp;
  accessGranted?: boolean;
}

export interface AccessCalculation {
  granted: boolean;
  reason: AccessDenialReason | null;
  computedAt: Timestamp;
}

// ============================================================================
// Access Calculation Logic
// ============================================================================

/**
 * Calculates access status for an enrollment
 * 
 * This is THE single source of truth for access determination.
 * All other code (frontend, rules) should rely on the accessGranted field
 * which is computed by this function.
 * 
 * @param enrollment - The enrollment document data
 * @param serverTime - The authoritative server timestamp (default: now)
 * @returns Access calculation result
 */
export function calculateAccess(
  enrollment: Partial<EnrollmentData>,
  serverTime: Timestamp = Timestamp.now()
): AccessCalculation {
  const { status, expiresAt, startDate } = enrollment;

  // Default: deny access
  let granted = false;
  let reason: AccessDenialReason | null = 'not_started';

  // Check 1: Status must be 'active'
  if (status !== 'active') {
    switch (status) {
      case 'expired':
        reason = 'expired';
        break;
      case 'cancelled':
        reason = 'cancelled';
        break;
      case 'completed':
        reason = 'completed';
        break;
      case 'pending_payment':
        reason = 'payment_pending';
        break;
      default:
        reason = 'not_started';
    }
    
    logger.debug('Access denied: status not active', { status, reason });
    return { granted, reason, computedAt: serverTime };
  }

  // Check 2: Must have expiresAt
  if (!expiresAt) {
    logger.warn('Access denied: missing expiresAt', { enrollment });
    reason = 'not_started';
    return { granted, reason, computedAt: serverTime };
  }

  // Check 3: Must have startDate (optional but recommended)
  if (startDate && startDate.toMillis() > serverTime.toMillis()) {
    logger.debug('Access denied: startDate in future', { 
      startDate: startDate.toDate(), 
      serverTime: serverTime.toDate() 
    });
    reason = 'not_started';
    return { granted, reason, computedAt: serverTime };
  }

  // Check 4: Current time must be before expiresAt
  if (serverTime.toMillis() >= expiresAt.toMillis()) {
    logger.debug('Access denied: expired', { 
      expiresAt: expiresAt.toDate(), 
      serverTime: serverTime.toDate() 
    });
    reason = 'expired';
    return { granted, reason, computedAt: serverTime };
  }

  // All checks passed - grant access
  granted = true;
  reason = null;

  logger.debug('Access granted', { 
    expiresAt: expiresAt.toDate(), 
    serverTime: serverTime.toDate(),
    timeRemainingMs: expiresAt.toMillis() - serverTime.toMillis()
  });

  return { granted, reason, computedAt: serverTime };
}

/**
 * Determines if an enrollment should be expired
 * 
 * @param enrollment - The enrollment document data
 * @param serverTime - The authoritative server timestamp (default: now)
 * @returns True if enrollment should be expired
 */
export function shouldExpire(
  enrollment: Partial<EnrollmentData>,
  serverTime: Timestamp = Timestamp.now()
): boolean {
  const { status, expiresAt, accessGranted } = enrollment;

  // Already not active
  if (status !== 'active') {
    return false;
  }

  // No expiration date
  if (!expiresAt) {
    return false;
  }

  // Already marked as no access
  if (accessGranted === false) {
    return false;
  }

  // Check if expired
  return serverTime.toMillis() >= expiresAt.toMillis();
}

/**
 * Calculates time remaining for an enrollment
 * 
 * @param enrollment - The enrollment document data
 * @param serverTime - The authoritative server timestamp (default: now)
 * @returns Time remaining in milliseconds, or 0 if expired
 */
export function getTimeRemaining(
  enrollment: Partial<EnrollmentData>,
  serverTime: Timestamp = Timestamp.now()
): number {
  const { expiresAt } = enrollment;

  if (!expiresAt) {
    return 0;
  }

  const remaining = expiresAt.toMillis() - serverTime.toMillis();
  return Math.max(0, remaining);
}

/**
 * Checks if enrollment is about to expire (warning threshold)
 * 
 * @param enrollment - The enrollment document data
 * @param warningThresholdMs - Time before expiration to trigger warning (default: 7 days)
 * @param serverTime - The authoritative server timestamp (default: now)
 * @returns True if within warning threshold
 */
export function isExpiringSoon(
  enrollment: Partial<EnrollmentData>,
  warningThresholdMs: number = 7 * 24 * 60 * 60 * 1000, // 7 days
  serverTime: Timestamp = Timestamp.now()
): boolean {
  const { expiresAt, accessGranted } = enrollment;

  if (!accessGranted || !expiresAt) {
    return false;
  }

  const timeRemaining = expiresAt.toMillis() - serverTime.toMillis();
  return timeRemaining > 0 && timeRemaining <= warningThresholdMs;
}

// ============================================================================
// Batch Processing Utilities
// ============================================================================

/**
 * Calculates access for a batch of enrollments
 * 
 * @param enrollments - Array of enrollment documents
 * @param serverTime - The authoritative server timestamp
 * @returns Array of update operations
 */
export function calculateBatchAccess(
  enrollments: Array<{ id: string; data: Partial<EnrollmentData> }>,
  serverTime: Timestamp = Timestamp.now()
): Array<{
  id: string;
  updates: {
    accessGranted: boolean;
    accessComputedAt: Timestamp;
    accessDenialReason: AccessDenialReason | null;
    status?: EnrollmentStatus;
  };
}> {
  return enrollments.map(({ id, data }) => {
    const calculation = calculateAccess(data, serverTime);
    
    const updates: {
      accessGranted: boolean;
      accessComputedAt: Timestamp;
      accessDenialReason: AccessDenialReason | null;
      status?: EnrollmentStatus;
    } = {
      accessGranted: calculation.granted,
      accessComputedAt: calculation.computedAt,
      accessDenialReason: calculation.reason,
    };

    // If expired, also update status
    if (calculation.reason === 'expired' && data.status === 'active') {
      updates.status = 'expired';
    }

    return { id, updates };
  });
}
