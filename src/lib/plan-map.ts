export const PRODUCT_MAP: Record<string, string> = {
  [process.env.POLAR_PRODUCT_FREE!]: 'Free',
  [process.env.POLAR_PRODUCT_PRO!]: 'Pro',
  [process.env.POLAR_PRODUCT_STARTUP!]: 'Startup',
};

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
