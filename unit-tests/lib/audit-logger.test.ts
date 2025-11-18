import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getAllAuditLogs,
  getAuditStats,
  getIpAddress,
  getUserAgent,
  getUserAuditLogs,
  logAdminAccess,
  logApiKeyChange,
  logAudit,
  logAuthEvent,
  logRoleChange,
  logSubscriptionChange,
} from '@/lib/audit-logger';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    insert: vi.fn(),
    query: {
      auditLog: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
    },
  },
}));

import { db } from '@/db/drizzle';

describe('Audit Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logAudit', () => {
    it('should create audit log entry successfully', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      await logAudit({
        userId: 'user_123',
        action: 'user.created',
        resourceType: 'user',
        resourceId: 'user_456',
        changes: { name: 'Test User' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(db.insert).toHaveBeenCalled();
    });

    it('should handle missing optional fields', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      await logAudit({
        action: 'auth.login',
      });

      expect(db.insert).toHaveBeenCalled();
    });

    it('should not throw on database errors', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('DB error')),
      } as any);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        logAudit({
          action: 'user.created',
        }),
      ).resolves.not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should serialize changes to JSON', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      const changes = { before: { role: 'member' }, after: { role: 'admin' } };
      await logAudit({
        userId: 'user_123',
        action: 'user.role_changed',
        changes,
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: JSON.stringify(changes),
        }),
      );
    });
  });

  describe('logRoleChange', () => {
    it('should log role change with correct format', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      await logRoleChange(
        'admin_123',
        'user_456',
        'member',
        'admin',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should include before and after roles in changes', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logRoleChange('admin_123', 'user_456', 'viewer', 'member');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'user.role_changed',
          resourceType: 'user',
          resourceId: 'user_456',
        }),
      );
    });
  });

  describe('logApiKeyChange', () => {
    it('should log API key creation', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      await logApiKeyChange('user_123', 'created', 'openai');

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log API key update', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logApiKeyChange('user_123', 'updated', 'anthropic');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.updated',
          resourceType: 'api_key',
          resourceId: 'anthropic',
        }),
      );
    });

    it('should log API key deletion', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logApiKeyChange('user_123', 'deleted', 'openai');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'api_key.deleted',
        }),
      );
    });
  });

  describe('logSubscriptionChange', () => {
    it('should log subscription creation', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      await logSubscriptionChange(
        'user_123',
        'created',
        { plan: 'Pro', subscriptionId: 'sub_123' },
      );

      expect(db.insert).toHaveBeenCalled();
    });

    it('should log subscription update', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logSubscriptionChange('user_123', 'updated', {
        plan: 'Startup',
        status: 'active',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'subscription.updated',
        }),
      );
    });

    it('should log subscription cancellation', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logSubscriptionChange('user_123', 'canceled', {
        plan: 'Pro',
        status: 'canceled',
      });

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'subscription.canceled',
        }),
      );
    });

    it('should merge additional changes', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logSubscriptionChange(
        'user_123',
        'updated',
        { plan: 'Pro' },
        { reason: 'user_request' },
      );

      const callArg = insertMock.mock.calls[0][0];
      const changes = JSON.parse(callArg.changes);
      expect(changes).toHaveProperty('plan', 'Pro');
      expect(changes).toHaveProperty('reason', 'user_request');
    });
  });

  describe('logAuthEvent', () => {
    it('should log login event', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logAuthEvent('user_123', 'login', '192.168.1.1', 'Mozilla/5.0');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.login',
          resourceType: 'auth',
          ipAddress: '192.168.1.1',
        }),
      );
    });

    it('should log logout event', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logAuthEvent('user_123', 'logout');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.logout',
        }),
      );
    });

    it('should log password reset event', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logAuthEvent('user_123', 'password_reset');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'auth.password_reset',
        }),
      );
    });
  });

  describe('logAdminAccess', () => {
    it('should log admin access', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logAdminAccess('admin_123', 'users', '192.168.1.1');

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'admin.access',
          resourceType: 'admin',
          resourceId: 'users',
        }),
      );
    });
  });

  describe('getUserAuditLogs', () => {
    it('should retrieve user audit logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          userId: 'user_123',
          action: 'auth.login',
          changes: JSON.stringify({ ip: '192.168.1.1' }),
        },
        {
          id: 'log_2',
          userId: 'user_123',
          action: 'user.updated',
          changes: null,
        },
      ];

      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce(
        mockLogs as any,
      );

      const result = await getUserAuditLogs('user_123');

      expect(result).toHaveLength(2);
      expect(result[0].changes).toEqual({ ip: '192.168.1.1' });
      expect(result[1].changes).toBeNull();
    });

    it('should use default limit of 50', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      await getUserAuditLogs('user_123');

      expect(db.query.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 50,
        }),
      );
    });

    it('should accept custom limit and offset', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      await getUserAuditLogs('user_123', 100, 20);

      expect(db.query.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          limit: 100,
          offset: 20,
        }),
      );
    });
  });

  describe('getAllAuditLogs', () => {
    it('should retrieve all audit logs', async () => {
      const mockLogs = [
        {
          id: 'log_1',
          action: 'user.created',
          changes: JSON.stringify({ name: 'Test' }),
          user: { id: 'user_1', name: 'User 1', email: 'user1@example.com' },
        },
      ];

      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce(
        mockLogs as any,
      );

      const result = await getAllAuditLogs();

      expect(result).toHaveLength(1);
      expect(result[0].changes).toEqual({ name: 'Test' });
    });

    it('should filter by userId', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      await getAllAuditLogs(100, 0, { userId: 'user_123' });

      expect(db.query.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by action', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      await getAllAuditLogs(100, 0, { action: 'user.created' });

      expect(db.query.auditLog.findMany).toHaveBeenCalled();
    });

    it('should filter by date range', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await getAllAuditLogs(100, 0, { startDate, endDate });

      expect(db.query.auditLog.findMany).toHaveBeenCalled();
    });

    it('should combine multiple filters', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      await getAllAuditLogs(100, 0, {
        userId: 'user_123',
        action: 'user.updated',
        startDate: new Date('2024-01-01'),
      });

      expect(db.query.auditLog.findMany).toHaveBeenCalled();
    });
  });

  describe('getAuditStats', () => {
    it('should calculate statistics correctly', async () => {
      const mockLogs = [
        { action: 'auth.login', timestamp: new Date('2024-01-15') },
        { action: 'auth.login', timestamp: new Date('2024-01-15') },
        { action: 'user.created', timestamp: new Date('2024-01-16') },
        { action: 'auth.logout', timestamp: new Date('2024-01-16') },
      ];

      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce(
        mockLogs as any,
      );

      const stats = await getAuditStats(30);

      expect(stats.total).toBe(4);
      expect(stats.byAction['auth.login']).toBe(2);
      expect(stats.byAction['user.created']).toBe(1);
      expect(stats.byAction['auth.logout']).toBe(1);
      expect(stats.period).toBe(30);
    });

    it('should aggregate by date', async () => {
      const mockLogs = [
        { action: 'auth.login', timestamp: new Date('2024-01-15T10:00:00') },
        { action: 'auth.login', timestamp: new Date('2024-01-15T14:00:00') },
        { action: 'user.created', timestamp: new Date('2024-01-16T10:00:00') },
      ];

      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce(
        mockLogs as any,
      );

      const stats = await getAuditStats(30);

      expect(stats.byDate['2024-01-15']).toBe(2);
      expect(stats.byDate['2024-01-16']).toBe(1);
    });

    it('should handle empty logs', async () => {
      vi.mocked(db.query.auditLog.findMany).mockResolvedValueOnce([]);

      const stats = await getAuditStats(30);

      expect(stats.total).toBe(0);
      expect(Object.keys(stats.byAction)).toHaveLength(0);
      expect(Object.keys(stats.byDate)).toHaveLength(0);
    });
  });

  describe('getIpAddress', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      });

      const ip = getIpAddress(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getIpAddress(request);

      expect(ip).toBe('192.168.1.2');
    });

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('https://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      });

      const ip = getIpAddress(request);

      expect(ip).toBe('192.168.1.1');
    });

    it('should return undefined if no IP headers', () => {
      const request = new Request('https://example.com');

      const ip = getIpAddress(request);

      expect(ip).toBeUndefined();
    });
  });

  describe('getUserAgent', () => {
    it('should extract user agent from header', () => {
      const request = new Request('https://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0',
        },
      });

      const userAgent = getUserAgent(request);

      expect(userAgent).toBe('Mozilla/5.0');
    });

    it('should return undefined if no user agent', () => {
      const request = new Request('https://example.com');

      const userAgent = getUserAgent(request);

      expect(userAgent).toBeUndefined();
    });
  });
});
