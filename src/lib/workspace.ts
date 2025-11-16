/**
 * Workspace management utilities for multi-tenancy support.
 *
 * This module provides functions for creating and managing workspaces,
 * adding/removing members, and checking workspace access permissions.
 *
 * Features:
 * - Workspace creation with automatic slug generation
 * - Member invitation and management
 * - Role-based workspace access control
 * - Workspace listing and retrieval
 *
 * @module lib/workspace
 */

import { and, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { user, workspace, workspaceMember } from '@/db/schema';
import { logAudit } from './audit-logger';

/**
 * Workspace role type
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Workspace with member count
 */
export interface WorkspaceWithMembers {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  plan: string;
  createdAt: Date;
  updatedAt: Date;
  memberCount?: number;
  userRole?: WorkspaceRole;
}

/**
 * Workspace member with user details
 */
export interface WorkspaceMemberDetails {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  createdAt: Date;
  userName?: string;
  userEmail?: string;
}

/**
 * Generate a URL-safe slug from a workspace name.
 *
 * @param name - Workspace name
 * @returns URL-safe slug
 *
 * @example
 * ```typescript
 * const slug = generateSlug('My Awesome Team'); // 'my-awesome-team'
 * ```
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Create a new workspace.
 *
 * Creates a workspace and automatically adds the creator as the owner.
 *
 * @param data - Workspace creation data
 * @param data.name - Workspace name
 * @param data.ownerId - User ID of the workspace owner
 * @param data.plan - Subscription plan (default: 'Free')
 * @param metadata - Additional metadata for audit logging
 * @returns Created workspace
 *
 * @example
 * ```typescript
 * const workspace = await createWorkspace({
 *   name: 'Acme Corp',
 *   ownerId: 'user_123',
 *   plan: 'Pro'
 * }, { ipAddress: '192.168.1.1' });
 * ```
 */
export async function createWorkspace(
  data: {
    name: string;
    ownerId: string;
    plan?: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const slug = generateSlug(data.name);
  const workspaceId = nanoid();

  // Check if slug already exists
  const existing = await db.query.workspace.findFirst({
    where: eq(workspace.slug, slug),
  });

  if (existing) {
    throw new Error(`Workspace with slug "${slug}" already exists`);
  }

  // Create workspace
  const [newWorkspace] = await db
    .insert(workspace)
    .values({
      id: workspaceId,
      name: data.name,
      slug,
      ownerId: data.ownerId,
      plan: data.plan || 'Free',
    })
    .returning();

  // Add owner as a member
  await db.insert(workspaceMember).values({
    workspaceId: workspaceId,
    userId: data.ownerId,
    role: 'owner',
  });

  // Log audit trail
  await logAudit({
    userId: data.ownerId,
    action: 'workspace.created',
    resourceType: 'workspace',
    resourceId: workspaceId,
    changes: { workspace: newWorkspace },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });

  return newWorkspace;
}

/**
 * Get all workspaces for a user.
 *
 * Returns all workspaces where the user is a member, including their role.
 *
 * @param userId - User ID
 * @returns Array of workspaces with member count and user role
 *
 * @example
 * ```typescript
 * const workspaces = await getUserWorkspaces('user_123');
 * ```
 */
export async function getUserWorkspaces(
  userId: string,
): Promise<WorkspaceWithMembers[]> {
  const memberships = await db.query.workspaceMember.findMany({
    where: eq(workspaceMember.userId, userId),
  });

  const workspacesWithDetails = await Promise.all(
    memberships.map(async (membership) => {
      const ws = await db.query.workspace.findFirst({
        where: eq(workspace.id, membership.workspaceId),
      });

      if (!ws) {
        throw new Error(`Workspace ${membership.workspaceId} not found`);
      }

      const memberCount = await db.query.workspaceMember.findMany({
        where: eq(workspaceMember.workspaceId, membership.workspaceId),
      });

      return {
        ...ws,
        memberCount: memberCount.length,
        userRole: membership.role as WorkspaceRole,
      };
    }),
  );

  return workspacesWithDetails;
}

/**
 * Get a workspace by ID.
 *
 * @param workspaceId - Workspace ID
 * @returns Workspace or null if not found
 *
 * @example
 * ```typescript
 * const workspace = await getWorkspace('workspace_123');
 * ```
 */
export async function getWorkspace(workspaceId: string) {
  return db.query.workspace.findFirst({
    where: eq(workspace.id, workspaceId),
  });
}

/**
 * Get a workspace by slug.
 *
 * @param slug - Workspace slug
 * @returns Workspace or null if not found
 *
 * @example
 * ```typescript
 * const workspace = await getWorkspaceBySlug('acme-corp');
 * ```
 */
export async function getWorkspaceBySlug(slug: string) {
  return db.query.workspace.findFirst({
    where: eq(workspace.slug, slug),
  });
}

/**
 * Check if a user has access to a workspace.
 *
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @returns True if user is a member, false otherwise
 *
 * @example
 * ```typescript
 * const hasAccess = await hasWorkspaceAccess('user_123', 'workspace_123');
 * ```
 */
export async function hasWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.userId, userId),
      eq(workspaceMember.workspaceId, workspaceId),
    ),
  });

  return !!member;
}

/**
 * Get a user's role in a workspace.
 *
 * @param userId - User ID
 * @param workspaceId - Workspace ID
 * @returns User's workspace role or null if not a member
 *
 * @example
 * ```typescript
 * const role = await getWorkspaceRole('user_123', 'workspace_123');
 * ```
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string,
): Promise<WorkspaceRole | null> {
  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.userId, userId),
      eq(workspaceMember.workspaceId, workspaceId),
    ),
  });

  return member ? (member.role as WorkspaceRole) : null;
}

/**
 * Add a member to a workspace.
 *
 * @param data - Member addition data
 * @param data.workspaceId - Workspace ID
 * @param data.userId - User ID to add
 * @param data.role - Workspace role (default: 'member')
 * @param data.invitedBy - User ID who is inviting (for audit log)
 * @param metadata - Additional metadata for audit logging
 * @returns Created workspace member
 *
 * @example
 * ```typescript
 * const member = await addWorkspaceMember({
 *   workspaceId: 'workspace_123',
 *   userId: 'user_456',
 *   role: 'member',
 *   invitedBy: 'user_123'
 * });
 * ```
 */
export async function addWorkspaceMember(
  data: {
    workspaceId: string;
    userId: string;
    role?: WorkspaceRole;
    invitedBy: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  // Check if user is already a member
  const existing = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, data.workspaceId),
      eq(workspaceMember.userId, data.userId),
    ),
  });

  if (existing) {
    throw new Error('User is already a member of this workspace');
  }

  // Add member
  const [member] = await db
    .insert(workspaceMember)
    .values({
      workspaceId: data.workspaceId,
      userId: data.userId,
      role: data.role || 'member',
    })
    .returning();

  // Log audit trail
  await logAudit({
    userId: data.invitedBy,
    action: 'workspace.member_added',
    resourceType: 'workspace',
    resourceId: data.workspaceId,
    changes: {
      addedUserId: data.userId,
      role: data.role || 'member',
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });

  return member;
}

/**
 * Remove a member from a workspace.
 *
 * @param data - Member removal data
 * @param data.workspaceId - Workspace ID
 * @param data.userId - User ID to remove
 * @param data.removedBy - User ID who is removing (for audit log)
 * @param metadata - Additional metadata for audit logging
 *
 * @example
 * ```typescript
 * await removeWorkspaceMember({
 *   workspaceId: 'workspace_123',
 *   userId: 'user_456',
 *   removedBy: 'user_123'
 * });
 * ```
 */
export async function removeWorkspaceMember(
  data: {
    workspaceId: string;
    userId: string;
    removedBy: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  // Check if user is the owner
  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, data.workspaceId),
      eq(workspaceMember.userId, data.userId),
    ),
  });

  if (member?.role === 'owner') {
    throw new Error('Cannot remove the workspace owner');
  }

  // Remove member
  await db
    .delete(workspaceMember)
    .where(
      and(
        eq(workspaceMember.workspaceId, data.workspaceId),
        eq(workspaceMember.userId, data.userId),
      ),
    );

  // Log audit trail
  await logAudit({
    userId: data.removedBy,
    action: 'workspace.member_removed',
    resourceType: 'workspace',
    resourceId: data.workspaceId,
    changes: { removedUserId: data.userId },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}

/**
 * Update a member's role in a workspace.
 *
 * @param data - Role update data
 * @param data.workspaceId - Workspace ID
 * @param data.userId - User ID
 * @param data.newRole - New workspace role
 * @param data.updatedBy - User ID who is updating (for audit log)
 * @param metadata - Additional metadata for audit logging
 *
 * @example
 * ```typescript
 * await updateWorkspaceMemberRole({
 *   workspaceId: 'workspace_123',
 *   userId: 'user_456',
 *   newRole: 'admin',
 *   updatedBy: 'user_123'
 * });
 * ```
 */
export async function updateWorkspaceMemberRole(
  data: {
    workspaceId: string;
    userId: string;
    newRole: WorkspaceRole;
    updatedBy: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  // Get current member
  const member = await db.query.workspaceMember.findFirst({
    where: and(
      eq(workspaceMember.workspaceId, data.workspaceId),
      eq(workspaceMember.userId, data.userId),
    ),
  });

  if (!member) {
    throw new Error('User is not a member of this workspace');
  }

  if (member.role === 'owner' && data.newRole !== 'owner') {
    throw new Error('Cannot change the role of the workspace owner');
  }

  const oldRole = member.role;

  // Update role
  await db
    .update(workspaceMember)
    .set({ role: data.newRole })
    .where(
      and(
        eq(workspaceMember.workspaceId, data.workspaceId),
        eq(workspaceMember.userId, data.userId),
      ),
    );

  // Log audit trail
  await logAudit({
    userId: data.updatedBy,
    action: 'workspace.member_role_updated',
    resourceType: 'workspace',
    resourceId: data.workspaceId,
    changes: {
      userId: data.userId,
      oldRole,
      newRole: data.newRole,
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}

/**
 * Get all members of a workspace.
 *
 * @param workspaceId - Workspace ID
 * @returns Array of workspace members with user details
 *
 * @example
 * ```typescript
 * const members = await getWorkspaceMembers('workspace_123');
 * ```
 */
export async function getWorkspaceMembers(workspaceId: string) {
  const members = await db.query.workspaceMember.findMany({
    where: eq(workspaceMember.workspaceId, workspaceId),
  });

  const membersWithUserDetails = await Promise.all(
    members.map(async (member) => {
      const userDetails = await db.query.user.findFirst({
        where: eq(user.id, member.userId),
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      return {
        ...member,
        user: userDetails,
      };
    }),
  );

  return membersWithUserDetails;
}

/**
 * Update workspace details.
 *
 * @param data - Workspace update data
 * @param data.workspaceId - Workspace ID
 * @param data.name - New workspace name (optional)
 * @param data.plan - New workspace plan (optional)
 * @param data.updatedBy - User ID who is updating (for audit log)
 * @param metadata - Additional metadata for audit logging
 * @returns Updated workspace
 *
 * @example
 * ```typescript
 * const updated = await updateWorkspace({
 *   workspaceId: 'workspace_123',
 *   name: 'New Name',
 *   plan: 'Pro',
 *   updatedBy: 'user_123'
 * });
 * ```
 */
export async function updateWorkspace(
  data: {
    workspaceId: string;
    name?: string;
    plan?: string;
    updatedBy: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const current = await getWorkspace(data.workspaceId);
  if (!current) {
    throw new Error('Workspace not found');
  }

  const updates: Partial<typeof workspace.$inferInsert> = {};

  if (data.name && data.name !== current.name) {
    updates.name = data.name;
    updates.slug = generateSlug(data.name);

    // Check if new slug conflicts
    const existing = await db.query.workspace.findFirst({
      where: and(
        eq(workspace.slug, updates.slug),
        or(eq(workspace.id, data.workspaceId)),
      ),
    });

    if (existing && existing.id !== data.workspaceId) {
      throw new Error(`Workspace with slug "${updates.slug}" already exists`);
    }
  }

  if (data.plan && data.plan !== current.plan) {
    updates.plan = data.plan;
  }

  if (Object.keys(updates).length === 0) {
    return current;
  }

  const [updated] = await db
    .update(workspace)
    .set(updates)
    .where(eq(workspace.id, data.workspaceId))
    .returning();

  // Log audit trail
  await logAudit({
    userId: data.updatedBy,
    action: 'workspace.updated',
    resourceType: 'workspace',
    resourceId: data.workspaceId,
    changes: { before: current, after: updated },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });

  return updated;
}

/**
 * Delete a workspace.
 *
 * Only the workspace owner can delete a workspace.
 * All members will be automatically removed due to cascade delete.
 *
 * @param data - Workspace deletion data
 * @param data.workspaceId - Workspace ID
 * @param data.deletedBy - User ID who is deleting (must be owner)
 * @param metadata - Additional metadata for audit logging
 *
 * @example
 * ```typescript
 * await deleteWorkspace({
 *   workspaceId: 'workspace_123',
 *   deletedBy: 'user_123'
 * });
 * ```
 */
export async function deleteWorkspace(
  data: {
    workspaceId: string;
    deletedBy: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const ws = await getWorkspace(data.workspaceId);
  if (!ws) {
    throw new Error('Workspace not found');
  }

  if (ws.ownerId !== data.deletedBy) {
    throw new Error('Only the workspace owner can delete the workspace');
  }

  await db.delete(workspace).where(eq(workspace.id, data.workspaceId));

  // Log audit trail
  await logAudit({
    userId: data.deletedBy,
    action: 'workspace.deleted',
    resourceType: 'workspace',
    resourceId: data.workspaceId,
    changes: { workspace: ws },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}
