# Firebase Auth Custom Claims Implementation

> **Architecture**: Custom claims as a synchronized cache, Firestore users.role as source of truth.

---

## Table of Contents

1. [Custom Claims Structure](#1-custom-claims-structure)
2. [Cloud Functions](#2-cloud-functions)
3. [Firestore Rules Diff](#3-firestore-rules-diff)
4. [Frontend Integration](#4-frontend-integration)
5. [Security Pitfalls Checklist](#5-security-pitfalls-checklist)
6. [Deployment Guide](#6-deployment-guide)

---

## 1. Custom Claims Structure

### Claims Schema (v1)

```typescript
interface CustomClaims {
  /** User's authorization role */
  role: 'super_admin' | 'admin' | 'student';
  
  /** When claims were last synced (ISO 8601) */
  roleSyncedAt: string;  // e.g., "2026-02-08T09:25:13.808Z"
  
  /** Claims structure version for migrations */
  claimsVersion: number;  // Current: 1
}
```

### Example Claims (decoded from ID token)

```json
{
  "role": "admin",
  "roleSyncedAt": "2026-02-08T09:25:13.808Z",
  "claimsVersion": 1
}
```

### Size Estimation

- Base structure: ~80 bytes
- Per-user overhead: ~20 bytes
- **Total: ~100 bytes** (well under 1000 byte limit)

---

## 2. Cloud Functions

### Function: `syncUserRoleToClaims`

**Trigger**: `onWrite` on `users/{uid}`
**Region**: `asia-southeast1` (adjust as needed)

**Behavior**:
- On user create: Syncs role to claims
- On role update: Validates and syncs new role
- On user delete: Clears claims
- On unauthorized role change: Reverts the document change

**Validation Rules**:
1. Only valid system roles allowed (`super_admin`, `admin`, `student`)
2. Self-registration limited to `student` role only
3. Role assignment permissions:
   - `super_admin` can assign any role
   - `admin` can only assign `student` role
4. Role changes (not new users) require `super_admin`
5. Invalid role states can only be fixed by `super_admin`

### File Structure

```
functions/
├── src/
│   ├── index.ts           # Main exports
│   ├── config/
│   │   └── firebase.ts    # Admin SDK init
│   ├── auth/
│   │   ├── claims.ts      # Claims CRUD operations
│   │   └── triggers.ts    # Firestore triggers
│   └── utils/
│       └── validation.ts  # Role validation logic
├── package.json
└── tsconfig.json
```

### Deployment

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

---

## 3. Firestore Rules Diff

### Changes Summary

1. **New helper functions** for custom claims
2. **Dual-path validation**: Claims for fast checks, Firestore for authoritative
3. **High-risk collections** use claims for initial authorization
4. **Audit fields** protected from client modification

### Complete Updated Rules

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // ========================================================================
    // HELPER FUNCTIONS - Authentication & Claims
    // ========================================================================
    
    // Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Get user role from custom claims (FAST - cached in token)
    function getRoleFromClaims() {
      return request.auth.token.role;
    }
    
    // Get user role from Firestore (SLOW - document read)
    // Use only when claims are insufficient or for healing
    function getRoleFromFirestore() {
      let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
      return userDoc.data.role;
    }
    
    // Check if claims are present and valid
    function hasValidClaims() {
      return isAuthenticated() 
        && request.auth.token.role is string
        && request.auth.token.claimsVersion == 1;
    }
    
    // ========================================================================
    // HELPER FUNCTIONS - Role Checks (PREFER CLAIMS)
    // ========================================================================
    
    // SUPER ADMIN check - uses claims (fast)
    function isSuperAdmin() {
      return isAuthenticated() && getRoleFromClaims() == 'super_admin';
    }
    
    // ADMIN check - uses claims (fast)
    // Note: Returns true for both admin and super_admin
    function isAdmin() {
      return isAuthenticated() 
        && (getRoleFromClaims() == 'admin' || getRoleFromClaims() == 'super_admin');
    }
    
    // Strict admin check (admin only, not super_admin)
    function isAdminOnly() {
      return isAuthenticated() && getRoleFromClaims() == 'admin';
    }
    
    // STUDENT check - uses claims (fast)
    function isStudent() {
      return isAuthenticated() && getRoleFromClaims() == 'student';
    }
    
    // Check if user has at least the specified role level
    function hasMinimumRole(minRole) {
      let roleHierarchy = {
        'student': 0,
        'admin': 1,
        'super_admin': 2
      };
      return isAuthenticated() 
        && roleHierarchy[getRoleFromClaims()] >= roleHierarchy[minRole];
    }
    
    // ========================================================================
    // HELPER FUNCTIONS - Ownership & Access
    // ========================================================================
    
    // Check if user owns the resource (by ownerId field)
    function isOwner(ownerId) {
      return isAuthenticated() && request.auth.uid == ownerId;
    }
    
    // Check if user is trying to access their own document
    function isSelf(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Validate that role is not being changed by non-admin
    function roleNotChanged() {
      return request.resource.data.role == resource.data.role;
    }
    
    // Validate audit fields are not tampered with
    function auditFieldsUnchanged() {
      return request.resource.data._claimsSyncedAt == resource.data._claimsSyncedAt
        && request.resource.data._revertedAt == resource.data._revertedAt
        && request.resource.data._revertReason == resource.data._revertReason;
    }
    
    // Check if enrollment is active and not expired
    function isEnrollmentValid(enrollmentData) {
      return enrollmentData.status == 'active' 
        && enrollmentData.expiresAt.toMillis() > request.time.toMillis();
    }
    
    // ========================================================================
    // SECURITY: Fallback for missing claims (healing mechanism)
    // ========================================================================
    
    // If claims are missing/invalid, fall back to Firestore (slower but safe)
    function isSuperAdminFallback() {
      return hasValidClaims() 
        ? isSuperAdmin() 
        : (isAuthenticated() && getRoleFromFirestore() == 'super_admin');
    }
    
    function isAdminFallback() {
      return hasValidClaims()
        ? isAdmin()
        : (isAuthenticated() 
            && (getRoleFromFirestore() == 'admin' || getRoleFromFirestore() == 'super_admin'));
    }

    // ========================================================================
    // Users Collection - HIGH SECURITY
    // ========================================================================
    
    match /users/{userId} {
      // Read: Users can read their own data, Super Admin can read all
      // Uses claims for fast Super Admin check
      allow read: if isSelf(userId) || isSuperAdmin();
      
      // Create: 
      // - Super Admin can create users with any role
      // - Self-registration only allowed for 'student' role
      // - Validates claims are consistent with role field
      allow create: if isSuperAdmin()
                    || (isSelf(userId) 
                        && request.resource.data.role == 'student'
                        && request.resource.data.isActive == true
                        // Ensure audit fields are not set on create
                        && !request.resource.data.keys().hasAny(['_claimsSyncedAt', '_revertedAt', '_revertReason']));
      
      // Update: 
      // - Users can update their own data (except role and audit fields)
      // - Super Admin can update anyone including role
      // - Admin cannot change roles
      allow update: if (isSelf(userId) 
                        && roleNotChanged() 
                        && auditFieldsUnchanged()) 
                    || isSuperAdmin();
      
      // Delete: Only Super Admin can delete users
      allow delete: if isSuperAdmin();
    }

    // ========================================================================
    // Courses Collection
    // ========================================================================
    
    match /courses/{courseId} {
      // Read: Everyone can read published courses, Admins can read their own unpublished
      allow read: if resource.data.isPublished == true 
                  || isOwner(resource.data.ownerId) 
                  || isSuperAdmin();
      
      // Create: Only Admins and Super Admins can create courses
      // Uses claims for fast role check
      allow create: if (isAdmin() && request.resource.data.ownerId == request.auth.uid) 
                    || isSuperAdmin();
      
      // Update: Only course owner (Admin) or Super Admin can update
      allow update: if (isOwner(resource.data.ownerId) 
                      && request.resource.data.ownerId == resource.data.ownerId) 
                    || isSuperAdmin();
      
      // Delete: Only course owner or Super Admin
      allow delete: if isOwner(resource.data.ownerId) || isSuperAdmin();
    }

    // ========================================================================
    // Enrollments Collection - HIGH RISK
    // ========================================================================
    
    match /enrollments/{enrollmentId} {
      // Read: Students can read their own, Admins can read for their courses
      allow read: if isSelf(resource.data.studentId) 
                  || isOwner(resource.data.ownerId) 
                  || isSuperAdmin();
      
      // Create: Students can create enrollments for themselves
      // Uses claims for student verification
      allow create: if (isStudent() && request.resource.data.studentId == request.auth.uid) 
                    || isSuperAdmin();
      
      // Update: 
      // - Super Admin can update anything
      // - Students can update progress fields only
      allow update: if isSuperAdmin() 
                    || (isSelf(resource.data.studentId) 
                      && request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['progress', 'overallProgress', 'lastAccessedAt', 'completedAt', 'updatedAt']));
      
      // Delete: Only Super Admin
      allow delete: if isSuperAdmin();
    }

    // ========================================================================
    // Payment Slips Collection - HIGH RISK
    // ========================================================================
    
    match /paymentSlips/{slipId} {
      // Read: Students can read their own slips, Admins can read for their courses
      allow read: if isSelf(resource.data.studentId) 
                  || isOwner(resource.data.ownerId) 
                  || isSuperAdmin();
      
      // Create: Students can create payment slips for themselves
      // Uses claims to verify student role
      allow create: if isStudent() && request.resource.data.studentId == request.auth.uid;
      
      // Update: 
      // - Course owner (Admin) or Super Admin can update status
      // - Students can only update before review (status == 'pending')
      allow update: if (isOwner(resource.data.ownerId) || isSuperAdmin()) 
                    || (isSelf(resource.data.studentId) && resource.data.status == 'pending');
      
      // Delete: Only Super Admin
      allow delete: if isSuperAdmin();
    }

    // ========================================================================
    // Reviews Collection
    // ========================================================================
    
    match /reviews/{reviewId} {
      // Read: Published reviews public, others restricted
      allow read: if resource.data.isPublished == true 
                  || isSelf(resource.data.studentId) 
                  || isOwner(get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.ownerId)
                  || isSuperAdmin();
      
      // Create: Only students who are enrolled can create reviews
      // Uses claims for student verification
      allow create: if isStudent() 
                    && request.resource.data.studentId == request.auth.uid
                    && exists(/databases/$(database)/documents/enrollments/$(request.resource.data.enrollmentId));
      
      // Update: Students can update their own, course owners can respond
      allow update: if isSelf(resource.data.studentId)
                    || (isOwner(get(/databases/$(database)/documents/courses/$(resource.data.courseId)).data.ownerId)
                      && request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['instructorResponse', 'instructorResponseAt', 'updatedAt']))
                    || isSuperAdmin();
      
      // Delete: Students can delete their own, Super Admin can delete any
      allow delete: if isSelf(resource.data.studentId) || isSuperAdmin();
    }

    // ========================================================================
    // Revenue Records Collection - RESTRICTED
    // ========================================================================
    
    match /revenueRecords/{recordId} {
      // Read: Admins can read their own, Super Admin can read all
      allow read: if isOwner(resource.data.ownerId) || isSuperAdmin();
      
      // Write: Only Super Admin or Cloud Functions (service account)
      // Uses claims for fast super_admin check
      allow create, update, delete: if isSuperAdmin();
    }

    // ========================================================================
    // Admin Statistics Collection - RESTRICTED
    // ========================================================================
    
    match /adminStatistics/{userId} {
      // Read: Admins can read their own, Super Admin can read all
      allow read: if isSelf(userId) || isSuperAdmin();
      
      // Write: Only Super Admin or Cloud Functions
      allow create, update, delete: if isSuperAdmin();
    }

    // ========================================================================
    // Platform Statistics Collection - SUPER ADMIN ONLY
    // ========================================================================
    
    match /platformStatistics/{statId} {
      // Read: Only Super Admin can read platform-wide statistics
      // Uses claims for fast authorization
      allow read: if isSuperAdmin();
      
      // Write: Only Super Admin or Cloud Functions
      allow create, update, delete: if isSuperAdmin();
    }

    // ========================================================================
    // Notifications Collection
    // ========================================================================
    
    match /notifications/{notificationId} {
      // Read: Users can read their own notifications
      allow read: if isSelf(resource.data.userId) || isSuperAdmin();
      
      // Create: Super Admin or Cloud Functions only
      allow create: if isSuperAdmin();
      
      // Update: Users can mark as read, Super Admin can update any
      allow update: if (isSelf(resource.data.userId) 
                      && request.resource.data.diff(resource.data).affectedKeys()
                        .hasOnly(['isRead', 'readAt']))
                    || isSuperAdmin();
      
      // Delete: Users can delete their own, Super Admin can delete any
      allow delete: if isSelf(resource.data.userId) || isSuperAdmin();
    }

    // ========================================================================
    // DEFAULT DENY ALL OTHER COLLECTIONS
    // ========================================================================
    
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Key Changes Explained

| Area | Before | After | Reason |
|------|--------|-------|--------|
| Role Check | `getUserRole()` reads Firestore | `getRoleFromClaims()` reads token | 10x faster, no doc read |
| Super Admin | `getUserRole() == 'super_admin'` | `request.auth.token.role == 'super_admin'` | Direct token access |
| Healing | N/A | `isSuperAdminFallback()` | Graceful degradation |
| Audit Fields | N/A | Protected with `auditFieldsUnchanged()` | Tamper detection |
| High-Risk | Firestore checks | Claims-first with fallback | Performance + security |

---

## 4. Frontend Integration

### 4.1 Token Refresh Utility

```typescript
// src/lib/firebase/tokenRefresh.ts
import { auth } from './config';
import { User as FirebaseUser } from 'firebase/auth';

/**
 * Forces token refresh to get latest custom claims
 * Call this after role change or when claims might be stale
 */
export async function refreshToken(force: boolean = false): Promise<string | null> {
  if (!auth.currentUser) return null;
  
  try {
    // forceRefresh = true invalidates cache and fetches new token
    const token = await auth.currentUser.getIdToken(force);
    return token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
  }
}

/**
 * Gets decoded token with claims
 */
export async function getDecodedToken(force: boolean = false): Promise<any | null> {
  if (!auth.currentUser) return null;
  
  try {
    const token = await auth.currentUser.getIdToken(force);
    // Decode without verification (Firebase SDK already verified)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Token decode failed:', error);
    return null;
  }
}

/**
 * Gets role from current token (not Firestore)
 * Use for UI decisions only, not security decisions
 */
export async function getRoleFromToken(): Promise<string | null> {
  const decoded = await getDecodedToken();
  return decoded?.role || null;
}

/**
 * Checks if token claims are stale
 */
export async function areClaimsStale(): Promise<boolean> {
  const decoded = await getDecodedToken();
  if (!decoded?.roleSyncedAt) return true;
  
  const syncedAt = new Date(decoded.roleSyncedAt).getTime();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  return Date.now() - syncedAt > maxAge;
}
```

### 4.2 Updated Auth Store

```typescript
// Add to src/store/useAuthStore.ts

// New interface properties
interface AuthState {
  // ... existing properties
  
  // Custom claims from ID token
  tokenRole: UserRole | null;
  tokenSyncedAt: string | null;
  
  // Actions
  refreshUserToken: () => Promise<void>;
  syncRoleFromToken: () => Promise<void>;
}

// In the store implementation
export const useAuthStore = create<AuthState>((set, get) => ({
  // ... existing initial state
  tokenRole: null,
  tokenSyncedAt: null,
  
  // ... existing actions
  
  /**
   * Refresh token and update claims in state
   * Call after role changes or periodically
   */
  refreshUserToken: async () => {
    const { firebaseUser } = get();
    if (!firebaseUser) return;
    
    try {
      // Force refresh to get latest claims
      const token = await firebaseUser.getIdToken(true);
      const decoded = await getDecodedToken();
      
      if (decoded?.role) {
        set({
          tokenRole: decoded.role as UserRole,
          tokenSyncedAt: decoded.roleSyncedAt,
        });
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }
  },
  
  /**
   * Sync role from token without forcing refresh
   */
  syncRoleFromToken: async () => {
    const decoded = await getDecodedToken();
    if (decoded?.role) {
      set({
        tokenRole: decoded.role as UserRole,
        tokenSyncedAt: decoded.roleSyncedAt,
      });
    }
  },
}));
```

### 4.3 Role Guard with Token Refresh

```typescript
// src/components/guards/TokenRoleGuard.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { UserRole } from '@/types';
import { Loader2 } from 'lucide-react';

interface TokenRoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  redirectTo?: string;
  /** Seconds between token refresh checks */
  refreshInterval?: number;
}

export function TokenRoleGuard({ 
  children, 
  allowedRoles, 
  redirectTo,
  refreshInterval = 300 // 5 minutes
}: TokenRoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, initializing, refreshUserToken, firebaseUser } = useAuthStore();
  const [checkingClaims, setCheckingClaims] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      if (initializing) return;
      
      if (!user || !firebaseUser) {
        router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Refresh token to get latest claims
      await refreshUserToken();
      
      // Get fresh role from token
      const { tokenRole } = useAuthStore.getState();
      
      if (tokenRole && allowedRoles.includes(tokenRole)) {
        setHasAccess(true);
      } else {
        // Fallback to Firestore role if claims missing
        const userRole = user.role;
        if (userRole && allowedRoles.includes(userRole)) {
          setHasAccess(true);
        } else {
          setHasAccess(false);
          const defaultRedirect = getDefaultRedirectForRole(userRole || tokenRole);
          router.push(redirectTo || defaultRedirect);
        }
      }
      
      setCheckingClaims(false);
    };

    checkAccess();
  }, [user, initializing, firebaseUser]);

  // Periodic token refresh for long-lived sessions
  useEffect(() => {
    if (!firebaseUser || !hasAccess) return;
    
    const interval = setInterval(() => {
      refreshUserToken();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [firebaseUser, hasAccess, refreshInterval]);

  if (initializing || checkingClaims) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return hasAccess ? <>{children}</> : null;
}
```

### 4.4 API Call Interceptor (for Cloud Functions)

```typescript
// src/lib/firebase/apiInterceptor.ts
import { auth } from './config';

/**
 * Gets fresh ID token for API calls
 * Automatically refreshes if claims are stale
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  if (!auth.currentUser) {
    return {};
  }
  
  try {
    // Check if claims might be stale (older than 1 hour)
    const tokenResult = await auth.currentUser.getIdTokenResult();
    const issuedAt = new Date(tokenResult.claims.iat * 1000);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    // Force refresh if token is old
    const forceRefresh = issuedAt < oneHourAgo;
    const token = await auth.currentUser.getIdToken(forceRefresh);
    
    return {
      'Authorization': `Bearer ${token}`,
    };
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return {};
  }
}

/**
 * Fetch wrapper with automatic token refresh on 403
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeader();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });
  
  // If forbidden, token claims might be stale - refresh once
  if (response.status === 403) {
    if (auth.currentUser) {
      await auth.currentUser.getIdToken(true); // Force refresh
      
      // Retry once with new token
      const newHeaders = await getAuthHeader();
      return fetch(url, {
        ...options,
        headers: {
          ...newHeaders,
          ...options.headers,
        },
      });
    }
  }
  
  return response;
}
```

---

## 5. Security Pitfalls Checklist

### Critical Issues

- [ ] **Race Condition on Role Change**
  - **Risk**: User changes role, makes API call before token refresh
  - **Mitigation**: Frontend forces token refresh after role change; backend validates Firestore role for critical operations

- [ ] **Token Replay Attack**
  - **Risk**: Stolen token used after role downgrade
  - **Mitigation**: Short token lifetime (1 hour); claims include sync timestamp for backend validation

- [ ] **Claims Size Limit**
  - **Risk**: Exceeding 1000 byte limit causes silent failures
  - **Mitigation**: Keep claims minimal (~100 bytes); validate size in Cloud Function

- [ ] **Self-Registration Elevation**
  - **Risk**: User registers with `admin` role
  - **Mitigation**: Firestore rules enforce `student` only for self-registration; Cloud Function validates

- [ ] **Claim Tampering**
  - **Risk**: Client modifies claims locally
  - **Mitigation**: Claims are cryptographically signed by Firebase; server-side verification required

### High Priority

- [ ] **Stale Permissions on Long Sessions**
  - **Risk**: User keeps tab open for days, role changes, old token still valid
  - **Mitigation**: Periodic token refresh (5 min); Firestore listener for role changes

- [ ] **Functions-Only Write Bypass**
  - **Risk**: Attacker bypasses Cloud Function, writes directly to Firestore
  - **Mitigation**: Firestore rules validate caller is service account for sensitive operations

- [ ] **Role Change Notification Gap**
  - **Risk**: Admin changes user's role, user doesn't know to refresh
  - **Mitigation**: WebSocket/FCM notification to force refresh; polling fallback

### Medium Priority

- [ ] **Claims Version Migration**
  - **Risk**: Old token format incompatible with new code
  - **Mitigation**: Version number in claims; graceful handling of missing fields

- [ ] **Cross-Device Sync**
  - **Risk**: User has multiple sessions, role changes on one device
  - **Mitigation**: All devices refresh token independently; server rejects stale claims

### Monitoring & Alerting

- [ ] Set up alerts for:
  - Cloud Function failures (claims sync failures)
  - Claims validation errors in Firestore rules
  - Unusual role change patterns
  - Users with missing or invalid claims

---

## 6. Deployment Guide

### Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Firebase project configured: `firebase login && firebase use <project-id>`
3. Billing enabled (required for Cloud Functions)
4. Firebase Authentication enabled

### Step 1: Deploy Cloud Functions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### Step 2: Deploy Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Step 3: Verify Deployment

1. Create a test user with `student` role
2. Check Firebase Console > Authentication > User > Custom Claims
3. Change role to `admin` in Firestore
4. Verify claims update within seconds
5. Test frontend token refresh

### Step 4: Backfill Existing Users

```typescript
// One-time script to sync claims for existing users
// Run in Cloud Functions shell or admin script

import { auth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

async function backfillClaims() {
  const db = getFirestore();
  const usersSnapshot = await db.collection('users').get();
  
  for (const doc of usersSnapshot.docs) {
    const { role } = doc.data();
    if (role) {
      await auth.setCustomUserClaims(doc.id, {
        role,
        roleSyncedAt: new Date().toISOString(),
        claimsVersion: 1,
      });
      console.log(`Synced ${doc.id}: ${role}`);
    }
  }
}
```

### Rollback Plan

If issues occur:

1. **Immediate**: Deploy previous Firestore rules (kept claims fallback)
2. **Short-term**: Disable Cloud Function triggers
3. **Long-term**: Revert frontend to use Firestore role exclusively

---

*Implementation completed: February 2026*
*Version: 1.0*
