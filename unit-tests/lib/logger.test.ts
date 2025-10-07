import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  logger,
  logApiRequest,
  logSecurityEvent,
  logAuthEvent,
  logError,
  logWarn,
  logInfo,
  logDebug,
} from '@/lib/logger'

describe('logger', () => {
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>
  let consoleInfoSpy: ReturnType<typeof vi.spyOn>
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('INFO')
      expect(loggedMessage).toContain('Test info message')
    })

    it('should log warn messages', () => {
      logger.warn('Test warn message')
      expect(consoleWarnSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('WARN')
      expect(loggedMessage).toContain('Test warn message')
    })

    it('should log error messages', () => {
      logger.error('Test error message')
      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleErrorSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('ERROR')
      expect(loggedMessage).toContain('Test error message')
    })

    it('should include timestamp in log messages', () => {
      logger.info('Test message')
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      // ISO timestamp format
      expect(loggedMessage).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
    })
  })

  describe('context sanitization', () => {
    it('should log context information', () => {
      logger.info('Test with context', { userId: '123', action: 'login' })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('userId')
      expect(loggedMessage).toContain('123')
    })

    it('should redact password fields', () => {
      logger.info('Test with password', { username: 'user', password: 'secret123' })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('username')
      expect(loggedMessage).not.toContain('secret123')
      expect(loggedMessage).toContain('[REDACTED]')
    })

    it('should redact token fields', () => {
      logger.info('Test with token', { userId: '123', accessToken: 'abc123xyz' })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).not.toContain('abc123xyz')
      expect(loggedMessage).toContain('[REDACTED]')
    })

    it('should redact api_key fields', () => {
      logger.info('Test with api key', { apiKey: 'sk-test-123' })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).not.toContain('sk-test-123')
      expect(loggedMessage).toContain('[REDACTED]')
    })

    it('should redact authorization headers', () => {
      logger.info('Request logged', { authorization: 'Bearer token123' })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).not.toContain('token123')
      expect(loggedMessage).toContain('[REDACTED]')
    })

    it('should handle nested sensitive fields', () => {
      logger.info('Nested sensitive data', {
        user: { username: 'john', password: 'secret' },
      })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('john')
      expect(loggedMessage).not.toContain('secret')
      expect(loggedMessage).toContain('[REDACTED]')
    })

    it('should truncate very long strings', () => {
      const longString = 'a'.repeat(2000)
      logger.info('Long string test', { data: longString })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('[TRUNCATED]')
      expect(loggedMessage.length).toBeLessThan(longString.length + 500)
    })

    it('should handle null and undefined values', () => {
      logger.info('Null/undefined test', { nullValue: null, undefinedValue: undefined })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      // Should not throw an error
    })

    it('should limit nested object depth', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'too deep',
              },
            },
          },
        },
      }
      logger.info('Deep object test', deepObject)
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('[MAX_DEPTH_EXCEEDED]')
    })

    it('should limit array length', () => {
      const longArray = Array(20).fill('item')
      logger.info('Long array test', { items: longArray })
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      // Array should be truncated to 10 items
      expect(loggedMessage.split('"item"').length - 1).toBeLessThanOrEqual(11)
    })
  })

  describe('error logging', () => {
    it('should log error objects with stack traces in development', () => {
      const error = new Error('Test error')
      logger.error('Error occurred', {}, error)
      expect(consoleErrorSpy).toHaveBeenCalledOnce()
      const loggedArgs = consoleErrorSpy.mock.calls[0]
      expect(loggedArgs[0]).toContain('Error occurred')
    })

    it('should handle errors without stack traces', () => {
      const error = new Error('Test error')
      delete error.stack
      logger.error('Error without stack', {}, error)
      expect(consoleErrorSpy).toHaveBeenCalledOnce()
    })

    it('should log error name and message', () => {
      const error = new TypeError('Invalid type')
      logger.error('Type error', {}, error)
      const loggedArgs = consoleErrorSpy.mock.calls[0]
      expect(JSON.stringify(loggedArgs)).toContain('TypeError')
      expect(JSON.stringify(loggedArgs)).toContain('Invalid type')
    })
  })

  describe('security logging', () => {
    it('should log security events', () => {
      logger.logSecurityEvent('Suspicious login attempt', { ip: '1.2.3.4' })
      expect(consoleWarnSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleWarnSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('Security Event')
      expect(loggedMessage).toContain('Suspicious login attempt')
      expect(loggedMessage).toContain('1.2.3.4')
    })

    it('should log authentication events', () => {
      logger.logAuthEvent('User login', { userId: '123' })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('Auth Event')
      expect(loggedMessage).toContain('User login')
    })

    it('should log API access', () => {
      logger.logApiAccess('GET', '/api/users', { userId: '123' })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('API Access')
      expect(loggedMessage).toContain('GET')
      expect(loggedMessage).toContain('/api/users')
    })
  })

  describe('convenience functions', () => {
    it('logApiRequest should call logApiAccess', () => {
      logApiRequest('POST', '/api/chat', { userId: '123' })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('POST')
      expect(loggedMessage).toContain('/api/chat')
    })

    it('logSecurityEvent should log warning', () => {
      logSecurityEvent('Brute force attempt', { ip: '1.2.3.4' })
      expect(consoleWarnSpy).toHaveBeenCalledOnce()
    })

    it('logAuthEvent should log info', () => {
      logAuthEvent('Password reset', { email: 'user@example.com' })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
    })

    it('logError should log error with context', () => {
      const error = new Error('Test')
      logError('Operation failed', error, { operation: 'test' })
      expect(consoleErrorSpy).toHaveBeenCalledOnce()
    })

    it('logWarn should log warning', () => {
      logWarn('Deprecated API usage', { endpoint: '/old-api' })
      expect(consoleWarnSpy).toHaveBeenCalledOnce()
    })

    it('logInfo should log info', () => {
      logInfo('Operation completed', { duration: 123 })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
    })

    it('logDebug should log debug', () => {
      logDebug('Debug information', { data: 'test' })
      // Debug only logs in development
      expect(consoleDebugSpy).toHaveBeenCalledOnce()
    })
  })

  describe('sensitive field detection', () => {
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'key',
      'authorization',
      'cookie',
      'session',
      'credit_card',
      'ssn',
      'api_key',
      'access_token',
      'refresh_token',
      'private_key',
      'encryption_key',
    ]

    sensitiveFields.forEach(field => {
      it(`should redact field containing "${field}"`, () => {
        const context = { [field]: 'sensitive_value' }
        logger.info('Test', context)
        const loggedMessage = consoleInfoSpy.mock.calls[0][0]
        expect(loggedMessage).not.toContain('sensitive_value')
        expect(loggedMessage).toContain('[REDACTED]')
      })

      it(`should redact field with mixed case "${field.toUpperCase()}"`, () => {
        const context = { [field.toUpperCase()]: 'sensitive_value' }
        logger.info('Test', context)
        const loggedMessage = consoleInfoSpy.mock.calls[0][0]
        expect(loggedMessage).not.toContain('sensitive_value')
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty messages', () => {
      logger.info('')
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
    })

    it('should handle messages with special characters', () => {
      logger.info('Test 🚀 with émojis and spëcial chars')
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
      const loggedMessage = consoleInfoSpy.mock.calls[0][0]
      expect(loggedMessage).toContain('🚀')
    })

    it('should handle circular references in context', () => {
      const circular: { self?: unknown } = {}
      circular.self = circular
      // Should not throw
      expect(() => logger.info('Circular ref', { data: circular })).not.toThrow()
    })

    it('should handle context with functions', () => {
      logger.info('Function context', { callback: () => {} })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
    })

    it('should handle context with symbols', () => {
      logger.info('Symbol context', { sym: Symbol('test') })
      expect(consoleInfoSpy).toHaveBeenCalledOnce()
    })
  })
})