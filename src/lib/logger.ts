type LogLevel = 'debug' | 'info' | 'warn' | 'error';

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

class SecureLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private maxContextDepth = 3;

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

  debug(message: string, context?: LogContext): void {
    this.writeLog('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.writeLog('info', message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.writeLog('warn', message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.writeLog('error', message, context, error);
  }

  // Security-specific logging methods
  logSecurityEvent(event: string, context: LogContext): void {
    this.warn(`Security Event: ${event}`, {
      ...context,
      securityEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  logAuthEvent(event: string, context: LogContext): void {
    this.info(`Auth Event: ${event}`, {
      ...context,
      authEvent: true,
      timestamp: new Date().toISOString(),
    });
  }

  logApiAccess(method: string, path: string, context: LogContext): void {
    this.info(`API Access: ${method} ${path}`, {
      ...context,
      apiAccess: true,
      timestamp: new Date().toISOString(),
    });
  }
}

// Export singleton instance
export const logger = new SecureLogger();

// Convenience functions for common logging patterns
export const logApiRequest = (
  method: string,
  path: string,
  context: LogContext = {},
) => {
  logger.logApiAccess(method, path, context);
};

export const logSecurityEvent = (event: string, context: LogContext = {}) => {
  logger.logSecurityEvent(event, context);
};

export const logAuthEvent = (event: string, context: LogContext = {}) => {
  logger.logAuthEvent(event, context);
};

export const logError = (
  message: string,
  error?: Error,
  context: LogContext = {},
) => {
  logger.error(message, context, error);
};

export const logWarn = (message: string, context: LogContext = {}) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context: LogContext = {}) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context: LogContext = {}) => {
  logger.debug(message, context);
};
