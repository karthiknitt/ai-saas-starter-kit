import { and, eq, gte, sql } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { usageLog, usageQuota } from '@/db/schema';
import {
  getAiRequestLimit,
  hasUnlimitedAiRequests,
} from './subscription-features';

export type ResourceType = 'ai_request' | 'api_call' | 'storage';

interface UsageMetadata {
  model?: string;
  tokens?: number;
  provider?: string;
  [key: string]: unknown;
}

/**
 * Log a usage event
 */
export async function logUsage(
  userId: string,
  resourceType: ResourceType,
  quantity = 1,
  metadata?: UsageMetadata,
): Promise<void> {
  try {
    await db.insert(usageLog).values({
      id: nanoid(),
      userId,
      resourceType,
      resourceId: metadata?.model || null,
      quantity: quantity.toString(),
      metadata: metadata ? JSON.stringify(metadata) : null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to log usage:', error);
    // Don't throw - logging failure shouldn't break the request
  }
}

/**
 * Get or create usage quota for a user
 */
export async function getOrCreateQuota(userId: string) {
  // Try to get existing quota
  const existing = await db.query.usageQuota.findFirst({
    where: eq(usageQuota.userId, userId),
  });

  if (existing) {
    return existing;
  }

  // Create new quota
  const limit = await getAiRequestLimit(userId);
  const resetAt = getNextResetDate();

  const [newQuota] = await db
    .insert(usageQuota)
    .values({
      userId,
      aiRequestsUsed: '0',
      aiRequestsLimit: limit.toString(),
      resetAt,
    })
    .returning();

  return newQuota;
}

/**
 * Get next monthly reset date (1st of next month at midnight UTC)
 */
function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
  );
  return nextMonth;
}

/**
 * Check if quota needs reset (past reset date)
 */
async function shouldResetQuota(userId: string): Promise<boolean> {
  const quota = await getOrCreateQuota(userId);
  return new Date() >= new Date(quota.resetAt);
}

/**
 * Reset usage quota for a user
 */
export async function resetQuota(userId: string): Promise<void> {
  const limit = await getAiRequestLimit(userId);
  const resetAt = getNextResetDate();

  await db
    .update(usageQuota)
    .set({
      aiRequestsUsed: '0',
      aiRequestsLimit: limit.toString(),
      resetAt,
      updatedAt: new Date(),
    })
    .where(eq(usageQuota.userId, userId));
}

/**
 * Increment usage counter for AI requests
 */
export async function incrementAiRequests(
  userId: string,
  count = 1,
): Promise<void> {
  // Check if quota needs reset
  if (await shouldResetQuota(userId)) {
    await resetQuota(userId);
  }

  // Increment the counter
  await db
    .update(usageQuota)
    .set({
      aiRequestsUsed: sql`CAST(${usageQuota.aiRequestsUsed} AS INTEGER) + ${count}`,
      updatedAt: new Date(),
    })
    .where(eq(usageQuota.userId, userId));
}

/**
 * Check if user has exceeded their AI request quota
 * Returns { allowed: boolean, used: number, limit: number, remaining: number }
 */
export async function checkAiRequestQuota(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  remaining: number;
  unlimited: boolean;
}> {
  // Check if user has unlimited requests
  const isUnlimited = await hasUnlimitedAiRequests(userId);
  if (isUnlimited) {
    return {
      allowed: true,
      used: 0,
      limit: -1,
      remaining: -1,
      unlimited: true,
    };
  }

  // Check if quota needs reset
  if (await shouldResetQuota(userId)) {
    await resetQuota(userId);
  }

  // Get current quota
  const quota = await getOrCreateQuota(userId);
  const used = Number.parseInt(quota.aiRequestsUsed, 10);
  const limit = Number.parseInt(quota.aiRequestsLimit, 10);
  const remaining = Math.max(0, limit - used);

  return {
    allowed: used < limit,
    used,
    limit,
    remaining,
    unlimited: false,
  };
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId: string, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get usage logs
  const logs = await db.query.usageLog.findMany({
    where: and(eq(usageLog.userId, userId), gte(usageLog.timestamp, startDate)),
    orderBy: [sql`${usageLog.timestamp} DESC`],
  });

  // Get current quota
  const quotaStatus = await checkAiRequestQuota(userId);

  // Calculate stats by resource type
  const statsByType: Record<string, number> = {};
  for (const log of logs) {
    const type = log.resourceType;
    const quantity = Number.parseInt(log.quantity, 10) || 1;
    statsByType[type] = (statsByType[type] || 0) + quantity;
  }

  // Calculate daily breakdown
  const dailyUsage: Record<string, number> = {};
  for (const log of logs) {
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    const quantity = Number.parseInt(log.quantity, 10) || 1;
    dailyUsage[date] = (dailyUsage[date] || 0) + quantity;
  }

  return {
    quota: quotaStatus,
    totalRequests: logs.length,
    byType: statsByType,
    byDay: dailyUsage,
    recentLogs: logs.slice(0, 10), // Last 10 logs
  };
}

/**
 * Get usage percentage (0-100)
 */
export async function getUsagePercentage(userId: string): Promise<number> {
  const quota = await checkAiRequestQuota(userId);

  if (quota.unlimited || quota.limit === -1) {
    return 0;
  }

  if (quota.limit === 0) {
    return 100;
  }

  return Math.min(100, Math.round((quota.used / quota.limit) * 100));
}

/**
 * Check if user is near quota limit (>80%)
 */
export async function isNearQuotaLimit(userId: string): Promise<boolean> {
  const percentage = await getUsagePercentage(userId);
  return percentage >= 80;
}

/**
 * Track AI request and check quota in one operation
 * This is the main function to call before processing AI requests
 */
export async function trackAndCheckAiRequest(
  userId: string,
  metadata?: UsageMetadata,
): Promise<{
  allowed: boolean;
  quota: Awaited<ReturnType<typeof checkAiRequestQuota>>;
}> {
  // Check quota first
  const quota = await checkAiRequestQuota(userId);

  if (!quota.allowed) {
    return { allowed: false, quota };
  }

  // Log the usage
  await logUsage(userId, 'ai_request', 1, metadata);

  // Increment quota counter
  await incrementAiRequests(userId, 1);

  return { allowed: true, quota };
}
