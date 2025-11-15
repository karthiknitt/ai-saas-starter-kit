import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { auth, type TypedSession } from '@/lib/auth';
import { createCheckoutSession } from '@/lib/polar-client';

export async function POST(request: Request) {
  try {
    const session = (await auth.api.getSession({
      headers: await headers(),
    })) as TypedSession | null;

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    // Validate plan
    if (!plan || !['pro', 'startup'].includes(plan.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro" or "startup"' },
        { status: 400 },
      );
    }

    // Create checkout session
    const checkoutUrl = await createCheckoutSession({
      plan: plan.toLowerCase() as 'pro' | 'startup',
      customerEmail: session.user.email,
      successUrl: `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
    });

    return NextResponse.json({ url: checkoutUrl });
  } catch (error) {
    console.error('Checkout creation failed:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
