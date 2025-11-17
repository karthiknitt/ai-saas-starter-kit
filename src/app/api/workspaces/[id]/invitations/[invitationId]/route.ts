/**
 * Individual Workspace Invitation API
 *
 * Handles cancelling individual workspace invitations.
 */

import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { getIpAddress } from '@/lib/audit-logger';
import { auth } from '@/lib/auth';
import { getWorkspaceRole } from '@/lib/workspace';
import { cancelWorkspaceInvitation } from '@/lib/workspace-invitation';

/**
 * DELETE /api/workspaces/[id]/invitations/[invitationId]
 * Cancel a workspace invitation
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; invitationId: string }> },
) {
  try {
    // Get params
    const { id: workspaceId, invitationId } = await params;

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

    // Only owners and admins can cancel invitations
    if (userRole !== 'owner' && userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only owners and admins can cancel invitations' },
        { status: 403 },
      );
    }

    // Cancel invitation
    await cancelWorkspaceInvitation(
      {
        invitationId,
        cancelledBy: session.user.id,
      },
      {
        ipAddress: getIpAddress(request),
        userAgent: request.headers.get('user-agent') || undefined,
      },
    );

    return NextResponse.json({ message: 'Invitation cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling workspace invitation:', error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 },
    );
  }
}
