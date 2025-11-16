import { Polar } from '@polar-sh/sdk';

// Initialize Polar SDK client
const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN as string,
});

// Plan to Product ID mapping
export const PLAN_TO_PRODUCT_ID: Record<
  'free' | 'pro' | 'startup',
  string | undefined
> = {
  free: process.env.POLAR_PRODUCT_FREE,
  pro: process.env.POLAR_PRODUCT_PRO,
  startup: process.env.POLAR_PRODUCT_STARTUP,
};

export interface CheckoutOptions {
  plan: 'free' | 'pro' | 'startup';
  customerEmail: string;
  successUrl?: string;
}

/**
 * Create a checkout session for a subscription plan
 * @param options - Checkout configuration options
 * @returns Checkout URL to redirect the user to
 */
export async function createCheckoutSession(
  options: CheckoutOptions,
): Promise<string> {
  const { plan, customerEmail, successUrl } = options;

  // Get product ID for the plan
  const productId = PLAN_TO_PRODUCT_ID[plan];
  if (!productId) {
    throw new Error(
      `Product ID not configured for plan: ${plan}. Please set POLAR_PRODUCT_${plan.toUpperCase()} in your environment variables.`,
    );
  }

  // Free plan doesn't require checkout
  if (plan === 'free') {
    throw new Error('Free plan does not require checkout');
  }

  try {
    // Create checkout session using Polar SDK
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail,
      successUrl:
        successUrl ||
        process.env.POLAR_SUCCESS_URL ||
        `${process.env.NEXT_PUBLIC_URL}/billing?success=true`,
    });

    // Return the checkout URL
    if (!checkout.url) {
      throw new Error('No checkout URL returned from Polar');
    }

    return checkout.url;
  } catch (error) {
    console.error('Failed to create checkout session:', error);
    throw new Error(
      `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Get checkout session by ID
 * @param checkoutId - The checkout session ID
 */
export async function getCheckoutSession(checkoutId: string) {
  try {
    const checkout = await polar.checkouts.get({ id: checkoutId });
    return checkout;
  } catch (error) {
    console.error('Failed to get checkout session:', error);
    throw new Error(
      `Failed to get checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * List all products from Polar
 * Useful for debugging and verification
 */
export async function listProducts(organizationId?: string) {
  try {
    const products = await polar.products.list({
      organizationId,
      page: 1,
    });
    return products;
  } catch (error) {
    console.error('Failed to list products:', error);
    throw new Error(
      `Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Get subscription by ID
 * @param subscriptionId - The subscription ID
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await polar.subscriptions.get({ id: subscriptionId });
    return subscription;
  } catch (error) {
    console.error('Failed to get subscription:', error);
    throw new Error(
      `Failed to get subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Cancel a subscription (revoke immediately)
 * @param subscriptionId - The subscription ID to cancel
 */
export async function cancelSubscription(subscriptionId: string) {
  try {
    const subscription = await polar.subscriptions.revoke({
      id: subscriptionId,
    });
    return subscription;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    throw new Error(
      `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

export { polar };
