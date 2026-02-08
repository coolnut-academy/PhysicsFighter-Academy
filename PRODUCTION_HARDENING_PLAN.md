# Production Hardening Plan

> **Status**: Ready for Implementation  
> **Scope**: Address CRITICAL/HIGH issues from audit  
> **Approach**: Incremental, additive-only, low-risk  
> **Timeline**: 30 days to "Safe to Scale"

---

## Executive Summary

### CRITICAL Issues (2)
| Issue | Fix Strategy | ETA |
|-------|--------------|-----|
| **S1: Token Replay** | Shorten token lifetime + session tracking | Day 1-3 |
| **P1: Missing Index** | Pre-deploy composite index | Day 0 |

### HIGH Issues Classification
- **Must-Fix Before Scale** (6 issues): Security bypass, race conditions, stale data
- **Acceptable with Monitoring** (6 issues): Performance, developer experience

### Key Deliverables
- Monitoring dashboard (Day 5)
- Reconciliation jobs (Day 10)
- Automated alerting (Day 7)
- Runbooks (Day 14)

---

## 1. CRITICAL Issues - Immediate Fixes

### CRITICAL-S1: Token Replay After Role Revocation

**Problem**: Revoked admin retains access for 60 minutes (token lifetime)

**Immediate Fix**: Reduce token lifetime + add critical action re-auth

#### Implementation (Day 1-3)

**Step 1: Shorten Token Lifetime** (Firebase Console - 30 minutes)

```javascript
// firebase.json (if using Admin SDK config)
// OR Firebase Console > Authentication > Settings > Token expiration
// Change from 3600 seconds (1 hour) to 1800 seconds (30 minutes)
```

**Step 2: Critical Action Re-authentication**

```typescript
// src/lib/auth/criticalActions.ts

import { auth } from '@/lib/firebase/config';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const CRITICAL_ACTIONS = [
  'delete_course',
  'change_user_role', 
  'refund_payment',
  'delete_user_account',
  'modify_enrollment_access',
];

/**
 * Require re-auth for critical actions
 * Call this before performing high-risk operations
 */
export async function requireCriticalAuth(
  action: string,
  password: string
): Promise<boolean> {
  if (!CRITICAL_ACTIONS.includes(action)) {
    return true; // Not critical
  }

  const user = auth.currentUser;
  if (!user) return false;

  try {
    const credential = EmailAuthProvider.credential(
      user.email!,
      password
    );
    await reauthenticateWithCredential(user, credential);
    
    // Log critical action
    await logCriticalAction(user.uid, action);
    
    return true;
  } catch (error) {
    console.error('Critical auth failed:', error);
    return false;
  }
}

async function logCriticalAction(userId: string, action: string) {
  await fetch('/api/log-critical-action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, action, timestamp: Date.now() }),
  });
}
```

**Step 3: Force Token Refresh on Role Change** (Cloud Function)

```typescript
// functions/src/auth/sessionManager.ts

import { onDocumentUpdate } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';
import { logger } from 'firebase-functions';

/**
 * When role changes, force token refresh by revoking refresh tokens
 * This forces user to re-login within 1 hour (current token expires)
 * but prevents indefinite access
 */
export const onRoleChangedRevokeTokens = onDocumentUpdate(
  {
    document: 'users/{userId}',
    region: 'asia-southeast1',
  },
  async (event) => {
    const before = event.data?.before?.data();
    const after = event.data?.after?.data();
    
    if (before?.role === after?.role) {
      return; // No role change
    }
    
    const userId = event.params.userId;
    const oldRole = before?.role;
    const newRole = after?.role;
    
    logger.info('Role changed, revoking tokens', {
      userId,
      oldRole,
      newRole,
    });
    
    try {
      // Revoke all refresh tokens for user
      // Current ID token still valid until expiration (now 30 min max)
      // But user can't get new tokens after that
      await getAuth().revokeRefreshTokens(userId);
      
      // Update user document to track revocation
      await event.data?.after?.ref.update({
        tokensRevokedAt: new Date().toISOString(),
        previousRole: oldRole,
      });
      
      logger.info('Tokens revoked successfully', { userId });
    } catch (error: any) {
      logger.error('Failed to revoke tokens', { userId, error: error.message });
      // Don't throw - we don't want to block the role change
    }
  }
);
```

**Rollout Strategy**:
1. **Day 1**: Deploy `onRoleChangedRevokeTokens` function
2. **Day 2**: Deploy critical auth UI changes
3. **Day 3**: Change token lifetime in Firebase Console (off-peak)
4. **Monitor**: Watch for login spikes after token lifetime change

**Rollback Strategy**:
```bash
# If issues arise, revert token lifetime immediately
# Firebase Console > Authentication > Settings
# Change back to 3600 seconds

# Function can be disabled without affecting existing sessions
firebase functions:delete onRoleChangedRevokeTokens
```

---

### CRITICAL-P1: Missing Composite Index

**Problem**: Expiration query fails without index

**Immediate Fix**: Pre-create index before any deployment

#### Implementation (Day 0 - Before any code deploy)

**firestore.indexes.json**:

```json
{
  "indexes": [
    {
      "collectionGroup": "enrollments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "accessGranted", "order": "ASCENDING" },
        { "fieldPath": "expiresAt", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "courseModules",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "courseLessons",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "moduleId", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "courseLessons",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "courseId", "order": "ASCENDING" },
        { "fieldPath": "order", "order": "ASCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

**Deployment**:
```bash
# Deploy indexes FIRST (takes 5-30 minutes to build)
firebase deploy --only firestore:indexes

# Wait for indexes to be ready
firebase firestore:indexes --check-ready

# Then deploy functions
firebase deploy --only functions
```

**Verification**:
```bash
# Test query in Firebase Console
# Go to Firestore > enrollments > Create composite query:
# accessGranted == true AND expiresAt <= now
```

---

## 2. HIGH Issues - Classification & Fixes

### Must-Fix Before Scale (6 issues)

| Issue | Problem | Fix Strategy | ETA |
|-------|---------|--------------|-----|
| **S2** | accessGranted bypassable | Add explicit function-only validation | Day 4-5 |
| **S3** | Claims sync not monitored | Add Cloud Monitoring alerts | Day 5-6 |
| **S4** | Race on enrollment creation | Optimistic access + client polling | Day 7-8 |
| **D2** | Stale accessGranted | Hourly reconciliation job | Day 9-10 |
| **D3** | Role drift | Daily claims/Firestore audit | Day 11-12 |
| **O1** | No migration rollback | Add migration checkpointing | Day 13-15 |

### Acceptable with Monitoring (6 issues)

| Issue | Problem | Monitoring | Alert Threshold |
|-------|---------|------------|-----------------|
| **P2** | N+1 queries | Track query count per course load | >50 reads/session |
| **P3** | Expensive rules | Track Firestore read count | >200 reads/user/day |
| **SC1** | Hot document | Track systemMetrics writes | >10 conflicts/hour |
| **DE1** | Complex dual-read | Track format mismatch errors | >5 errors/day |
| **O4** | No access debug | Log all access denials | Log all denials |
| **PR2** | Payment race | Track enrollment without accessGranted | >10 min delay |

---

## 3. Monitoring & Alerting

### 3.1 Claims Sync Monitoring

**Cloud Function**:

```typescript
// functions/src/monitoring/claimsSync.ts

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const db = getFirestore();

/**
 * Daily audit: Compare Firestore roles with Auth claims
 */
export const auditClaimsSync = onSchedule(
  {
    schedule: '0 2 * * *', // Daily at 2 AM
    region: 'asia-southeast1',
    memory: '256MiB',
  },
  async (event) => {
    const mismatches: any[] = [];
    let checked = 0;
    
    // Get all users (paginated)
    let nextPageToken: string | undefined;
    
    do {
      const listResult = await getAuth().listUsers(1000, nextPageToken);
      nextPageToken = listResult.pageToken;
      
      for (const user of listResult.users) {
        checked++;
        const claimsRole = user.customClaims?.role;
        
        // Get Firestore role
        const userDoc = await db.collection('users').doc(user.uid).get();
        const firestoreRole = userDoc.data()?.role;
        
        if (claimsRole !== firestoreRole) {
          mismatches.push({
            uid: user.uid,
            email: user.email,
            claimsRole,
            firestoreRole,
          });
        }
      }
    } while (nextPageToken);
    
    // Store results
    await db.collection('auditLogs').doc(`claims-${Date.now()}`).set({
      timestamp: new Date().toISOString(),
      checked,
      mismatches,
      mismatchCount: mismatches.length,
    });
    
    // Alert if mismatches found
    if (mismatches.length > 0) {
      logger.error('Claims/Firestore mismatches detected', {
        count: mismatches.length,
        sample: mismatches.slice(0, 5),
      });
      
      // Send alert (implement based on your notification system)
      await sendAlert(`Claims sync issues: ${mismatches.length} mismatches`);
    }
    
    logger.info('Claims audit complete', { checked, mismatches: mismatches.length });
  }
);

async function sendAlert(message: string) {
  // Implement with your alerting system (PagerDuty, Slack, email)
  // Example: Slack webhook
  const webhookUrl = process.env.SLACK_ALERT_WEBHOOK;
  if (webhookUrl) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `🚨 ${message}` }),
    });
  }
}
```

**Alert Conditions**:
- Mismatches > 0: P1 alert (immediate)
- Audit fails to run: P2 alert (within 1 hour)

---

### 3.2 Failed Function Monitoring

**Cloud Monitoring Setup**:

```yaml
# monitoring/alert-policies.yaml

alerting_policies:
  - display_name: "Cloud Function Failures"
    conditions:
      - display_name: "Error rate > 5%"
        filter: >
          resource.type="cloud_function"
          AND metric.type="cloudfunctions.googleapis.com/function/execution_count"
          AND metric.labels.status!="ok"
        comparison: COMPARISON_GT
        threshold: 0.05
        duration: 300s
    notification_channels:
      - slack-alerts
      - pagerduty-primary

  - display_name: "Claims Sync Failures"
    conditions:
      - display_name: "syncUserRoleToClaims errors"
        filter: >
          resource.type="cloud_function"
          AND resource.labels.function_name="syncUserRoleToClaims"
          AND metric.type="cloudfunctions.googleapis.com/function/execution_count"
          AND metric.labels.status!="ok"
        comparison: COMPARISON_GT
        threshold: 1
        duration: 60s
    notification_channels:
      - slack-alerts
```

**Deployment**:
```bash
# Deploy monitoring configuration
gcloud alpha monitoring policies create --policy-from-file=monitoring/alert-policies.yaml
```

---

### 3.3 Access Denial Logging

**Firestore Rules Update** (additive, safe):

```javascript
// Add to firestore.rules - log all denials

function logAccessDenied(collection, reason) {
  // Firestore rules can't write, but we can structure error messages
  // Client will log these
  return {
    error: `Access denied to ${collection}: ${reason}`,
    timestamp: request.time,
    uid: request.auth?.uid,
  };
}

// In lesson read rule:
allow read: if (
  canAccessLesson(resource.data)
) || (
  // Deny with specific reason for logging
  !canAccessLesson(resource.data) && 
  logAccessDenied('courseLessons', 'no_enrollment_or_preview')["error"] != null
);
```

**Client Logging**:

```typescript
// src/lib/firebase/errorHandler.ts

import { getFirestore, FirestoreError } from 'firebase/firestore';

export function handleFirestoreError(error: FirestoreError, context: string) {
  if (error.code === 'permission-denied') {
    // Log to analytics
    logEvent('access_denied', {
      context,
      uid: auth.currentUser?.uid,
      timestamp: Date.now(),
    });
    
    // Send to error tracking
    console.error('Firestore permission denied', {
      context,
      message: error.message,
      stack: error.stack,
    });
  }
}
```

---

## 4. Reconciliation Jobs

### 4.1 Hourly accessGranted Reconciliation

```typescript
// functions/src/reconciliation/enrollmentAccess.ts

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import { calculateAccess } from '../enrollments/access';

const db = getFirestore();

/**
 * Hourly reconciliation: Fix stale accessGranted values
 */
export const reconcileEnrollmentAccess = onSchedule(
  {
    schedule: '0 * * * *', // Every hour
    region: 'asia-southeast1',
    memory: '512MiB',
    timeoutSeconds: 300,
  },
  async (event) => {
    const stats = {
      checked: 0,
      fixed: 0,
      errors: 0,
    };
    
    // Query enrollments that might need fixing
    // 1. accessGranted=true but expiresAt in past
    // 2. accessGranted=false but expiresAt in future and status=active
    const now = Timestamp.now();
    
    // Case 1: Should be expired
    const expiredQuery = await db.collection('enrollments')
      .where('accessGranted', '==', true)
      .where('expiresAt', '<=', now)
      .limit(500)
      .get();
    
    for (const doc of expiredQuery.docs) {
      stats.checked++;
      try {
        const calculation = calculateAccess(doc.data(), now);
        if (!calculation.granted) {
          await doc.ref.update({
            accessGranted: false,
            accessComputedAt: now,
            accessDenialReason: calculation.reason,
            ...(calculation.reason === 'expired' ? { status: 'expired' } : {}),
          });
          stats.fixed++;
        }
      } catch (error) {
        stats.errors++;
        logger.error('Failed to fix enrollment', { id: doc.id, error });
      }
    }
    
    // Case 2: Should be granted but isn't
    const shouldBeActive = await db.collection('enrollments')
      .where('accessGranted', '==', false)
      .where('status', '==', 'active')
      .where('expiresAt', '>', now)
      .limit(500)
      .get();
    
    for (const doc of shouldBeActive.docs) {
      stats.checked++;
      try {
        const calculation = calculateAccess(doc.data(), now);
        if (calculation.granted) {
          await doc.ref.update({
            accessGranted: true,
            accessComputedAt: now,
            accessDenialReason: null,
          });
          stats.fixed++;
        }
      } catch (error) {
        stats.errors++;
        logger.error('Failed to fix enrollment', { id: doc.id, error });
      }
    }
    
    // Log results
    logger.info('Reconciliation complete', stats);
    
    // Store metrics
    await db.collection('systemMetrics').doc('reconciliation').set({
      type: 'enrollmentAccess',
      timestamp: now,
      ...stats,
    }, { merge: true });
    
    // Alert if too many fixes needed (indicates function issues)
    if (stats.fixed > 100) {
      await sendAlert(`High reconciliation fixes: ${stats.fixed} enrollments corrected`);
    }
  }
);
```

---

### 4.2 Daily Aggregate Count Reconciliation

```typescript
// functions/src/reconciliation/aggregateCounts.ts

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

const db = getFirestore();

/**
 * Daily: Fix divergent aggregate counts
 */
export const reconcileAggregateCounts = onSchedule(
  {
    schedule: '0 3 * * *', // Daily at 3 AM
    region: 'asia-southeast1',
    memory: '512MiB',
  },
  async (event) => {
    const courses = await db.collection('courses').listDocuments();
    
    for (const courseRef of courses) {
      try {
        // Count actual modules
        const modulesSnap = await db.collection('courseModules')
          .where('courseId', '==', courseRef.id)
          .count()
          .get();
        
        const actualModules = modulesSnap.data().count;
        
        // Count actual lessons
        const lessonsSnap = await db.collection('courseLessons')
          .where('courseId', '==', courseRef.id)
          .count()
          .get();
        
        const actualLessons = lessonsSnap.data().count;
        
        // Get current course data
        const course = await courseRef.get();
        const courseData = course.data();
        
        if (!courseData) continue;
        
        const storedModules = courseData.modulesCount || 0;
        const storedLessons = courseData.lessonsCount || 0;
        
        // Fix if diverged
        if (storedModules !== actualModules || storedLessons !== actualLessons) {
          logger.warn('Course counts diverged, fixing', {
            courseId: courseRef.id,
            storedModules,
            actualModules,
            storedLessons,
            actualLessons,
          });
          
          await courseRef.update({
            modulesCount: actualModules,
            lessonsCount: actualLessons,
          });
        }
      } catch (error) {
        logger.error('Failed to reconcile course', { courseId: courseRef.id, error });
      }
    }
    
    logger.info('Aggregate count reconciliation complete');
  }
);
```

---

## 5. 30-Day Hardening Roadmap

### Week 1: Critical Fixes (Days 1-7)

| Day | Task | Owner | Verification |
|-----|------|-------|--------------|
| 0 | Deploy Firestore indexes | DevOps | Query test passes |
| 1 | Deploy `onRoleChangedRevokeTokens` | Backend | Token revocation test |
| 2 | Implement critical auth UI | Frontend | Re-auth flow test |
| 3 | Change token lifetime to 30min | DevOps | Monitor login rate |
| 4 | Add function-only validation for accessGranted | Backend | Bypass attempt test |
| 5 | Deploy monitoring dashboard | DevOps | Dashboard visible |
| 6 | Set up Cloud Monitoring alerts | DevOps | Test alert firing |
| 7 | **Checkpoint**: Critical issues resolved | Team | Load test passed |

### Week 2: Race Conditions & Stale Data (Days 8-14)

| Day | Task | Owner | Verification |
|-----|------|-------|--------------|
| 8 | Implement optimistic accessGranted | Backend | Creation flow test |
| 9 | Add client polling for access | Frontend | E2E test |
| 10 | Deploy hourly reconciliation | Backend | Manual run successful |
| 11 | Deploy daily claims audit | Backend | Audit log visible |
| 12 | Add role drift alerting | DevOps | Alert test |
| 13 | Implement migration checkpointing | Backend | Rollback test |
| 14 | **Checkpoint**: HIGH issues addressed | Team | Integration tests pass |

### Week 3: Monitoring & Observability (Days 15-21)

| Day | Task | Owner | Verification |
|-----|------|-------|--------------|
| 15 | Deploy aggregate count reconciliation | Backend | Counts match |
| 16 | Implement access denial logging | Frontend | Logs visible |
| 17 | Create support debug dashboard | Frontend | Support team trained |
| 18 | Add cost monitoring alerts | DevOps | Budget alert set |
| 19 | Document runbooks | Tech Lead | Team review |
| 20 | Load test at 10x expected traffic | QA | No degradation |
| 21 | **Checkpoint**: Monitoring complete | Team | All dashboards green |

### Week 4: Validation & Documentation (Days 22-30)

| Day | Task | Owner | Verification |
|-----|------|-------|--------------|
| 22 | Penetration test on auth flows | Security | No critical findings |
| 23 | Chaos test: function failures | QA | System degrades gracefully |
| 24 | Disaster recovery drill | DevOps | RTO < 1 hour |
| 25 | Performance test | QA | P95 < 500ms |
| 26 | Security review | Security | All HIGH+ fixed |
| 27 | Final "Safe to Scale" checklist | Tech Lead | All items checked |
| 28 | Team training on runbooks | Tech Lead | Quiz passed |
| 29 | Production deployment | DevOps | Monitor 24h |
| 30 | **SAFE TO SCALE** declaration | Team | Go/No-go meeting |

---

## 6. "Safe to Scale" Checklist

### Security (All must pass)

- [ ] Token lifetime ≤ 30 minutes
- [ ] `onRoleChangedRevokeTokens` deployed and tested
- [ ] Critical actions require re-authentication
- [ ] `accessGranted` can only be modified by Cloud Functions
- [ ] All Firestore indexes deployed and ready
- [ ] No security rule allows client modification of access fields
- [ ] Session invalidation tested and documented

### Data Consistency (All must pass)

- [ ] Hourly reconciliation job running successfully
- [ ] Daily claims/Firestore audit running
- [ ] No mismatches in last 24 hours (or < 0.01%)
- [ ] Reconciliation fixes < 10 per hour
- [ ] Migration checkpointing implemented
- [ ] Aggregate counts match actual counts

### Monitoring (All must pass)

- [ ] Cloud Monitoring alerts configured
- [ ] Slack/PagerDuty integration working
- [ ] Claims sync failure alert tested
- [ ] Function error rate alert tested
- [ ] Access denial logging visible
- [ ] Cost monitoring alert configured
- [ ] Support dashboard deployed

### Performance (All must pass)

- [ ] Course load time P95 < 2 seconds (with cache)
- [ ] Enrollment check time P95 < 200ms
- [ ] Firestore reads per user session < 100
- [ ] Cloud Function cold start < 3 seconds
- [ ] Query performance index usage verified

### Operational Readiness (All must pass)

- [ ] Runbooks for all failure scenarios
- [ ] On-call rotation defined
- [ ] Rollback procedures tested
- [ ] Database backup verified
- [ ] Disaster recovery tested
- [ ] Team trained on monitoring tools
- [ ] Escalation paths documented

### Load Testing (All must pass)

- [ ] 1000 concurrent users tested
- [ ] 10,000 enrollments expiration tested
- [ ] Migration of 100 courses tested
- [ ] Failover scenario tested
- [ ] Cost projection approved

---

## Runbook: Emergency Procedures

### RB1: Claims Sync Failure

**Symptoms**: Users report permission errors despite correct roles

**Steps**:
1. Check Cloud Functions logs for `syncUserRoleToClaims` errors
2. Run manual claims audit: `npx ts-node scripts/audit-claims.ts`
3. If >10 mismatches, trigger emergency sync: `npx ts-node scripts/resync-all-claims.ts`
4. Escalate if >100 mismatches

**Rollback**: Disable claims checks in rules (fallback to Firestore)

---

### RB2: Mass Enrollment Access Issues

**Symptoms**: Many students report "Access Denied" incorrectly

**Steps**:
1. Check `expireEnrollments` function status
2. Run manual reconciliation: `firebase functions:shell > reconcileEnrollmentAccess()`
3. Check for recent `expiresAt` modifications
4. If function stuck, restart and increase memory

**Rollback**: Temporarily disable expiration, manual cleanup

---

### RB3: Migration Failure

**Symptoms**: Course shows partial content or missing lessons

**Steps**:
1. Check course `contentFormat` field
2. If 'migrating', run rollback: `firebase functions:shell > rollbackCourseV2({courseId: '...'})`
3. Verify nested structure intact
4. Retry migration with dry-run first

**Rollback**: Always possible to revert to 'nested'

---

## Cost Projection

| Component | Before | After | Increase |
|-----------|--------|-------|----------|
| Firestore reads | ~$50/mo | ~$150/mo | +$100 |
| Cloud Functions | ~$30/mo | ~$100/mo | +$70 |
| Cloud Monitoring | $0 | ~$20/mo | +$20 |
| **Total** | **$80/mo** | **$270/mo** | **+$190** |

*Based on 10K MAU, scales linearly*

---

*Hardening Plan Version: 1.0*  
*Ready for Implementation: February 2026*
