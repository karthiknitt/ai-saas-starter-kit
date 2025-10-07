import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { logger, logApiRequest, logSecurityEvent, logAuthEvent, logError, logWarn, logInfo, logDebug } from '@/lib/logger'

describe('logger', () => {
  // Mock console methods
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

  describe('debug logging', () => {
    it('should log debug messages', () => {
      logger.debug('Test debug message')
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('DEBUG: Test debug message'),
        expect.any(String)
      )
    })

    it('should log debug messages with context', () => {
      const context = { userId: 'user123', action: 'test' }
      logger.debug('Debug with context', context)
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug with context'),
        expect.any(String)
      )
    })

    it('should handle empty context', () => {
      logger.debug('Debug without context')
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug without context'),
        expect.any(String)
      )
    })
  })

  describe('info logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message')
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message')
      )
    })

    it('should log info messages with context', () => {
      const context = { requestId: 'req-123', endpoint: '/api/test' }
      logger.info('Info with context', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info with context')
      )
    })
  })

  describe('warn logging', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message')
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WARN: Test warning message'),
        expect.any(String)
      )
    })

    it('should log warnings with context', () => {
      const context = { userId: 'user456', issue: 'rate limit approaching' }
      logger.warn('Warning with context', context)
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning with context'),
        expect.any(String)
      )
    })

    it('should log warnings with error object', () => {
      const error = new Error('Test error')
      logger.warn('Warning with error', {}, error)
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning with error'),
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Test error'
          })
        })
      )
    })
  })

  describe('error logging', () => {
    it('should log error messages', () => {
      logger.error('Test error message')
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message'),
        expect.any(String)
      )
    })

    it('should log errors with context', () => {
      const context = { userId: 'user789', operation: 'database query' }
      logger.error('Error with context', context)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error with context'),
        expect.any(String)
      )
    })

    it('should log errors with error object', () => {
      const error = new Error('Critical failure')
      logger.error('Critical error occurred', {}, error)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Critical error occurred'),
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'Error',
            message: 'Critical failure'
          })
        })
      )
    })

    it('should include error stack in development mode', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const error = new Error('Stack test')
      logger.error('Error with stack', {}, error)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error with stack'),
        expect.objectContaining({
          error: expect.objectContaining({
            stack: expect.any(String)
          })
        })
      )
      
      process.env.NODE_ENV = originalEnv
    })
  })

  describe('sensitive field sanitization', () => {
    it('should redact password fields', () => {
      const context = { username: 'john', password: 'secret123' }
      logger.info('Login attempt', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact token fields', () => {
      const context = { userId: 'user123', token: 'abc123xyz' }
      logger.info('Auth check', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact api_key fields', () => {
      const context = { service: 'openai', api_key: 'sk-1234567890' }
      logger.info('API call', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact secret fields', () => {
      const context = { app: 'myapp', secret: 'topsecret' }
      logger.info('Config loaded', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact authorization headers', () => {
      const context = { endpoint: '/api/data', authorization: 'Bearer token123' }
      logger.info('API request', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact cookie fields', () => {
      const context = { request: 'GET /api', cookie: 'session=xyz' }
      logger.info('Request received', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact session fields', () => {
      const context = { userId: 'user123', session: 'sess_abc123' }
      logger.info('Session check', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should redact multiple sensitive fields', () => {
      const context = {
        username: 'john',
        password: 'secret',
        token: 'abc123',
        api_key: 'key123'
      }
      logger.info('Multiple sensitive fields', context)
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).toContain('[REDACTED]')
    })

    it('should preserve non-sensitive fields', () => {
      const context = {
        userId: 'user123',
        username: 'john',
        email: 'john@example.com',
        password: 'secret'
      }
      logger.info('Mixed fields', context)
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).toContain('user123')
      expect(logCall).toContain('john')
      expect(logCall).toContain('john@example.com')
      expect(logCall).toContain('[REDACTED]')
    })
  })

  describe('nested object sanitization', () => {
    it('should sanitize nested sensitive fields', () => {
      const context = {
        user: {
          id: 'user123',
          credentials: {
            password: 'secret',
            api_key: 'key123'
          }
        }
      }
      logger.info('Nested sensitive data', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should handle deeply nested objects', () => {
      const context = {
        level1: {
          level2: {
            level3: {
              password: 'secret',
              data: 'public'
            }
          }
        }
      }
      logger.info('Deep nesting', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should handle max depth exceeded', () => {
      const context = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'too deep'
              }
            }
          }
        }
      }
      logger.info('Max depth test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle arrays in nested objects', () => {
      const context = {
        users: [
          { id: 1, password: 'secret1' },
          { id: 2, password: 'secret2' }
        ]
      }
      logger.info('Array with sensitive data', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should limit array size to 10 items', () => {
      const largeArray = Array.from({ length: 20 }, (_, i) => ({ id: i }))
      const context = { items: largeArray }
      logger.info('Large array', context)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })
  })

  describe('string truncation', () => {
    it('should truncate very long strings', () => {
      const longString = 'x'.repeat(2000)
      const context = { data: longString }
      logger.info('Long string test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TRUNCATED]')
      )
    })

    it('should not truncate strings under 1000 characters', () => {
      const normalString = 'x'.repeat(500)
      const context = { data: normalString }
      logger.info('Normal string test', context)
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).not.toContain('[TRUNCATED]')
    })

    it('should truncate at exactly 1000 characters', () => {
      const exactString = 'x'.repeat(1001)
      const context = { data: exactString }
      logger.info('Exact truncation test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[TRUNCATED]')
      )
    })
  })

  describe('security event logging', () => {
    it('should log security events with marker', () => {
      const context = { ip: '192.168.1.1', reason: 'suspicious activity' }
      logger.logSecurityEvent('Potential attack detected', context)
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: Potential attack detected'),
        expect.any(String)
      )
    })

    it('should include securityEvent flag in context', () => {
      const context = { userId: 'user123' }
      logger.logSecurityEvent('Security test', context)
      
      const logCall = consoleWarnSpy.mock.calls[0][0]
      expect(logCall).toContain('securityEvent')
    })

    it('should include timestamp in security events', () => {
      logger.logSecurityEvent('Timestamp test', {})
      
      const logCall = consoleWarnSpy.mock.calls[0][0]
      expect(logCall).toContain('timestamp')
    })
  })

  describe('auth event logging', () => {
    it('should log auth events with marker', () => {
      const context = { userId: 'user123', method: 'password' }
      logger.logAuthEvent('User login', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth Event: User login')
      )
    })

    it('should include authEvent flag in context', () => {
      const context = { userId: 'user456' }
      logger.logAuthEvent('Auth test', context)
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).toContain('authEvent')
    })

    it('should include timestamp in auth events', () => {
      logger.logAuthEvent('Timestamp test', {})
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).toContain('timestamp')
    })
  })

  describe('API access logging', () => {
    it('should log API access with method and path', () => {
      const context = { ip: '192.168.1.1' }
      logger.logApiAccess('GET', '/api/users', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Access: GET /api/users')
      )
    })

    it('should include apiAccess flag in context', () => {
      logger.logApiAccess('POST', '/api/data', {})
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).toContain('apiAccess')
    })

    it('should handle different HTTP methods', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
      
      methods.forEach(method => {
        logger.logApiAccess(method, '/api/test', {})
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.stringContaining(`API Access: ${method}`)
        )
      })
    })
  })

  describe('convenience functions', () => {
    it('logApiRequest should call logger.logApiAccess', () => {
      logApiRequest('GET', '/api/test', { userId: 'user123' })
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('API Access: GET /api/test')
      )
    })

    it('logSecurityEvent should call logger.logSecurityEvent', () => {
      logSecurityEvent('Test event', { ip: '127.0.0.1' })
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security Event: Test event'),
        expect.any(String)
      )
    })

    it('logAuthEvent should call logger.logAuthEvent', () => {
      logAuthEvent('Login success', { userId: 'user123' })
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Auth Event: Login success')
      )
    })

    it('logError should call logger.error', () => {
      const error = new Error('Test error')
      logError('Error occurred', error, { operation: 'test' })
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred'),
        expect.any(Object)
      )
    })

    it('logWarn should call logger.warn', () => {
      logWarn('Warning message', { warning: 'test' })
      
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning message'),
        expect.any(String)
      )
    })

    it('logInfo should call logger.info', () => {
      logInfo('Info message', { info: 'test' })
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Info message')
      )
    })

    it('logDebug should call logger.debug', () => {
      logDebug('Debug message', { debug: 'test' })
      
      expect(consoleDebugSpy).toHaveBeenCalledWith(
        expect.stringContaining('Debug message'),
        expect.any(String)
      )
    })
  })

  describe('edge cases', () => {
    it('should handle null context', () => {
      logger.info('Null context test', null as any)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle undefined context', () => {
      logger.info('Undefined context test', undefined)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle empty object context', () => {
      logger.info('Empty context test', {})
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('Empty context test')
      )
    })

    it('should handle circular references safely', () => {
      const circular: any = { prop: 'value' }
      circular.self = circular
      
      expect(() => {
        logger.info('Circular reference test', circular)
      }).not.toThrow()
    })

    it('should handle context with boolean values', () => {
      const context = { success: true, failed: false }
      logger.info('Boolean test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle context with number values', () => {
      const context = { count: 42, ratio: 0.75 }
      logger.info('Number test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle context with null values', () => {
      const context = { value: null, name: 'test' }
      logger.info('Null value test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalled()
    })

    it('should handle error without message', () => {
      const error = new Error()
      logger.error('Error without message', {}, error)
      
      expect(consoleErrorSpy).toHaveBeenCalled()
    })

    it('should handle error with custom name', () => {
      const error = new Error('Custom error')
      error.name = 'CustomError'
      logger.error('Custom error test', {}, error)
      
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          error: expect.objectContaining({
            name: 'CustomError'
          })
        })
      )
    })
  })

  describe('timestamp formatting', () => {
    it('should include ISO timestamp in all logs', () => {
      logger.info('Timestamp test')
      
      const logCall = consoleInfoSpy.mock.calls[0][0]
      expect(logCall).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should include timestamp in context for special events', () => {
      logger.logSecurityEvent('Test', {})
      
      const logCall = consoleWarnSpy.mock.calls[0][0]
      expect(logCall).toContain('timestamp')
    })
  })

  describe('case sensitivity in sensitive field detection', () => {
    it('should detect PASSWORD in uppercase', () => {
      const context = { PASSWORD: 'secret' }
      logger.info('Uppercase test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should detect PaSsWoRd in mixed case', () => {
      const context = { PaSsWoRd: 'secret' }
      logger.info('Mixed case test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })

    it('should detect fields containing sensitive terms', () => {
      const context = { myPasswordField: 'secret', userToken: 'abc123' }
      logger.info('Contains sensitive test', context)
      
      expect(consoleInfoSpy).toHaveBeenCalledWith(
        expect.stringContaining('[REDACTED]')
      )
    })
  })
})