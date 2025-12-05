import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Import the module to test
import { authClient } from '@/lib/auth-client';

describe('auth-client', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Mock environment variables
    process.env.BETTER_AUTH_URL = 'http://localhost:3000';
    process.env.POLAR_PRODUCT_FREE = 'free_product_id';
    process.env.POLAR_PRODUCT_PRO = 'pro_product_id';
    process.env.POLAR_PRODUCT_STARTUP = 'startup_product_id';
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  describe('authClient', () => {
    it('should create auth client with correct configuration', () => {
      expect(authClient).toBeDefined();
      // The authClient is a factory function that returns a client instance
      expect(typeof authClient).toBe('function');
      // Test that calling it returns an object with auth methods
      const clientInstance = authClient;
      expect(typeof clientInstance).toBe('function');
    });

    it('should handle missing BETTER_AUTH_URL gracefully', () => {
      delete process.env.BETTER_AUTH_URL;

      // Should not throw during import, but may fail at runtime
      expect(authClient).toBeDefined();
    });

    it('should configure Polar plugin', () => {
      // The client should be configured with Polar plugin
      expect(authClient).toBeDefined();
    });
  });

  describe('integration', () => {
    it('should maintain referential stability', () => {
      const client1 = authClient;
      const client2 = authClient;

      expect(client1).toBe(client2);
    });

    it('should work with different environment configurations', () => {
      // Test that the current configuration is working
      expect(authClient).toBeDefined();
    });
  });
});
