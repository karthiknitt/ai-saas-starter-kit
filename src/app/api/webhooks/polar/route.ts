/**
 * Polar payment webhook handler.
 *
 * This API route processes webhook events from Polar.sh for subscription management.
 * It handles subscription lifecycle events (created, updated, canceled) and maintains
 * synchronization between Polar and the local database.
 *
 * Security Features:
 * - HMAC-SHA256 signature verification for all webhooks
 * - Timing-safe signature comparison to prevent timing attacks
 * - Environment-based webhook secret configuration
 *
 * Supported Events:
 * - `subscription.created`: New subscription initiated
 * - `subscription.updated`: Subscription plan or status changed
 * - `subscription.canceled`: Subscription canceled by user
 * - `order.created`: One-time order created (logged but not processed)
 *
 * Environment Variables Required:
 * - POLAR_WEBHOOK_SECRET: Secret for verifying webhook signatures
 *
 * @module webhooks/polar
 * @see {@link https://docs.polar.sh/webhooks Polar Webhooks Documentation}
 */

import crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { subscription, user } from '@/db/schema';
import { logSubscriptionChange } from '@/lib/audit-logger';
import { getPlanName } from '@/lib/plan-map';
import { getOrCreateQuota } from '@/lib/usage-tracker';

/**
 * Polar subscription data structure from webhooks.
 *
 * @property {string} id - Unique subscription identifier
 * @property {string} product_id - Product ID (maps to plan in PRODUCT_MAP)
 * @property {string} status - Subscription status (active, canceled, past_due, etc.)
 * @property {string | null} [current_period_start] - ISO 8601 period start date
 * @property {string | null} [current_period_end] - ISO 8601 period end date
 * @property {boolean} [cancel_at_period_end] - Whether subscription cancels at period end
 */
interface PolarSubscription {
  id: string;
  product_id: string;
  status: string;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end?: boolean;
}

/**
 * Polar customer data structure from webhooks.
 *
 * @property {string} id - Unique customer identifier in Polar
 * @property {string} email - Customer email address (used to match local users)
 */
interface PolarCustomer {
  id: string;
  email: string;
}

/**
 * Webhook event payload data.
 *
 * @property {PolarSubscription} [subscription] - Subscription data (if event is subscription-related)
 * @property {PolarCustomer} [customer] - Customer data
 */
interface WebhookEventData {
  subscription?: PolarSubscription;
  customer?: PolarCustomer;
  [key: string]: unknown;
}

/**
 * Verifies the HMAC-SHA256 signature of a Polar webhook.
 *
 * Polar signs webhooks with HMAC-SHA256 and sends the signature in the
 * `polar-signature-256` header with format "v1,<base64_signature>".
 *
 * This function:
 * 1. Strips the "v1," prefix from the signature
 * 2. Decodes the base64 signature
 * 3. Computes HMAC-SHA256 over the raw body
 * 4. Performs timing-safe comparison to prevent timing attacks
 *
 * @param {string} body - Raw request body (as text, not parsed JSON)
 * @param {string} signature - Signature from polar-signature-256 header
 * @param {string} secret - Webhook secret from POLAR_WEBHOOK_SECRET env var
 * @returns {boolean} True if signature is valid, false otherwise
 *
 * @example
 * ```typescript
 * const isValid = verifyWebhookSignature(
 *   rawBody,
 *   'v1,abc123...',
 *   process.env.POLAR_WEBHOOK_SECRET
 * );
 * ```
 */
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

/**
 * Handles the `subscription.created` webhook event.
 *
 * When a user successfully completes checkout and a subscription is created in Polar:
 * 1. Finds the user by email from customer data
 * 2. Creates a subscription record in the local database
 * 3. Initializes usage quota for the user's plan
 * 4. Logs the subscription creation to audit logs
 *
 * @param {WebhookEventData} data - Webhook event data
 * @returns {Promise<void>}
 *
 * @example
 * Event payload structure:
 * ```json
 * {
 *   "subscription": {
 *     "id": "sub_123",
 *     "product_id": "prod_abc",
 *     "status": "active",
 *     "current_period_start": "2024-01-01T00:00:00Z",
 *     "current_period_end": "2024-02-01T00:00:00Z"
 *   },
 *   "customer": {
 *     "id": "cus_456",
 *     "email": "user@example.com"
 *   }
 * }
 * ```
 */
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

/**
 * Handles the `subscription.updated` webhook event.
 *
 * Triggered when subscription details change (plan upgrade/downgrade, status change, etc.):
 * 1. Updates the subscription record in the local database
 * 2. Refreshes usage quota if the plan changed
 * 3. Logs the subscription update with before/after states
 *
 * Common update scenarios:
 * - Plan upgrade (Free → Pro)
 * - Plan downgrade (Pro → Free)
 * - Status change (active → past_due)
 * - Period renewal
 *
 * @param {WebhookEventData} data - Webhook event data
 * @returns {Promise<void>}
 */
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

/**
 * Handles the `subscription.canceled` webhook event.
 *
 * When a user cancels their subscription:
 * 1. Updates subscription status to 'canceled'
 * 2. Sets cancelAtPeriodEnd flag
 * 3. Logs the cancellation to audit logs
 *
 * Note: The subscription typically remains active until the end of the billing period.
 *
 * @param {WebhookEventData} data - Webhook event data
 * @returns {Promise<void>}
 */
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

/**
 * POST /api/webhooks/polar
 *
 * Webhook endpoint for receiving and processing Polar payment events.
 *
 * Request Flow:
 * 1. Extract raw body and signature header
 * 2. Verify webhook signature using HMAC-SHA256
 * 3. Parse event payload
 * 4. Route to appropriate handler based on event type
 * 5. Return 200 OK to acknowledge receipt
 *
 * Security:
 * - All webhooks must have a valid signature or are rejected with 401
 * - Uses timing-safe comparison to prevent timing attacks
 * - Logs all webhook activity for debugging and security auditing
 *
 * Error Handling:
 * - 400: Missing signature header
 * - 401: Invalid signature
 * - 500: Server configuration error or processing error
 * - 200: Successfully processed (even if event type is unhandled)
 *
 * @param {NextRequest} req - Next.js request object
 * @returns {Promise<NextResponse>} HTTP response
 *
 * @example
 * Configure this endpoint in Polar dashboard:
 * - URL: https://your-domain.com/api/webhooks/polar
 * - Secret: Same as POLAR_WEBHOOK_SECRET environment variable
 * - Events: subscription.created, subscription.updated, subscription.canceled
 */
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
