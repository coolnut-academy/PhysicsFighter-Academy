/**
 * Role Validation Utilities
 * 
 * These functions prevent unauthorized role elevation by enforcing
 * strict validation rules on role transitions.
 */

import { logger } from 'firebase-functions';

// Valid roles in the system
export const VALID_ROLES = ['super_admin', 'admin', 'student'] as const;
export type ValidRole = typeof VALID_ROLES[number];

// Role hierarchy (higher index = more privileges)
const ROLE_HIERARCHY: Record<ValidRole, number> = {
  student: 0,
  admin: 1,
  super_admin: 2,
};

// Who can assign what role
const ROLE_ASSIGNMENT_RULES: Record<ValidRole, ValidRole[]> = {
  // Only super_admin can create other super_admins
  super_admin: ['super_admin'],
  // super_admin can create admins
  admin: ['super_admin'],
  // Any authenticated user can create students (self-registration)
  student: ['super_admin', 'admin'],
};

/**
 * Validates if a role string is a valid system role
 */
export function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole);
}

/**
 * Compares two roles by hierarchy level
 * Returns: negative if roleA < roleB, 0 if equal, positive if roleA > roleB
 */
export function compareRoles(roleA: ValidRole, roleB: ValidRole): number {
  return ROLE_HIERARCHY[roleA] - ROLE_HIERARCHY[roleB];
}

/**
 * Checks if a role has higher or equal privileges than another
 */
export function hasHigherOrEqualRole(userRole: ValidRole, targetRole: ValidRole): boolean {
  return compareRoles(userRole, targetRole) >= 0;
}

/**
 * Validates a role transition
 * 
 * Security Rules:
 * 1. Role must be a valid system role
 * 2. For new users: caller must have permission to assign the target role
 * 3. For existing users: only super_admin can change roles
 * 4. Role elevation (increasing privileges) is restricted
 * 5. Self-demotion is allowed (but may require confirmation)
 * 
 * @param params - Validation parameters
 * @returns Validation result with error message if invalid
 */
export interface RoleValidationParams {
  /** The role being assigned/changed to */
  newRole: string;
  /** The previous role (null for new users) */
  previousRole: string | null;
  /** The role of the user making the change (null for self-registration) */
  callerRole: string | null;
  /** Whether this is a new user document */
  isNewUser: boolean;
  /** UID of the user being modified */
  targetUid: string;
  /** UID of the user making the change */
  callerUid: string | null;
}

export interface RoleValidationResult {
  valid: boolean;
  error?: string;
  code?: string;
}

export function validateRoleTransition(params: RoleValidationParams): RoleValidationResult {
  const { newRole, previousRole, callerRole, isNewUser, targetUid, callerUid } = params;

  // Rule 1: Validate new role is a valid system role
  if (!isValidRole(newRole)) {
    logger.warn('Invalid role attempted', { role: newRole, targetUid });
    return {
      valid: false,
      error: `Invalid role: ${newRole}. Must be one of: ${VALID_ROLES.join(', ')}`,
      code: 'INVALID_ROLE',
    };
  }

  // Rule 2: For self-registration (no caller), only 'student' role is allowed
  if (isNewUser && !callerUid) {
    if (newRole !== 'student') {
      logger.warn('Self-registration with non-student role attempted', { 
        role: newRole, 
        targetUid 
      });
      return {
        valid: false,
        error: 'Self-registration is only allowed for student role',
        code: 'SELF_REGISTRATION_RESTRICTED',
      };
    }
    return { valid: true };
  }

  // Rule 3: For new users created by admins
  if (isNewUser && callerRole) {
    if (!isValidRole(callerRole)) {
      logger.error('Caller has invalid role', { callerRole, callerUid });
      return {
        valid: false,
        error: 'Caller has invalid role',
        code: 'CALLER_INVALID_ROLE',
      };
    }

    const allowedAssigners = ROLE_ASSIGNMENT_RULES[newRole];
    if (!allowedAssigners.includes(callerRole)) {
      logger.warn('Unauthorized role assignment attempted', {
        callerRole,
        targetRole: newRole,
        callerUid,
        targetUid,
      });
      return {
        valid: false,
        error: `Role '${callerRole}' cannot assign role '${newRole}'`,
        code: 'UNAUTHORIZED_ASSIGNMENT',
      };
    }
    return { valid: true };
  }

  // Rule 4: For existing users - role changes
  if (!isNewUser && previousRole) {
    // If role is not changing, it's valid
    if (previousRole === newRole) {
      return { valid: true };
    }

    if (!isValidRole(previousRole)) {
      logger.warn('Previous role was invalid, allowing correction', { 
        previousRole, 
        newRole,
        targetUid 
      });
      // Allow fixing invalid roles - super_admin only
      if (callerRole !== 'super_admin') {
        return {
          valid: false,
          error: 'Only super_admin can fix invalid role states',
          code: 'INVALID_STATE_REQUIRES_SUPREME',
        };
      }
      return { valid: true };
    }

    if (!callerRole || !isValidRole(callerRole)) {
      logger.error('Role change attempted without valid caller role', {
        callerRole,
        callerUid,
        targetUid,
      });
      return {
        valid: false,
        error: 'Role changes require authenticated admin',
        code: 'AUTHENTICATION_REQUIRED',
      };
    }

    // Only super_admin can change roles (simpler security model)
    if (callerRole !== 'super_admin') {
      logger.warn('Non-super_admin attempted role change', {
        callerRole,
        previousRole,
        newRole,
        callerUid,
        targetUid,
      });
      return {
        valid: false,
        error: 'Only super_admin can change user roles',
        code: 'SUPER_ADMIN_REQUIRED',
      };
    }

    // super_admin can change any role to any other role
    // But log significant changes for audit
    if (previousRole !== newRole) {
      const isElevation = compareRoles(newRole, previousRole) > 0;
      logger.info('Role change authorized', {
        callerUid,
        targetUid,
        previousRole,
        newRole,
        isElevation,
        isSelfChange: callerUid === targetUid,
      });
    }

    return { valid: true };
  }

  // Fallback - should not reach here
  logger.error('Unexpected validation state', { params });
  return {
    valid: false,
    error: 'Unable to validate role transition',
    code: 'VALIDATION_ERROR',
  };
}

/**
 * Sanitizes and normalizes role strings
 */
export function normalizeRole(role: string): string {
  return role.toLowerCase().trim();
}
