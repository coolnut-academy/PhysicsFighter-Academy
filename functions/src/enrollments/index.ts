/**
 * Enrollment Module Exports
 * 
 * This module provides the deterministic enrollment access model.
 * 
 * Usage:
 * ```typescript
 * import { onEnrollmentCreated, onEnrollmentUpdated } from './enrollments';
 * import { expireEnrollments } from './enrollments';
 * ```
 */

// Triggers
export { 
  onEnrollmentCreated, 
  onEnrollmentUpdated, 
  onEnrollmentDeleted,
  backfillEnrollmentAccess 
} from './triggers';

// Scheduled
export { expireEnrollments } from './scheduled';

// Utilities (for use in other functions)
export { 
  calculateAccess, 
  shouldExpire, 
  getTimeRemaining,
  isExpiringSoon,
  calculateBatchAccess,
  type EnrollmentData,
  type AccessCalculation,
  type EnrollmentStatus,
  type AccessDenialReason
} from './access';
