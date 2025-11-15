import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import type { AuditAction } from '@/lib/audit-logger';
import { getAllAuditLogs } from '@/lib/audit-logger';
import { auth, type TypedSession } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as TypedSession | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = Number.parseInt(searchParams.get('limit') || '100', 10);
    const offset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const action = searchParams.get('action') || undefined;
    const userId = searchParams.get('userId') || undefined;

    // Fetch audit logs
    const logs = await getAllAuditLogs(limit, offset, {
      action: action as AuditAction | undefined,
      userId,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 },
    );
  }
}
