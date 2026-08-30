import Razorpay from 'razorpay';

/**
 * Initialize Razorpay SDK client.
 *
 * Requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.
 * Keys are available in the Razorpay Dashboard under Settings > API Keys.
 */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID as string,
  key_secret: process.env.RAZORPAY_KEY_SECRET as string,
});

/**
 * Plan to Razorpay Plan ID mapping.
 *
 * Razorpay Plans are recurring billing templates created in the Razorpay
 * Dashboard (or via the Plans API). Each subscription plan maps to a Plan ID.
 */
export const PLAN_TO_PLAN_ID: Record<
  'free' | 'pro' | 'startup',
  string | undefined
> = {
  free: process.env.RAZORPAY_PLAN_FREE,
  pro: process.env.RAZORPAY_PLAN_PRO,
  startup: process.env.RAZORPAY_PLAN_STARTUP,
};

/** Number of billing cycles for subscriptions (12 months) */
const TOTAL_BILLING_CYCLES = 12;

export interface CheckoutOptions {
  plan: 'free' | 'pro' | 'startup';
  customerEmail: string;
  successUrl?: string;
}

/**
 * Create a checkout session for a subscription plan.
 *
 * Creates a Razorpay subscription linked to the plan's Plan ID and returns
 * the hosted checkout page URL (short_url). The userId/email are stored in
 * subscription notes so webhook events can be attributed to the user.
 *
 * @param options - Checkout configuration options
 * @returns Checkout URL to redirect the user to
 */
export async function createCheckoutSession(
  options: CheckoutOptions,
): Promise<string> {
  const { plan, customerEmail, successUrl } = options;

  const planId = PLAN_TO_PLAN_ID[plan];
  if (!planId) {
    throw new Error(
      `Plan ID not configured for plan: ${plan}. Please set RAZORPAY_PLAN_${plan.toUpperCase()} in your environment variables.`,
    );
  }

  // Free plan doesn't require checkout
  if (plan === 'free') {
    throw new Error('Free plan does not require checkout');
  }

  try {
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      total_count: TOTAL_BILLING_CYCLES,
      customer_notify: 1,
      notes: {
        customerEmail,
        successUrl:
          successUrl || `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
      },
    });

    if (!subscription.short_url) {
      throw new Error('No checkout URL returned from Razorpay');
    }

    return subscription.short_url;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw new Error(
      `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Get subscription by ID from Razorpay.
 * @param subscriptionId - The Razorpay subscription ID (sub_xxxx)
 */
export async function getSubscription(subscriptionId: string) {
  try {
    return await razorpay.subscriptions.fetch(subscriptionId);
  } catch (error) {
    console.error('Failed to get subscription:', error);
    throw new Error(
      `Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Cancel a subscription at the end of the current billing cycle.
 *
 * Pass `immediate: true` to cancel immediately instead.
 *
 * @param subscriptionId - The Razorpay subscription ID to cancel
 * @param immediate - Cancel immediately instead of at cycle end
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediate = false,
) {
  try {
    return await razorpay.subscriptions.cancel(subscriptionId, !immediate);
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw new Error(
      `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * List all plans from Razorpay.
 * Useful for debugging and verification.
 */
export async function listPlans() {
  try {
    return await razorpay.plans.all();
  } catch (error) {
    console.error('Failed to list plans:', error);
    throw new Error(
      `Failed to list plans: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export { razorpay };
