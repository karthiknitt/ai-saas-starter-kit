/**
 * Razorpay payment webhook handler.
 *
 * This API route processes webhook events from Razorpay for subscription management.
 * It handles subscription lifecycle events and maintains synchronization between
 * Razorpay and the local database.
 *
 * Security Features:
 * - HMAC-SHA256 signature verification for all webhooks
 * - Timing-safe signature comparison to prevent timing attacks
 * - Environment-based webhook secret configuration
 *
 * Supported Events:
 * - `subscription.activated`: Subscription activated after first successful payment
 * - `subscription.charged`: Recurring charge succeeded (renewal)
 * - `subscription.updated`: Subscription details changed (incl. scheduled cancellation)
 * - `subscription.cancelled`: Subscription canceled by user or merchant
 * - `subscription.completed`: Subscription finished all billing cycles
 * - `payment.failed`: Payment failure (logged only)
 *
 * Environment Variables Required:
 * - RAZORPAY_WEBHOOK_SECRET: Secret for verifying webhook signatures
 *
 * Configure this endpoint in the Razorpay Dashboard (Settings > Webhooks):
 * - URL: https://your-domain.com/api/webhooks/razorpay
 * - Secret: Same as RAZORPAY_WEBHOOK_SECRET environment variable
 * - Active events: subscription.*, payment.failed
 *
 * @module webhooks/razorpay
 * @see {@link https://razorpay.com/docs/webhooks/ Razorpay Webhooks Documentation}
 */

import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { subscription, user } from '@/db/schema';
import { logSubscriptionChange } from '@/lib/audit-logger';
import { emailService } from '@/lib/email-service';
import { getPlanName } from '@/lib/plan-map';
import { getOrCreateQuota } from '@/lib/usage-tracker';

/**
 * Razorpay subscription entity from webhooks (subset of fields used).
 *
 * @property {string} id - Unique subscription identifier (sub_xxxx)
 * @property {string} plan_id - Razorpay Plan ID (maps to plan in PRODUCT_MAP)
 * @property {string} status - Subscription status (active, cancelled, completed, etc.)
 * @property {number | null} [current_start] - Unix epoch seconds for period start
 * @property {number | null} [current_end] - Unix epoch seconds for period end
 * @property {boolean} [has_scheduled_changes] - Whether a change (e.g. cancellation) is scheduled
 * @property {Record<string, string>} [notes] - Custom notes (contains customerEmail set at checkout)
 */
interface RazorpaySubscription {
  id: string;
  plan_id: string;
  status: string;
  current_start?: number | null;
  current_end?: number | null;
  has_scheduled_changes?: boolean;
  notes?: Record<string, string>;
}

/**
 * Webhook event payload structure.
 *
 * Razorpay wraps resource data under `payload.<resource>.entity`.
 */
interface RazorpayWebhookEvent {
  event: string;
  payload: {
    subscription?: { entity: RazorpaySubscription };
    payment?: { entity: { id: string; status: string } };
  };
}

/**
 * Razorpay status to local status mapping.
 * Razorpay uses "cancelled" (double L) while the app uses "canceled".
 */
const STATUS_MAP: Record<string, string> = {
  cancelled: 'canceled',
};

function toLocalStatus(status: string): string {
  return STATUS_MAP[status] ?? status;
}

/**
 * Converts a Razorpay Unix epoch timestamp (seconds) to a Date.
 */
function toDate(epochSeconds?: number | null): Date | null {
  return typeof epochSeconds === 'number'
    ? new Date(epochSeconds * 1000)
    : null;
}

/**
 * Verifies the HMAC-SHA256 signature of a Razorpay webhook.
 *
 * Razorpay signs webhooks with HMAC-SHA256 over the raw request body and
 * sends the hex-encoded signature in the `x-razorpay-signature` header.
 * The comparison is timing-safe to prevent timing attacks.
 *
 * @param body - Raw request body (as text, not parsed JSON)
 * @param signature - Signature from x-razorpay-signature header (hex)
 * @param secret - Webhook secret from RAZORPAY_WEBHOOK_SECRET env var
 * @returns True if signature is valid, false otherwise
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('hex');

    const receivedBuffer = Buffer.from(signature, 'hex');
    const computedBuffer = Buffer.from(computedSignature, 'hex');

    if (
      receivedBuffer.length !== computedBuffer.length ||
      receivedBuffer.length === 0
    ) {
      return false;
    }

    return crypto.timingSafeEqual(computedBuffer, receivedBuffer);
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

/**
 * Resolves the local user for a Razorpay subscription using checkout notes.
 *
 * At checkout time we store the customer email in subscription notes.
 */
async function resolveUser(
  subscriptionData: RazorpaySubscription,
): Promise<typeof user.$inferSelect | null> {
  const email = subscriptionData.notes?.customerEmail;
  if (!email) {
    console.error(
      'Missing customerEmail note on subscription:',
      subscriptionData.id,
    );
    return null;
  }

  const userRecord = await db.query.user.findFirst({
    where: eq(user.email, email),
  });

  if (!userRecord) {
    console.error('User not found for email:', email);
    return null;
  }

  return userRecord;
}

/**
 * Handles the `subscription.activated` webhook event.
 *
 * 1. Finds the user by email from subscription notes
 * 2. Creates a subscription record in the local database
 * 3. Initializes usage quota for the user's plan
 * 4. Logs the subscription creation and sends a confirmation email
 */
async function handleSubscriptionActivated(
  subscriptionData: RazorpaySubscription,
) {
  try {
    const plan = getPlanName(subscriptionData.plan_id);
    const status = toLocalStatus(subscriptionData.status);

    console.log('Activating subscription:', subscriptionData.id);
    console.log('Plan ID from webhook:', subscriptionData.plan_id);
    console.log('Resolved plan from getPlanName:', plan);

    const userRecord = await resolveUser(subscriptionData);
    if (!userRecord) {
      return;
    }

    await db.insert(subscription).values({
      id: subscriptionData.id,
      userId: userRecord.id,
      razorpaySubscriptionId: subscriptionData.id,
      razorpayCustomerId: subscriptionData.notes?.customerId ?? 'api',
      status,
      plan,
      currentPeriodStart: toDate(subscriptionData.current_start),
      currentPeriodEnd: toDate(subscriptionData.current_end),
      cancelAtPeriodEnd: subscriptionData.has_scheduled_changes || false,
    });

    // Initialize usage quota for the user's new plan
    await getOrCreateQuota(userRecord.id);

    // Invalidate the cached plan so next request reads fresh data
    revalidateTag(`user-plan:${userRecord.id}`, { expire: 0 });

    // Log the subscription creation
    await logSubscriptionChange(userRecord.id, 'created', {
      plan,
      status,
      subscriptionId: subscriptionData.id,
    });

    // Send subscription confirmation email
    await emailService.sendSubscriptionConfirmation({
      to: userRecord.email,
      username: userRecord.name || 'there',
      planName: plan,
      billingCycle: 'Monthly',
      nextBillingDate:
        toDate(subscriptionData.current_end)?.toLocaleDateString() || 'N/A',
      amount: plan === 'Pro' ? '$29/month' : '$99/month',
    });

    console.log('Subscription activated successfully');
  } catch (error) {
    console.error('Error handling subscription activated:', error);
  }
}

/**
 * Handles `subscription.updated` and `subscription.charged` webhook events.
 *
 * - Updates the subscription record in the local database
 * - Refreshes usage quota if the plan changed
 * - Sends a payment success email on renewals (charged events)
 * - Logs the subscription update with before/after states
 */
async function handleSubscriptionUpdated(
  subscriptionData: RazorpaySubscription,
  isRenewal = false,
) {
  try {
    const plan = getPlanName(subscriptionData.plan_id);
    const status = toLocalStatus(subscriptionData.status);

    console.log('Updating subscription:', subscriptionData.id);

    // Get existing subscription to track changes
    const existing = await db.query.subscription.findFirst({
      where: eq(subscription.razorpaySubscriptionId, subscriptionData.id),
    });

    if (!existing) {
      console.error(
        'Subscription not found in database, skipping update:',
        subscriptionData.id,
      );
      return;
    }

    await db
      .update(subscription)
      .set({
        status,
        plan,
        currentPeriodStart: toDate(subscriptionData.current_start),
        currentPeriodEnd: toDate(subscriptionData.current_end),
        cancelAtPeriodEnd: subscriptionData.has_scheduled_changes || false,
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    // Update usage quota if plan changed
    if (existing.plan !== plan) {
      await getOrCreateQuota(existing.userId);
    }

    // Invalidate the cached plan so next request reads fresh data
    revalidateTag(`user-plan:${existing.userId}`, { expire: 0 });
    // Also invalidate workspace cache if this is a workspace-level subscription
    if (existing.workspaceId) {
      revalidateTag(`workspace-sub:${existing.workspaceId}`, { expire: 0 });
    }

    // Log the subscription update
    await logSubscriptionChange(
      existing.userId,
      'updated',
      {
        plan,
        status,
        subscriptionId: subscriptionData.id,
      },
      {
        before: { plan: existing.plan, status: existing.status },
        after: { plan, status },
      },
    );

    // Send payment success email if this was a renewal charge
    if (isRenewal && status === 'active') {
      const userRecord = await db.query.user.findFirst({
        where: eq(user.id, existing.userId),
      });

      if (userRecord) {
        await emailService.sendPaymentSuccess({
          to: userRecord.email,
          username: userRecord.name || 'there',
          planName: plan,
          amount: plan === 'Pro' ? '$29' : '$99',
          paymentDate:
            toDate(subscriptionData.current_start)?.toLocaleDateString() ||
            new Date().toLocaleDateString(),
        });
      }
    }

    console.log('Subscription updated successfully');
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

/**
 * Handles `subscription.cancelled` and `subscription.completed` webhook events.
 *
 * 1. Updates subscription status to 'canceled'
 * 2. Invalidates caches
 * 3. Logs the cancellation and sends the cancellation email
 */
async function handleSubscriptionCanceled(
  subscriptionData: RazorpaySubscription,
) {
  try {
    console.log('Canceling subscription:', subscriptionData.id);

    // Get existing subscription
    const existing = await db.query.subscription.findFirst({
      where: eq(subscription.razorpaySubscriptionId, subscriptionData.id),
    });

    await db
      .update(subscription)
      .set({
        status: 'canceled',
        cancelAtPeriodEnd: true,
        updatedAt: new Date(),
      })
      .where(eq(subscription.razorpaySubscriptionId, subscriptionData.id));

    // Invalidate the cached plan so next request reflects canceled status
    if (existing) {
      revalidateTag(`user-plan:${existing.userId}`, { expire: 0 });
      // Also invalidate workspace cache if this is a workspace-level subscription
      if (existing.workspaceId) {
        revalidateTag(`workspace-sub:${existing.workspaceId}`, { expire: 0 });
      }
    }

    // Log the subscription cancellation
    if (existing) {
      await logSubscriptionChange(existing.userId, 'canceled', {
        plan: existing.plan,
        status: 'canceled',
        subscriptionId: subscriptionData.id,
      });

      // Send subscription cancelled email
      const userRecord = await db.query.user.findFirst({
        where: eq(user.id, existing.userId),
      });

      if (userRecord) {
        await emailService.sendSubscriptionCancelled({
          to: userRecord.email,
          username: userRecord.name || 'there',
          planName: existing.plan,
          endDate: existing.currentPeriodEnd
            ? existing.currentPeriodEnd.toLocaleDateString()
            : 'End of current period',
        });
      }
    }

    console.log('Subscription canceled successfully');
  } catch (error) {
    console.error('Error handling subscription canceled:', error);
  }
}

/**
 * POST /api/webhooks/razorpay
 *
 * Webhook endpoint for receiving and processing Razorpay payment events.
 *
 * Request Flow:
 * 1. Extract raw body and x-razorpay-signature header
 * 2. Verify webhook signature using HMAC-SHA256 (timing-safe)
 * 3. Parse event payload
 * 4. Route to appropriate handler based on event type
 * 5. Return 200 OK to acknowledge receipt
 *
 * Error Handling:
 * - 400: Missing signature header
 * - 401: Invalid signature
 * - 500: Server configuration error or processing error
 * - 200: Successfully processed (even if event type is unhandled)
 */
export async function POST(req: NextRequest) {
  console.log('=== RAZORPAY WEBHOOK RECEIVED ===');

  try {
    const body = await req.text();

    const signature = req.headers.get('x-razorpay-signature');
    console.log('Signature present:', !!signature);

    if (!signature) {
      console.error('Missing signature header');
      return new NextResponse('Missing signature', { status: 400 });
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    console.log('Webhook secret configured:', !!secret);

    if (!secret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new NextResponse('Server configuration error', { status: 500 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature, secret);
    console.log('Signature verification result:', isValid);

    if (!isValid) {
      console.error('Invalid signature - verification failed');
      return new NextResponse('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body) as RazorpayWebhookEvent;
    console.log('Parsed event type:', event.event);

    const subscriptionData = event.payload.subscription?.entity;

    // Handle different event types
    switch (event.event) {
      case 'subscription.activated':
        if (subscriptionData) {
          await handleSubscriptionActivated(subscriptionData);
        }
        break;
      case 'subscription.charged':
        if (subscriptionData) {
          await handleSubscriptionUpdated(subscriptionData, true);
        }
        break;
      case 'subscription.updated':
        if (subscriptionData) {
          await handleSubscriptionUpdated(subscriptionData);
        }
        break;
      case 'subscription.cancelled':
      case 'subscription.completed':
        if (subscriptionData) {
          await handleSubscriptionCanceled(subscriptionData);
        }
        break;
      case 'payment.failed':
        console.log(
          'Payment failed:',
          JSON.stringify(event.payload.payment?.entity ?? {}),
        );
        break;
      default:
        console.log('Unhandled event type:', event.event);
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
