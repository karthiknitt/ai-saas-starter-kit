/**
 * Workspaces API Route
 *
 * Handles workspace creation and listing.
 *
 * @module app/api/workspaces
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { createWorkspace, getUserWorkspaces } from '@/lib/workspace';

/**
 * GET /api/workspaces
 * List all workspaces for the current user
 */
export async function GET(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workspaces = await getUserWorkspaces(session.user.id);

    return NextResponse.json({ workspaces });
  } catch (error) {
    logger.error('Failed to get workspaces', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to get workspaces' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces
 * Create a new workspace
 *
 * Request body:
 * {
 *   "name": "Workspace name",
 *   "plan": "Free" | "Pro" | "Startup" (optional, defaults to "Free")
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, plan } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Workspace name is required' },
        { status: 400 },
      );
    }

    if (plan && !['Free', 'Pro', 'Startup'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const workspace = await createWorkspace(
      {
        name: name.trim(),
        ownerId: session.user.id,
        plan: plan || 'Free',
      },
      {
        ipAddress:
          request.headers.get('x-forwarded-for')?.split(',')[0] ||
          request.headers.get('x-real-ip') ||
          undefined,
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({ workspace }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create workspace', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if (error instanceof Error && error.message.includes('already exists')) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: 'Failed to create workspace' },
      { status: 500 },
    );
  }
}
