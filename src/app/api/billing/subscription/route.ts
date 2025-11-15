import { eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { subscription as subscriptionTable } from '@/db/schema';
import { auth, type TypedSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as TypedSession | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscription
    const subscription = await db.query.subscription.findFirst({
      where: eq(subscriptionTable.userId, session.user.id),
    });

    // If no subscription, user is on free plan
    if (!subscription) {
      return NextResponse.json({
        subscription: {
          plan: 'Free',
          status: 'active',
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        },
      });
    }

    return NextResponse.json({
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 },
    );
  }
}
