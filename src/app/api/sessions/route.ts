/**
 * Session Management API
 *
 * Allows users to view and manage their active sessions.
 *
 * @module api/sessions
 */

import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { session as sessionTable } from '@/db/schema';
import { auth, type TypedSession } from '@/lib/auth';

/**
 * GET /api/sessions
 *
 * Returns all active sessions for the current user.
 */
export async function GET() {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const sessions = await db
      .select({
        id: sessionTable.id,
        token: sessionTable.token,
        createdAt: sessionTable.createdAt,
        expiresAt: sessionTable.expiresAt,
        ipAddress: sessionTable.ipAddress,
        userAgent: sessionTable.userAgent,
      })
      .from(sessionTable)
      .where(eq(sessionTable.userId, session.user.id))
      .orderBy(sessionTable.createdAt);

    // Mark current session
    const currentToken = session.session.token;
    const sessionsWithCurrent = sessions.map((s) => ({
      ...s,
      isCurrent: s.token === currentToken,
    }));

    return NextResponse.json({ sessions: sessionsWithCurrent });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/sessions/:id
 *
 * Revokes a specific session.
 */
export async function DELETE(request: NextRequest) {
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 },
      );
    }

    // Verify the session belongs to the user
    const targetSession = await db.query.session.findFirst({
      where: eq(sessionTable.id, sessionId),
    });

    if (!targetSession || targetSession.userId !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Don't allow revoking the current session
    if (targetSession.token === session.session.token) {
      return NextResponse.json(
        { error: 'Cannot revoke current session' },
        { status: 400 },
      );
    }

    // Delete the session
    await db.delete(sessionTable).where(eq(sessionTable.id, sessionId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete session:', error);
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 },
    );
  }
}
