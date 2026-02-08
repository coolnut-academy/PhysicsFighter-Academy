/**
 * Firebase Cloud Functions - Physics Fighter Academy
 * 
 * Main entry point for all Cloud Functions.
 * 
 * DEPLOYMENT:
 * ```
 * cd functions
 * npm install
 * npm run build
 * firebase deploy --only functions
 * ```
 * 
 * LOCAL TESTING:
 * ```
 * cd functions
 * npm run build
 * firebase emulators:start --only functions,firestore
 * ```
 */

// Auth & Authorization
export { syncUserRoleToClaims, onUserDeleted } from './auth/triggers';
export { revokeTokensOnRoleChange, emergencyRevokeTokens } from './auth/tokenRevocation';

// Enrollment Access Management (Deterministic Model)
export {
  // Lifecycle triggers
  onEnrollmentCreated,
  onEnrollmentUpdated,
  onEnrollmentDeleted,
  // Scheduled expiration
  expireEnrollments,
} from './enrollments';

// Course Content V2 Migration (Lesson Architecture)
export {
  // Migration functions
  migrateCourseV2,
  batchMigrateCoursesV2,
  rollbackCourseV2,
  // Sync (Phase 1-2)
  syncFlatToNested,
} from './migrations/courseContentV2';

// Future exports for other function categories:
// export * from './payments/triggers';
// export * from './notifications/triggers';
// export * from './analytics/scheduled';

/**
 * DEPLOYMENT CHECKLIST:
 * 
 * [ ] Set Firebase project: firebase use <project-id>
 * [ ] Install dependencies: cd functions && npm install
 * [ ] Build TypeScript: npm run build
 * [ ] Set runtime environment variables if needed:
 *     firebase functions:config:set app.environment="production"
 * [ ] Deploy: firebase deploy --only functions
 * [ ] Verify deployment in Firebase Console > Functions
 * [ ] Test role change and verify claims sync
 * [ ] Set up monitoring alerts for function failures
 */

/**
 * SECURITY CONSIDERATIONS:
 * 
 * 1. Service Account Permissions:
 *    - Firebase Admin SDK Administrator (for Auth custom claims)
 *    - Cloud Datastore User (for Firestore triggers)
 *    - Cloud Functions Invoker (if using HTTP functions)
 * 
 * 2. VPC Connector (if accessing private resources)
 *    - Configure in firebase.json or GCP Console
 * 
 * 3. Environment Secrets:
 *    - Store sensitive values in Secret Manager
 *    - Reference in function config
 * 
 * 4. Rate Limiting:
 *    - Functions have built-in rate limiting
 *    - Consider maxInstances for cost control
 */
