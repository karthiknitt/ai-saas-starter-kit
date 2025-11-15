import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, type TypedSession } from '@/lib/auth';
import { checkAiRequestQuota } from '@/lib/usage-tracker';

export async function GET() {
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as TypedSession | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's usage quota
    const quota = await checkAiRequestQuota(session.user.id);

    return NextResponse.json({
      quota,
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 },
    );
  }
}
