import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { subscription, user } from '@/db/schema';
import { getPlanName } from '@/lib/plan-map';
import { logSubscriptionChange } from '@/lib/audit-logger';
import { getOrCreateQuota } from '@/lib/usage-tracker';

// TypeScript interfaces for webhook data
interface PolarSubscription {
  id: string;
  product_id: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

interface PolarCustomer {
  id: string;
  email: string;
}

interface WebhookEventData {
  subscription?: PolarSubscription;
  customer?: PolarCustomer;
  [key: string]: unknown;
}

function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    // Strip the "v1," prefix and get the base64 signature
    const signatureWithoutPrefix = signature.replace('v1,', '');

    // Decode the base64 signature into a Buffer
    const receivedSignature = Buffer.from(signatureWithoutPrefix, 'base64');

    // Create HMAC using the secret
    const hmac = crypto.createHmac('sha256', secret);

    // Calculate signature over the raw body as bytes
    const computedSignature = hmac.update(body, 'utf8').digest();

    // Compare the signatures using timing-safe comparison
    return crypto.timingSafeEqual(computedSignature, receivedSignature);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

async function handleSubscriptionCreated(data: WebhookEventData) {
  try {
    const subscriptionData = data.subscription;
    const customerData = data.customer;

    if (!subscriptionData || !customerData) {
      console.error('Missing subscription or customer data in webhook');
      return;
    }

    const plan = getPlanName(subscriptionData.product_id);

    console.log('Creating subscription for user:', customerData.email);
    console.log('Product ID from webhook:', subscriptionData.product_id);
    console.log('Resolved plan from getPlanName:', plan);

    // Find user by email to get the actual userId
    const userRecord = await db.query.user.findFirst({
      where: eq(user.email, customerData.email),
    });

    if (!userRecord) {
      console.error('User not found for email:', customerData.email);
      return;
    }

    await db.insert(subscription).values({
      id: subscriptionData.id,
      userId: userRecord.id,
      polarSubscriptionId: subscriptionData.id,
      polarCustomerId: customerData.id,
      status: subscriptionData.status,
      plan: plan,
      currentPeriodStart: subscriptionData.current_period_start
        ? new Date(subscriptionData.current_period_start)
        : null,
      currentPeriodEnd: subscriptionData.current_period_end
        ? new Date(subscriptionData.current_period_end)
        : null,
      cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
    });

    // Initialize usage quota for the user's new plan
    await getOrCreateQuota(userRecord.id);

    // Log the subscription creation
    await logSubscriptionChange(userRecord.id, 'created', {
      plan,
      status: subscriptionData.status,
      subscriptionId: subscriptionData.id,
    });

    console.log('Subscription created successfully');
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(data: WebhookEventData) {
  try {
    const subscriptionData = data.subscription;

    if (!subscriptionData) {
      console.error('Missing subscription data in webhook');
      return;
    }

    const plan = getPlanName(subscriptionData.product_id);

    console.log('Updating subscription:', subscriptionData.id);
    console.log('Product ID from webhook:', subscriptionData.product_id);
    console.log('Resolved plan from getPlanName:', plan);

    // Get existing subscription to track changes
    const existing = await db.query.subscription.findFirst({
      where: eq(subscription.polarSubscriptionId, subscriptionData.id),
    });

    await db
      .update(subscription)
      .set({
        status: subscriptionData.status,
        plan: plan,
        currentPeriodStart: subscriptionData.current_period_start
          ? new Date(subscriptionData.current_period_start)
          : null,
        currentPeriodEnd: subscriptionData.current_period_end
          ? new Date(subscriptionData.current_period_end)
          : null,
        cancelAtPeriodEnd: subscriptionData.cancel_at_period_end || false,
        updatedAt: new Date(),
      })
      .where(eq(subscription.polarSubscriptionId, subscriptionData.id));

    // Update usage quota if plan changed
    if (existing && existing.plan !== plan) {
      await getOrCreateQuota(existing.userId);
    }

    // Log the subscription update
    if (existing) {
      await logSubscriptionChange(
        existing.userId,
        'updated',
        {
          plan,
          status: subscriptionData.status,
          subscriptionId: subscriptionData.id,
        },
        {
          before: { plan: existing.plan, status: existing.status },
          after: { plan, status: subscriptionData.status },
        },
      );
    }

    console.log('Subscription updated successfully');
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionCanceled(data: WebhookEventData) {
  try {
    const subscriptionData = data.subscription;

    if (!subscriptionData) {
      console.error('Missing subscription data in webhook');
      return;
    }

    console.log('Canceling subscription:', subscriptionData.id);

    // Get existing subscription
    const existing = await db.query.subscription.findFirst({
      where: eq(subscription.polarSubscriptionId, subscriptionData.id),
    });

    await db
      .update(subscription)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscription.polarSubscriptionId, subscriptionData.id));

    // Log the subscription cancellation
    if (existing) {
      await logSubscriptionChange(existing.userId, 'canceled', {
        plan: existing.plan,
        status: 'canceled',
        subscriptionId: subscriptionData.id,
      });
    }

    console.log('Subscription canceled successfully');
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

export async function POST(req: NextRequest) {
  console.log('=== POLAR WEBHOOK RECEIVED ===');
  console.log('Headers:', Object.fromEntries(req.headers.entries()));

  try {
    const body = await req.text();
    console.log('Raw body length:', body.length);
    console.log('Raw body preview:', body.substring(0, 500));

    const signature = req.headers.get('polar-signature-256');
    console.log('Signature present:', !!signature);

    if (!signature) {
      console.error('Missing signature header');
      return new NextResponse('Missing signature', { status: 400 });
    }

    const secret = process.env.POLAR_WEBHOOK_SECRET;
    console.log('Webhook secret configured:', !!secret);

    if (!secret) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature, secret);
    console.log('Signature verification result:', isValid);

    if (!isValid) {
      console.error('Invalid signature - verification failed');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Parsed event type:', event.type);
    console.log('Event data keys:', Object.keys(event.data || {}));

    // Handle different event types
    switch (event.type) {
      case 'subscription.created':
        console.log(
          'Subscription created:',
          JSON.stringify(event.data, null, 2),
        );
        await handleSubscriptionCreated(event.data);
        break;
      case 'subscription.updated':
        console.log(
          'Subscription updated:',
          JSON.stringify(event.data, null, 2),
        );
        await handleSubscriptionUpdated(event.data);
        break;
      case 'subscription.canceled':
        console.log(
          'Subscription canceled:',
          JSON.stringify(event.data, null, 2),
        );
        await handleSubscriptionCanceled(event.data);
        break;
      case 'order.created':
        console.log('Order created:', JSON.stringify(event.data, null, 2));
        // Order handling can be added later if needed
        break;
      default:
        console.log('Unhandled event type:', event.type);
        console.log('Full event data:', JSON.stringify(event, null, 2));
    }

    console.log('=== WEBHOOK PROCESSING COMPLETE ===');
    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    console.error(
      'Error stack:',
      error instanceof Error ? error.stack : 'No stack trace',
    );
    return new NextResponse('Internal server error', { status: 500 });
  }
}
