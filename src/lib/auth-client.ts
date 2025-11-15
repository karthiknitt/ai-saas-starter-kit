import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: process.env.BETTER_AUTH_URL as string,
});

// Available plan product IDs
const polarProductFree = process.env.POLAR_PRODUCT_FREE;
const polarProductPro = process.env.POLAR_PRODUCT_PRO;
const polarProductStartup = process.env.POLAR_PRODUCT_STARTUP;

if (!polarProductFree || !polarProductPro || !polarProductStartup) {
  throw new Error('Missing required POLAR_PRODUCT environment variables');
}

export const PLAN_PRODUCT_IDS = {
  FREE: polarProductFree,
  PRO: polarProductPro,
  STARTUP: polarProductStartup,
} as const;
