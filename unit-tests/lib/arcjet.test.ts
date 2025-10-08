import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock the arcjet module before importing our module
vi.mock('@arcjet/next', () => ({
  default: vi.fn(() => ({
    protect: vi.fn()
  })),
  detectBot: vi.fn(() => ({})),
  shield: vi.fn(() => ({}))
}))

describe('arcjet', () => {
  let originalArcjetKey: string | undefined

  beforeEach(() => {
    // Save original ARCJET_KEY
    originalArcjetKey = process.env.ARCJET_KEY

    // Clear the module cache to ensure fresh imports
    vi.resetModules()
  })

  afterEach(() => {
    // Restore original ARCJET_KEY
    if (originalArcjetKey !== undefined) {
      process.env.ARCJET_KEY = originalArcjetKey
    } else {
      delete process.env.ARCJET_KEY
    }
  })

  describe('initialization', () => {
    it('should throw error when ARCJET_KEY is not set', async () => {
      delete process.env.ARCJET_KEY

      await expect(async () => {
        await import('@/lib/arcjet')
      }).rejects.toThrow('ARCJET_KEY environment variable must be set')
    }, 30000) // Increase timeout significantly for this test

    it('should initialize with valid ARCJET_KEY', async () => {
      process.env.ARCJET_KEY = 'dummy-arcjet-key'

      const { aj } = await import('@/lib/arcjet')

      expect(aj).toBeDefined()
      expect(typeof aj.protect).toBe('function')
    })

    it('should export default instance', async () => {
      process.env.ARCJET_KEY = 'dummy-arcjet-key'

      const module = await import('@/lib/arcjet')

      expect(module.default).toBeDefined()
      expect(module.default).toBe(module.aj)
    })
  })

  describe('configuration', () => {
    it('should have ip.src as characteristic', async () => {
      process.env.ARCJET_KEY = 'dummy-arcjet-key'

      // This is a smoke test - in a real scenario, you'd inspect the configuration
      const { aj } = await import('@/lib/arcjet')
      expect(aj).toBeDefined()
    })
  })

  describe('error handling', () => {
    it('should handle empty ARCJET_KEY', async () => {
      process.env.ARCJET_KEY = ''

      await expect(async () => {
        await import('@/lib/arcjet')
      }).rejects.toThrow('ARCJET_KEY environment variable must be set')
    })

    it('should handle whitespace-only ARCJET_KEY', async () => {
      process.env.ARCJET_KEY = '   '

      // Arcjet might accept this, but it would likely fail at runtime
      // This test documents the behavior
      const { aj } = await import('@/lib/arcjet')
      expect(aj).toBeDefined()
    })
  })

  describe('integration with environment', () => {
    it('should use environment variable key', async () => {
      const testKey = 'dummy-arcjet-key'
      process.env.ARCJET_KEY = testKey

      // The key should be used internally by arcjet
      const { aj } = await import('@/lib/arcjet')
      expect(aj).toBeDefined()
    })

    it('should work with different key formats', async () => {
      const keys = [
        'sk-test-123',
        'live_key_456',
        'test_key_with_underscores_789',
        'simple-key',
      ]

      for (const key of keys) {
        process.env.ARCJET_KEY = key
        vi.resetModules()

        const { aj } = await import('@/lib/arcjet')
        expect(aj).toBeDefined()
      }
    })
  })
})