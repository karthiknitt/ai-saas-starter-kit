/**
 * Workspace Invitations API
 *
 * Handles creating and listing workspace invitations.
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getIpAddress } from '@/lib/audit-logger';
import { auth } from '@/lib/auth';
import { getWorkspaceRole } from '@/lib/workspace';
import {
  createWorkspaceInvitation,
  getWorkspaceInvitations,
} from '@/lib/workspace-invitation';

// Validation schema for creating invitations
const createInvitationSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).default('member'),
});

/**
 * GET /api/workspaces/[id]/invitations
 * List all invitations for a workspace
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get workspace ID from params
    const { id: workspaceId } = await params;

    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace access
    const userRole = await getWorkspaceRole(session.user.id, workspaceId);
    if (!userRole) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 },
      );
    }

    // Only owners and admins can view invitations
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can view invitations' },
        { status: 403 },
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') as
      | 'pending'
      | 'accepted'
      | 'declined'
      | 'expired'
      | null;

    // Get invitations
    const invitations = await getWorkspaceInvitations(
      workspaceId,
      status || undefined,
    );

    return NextResponse.json({ invitations });
  } catch (error) {
    console.error('Error fetching workspace invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/workspaces/[id]/invitations
 * Create a new workspace invitation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Get workspace ID from params
    const { id: workspaceId } = await params;

    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check workspace access
    const userRole = await getWorkspaceRole(session.user.id, workspaceId);
    if (!userRole) {
      return NextResponse.json(
        { error: 'You do not have access to this workspace' },
        { status: 403 },
      );
    }

    // Only owners and admins can invite members
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can invite members' },
        { status: 403 },
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = createInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { email, role } = validation.data;

    // Get base URL for invitation link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create invitation
    const invitation = await createWorkspaceInvitation(
      {
        workspaceId,
        email,
        role,
        invitedBy: session.user.id,
        baseUrl,
      },
      {
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json(
      { invitation, message: 'Invitation sent successfully' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error creating workspace invitation:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 },
    );
  }
}
