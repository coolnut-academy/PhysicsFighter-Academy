# Firebase Auth Custom Claims - Security Pitfalls Checklist

> **Status**: Production Ready  
> **Last Updated**: February 2026  
> **System**: Physics Fighter Academy

---

## Table of Contents

1. [Critical Issues (P0)](#critical-issues-p0)
2. [High Priority (P1)](#high-priority-p1)
3. [Medium Priority (P2)](#medium-priority-p2)
4. [Low Priority (P3)](#low-priority-p3)
5. [Monitoring & Alerting](#monitoring--alerting)
6. [Incident Response](#incident-response)

---

## Critical Issues (P0)

### P0-1: Race Condition on Role Change

**Risk**: User changes role, makes API call before token refresh

**Attack Scenario**:
1. Admin A changes User B from `student` to `admin`
2. User B immediately (within milliseconds) makes admin API call
3. User B's token still has `student` claims
4. Firestore rules deny request (correct behavior)
5. But if rules had fallback, User B might get temporary access

**Mitigations Implemented**:
- ✅ Firestore rules check custom claims first (fast, consistent)
- ✅ Frontend forces token refresh after login
- ✅ Cloud Function reverts unauthorized role changes
- ✅ Audit fields track all role changes

**Verification**:
```bash
# Test: Change role and immediately try admin action
# Expected: Request denied, claims refreshed on next retry
```

---

### P0-2: Token Replay After Role Downgrade

**Risk**: Stolen token used after role downgrade

**Attack Scenario**:
1. Attacker steals User A's token (contains `admin` claims)
2. Admin revokes User A's admin access (changes to `student`)
3. Attacker uses stolen token within 1 hour (token lifetime)
4. Attacker maintains admin access until token expires

**Mitigations Implemented**:
- ✅ Firebase ID tokens expire after 1 hour by default
- ✅ Critical operations re-verify Firestore role (fallback)
- ✅ Claims include `roleSyncedAt` timestamp for backend validation
- ✅ Backend can reject tokens with stale `roleSyncedAt`

**Verification**:
```bash
# Test: Downgrade role, use old token
# Expected: Initial requests succeed (within 1 hour)
# Expected: Firestore fallback catches stale role for critical ops
```

---

### P0-3: Claims Size Limit Exceeded

**Risk**: Exceeding 1000 byte limit causes silent failures

**Attack Scenario**:
1. Developer adds more fields to custom claims
2. Claims exceed 1000 bytes for some users
3. `setCustomUserClaims()` fails silently or truncates
4. Authorization decisions based on partial/missing claims

**Mitigations Implemented**:
- ✅ Current claims size: ~100 bytes (well under limit)
- ✅ Cloud Function validates claims size before setting
- ✅ Claims structure documented with size estimates
- ✅ Version number for migration detection

**Verification**:
```typescript
// Monitor claims size
const claims = { role, roleSyncedAt, claimsVersion };
const size = JSON.stringify(claims).length;
console.assert(size < 500, 'Claims getting large');
```

---

### P0-4: Self-Registration Role Elevation

**Risk**: User registers with `admin` role

**Attack Scenario**:
1. Attacker modifies client code during registration
2. Attacker sends `role: 'admin'` in user document
3. Cloud Function validates and rejects (correct)
4. BUT if validation fails, unauthorized admin created

**Mitigations Implemented**:
- ✅ Firestore rules enforce `student` only for self-registration
- ✅ Cloud Function validates caller role for all role assignments
- ✅ Unauthorized role changes are reverted automatically
- ✅ Audit trail for all role modifications

**Verification**:
```bash
# Test: Attempt registration with role: 'admin'
# Expected: Firestore rule denies create operation
```

---

### P0-5: Claim Tampering (Client-Side)

**Risk**: Client modifies claims locally to bypass checks

**Attack Scenario**:
1. Attacker modifies JavaScript to change `token.role = 'admin'`
2. Attacker attempts Firestore operation
3. Firestore rejects because token is cryptographically signed

**Mitigations Implemented**:
- ✅ Firebase Auth tokens are JWTs with RSA signature
- ✅ Claims cannot be modified without Firebase private key
- ✅ Server-side verification in Cloud Functions
- ✅ No client-side security decisions based on claims alone

**Verification**:
```bash
# This attack is cryptographically impossible with proper JWT validation
```

---

## High Priority (P1)

### P1-1: Stale Permissions on Long Sessions

**Risk**: User keeps tab open for days, role changes, old token valid

**Attack Scenario**:
1. User A opens application on Monday
2. User A keeps tab open all week
3. Admin changes User A's role on Wednesday
4. User A's token (from Monday) still has old role
5. User A can perform old role actions until token refresh

**Mitigations Implemented**:
- ✅ TokenRoleGuard has periodic refresh (5 min default)
- ✅ Claims stale detection (24 hour max age warning)
- ✅ Critical operations force token refresh
- ✅ Firestore fallback for high-risk operations

**Code Implementation**:
```typescript
// Periodic refresh in TokenRoleGuard
startPeriodicRefresh('guard-key', 5 * 60 * 1000);
```

---

### P1-2: Functions-Only Write Bypass

**Risk**: Attacker bypasses Cloud Function, writes directly to Firestore

**Attack Scenario**:
1. Attacker discovers Firestore collection path
2. Attacker writes directly to `users/{uid}` to change role
3. Firestore rules should reject unauthorized writes

**Mitigations Implemented**:
- ✅ Firestore rules validate role changes require `super_admin`
- ✅ Audit fields protected from client modification
- ✅ Role validation in both Cloud Function AND Firestore rules
- ✅ Defense in depth: multiple validation layers

---

### P1-3: Role Change Notification Gap

**Risk**: Admin changes user's role, user doesn't know to refresh

**Attack Scenario**:
1. Admin changes User A from `student` to `admin`
2. User A is already logged in on another device
3. User A doesn't receive notification
4. User A continues with `student` permissions until next action

**Mitigations Implemented**:
- ✅ Periodic token refresh catches changes within 5 minutes
- ✅ Firestore real-time listener can detect role changes
- ✅ Next API call will trigger 403 → token refresh → retry

**Future Enhancement**:
```typescript
// Implement FCM notification for role changes
// Cloud Function sends push notification on role change
```

---

### P1-4: Cross-Device Session Desync

**Risk**: User has multiple sessions, role changes on one device

**Attack Scenario**:
1. User A logs in on Phone and Laptop
2. Admin changes User A's role on Laptop
3. Phone still has old token with old role
4. Phone can perform old role actions

**Mitigations Implemented**:
- ✅ Each device refreshes token independently
- ✅ Periodic refresh (5 min) limits desync window
- ✅ High-risk operations force fresh token

---

## Medium Priority (P2)

### P2-1: Claims Version Migration

**Risk**: Old token format incompatible with new code

**Attack Scenario**:
1. Deploy new code expecting `claimsVersion: 2`
2. User has token with `claimsVersion: 1`
3. Code rejects valid token as "invalid claims"
4. User locked out until token refresh

**Mitigations Implemented**:
- ✅ Firestore rules have fallback for missing/invalid claims
- ✅ Graceful degradation to Firestore role lookup
- ✅ Version validation allows unknown versions (future-proof)

---

### P2-2: Cloud Function Cold Start Delay

**Risk**: Claims sync delayed due to function cold start

**Attack Scenario**:
1. Admin changes user role
2. Cloud Function triggers but has cold start (5-10 seconds)
3. User immediately tries to use new permissions
4. Claims not yet synced, user gets 403

**Mitigations Implemented**:
- ✅ Frontend shows loading state during role changes
- ✅ Firestore rules fallback handles missing claims
- ✅ Min instances can be configured for production

---

### P2-3: Audit Log Tampering

**Risk**: Attacker modifies audit fields to hide tracks

**Attack Scenario**:
1. Attacker gains write access to user document
2. Attacker modifies `_claimsSyncedAt` to hide activity
3. Firestore rules should protect audit fields

**Mitigations Implemented**:
- ✅ Firestore rules enforce `auditFieldsUnchanged()`
- ✅ Audit fields can only be modified by Cloud Functions
- ✅ Separate Cloud Function logs in GCP

---

## Low Priority (P3)

### P3-1: Information Leakage via Claims

**Risk**: Claims expose internal role structure

**Observation**:
- Token contains `role` field visible in client
- Attacker can see their own role
- This is acceptable for this use case

**Mitigations**:
- ✅ No sensitive data in claims (only role, timestamps)
- ✅ Claims size minimized

### P3-2: Timing Attack on Role Check

**Risk**: Different response times reveal role existence

**Observation**:
- Claims check is fast for all roles
- No timing difference between "no role" and "wrong role"

**Status**: Not a concern for this implementation

---

## Monitoring & Alerting

### Metrics to Monitor

| Metric | Alert Threshold | Action |
|--------|----------------|--------|
| Cloud Function failures | > 5% error rate | Investigate claims sync issues |
| Claims validation errors | > 10/min | Check for attack or bug |
| Role change reverts | > 5/day | Review authorization logic |
| Stale claims usage | > 100/day | Review refresh interval |

### Alerts to Configure

```yaml
# Firebase Alerts (via Firebase Console)
alerts:
  - name: "Claims Sync Failure"
    condition: functions.syncUserRoleToClaims.error_rate > 0.01
    severity: critical
    
  - name: "Unauthorized Role Change"
    condition: firestore.users.update.rejected.role_change > 0
    severity: high
    
  - name: "Invalid Claims Detected"
    condition: auth.token.invalid_claims > 10
    severity: medium
```

---

## Incident Response

### Incident: Mass Role Elevation Attempt

**Detection**: Spike in Firestore rule rejections for role changes

**Response**:
1. Check Cloud Function logs for validation failures
2. Identify source IP/user if available
3. If attack confirmed:
   - Disable user accounts involved
   - Audit all role changes in last 24 hours
   - Force token refresh for all users
   - Review and patch any vulnerabilities

### Incident: Claims Sync Failure

**Detection**: Cloud Function errors or stale claims warnings

**Response**:
1. Check Firebase Functions dashboard
2. Verify service account permissions
3. If widespread failure:
   - Firestore rules fallback maintains security
   - Investigate root cause
   - Manual backfill may be needed

### Incident: Token Compromise

**Detection**: Unusual activity from user account

**Response**:
1. Immediately revoke user's refresh tokens
2. Force password reset
3. Audit all actions since suspected compromise
4. Review if role changes occurred

---

## Verification Checklist

Before production deployment, verify:

- [ ] Cloud Function deployed and tested
- [ ] Firestore rules deployed and tested
- [ ] Frontend token refresh implemented
- [ ] All role transitions tested
- [ ] Unauthorized role changes rejected
- [ ] Audit fields protected
- [ ] Monitoring alerts configured
- [ ] Incident response runbook ready
- [ ] Rollback plan documented

---

*This checklist is a living document. Update as threats evolve.*
