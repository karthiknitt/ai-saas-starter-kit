/**
 * Individual Workspace API Route
 *
 * Handles get, update, and delete operations for a specific workspace.
 *
 * @module app/api/workspaces/[id]
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import {
  deleteWorkspace,
  getWorkspace,
  getWorkspaceRole,
  hasWorkspaceAccess,
  updateWorkspace,
} from '@/lib/workspace';

/**
 * GET /api/workspaces/[id]
 * Get workspace details
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

    const workspace = await getWorkspace(id);

    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    logger.error('Failed to get workspace', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to get workspace' },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/workspaces/[id]
 * Update workspace details
 *
 * Request body:
 * {
 *   "name": "New name" (optional),
 *   "plan": "Free" | "Pro" | "Startup" (optional)
 * }
 */
export async function PATCH(
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
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, plan } = body;

    if (plan && !['Free', 'Pro', 'Startup'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const workspace = await updateWorkspace(
      {
        workspaceId: id,
        name: name ? name.trim() : undefined,
        plan,
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

    return NextResponse.json({ workspace });
  } catch (error) {
    logger.error('Failed to update workspace', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 },
        );
      }
      if (error.message.includes('already exists')) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: 'Failed to update workspace' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/workspaces/[id]
 * Delete a workspace
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Only workspace owner can delete
    const workspace = await getWorkspace(id);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 },
      );
    }

    if (workspace.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only workspace owner can delete the workspace' },
        { status: 403 },
      );
    }

    await deleteWorkspace(
      {
        workspaceId: id,
        deletedBy: session.user.id,
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
    logger.error('Failed to delete workspace', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 },
    );
  }
}
