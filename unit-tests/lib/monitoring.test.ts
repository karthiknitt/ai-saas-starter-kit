import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addBreadcrumb,
  captureException,
  captureMessage,
  initMonitoring,
  monitoring,
  setUser,
  startTransaction,
} from '../../src/lib/monitoring';

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

import { logger } from '../../src/lib/logger';

const mockLogger = vi.mocked(logger);

describe('Monitoring', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset NODE_ENV to test for each test
    process.env.NODE_ENV = 'test';
  });

  describe('initMonitoring', () => {
    it('should initialize monitoring on server-side', () => {
      // Ensure window is undefined for server-side test
      delete (global as any).window; // eslint-disable-line @typescript-eslint/no-explicit-any

      initMonitoring();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Monitoring initialized (server-side)',
      );
    });

    it('should initialize monitoring on client-side', () => {
      // Mock window object
      global.window = {} as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      initMonitoring();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Monitoring initialized (client-side)',
      );

      // Clean up
      delete (global as any).window; // eslint-disable-line @typescript-eslint/no-explicit-any
    });

    it('should add global error handlers in production on client-side', () => {
      // Save original NODE_ENV
      const originalEnv = process.env.NODE_ENV;

      // Mock window and addEventListener
      const mockAddEventListener = vi.fn();
      global.window = {
        addEventListener: mockAddEventListener,
      } as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      process.env.NODE_ENV = 'production';

      initMonitoring();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'error',
        expect.any(Function),
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function),
      );

      // Restore NODE_ENV and clean up
      process.env.NODE_ENV = originalEnv;
      delete (global as any).window; // eslint-disable-line @typescript-eslint/no-explicit-any
    });
  });

  describe('captureException', () => {
    it('should log error in development', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      const context = { user: { id: 'user-123' } };

      captureException(error, context);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error captured:',
        error,
        context,
      );

      consoleSpy.mockRestore();
    });

    it('should log error with logger', () => {
      const error = new Error('Test error');
      const context = {
        user: { id: 'user-123', email: 'test@example.com' },
        tags: { feature: 'payment' },
        extra: { transactionId: 'tx-123' },
      };

      captureException(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Exception captured', {
        error: 'Test error',
        stack: expect.any(String),
        ...context,
      });
    });

    it('should handle error without context', () => {
      const error = new Error('Simple error');

      captureException(error);

      expect(mockLogger.error).toHaveBeenCalledWith('Exception captured', {
        error: 'Simple error',
        stack: expect.any(String),
      });
    });

    it('should include error stack trace', () => {
      const error = new Error('Error with stack');
      captureException(error);

      const logCall = mockLogger.error.mock.calls[0];
      expect(logCall[1].stack).toBeDefined();
      expect(typeof logCall[1].stack).toBe('string');
    });
  });

  describe('captureMessage', () => {
    it('should log info level messages by default', () => {
      captureMessage('Info message');

      expect(mockLogger.info).toHaveBeenCalledWith('Info message', undefined);
    });

    it('should log error level messages', () => {
      captureMessage('Error message', { level: 'error' });

      expect(mockLogger.error).toHaveBeenCalledWith('Error message', {
        level: 'error',
      });
    });

    it('should log warning level messages', () => {
      captureMessage('Warning message', { level: 'warning' });

      expect(mockLogger.warn).toHaveBeenCalledWith('Warning message', {
        level: 'warning',
      });
    });

    it('should log fatal level messages as errors', () => {
      captureMessage('Fatal error', { level: 'fatal' });

      expect(mockLogger.error).toHaveBeenCalledWith('Fatal error', {
        level: 'fatal',
      });
    });

    it('should include context with message', () => {
      const context = {
        user: { id: 'user-123' },
        tags: { plan: 'pro' },
        extra: { amount: 29.0 },
        level: 'info' as const,
      };

      captureMessage('Payment completed', context);

      expect(mockLogger.info).toHaveBeenCalledWith('Payment completed', context);
    });
  });

  describe('setUser', () => {
    it('should set user context', () => {
      const user = {
        id: 'user-123',
        email: 'test@example.com',
        username: 'testuser',
      };

      setUser(user);

      expect(mockLogger.info).toHaveBeenCalledWith('User context set', {
        userId: 'user-123',
      });
    });

    it('should clear user context when null', () => {
      setUser(null);

      expect(mockLogger.info).toHaveBeenCalledWith('User context cleared');
    });

    it('should handle user with only ID', () => {
      const user = { id: 'user-456' };

      setUser(user);

      expect(mockLogger.info).toHaveBeenCalledWith('User context set', {
        userId: 'user-456',
      });
    });
  });

  describe('addBreadcrumb', () => {
    it('should log breadcrumb in development', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      addBreadcrumb('User clicked button', 'user-action');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Breadcrumb] user-action: User clicked button',
        undefined,
      );

      consoleSpy.mockRestore();
    });

    it('should include breadcrumb data', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      const data = { url: '/api/payment', method: 'POST' };
      addBreadcrumb('API request started', 'http', 'info', data);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Breadcrumb] http: API request started',
        data,
      );

      consoleSpy.mockRestore();
    });

    it('should use default category when not provided', () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      process.env.NODE_ENV = 'development';

      addBreadcrumb('Generic breadcrumb');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Breadcrumb] default: Generic breadcrumb',
        undefined,
      );

      consoleSpy.mockRestore();
    });
  });

  describe('startTransaction', () => {
    it('should create transaction with finish method', () => {
      const transaction = startTransaction('test-transaction');

      expect(transaction).toBeDefined();
      expect(transaction.finish).toBeDefined();
      expect(typeof transaction.finish).toBe('function');
    });

    it('should log transaction completion with duration', () => {
      const transaction = startTransaction('checkout-flow', 'user-flow');

      // Wait a small amount of time
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Busy wait
      }

      transaction.finish();

      expect(mockLogger.info).toHaveBeenCalledWith('Transaction completed', {
        name: 'checkout-flow',
        operation: 'user-flow',
        duration: expect.any(Number),
      });

      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall[1].duration).toBeGreaterThanOrEqual(0);
    });

    it('should use default operation when not specified', () => {
      const transaction = startTransaction('test-operation');
      transaction.finish();

      expect(mockLogger.info).toHaveBeenCalledWith('Transaction completed', {
        name: 'test-operation',
        operation: 'custom',
        duration: expect.any(Number),
      });
    });

    it('should measure accurate duration', () => {
      const transaction = startTransaction('timed-operation');

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 50) {
        // Busy wait for ~50ms
      }

      transaction.finish();

      const logCall = mockLogger.info.mock.calls[0];
      expect(logCall[1].duration).toBeGreaterThanOrEqual(40); // Allow some variance
    });
  });

  describe('monitoring object', () => {
    it('should export all monitoring functions', () => {
      expect(monitoring.init).toBe(initMonitoring);
      expect(monitoring.captureException).toBe(captureException);
      expect(monitoring.captureMessage).toBe(captureMessage);
      expect(monitoring.setUser).toBe(setUser);
      expect(monitoring.addBreadcrumb).toBe(addBreadcrumb);
      expect(monitoring.startTransaction).toBe(startTransaction);
    });

    it('should allow calling functions through monitoring object', () => {
      const user = { id: 'test-user' };
      monitoring.setUser(user);

      expect(mockLogger.info).toHaveBeenCalledWith('User context set', {
        userId: 'test-user',
      });
    });
  });

  describe('Error Context Types', () => {
    it('should accept all valid context properties', () => {
      const context = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          username: 'testuser',
        },
        tags: {
          feature: 'billing',
          environment: 'production',
        },
        extra: {
          requestId: 'req-123',
          amount: 29.99,
          success: true,
        },
        level: 'error' as const,
      };

      const error = new Error('Complex error');
      captureException(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Exception captured', {
        error: 'Complex error',
        stack: expect.any(String),
        ...context,
      });
    });

    it('should handle minimal context', () => {
      const error = new Error('Minimal error');
      const context = { level: 'warning' as const };

      captureException(error, context);

      expect(mockLogger.error).toHaveBeenCalledWith('Exception captured', {
        error: 'Minimal error',
        stack: expect.any(String),
        level: 'warning',
      });
    });
  });
});
