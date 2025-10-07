import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
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
  let originalNodeEnv: string | undefined

  beforeEach(() => {
    // Spy on console methods
    consoleDebugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    
    // Save original NODE_ENV
    originalNodeEnv = process.env.NODE_ENV
  })

  afterEach(() => {
    // Restore original NODE_ENV
    if (originalNodeEnv !== undefined) {
      process.env.NODE_ENV = originalNodeEnv
    }
    vi.restoreAllMocks()
  })

  describe('debug', () => {
    it('should log debug messages in development', () => {
      process.env.NODE_ENV = 'development'
      logger.debug('Test debug message')

      expect(consoleDebugSpy).toHaveBeenCalled()
      const logOutput = consoleDebugSpy.mock.calls[0][0]
      expect(logOutput).toContain('DEBUG')
      expect(logOutput).toContain('Test debug message')
    })

    it('should not log debug messages in production', () => {
      process.env.NODE_ENV = 'production'
      logger.debug('Test debug message')

      expect(consoleDebugSpy).not.toHaveBeenCalled()
    })

    it('should include context in debug logs', () => {
      process.env.NODE_ENV = 'development'
      logger.debug('Test debug', { userId: 'user123', requestId: 'req456' })

      expect(consoleDebugSpy).toHaveBeenCalled()
      const logOutput = consoleDebugSpy.mock.calls[0][0]
      expect(logOutput).toContain('userId')
      expect(logOutput).toContain('user123')
      expect(logOutput).toContain('requestId')
      expect(logOutput).toContain('req456')
    })
  })

  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message')

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('INFO')
      expect(logOutput).toContain('Test info message')
    })

    it('should include context in info logs', () => {
      logger.info('User action', { userId: 'user123', action: 'login' })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('userId')
      expect(logOutput).toContain('action')
    })

    it('should include timestamp in info logs', () => {
      logger.info('Test message')

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      // Check for ISO 8601 timestamp format
      expect(logOutput).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/)
    })
  })

  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning')

      expect(consoleWarnSpy).toHaveBeenCalled()
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('WARN')
      expect(logOutput).toContain('Test warning')
    })

    it('should include error details in warnings', () => {
      const error = new Error('Test error')
      logger.warn('Warning with error', { userId: 'user123' }, error)

      expect(consoleWarnSpy).toHaveBeenCalled()
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('WARN')
      expect(logOutput).toContain('Warning with error')
    })
  })

  describe('error', () => {
    it('should log error messages', () => {
      logger.error('Test error')

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('ERROR')
      expect(logOutput).toContain('Test error')
    })

    it('should include error details', () => {
      const error = new Error('Detailed error')
      error.stack = 'Error stack trace'
      
      logger.error('Error occurred', {}, error)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorArg = consoleErrorSpy.mock.calls[0][1]
      expect(errorArg).toBeDefined()
      expect(errorArg).toHaveProperty('error')
    })

    it('should include stack trace in development', () => {
      process.env.NODE_ENV = 'development'
      const error = new Error('Test error')
      error.stack = 'Test stack trace'
      
      logger.error('Error with stack', {}, error)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorArg = consoleErrorSpy.mock.calls[0][1]
      expect(errorArg.error).toHaveProperty('stack')
    })

    it('should not include stack trace in production', () => {
      process.env.NODE_ENV = 'production'
      const error = new Error('Test error')
      error.stack = 'Test stack trace'
      
      logger.error('Error without stack', {}, error)

      expect(consoleErrorSpy).toHaveBeenCalled()
      const errorArg = consoleErrorSpy.mock.calls[0][1]
      expect(errorArg.error).not.toHaveProperty('stack')
    })
  })

  describe('sensitive data sanitization', () => {
    it('should redact password fields', () => {
      logger.info('User login', {
        username: 'testuser',
        password: 'secret123',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[REDACTED]')
      expect(logOutput).not.toContain('secret123')
    })

    it('should redact token fields', () => {
      logger.info('API call', {
        endpoint: '/api/users',
        access_token: 'bearer_token_12345',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[REDACTED]')
      expect(logOutput).not.toContain('bearer_token_12345')
    })

    it('should redact api_key fields', () => {
      logger.info('Config loaded', {
        api_key: 'test_api_key',
        service: 'openai',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[REDACTED]')
      expect(logOutput).not.toContain('sk-1234567890abcdef')
    })

    it('should redact authorization headers', () => {
      logger.info('HTTP request', {
        method: 'GET',
        authorization: 'Bearer secret_token',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[REDACTED]')
      expect(logOutput).not.toContain('secret_token')
    })

    it('should redact cookie values', () => {
      logger.info('Request', {
        cookie: 'session=abc123; token=xyz789',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[REDACTED]')
      expect(logOutput).not.toContain('abc123')
    })

    it('should redact secret fields', () => {
      logger.info('Environment', {
        secret: 'my_secret_value',
        public_key: 'not_redacted',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[REDACTED]')
      expect(logOutput).not.toContain('my_secret_value')
    })

    it('should handle case-insensitive sensitive field names', () => {
      logger.info('Mixed case', {
        PASSWORD: 'secret1',
        Token: 'secret2',
        API_KEY: 'secret3',
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).not.toContain('secret1')
      expect(logOutput).not.toContain('secret2')
      expect(logOutput).not.toContain('secret3')
    })
  })

  describe('nested object sanitization', () => {
    it('should sanitize nested objects', () => {
      logger.info('Nested context', {
        user: {
          id: 'user123',
          password: 'secret',
          profile: {
            name: 'John',
            api_key: 'key123',
          },
        },
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('user123')
      expect(logOutput).toContain('John')
      expect(logOutput).not.toContain('secret')
      expect(logOutput).not.toContain('key123')
    })

    it('should limit nested object depth', () => {
      const deeplyNested = {
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

      logger.info('Deep nesting', deeplyNested)

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[MAX_DEPTH_EXCEEDED]')
    })

    it('should sanitize arrays within objects', () => {
      logger.info('Array context', {
        users: [
          { id: '1', password: 'secret1' },
          { id: '2', token: 'secret2' },
        ],
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('id')
      expect(logOutput).not.toContain('secret1')
      expect(logOutput).not.toContain('secret2')
    })

    it('should limit array size', () => {
      const largeArray = Array(20).fill({ value: 'item' })

      logger.info('Large array', { items: largeArray })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      // Arrays should be limited to 10 items
      const matches = (logOutput.match(/"value":"item"/g) || []).length
      expect(matches).toBeLessThanOrEqual(10)
    })
  })

  describe('string truncation', () => {
    it('should truncate very long strings', () => {
      const longString = 'A'.repeat(2000)

      logger.info('Long string', { data: longString })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('[TRUNCATED]')
      expect(logOutput).not.toContain('A'.repeat(1500))
    })

    it('should not truncate short strings', () => {
      const shortString = 'Short message'

      logger.info('Short string', { data: shortString })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain(shortString)
      expect(logOutput).not.toContain('[TRUNCATED]')
    })
  })

  describe('specialized logging methods', () => {
    describe('logSecurityEvent', () => {
      it('should log security events with proper flags', () => {
        logger.logSecurityEvent('Suspicious login attempt', {
          userId: 'user123',
          ip: '192.168.1.1',
        })

        expect(consoleWarnSpy).toHaveBeenCalled()
        const logOutput = consoleWarnSpy.mock.calls[0][0]
        expect(logOutput).toContain('Security Event')
        expect(logOutput).toContain('Suspicious login attempt')
        expect(logOutput).toContain('securityEvent')
        expect(logOutput).toContain('user123')
      })

      it('should include timestamp in security events', () => {
        logger.logSecurityEvent('Rate limit exceeded', { ip: '1.2.3.4' })

        expect(consoleWarnSpy).toHaveBeenCalled()
        const logOutput = consoleWarnSpy.mock.calls[0][0]
        expect(logOutput).toContain('timestamp')
      })
    })

    describe('logAuthEvent', () => {
      it('should log authentication events', () => {
        logger.logAuthEvent('User login', {
          userId: 'user123',
          method: 'oauth',
        })

        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        expect(logOutput).toContain('Auth Event')
        expect(logOutput).toContain('User login')
        expect(logOutput).toContain('authEvent')
      })
    })

    describe('logApiAccess', () => {
      it('should log API access', () => {
        logger.logApiAccess('POST', '/api/users', {
          userId: 'user123',
          ip: '192.168.1.1',
        })

        expect(consoleInfoSpy).toHaveBeenCalled()
        const logOutput = consoleInfoSpy.mock.calls[0][0]
        expect(logOutput).toContain('API Access')
        expect(logOutput).toContain('POST /api/users')
        expect(logOutput).toContain('apiAccess')
      })
    })
  })

  describe('convenience functions', () => {
    it('logApiRequest should call logApiAccess', () => {
      logApiRequest('GET', '/api/data', { userId: 'user123' })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('API Access')
      expect(logOutput).toContain('GET /api/data')
    })

    it('logSecurityEvent convenience function should work', () => {
      logSecurityEvent('CSRF detected', { ip: '1.2.3.4' })

      expect(consoleWarnSpy).toHaveBeenCalled()
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('Security Event')
    })

    it('logAuthEvent convenience function should work', () => {
      logAuthEvent('Password reset', { email: 'test@example.com' })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('Auth Event')
    })

    it('logError convenience function should work', () => {
      const error = new Error('Test error')
      logError('Operation failed', error, { operation: 'test' })

      expect(consoleErrorSpy).toHaveBeenCalled()
      const logOutput = consoleErrorSpy.mock.calls[0][0]
      expect(logOutput).toContain('ERROR')
      expect(logOutput).toContain('Operation failed')
    })

    it('logWarn convenience function should work', () => {
      logWarn('Low disk space', { available: '10GB' })

      expect(consoleWarnSpy).toHaveBeenCalled()
      const logOutput = consoleWarnSpy.mock.calls[0][0]
      expect(logOutput).toContain('WARN')
    })

    it('logInfo convenience function should work', () => {
      logInfo('Service started', { port: 3000 })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('INFO')
    })

    it('logDebug convenience function should work in development', () => {
      process.env.NODE_ENV = 'development'
      logDebug('Debug info', { variable: 'value' })

      expect(consoleDebugSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle null context', () => {
      expect(() => {
        logger.info('Null context', null as unknown as undefined)
      }).not.toThrow()
    })

    it('should handle undefined context', () => {
      expect(() => {
        logger.info('Undefined context')
      }).not.toThrow()
    })

    it('should handle empty context', () => {
      logger.info('Empty context', {})

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('INFO')
    })

    it('should handle circular references gracefully', () => {
      const circular: { self?: unknown } = {}
      circular.self = circular

      expect(() => {
        logger.info('Circular reference', circular as Record<string, unknown>)
      }).not.toThrow()
    })

    it('should handle special characters in messages', () => {
      logger.info('Special chars: \n\t\r"\'\\')

      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle numeric values in context', () => {
      logger.info('Numeric context', {
        count: 42,
        percentage: 75.5,
        zero: 0,
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('42')
      expect(logOutput).toContain('75.5')
    })

    it('should handle boolean values in context', () => {
      logger.info('Boolean context', {
        isActive: true,
        isDisabled: false,
      })

      expect(consoleInfoSpy).toHaveBeenCalled()
      const logOutput = consoleInfoSpy.mock.calls[0][0]
      expect(logOutput).toContain('true')
      expect(logOutput).toContain('false')
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      
      expect(() => {
        logger.info('Date context', { timestamp: date } as Record<string, unknown>)
      }).not.toThrow()
    })
  })

  describe('performance', () => {
    it('should handle high-frequency logging', () => {
      const startTime = Date.now()
      
      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { index: i })
      }
      
      const duration = Date.now() - startTime
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1000)
      // Logging 1000 messages should take less than 1 second
      expect(duration).toBeLessThan(1000)
    })

    it('should handle large context objects efficiently', () => {
      const largeContext = {
        data: Array(100).fill(null).map((_, i) => ({
          id: i,
          name: `Item ${i}`,
          value: Math.random(),
        })),
      }

      const startTime = Date.now()
      logger.info('Large context', largeContext)
      const duration = Date.now() - startTime

      expect(consoleInfoSpy).toHaveBeenCalled()
      // Should complete quickly even with large context
      expect(duration).toBeLessThan(100)
    })
  })
})