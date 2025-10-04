import { describe, it, expect } from 'vitest'
import { getPlanName } from '@/lib/plan-map'

describe('plan-map', () => {
  describe('getPlanName', () => {
    it('should return correct plan name for valid product ID', () => {
      it('should return correct plan name for valid product ID', () => {
        expect(process.env.POLAR_PRODUCT_FREE).toBeDefined()
        expect(process.env.POLAR_PRODUCT_PRO).toBeDefined()
        expect(process.env.POLAR_PRODUCT_STARTUP).toBeDefined()
        expect(getPlanName(process.env.POLAR_PRODUCT_FREE!)).toBe('Free')
        expect(getPlanName(process.env.POLAR_PRODUCT_PRO!)).toBe('Pro')
        expect(getPlanName(process.env.POLAR_PRODUCT_STARTUP!)).toBe('Startup')
      })
    })

    it('should return "Unknown Plan" for null product ID', () => {
      expect(getPlanName(null)).toBe('Unknown Plan')
    })

    it('should return "Unknown Plan" for undefined product ID', () => {
      expect(getPlanName(undefined)).toBe('Unknown Plan')
    })

    it('should return "Unknown Plan" for empty string product ID', () => {
      expect(getPlanName('')).toBe('Unknown Plan')
    })

    it('should return "Unknown Plan" for non-existent product ID', () => {
      expect(getPlanName('non_existent_id')).toBe('Unknown Plan')
    })

    it('should handle partial matches', () => {
      // Test partial matching logic using actual product IDs
      expect(process.env.POLAR_PRODUCT_FREE).toBeDefined()
      expect(process.env.POLAR_PRODUCT_PRO).toBeDefined()
      const freeId = process.env.POLAR_PRODUCT_FREE!
      const proId = process.env.POLAR_PRODUCT_PRO!
      expect(getPlanName(freeId.substring(0, 10))).toBe('Free') // partial match
      expect(getPlanName(proId.substring(0, 5))).toBe('Pro') // partial match
    })

    it('should handle case sensitivity', () => {
      expect(process.env.POLAR_PRODUCT_FREE).toBeDefined()
      const freeId = process.env.POLAR_PRODUCT_FREE!
      expect(getPlanName(freeId.toUpperCase())).toBe('Unknown Plan') // case sensitive
      expect(getPlanName(freeId)).toBe('Free') // exact match
    })
  })
})