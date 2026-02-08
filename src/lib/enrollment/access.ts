/**
 * Enrollment Access Client Utilities
 * 
 * This module provides client-side utilities for working with the
 * deterministic enrollment access model.
 * 
 * IMPORTANT: These are UX utilities only. Security enforcement happens
 * in Firestore rules. Never rely on client-side checks for security.
 */

import { doc, getDoc, updateDoc, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Enrollment, EnrollmentStatus } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface AccessCheckResult {
  /** Whether access is currently granted */
  granted: boolean;
  /** Reason for denial (if denied) */
  reason?: 'expired' | 'cancelled' | 'completed' | 'payment_pending' | 'not_started' | 'error';
  /** When access will expire (if granted) */
  expiresAt?: Date;
  /** Time remaining in milliseconds (if granted) */
  timeRemainingMs?: number;
  /** Whether the result is from server (true) or cache (false) */
  fromServer: boolean;
}

export interface EnrollmentWithAccess extends Enrollment {
  /** Computed access flag - THE single source of truth */
  accessGranted?: boolean;
  /** When access was last computed */
  accessComputedAt?: Timestamp;
  /** Why access was denied (if applicable) */
  accessDenialReason?: 'expired' | 'cancelled' | 'completed' | 'payment_pending' | 'not_started' | 'error';
}

// ============================================================================
// Access Checking (UX Only)
// ============================================================================

/**
 * Checks if enrollment has access granted
 * 
 * This is a simple client-side check for UI purposes.
 * Firestore rules enforce the actual access control.
 * 
 * @param enrollment - The enrollment document
 * @returns boolean indicating access status
 */
export function hasAccess(enrollment?: EnrollmentWithAccess | null): boolean {
  if (!enrollment) return false;
  
  // Primary: Use computed access flag
  if (typeof enrollment.accessGranted === 'boolean') {
    return enrollment.accessGranted;
  }
  
  // Fallback: Legacy check (for enrollments before migration)
  if (enrollment.status && enrollment.expiresAt) {
    const expiresAt = enrollment.expiresAt instanceof Date 
      ? enrollment.expiresAt 
      : enrollment.expiresAt.toDate();
    return enrollment.status === 'active' && expiresAt > new Date();
  }
  
  return false;
}

/**
 * Gets the access denial reason for display
 * 
 * @param enrollment - The enrollment document
 * @returns Human-readable reason or null if access granted
 */
export function getAccessDenialReason(
  enrollment?: EnrollmentWithAccess | null,
  overrideReason?: AccessCheckResult['reason']
): string | null {
  if (!enrollment) return 'ไม่พบข้อมูลการลงทะเบียน';
  
  if (hasAccess(enrollment) && !overrideReason) return null;
  
  // Use override reason if provided, otherwise use enrollment's reason
  const reason = overrideReason || enrollment.accessDenialReason;
  
  switch (reason) {
    case 'expired':
      return 'การลงทะเบียนหมดอายุแล้ว';
    case 'cancelled':
      return 'การลงทะเบียนถูกยกเลิก';
    case 'completed':
      return 'คุณเรียนจบคอร์สนี้แล้ว';
    case 'payment_pending':
      return 'รอการชำระเงิน';
    case 'not_started':
      return 'การลงทะเบียนยังไม่เริ่มต้น';
    case 'error':
      return 'ไม่สามารถเข้าถึงได้';
    default:
      // Check legacy fields
      if (enrollment.status === 'expired') return 'การลงทะเบียนหมดอายุแล้ว';
      if (enrollment.status === 'cancelled') return 'การลงทะเบียนถูกยกเลิก';
      if (enrollment.status === 'completed') return 'คุณเรียนจบคอร์สนี้แล้ว';
      return 'ไม่สามารถเข้าถึงได้';
  }
}

// ============================================================================
// Time Utilities (Informational Only)
// ============================================================================

/**
 * Gets time remaining for enrollment
 * 
 * @param enrollment - The enrollment document
 * @returns Time remaining in milliseconds, or 0 if expired/no access
 */
export function getTimeRemaining(enrollment?: EnrollmentWithAccess | null): number {
  if (!enrollment?.expiresAt) return 0;
  
  const expiresAt = enrollment.expiresAt instanceof Date 
    ? enrollment.expiresAt 
    : enrollment.expiresAt.toDate();
  
  const remaining = expiresAt.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Gets expiration warning level
 * 
 * @param enrollment - The enrollment document
 * @returns Warning level or null if no warning needed
 */
export function getExpirationWarning(enrollment?: EnrollmentWithAccess | null): {
  level: 'critical' | 'warning' | 'info' | null;
  message: string;
  daysLeft: number;
} {
  if (!hasAccess(enrollment) || !enrollment?.expiresAt) {
    return { level: null, message: '', daysLeft: 0 };
  }
  
  const expiresAt = enrollment.expiresAt instanceof Date 
    ? enrollment.expiresAt 
    : enrollment.expiresAt.toDate();
  
  const daysLeft = Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  if (daysLeft <= 0) {
    return { level: 'critical', message: 'หมดอายุแล้ว', daysLeft: 0 };
  }
  
  if (daysLeft <= 3) {
    return { level: 'critical', message: `เหลือเวลา ${daysLeft} วัน`, daysLeft };
  }
  
  if (daysLeft <= 7) {
    return { level: 'warning', message: `เหลือเวลา ${daysLeft} วัน`, daysLeft };
  }
  
  if (daysLeft <= 14) {
    return { level: 'info', message: `เหลือเวลา ${daysLeft} วัน`, daysLeft };
  }
  
  return { level: null, message: '', daysLeft };
}

// ============================================================================
// Server Validation (Authoritative)
// ============================================================================

/**
 * Forces immediate server-side access validation
 * 
 * Use this when student attempts to access course content.
 * Triggers Cloud Function to recalculate access.
 * 
 * @param enrollmentId - The enrollment ID
 * @returns Access check result from server
 */
export async function validateAccessWithServer(
  enrollmentId: string
): Promise<AccessCheckResult> {
  try {
    // In production, this would call a Cloud Function
    // For now, we do a fresh read from server
    const enrollmentRef = doc(db, 'enrollments', enrollmentId);
    const snapshot = await getDoc(enrollmentRef);
    
    if (!snapshot.exists()) {
      return { granted: false, reason: 'error', fromServer: true };
    }
    
    const enrollment = snapshot.data() as EnrollmentWithAccess;
    
    // If accessGranted not set yet, enrollment is still initializing
    if (typeof enrollment.accessGranted !== 'boolean') {
      // Wait a moment and retry
      await new Promise(resolve => setTimeout(resolve, 1000));
      const retrySnapshot = await getDoc(enrollmentRef);
      const retryData = retrySnapshot.data() as EnrollmentWithAccess;
      
      if (typeof retryData.accessGranted !== 'boolean') {
        return { granted: false, reason: 'not_started', fromServer: true };
      }
      
      enrollment.accessGranted = retryData.accessGranted;
      enrollment.accessDenialReason = retryData.accessDenialReason;
    }
    
    return {
      granted: enrollment.accessGranted,
      reason: enrollment.accessGranted ? undefined : enrollment.accessDenialReason,
      expiresAt: enrollment.expiresAt?.toDate?.(),
      timeRemainingMs: enrollment.accessGranted ? getTimeRemaining(enrollment) : undefined,
      fromServer: true,
    };
  } catch (error) {
    console.error('Access validation failed:', error);
    return { granted: false, reason: 'error', fromServer: true };
  }
}

// ============================================================================
// Real-time Access Subscription
// ============================================================================

/**
 * Subscribes to enrollment access changes
 * 
 * Automatically updates when accessGranted changes (e.g., on expiration)
 * 
 * @param enrollmentId - The enrollment ID
 * @param callback - Called with updated access status
 * @returns Unsubscribe function
 */
export function subscribeToAccessChanges(
  enrollmentId: string,
  callback: (result: AccessCheckResult) => void
): () => void {
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  
  return onSnapshot(
    enrollmentRef,
    { includeMetadataChanges: true },
    (snapshot) => {
      if (!snapshot.exists()) {
        callback({ granted: false, reason: 'error', fromServer: !snapshot.metadata.fromCache });
        return;
      }
      
      const enrollment = snapshot.data() as EnrollmentWithAccess;
      
      callback({
        granted: hasAccess(enrollment),
        reason: enrollment.accessDenialReason,
        expiresAt: enrollment.expiresAt?.toDate?.(),
        timeRemainingMs: hasAccess(enrollment) ? getTimeRemaining(enrollment) : undefined,
        fromServer: !snapshot.metadata.fromCache,
      });
    },
    (error) => {
      console.error('Access subscription error:', error);
      callback({ granted: false, reason: 'error', fromServer: true });
    }
  );
}

// ============================================================================
// Access Attempt (with Retry)
// ============================================================================

/**
 * Attempts to access course content with automatic retry on stale data
 * 
 * Handles edge cases:
 * - Enrollment just created (accessGranted not yet computed)
 * - Expiration happened while offline
 * - Scheduled function hasn't run yet
 * 
 * @param enrollmentId - The enrollment ID
 * @param onAccessGranted - Called when access is confirmed
 * @param onAccessDenied - Called when access is denied
 */
export async function attemptCourseAccess(
  enrollmentId: string,
  onAccessGranted: () => void,
  onAccessDenied: (reason: string) => void,
  options: {
    maxRetries?: number;
    retryDelayMs?: number;
  } = {}
): Promise<void> {
  const { maxRetries = 3, retryDelayMs = 1000 } = options;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const result = await validateAccessWithServer(enrollmentId);
    
    if (result.granted) {
      onAccessGranted();
      return;
    }
    
    // If access denied and we have a reason, fail immediately
    if (result.reason && result.reason !== 'not_started') {
      onAccessDenied(getAccessDenialReason(undefined, result.reason) || 'ไม่สามารถเข้าถึงได้');
      return;
    }
    
    // If enrollment still initializing, wait and retry
    if (attempt < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * (attempt + 1)));
    }
  }
  
  // Max retries reached
  onAccessDenied('ไม่สามารถเข้าถึงได้ กรุณาลองใหม่อีกครั้ง');
}

// ============================================================================
// Progress Update (with Access Preservation)
// ============================================================================

/**
 * Updates enrollment progress
 * 
 * Automatically includes access fields to preserve them during update
 * 
 * @param enrollmentId - The enrollment ID
 * @param progressData - Progress data to update
 */
export async function updateEnrollmentProgress(
  enrollmentId: string,
  progressData: {
    progress?: any[];
    overallProgress?: number;
    lastAccessedAt?: Date;
    completedAt?: Date;
  }
): Promise<void> {
  const enrollmentRef = doc(db, 'enrollments', enrollmentId);
  
  // Only allowed fields per Firestore rules
  const allowedUpdate = {
    ...progressData,
    updatedAt: new Date(),
  };
  
  await updateDoc(enrollmentRef, allowedUpdate);
}
