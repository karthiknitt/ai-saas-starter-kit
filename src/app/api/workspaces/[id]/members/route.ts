/**
 * Workspace Members API Route
 *
 * Handles workspace member management (list and add).
 *
 * @module app/api/workspaces/[id]/members
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import type { WorkspaceRole } from '@/lib/workspace';
import {
  addWorkspaceMember,
  getWorkspaceMembers,
  getWorkspaceRole,
  hasWorkspaceAccess,
} from '@/lib/workspace';

/**
 * GET /api/workspaces/[id]/members
 * List all members of a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user has access to this workspace
    const hasAccess = await hasWorkspaceAccess(session.user.id, id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const members = await getWorkspaceMembers(id);

    return NextResponse.json({ members });
  } catch (error) {
    logger.error('Failed to get workspace members', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to get workspace members' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces/[id]/members
 * Add a member to the workspace
 *
 * Request body:
 * {
 *   "userId": "user_123",
 *   "role": "member" | "admin" | "viewer" (optional, defaults to "member")
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if user is admin or owner
    const role = await getWorkspaceRole(session.user.id, id);
    if (!role || (role !== 'owner' && role !== 'admin')) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can add members' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { userId, role: memberRole } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    const validRoles: WorkspaceRole[] = ['owner', 'admin', 'member', 'viewer'];
    if (memberRole && !validRoles.includes(memberRole)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    // Only owner can add other owners
    if (memberRole === 'owner' && role !== 'owner') {
      return NextResponse.json(
        { error: 'Only workspace owner can add other owners' },
        { status: 403 },
      );
    }

    const member = await addWorkspaceMember(
      {
        workspaceId: id,
        userId,
        role: memberRole || 'member',
        invitedBy: session.user.id,
      },
      {
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({ member }, { status: 201 });
  } catch (error) {
    logger.error('Failed to add workspace member', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error) {
      if (error.message.includes('already a member')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to add workspace member' },
      { status: 500 },
    );
  }
}
