/**
 * Secure logging system with automatic sanitization of sensitive data.
 *
 * This module provides a production-ready logger that:
 * - Automatically redacts sensitive fields (passwords, tokens, keys, etc.)
 * - Truncates large strings to prevent log bloat
 * - Limits object depth to prevent circular reference issues
 * - Formats logs with timestamps and structured context
 * - Supports different log levels (debug, info, warn, error)
 * - Includes specialized methods for security, auth, and API access logging
 *
 * @module logger
 * @example
 * ```typescript
 * import { logger, logApiRequest, logSecurityEvent } from './logger';
 *
 * // Basic logging
 * logger.info('User logged in', { userId: '123', ip: '127.0.0.1' });
 *
 * // Security event
 * logSecurityEvent('Failed login attempt', { userId: '123', attempts: 3 });
 *
 * // API access
 * logApiRequest('GET', '/api/users', { userId: '123' });
 * ```
 */

/**
 * Log severity levels.
 * - `debug`: Detailed diagnostic information (only visible in development)
 * - `info`: General informational messages
 * - `warn`: Warning messages for potentially harmful situations
 * - `error`: Error events that might still allow the application to continue
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Contextual information to include with log entries.
 * All sensitive fields will be automatically redacted before logging.
 *
 * @property {string} [userId] - User identifier
 * @property {string} [requestId] - Unique request identifier for tracing
 * @property {string} [ip] - Client IP address
 * @property {string} [userAgent] - Client user agent string
 * @property {string} [url] - Request URL
 * @property {string} [method] - HTTP method
 */
interface LogContext {
  userId?: string;
  requestId?: string;
  ip?: string;
  userAgent?: string;
  url?: string;
  method?: string;
  [key: string]:
    | string
    | number
    | boolean
    | undefined
    | null
    | Record<string, unknown>;
}

/**
 * Structured log entry format.
 *
 * @property {string} timestamp - ISO 8601 formatted timestamp
 * @property {LogLevel} level - Log severity level
 * @property {string} message - Log message
 * @property {LogContext} [context] - Additional contextual information
 * @property {Object} [error] - Error details if applicable
 * @property {string} error.name - Error name/type
 * @property {string} error.message - Error message
 * @property {string} [error.stack] - Stack trace (only in development)
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Secure logger implementation with automatic data sanitization.
 *
 * Features:
 * - Automatic redaction of sensitive fields (passwords, tokens, API keys, etc.)
 * - Truncation of long strings (>1000 chars) to prevent log bloat
 * - Depth limiting for nested objects to prevent circular references
 * - Environment-aware logging (debug only in development)
 * - Specialized methods for security, authentication, and API access logging
 */
class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private maxContextDepth = 3;

  /**
   * Sanitizes log context by redacting sensitive fields and truncating large values.
   *
   * @param {LogContext} context - Raw context object that may contain sensitive data
   * @returns {LogContext} Sanitized context safe for logging
   * @private
   */
  private sanitizeContext(context: LogContext): LogContext {
    const sanitized: LogContext = {};

    for (const [key, value] of Object.entries(context)) {
      // Skip sensitive fields
      if (this.isSensitiveField(key)) {
        sanitized[key] = '[REDACTED]';
        continue;
      }

      // Sanitize nested objects
      if (
        typeof value === 'object' &&
        value !== null &&
        this.maxContextDepth > 0
      ) {
        sanitized[key] = this.sanitizeNestedObject(
          value,
          this.maxContextDepth - 1,
        ) as Record<string, unknown>;
      } else if (typeof value === 'string' && value.length > 1000) {
        // Truncate very long strings
        sanitized[key] = `${value.substring(0, 1000)}...[TRUNCATED]`;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Recursively sanitizes nested objects and arrays with depth limiting.
   *
   * @param {unknown} obj - Object or array to sanitize
   * @param {number} depth - Remaining depth before truncation
   * @returns {unknown} Sanitized object or array, or '[MAX_DEPTH_EXCEEDED]' if depth limit reached
   * @private
   */
  private sanitizeNestedObject(obj: unknown, depth: number): unknown {
    if (depth <= 0) return '[MAX_DEPTH_EXCEEDED]';

    if (Array.isArray(obj)) {
      return obj
        .slice(0, 10)
        .map((item) =>
          typeof item === 'object'
            ? this.sanitizeNestedObject(item, depth - 1)
            : item,
        );
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (this.isSensitiveField(key)) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeNestedObject(value, depth - 1);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }

    return obj;
  }

  /**
   * Checks if a field name indicates sensitive data that should be redacted.
   *
   * Sensitive fields include: password, token, secret, key, authorization, cookie,
   * session, credit_card, ssn, api_key, access_token, refresh_token, private_key, etc.
   *
   * @param {string} key - Field name to check
   * @returns {boolean} True if the field should be redacted
   * @private
   */
  private isSensitiveField(key: string): boolean {
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
      'social_security',
      'api_key',
      'access_token',
      'refresh_token',
      'private_key',
      'encryption_key',
    ];

    return sensitiveFields.some((field) =>
      key.toLowerCase().includes(field.toLowerCase()),
    );
  }

  /**
   * Formats a log message with timestamp, level, and sanitized context.
   *
   * @param {LogLevel} level - Log severity level
   * @param {string} message - Log message
   * @param {LogContext} [context] - Optional contextual information
   * @returns {string} Formatted log message string
   * @private
   */
  private formatLogMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? ` | Context: ${JSON.stringify(this.sanitizeContext(context))}`
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  /**
   * Writes a log entry to the appropriate output stream.
   *
   * In production, this could be extended to send logs to external services
   * like DataDog, CloudWatch, or other log aggregation platforms.
   *
   * @param {LogLevel} level - Log severity level
   * @param {string} message - Log message
   * @param {LogContext} [context] - Optional contextual information
   * @param {Error} [error] - Optional error object
   * @private
   */
  private writeLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined,
      };
    }

    const formattedMessage = this.formatLogMessage(level, message, context);

    // In production, you might want to send logs to a service like DataDog, CloudWatch, etc.
    switch (level) {
      case 'debug':
        if (this.isDevelopment) {
          console.debug(
            formattedMessage,
            logEntry.error ? { error: logEntry.error } : '',
          );
        }
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(
          formattedMessage,
          logEntry.error ? { error: logEntry.error } : '',
        );
        break;
      case 'error':
        console.error(
          formattedMessage,
          logEntry.error ? { error: logEntry.error } : '',
        );
        break;
    }
  }

  /**
   * Logs a debug message. Only visible in development environment.
   *
   * @param {string} message - Debug message
   * @param {LogContext} [context] - Optional contextual information
   */
  debug(message: string, context?: LogContext): void {
    this.writeLog('debug', message, context);
  }

  /**
   * Logs an informational message.
   *
   * @param {string} message - Informational message
   * @param {LogContext} [context] - Optional contextual information
   */
  info(message: string, context?: LogContext): void {
    this.writeLog('info', message, context);
  }

  /**
   * Logs a warning message with optional error details.
   *
   * @param {string} message - Warning message
   * @param {LogContext} [context] - Optional contextual information
   * @param {Error} [error] - Optional error object
   */
  warn(message: string, context?: LogContext, error?: Error): void {
    this.writeLog('warn', message, context, error);
  }

  /**
   * Logs an error message with optional error details.
   *
   * @param {string} message - Error message
   * @param {LogContext} [context] - Optional contextual information
   * @param {Error} [error] - Optional error object
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.writeLog('error', message, context, error);
  }

  /**
   * Logs a security-related event as a warning.
   *
   * Automatically adds `securityEvent: true` flag to context for filtering.
   *
   * @param {string} event - Security event description (e.g., 'Failed login attempt')
   * @param {LogContext} context - Contextual information about the security event
   */
  logSecurityEvent(event: string, context: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs an authentication-related event as info.
   *
   * Automatically adds `authEvent: true` flag to context for filtering.
   *
   * @param {string} event - Auth event description (e.g., 'User logged in')
   * @param {LogContext} context - Contextual information about the auth event
   */
  logAuthEvent(event: string, context: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      ...context,
      authEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Logs an API access event.
   *
   * Automatically adds `apiAccess: true` flag to context for filtering.
   *
   * @param {string} method - HTTP method (GET, POST, etc.)
   * @param {string} path - API endpoint path
   * @param {LogContext} context - Contextual information about the request
   */
  logApiAccess(method: string, path: string, context: LogContext): void {
    this.info(`API Access: ${method} ${path}`, {
      ...context,
      apiAccess: true,
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Singleton logger instance.
 * Use this for all logging throughout the application.
 */
export const logger = new SecureLogger();

// ============================================================================
// Convenience Functions
// ============================================================================
// These functions provide a simpler API for common logging patterns

/**
 * Logs an API request access event.
 *
 * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param {string} path - API endpoint path
 * @param {LogContext} [context={}] - Optional contextual information
 *
 * @example
 * ```typescript
 * logApiRequest('GET', '/api/users', { userId: '123', requestId: 'abc' });
 * ```
 */
export const logApiRequest = (
  method: string,
  path: string,
  context: LogContext = {},
) => {
  logger.logApiAccess(method, path, context);
};

/**
 * Logs a security-related event.
 *
 * @param {string} event - Security event description
 * @param {LogContext} [context={}] - Contextual information about the event
 *
 * @example
 * ```typescript
 * logSecurityEvent('Failed login attempt', { userId: '123', attempts: 3, ip: '192.168.1.1' });
 * logSecurityEvent('Suspicious activity detected', { userId: '456', action: 'mass_download' });
 * ```
 */
export const logSecurityEvent = (event: string, context: LogContext = {}) => {
  logger.logSecurityEvent(event, context);
};

/**
 * Logs an authentication-related event.
 *
 * @param {string} event - Auth event description
 * @param {LogContext} [context={}] - Contextual information about the event
 *
 * @example
 * ```typescript
 * logAuthEvent('User logged in', { userId: '123', method: 'password' });
 * logAuthEvent('Password reset requested', { email: 'user@example.com' });
 * ```
 */
export const logAuthEvent = (event: string, context: LogContext = {}) => {
  logger.logAuthEvent(event, context);
};

/**
 * Logs an error with optional error object and context.
 *
 * @param {string} message - Error message
 * @param {Error} [error] - Optional error object with stack trace
 * @param {LogContext} [context={}] - Optional contextual information
 *
 * @example
 * ```typescript
 * try {
 *   // ... some operation
 * } catch (error) {
 *   logError('Failed to process user request', error, { userId: '123', operation: 'create' });
 * }
 * ```
 */
export const logError = (
  message: string,
  error?: Error,
  context: LogContext = {},
) => {
  logger.error(message, context, error);
};

/**
 * Logs a warning message.
 *
 * @param {string} message - Warning message
 * @param {LogContext} [context={}] - Optional contextual information
 *
 * @example
 * ```typescript
 * logWarn('API rate limit approaching', { userId: '123', requests: 95, limit: 100 });
 * ```
 */
export const logWarn = (message: string, context: LogContext = {}) => {
  logger.warn(message, context);
};

/**
 * Logs an informational message.
 *
 * @param {string} message - Informational message
 * @param {LogContext} [context={}] - Optional contextual information
 *
 * @example
 * ```typescript
 * logInfo('User subscription upgraded', { userId: '123', plan: 'Pro' });
 * ```
 */
export const logInfo = (message: string, context: LogContext = {}) => {
  logger.info(message, context);
};

/**
 * Logs a debug message (only visible in development).
 *
 * @param {string} message - Debug message
 * @param {LogContext} [context={}] - Optional contextual information
 *
 * @example
 * ```typescript
 * logDebug('Cache hit', { key: 'user:123', ttl: 3600 });
 * ```
 */
export const logDebug = (message: string, context: LogContext = {}) => {
  logger.debug(message, context);
};
