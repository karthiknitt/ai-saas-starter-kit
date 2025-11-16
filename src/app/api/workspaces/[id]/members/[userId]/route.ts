/**
 * Individual Workspace Member API Route
 *
 * Handles update and remove operations for a specific workspace member.
 *
 * @module app/api/workspaces/[id]/members/[userId]
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { WorkspaceRole } from '@/lib/workspace';
import {
  getWorkspaceRole,
  removeWorkspaceMember,
  updateWorkspaceMemberRole,
} from '@/lib/workspace';

/**
 * PATCH /api/workspaces/[id]/members/[userId]
 * Update a member's role in the workspace
 *
 * Request body:
 * {
 *   "role": "member" | "admin" | "viewer"
 * }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = await params;

    // Check if user is admin or owner
    const currentUserRole = await getWorkspaceRole(session.user.id, id);
    if (
      !currentUserRole ||
      (currentUserRole !== 'owner' && currentUserRole !== 'admin')
    ) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can update member roles' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { role: newRole } = body;

    const validRoles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer'];
    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Only owner can assign owner role
    if (newRole === 'owner' && currentUserRole !== 'owner') {
      return NextResponse.json(
        { error: 'Only workspace owner can assign owner role' },
        { status: 403 },
      );
    }

    // Admins cannot modify other admins or owners
    if (currentUserRole === 'admin') {
      const targetRole = await getWorkspaceRole(userId, id);
      if (targetRole === 'owner' || targetRole === 'admin') {
        return NextResponse.json(
          { error: 'Admins cannot modify other admins or owners' },
          { status: 403 },
        );
      }
    }

    await updateWorkspaceMemberRole(
      {
        workspaceId: id,
        userId,
        newRole,
        updatedBy: session.user.id,
      },
      {
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to update workspace member role', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error) {
      if (error.message.includes('not a member')) {
        return NextResponse.json(
          { error: 'User is not a member of this workspace' },
          { status: 404 },
        );
      }
      if (
        error.message.includes('Cannot change the role of the workspace owner')
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update workspace member role' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/workspaces/[id]/members/[userId]
 * Remove a member from the workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, userId } = await params;

    // Check if user is admin or owner
    const currentUserRole = await getWorkspaceRole(session.user.id, id);
    if (
      !currentUserRole ||
      (currentUserRole !== 'owner' && currentUserRole !== 'admin')
    ) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can remove members' },
        { status: 403 },
      );
    }

    // Admins cannot remove other admins or owners
    if (currentUserRole === 'admin') {
      const targetRole = await getWorkspaceRole(userId, id);
      if (targetRole === 'owner' || targetRole === 'admin') {
        return NextResponse.json(
          { error: 'Admins cannot remove other admins or owners' },
          { status: 403 },
        );
      }
    }

    await removeWorkspaceMember(
      {
        workspaceId: id,
        userId,
        removedBy: session.user.id,
      },
      {
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to remove workspace member', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (
      error instanceof Error &&
      error.message.includes('Cannot remove the workspace owner')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to remove workspace member' },
      { status: 500 },
    );
  }
}
