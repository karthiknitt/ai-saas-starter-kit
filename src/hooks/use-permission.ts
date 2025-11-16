/**
 * Permission Hooks
 *
 * React hooks and utilities for role-based and permission-based access control.
 * These hooks accept user role as a parameter for maximum flexibility.
 *
 * @module hooks/use-permission
 */

'use client';

import { useMemo } from 'react';
import {
  canPerformAction,
  hasMinimumRole,
  type PERMISSIONS,
  roleHasPermission,
} from '@/lib/permissions';

/**
 * Check if a role has a specific permission
 *
 * @param userRole - User's role
 * @param permissionName - Permission to check
 * @returns Whether the role has the permission
 *
 * @example
 * ```tsx
 * function UserManagement({ userRole }: { userRole: string }) {
 *   const canDelete = useHasPermission(userRole, 'users:delete');
 *
 *   return (
 *     <div>
 *       {canDelete && <button>Delete User</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useHasPermission(
  userRole: string,
  permissionName: (typeof PERMISSIONS)[keyof typeof PERMISSIONS] | string,
): boolean {
  return useMemo(() => {
    return roleHasPermission(userRole, permissionName);
  }, [userRole, permissionName]);
}

/**
 * Check if a user role meets minimum requirement
 *
 * @param userRole - User's role
 * @param requiredRole - Minimum required role
 * @returns Whether role requirement is met
 *
 * @example
 * ```tsx
 * function AdminPanel({ userRole }: { userRole: string }) {
 *   const isAdmin = useMinimumRole(userRole, 'admin');
 *
 *   if (!isAdmin) {
 *     return <div>Access denied</div>;
 *   }
 *
 *   return <div>Admin content</div>;
 * }
 * ```
 */
export function useMinimumRole(
  userRole: string,
  requiredRole: string,
): boolean {
  return useMemo(() => {
    return hasMinimumRole(userRole, requiredRole);
  }, [userRole, requiredRole]);
}

/**
 * Check if a user role can perform action on resource
 *
 * @param userRole - User's role
 * @param resource - Resource type
 * @param action - Action type
 * @returns Whether action is permitted
 *
 * @example
 * ```tsx
 * function BillingSettings({ userRole }: { userRole: string }) {
 *   const canManage = useCanPerform(userRole, 'billing', 'manage');
 *
 *   return (
 *     <div>
 *       {canManage ? (
 *         <button>Update Payment Method</button>
 *       ) : (
 *         <span>View only</span>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCanPerform(
  userRole: string,
  resource: string,
  action: string,
): boolean {
  return useMemo(() => {
    return canPerformAction(userRole, resource, action);
  }, [userRole, resource, action]);
}

/**
 * Check multiple permissions for a role
 *
 * @param userRole - User's role
 * @param permissions - Array of permissions to check
 * @returns Object mapping each permission to boolean
 *
 * @example
 * ```tsx
 * function Dashboard({ userRole }: { userRole: string }) {
 *   const permissions = usePermissions(userRole, ['users:read', 'users:write', 'users:delete']);
 *
 *   return (
 *     <div>
 *       {permissions['users:read'] && <UserList />}
 *       {permissions['users:write'] && <CreateUser />}
 *       {permissions['users:delete'] && <DeleteUser />}
 *     </div>
 *   );
 * }
 * ```
 */
export function usePermissions(
  userRole: string,
  permissions: string[],
): Record<string, boolean> {
  return useMemo(() => {
    return Object.fromEntries(
      permissions.map((p) => [p, roleHasPermission(userRole, p)]),
    );
  }, [userRole, permissions]);
}
