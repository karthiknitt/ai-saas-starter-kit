import { describe, expect, it, vi } from 'vitest';

// Set plan IDs explicitly before plan-map is imported so PRODUCT_MAP is
// built deterministically regardless of test execution order.
vi.hoisted(() => {
  process.env.RAZORPAY_PLAN_FREE = 'free_plan_id';
  process.env.RAZORPAY_PLAN_PRO = 'pro_plan_id';
  process.env.RAZORPAY_PLAN_STARTUP = 'startup_plan_id';
});

import { getPlanName } from '@/lib/plan-map';

describe('plan-map', () => {
  describe('getPlanName', () => {
    it('should return correct plan name for valid plan ID', () => {
      expect(process.env.RAZORPAY_PLAN_FREE).toBeDefined();
      expect(process.env.RAZORPAY_PLAN_PRO).toBeDefined();
      expect(process.env.RAZORPAY_PLAN_STARTUP).toBeDefined();
      expect(getPlanName(process.env.RAZORPAY_PLAN_FREE!)).toBe('Free');
      expect(getPlanName(process.env.RAZORPAY_PLAN_PRO!)).toBe('Pro');
      expect(getPlanName(process.env.RAZORPAY_PLAN_STARTUP!)).toBe('Startup');
    });

    it('should return "Unknown Plan" for null plan ID', () => {
      expect(getPlanName(null)).toBe('Unknown Plan');
    });

    it('should return "Unknown Plan" for undefined plan ID', () => {
      expect(getPlanName(undefined)).toBe('Unknown Plan');
    });

    it('should return "Unknown Plan" for empty string plan ID', () => {
      expect(getPlanName('')).toBe('Unknown Plan');
    });

    it('should return "Unknown Plan" for non-existent plan ID', () => {
      expect(getPlanName('non_existent_id')).toBe('Unknown Plan');
    });

    it('should handle partial matches', () => {
      // Test partial matching logic using actual plan IDs
      expect(process.env.RAZORPAY_PLAN_FREE).toBeDefined();
      expect(process.env.RAZORPAY_PLAN_PRO).toBeDefined();
      const freeId = process.env.RAZORPAY_PLAN_FREE!;
      const proId = process.env.RAZORPAY_PLAN_PRO!;
      expect(getPlanName(freeId.substring(0, 10))).toBe('Free'); // partial match
      expect(getPlanName(proId.substring(0, 5))).toBe('Pro'); // partial match
    });

    it('should handle case sensitivity', () => {
      expect(process.env.RAZORPAY_PLAN_FREE).toBeDefined();
      const freeId = process.env.RAZORPAY_PLAN_FREE!;
      expect(getPlanName(freeId.toUpperCase())).toBe('Unknown Plan'); // case sensitive
      expect(getPlanName(freeId)).toBe('Free'); // exact match
    });
  });
});
