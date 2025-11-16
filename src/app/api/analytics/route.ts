/**
 * Analytics API Endpoint
 *
 * Provides aggregated usage analytics and metrics for the dashboard.
 *
 * @module api/analytics
 */

import { and, eq, gte } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/db/drizzle';
import { usageLog, usageQuota } from '@/db/schema';
import { auth, type TypedSession } from '@/lib/auth';

/**
 * GET /api/analytics
 *
 * Returns analytics data for the current user or all users (admin only).
 *
 * Query parameters:
 * - period: '7d' | '30d' | '90d' | 'all' (default: '30d')
 * - userId: specific user ID (admin only)
 */
export async function GET(request: NextRequest) {
  // Authentication check
  const session = (await auth.api.getSession({
    headers: await headers(),
  })) as TypedSession | null;

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';
  const requestedUserId = searchParams.get('userId');

  // Determine user ID to query
  let userId: string;
  const isAdmin = session.user.role === 'admin';

  if (requestedUserId) {
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    userId = requestedUserId;
  } else {
    userId = session.user.id;
  }

  // Calculate date range
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(0); // All time
  }

  try {
    // Get usage quota
    const quota = await db.query.usageQuota.findFirst({
      where: eq(usageQuota.userId, userId),
    });

    // Get usage logs within period
    const logs = await db
      .select()
      .from(usageLog)
      .where(
        and(eq(usageLog.userId, userId), gte(usageLog.timestamp, startDate)),
      )
      .orderBy(usageLog.timestamp);

    // Calculate metrics
    const totalRequests = logs.length;

    // Group by resource type
    const byResourceType: Record<string, number> = {};
    logs.forEach((log) => {
      byResourceType[log.resourceType] =
        (byResourceType[log.resourceType] || 0) + 1;
    });

    // Group by day for trend chart
    const byDay: Record<string, number> = {};
    logs.forEach((log) => {
      const day = log.timestamp.toISOString().split('T')[0];
      byDay[day] = (byDay[day] || 0) + 1;
    });

    // Calculate model usage from metadata
    const modelUsage: Record<string, number> = {};
    logs.forEach((log) => {
      if (log.metadata) {
        try {
          const meta = JSON.parse(log.metadata);
          if (meta.model) {
            modelUsage[meta.model] = (modelUsage[meta.model] || 0) + 1;
          }
        } catch {
          // Skip invalid metadata
        }
      }
    });

    // Calculate average response time if available
    let avgResponseTime = 0;
    let responseTimeCount = 0;
    logs.forEach((log) => {
      if (log.metadata) {
        try {
          const meta = JSON.parse(log.metadata);
          if (meta.responseTime) {
            avgResponseTime += meta.responseTime;
            responseTimeCount++;
          }
        } catch {
          // Skip invalid metadata
        }
      }
    });
    if (responseTimeCount > 0) {
      avgResponseTime = avgResponseTime / responseTimeCount;
    }

    // Count errors
    let errorCount = 0;
    logs.forEach((log) => {
      if (log.metadata) {
        try {
          const meta = JSON.parse(log.metadata);
          if (meta.error || meta.status === 'error') {
            errorCount++;
          }
        } catch {
          // Skip invalid metadata
        }
      }
    });

    const errorRate =
      totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return NextResponse.json({
      period,
      userId,
      quota: {
        used: quota?.aiRequestsUsed || '0',
        limit: quota?.aiRequestsLimit || '0',
        resetAt: quota?.resetAt || null,
      },
      metrics: {
        totalRequests,
        errorCount,
        errorRate: Math.round(errorRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
      },
      charts: {
        byResourceType,
        byDay: Object.entries(byDay)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        modelUsage,
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    );
  }
}
