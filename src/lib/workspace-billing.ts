/**
 * Workspace-Level Billing Management
 *
 * Handles workspace-level subscriptions and usage tracking.
 * Aggregates usage across all workspace members.
 *
 * @module lib/workspace-billing
 */

import 'server-only';
import { and, eq, sql } from 'drizzle-orm';
import { cache } from 'react';
import { db } from '@/db/drizzle';
import {
  subscription as subscriptionTable,
  usageLog,
  usageQuota,
  workspaceMember,
} from '@/db/schema';
import {
  PLAN_FEATURES,
  type PlanFeatures,
  type PlanName,
} from './subscription-features';

/**
 * Get workspace subscription.
 *
 * @param workspaceId - Workspace ID
 * @returns Workspace subscription or null
 */
export const getWorkspaceSubscription = cache(async (workspaceId: string) => {
  return db.query.subscription.findFirst({
    where: and(
      eq(subscriptionTable.workspaceId, workspaceId),
      eq(subscriptionTable.status, 'active'),
    ),
  });
});

/**
 * Get workspace plan.
 *
 * Returns the plan for a workspace subscription, or 'free' if no active subscription.
 *
 * @param workspaceId - Workspace ID
 * @returns Plan name
 */
export const getWorkspacePlan = cache(
  async (workspaceId: string): Promise<PlanName> => {
    try {
      const subscription = await getWorkspaceSubscription(workspaceId);

      if (!subscription || subscription.status !== 'active') {
        return 'free';
      }

      const planName = subscription.plan.toLowerCase();
      if (planName in PLAN_FEATURES) {
        return planName as PlanName;
      }

      return 'free';
    } catch (error) {
      console.error('Error fetching workspace plan:', error);
      return 'free';
    }
  },
);

/**
 * Get workspace plan features.
 *
 * @param workspaceId - Workspace ID
 * @returns Plan features
 */
export const getWorkspacePlanFeatures = cache(
  async (workspaceId: string): Promise<PlanFeatures> => {
    const plan = await getWorkspacePlan(workspaceId);
    return PLAN_FEATURES[plan];
  },
);

/**
 * Get effective plan for a user.
 *
 * Returns the highest plan between user's personal subscription
 * and any workspace subscriptions they belong to.
 *
 * @param userId - User ID
 * @returns Effective plan name
 */
export const getUserEffectivePlan = cache(
  async (userId: string): Promise<PlanName> => {
    try {
      // Get user's personal subscription
      const userSubscription = await db.query.subscription.findFirst({
        where: and(
          eq(subscriptionTable.userId, userId),
          eq(subscriptionTable.status, 'active'),
          sql`${subscriptionTable.workspaceId} IS NULL`, // User-level only
        ),
      });

      // Get user's workspaces
      const workspaces = await db.query.workspaceMember.findMany({
        where: eq(workspaceMember.userId, userId),
      });

      // Get workspace subscriptions
      const workspaceSubscriptions = await Promise.all(
        workspaces.map((ws) => getWorkspaceSubscription(ws.workspaceId)),
      );

      // Collect all plans
      const plans: PlanName[] = [];

      if (userSubscription) {
        const planName = userSubscription.plan.toLowerCase();
        if (planName in PLAN_FEATURES) {
          plans.push(planName as PlanName);
        }
      }

      for (const wsSub of workspaceSubscriptions) {
        if (wsSub) {
          const planName = wsSub.plan.toLowerCase();
          if (planName in PLAN_FEATURES) {
            plans.push(planName as PlanName);
          }
        }
      }

      // Return highest plan (startup > pro > free)
      const planPriority: Record<PlanName, number> = {
        free: 0,
        pro: 1,
        startup: 2,
      };

      return plans.reduce(
        (highest, current) =>
          planPriority[current] > planPriority[highest] ? current : highest,
        'free' as PlanName,
      );
    } catch (error) {
      console.error('Error fetching user effective plan:', error);
      return 'free';
    }
  },
);

/**
 * Get effective plan features for a user.
 *
 * @param userId - User ID
 * @returns Plan features
 */
export const getUserEffectivePlanFeatures = cache(
  async (userId: string): Promise<PlanFeatures> => {
    const plan = await getUserEffectivePlan(userId);
    return PLAN_FEATURES[plan];
  },
);

/**
 * Get workspace usage aggregation.
 *
 * Aggregates usage across all workspace members for the current month.
 *
 * @param workspaceId - Workspace ID
 * @returns Workspace usage stats
 */
export async function getWorkspaceUsage(workspaceId: string) {
  try {
    // Get workspace members
    const members = await db.query.workspaceMember.findMany({
      where: eq(workspaceMember.workspaceId, workspaceId),
    });

    const memberIds = members.map((m) => m.userId);

    // Get current month start
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate usage for all members
    const usageResult = await db
      .select({
        totalRequests: sql<number>`COUNT(*)`,
        resourceType: usageLog.resourceType,
      })
      .from(usageLog)
      .where(
        and(
          sql`${usageLog.userId} = ANY(${memberIds})`,
          sql`${usageLog.timestamp} >= ${monthStart}`,
          eq(usageLog.resourceType, 'ai_request'),
        ),
      )
      .groupBy(usageLog.resourceType);

    const totalAiRequests = usageResult[0]?.totalRequests || 0;

    // Get workspace plan limits
    const features = await getWorkspacePlanFeatures(workspaceId);

    return {
      totalAiRequests,
      aiRequestsLimit: features.aiRequests,
      remainingRequests:
        features.aiRequests === -1
          ? -1
          : Math.max(0, features.aiRequests - totalAiRequests),
      usagePercentage:
        features.aiRequests === -1
          ? 0
          : (totalAiRequests / features.aiRequests) * 100,
      resetAt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      memberCount: members.length,
    };
  } catch (error) {
    console.error('Error fetching workspace usage:', error);
    throw error;
  }
}

/**
 * Check if workspace has reached usage limit.
 *
 * @param workspaceId - Workspace ID
 * @returns True if limit reached, false otherwise
 */
export async function hasWorkspaceReachedLimit(
  workspaceId: string,
): Promise<boolean> {
  try {
    const usage = await getWorkspaceUsage(workspaceId);

    if (usage.aiRequestsLimit === -1) {
      return false; // Unlimited
    }

    return usage.totalAiRequests >= usage.aiRequestsLimit;
  } catch (error) {
    console.error('Error checking workspace limit:', error);
    return true; // Fail safe - assume limit reached on error
  }
}

/**
 * Get workspace billing info.
 *
 * Returns comprehensive billing information including subscription,
 * usage, and member details.
 *
 * @param workspaceId - Workspace ID
 * @returns Workspace billing information
 */
export async function getWorkspaceBillingInfo(workspaceId: string) {
  try {
    const subscription = await getWorkspaceSubscription(workspaceId);
    const plan = await getWorkspacePlan(workspaceId);
    const features = PLAN_FEATURES[plan];
    const usage = await getWorkspaceUsage(workspaceId);

    return {
      subscription,
      plan,
      features,
      usage,
    };
  } catch (error) {
    console.error('Error fetching workspace billing info:', error);
    throw error;
  }
}

/**
 * Check if user has access to a feature through any workspace.
 *
 * @param userId - User ID
 * @param feature - Feature to check
 * @returns True if user has access, false otherwise
 */
export async function userHasFeatureAccess(
  userId: string,
  feature: keyof PlanFeatures,
): Promise<boolean> {
  try {
    const features = await getUserEffectivePlanFeatures(userId);
    const featureValue = features[feature];

    // For number features
    if (typeof featureValue === 'number') {
      return featureValue === -1 || featureValue > 0;
    }

    // For array features
    if (Array.isArray(featureValue)) {
      return featureValue.length > 0;
    }

    return true;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}

/**
 * Get user's allowed AI models considering all subscriptions.
 *
 * @param userId - User ID
 * @returns Array of allowed model names
 */
export async function getUserAllowedModels(userId: string): Promise<string[]> {
  try {
    const features = await getUserEffectivePlanFeatures(userId);
    return [...features.models];
  } catch (error) {
    console.error('Error fetching allowed models:', error);
    return ['gpt-3.5-turbo']; // Fallback to free tier
  }
}

/**
 * Check if user can perform an AI request.
 *
 * Checks both user-level and workspace-level quotas.
 *
 * @param userId - User ID
 * @returns Object with allowed status and reason
 */
export async function canUserMakeAiRequest(userId: string): Promise<{
  allowed: boolean;
  reason?: string;
  limitType?: 'user' | 'workspace';
}> {
  try {
    // Get user's workspaces
    const workspaces = await db.query.workspaceMember.findMany({
      where: eq(workspaceMember.userId, userId),
    });

    // Check workspace limits first
    for (const ws of workspaces) {
      const wsLimitReached = await hasWorkspaceReachedLimit(ws.workspaceId);
      if (!wsLimitReached) {
        return { allowed: true };
      }
    }

    // If all workspaces are at limit, check user's personal quota
    const userQuota = await db.query.usageQuota.findFirst({
      where: eq(usageQuota.userId, userId),
    });

    if (!userQuota) {
      return { allowed: true }; // No quota set yet
    }

    const used = Number.parseInt(userQuota.aiRequestsUsed, 10);
    const limit = Number.parseInt(userQuota.aiRequestsLimit, 10);

    if (limit === -1) {
      return { allowed: true }; // Unlimited
    }

    if (used >= limit) {
      return {
        allowed: false,
        reason: 'Usage limit reached',
        limitType: 'user',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking AI request permission:', error);
    return {
      allowed: false,
      reason: 'Error checking permissions',
    };
  }
}
