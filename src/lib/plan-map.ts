/**
 * Subscription plan mapping and validation utilities.
 *
 * This module maps Polar product IDs to human-readable plan names (Free, Pro, Startup).
 * It validates required environment variables at startup and provides safe fallbacks
 * for development environments.
 *
 * Environment Variables Required:
 * - POLAR_PRODUCT_FREE: Polar product ID for the Free plan
 * - POLAR_PRODUCT_PRO: Polar product ID for the Pro plan
 * - POLAR_PRODUCT_STARTUP: Polar product ID for the Startup plan
 *
 * @module plan-map
 * @example
 * ```typescript
 * import { PRODUCT_MAP, getPlanName } from './plan-map';
 *
 * // Get plan name from product ID
 * const planName = getPlanName('prod_abc123'); // => "Pro"
 *
 * // Check if a product ID exists
 * if (PRODUCT_MAP['prod_abc123']) {
 *   console.log('Valid product ID');
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
 * Maps Polar product IDs to plan names.
 *
 * This map is constructed at module load using environment variables.
 * In production, missing variables will cause the application to fail fast.
 * In development, an empty map is returned to allow partial functionality.
 *
 * @type {Record<string, PlanType>}
 * @example
 * ```typescript
 * // Check if a product ID is mapped to a plan
 * if (PRODUCT_MAP['prod_abc123']) {
 *   console.log(`Plan: ${PRODUCT_MAP['prod_abc123']}`);
 * }
 *
 * // Get all valid product IDs
 * const validProductIds = Object.keys(PRODUCT_MAP);
 * ```
 */
export const PRODUCT_MAP: Record<string, PlanType> = (() => {
  try {
    const free = validateEnvVar('POLAR_PRODUCT_FREE');
    const pro = validateEnvVar('POLAR_PRODUCT_PRO');
    const startup = validateEnvVar('POLAR_PRODUCT_STARTUP');

    return {
      [free]: 'Free',
      [pro]: 'Pro',
      [startup]: 'Startup',
    };
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'production') {
      throw error; // Fail fast in production
    }
    console.error(
      `Error constructing PRODUCT_MAP: ${error instanceof Error ? error.message : String(error)}`,
    );
    // Return a minimal map for development to allow partial functionality
    return {};
  }
})();

/**
 * Gets the plan name for a given Polar product ID with robust error handling.
 *
 * This function:
 * - Returns the mapped plan name if found
 * - Attempts partial matching if exact match fails
 * - Returns "Unknown Plan" as a safe fallback
 * - Logs warnings for debugging purposes
 *
 * @param {string | undefined | null} productId - Polar product ID
 * @returns {string} Plan name (Free/Pro/Startup) or "Unknown Plan"
 *
 * @example
 * ```typescript
 * // Valid product ID
 * const plan = getPlanName('prod_abc123');
 * console.log(plan); // => "Pro"
 *
 * // Invalid or missing product ID
 * const unknownPlan = getPlanName(null);
 * console.log(unknownPlan); // => "Unknown Plan"
 *
 * // Use in subscription context
 * const userPlan = getPlanName(subscription?.productId);
 * if (userPlan === 'Pro') {
 *   // Grant pro features
 * }
 * ```
 */
export function getPlanName(productId: string | undefined | null): string {
  if (!productId) {
    console.warn('No product ID provided to getPlanName');
    return 'Unknown Plan';
  }

  const planName = PRODUCT_MAP[productId];
  if (!planName) {
    console.warn(`Product ID ${productId} not found in PRODUCT_MAP`);
    console.log('Available PRODUCT_MAP keys:', Object.keys(PRODUCT_MAP));

    // Try to match by partial ID or provide fallback
    const partialMatch = Object.keys(PRODUCT_MAP).find(
      (key) => key.includes(productId) || productId.includes(key),
    );

    if (partialMatch) {
      console.log(
        `Found partial match: ${partialMatch} -> ${PRODUCT_MAP[partialMatch]}`,
      );
      return PRODUCT_MAP[partialMatch];
    }

    return 'Unknown Plan';
  }

  return planName;
}
