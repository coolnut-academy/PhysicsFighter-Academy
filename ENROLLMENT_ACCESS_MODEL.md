# Deterministic Enrollment Access Model

> **Goal**: Single source of truth for course access, eliminating time-based logic duplication.

---

## Problem Statement

### Current State (Before)
Access logic duplicated across layers:

```javascript
// Frontend (Client time - unreliable)
const hasAccess = enrollment.status === 'active' && Date.now() < enrollment.expiresAt;

// Firestore Rules (Server time - authoritative but complex)
function isEnrollmentValid(data) {
  return data.status == 'active' && data.expiresAt.toMillis() > request.time.toMillis();
}
```

**Issues**:
1. **Clock drift**: Client clock may be wrong
2. **Timezones**: `Date.now()` is local, `request.time` is UTC
3. **Offline clients**: Stale data when coming back online
4. **Delayed functions**: Expiration may not happen exactly at `expiresAt`

---

## Solution: Computed Access Flag

### Schema Delta

**New Field** (additive, backward compatible):

```typescript
interface Enrollment {
  // ... existing fields ...
  
  /**
   * Computed access flag - THE SINGLE SOURCE OF TRUTH
   * 
   * TRUE when: status === 'active' AND server-time < expiresAt
   * FALSE when: status !== 'active' OR server-time >= expiresAt
   * 
   * Maintained exclusively by Cloud Functions.
   * Clients MUST NOT write this field.
   */
  accessGranted: boolean;
  
  /**
   * When access was last computed (for debugging/monitoring)
   */
  accessComputedAt?: Timestamp;
  
  /**
   * Reason for access denial (for debugging)
   */
  accessDenialReason?: 'expired' | 'cancelled' | 'completed' | 'payment_pending';
}
```

### Migration Strategy

**Existing enrollments**: Backfilled by scheduled function on first run.
**New enrollments**: Set by `onCreate` trigger.

---

## Cloud Functions

### 1. Enrollment Lifecycle Triggers

```typescript
// triggers/enrollmentLifecycle.ts

/**
 * onCreate: Set initial access state
 * - If status is 'active', set accessGranted = true
 * - Schedule expiration check at expiresAt
 */
export const onEnrollmentCreated = onDocumentCreated('enrollments/{enrollmentId}', ...);

/**
 * onUpdate: Handle status changes
 * - If status changes from 'active' → anything else: accessGranted = false
 * - If expiresAt extended: recalculate access
 */
export const onEnrollmentUpdated = onDocumentUpdate('enrollments/{enrollmentId}', ...);
```

### 2. Expiration Scheduler

```typescript
// scheduled/expiration.ts

/**
 * Runs every minute to expire enrollments
 * - Queries: expiresAt < now AND accessGranted == true
 * - Updates: accessGranted = false, status = 'expired'
 * - Idempotent: safe to run multiple times
 */
export const expireEnrollments = onSchedule('every 1 minutes', ...);
```

### 3. Access Validator (Callable)

```typescript
// callables/validateAccess.ts

/**
 * Forces immediate access check
 * - Used when student tries to access course
 * - Recalculates access based on current server time
 * - Returns: { granted: boolean, reason?: string, expiresAt?: Timestamp }
 */
export const validateEnrollmentAccess = onCall(...);
```

---

## Firestore Rules (Deterministic)

### Before (Complex)

```javascript
function isEnrollmentValid(data) {
  return data.status == 'active' 
    && data.expiresAt.toMillis() > request.time.toMillis();
}

match /enrollments/{enrollmentId} {
  allow read: if isSelf(resource.data.studentId) 
              || isOwner(resource.data.ownerId) 
              || isSuperAdmin();
  // ... complex write rules ...
}
```

### After (Simple)

```javascript
match /enrollments/{enrollmentId} {
  // Read: If you own it or are admin
  allow read: if isSelf(resource.data.studentId) 
              || isOwner(resource.data.ownerId) 
              || isSuperAdmin();
  
  // Course content access: ONLY if accessGranted is true
  // This is used by content security rules
  allow get: if (isSelf(resource.data.studentId) 
                || isOwner(resource.data.ownerId) 
                || isSuperAdmin())
              && resource.data.accessGranted == true;
  
  // Write: Protected fields only by functions
  allow update: if isSuperAdmin()
                || (isSelf(resource.data.studentId) 
                    && request.resource.data.diff(resource.data)
                      .affectedKeys()
                      .hasOnly(['progress', 'overallProgress', 'lastAccessedAt', 
                                'completedAt', 'updatedAt', 'accessGranted', 
                                'accessComputedAt', 'accessDenialReason']));
  
  // accessGranted can only be written by service account (functions)
  allow update: if request.auth.token.firebase.sign_in_provider == 'service_account'
                || resource.data.accessGranted == request.resource.data.accessGranted;
}
```

---

## Frontend Access Flow

### 1. Reading Enrollment (UI)

```typescript
// Simple check - no time logic!
function canAccessCourse(enrollment: Enrollment): boolean {
  return enrollment.accessGranted === true;
}

// Show expiration warning (informational only)
function getExpirationWarning(enrollment: Enrollment): string | null {
  if (!enrollment.accessGranted && enrollment.accessDenialReason === 'expired') {
    return 'Your enrollment has expired';
  }
  if (enrollment.expiresAt) {
    const daysLeft = differenceInDays(enrollment.expiresAt.toDate(), new Date());
    if (daysLeft <= 7 && daysLeft > 0) {
      return `Expires in ${daysLeft} days`;
    }
  }
  return null;
}
```

### 2. Accessing Course Content

```typescript
// When student clicks "Enter Course"
async function enterCourse(enrollmentId: string) {
  // 1. Read enrollment (Firestore rules check accessGranted)
  const enrollment = await getDoc(doc(db, 'enrollments', enrollmentId));
  
  if (!enrollment.data().accessGranted) {
    // 2. Force validation (in case of delayed expiration)
    const result = await validateEnrollmentAccess({ enrollmentId });
    
    if (!result.granted) {
      showAccessDenied(result.reason);
      return;
    }
    
    // 3. Retry read (should now have accessGranted = true)
    await new Promise(r => setTimeout(r, 500));
    const refreshed = await getDoc(doc(db, 'enrollments', enrollmentId));
    
    if (!refreshed.data().accessGranted) {
      showTemporaryError('Access being processed, please retry');
      return;
    }
  }
  
  // 4. Navigate to course
  router.push(`/learn/course/${enrollment.data().courseId}`);
}
```

### 3. Real-time Listener (Recommended)

```typescript
// Keep UI in sync with access changes
function useEnrollmentAccess(enrollmentId: string) {
  return useDocumentData(
    doc(db, 'enrollments', enrollmentId),
    {
      snapshotListenOptions: { includeMetadataChanges: true },
    }
  );
}

// Component automatically updates when accessGranted changes
function CourseAccessButton({ enrollmentId }) {
  const [enrollment] = useEnrollmentAccess(enrollmentId);
  
  if (!enrollment?.accessGranted) {
    return <Button disabled>Access Expired</Button>;
  }
  
  return <Button onClick={enterCourse}>Enter Course</Button>;
}
```

---

## Edge Cases

### EC-1: Timezones

**Issue**: Server in UTC, client in local timezone.

**Solution**:
- `expiresAt` stored as Timestamp (UTC)
- Comparison done in Cloud Function using server time (UTC)
- `accessGranted` is boolean - no timezone issues

```typescript
// Cloud Function (server time - authoritative)
const now = admin.firestore.Timestamp.now();
const accessGranted = enrollment.status === 'active' && enrollment.expiresAt > now;
```

### EC-2: Offline Clients

**Issue**: Client goes offline, enrollment expires, comes back online.

**Scenario**:
1. Student has active enrollment at 14:00
2. Student goes offline at 14:30
3. Enrollment expires at 15:00 (Cloud Function updates `accessGranted = false`)
4. Student comes online at 16:00 with stale data

**Solution**:
- Firestore offline cache shows stale `accessGranted = true`
- Student attempts to access content → Firestore rules check server-side
- Request denied (rules use server data, not cache)
- Client receives updated document with `accessGranted = false`
- UI updates to reflect expired access

**Code**:
```typescript
// Firestore rules handle this - server always wins
match /enrollments/{id} {
  allow get: if resource.data.accessGranted == true; // Server-side check
}
```

### EC-3: Delayed Function Execution

**Issue**: Scheduled function runs every minute, enrollment expires during gap.

**Scenario**:
1. Enrollment expires at 14:00:30
2. Function last ran at 14:00:00, next run at 14:01:00
3. Student tries to access at 14:00:45
4. `accessGranted` still `true` (not yet expired by function)

**Solution**: Dual-layer validation

```typescript
// Layer 1: Fast path (accessGranted flag)
if (!enrollment.accessGranted) {
  return denyAccess('expired');
}

// Layer 2: Authoritative check (server time)
const serverTime = await getServerTime(); // From Firestore
if (serverTime > enrollment.expiresAt) {
  // Trigger immediate expiration
  await triggerImmediateExpiration(enrollment.id);
  return denyAccess('expired');
}

// Layer 3: Content access (Firestore rules)
// Rules also check accessGranted, providing final enforcement
```

### EC-4: Clock Skew (Client Fast)

**Issue**: Client clock is 5 minutes fast, thinks enrollment expired early.

**Before**: Client shows "Expired" incorrectly.
**After**: Client shows `accessGranted` state (from server). If `true`, access is valid regardless of client clock.

```typescript
// Client (trusts server state)
const isExpired = !enrollment.accessGranted; // NOT: Date.now() > expiresAt
```

### EC-5: Clock Skew (Client Slow)

**Issue**: Client clock is 5 minutes slow, thinks enrollment valid when expired.

**Before**: Client shows "Active" incorrectly, Firestore rules block access.
**After**: Same behavior, but clearer UX. Client eventually syncs `accessGranted = false`.

### EC-6: Rapid Status Changes

**Issue**: Status changes multiple times quickly (race conditions).

**Solution**: Cloud Functions are transactional per document.

```typescript
// Each update triggers function, but Firestore serializes writes
// Final state will be consistent
onEnrollmentUpdated(event) {
  const { before, after } = event.data;
  
  // Only process if status actually changed
  if (before.status === after.status && before.expiresAt === after.expiresAt) {
    return; // No change, skip
  }
  
  // Recalculate access (idempotent)
  const accessGranted = calculateAccess(after);
  
  // Update (will trigger another update, but no status change = no action)
  after.ref.update({ accessGranted, accessComputedAt: now() });
}
```

### EC-7: Function Cold Start During Access

**Issue**: Student tries to access course immediately after enrollment creation.

**Scenario**:
1. Payment approved, enrollment created with `status = 'active'`
2. `onCreate` trigger starts but has cold start (3-5 seconds)
3. Student immediately clicks "Enter Course"
4. `accessGranted` field doesn't exist yet

**Solution**: Default handling

```typescript
// Firestore rules - treat missing as false (deny by default)
allow get: if resource.data.accessGranted == true;

// Or use hasAll for explicit check
allow get: if resource.data.keys().hasAll(['accessGranted']) 
            && resource.data.accessGranted == true;

// Client - wait for field to exist
if (enrollment.accessGranted === undefined) {
  return <Loading>Setting up access...</Loading>;
}
```

### EC-8: Mass Expiration Event

**Issue**: 10,000 enrollments expire at midnight on New Year's.

**Solution**: Batched processing with cursors.

```typescript
export const expireEnrollments = onSchedule('every 1 minutes', async () => {
  const BATCH_SIZE = 500; // Firestore limit
  
  let lastDoc = null;
  let hasMore = true;
  
  while (hasMore) {
    let query = db.collection('enrollments')
      .where('accessGranted', '==', true)
      .where('expiresAt', '<=', Timestamp.now())
      .limit(BATCH_SIZE);
    
    if (lastDoc) query = query.startAfter(lastDoc);
    
    const snapshot = await query.get();
    
    if (snapshot.empty) {
      hasMore = false;
      continue;
    }
    
    // Batch update
    const batch = db.batch();
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, {
        accessGranted: false,
        status: 'expired',
        accessDenialReason: 'expired',
        accessComputedAt: Timestamp.now(),
      });
    });
    
    await batch.commit();
    lastDoc = snapshot.docs[snapshot.docs.length - 1];
    
    // Continue if we hit batch limit
    hasMore = snapshot.docs.length === BATCH_SIZE;
  }
});
```

---

## Implementation Phases

### Phase 1: Deploy Functions (Non-breaking)

1. Deploy Cloud Functions (additive only)
2. Run backfill for existing enrollments
3. Monitor for errors

### Phase 2: Update Rules (Careful)

1. Deploy updated Firestore rules
2. Rules still support old access pattern as fallback
3. Monitor for denials

### Phase 3: Frontend Update (Gradual)

1. Update components to use `accessGranted`
2. Remove client-side time comparisons
3. Add real-time listeners

### Phase 4: Cleanup (Future)

1. Remove fallback logic from rules
2. Remove `isEnrollmentValid` function
3. Mark `status` + `expiresAt` checks as deprecated

---

## Monitoring

### Metrics

```typescript
// Track these in Cloud Monitoring
const metrics = {
  // Expiration lag
  expirationDelay: 'time between expiresAt and accessGranted=false',
  
  // Access denials
  accessDenials: 'count of accessGranted=false per reason',
  
  // Function performance
  expirationBatchSize: 'number of enrollments expired per run',
  
  // Client behavior
  validationCalls: 'how often validateEnrollmentAccess is called',
};
```

### Alerts

- Expiration delay > 2 minutes
- More than 1000 expirations per minute (capacity)
- Access validation failures > 5%

---

## Rollback Plan

If issues occur:

1. **Immediate**: Revert Firestore rules to previous version
2. **Short-term**: Disable scheduled function (stops auto-expiration)
3. **Long-term**: Manual status updates via admin panel

Previous rules continue working because they don't depend on `accessGranted`.

---

*Document Version: 1.0*  
*Created: February 2026*
