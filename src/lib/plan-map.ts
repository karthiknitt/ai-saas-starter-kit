// Validate required environment variables at startup
function validateEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Define plan types for better type safety
type PlanType = 'Free' | 'Pro' | 'Startup';

// Construct the product map with validated environment variables
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

// Helper function to get plan name with better error handling
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
      key => key.includes(productId) || productId.includes(key),
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
