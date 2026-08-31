/**
 * Subscription plan mapping and validation utilities.
 *
 * This module maps Razorpay plan IDs to human-readable plan names (Free, Pro, Startup).
 * It validates required environment variables at startup and provides safe fallbacks
 * for development environments.
 *
 * Environment Variables Required:
 * - RAZORPAY_PLAN_FREE: Razorpay plan ID for the Free plan
 * - RAZORPAY_PLAN_PRO: Razorpay plan ID for the Pro plan
 * - RAZORPAY_PLAN_STARTUP: Razorpay plan ID for the Startup plan
 *
 * @module plan-map
 * @example
 * ```typescript
 * import { PRODUCT_MAP, getPlanName } from './plan-map';
 *
 * // Get plan name from plan ID
 * const planName = getPlanName('plan_abc123'); // => "Pro"
 *
 * // Check if a plan ID exists
 * if (PRODUCT_MAP['plan_abc123']) {
 *   console.log('Valid plan ID');
 * }
 * ```
 */

/**
 * Validates that a required environment variable is set.
 *
 * @param {string} name - Name of the environment variable
 * @returns {string} The environment variable value
 * @throws {Error} If the environment variable is not set
 *
 * @example
 * ```typescript
 * const apiKey = validateEnvVar('API_KEY');
 * ```
 */
function validateEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * Supported subscription plan types.
 * - `Free`: Free tier with basic features
 * - `Pro`: Professional tier with advanced features
 * - `Startup`: Startup tier for growing businesses
 */
type PlanType = 'Free' | 'Pro' | 'Startup';

/**
 * Maps Razorpay plan IDs to plan names.
 *
 * The map is built lazily on first use (not at module evaluation) so that
 * `next build` page-data collection succeeds in environments where the
 * RAZORPAY_PLAN_* variables are not set. Missing variables still fail fast
 * in production at request time.
 *
 * @type {Record<string, PlanType>}
 * @example
 * ```typescript
 * // Check if a plan ID is mapped to a plan
 * if (getProductMap()['plan_abc123']) {
 *   console.log(`Plan: ${getProductMap()['plan_abc123']}`);
 * }
 *
 * // Get all valid plan IDs
 * const validPlanIds = Object.keys(getProductMap());
 * ```
 */
let productMapCache: Record<string, PlanType> | null = null;

export function getProductMap(): Record<string, PlanType> {
  if (!productMapCache) {
    productMapCache = buildProductMap();
  }
  return productMapCache;
}

function buildProductMap(): Record<string, PlanType> {
  try {
    const free = validateEnvVar('RAZORPAY_PLAN_FREE');
    const pro = validateEnvVar('RAZORPAY_PLAN_PRO');
    const startup = validateEnvVar('RAZORPAY_PLAN_STARTUP');

    return {
      [free]: 'Free',
      [pro]: 'Pro',
      [startup]: 'Startup',
    };
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'production') {
      throw error; // Fail fast in production (at request time)
    }
    console.error(
      `Error constructing PRODUCT_MAP: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Return a minimal map for development to allow partial functionality
    return {};
  }
}

/**
 * Gets the plan name for a given Razorpay plan ID with robust error handling.
 *
 * This function:
 * - Returns the mapped plan name if found
 * - Attempts partial matching if exact match fails
 * - Returns "Unknown Plan" as a safe fallback
 * - Logs warnings for debugging purposes
 *
 * @param {string | undefined | null} planId - Razorpay plan ID
 * @returns {string} Plan name (Free/Pro/Startup) or "Unknown Plan"
 *
 * @example
 * ```typescript
 * // Valid plan ID
 * const plan = getPlanName('plan_abc123');
 * console.log(plan); // => "Pro"
 *
 * // Invalid or missing plan ID
 * const unknownPlan = getPlanName(null);
 * console.log(unknownPlan); // => "Unknown Plan"
 *
 * // Use in subscription context
 * const userPlan = getPlanName(subscription?.planId);
 * if (userPlan === 'Pro') {
 *   // Grant pro features
 * }
 * ```
 */
export function getPlanName(planId: string | undefined | null): string {
  if (!planId) {
    console.warn('No plan ID provided to getPlanName');
    return 'Unknown Plan';
  }

  const productMap = getProductMap();
  const planName = productMap[planId];
  if (!planName) {
    console.warn(`Plan ID ${planId} not found in PRODUCT_MAP`);
    console.log('Available PRODUCT_MAP keys:', Object.keys(productMap));

    // Try to match by partial ID or provide fallback
    const partialMatch = Object.keys(productMap).find(
      (key) => key.includes(planId) || planId.includes(key),
    );

    if (partialMatch) {
      console.log(
        `Found partial match: ${partialMatch} -> ${productMap[partialMatch]}`,
      );
      return productMap[partialMatch];
    }

    return 'Unknown Plan';
  }

  return planName;
}
