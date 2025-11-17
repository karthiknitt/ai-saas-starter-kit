/**
 * Accept Workspace Invitation API
 *
 * Handles accepting workspace invitations via token.
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getIpAddress } from '@/lib/audit-logger';
import { auth } from '@/lib/auth';
import {
  acceptWorkspaceInvitation,
  declineWorkspaceInvitation,
  getInvitationByToken,
} from '@/lib/workspace-invitation';

// Validation schema
const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const declineInvitationSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * GET /api/accept-invitation?token=xxx
 * Get invitation details by token
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Get invitation details
    const invitation = await getInvitationByToken(token);

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid or expired invitation' },
        { status: 404 },
      );
    }

    // Return invitation details (without sensitive token)
    const { token: _, ...invitationDetails } = invitation;

    return NextResponse.json({ invitation: invitationDetails });
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitation' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/accept-invitation
 * Accept a workspace invitation
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = acceptInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { token } = validation.data;

    // Accept invitation
    await acceptWorkspaceInvitation(
      {
        token,
        userId: session.user.id,
      },
      {
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({
      message: 'Invitation accepted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to accept invitation' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/accept-invitation
 * Decline a workspace invitation
 */
export async function DELETE(request: NextRequest) {
  try {
    // Optionally authenticate user (can be declined without login)
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // Parse and validate request body
    const body = await request.json();
    const validation = declineInvitationSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { token } = validation.data;

    // Decline invitation
    await declineWorkspaceInvitation(
      {
        token,
        userId: session?.user.id,
      },
      {
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({
      message: 'Invitation declined',
      success: true,
    });
  } catch (error) {
    console.error('Error declining invitation:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to decline invitation' },
      { status: 500 },
    );
  }
}
