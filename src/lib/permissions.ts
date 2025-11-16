/**
 * Permission Management System
 *
 * Provides utilities for role-based and resource-level permission management.
 * Supports hierarchical roles and granular permissions.
 *
 * @module lib/permissions
 */

import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { permission, rolePermission } from '@/db/schema';

/**
 * User role hierarchy (lower index = higher privileges)
 */
const ROLE_HIERARCHY = [
  'admin',
  'moderator',
  'editor',
  'member',
  'viewer',
] as const;

/**
 * Standard permissions definition
 */
export const PERMISSIONS = {
  // User management
  USERS_READ: 'users:read',
  USERS_WRITE: 'users:write',
  USERS_DELETE: 'users:delete',

  // Billing
  BILLING_READ: 'billing:read',
  BILLING_MANAGE: 'billing:manage',

  // Admin
  ADMIN_ACCESS: 'admin:access',

  // Audit
  AUDIT_VIEW: 'audit:view',

  // Content moderation
  CONTENT_MODERATE: 'content:moderate',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_WRITE: 'settings:write',

  // API Keys
  API_KEYS_READ: 'api_keys:read',
  API_KEYS_WRITE: 'api_keys:write',
} as const;

/**
 * Default role-permission mappings
 */
export const DEFAULT_ROLE_PERMISSIONS = {
  viewer: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.API_KEYS_READ,
  ],
  member: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
  ],
  editor: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
  ],
  moderator: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_WRITE,
    PERMISSIONS.USERS_DELETE,
    PERMISSIONS.BILLING_READ,
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_WRITE,
    PERMISSIONS.API_KEYS_READ,
    PERMISSIONS.API_KEYS_WRITE,
  ],
  admin: Object.values(PERMISSIONS),
} as const;

/**
 * Check if a role has a specific permission
 *
 * @param role - User role
 * @param permissionName - Permission to check
 * @returns Whether the role has the permission
 */
export function roleHasPermission(
  role: string,
  permissionName: string,
): boolean {
  // Admin has all permissions
  if (role === 'admin') {
    return true;
  }

  const rolePerms =
    DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS];
  return rolePerms?.includes(permissionName as never) ?? false;
}

/**
 * Check if a user role is higher or equal in hierarchy
 *
 * @param userRole - User's role
 * @param requiredRole - Required minimum role
 * @returns Whether user role meets requirement
 */
export function hasMinimumRole(
  userRole: string,
  requiredRole: string,
): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(
    userRole as (typeof ROLE_HIERARCHY)[number],
  );
  const requiredIndex = ROLE_HIERARCHY.indexOf(
    requiredRole as (typeof ROLE_HIERARCHY)[number],
  );

  // Lower index = higher privilege
  return userIndex !== -1 && userIndex <= requiredIndex;
}

/**
 * Get all permissions for a role
 *
 * @param role - User role
 * @returns Array of permission names
 */
export function getRolePermissions(role: string): readonly string[] {
  if (role === 'admin') {
    return Object.values(PERMISSIONS);
  }

  return (
    DEFAULT_ROLE_PERMISSIONS[role as keyof typeof DEFAULT_ROLE_PERMISSIONS] ??
    []
  );
}

/**
 * Check if user can perform action on resource
 *
 * @param userRole - User's role
 * @param resource - Resource type (e.g., 'users', 'billing')
 * @param action - Action type (e.g., 'read', 'write', 'delete')
 * @returns Whether action is permitted
 */
export function canPerformAction(
  userRole: string,
  resource: string,
  action: string,
): boolean {
  const permissionName = `${resource}:${action}`;
  return roleHasPermission(userRole, permissionName);
}

/**
 * Initialize permissions in database
 * Creates all standard permissions if they don't exist
 */
export async function initializePermissions(): Promise<void> {
  const permissionsList = Object.entries(PERMISSIONS).map(([key, name]) => {
    const [resource, action] = name.split(':');
    return {
      id: name,
      name,
      description: key.replace(/_/g, ' ').toLowerCase(),
      resource,
      action,
    };
  });

  try {
    // Insert permissions (ignore duplicates)
    for (const perm of permissionsList) {
      await db
        .insert(permission)
        .values(perm)
        .onConflictDoNothing({ target: permission.name });
    }

    console.log(`Initialized ${permissionsList.length} permissions`);
  } catch (error) {
    console.error('Failed to initialize permissions:', error);
    throw error;
  }
}

/**
 * Seed role-permission mappings
 * Creates default permission assignments for all roles
 */
export async function seedRolePermissions(): Promise<void> {
  try {
    const mappings: Array<{ role: string; permissionId: string }> = [];

    for (const [role, permissions] of Object.entries(
      DEFAULT_ROLE_PERMISSIONS,
    )) {
      for (const permName of permissions) {
        mappings.push({
          role,
          permissionId: permName,
        });
      }
    }

    // Insert mappings (ignore duplicates)
    for (const mapping of mappings) {
      await db.insert(rolePermission).values(mapping).onConflictDoNothing();
    }

    console.log(`Seeded ${mappings.length} role-permission mappings`);
  } catch (error) {
    console.error('Failed to seed role permissions:', error);
    throw error;
  }
}

/**
 * Get permissions from database for a role
 *
 * @param role - User role
 * @returns Array of permission objects
 */
export async function getPermissionsForRole(role: string) {
  const result = await db
    .select({
      id: permission.id,
      name: permission.name,
      description: permission.description,
      resource: permission.resource,
      action: permission.action,
    })
    .from(permission)
    .innerJoin(rolePermission, eq(permission.id, rolePermission.permissionId))
    .where(eq(rolePermission.role, role));

  return result;
}

/**
 * Check if user has permission (database lookup)
 *
 * @param userRole - User's role
 * @param permissionName - Permission to check
 * @returns Whether user has permission
 */
export async function hasPermission(
  userRole: string,
  permissionName: string,
): Promise<boolean> {
  // Use in-memory check for performance
  return roleHasPermission(userRole, permissionName);
}
