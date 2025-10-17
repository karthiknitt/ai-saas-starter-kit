import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL as string,
});

// Available plan product IDs
export const PLAN_PRODUCT_IDS = {
  FREE: process.env.POLAR_PRODUCT_FREE!,
  PRO: process.env.POLAR_PRODUCT_PRO!,
  STARTUP: process.env.POLAR_PRODUCT_STARTUP!,
} as const;
