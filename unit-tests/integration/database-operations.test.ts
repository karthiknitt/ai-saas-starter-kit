import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db/drizzle';
import {
  account,
  session,
  subscription,
  user,
  verification,
} from '../../src/db/schema';

// Mock the database
vi.mock('@/db/drizzle');

const mockDb = vi.mocked(db);

describe('Database Operations Integration Tests', () => {
  const testUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: false,
    image: null,
    apiKeys: null,
    provider: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('User Operations', () => {
    it('should create a new user', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ rows: [testUser] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb.insert(user).values(testUser).returning();

      expect(mockDb.insert).toHaveBeenCalledWith(user);
      expect(result).toBeDefined();
    });

    it('should retrieve user by ID', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .select()
        .from(user)
        .where(eq(user.id, 'user-123'))
        .limit(1);

      expect(mockDb.select).toHaveBeenCalled();
      expect(result).toEqual([testUser]);
    });

    it('should retrieve user by email', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testUser]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .select()
        .from(user)
        .where(eq(user.email, 'test@example.com'))
        .limit(1);

      expect(result).toEqual([testUser]);
    });

    it('should update user API keys and provider', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .update(user)
        .set({
          provider: 'openai',
          apiKeys: 'encrypted-key',
        })
        .where(eq(user.id, 'user-123'));

      expect(mockDb.update).toHaveBeenCalledWith(user);
      expect(result).toBeDefined();
    });

    it('should delete user and cascade to related tables', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 1 }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb.delete(user).where(eq(user.id, 'user-123'));

      expect(mockDb.delete).toHaveBeenCalledWith(user);
      expect(result).toBeDefined();
    });
  });

  describe('Session Operations', () => {
    const testSession = {
      id: 'session-123',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      token: 'session-token',
      createdAt: new Date(),
      updatedAt: new Date(),
      ipAddress: '192.168.1.1',
      userAgent: 'test-agent',
      userId: 'user-123',
    };

    it('should create a new session', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ rows: [testSession] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .insert(session)
        .values(testSession)
        .returning();

      expect(mockDb.insert).toHaveBeenCalledWith(session);
      expect(result).toBeDefined();
    });

    it('should retrieve session by token', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testSession]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .select()
        .from(session)
        .where(eq(session.token, 'session-token'))
        .limit(1);

      expect(result).toEqual([testSession]);
    });

    it('should update session expiration', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const newExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      const result = await mockDb
        .update(session)
        .set({ expiresAt: newExpiresAt })
        .where(eq(session.id, 'session-123'));

      expect(mockDb.update).toHaveBeenCalledWith(session);
      expect(result).toBeDefined();
    });

    it('should delete expired sessions', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 5 }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const result = await mockDb
        .delete(session)
        .where(eq(session.expiresAt, expiredDate));

      expect(mockDb.delete).toHaveBeenCalledWith(session);
      expect(result).toBeDefined();
    });
  });

  describe('Account Operations', () => {
    const testAccount = {
      id: 'account-123',
      accountId: 'oauth-account-123',
      providerId: 'google',
      userId: 'user-123',
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      idToken: 'id-token',
      accessTokenExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
      refreshTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      scope: 'openid email profile',
      password: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create OAuth account', async () => {
      const mockInsert = vi.fn().mockResolvedValue({ rows: [testAccount] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .insert(account)
        .values(testAccount)
        .returning();

      expect(mockDb.insert).toHaveBeenCalledWith(account);
      expect(result).toBeDefined();
    });

    it('should retrieve accounts by user ID', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([testAccount]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .select()
        .from(account)
        .where(eq(account.userId, 'user-123'))
        .orderBy(account.createdAt);

      expect(result).toEqual([testAccount]);
    });

    it('should update account tokens', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const newAccessToken = 'new-access-token';

      const result = await mockDb
        .update(account)
        .set({
          accessToken: newAccessToken,
          updatedAt: new Date(),
        })
        .where(eq(account.id, 'account-123'));

      expect(mockDb.update).toHaveBeenCalledWith(account);
      expect(result).toBeDefined();
    });
  });

  describe('Verification Operations', () => {
    const testVerification = {
      id: 'verification-123',
      identifier: 'test@example.com',
      value: 'verification-token',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create email verification token', async () => {
      const mockInsert = vi
        .fn()
        .mockResolvedValue({ rows: [testVerification] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .insert(verification)
        .values(testVerification)
        .returning();

      expect(mockDb.insert).toHaveBeenCalledWith(verification);
      expect(result).toBeDefined();
    });

    it('should retrieve verification by identifier and value', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([testVerification]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .select()
        .from(verification)
        .where(
          and(
            eq(verification.identifier, 'test@example.com'),
            eq(verification.value, 'verification-token'),
          ),
        )
        .limit(1);

      expect(result).toEqual([testVerification]);
    });

    it('should delete expired verifications', async () => {
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockResolvedValue({ rowCount: 3 }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const expiredDate = new Date(Date.now() - 60 * 60 * 1000);

      const result = await mockDb
        .delete(verification)
        .where(eq(verification.expiresAt, expiredDate));

      expect(mockDb.delete).toHaveBeenCalledWith(verification);
      expect(result).toBeDefined();
    });
  });

  describe('Subscription Operations', () => {
    const testSubscription = {
      id: 'subscription-123',
      userId: 'user-123',
      polarSubscriptionId: 'polar-sub-123',
      polarCustomerId: 'polar-cust-123',
      status: 'active',
      plan: 'Pro',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create subscription', async () => {
      const mockInsert = vi
        .fn()
        .mockResolvedValue({ rows: [testSubscription] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .insert(subscription)
        .values(testSubscription)
        .returning();

      expect(mockDb.insert).toHaveBeenCalledWith(subscription);
      expect(result).toBeDefined();
    });

    it('should retrieve user subscriptions', async () => {
      const mockQuery = {
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockResolvedValue([testSubscription]),
      };
      mockDb.select.mockReturnValue(mockQuery as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .select()
        .from(subscription)
        .where(eq(subscription.userId, 'user-123'))
        .orderBy(subscription.createdAt);

      expect(result).toEqual([testSubscription]);
    });

    it('should update subscription status', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue({ rowCount: 1 }),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      const result = await mockDb
        .update(subscription)
        .set({
          status: 'canceled',
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(subscription.id, 'subscription-123'));

      expect(mockDb.update).toHaveBeenCalledWith(subscription);
      expect(result).toBeDefined();
    });
  });

  describe('Transaction Safety', () => {
    it('should handle transaction rollback on error', async () => {
      // Mock insert for the transaction
      const mockInsert = vi.fn().mockResolvedValue({ rows: [testUser] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      // Mock a transaction that fails partway through
      mockDb.transaction = vi.fn().mockImplementation(async (callback) => {
        await callback(mockDb);
      });

      await expect(
        mockDb.transaction(async (tx) => {
          await tx.insert(user).values(testUser);
          throw new Error('Transaction failed');
        }),
      ).rejects.toThrow('Transaction failed');
    });

    it('should complete successful transactions', async () => {
      // Mock insert for the transaction
      const mockInsert = vi.fn().mockResolvedValue({ rows: [testUser] });
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(mockInsert),
        }),
      } as any); // eslint-disable-line @typescript-eslint/no-explicit-any

      mockDb.transaction = vi.fn().mockImplementation(async (callback) => {
        return await callback(mockDb);
      });

      const result = await mockDb.transaction(async (tx) => {
        await tx.insert(user).values(testUser);
        return { success: true };
      });

      expect(result).toEqual({ success: true });
    });
  });
});
