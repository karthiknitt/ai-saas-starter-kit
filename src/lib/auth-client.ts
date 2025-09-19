import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL as string,
});

// Polar Client for Better Auth integration
export class PolarClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Create subscription checkout
  async createCheckout(productId: string) {
    try {
      // Redirect to Polar checkout page
      window.location.href = `https://polar.sh/checkout/${productId}?access_token=${this.accessToken}`;
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  }

  // Get customer portal link
  async createCustomerPortal() {
    try {
      // This would typically call Polar's customer portal API
      console.log('Opening customer portal');
      // Implementation depends on Polar's customer portal API
    } catch (error) {
      console.error('Error accessing customer portal:', error);
      throw error;
    }
  }
}

// Create Polar client instance
export const polarClient = new PolarClient(process.env.POLAR_ACCESS_TOKEN!);

// Available plan product IDs
export const PLAN_PRODUCT_IDS = {
  FREE: process.env.POLAR_PRODUCT_FREE!,
  PRO: process.env.POLAR_PRODUCT_PRO!,
  STARTUP: process.env.POLAR_PRODUCT_STARTUP!,
} as const;
