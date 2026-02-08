/**
 * Firebase Auth Token Refresh Utilities
 * 
 * This module provides utilities for:
 * - Forcing token refresh after role changes
 * - Reading custom claims from the ID token
 * - Detecting stale claims
 * 
 * SECURITY NOTE: Custom claims in the ID token are cryptographically signed
 * by Firebase and can be trusted. However, they may be stale (up to 1 hour
 * old by default). Use force refresh when you need guaranteed fresh claims.
 */

import { auth } from './config';

// ============================================================================
// Token Refresh
// ============================================================================

/**
 * Forces a token refresh to get the latest custom claims
 * 
 * @param force - If true, invalidates cache and fetches new token from server
 * @returns The fresh ID token string, or null if user not authenticated
 * 
 * @example
 * // After role change notification
 * await refreshToken(true);
 * 
 * @example
 * // Periodic refresh (background)
 * await refreshToken(false); // Uses cached token if not expired
 */
export async function refreshToken(force: boolean = false): Promise<string | null> {
  if (!auth?.currentUser) {
    return null;
  }

  try {
    const token = await auth.currentUser.getIdToken(force);
    return token;
  } catch (error) {
    console.error('[TokenRefresh] Failed to refresh token:', error);
    return null;
  }
}

/**
 * Gets the decoded token result including custom claims
 * 
 * @param force - Force refresh before getting token
 * @returns The token result with claims, or null
 */
export async function getTokenResult(force: boolean = false) {
  if (!auth?.currentUser) {
    return null;
  }

  try {
    const tokenResult = await auth.currentUser.getIdTokenResult(force);
    return tokenResult;
  } catch (error) {
    console.error('[TokenRefresh] Failed to get token result:', error);
    return null;
  }
}

// ============================================================================
// Claims Reading
// ============================================================================

/**
 * Custom claims structure from ID token
 */
export interface CustomClaims {
  role: 'super_admin' | 'admin' | 'student';
  roleSyncedAt: string;
  claimsVersion: number;
}

/**
 * Gets custom claims from the current ID token
 * 
 * @param force - Force refresh before reading
 * @returns The custom claims, or null if unavailable
 */
export async function getCustomClaims(force: boolean = false): Promise<CustomClaims | null> {
  const tokenResult = await getTokenResult(force);
  
  if (!tokenResult?.claims) {
    return null;
  }

  const claims = tokenResult.claims as Partial<CustomClaims>;

  // Validate claims structure
  if (!claims.role || !claims.roleSyncedAt || !claims.claimsVersion) {
    console.warn('[TokenRefresh] Invalid claims structure:', claims);
    return null;
  }

  return {
    role: claims.role as CustomClaims['role'],
    roleSyncedAt: claims.roleSyncedAt,
    claimsVersion: claims.claimsVersion,
  };
}

/**
 * Gets the role from the current token claims
 * 
 * @param force - Force refresh before reading
 * @returns The role, or null if unavailable
 */
export async function getRoleFromToken(force: boolean = false): Promise<CustomClaims['role'] | null> {
  const claims = await getCustomClaims(force);
  return claims?.role || null;
}

// ============================================================================
// Stale Detection
// ============================================================================

/** Default max age for claims before considered stale (24 hours in ms) */
const DEFAULT_CLAIMS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Checks if the current claims are stale
 * 
 * @param maxAgeMs - Maximum age in milliseconds (default: 24 hours)
 * @returns True if claims are stale or unavailable
 */
export async function areClaimsStale(maxAgeMs: number = DEFAULT_CLAIMS_MAX_AGE_MS): Promise<boolean> {
  const claims = await getCustomClaims(false);

  if (!claims?.roleSyncedAt) {
    return true;
  }

  const syncedAt = new Date(claims.roleSyncedAt).getTime();
  const now = Date.now();

  return now - syncedAt > maxAgeMs;
}

/**
 * Gets the time since last claims sync
 * 
 * @returns Time in milliseconds, or null if unavailable
 */
export async function getClaimsAge(): Promise<number | null> {
  const claims = await getCustomClaims(false);

  if (!claims?.roleSyncedAt) {
    return null;
  }

  const syncedAt = new Date(claims.roleSyncedAt).getTime();
  return Date.now() - syncedAt;
}

// ============================================================================
// Auth Headers for API Calls
// ============================================================================

/**
 * Gets authorization headers with fresh ID token
 * 
 * @param forceRefresh - Force token refresh
 * @returns Headers object with Authorization, or empty object if not authenticated
 */
export async function getAuthHeaders(forceRefresh: boolean = false): Promise<Record<string, string>> {
  const token = await refreshToken(forceRefresh);

  if (!token) {
    return {};
  }

  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Makes an authenticated fetch request with automatic token refresh on 403
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @returns The fetch response
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // First attempt with current token
  let headers = await getAuthHeaders(false);
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  // If 403 Forbidden, token claims might be stale - refresh and retry once
  if (response.status === 403 && auth?.currentUser) {
    console.log('[TokenRefresh] Got 403, refreshing token and retrying...');
    
    headers = await getAuthHeaders(true);
    
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });
  }

  return response;
}

// ============================================================================
// Periodic Refresh
// ============================================================================

/** Default interval for periodic refresh (5 minutes in ms) */
const DEFAULT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/** Active refresh intervals by key */
const activeIntervals = new Map<string, ReturnType<typeof setInterval>>();

/**
 * Starts periodic token refresh
 * 
 * @param key - Unique identifier for this refresh (to prevent duplicates)
 * @param intervalMs - Refresh interval in milliseconds
 * @returns Function to stop the periodic refresh
 * 
 * @example
 * // In a component
 * useEffect(() => {
 *   const stopRefresh = startPeriodicRefresh('dashboard', 5 * 60 * 1000);
 *   return stopRefresh;
 * }, []);
 */
export function startPeriodicRefresh(
  key: string,
  intervalMs: number = DEFAULT_REFRESH_INTERVAL_MS
): () => void {
  // Clear existing interval for this key
  stopPeriodicRefresh(key);

  // Start new interval
  const interval = setInterval(async () => {
    if (auth?.currentUser) {
      try {
        await auth.currentUser.getIdToken(true);
        console.log(`[TokenRefresh] Periodic refresh completed for ${key}`);
      } catch (error) {
        console.error(`[TokenRefresh] Periodic refresh failed for ${key}:`, error);
      }
    }
  }, intervalMs);

  activeIntervals.set(key, interval);

  // Return cleanup function
  return () => stopPeriodicRefresh(key);
}

/**
 * Stops periodic token refresh
 * 
 * @param key - The unique identifier used when starting
 */
export function stopPeriodicRefresh(key: string): void {
  const interval = activeIntervals.get(key);
  if (interval) {
    clearInterval(interval);
    activeIntervals.delete(key);
  }
}

/**
 * Stops all periodic refreshes
 */
export function stopAllPeriodicRefreshes(): void {
  activeIntervals.forEach((interval) => clearInterval(interval));
  activeIntervals.clear();
}
