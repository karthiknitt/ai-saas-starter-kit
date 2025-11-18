import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  checkAiRequestQuota,
  getOrCreateQuota,
  getUserUsageStats,
  getUsagePercentage,
  incrementAiRequests,
  isNearQuotaLimit,
  logUsage,
  resetQuota,
  trackAndCheckAiRequest,
} from '@/lib/usage-tracker';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    }),
    query: {
      usageQuota: {
        findFirst: vi.fn(),
      },
      usageLog: {
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
    },
  },
}));

vi.mock('@/lib/email-service', () => ({
  emailService: {
    sendQuotaWarning: vi.fn(),
  },
}));

vi.mock('@/lib/subscription-features', () => ({
  getAiRequestLimit: vi.fn(),
  getUserPlan: vi.fn(),
  hasUnlimitedAiRequests: vi.fn(),
}));

import { db } from '@/db/drizzle';
import { emailService } from '@/lib/email-service';
import {
  getAiRequestLimit,
  getUserPlan,
  hasUnlimitedAiRequests,
} from '@/lib/subscription-features';

describe('Usage Tracker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getAiRequestLimit to return a default value
    vi.mocked(getAiRequestLimit).mockResolvedValue(10);
  });

  describe('logUsage', () => {
    it('should log usage event successfully', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);

      await logUsage('user_123', 'ai_request', 1, { model: 'gpt-4' });

      expect(db.insert).toHaveBeenCalled();
    });

    it('should not throw on logging failure', async () => {
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockRejectedValue(new Error('DB error')),
      } as any);

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        logUsage('user_123', 'ai_request'),
      ).resolves.not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should log with metadata', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      const metadata = { model: 'gpt-4', tokens: 100, provider: 'openai' };
      await logUsage('user_123', 'ai_request', 1, metadata);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user_123',
          resourceType: 'ai_request',
          quantity: '1',
          metadata: JSON.stringify(metadata),
        }),
      );
    });

    it('should handle different resource types', async () => {
      const insertMock = vi.fn().mockResolvedValue(undefined);
      vi.mocked(db.insert).mockReturnValue({
        values: insertMock,
      } as any);

      await logUsage('user_123', 'api_call');
      await logUsage('user_123', 'storage', 100);

      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ resourceType: 'api_call' }),
      );
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({ resourceType: 'storage', quantity: '100' }),
      );
    });
  });

  describe('getOrCreateQuota', () => {
    it('should return existing quota', async () => {
      const mockQuota = {
        userId: 'user_123',
        aiRequestsUsed: '5',
        aiRequestsLimit: '10',
        resetAt: new Date(),
      };

      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue(
        mockQuota as any,
      );

      const result = await getOrCreateQuota('user_123');

      expect(result).toEqual(mockQuota);
    });

    it('should create new quota if not exists', async () => {
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue(null);
      vi.mocked(getAiRequestLimit).mockResolvedValueOnce(10);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([
            {
              userId: 'user_123',
              aiRequestsUsed: '0',
              aiRequestsLimit: '10',
            },
          ]),
        }),
      } as any);

      const result = await getOrCreateQuota('user_123');

      expect(result.aiRequestsUsed).toBe('0');
      expect(result.aiRequestsLimit).toBe('10');
    });
  });

  describe('resetQuota', () => {
    it('should reset quota for user', async () => {
      vi.mocked(getAiRequestLimit).mockResolvedValueOnce(10);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await resetQuota('user_123');

      expect(db.update).toHaveBeenCalled();
    });

    it('should reset warning flags', async () => {
      vi.mocked(getAiRequestLimit).mockResolvedValueOnce(10);
      const setMock = vi.fn().mockReturnValue({
        where: vi.fn(),
      });
      vi.mocked(db.update).mockReturnValue({
        set: setMock,
      } as any);

      await resetQuota('user_123');

      expect(setMock).toHaveBeenCalledWith(
        expect.objectContaining({
          warning80Sent: false,
          warning90Sent: false,
          warning100Sent: false,
        }),
      );
    });
  });

  describe('incrementAiRequests', () => {
    it('should increment usage counter', async () => {
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        resetAt: new Date(Date.now() + 1000000),
      } as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await incrementAiRequests('user_123', 1);

      expect(db.update).toHaveBeenCalled();
    });

    it('should reset quota if past reset date', async () => {
      const pastDate = new Date(Date.now() - 1000);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        resetAt: pastDate,
      } as any);
      vi.mocked(getAiRequestLimit).mockResolvedValueOnce(10);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await incrementAiRequests('user_123', 1);

      expect(db.update).toHaveBeenCalledTimes(2); // Once for reset, once for increment
    });
  });

  describe('checkAiRequestQuota', () => {
    it('should return allowed true if under limit', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValue(false);
      vi.mocked(getAiRequestLimit).mockResolvedValue(10);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '5',
        aiRequestsLimit: '10',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await checkAiRequestQuota('user_123');

      expect(result.allowed).toBe(true);
      expect(result.used).toBe(5);
      expect(result.limit).toBe(10);
      expect(result.remaining).toBe(5);
    });

    it('should return allowed false if over limit', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValue(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '10',
        aiRequestsLimit: '10',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await checkAiRequestQuota('user_123');

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return unlimited for unlimited plans', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(true);

      const result = await checkAiRequestQuota('user_123');

      expect(result.allowed).toBe(true);
      expect(result.unlimited).toBe(true);
      expect(result.limit).toBe(-1);
      expect(result.remaining).toBe(-1);
    });

    it('should reset quota if past reset date', async () => {
      const pastDate = new Date(Date.now() - 1000);
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '10',
        aiRequestsLimit: '10',
        resetAt: pastDate,
      } as any);
      vi.mocked(getAiRequestLimit).mockResolvedValueOnce(10);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await checkAiRequestQuota('user_123');

      expect(db.update).toHaveBeenCalled();
    });
  });

  describe('getUserUsageStats', () => {
    it('should return usage statistics', async () => {
      const mockLogs = [
        {
          userId: 'user_123',
          resourceType: 'ai_request',
          quantity: '1',
          timestamp: new Date(),
        },
        {
          userId: 'user_123',
          resourceType: 'api_call',
          quantity: '1',
          timestamp: new Date(),
        },
      ];

      vi.mocked(db.query.usageLog.findMany).mockResolvedValueOnce(
        mockLogs as any,
      );
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '5',
        aiRequestsLimit: '10',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await getUserUsageStats('user_123', 30);

      expect(result.totalRequests).toBe(2);
      expect(result.byType).toBeDefined();
      expect(result.byDay).toBeDefined();
      expect(result.quota).toBeDefined();
    });

    it('should aggregate by type correctly', async () => {
      const mockLogs = [
        {
          userId: 'user_123',
          resourceType: 'ai_request',
          quantity: '1',
          timestamp: new Date(),
        },
        {
          userId: 'user_123',
          resourceType: 'ai_request',
          quantity: '2',
          timestamp: new Date(),
        },
        {
          userId: 'user_123',
          resourceType: 'api_call',
          quantity: '1',
          timestamp: new Date(),
        },
      ];

      vi.mocked(db.query.usageLog.findMany).mockResolvedValueOnce(
        mockLogs as any,
      );
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '5',
        aiRequestsLimit: '10',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await getUserUsageStats('user_123', 30);

      expect(result.byType.ai_request).toBe(3);
      expect(result.byType.api_call).toBe(1);
    });
  });

  describe('getUsagePercentage', () => {
    it('should return 0 for unlimited quota', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(true);

      const result = await getUsagePercentage('user_123');

      expect(result).toBe(0);
    });

    it('should calculate percentage correctly', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '50',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await getUsagePercentage('user_123');

      expect(result).toBe(50);
    });

    it('should return 100 if over quota', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '150',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await getUsagePercentage('user_123');

      expect(result).toBe(100);
    });

    it('should return 100 if limit is 0', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '0',
        aiRequestsLimit: '0',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await getUsagePercentage('user_123');

      expect(result).toBe(100);
    });
  });

  describe('isNearQuotaLimit', () => {
    it('should return true if near limit (>=80%)', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '85',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await isNearQuotaLimit('user_123');

      expect(result).toBe(true);
    });

    it('should return false if not near limit', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '50',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await isNearQuotaLimit('user_123');

      expect(result).toBe(false);
    });
  });

  describe('trackAndCheckAiRequest', () => {
    it('should track and allow request if under quota', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '5',
        aiRequestsLimit: '10',
        resetAt: new Date(Date.now() + 1000000),
        warning80Sent: false,
        warning90Sent: false,
        warning100Sent: false,
      } as any);
      vi.mocked(db.insert).mockReturnValue({
        values: vi.fn().mockResolvedValue(undefined),
      } as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      const result = await trackAndCheckAiRequest('user_123', {
        model: 'gpt-4',
      });

      expect(result.allowed).toBe(true);
      expect(db.insert).toHaveBeenCalled();
    });

    it('should reject request if over quota', async () => {
      vi.mocked(hasUnlimitedAiRequests).mockResolvedValueOnce(false);
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '10',
        aiRequestsLimit: '10',
        resetAt: new Date(Date.now() + 1000000),
      } as any);

      const result = await trackAndCheckAiRequest('user_123');

      expect(result.allowed).toBe(false);
      expect(db.insert).not.toHaveBeenCalled();
    });
  });

  describe('Quota warning emails', () => {
    it('should send 80% warning email', async () => {
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '80',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
        warning80Sent: false,
        warning90Sent: false,
        warning100Sent: false,
      } as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
      } as any);
      vi.mocked(getUserPlan).mockResolvedValueOnce('free');
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await incrementAiRequests('user_123', 1);

      expect(emailService.sendQuotaWarning).toHaveBeenCalledWith(
        expect.objectContaining({
          usagePercentage: 80,
        }),
      );
    });

    it('should send 90% warning email', async () => {
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '90',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
        warning80Sent: false,
        warning90Sent: false,
        warning100Sent: false,
      } as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
      } as any);
      vi.mocked(getUserPlan).mockResolvedValueOnce('free');
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await incrementAiRequests('user_123', 1);

      expect(emailService.sendQuotaWarning).toHaveBeenCalledWith(
        expect.objectContaining({
          usagePercentage: 90,
        }),
      );
    });

    it('should send 100% warning email', async () => {
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '100',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
        warning80Sent: false,
        warning90Sent: false,
        warning100Sent: false,
      } as any);
      vi.mocked(db.query.user.findFirst).mockResolvedValueOnce({
        id: 'user_123',
        name: 'Test User',
        email: 'test@example.com',
      } as any);
      vi.mocked(getUserPlan).mockResolvedValueOnce('free');
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await incrementAiRequests('user_123', 1);

      expect(emailService.sendQuotaWarning).toHaveBeenCalledWith(
        expect.objectContaining({
          usagePercentage: 100,
        }),
      );
    });

    it('should not send duplicate warning emails', async () => {
      vi.mocked(db.query.usageQuota.findFirst).mockResolvedValue({
        userId: 'user_123',
        aiRequestsUsed: '80',
        aiRequestsLimit: '100',
        resetAt: new Date(Date.now() + 1000000),
        warning80Sent: true,
        warning90Sent: false,
        warning100Sent: false,
      } as any);
      vi.mocked(db.update).mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn(),
        }),
      } as any);

      await incrementAiRequests('user_123', 1);

      expect(emailService.sendQuotaWarning).not.toHaveBeenCalled();
    });
  });
});
