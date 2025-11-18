import { beforeEach, describe, expect, it, vi } from 'vitest';

// Create shared mocks and set env vars using hoisted (runs before vi.mock)
const { mockCheckoutsCreate, mockCheckoutsGet, mockProductsList, mockSubscriptionsGet, mockSubscriptionsRevoke } = vi.hoisted(() => {
  // Set up environment variables before anything else
  process.env.POLAR_ACCESS_TOKEN = 'test_token';
  process.env.POLAR_PRODUCT_FREE = 'prod_free_123';
  process.env.POLAR_PRODUCT_PRO = 'prod_pro_123';
  process.env.POLAR_PRODUCT_STARTUP = 'prod_startup_123';
  process.env.POLAR_SUCCESS_URL = 'https://example.com/success';
  process.env.NEXT_PUBLIC_URL = 'https://example.com';

  return {
    mockCheckoutsCreate: vi.fn(),
    mockCheckoutsGet: vi.fn(),
    mockProductsList: vi.fn(),
    mockSubscriptionsGet: vi.fn(),
    mockSubscriptionsRevoke: vi.fn(),
  };
});

import {
  cancelSubscription,
  createCheckoutSession,
  getCheckoutSession,
  getSubscription,
  listProducts,
  PLAN_TO_PRODUCT_ID,
} from '@/lib/polar-client';

// Mock Polar SDK
vi.mock('@polar-sh/sdk', () => ({
  Polar: class {
    checkouts = {
      create: mockCheckoutsCreate,
      get: mockCheckoutsGet,
    };
    products = {
      list: mockProductsList,
    };
    subscriptions = {
      get: mockSubscriptionsGet,
      revoke: mockSubscriptionsRevoke,
    };
  },
}));

// Mock environment variables
const mockEnv = {
  POLAR_ACCESS_TOKEN: 'test_token',
  POLAR_PRODUCT_FREE: 'prod_free_123',
  POLAR_PRODUCT_PRO: 'prod_pro_123',
  POLAR_PRODUCT_STARTUP: 'prod_startup_123',
  POLAR_SUCCESS_URL: 'https://example.com/success',
  NEXT_PUBLIC_URL: 'https://example.com',
};

describe('Polar Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    for (const [key, value] of Object.entries(mockEnv)) {
      process.env[key] = value;
    }

    // Reset mocks to default behavior
    mockCheckoutsCreate.mockResolvedValue({
      url: 'https://polar.sh/checkout/default',
      id: 'checkout_default',
    });
    mockCheckoutsGet.mockResolvedValue({
      id: 'checkout_default',
      url: 'https://polar.sh/checkout/default',
    });
    mockProductsList.mockResolvedValue({ items: [] });
    mockSubscriptionsGet.mockResolvedValue({ id: 'sub_default' });
    mockSubscriptionsRevoke.mockResolvedValue({ id: 'sub_default', status: 'canceled' });
  });

  describe('PLAN_TO_PRODUCT_ID', () => {
    it('should have mappings for all plans', () => {
      expect(PLAN_TO_PRODUCT_ID.free).toBeDefined();
      expect(PLAN_TO_PRODUCT_ID.pro).toBeDefined();
      expect(PLAN_TO_PRODUCT_ID.startup).toBeDefined();
    });
  });

  describe('createCheckoutSession', () => {
    it('should create checkout session for pro plan', async () => {
      mockCheckoutsCreate.mockResolvedValueOnce({
        url: 'https://polar.sh/checkout/123',
        id: 'checkout_123',
      });

      const url = await createCheckoutSession({
        plan: 'pro',
        customerEmail: 'user@example.com',
      });

      expect(url).toBe('https://polar.sh/checkout/123');
      expect(mockCheckoutsCreate).toHaveBeenCalledWith({
        products: ['prod_pro_123'],
        customerEmail: 'user@example.com',
        successUrl: 'https://example.com/success',
      });
    });

    it('should create checkout session for startup plan', async () => {
      mockCheckoutsCreate.mockResolvedValueOnce({
        url: 'https://polar.sh/checkout/456',
        id: 'checkout_456',
      });

      const url = await createCheckoutSession({
        plan: 'startup',
        customerEmail: 'user@example.com',
      });

      expect(url).toBe('https://polar.sh/checkout/456');
      expect(mockCheckoutsCreate).toHaveBeenCalledWith({
        products: ['prod_startup_123'],
        customerEmail: 'user@example.com',
        successUrl: 'https://example.com/success',
      });
    });

    it('should use custom success URL if provided', async () => {
      mockCheckoutsCreate.mockResolvedValueOnce({
        url: 'https://polar.sh/checkout/123',
      });

      await createCheckoutSession({
        plan: 'pro',
        customerEmail: 'user@example.com',
        successUrl: 'https://custom.com/success',
      });

      expect(mockCheckoutsCreate).toHaveBeenCalledWith({
        products: ['prod_pro_123'],
        customerEmail: 'user@example.com',
        successUrl: 'https://custom.com/success',
      });
    });

    it('should throw error for free plan', async () => {
      await expect(
        createCheckoutSession({
          plan: 'free',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('Free plan does not require checkout');
    });

    it('should throw error if product ID not configured', async () => {
      // Temporarily set product ID to undefined to simulate missing configuration
      const originalPro = PLAN_TO_PRODUCT_ID.pro;
      (PLAN_TO_PRODUCT_ID as any).pro = undefined;

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow(/Product ID not configured/);

      // Restore original value
      (PLAN_TO_PRODUCT_ID as any).pro = originalPro;
    });

    it('should throw error if no checkout URL returned', async () => {
      mockCheckoutsCreate.mockResolvedValueOnce({
        id: 'checkout_123',
        url: null,
      });

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('No checkout URL returned from Polar');
    });

    it('should handle Polar SDK errors', async () => {
      mockCheckoutsCreate.mockRejectedValueOnce(
        new Error('Polar API error'),
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow('Failed to create checkout session: Polar API error');

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getCheckoutSession', () => {
    it('should retrieve checkout session by ID', async () => {
      const mockCheckout = {
        id: 'checkout_123',
        url: 'https://polar.sh/checkout/123',
        status: 'pending',
      };

      mockCheckoutsGet.mockResolvedValueOnce(mockCheckout);

      const result = await getCheckoutSession('checkout_123');

      expect(result).toEqual(mockCheckout);
      expect(mockCheckoutsGet).toHaveBeenCalledWith({
        id: 'checkout_123',
      });
    });

    it('should handle errors when retrieving checkout session', async () => {
      mockCheckoutsGet.mockRejectedValueOnce(new Error('Not found'));

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(getCheckoutSession('invalid_id')).rejects.toThrow(
        'Failed to get checkout session: Not found',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('listProducts', () => {
    it('should list products without organization ID', async () => {
      const mockProducts = {
        items: [
          { id: 'prod_1', name: 'Product 1' },
          { id: 'prod_2', name: 'Product 2' },
        ],
      };

      mockProductsList.mockResolvedValueOnce(mockProducts);

      const result = await listProducts();

      expect(result).toEqual(mockProducts);
      expect(mockProductsList).toHaveBeenCalledWith({
        organizationId: undefined,
        page: 1,
      });
    });

    it('should list products with organization ID', async () => {
      const mockProducts = {
        items: [{ id: 'prod_1', name: 'Product 1' }],
      };

      mockProductsList.mockResolvedValueOnce(mockProducts);

      const result = await listProducts('org_123');

      expect(result).toEqual(mockProducts);
      expect(mockProductsList).toHaveBeenCalledWith({
        organizationId: 'org_123',
        page: 1,
      });
    });

    it('should handle errors when listing products', async () => {
      mockProductsList.mockRejectedValueOnce(
        new Error('API error'),
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(listProducts()).rejects.toThrow(
        'Failed to list products: API error',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('getSubscription', () => {
    it('should retrieve subscription by ID', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
        plan: 'pro',
      };

      mockSubscriptionsGet.mockResolvedValueOnce(mockSubscription);

      const result = await getSubscription('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionsGet).toHaveBeenCalledWith({
        id: 'sub_123',
      });
    });

    it('should handle errors when retrieving subscription', async () => {
      mockSubscriptionsGet.mockRejectedValueOnce(
        new Error('Not found'),
      );

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(getSubscription('invalid_id')).rejects.toThrow(
        'Failed to get subscription: Not found',
      );

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('cancelSubscription', () => {
    it('should cancel subscription by ID', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'canceled',
      };

      mockSubscriptionsRevoke.mockResolvedValueOnce(mockSubscription);

      const result = await cancelSubscription('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(mockSubscriptionsRevoke).toHaveBeenCalledWith({
        id: 'sub_123',
      });
    });

    it('should handle errors when canceling subscription', async () => {
      mockSubscriptionsRevoke.mockRejectedValueOnce(
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

  describe('Error handling', () => {
    it('should handle non-Error objects in catch blocks', async () => {
      mockCheckoutsCreate.mockRejectedValueOnce('string error');

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
