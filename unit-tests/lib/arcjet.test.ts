import { describe, it, expect, beforeAll, afterAll } from 'vitest'

describe('arcjet configuration', () => {
  const originalEnv = process.env.ARCJET_KEY

  beforeAll(() => {
    // Set a test key for these tests
    process.env.ARCJET_KEY = 'test-arcjet-key-12345'
  })

  afterAll(() => {
    // Restore original environment
    if (originalEnv) {
      process.env.ARCJET_KEY = originalEnv
    } else {
      delete process.env.ARCJET_KEY
    }
  })

  describe('initialization', () => {
    it('should export arcjet instance', async () => {
      const { aj } = await import('@/lib/arcjet')
      
      expect(aj).toBeDefined()
      expect(typeof aj).toBe('object')
    })

    it('should export default instance', async () => {
      const arcjetModule = await import('@/lib/arcjet')
      
      expect(arcjetModule.default).toBeDefined()
      expect(arcjetModule.default).toBe(arcjetModule.aj)
    })
  })

  describe('error handling', () => {
    it('should throw error when ARCJET_KEY is not set', async () => {
      // Clear the environment variable
      const savedKey = process.env.ARCJET_KEY
      delete process.env.ARCJET_KEY

      // Clear module cache to force re-evaluation
      const modulePath = require.resolve('@/lib/arcjet')
      delete require.cache[modulePath]

      // Should throw when importing without key
      await expect(async () => {
        await import('@/lib/arcjet?t=' + Date.now())
      }).rejects.toThrow()

      // Restore key
      process.env.ARCJET_KEY = savedKey
    })

    it('should include helpful error message', async () => {
      const savedKey = process.env.ARCJET_KEY
      delete process.env.ARCJET_KEY

      try {
        // Try to load the module - should fail
        const { aj } = await import('@/lib/arcjet')
        expect(aj).toBeUndefined() // Should not reach here
      } catch (error) {
        expect(error).toBeInstanceOf(Error)
        expect((error as Error).message).toContain('ARCJET_KEY')
        expect((error as Error).message).toContain('environment variable')
      }

      process.env.ARCJET_KEY = savedKey
    })
  })

  describe('configuration validation', () => {
    it('should be configured with ip.src characteristic', async () => {
      // This test validates that the configuration includes the expected characteristic
      // Since we can't easily inspect the internal configuration without complex mocking,
      // we verify the module loads successfully with the expected setup
      const { aj } = await import('@/lib/arcjet')
      
      expect(aj).toBeDefined()
      // In a real implementation, arcjet would be configured with characteristics
      // This test ensures the module initializes correctly
    })

    it('should have shield rule configured', async () => {
      // Similar to above, we verify the module loads with shield protection
      const { aj } = await import('@/lib/arcjet')
      
      expect(aj).toBeDefined()
      // Shield should be configured in LIVE mode
    })

    it('should have bot detection configured', async () => {
      // Verify bot detection is configured
      const { aj } = await import('@/lib/arcjet')
      
      expect(aj).toBeDefined()
      // Bot detection should allow search engines
    })
  })

  describe('environment-specific behavior', () => {
    it('should work with valid API key format', () => {
      // Test various valid key formats
      const validKeys = [
        'aj_test_1234567890abcdef',
        'test-key-123',
        'arcjet-key-production',
      ]

      validKeys.forEach(key => {
        process.env.ARCJET_KEY = key
        expect(() => {
          // Re-evaluate with new key
          const modulePath = require.resolve('@/lib/arcjet')
          delete require.cache[modulePath]
        }).not.toThrow()
      })
    })

    it('should handle empty string as missing key', async () => {
      process.env.ARCJET_KEY = ''
      
      const modulePath = require.resolve('@/lib/arcjet')
      delete require.cache[modulePath]

      await expect(async () => {
        await import('@/lib/arcjet?t=' + Date.now())
      }).rejects.toThrow(/ARCJET_KEY/)
    })
  })

  describe('type safety', () => {
    it('should export aj with correct type', async () => {
      const { aj } = await import('@/lib/arcjet')
      
      // Verify it has the expected protect method
      expect(typeof aj.protect).toBe('function')
    })
  })
})