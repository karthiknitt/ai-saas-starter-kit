import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create shared mocks and set env vars using hoisted (runs before vi.mock)
const { mockSubscriptionsCreate, mockSubscriptionsFetch, mockSubscriptionsCancel, mockPlansAll } =
  vi.hoisted(() => {
    // Set up environment variables before anything else
    process.env.RAZORPAY_KEY_ID = 'rzp_test_1234567890';
    process.env.RAZORPAY_KEY_SECRET = 'test_secret';
    process.env.RAZORPAY_PLAN_FREE = 'plan_free_123';
    process.env.RAZORPAY_PLAN_PRO = 'plan_pro_123';
    process.env.RAZORPAY_PLAN_STARTUP = 'plan_startup_123';
    process.env.NEXT_PUBLIC_URL = 'https://example.com';

    return {
      mockSubscriptionsCreate: vi.fn(),
      mockSubscriptionsFetch: vi.fn(),
      mockSubscriptionsCancel: vi.fn(),
      mockPlansAll: vi.fn(),
    };
  });

import {
  cancelSubscription,
  createCheckoutSession,
  getSubscription,
  listPlans,
  PLAN_TO_PLAN_ID,
} from '@/lib/razorpay-client';

// Mock Razorpay SDK
vi.mock('razorpay', () => ({
  default: class {
    subscriptions = {
      create: mockSubscriptionsCreate,
      fetch: mockSubscriptionsFetch,
      cancel: mockSubscriptionsCancel,
    };
    plans = {
      all: mockPlansAll,
    };
  },
}));

// Mock environment variables
const mockEnv = {
  RAZORPAY_KEY_ID: 'rzp_test_1234567890',
  RAZORPAY_KEY_SECRET: 'test_secret',
  RAZORPAY_PLAN_FREE: 'plan_free_123',
  RAZORPAY_PLAN_PRO: 'plan_pro_123',
  RAZORPAY_PLAN_STARTUP: 'plan_startup_123',
  NEXT_PUBLIC_URL: 'https://example.com',
};

describe('Razorpay Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    for (const [key, value] of Object.entries(mockEnv)) {
      process.env[key] = value;
    }

    // Reset mocks to default behavior
    mockSubscriptionsCreate.mockResolvedValue({
      id: 'sub_default',
      short_url: 'https://rzp.io/i/default',
      status: 'created',
    });
    mockSubscriptionsFetch.mockResolvedValue({
      id: 'sub_default',
      status: 'active',
    });
    mockSubscriptionsCancel.mockResolvedValue({
      id: 'sub_default',
      status: 'cancelled',
    });
    mockPlansAll.mockResolvedValue({ items: [] });
  });

  describe('PLAN_TO_PLAN_ID', () => {
    it('should have mappings for all plans', () => {
      expect(PLAN_TO_PLAN_ID.free).toBeDefined();
      expect(PLAN_TO_PLAN_ID.pro).toBeDefined();
      expect(PLAN_TO_PLAN_ID.startup).toBeDefined();
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for pro plan', async () => {
      mockSubscriptionsCreate.mockResolvedValueOnce({
        id: 'sub_123',
        short_url: 'https://rzp.io/i/123',
        status: 'created',
      });

      const url = await createCheckoutSession({
        plan: 'pro',
        customerEmail: 'user@example.com',
      });

      expect(url).toBe('https://rzp.io/i/123');
      expect(mockSubscriptionsCreate).toHaveBeenCalledWith({
        plan_id: 'plan_pro_123',
        total_count: 12,
        customer_notify: 1,
        notes: {
          customerEmail: 'user@example.com',
          successUrl: 'https://example.com/billing?success=true',
        },
      });
    });

    it('should create checkout session for startup plan', async () => {
      mockSubscriptionsCreate.mockResolvedValueOnce({
        id: 'sub_456',
        short_url: 'https://rzp.io/i/456',
        status: 'created',
      });

      const url = await createCheckoutSession({
        plan: 'startup',
        customerEmail: 'user@example.com',
      });

      expect(url).toBe('https://rzp.io/i/456');
      expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({ plan_id: 'plan_startup_123' }),
      );
    });

    it('should use custom success URL if provided', async () => {
      mockSubscriptionsCreate.mockResolvedValueOnce({
        id: 'sub_123',
        short_url: 'https://rzp.io/i/123',
      });

      await createCheckoutSession({
        plan: 'pro',
        customerEmail: 'user@example.com',
        successUrl: 'https://custom.com/success',
      });

      expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          notes: {
            customerEmail: 'user@example.com',
            successUrl: 'https://custom.com/success',
          },
        }),
      );
    });

    it('should throw error for free plan', async () => {
      await expect(
        createCheckoutSession({
          plan: 'free',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('Free plan does not require checkout');
    });

    it('should throw error if plan ID not configured', async () => {
      // Temporarily set plan ID to undefined to simulate missing configuration
      const originalPro = PLAN_TO_PLAN_ID.pro;
      (PLAN_TO_PLAN_ID as any).pro = undefined;

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow(/Plan ID not configured/);

      // Restore original value
      (PLAN_TO_PLAN_ID as any).pro = originalPro;
    });

    it('should throw error if no checkout URL returned', async () => {
      mockSubscriptionsCreate.mockResolvedValueOnce({
        id: 'sub_123',
        short_url: null,
      });

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('No checkout URL returned from Razorpay');
    });

    it('should handle Razorpay SDK errors', async () => {
      mockSubscriptionsCreate.mockRejectedValueOnce(
        new Error('Razorpay API error'),
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('Failed to create checkout session: Razorpay API error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription by ID', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        plan_id: 'plan_pro_123',
      };

      mockSubscriptionsFetch.mockResolvedValueOnce(mockSubscription);

      const result = await getSubscription('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionsFetch).toHaveBeenCalledWith('sub_123');
    });

    it('should handle errors when retrieving subscription', async () => {
      mockSubscriptionsFetch.mockRejectedValueOnce(new Error('Not found'));

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(getSubscription('sub_invalid')).rejects.toThrow(
        'Failed to get subscription: Not found',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription at cycle end by default', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'cancelled',
      };

      mockSubscriptionsCancel.mockResolvedValueOnce(mockSubscription);

      const result = await cancelSubscription('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_123', true);
    });

    it('should cancel subscription immediately when requested', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'cancelled',
      };

      mockSubscriptionsCancel.mockResolvedValueOnce(mockSubscription);

      const result = await cancelSubscription('sub_123', true);

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_123', false);
    });

    it('should handle errors when canceling subscription', async () => {
      mockSubscriptionsCancel.mockRejectedValueOnce(
        new Error('Cannot cancel'),
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(cancelSubscription('sub_123')).rejects.toThrow(
        'Failed to cancel subscription: Cannot cancel',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('listPlans', () => {
    it('should list plans', async () => {
      const mockPlans = {
        items: [
          { id: 'plan_1', item: { name: 'Pro' } },
          { id: 'plan_2', item: { name: 'Startup' } },
        ],
      };

      mockPlansAll.mockResolvedValueOnce(mockPlans);

      const result = await listPlans();

      expect(result).toEqual(mockPlans);
    });

    it('should handle errors when listing plans', async () => {
      mockPlansAll.mockRejectedValueOnce(new Error('API error'));

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(listPlans()).rejects.toThrow('Failed to list plans: API error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Error handling', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      mockSubscriptionsCreate.mockRejectedValueOnce('string error');

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('Failed to create checkout session: Unknown error');

      consoleErrorSpy.mockRestore();
    });
  });
});
