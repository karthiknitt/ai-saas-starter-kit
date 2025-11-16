/**
 * Protected Component Wrapper
 *
 * Component wrapper for permission-based and role-based content rendering.
 * Automatically shows/hides content based on user permissions.
 *
 * @module components/protected
 */

'use client';

import type React from 'react';
import {
  useCanPerform,
  useHasPermission,
  useMinimumRole,
} from '@/hooks/use-permission';

interface ProtectedProps {
  children: React.ReactNode;
  /** Current user's role */
  currentUserRole: string;
  /** Required permission (e.g., 'users:read') */
  permission?: string;
  /** Required minimum user role */
  requiredRole?: string;
  /** Resource and action for permission check */
  resource?: string;
  action?: string;
  /** Fallback content when access is denied */
  fallback?: React.ReactNode;
}

/**
 * Protected component wrapper
 *
 * Conditionally renders children based on permissions or roles.
 * Supports three modes:
 * 1. Permission check: `<Protected permission="users:read">`
 * 2. Role check: `<Protected userRole="admin">`
 * 3. Resource/action check: `<Protected resource="users" action="delete">`
 *
 * @example
 * ```tsx
 * // Permission-based protection
 * <Protected permission="users:delete" fallback={<span>Access denied</span>}>
 *   <button>Delete User</button>
 * </Protected>
 *
 * // Role-based protection
 * <Protected userRole="admin">
 *   <AdminPanel />
 * </Protected>
 *
 * // Resource/action protection
 * <Protected resource="billing" action="manage">
 *   <BillingSettings />
 * </Protected>
 * ```
 */
export function Protected({
  children,
  currentUserRole,
  permission,
  requiredRole,
  resource,
  action,
  fallback = null,
}: ProtectedProps) {
  const hasPermission = useHasPermission(currentUserRole, permission || '');
  const hasRole = useMinimumRole(currentUserRole, requiredRole || '');
  const canPerform = useCanPerform(
    currentUserRole,
    resource || '',
    action || '',
  );

  let isAuthorized = false;

  if (permission) {
    isAuthorized = hasPermission;
  } else if (requiredRole) {
    isAuthorized = hasRole;
  } else if (resource && action) {
    isAuthorized = canPerform;
  }

  return isAuthorized ? children : fallback;
}

/**
 * Admin-only content wrapper
 *
 * Shorthand for `<Protected userRole="admin">`
 *
 * @example
 * ```tsx
 * <AdminOnly>
 *   <AdminPanel />
 * </AdminOnly>
 * ```
 */
export function AdminOnly({
  children,
  currentUserRole,
  fallback = null,
}: {
  children: React.ReactNode;
  currentUserRole: string;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected
      currentUserRole={currentUserRole}
      requiredRole="admin"
      fallback={fallback}
    >
      {children}
    </Protected>
  );
}

/**
 * Moderator or higher content wrapper
 *
 * @example
 * ```tsx
 * <ModeratorOnly>
 *   <ModerationPanel />
 * </ModeratorOnly>
 * ```
 */
export function ModeratorOnly({
  children,
  currentUserRole,
  fallback = null,
}: {
  children: React.ReactNode;
  currentUserRole: string;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected
      currentUserRole={currentUserRole}
      requiredRole="moderator"
      fallback={fallback}
    >
      {children}
    </Protected>
  );
}

/**
 * Editor or higher content wrapper
 *
 * @example
 * ```tsx
 * <EditorOnly>
 *   <EditorPanel />
 * </EditorOnly>
 * ```
 */
export function EditorOnly({
  children,
  currentUserRole,
  fallback = null,
}: {
  children: React.ReactNode;
  currentUserRole: string;
  fallback?: React.ReactNode;
}) {
  return (
    <Protected
      currentUserRole={currentUserRole}
      requiredRole="editor"
      fallback={fallback}
    >
      {children}
    </Protected>
  );
}
