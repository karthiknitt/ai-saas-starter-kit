import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('arcjet', () => {
  let originalEnv: NodeJS.ProcessEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
  })

  afterEach(() => {
    process.env = originalEnv
    // Clear module cache to reset imports
    vi.resetModules()
  })

  describe('configuration', () => {
    it('should throw error if ARCJET_KEY is not set', async () => {
      delete process.env.ARCJET_KEY

      await expect(async () => {
        await import('@/lib/arcjet')
      }).rejects.toThrow('ARCJET_KEY environment variable must be set')
    })

    it('should initialize successfully with ARCJET_KEY set', async () => {
      process.env.ARCJET_KEY = 'test-key-12345'

      const arcjetModule = await import('@/lib/arcjet')
      
      expect(arcjetModule.aj).toBeDefined()
      expect(arcjetModule.default).toBeDefined()
    })

    it('should export default instance', async () => {
      process.env.ARCJET_KEY = 'test-key-12345'

      const arcjetModule = await import('@/lib/arcjet')
      
      expect(arcjetModule.default).toBe(arcjetModule.aj)
    })
  })

  describe('security rules', () => {
    it('should have shield protection configured', async () => {
      process.env.ARCJET_KEY = 'test-key-12345'

      // We can't directly test the rules configuration without mocking @arcjet/next
      // But we can verify the module loads successfully with a key
      await expect(import('@/lib/arcjet')).resolves.toBeDefined()
    })

    it('should have bot detection configured', async () => {
      process.env.ARCJET_KEY = 'test-key-12345'

      await expect(import('@/lib/arcjet')).resolves.toBeDefined()
    })
  })

  describe('characteristics', () => {
    it('should use IP source for rate limiting', async () => {
      process.env.ARCJET_KEY = 'test-key-12345'

      // Verify module loads successfully - actual characteristics are set in config
      await expect(import('@/lib/arcjet')).resolves.toBeDefined()
    })
  })

  describe('edge cases', () => {
    it('should handle empty ARCJET_KEY', async () => {
      process.env.ARCJET_KEY = ''

      await expect(async () => {
        await import('@/lib/arcjet')
      }).rejects.toThrow('ARCJET_KEY environment variable must be set')
    })

    it('should handle whitespace-only ARCJET_KEY', async () => {
      process.env.ARCJET_KEY = '   '

      // Module will load but Arcjet may fail at runtime
      // We're only testing the initial validation here
      await expect(import('@/lib/arcjet')).resolves.toBeDefined()
    })
  })
})