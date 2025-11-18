import { beforeEach, describe, expect, it, vi, type MockedFunction } from 'vitest';
import {
  cancelSubscription,
  createCheckoutSession,
  getCheckoutSession,
  getSubscription,
  listProducts,
  PLAN_TO_PRODUCT_ID,
} from '@/lib/polar-client';
import type { Polar } from '@polar-sh/sdk';

// Mock Polar SDK
vi.mock('@polar-sh/sdk', () => ({
  Polar: class {
    checkouts = {
      create: vi.fn(),
      get: vi.fn(),
    };
    products = {
      list: vi.fn(),
    };
    subscriptions = {
      get: vi.fn(),
      revoke: vi.fn(),
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
  let polarMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Set up environment variables
    for (const [key, value] of Object.entries(mockEnv)) {
      process.env[key] = value;
    }

    // Get the mock Polar instance
    const { Polar } = vi.mocked(require('@polar-sh/sdk'));
    polarMock = vi.mocked(new Polar());
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
      polarMock.checkouts.create.mockResolvedValueOnce({
        url: 'https://polar.sh/checkout/123',
        id: 'checkout_123',
      });

      const url = await createCheckoutSession({
        plan: 'pro',
        customerEmail: 'user@example.com',
      });

      expect(url).toBe('https://polar.sh/checkout/123');
      expect(polarMock.checkouts.create).toHaveBeenCalledWith({
        products: ['prod_pro_123'],
        customerEmail: 'user@example.com',
        successUrl: 'https://example.com/success',
      });
    });

    it('should create checkout session for startup plan', async () => {
      polarMock.checkouts.create.mockResolvedValueOnce({
        url: 'https://polar.sh/checkout/456',
        id: 'checkout_456',
      });

      const url = await createCheckoutSession({
        plan: 'startup',
        customerEmail: 'user@example.com',
      });

      expect(url).toBe('https://polar.sh/checkout/456');
      expect(polarMock.checkouts.create).toHaveBeenCalledWith({
        products: ['prod_startup_123'],
        customerEmail: 'user@example.com',
        successUrl: 'https://example.com/success',
      });
    });

    it('should use custom success URL if provided', async () => {
      polarMock.checkouts.create.mockResolvedValueOnce({
        url: 'https://polar.sh/checkout/123',
      });

      await createCheckoutSession({
        plan: 'pro',
        customerEmail: 'user@example.com',
        successUrl: 'https://custom.com/success',
      });

      expect(polarMock.checkouts.create).toHaveBeenCalledWith({
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
      delete process.env.POLAR_PRODUCT_PRO;

      await expect(
        createCheckoutSession({
          plan: 'pro',
          customerEmail: 'user@example.com',
        }),
      ).rejects.toThrow(/Product ID not configured/);
    });

    it('should throw error if no checkout URL returned', async () => {
      polarMock.checkouts.create.mockResolvedValueOnce({
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
      polarMock.checkouts.create.mockRejectedValueOnce(
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

      polarMock.checkouts.get.mockResolvedValueOnce(mockCheckout);

      const result = await getCheckoutSession('checkout_123');

      expect(result).toEqual(mockCheckout);
      expect(polarMock.checkouts.get).toHaveBeenCalledWith({
        id: 'checkout_123',
      });
    });

    it('should handle errors when retrieving checkout session', async () => {
      polarMock.checkouts.get.mockRejectedValueOnce(new Error('Not found'));

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

      polarMock.products.list.mockResolvedValueOnce(mockProducts);

      const result = await listProducts();

      expect(result).toEqual(mockProducts);
      expect(polarMock.products.list).toHaveBeenCalledWith({
        organizationId: undefined,
        page: 1,
      });
    });

    it('should list products with organization ID', async () => {
      const mockProducts = {
        items: [{ id: 'prod_1', name: 'Product 1' }],
      };

      polarMock.products.list.mockResolvedValueOnce(mockProducts);

      const result = await listProducts('org_123');

      expect(result).toEqual(mockProducts);
      expect(polarMock.products.list).toHaveBeenCalledWith({
        organizationId: 'org_123',
        page: 1,
      });
    });

    it('should handle errors when listing products', async () => {
      polarMock.products.list.mockRejectedValueOnce(
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

      polarMock.subscriptions.get.mockResolvedValueOnce(mockSubscription);

      const result = await getSubscription('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(polarMock.subscriptions.get).toHaveBeenCalledWith({
        id: 'sub_123',
      });
    });

    it('should handle errors when retrieving subscription', async () => {
      polarMock.subscriptions.get.mockRejectedValueOnce(
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

      polarMock.subscriptions.revoke.mockResolvedValueOnce(mockSubscription);

      const result = await cancelSubscription('sub_123');

      expect(result).toEqual(mockSubscription);
      expect(polarMock.subscriptions.revoke).toHaveBeenCalledWith({
        id: 'sub_123',
      });
    });

    it('should handle errors when canceling subscription', async () => {
      polarMock.subscriptions.revoke.mockRejectedValueOnce(
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
      polarMock.checkouts.create.mockRejectedValueOnce('string error');

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
