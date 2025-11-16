/**
 * Production Monitoring and Error Tracking
 *
 * Centralized monitoring setup for production error tracking,
 * performance monitoring, and user feedback.
 *
 * Supports multiple monitoring providers:
 * - Sentry (recommended for error tracking)
 * - Custom error reporting
 *
 * @module monitoring
 */

import { logger } from '@/lib/logger';

/**
 * Error severity levels
 */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info' | 'debug';

/**
 * Error context for additional debugging information
 */
export interface ErrorContext {
  user?: {
    id: string;
    email?: string;
    username?: string;
  };
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  level?: ErrorSeverity;
}

/**
 * Initialize monitoring services
 *
 * Call this once at application startup (e.g., in layout.tsx or _app.tsx)
 *
 * @example
 * ```typescript
 * import { initMonitoring } from '@/lib/monitoring';
 *
 * // In app/layout.tsx or pages/_app.tsx
 * initMonitoring();
 * ```
 */
export function initMonitoring(): void {
  if (typeof window === 'undefined') {
    // Server-side initialization
    logger.info('Monitoring initialized (server-side)');
    return;
  }

  // Client-side initialization
  logger.info('Monitoring initialized (client-side)');

  // Add global error handler
  if (process.env.NODE_ENV === 'production') {
    window.addEventListener('error', (event) => {
      captureException(event.error || new Error(event.message), {
        tags: { type: 'window.error' },
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      captureException(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          tags: { type: 'unhandledrejection' },
        },
      );
    });
  }
}

/**
 * Capture an exception for error tracking
 *
 * @param error - Error object to capture
 * @param context - Additional context for debugging
 *
 * @example
 * ```typescript
 * try {
 *   // risky operation
 * } catch (error) {
 *   captureException(error, {
 *     user: { id: userId },
 *     tags: { feature: 'payment' },
 *     extra: { transactionId: txId }
 *   });
 * }
 * ```
 */
export function captureException(error: Error, context?: ErrorContext): void {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error captured:', error, context);
  }

  // Log to logger
  logger.error('Exception captured', {
    error: error.message,
    stack: error.stack,
    ...context,
  });

  // In production, send to Sentry or other error tracking service
  if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
    // If Sentry is configured, it will automatically capture via global handlers
    // You can also call Sentry.captureException(error) here if using @sentry/nextjs

    // Example with fetch to custom error tracking endpoint:
    // fetch('/api/errors', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     message: error.message,
    //     stack: error.stack,
    //     context,
    //     timestamp: new Date().toISOString(),
    //   }),
    // }).catch(console.error);
  }
}

/**
 * Capture a message for logging/tracking
 *
 * Use this for important events that aren't errors
 *
 * @param message - Message to capture
 * @param context - Additional context
 *
 * @example
 * ```typescript
 * captureMessage('Payment completed', {
 *   user: { id: userId },
 *   tags: { plan: 'pro' },
 *   extra: { amount: 29.00 },
 *   level: 'info'
 * });
 * ```
 */
export function captureMessage(message: string, context?: ErrorContext): void {
  const level = context?.level || 'info';

  // Log based on level
  if (level === 'error' || level === 'fatal') {
    logger.error(message, context);
  } else if (level === 'warning') {
    logger.warn(message, context);
  } else {
    logger.info(message, context);
  }

  // In production, send to monitoring service
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureMessage(message, context?.level);
  }
}

/**
 * Set user context for error tracking
 *
 * Call this after user authentication to associate errors with specific users
 *
 * @param user - User information
 *
 * @example
 * ```typescript
 * // After successful login
 * setUser({
 *   id: user.id,
 *   email: user.email,
 *   username: user.name
 * });
 * ```
 */
export function setUser(user: { id: string; email?: string; username?: string } | null): void {
  if (process.env.NODE_ENV === 'production') {
    // Sentry.setUser(user);
  }

  if (user) {
    logger.info('User context set', { userId: user.id });
  } else {
    logger.info('User context cleared');
  }
}

/**
 * Add breadcrumb for debugging
 *
 * Breadcrumbs create a trail of events leading up to an error
 *
 * @param message - Breadcrumb message
 * @param category - Category for grouping
 * @param level - Severity level
 * @param data - Additional data
 *
 * @example
 * ```typescript
 * addBreadcrumb('User clicked checkout button', 'user-action');
 * addBreadcrumb('API request started', 'http', 'info', { url: '/api/payment' });
 * ```
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  level: ErrorSeverity = 'info',
  data?: Record<string, unknown>,
): void {
  if (process.env.NODE_ENV === 'development') {
    console.debug(`[Breadcrumb] ${category || 'default'}: ${message}`, data);
  }

  // Sentry.addBreadcrumb({
  //   message,
  //   category,
  //   level,
  //   data,
  // });
}

/**
 * Start a performance transaction
 *
 * Use this to measure performance of critical operations
 *
 * @param name - Transaction name
 * @param operation - Operation type (e.g., 'http', 'db', 'render')
 * @returns Transaction object with finish method
 *
 * @example
 * ```typescript
 * const transaction = startTransaction('checkout-flow', 'user-flow');
 * try {
 *   // perform operations
 *   await processPayment();
 * } finally {
 *   transaction.finish();
 * }
 * ```
 */
export function startTransaction(name: string, operation = 'custom') {
  const startTime = Date.now();

  return {
    finish: () => {
      const duration = Date.now() - startTime;
      logger.info('Transaction completed', { name, operation, duration });

      // In production with Sentry:
      // const transaction = Sentry.startTransaction({ name, op: operation });
      // transaction.finish();
    },
  };
}

/**
 * Monitoring utility object for easy imports
 */
export const monitoring = {
  init: initMonitoring,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
};
