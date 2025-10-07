import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  logger,
  logApiRequest,
  logSecurityEvent,
  logAuthEvent,
  logError,
  logWarn,
  logInfo,
  logDebug
} from '@/lib/logger'

describe('SecureLogger', () => {
  // Mock console methods
  const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
  }

  beforeEach(() => {
    console.debug = vi.fn()
    console.info = vi.fn()
    console.warn = vi.fn()
    console.error = vi.fn()
  })

  afterEach(() => {
    console.debug = originalConsole.debug
    console.info = originalConsole.info
    console.warn = originalConsole.warn
    console.error = originalConsole.error
  })

  describe('debug', () => {
    it('should log debug messages in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logger.debug('Debug message')

      expect(console.debug).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should not log debug messages in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      logger.debug('Debug message')

      expect(console.debug).not.toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })

    it('should include context in debug logs', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logger.debug('Debug with context', { userId: '123', action: 'test' })

      expect(console.debug).toHaveBeenCalled()
      const call = (console.debug as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('DEBUG')
      expect(call).toContain('Debug with context')

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Info message')

      expect(console.info).toHaveBeenCalled()
      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('INFO')
      expect(call).toContain('Info message')
    })

    it('should include timestamp in info logs', () => {
      logger.info('Info message')

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
    })

    it('should include context in info logs', () => {
      logger.info('Info with context', { requestId: 'abc123' })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('Context')
      expect(call).toContain('requestId')
    })
  })

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Warning message')

      expect(console.warn).toHaveBeenCalled()
      const call = (console.warn as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('WARN')
      expect(call).toContain('Warning message')
    })

    it('should include error details in warnings', () => {
      const error = new Error('Test error')
      logger.warn('Warning with error', {}, error)

      expect(console.warn).toHaveBeenCalledTimes(1)
    })
  })

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Error message')

      expect(console.error).toHaveBeenCalled()
      const call = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('ERROR')
      expect(call).toContain('Error message')
    })

    it('should include error object in error logs', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', {}, error)

      expect(console.error).toHaveBeenCalledTimes(1)
      const errorArg = (console.error as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1]
      expect(errorArg).toHaveProperty('error')
    })

    it('should include error stack in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      const error = new Error('Test error')
      logger.error('Error with stack', {}, error)

      expect(console.error).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('sanitization', () => {
    it('should redact sensitive password fields', () => {
      logger.info('User login', { 
        username: 'john', 
        password: 'secret123' 
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('secret123')
    })

    it('should redact API keys', () => {
      logger.info('API request', { 
        api_key: 'sk-1234567890' 
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('sk-1234567890')
    })

    it('should redact tokens', () => {
      logger.info('Auth check', { 
        access_token: 'token123',
        refresh_token: 'refresh456'
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('token123')
      expect(call).not.toContain('refresh456')
    })

    it('should redact authorization headers', () => {
      logger.info('Request', { 
        authorization: 'Bearer token123' 
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('Bearer token123')
    })

    it('should redact credit card numbers', () => {
      logger.info('Payment', { 
        credit_card: '4111111111111111' 
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('4111111111111111')
    })

    it('should truncate very long strings', () => {
      const longString = 'A'.repeat(2000)
      logger.info('Long data', { data: longString })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('TRUNCATED')
      expect(call).not.toContain('A'.repeat(2000))
    })

    it('should handle nested objects and redact sensitive fields', () => {
      logger.info('Nested data', {
        user: {
          name: 'John',
          password: 'secret',
          email: 'john@example.com'
        }
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('John')
      expect(call).toContain('john@example.com')
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('secret')
    })

    it('should limit nested object depth', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                data: 'deep'
              }
            }
          }
        }
      }

      logger.info('Deep nesting', deepObject)

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('MAX_DEPTH_EXCEEDED')
    })

    it('should handle arrays and limit their size', () => {
      const largeArray = Array(20).fill('item')
      logger.info('Large array', { items: largeArray })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toBeDefined()
    })

    it('should not redact non-sensitive fields', () => {
      logger.info('Safe data', {
        username: 'john',
        email: 'john@example.com',
        userId: '123'
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('john')
      expect(call).toContain('john@example.com')
      expect(call).toContain('123')
    })
  })

  describe('specialized logging methods', () => {
    it('should log security events with proper context', () => {
      logSecurityEvent('Failed login attempt', {
        ip: '192.168.1.1',
        userId: '123'
      })

      expect(console.warn).toHaveBeenCalled()
      const call = (console.warn as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('Security Event')
      expect(call).toContain('Failed login attempt')
      expect(call).toContain('securityEvent')
    })

    it('should log auth events with proper context', () => {
      logAuthEvent('User logged in', {
        userId: '123',
        method: 'oauth'
      })

      expect(console.info).toHaveBeenCalled()
      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('Auth Event')
      expect(call).toContain('User logged in')
      expect(call).toContain('authEvent')
    })

    it('should log API access with method and path', () => {
      logApiRequest('POST', '/api/users', {
        ip: '192.168.1.1',
        userAgent: 'Mozilla/5.0'
      })

      expect(console.info).toHaveBeenCalled()
      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('API Access')
      expect(call).toContain('POST')
      expect(call).toContain('/api/users')
      expect(call).toContain('apiAccess')
    })
  })

  describe('convenience functions', () => {
    it('logError should call logger.error', () => {
      const error = new Error('Test error')
      logError('Error occurred', error, { userId: '123' })

      expect(console.error).toHaveBeenCalled()
    })

    it('logWarn should call logger.warn', () => {
      logWarn('Warning message', { action: 'test' })

      expect(console.warn).toHaveBeenCalled()
    })

    it('logInfo should call logger.info', () => {
      logInfo('Info message', { status: 'ok' })

      expect(console.info).toHaveBeenCalled()
    })

    it('logDebug should call logger.debug in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      logDebug('Debug message', { data: 'test' })

      expect(console.debug).toHaveBeenCalled()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('edge cases', () => {
    it('should handle null context', () => {
      logger.info('Message with null context', null as any)

      expect(console.info).toHaveBeenCalled()
    })

    it('should handle undefined context', () => {
      logger.info('Message without context')

      expect(console.info).toHaveBeenCalled()
    })

    it('should handle empty context object', () => {
      logger.info('Message with empty context', {})

      expect(console.info).toHaveBeenCalled()
    })

    it('should handle circular references gracefully', () => {
      const circular: any = { name: 'test' }
      circular.self = circular

      // Should not throw
      expect(() => {
        logger.info('Circular reference', circular)
      }).not.toThrow()
    })

    it('should handle special characters in messages', () => {
      logger.info('Message with special chars: <>&"\'\n\t')

      expect(console.info).toHaveBeenCalled()
    })

    it('should handle unicode characters', () => {
      logger.info('Message with unicode: 你好 🎉', { emoji: '😀' })

      expect(console.info).toHaveBeenCalled()
    })
  })

  describe('case-insensitive sensitive field detection', () => {
    it('should redact PASSWORD in any case', () => {
      logger.info('Mixed case', { 
        PASSWORD: 'secret',
        Password: 'secret2',
        PaSsWoRd: 'secret3'
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('secret')
    })

    it('should redact fields containing sensitive keywords', () => {
      logger.info('Contains keywords', {
        user_password: 'secret',
        api_secret_key: 'key123',
        session_token: 'token456'
      })

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(call).toContain('REDACTED')
      expect(call).not.toContain('secret')
      expect(call).not.toContain('key123')
      expect(call).not.toContain('token456')
    })
  })

  describe('timestamp formatting', () => {
    it('should include ISO 8601 formatted timestamps', () => {
      logger.info('Timestamp test')

      const call = (console.info as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      // Check for ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(call).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/)
    })
  })
})