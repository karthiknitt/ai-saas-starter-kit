import { eq } from 'drizzle-orm';
import { db } from '@/db/drizzle';
import { subscription as subscriptionTable } from '@/db/schema';

/**
 * Plan feature definitions
 * Defines limits and capabilities for each subscription tier
 */
export const PLAN_FEATURES = {
  free: {
    aiRequests: 10, // requests per month
    models: ['gpt-3.5-turbo'], // allowed AI models
    apiKeys: 1, // number of API keys allowed
    storage: 100, // MB
    displayName: 'Free',
    price: 0,
  },
  pro: {
    aiRequests: 1000,
    models: [
      'gpt-3.5-turbo',
      'gpt-4',
      'gpt-4-turbo',
      'claude-3-5-sonnet-20241022',
    ],
    apiKeys: 5,
    storage: 10240, // 10GB
    displayName: 'Pro',
    price: 19,
  },
  startup: {
    aiRequests: -1, // unlimited
    models: ['*'], // all models
    apiKeys: -1, // unlimited
    storage: -1, // unlimited
    displayName: 'Startup',
    price: 29,
  },
} as const;

export type PlanName = keyof typeof PLAN_FEATURES;
export type PlanFeatures = (typeof PLAN_FEATURES)[PlanName];

/**
 * Get user's current subscription plan
 * Returns 'free' if no active subscription found
 */
export async function getUserPlan(userId: string): Promise<PlanName> {
  try {
    const subscription = await db.query.subscription.findFirst({
      where: eq(subscriptionTable.userId, userId),
    });

    // If no subscription or inactive, default to free
    if (!subscription || subscription.status !== 'active') {
      return 'free';
    }

    // Validate plan name
    const planName = subscription.plan.toLowerCase();
    if (planName in PLAN_FEATURES) {
      return planName as PlanName;
    }

    return 'free';
  } catch (error) {
    console.error('Error fetching user plan:', error);
    return 'free';
  }
}

/**
 * Get plan features for a user
 */
export async function getUserPlanFeatures(
  userId: string,
): Promise<PlanFeatures> {
  const plan = await getUserPlan(userId);
  return PLAN_FEATURES[plan];
}

/**
 * Check if user has access to a specific AI model
 */
export async function hasModelAccess(
  userId: string,
  modelId: string,
): Promise<boolean> {
  const features = await getUserPlanFeatures(userId);

  // Check for wildcard (all models)
  if (features.models.some((model) => model === '*')) {
    return true;
  }

  // Check if model is in allowed list
  return features.models.some((model) => model === modelId);
}

/**
 * Get list of allowed models for user's plan
 */
export async function getAllowedModels(userId: string): Promise<string[]> {
  const features = await getUserPlanFeatures(userId);
  return [...features.models];
}

/**
 * Check if user can create more API keys
 */
export async function canCreateApiKey(
  userId: string,
  currentKeyCount: number,
): Promise<boolean> {
  const features = await getUserPlanFeatures(userId);

  // Unlimited API keys
  if (features.apiKeys === -1) {
    return true;
  }

  return currentKeyCount < features.apiKeys;
}

/**
 * Get AI request limit for user's plan
 * Returns -1 for unlimited
 */
export async function getAiRequestLimit(userId: string): Promise<number> {
  const features = await getUserPlanFeatures(userId);
  return features.aiRequests;
}

/**
 * Check if user's plan allows unlimited AI requests
 */
export async function hasUnlimitedAiRequests(userId: string): Promise<boolean> {
  const limit = await getAiRequestLimit(userId);
  return limit === -1;
}

/**
 * Get storage limit in MB for user's plan
 * Returns -1 for unlimited
 */
export async function getStorageLimit(userId: string): Promise<number> {
  const features = await getUserPlanFeatures(userId);
  return features.storage;
}

/**
 * Check if plan upgrade is needed for a feature
 */
export function getUpgradePlan(currentPlan: PlanName): PlanName | null {
  switch (currentPlan) {
    case 'free':
      return 'pro';
    case 'pro':
      return 'startup';
    case 'startup':
      return null; // Already on highest plan
    default:
      return 'pro';
  }
}

/**
 * Get all available plans for display
 */
export function getAllPlans() {
  return Object.entries(PLAN_FEATURES).map(([key, features]) => ({
    id: key,
    name: features.displayName,
    price: features.price,
    features: features,
  }));
}

/**
 * Check if user can perform an action based on their plan
 */
export async function checkFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures,
): Promise<{ allowed: boolean; limit?: number; current?: number }> {
  const features = await getUserPlanFeatures(userId);
  const featureValue = features[feature];

  // For number features, return the limit
  if (typeof featureValue === 'number') {
    return {
      allowed: featureValue === -1 || featureValue > 0,
      limit: featureValue === -1 ? Infinity : featureValue,
    };
  }

  // For array features (like models), return access status
  if (Array.isArray(featureValue)) {
    return {
      allowed: featureValue.length > 0,
    };
  }

  return { allowed: true };
}
