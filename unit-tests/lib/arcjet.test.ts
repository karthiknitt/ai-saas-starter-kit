import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Arcjet before importing
vi.mock('@arcjet/next', () => ({
  default: vi.fn((config) => ({
    protect: vi.fn(async () => ({
      isDenied: vi.fn(() => false),
      isAllowed: vi.fn(() => true),
      conclusion: 'ALLOW',
    })),
    config,
  })),
  detectBot: vi.fn((config) => config),
  shield: vi.fn((config) => config),
}))

describe('arcjet', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set environment variable
    process.env.ARCJET_KEY = 'test-arcjet-key'
  })

  describe('initialization', () => {
    it('should initialize with environment key', async () => {
      const { aj } = await import('@/lib/arcjet')
      expect(aj).toBeDefined()
      expect(aj.config).toBeDefined()
    })

    it('should throw error if ARCJET_KEY is not set', async () => {
      delete process.env.ARCJET_KEY
      
      await expect(async () => {
        // Force re-import by clearing cache
        vi.resetModules()
        await import('@/lib/arcjet')
      }).rejects.toThrow('ARCJET_KEY environment variable must be set')

      // Restore for other tests
      process.env.ARCJET_KEY = 'test-arcjet-key'
    })

    it('should configure with correct characteristics', async () => {
      const { aj } = await import('@/lib/arcjet')
      expect(aj.config.characteristics).toContain('ip.src')
    })

    it('should include shield rule', async () => {
      const { aj } = await import('@/lib/arcjet')
      expect(aj.config.rules).toBeDefined()
      expect(aj.config.rules.length).toBeGreaterThan(0)
    })

    it('should include bot detection rule', async () => {
      const { aj } = await import('@/lib/arcjet')
      expect(aj.config.rules).toBeDefined()
      expect(aj.config.rules.length).toBeGreaterThan(0)
    })

    it('should allow search engine bots', async () => {
      const arcjet = await import('@arcjet/next')
      const { aj } = await import('@/lib/arcjet')
      
      // Check that detectBot was called with allow configuration
      expect(arcjet.detectBot).toHaveBeenCalled()
      const detectBotCall = vi.mocked(arcjet.detectBot).mock.calls[0]
      expect(detectBotCall).toBeDefined()
      if (detectBotCall) {
        expect(detectBotCall[0]).toHaveProperty('allow')
      }
    })

    it('should set shield to LIVE mode', async () => {
      const arcjet = await import('@arcjet/next')
      
      expect(arcjet.shield).toHaveBeenCalled()
      const shieldCall = vi.mocked(arcjet.shield).mock.calls[0]
      expect(shieldCall).toBeDefined()
      if (shieldCall) {
        expect(shieldCall[0]).toHaveProperty('mode', 'LIVE')
      }
    })

    it('should set bot detection to LIVE mode', async () => {
      const arcjet = await import('@arcjet/next')
      
      expect(arcjet.detectBot).toHaveBeenCalled()
      const detectBotCall = vi.mocked(arcjet.detectBot).mock.calls[0]
      expect(detectBotCall).toBeDefined()
      if (detectBotCall) {
        expect(detectBotCall[0]).toHaveProperty('mode', 'LIVE')
      }
    })
  })

  describe('protect method', () => {
    it('should have protect method', async () => {
      const { aj } = await import('@/lib/arcjet')
      expect(aj.protect).toBeDefined()
      expect(typeof aj.protect).toBe('function')
    })

    it('should return decision object', async () => {
      const { aj } = await import('@/lib/arcjet')
      const mockRequest = {} as any
      const decision = await aj.protect(mockRequest)
      expect(decision).toBeDefined()
      expect(decision.isDenied).toBeDefined()
      expect(decision.isAllowed).toBeDefined()
    })

    it('should allow valid requests', async () => {
      const { aj } = await import('@/lib/arcjet')
      const mockRequest = {} as any
      const decision = await aj.protect(mockRequest)
      expect(decision.isDenied()).toBe(false)
      expect(decision.isAllowed()).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('should handle empty ARCJET_KEY string', async () => {
      process.env.ARCJET_KEY = ''
      
      await expect(async () => {
        vi.resetModules()
        await import('@/lib/arcjet')
      }).rejects.toThrow()

      process.env.ARCJET_KEY = 'test-arcjet-key'
    })

    it('should handle whitespace ARCJET_KEY', async () => {
      process.env.ARCJET_KEY = '   '
      
      await expect(async () => {
        vi.resetModules()
        await import('@/lib/arcjet')
      }).rejects.toThrow()

      process.env.ARCJET_KEY = 'test-arcjet-key'
    })
  })
})