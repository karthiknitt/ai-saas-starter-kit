import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  canCreateApiKey,
  checkFeatureAccess,
  getAiRequestLimit,
  getAllowedModels,
  getAllPlans,
  getStorageLimit,
  getUpgradePlan,
  getUserPlan,
  getUserPlanFeatures,
  hasModelAccess,
  hasUnlimitedAiRequests,
  PLAN_FEATURES,
} from '@/lib/subscription-features';

// Mock dependencies
vi.mock('@/db/drizzle', () => ({
  db: {
    query: {
      subscription: {
        findFirst: vi.fn(),
      },
    },
  },
}));

import { db } from '@/db/drizzle';

describe('Subscription Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PLAN_FEATURES constant', () => {
    it('should have features for all plans', () => {
      expect(PLAN_FEATURES.free).toBeDefined();
      expect(PLAN_FEATURES.pro).toBeDefined();
      expect(PLAN_FEATURES.startup).toBeDefined();
    });

    it('should have correct free plan features', () => {
      const free = PLAN_FEATURES.free;
      expect(free.aiRequests).toBe(10);
      expect(free.models).toEqual(['gpt-3.5-turbo']);
      expect(free.apiKeys).toBe(1);
      expect(free.storage).toBe(100);
      expect(free.displayName).toBe('Free');
      expect(free.price).toBe(0);
    });

    it('should have correct pro plan features', () => {
      const pro = PLAN_FEATURES.pro;
      expect(pro.aiRequests).toBe(1000);
      expect(pro.models.length).toBeGreaterThan(1);
      expect(pro.models).toContain('gpt-3.5-turbo');
      expect(pro.models).toContain('gpt-4');
      expect(pro.apiKeys).toBe(5);
      expect(pro.storage).toBe(10240);
      expect(pro.displayName).toBe('Pro');
      expect(pro.price).toBe(19);
    });

    it('should have correct startup plan features', () => {
      const startup = PLAN_FEATURES.startup;
      expect(startup.aiRequests).toBe(-1);
      expect(startup.models).toEqual(['*']);
      expect(startup.apiKeys).toBe(-1);
      expect(startup.storage).toBe(-1);
      expect(startup.displayName).toBe('Startup');
      expect(startup.price).toBe(29);
    });
  });

  describe('getUserPlan', () => {
    it('should return free if no subscription', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await getUserPlan('user_123');

      expect(result).toBe('free');
    });

    it('should return free if subscription inactive', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'canceled',
      } as any);

      const result = await getUserPlan('user_123');

      expect(result).toBe('free');
    });

    it('should return plan name if active subscription', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await getUserPlan('user_123');

      expect(result).toBe('pro');
    });

    it('should convert plan name to lowercase', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'STARTUP',
        status: 'active',
      } as any);

      const result = await getUserPlan('user_123');

      expect(result).toBe('startup');
    });

    it('should return free for invalid plan name', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'InvalidPlan',
        status: 'active',
      } as any);

      const result = await getUserPlan('user_123');

      expect(result).toBe('free');
    });

    it('should handle errors gracefully', async () => {
      vi.mocked(db.query.subscription.findFirst).mockRejectedValueOnce(
        new Error('DB error'),
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await getUserPlan('user_123');

      expect(result).toBe('free');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getUserPlanFeatures', () => {
    it('should return features for free plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await getUserPlanFeatures('user_123');

      expect(result).toEqual(PLAN_FEATURES.free);
    });

    it('should return features for pro plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await getUserPlanFeatures('user_123');

      expect(result).toEqual(PLAN_FEATURES.pro);
    });

    it('should return features for startup plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await getUserPlanFeatures('user_123');

      expect(result).toEqual(PLAN_FEATURES.startup);
    });
  });

  describe('hasModelAccess', () => {
    it('should allow free plan to access gpt-3.5-turbo', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await hasModelAccess('user_123', 'gpt-3.5-turbo');

      expect(result).toBe(true);
    });

    it('should deny free plan access to gpt-4', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await hasModelAccess('user_123', 'gpt-4');

      expect(result).toBe(false);
    });

    it('should allow pro plan to access gpt-4', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await hasModelAccess('user_123', 'gpt-4');

      expect(result).toBe(true);
    });

    it('should allow startup plan to access any model', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await hasModelAccess('user_123', 'claude-3-opus-20240229');

      expect(result).toBe(true);
    });
  });

  describe('getAllowedModels', () => {
    it('should return allowed models for free plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await getAllowedModels('user_123');

      expect(result).toEqual(['gpt-3.5-turbo']);
    });

    it('should return allowed models for pro plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await getAllowedModels('user_123');

      expect(result.length).toBeGreaterThan(1);
      expect(result).toContain('gpt-4');
    });

    it('should return wildcard for startup plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await getAllowedModels('user_123');

      expect(result).toEqual(['*']);
    });
  });

  describe('canCreateApiKey', () => {
    it('should allow free plan to create 1 API key', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await canCreateApiKey('user_123', 0);

      expect(result).toBe(true);
    });

    it('should deny free plan from creating more than 1 API key', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await canCreateApiKey('user_123', 1);

      expect(result).toBe(false);
    });

    it('should allow pro plan to create up to 5 API keys', async () => {
      vi.mocked(db.query.subscription.findFirst)
        .mockResolvedValueOnce({
          userId: 'user_123',
          plan: 'Pro',
          status: 'active',
        } as any)
        .mockResolvedValueOnce({
          userId: 'user_123',
          plan: 'Pro',
          status: 'active',
        } as any)
        .mockResolvedValueOnce({
          userId: 'user_123',
          plan: 'Pro',
          status: 'active',
        } as any);

      expect(await canCreateApiKey('user_123', 0)).toBe(true);
      expect(await canCreateApiKey('user_123', 4)).toBe(true);
      expect(await canCreateApiKey('user_123', 5)).toBe(false);
    });

    it('should allow startup plan to create unlimited API keys', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await canCreateApiKey('user_123', 100);

      expect(result).toBe(true);
    });
  });

  describe('getAiRequestLimit', () => {
    it('should return 10 for free plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await getAiRequestLimit('user_123');

      expect(result).toBe(10);
    });

    it('should return 1000 for pro plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await getAiRequestLimit('user_123');

      expect(result).toBe(1000);
    });

    it('should return -1 for startup plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await getAiRequestLimit('user_123');

      expect(result).toBe(-1);
    });
  });

  describe('hasUnlimitedAiRequests', () => {
    it('should return false for free plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await hasUnlimitedAiRequests('user_123');

      expect(result).toBe(false);
    });

    it('should return false for pro plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await hasUnlimitedAiRequests('user_123');

      expect(result).toBe(false);
    });

    it('should return true for startup plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await hasUnlimitedAiRequests('user_123');

      expect(result).toBe(true);
    });
  });

  describe('getStorageLimit', () => {
    it('should return 100MB for free plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await getStorageLimit('user_123');

      expect(result).toBe(100);
    });

    it('should return 10GB for pro plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Pro',
        status: 'active',
      } as any);

      const result = await getStorageLimit('user_123');

      expect(result).toBe(10240);
    });

    it('should return -1 for startup plan', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await getStorageLimit('user_123');

      expect(result).toBe(-1);
    });
  });

  describe('getUpgradePlan', () => {
    it('should suggest pro for free plan', () => {
      expect(getUpgradePlan('free')).toBe('pro');
    });

    it('should suggest startup for pro plan', () => {
      expect(getUpgradePlan('pro')).toBe('startup');
    });

    it('should return null for startup plan', () => {
      expect(getUpgradePlan('startup')).toBeNull();
    });
  });

  describe('getAllPlans', () => {
    it('should return all available plans', () => {
      const plans = getAllPlans();

      expect(plans).toHaveLength(3);
      expect(plans.find((p) => p.id === 'free')).toBeDefined();
      expect(plans.find((p) => p.id === 'pro')).toBeDefined();
      expect(plans.find((p) => p.id === 'startup')).toBeDefined();
    });

    it('should include plan details', () => {
      const plans = getAllPlans();
      const freePlan = plans.find((p) => p.id === 'free');

      expect(freePlan?.name).toBe('Free');
      expect(freePlan?.price).toBe(0);
      expect(freePlan?.features).toEqual(PLAN_FEATURES.free);
    });
  });

  describe('checkFeatureAccess', () => {
    it('should check numeric features', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await checkFeatureAccess('user_123', 'aiRequests');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(10);
    });

    it('should check unlimited features', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce({
        userId: 'user_123',
        plan: 'Startup',
        status: 'active',
      } as any);

      const result = await checkFeatureAccess('user_123', 'aiRequests');

      expect(result.allowed).toBe(true);
      expect(result.limit).toBe(Infinity);
    });

    it('should check array features', async () => {
      vi.mocked(db.query.subscription.findFirst).mockResolvedValueOnce(null);

      const result = await checkFeatureAccess('user_123', 'models');

      expect(result.allowed).toBe(true);
    });
  });
});
