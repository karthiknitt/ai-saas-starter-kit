/**
 * Workspace Invitation Management
 *
 * Utilities for creating, managing, and processing workspace invitations.
 * Handles email-based invitation flow with token validation and expiration.
 *
 * @module lib/workspace-invitation
 */

import crypto from 'node:crypto';
import { and, eq, or } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { user, workspaceInvitation, workspaceMember } from '@/db/schema';
import { logAudit } from './audit-logger';
import { sendWorkspaceInvitationEmail } from './email-service';
import { addWorkspaceMember, getWorkspace } from './workspace';

/**
 * Workspace invitation details
 */
export interface WorkspaceInvitationDetails {
  id: string;
  workspaceId: string;
  email: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  workspace?: {
    id: string;
    name: string;
    slug: string;
  };
  inviter?: {
    id: string;
    name: string;
    email: string;
  };
}

/**
 * Generate a secure invitation token.
 *
 * @returns Cryptographically secure random token
 */
function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a workspace invitation and send invitation email.
 *
 * @param data - Invitation creation data
 * @param data.workspaceId - Workspace ID
 * @param data.email - Invitee email address
 * @param data.role - Workspace role to assign (default: 'member')
 * @param data.invitedBy - User ID who is sending the invitation
 * @param data.baseUrl - Base URL for invitation acceptance link
 * @param metadata - Additional metadata for audit logging
 * @returns Created invitation
 *
 * @example
 * ```typescript
 * const invitation = await createWorkspaceInvitation({
 *   workspaceId: 'workspace_123',
 *   email: 'user@example.com',
 *   role: 'member',
 *   invitedBy: 'user_123',
 *   baseUrl: 'https://example.com'
 * });
 * ```
 */
export async function createWorkspaceInvitation(
  data: {
    workspaceId: string;
    email: string;
    role?: 'owner' | 'admin' | 'member' | 'viewer';
    invitedBy: string;
    baseUrl: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  // Check if user is already a member
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, data.email),
  });

  if (existingUser) {
    const existingMember = await db.query.workspaceMember.findFirst({
      where: and(
        eq(workspaceMember.workspaceId, data.workspaceId),
        eq(workspaceMember.userId, existingUser.id),
      ),
    });

    if (existingMember) {
      throw new Error('User is already a member of this workspace');
    }
  }

  // Check for pending invitation
  const existingInvitation = await db.query.workspaceInvitation.findFirst({
    where: and(
      eq(workspaceInvitation.workspaceId, data.workspaceId),
      eq(workspaceInvitation.email, data.email),
      eq(workspaceInvitation.status, 'pending'),
    ),
  });

  if (existingInvitation) {
    throw new Error(
      'A pending invitation already exists for this email address',
    );
  }

  // Get workspace and inviter details
  const ws = await getWorkspace(data.workspaceId);
  if (!ws) {
    throw new Error('Workspace not found');
  }

  const inviter = await db.query.user.findFirst({
    where: eq(user.id, data.invitedBy),
  });

  if (!inviter) {
    throw new Error('Inviter not found');
  }

  // Create invitation
  const invitationId = nanoid();
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

  const [invitation] = await db
    .insert(workspaceInvitation)
    .values({
      id: invitationId,
      workspaceId: data.workspaceId,
      email: data.email,
      role: data.role || 'member',
      invitedBy: data.invitedBy,
      token,
      expiresAt,
      status: 'pending',
    })
    .returning();

  // Generate invitation URL
  const invitationUrl = `${data.baseUrl}/accept-invitation?token=${token}`;

  // Send invitation email
  const inviteeName = existingUser?.name || data.email.split('@')[0];
  await sendWorkspaceInvitationEmail({
    to: data.email,
    inviteeName,
    inviterName: inviter.name,
    workspaceName: ws.name,
    role: data.role || 'member',
    invitationUrl,
    expiresInDays: 7,
  });

  // Log audit trail
  await logAudit({
    userId: data.invitedBy,
    action: 'workspace.invitation_created',
    resourceType: 'workspace',
    resourceId: data.workspaceId,
    changes: {
      invitationId: invitationId,
      email: data.email,
      role: data.role || 'member',
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });

  return invitation;
}

/**
 * Get invitation by token.
 *
 * @param token - Invitation token
 * @returns Invitation details with workspace and inviter information
 */
export async function getInvitationByToken(
  token: string,
): Promise<WorkspaceInvitationDetails | null> {
  const invitation = await db.query.workspaceInvitation.findFirst({
    where: eq(workspaceInvitation.token, token),
  });

  if (!invitation) {
    return null;
  }

  // Get workspace details
  const ws = await getWorkspace(invitation.workspaceId);
  const inviter = await db.query.user.findFirst({
    where: eq(user.id, invitation.invitedBy),
  });

  return {
    ...invitation,
    workspace: ws
      ? {
          id: ws.id,
          name: ws.name,
          slug: ws.slug,
        }
      : undefined,
    inviter: inviter
      ? {
          id: inviter.id,
          name: inviter.name,
          email: inviter.email,
        }
      : undefined,
  };
}

/**
 * Accept a workspace invitation.
 *
 * Validates the token, checks expiration, and adds the user to the workspace.
 *
 * @param data - Acceptance data
 * @param data.token - Invitation token
 * @param data.userId - User ID accepting the invitation
 * @param metadata - Additional metadata for audit logging
 * @returns Accepted invitation details
 *
 * @throws Error if invitation is invalid, expired, or already accepted
 */
export async function acceptWorkspaceInvitation(
  data: {
    token: string;
    userId: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const invitation = await getInvitationByToken(data.token);

  if (!invitation) {
    throw new Error('Invalid invitation token');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation has already been ${invitation.status}`);
  }

  if (new Date() > invitation.expiresAt) {
    // Mark as expired
    await db
      .update(workspaceInvitation)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(workspaceInvitation.id, invitation.id));

    throw new Error('Invitation has expired');
  }

  // Verify user email matches invitation
  const invitedUser = await db.query.user.findFirst({
    where: eq(user.id, data.userId),
  });

  if (!invitedUser) {
    throw new Error('User not found');
  }

  if (invitedUser.email !== invitation.email) {
    throw new Error('Invitation email does not match your account email');
  }

  // Add user to workspace
  await addWorkspaceMember(
    {
      workspaceId: invitation.workspaceId,
      userId: data.userId,
      role: invitation.role as 'owner' | 'admin' | 'member' | 'viewer',
      invitedBy: invitation.invitedBy,
    },
    metadata,
  );

  // Update invitation status
  const [updatedInvitation] = await db
    .update(workspaceInvitation)
    .set({
      status: 'accepted',
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(workspaceInvitation.id, invitation.id))
    .returning();

  // Log audit trail
  await logAudit({
    userId: data.userId,
    action: 'workspace.invitation_accepted',
    resourceType: 'workspace',
    resourceId: invitation.workspaceId,
    changes: {
      invitationId: invitation.id,
      email: invitation.email,
      role: invitation.role,
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });

  return updatedInvitation;
}

/**
 * Decline a workspace invitation.
 *
 * @param data - Decline data
 * @param data.token - Invitation token
 * @param data.userId - User ID declining the invitation (optional)
 * @param metadata - Additional metadata for audit logging
 */
export async function declineWorkspaceInvitation(
  data: {
    token: string;
    userId?: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const invitation = await getInvitationByToken(data.token);

  if (!invitation) {
    throw new Error('Invalid invitation token');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation has already been ${invitation.status}`);
  }

  // Update invitation status
  await db
    .update(workspaceInvitation)
    .set({ status: 'declined', updatedAt: new Date() })
    .where(eq(workspaceInvitation.id, invitation.id));

  // Log audit trail
  await logAudit({
    userId: data.userId || invitation.invitedBy,
    action: 'workspace.invitation_declined',
    resourceType: 'workspace',
    resourceId: invitation.workspaceId,
    changes: {
      invitationId: invitation.id,
      email: invitation.email,
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}

/**
 * Cancel a workspace invitation.
 *
 * Only the inviter or workspace owner/admin can cancel an invitation.
 *
 * @param data - Cancellation data
 * @param data.invitationId - Invitation ID
 * @param data.cancelledBy - User ID cancelling the invitation
 * @param metadata - Additional metadata for audit logging
 */
export async function cancelWorkspaceInvitation(
  data: {
    invitationId: string;
    cancelledBy: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
  },
) {
  const invitation = await db.query.workspaceInvitation.findFirst({
    where: eq(workspaceInvitation.id, data.invitationId),
  });

  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error(`Invitation has already been ${invitation.status}`);
  }

  // Delete invitation
  await db
    .delete(workspaceInvitation)
    .where(eq(workspaceInvitation.id, data.invitationId));

  // Log audit trail
  await logAudit({
    userId: data.cancelledBy,
    action: 'workspace.invitation_cancelled',
    resourceType: 'workspace',
    resourceId: invitation.workspaceId,
    changes: {
      invitationId: invitation.id,
      email: invitation.email,
    },
    ipAddress: metadata?.ipAddress,
    userAgent: metadata?.userAgent,
  });
}

/**
 * Get all invitations for a workspace.
 *
 * @param workspaceId - Workspace ID
 * @param status - Optional status filter
 * @returns Array of invitations
 */
export async function getWorkspaceInvitations(
  workspaceId: string,
  status?: 'pending' | 'accepted' | 'declined' | 'expired',
) {
  const conditions = [eq(workspaceInvitation.workspaceId, workspaceId)];

  if (status) {
    conditions.push(eq(workspaceInvitation.status, status));
  }

  return db.query.workspaceInvitation.findMany({
    where: and(...conditions),
    orderBy: (invitations, { desc }) => [desc(invitations.createdAt)],
  });
}

/**
 * Expire old invitations.
 *
 * Should be run periodically (e.g., daily cron job) to clean up expired invitations.
 *
 * @returns Number of invitations expired
 */
export async function expireOldInvitations(): Promise<number> {
  const now = new Date();

  const result = await db
    .update(workspaceInvitation)
    .set({ status: 'expired', updatedAt: now })
    .where(
      and(
        eq(workspaceInvitation.status, 'pending'),
        // expiresAt < now
        or(eq(workspaceInvitation.expiresAt, now)),
      ),
    )
    .returning();

  return result.length;
}
