import { and, desc, eq, gte } from 'drizzle-orm';
import { nanoid } from 'nanoid';
import { db } from '@/db/drizzle';
import { auditLog } from '@/db/schema';

export type AuditAction =
  | 'user.role_changed'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'api_key.created'
  | 'api_key.updated'
  | 'api_key.deleted'
  | 'subscription.created'
  | 'subscription.updated'
  | 'subscription.canceled'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.password_reset'
  | 'admin.access'
  | 'workspace.created'
  | 'workspace.updated'
  | 'workspace.deleted'
  | 'workspace.member_added'
  | 'workspace.member_removed'
  | 'workspace.member_role_updated';

interface AuditLogEntry {
  userId?: string | null;
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create an audit log entry
 */
export async function logAudit(entry: AuditLogEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      id: nanoid(),
      userId: entry.userId || null,
      action: entry.action,
      resourceType: entry.resourceType || null,
      resourceId: entry.resourceId || null,
      changes: entry.changes ? JSON.stringify(entry.changes) : null,
      ipAddress: entry.ipAddress || null,
      userAgent: entry.userAgent || null,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - audit logging failure shouldn't break the request
  }
}

/**
 * Log a role change
 */
export async function logRoleChange(
  adminUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAudit({
    userId: adminUserId,
    action: 'user.role_changed',
    resourceType: 'user',
    resourceId: targetUserId,
    changes: {
      before: { role: oldRole },
      after: { role: newRole },
      targetUserId,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log API key operations
 */
export async function logApiKeyChange(
  userId: string,
  action: 'created' | 'updated' | 'deleted',
  provider: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAudit({
    userId,
    action: `api_key.${action}` as AuditAction,
    resourceType: 'api_key',
    resourceId: provider,
    changes: {
      provider,
      action,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * Log subscription events
 */
export async function logSubscriptionChange(
  userId: string,
  action: 'created' | 'updated' | 'canceled',
  subscriptionData: {
    plan?: string;
    status?: string;
    subscriptionId?: string;
  },
  changes?: Record<string, unknown>,
): Promise<void> {
  await logAudit({
    userId,
    action: `subscription.${action}` as AuditAction,
    resourceType: 'subscription',
    resourceId: subscriptionData.subscriptionId,
    changes: {
      ...subscriptionData,
      ...changes,
    },
  });
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  userId: string,
  action: 'login' | 'logout' | 'password_reset',
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAudit({
    userId,
    action: `auth.${action}` as AuditAction,
    resourceType: 'auth',
    ipAddress,
    userAgent,
  });
}

/**
 * Log admin access
 */
export async function logAdminAccess(
  userId: string,
  resource: string,
  ipAddress?: string,
  userAgent?: string,
): Promise<void> {
  await logAudit({
    userId,
    action: 'admin.access',
    resourceType: 'admin',
    resourceId: resource,
    ipAddress,
    userAgent,
  });
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(userId: string, limit = 50, offset = 0) {
  const logs = await db.query.auditLog.findMany({
    where: eq(auditLog.userId, userId),
    orderBy: desc(auditLog.timestamp),
    limit,
    offset,
  });

  return logs.map((log) => ({
    ...log,
    changes: log.changes ? JSON.parse(log.changes) : null,
  }));
}

/**
 * Get all audit logs (admin only)
 */
export async function getAllAuditLogs(
  limit = 100,
  offset = 0,
  filters?: {
    userId?: string;
    action?: AuditAction;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const conditions = [];

  if (filters?.userId) {
    conditions.push(eq(auditLog.userId, filters.userId));
  }

  if (filters?.action) {
    conditions.push(eq(auditLog.action, filters.action));
  }

  if (filters?.startDate) {
    conditions.push(gte(auditLog.timestamp, filters.startDate));
  }

  if (filters?.endDate) {
    conditions.push(gte(auditLog.timestamp, filters.endDate));
  }

  const logs = await db.query.auditLog.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(auditLog.timestamp),
    limit,
    offset,
    with: {
      user: {
        columns: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return logs.map((log) => ({
    ...log,
    changes: log.changes ? JSON.parse(log.changes) : null,
  }));
}

/**
 * Get audit log statistics
 */
export async function getAuditStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const logs = await db.query.auditLog.findMany({
    where: gte(auditLog.timestamp, startDate),
  });

  // Count by action type
  const byAction: Record<string, number> = {};
  const byDate: Record<string, number> = {};

  for (const log of logs) {
    // By action
    byAction[log.action] = (byAction[log.action] || 0) + 1;

    // By date
    const date = new Date(log.timestamp).toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  }

  return {
    total: logs.length,
    byAction,
    byDate,
    period: days,
  };
}

/**
 * Helper to extract IP address from request
 */
export function getIpAddress(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');

  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  return undefined;
}

/**
 * Helper to extract user agent from request
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined;
}
