/**
 * @fileoverview Structured logging utility for StockPulse
 *
 * Provides enterprise-grade logging with different levels, structured data,
 * and environment-aware output formatting.
 */

import { config } from '../config/client.js';

/**
 * Log levels with numeric priorities
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4,
};

/**
 * Get current log level from configuration
 */
const getLogLevel = () => {
  const level = config.dev.logLevel.toUpperCase();
  return LOG_LEVELS[level] ?? LOG_LEVELS.INFO;
};

/**
 * Format log message with timestamp and context
 */
const formatMessage = (level, message, context = {}) => {
  const timestamp = new Date().toISOString();
  const environment = config.environment;

  return {
    timestamp,
    level,
    environment,
    message,
    context,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server',
    ...context,
  };
};

/**
 * Output log to appropriate destination based on environment
 */
const outputLog = (level, formattedMessage) => {
  const currentLevel = getLogLevel();

  // Don't log if below current level
  if (LOG_LEVELS[level.toUpperCase()] > currentLevel) {
    return;
  }

  const message = `[${formattedMessage.timestamp}] ${level.toUpperCase()}: ${formattedMessage.message}`;

  // Add context if present
  const contextStr = Object.keys(formattedMessage.context || {}).length > 0
    ? `\nContext: ${JSON.stringify(formattedMessage.context, null, 2)}`
    : '';

  // Use appropriate console method
  switch (level.toLowerCase()) {
    case 'error':
      console.error(message, contextStr);
      break;
    case 'warn':
      console.warn(message, contextStr);
      break;
    case 'debug':
      console.debug(message, contextStr);
      break;
    case 'trace':
      console.trace(message, contextStr);
      break;
    case 'info':
    default:
      console.info(message, contextStr);
      break;
  }

  // Send to external logging service in production
  if (config.isProduction && config.features.enableErrorTracking) {
    sendToExternalService(formattedMessage);
  }
};

/**
 * Send logs to external monitoring service
 */
const sendToExternalService = async (logData) => {
  try {
    // This would integrate with services like DataDog, LogRocket, etc.
    // For now, we'll just store in localStorage for debugging
    if (typeof window !== 'undefined' && config.isDevelopment) {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(logData);
      // Keep only last 100 logs
      if (logs.length > 100) {
        logs.shift();
      }
      localStorage.setItem('app_logs', JSON.stringify(logs));
    }
  } catch (error) {
    // Don't let logging errors break the app
    console.error('Failed to send log to external service:', error);
  }
};

/**
 * Logger class with structured logging methods
 */
class Logger {
  /**
   * Log an error message
   * @param {string} message - The error message
   * @param {Object} context - Additional context data
   */
  error(message, context = {}) {
    const formatted = formatMessage('ERROR', message, context);
    outputLog('error', formatted);
  }

  /**
   * Log a warning message
   * @param {string} message - The warning message
   * @param {Object} context - Additional context data
   */
  warn(message, context = {}) {
    const formatted = formatMessage('WARN', message, context);
    outputLog('warn', formatted);
  }

  /**
   * Log an info message
   * @param {string} message - The info message
   * @param {Object} context - Additional context data
   */
  info(message, context = {}) {
    const formatted = formatMessage('INFO', message, context);
    outputLog('info', formatted);
  }

  /**
   * Log a debug message
   * @param {string} message - The debug message
   * @param {Object} context - Additional context data
   */
  debug(message, context = {}) {
    const formatted = formatMessage('DEBUG', message, context);
    outputLog('debug', formatted);
  }

  /**
   * Log a trace message with stack trace
   * @param {string} message - The trace message
   * @param {Object} context - Additional context data
   */
  trace(message, context = {}) {
    const formatted = formatMessage('TRACE', message, context);
    outputLog('trace', formatted);
  }

  /**
   * Log performance timing
   * @param {string} operation - The operation name
   * @param {number} duration - Duration in milliseconds
   * @param {Object} context - Additional context data
   */
  performance(operation, duration, context = {}) {
    this.info(`Performance: ${operation} took ${duration.toFixed(2)}ms`, {
      operation,
      duration,
      performance: true,
      ...context,
    });
  }

  /**
   * Log API request/response
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {number} status - Response status code
   * @param {number} duration - Request duration in milliseconds
   */
  apiRequest(method, url, status, duration) {
    const level = status >= 400 ? 'warn' : 'info';
    this[level](`API ${method} ${url} - ${status} (${duration.toFixed(2)}ms)`, {
      api: true,
      method,
      url,
      status,
      duration,
    });
  }

  /**
   * Log user action
   * @param {string} action - User action description
   * @param {Object} context - Additional context data
   */
  userAction(action, context = {}) {
    this.info(`User Action: ${action}`, {
      userAction: true,
      action,
      ...context,
    });
  }

  /**
   * Log application lifecycle events
   * @param {string} event - Lifecycle event name
   * @param {Object} context - Additional context data
   */
  lifecycle(event, context = {}) {
    this.info(`Lifecycle: ${event}`, {
      lifecycle: true,
      event,
      ...context,
    });
  }
}

/**
 * Export singleton logger instance
 */
export const logger = new Logger();

/**
 * Create a child logger with a specific namespace
 * @param {string} namespace - Logger namespace
 * @returns {Object} Namespaced logger methods
 */
export const createNamespacedLogger = (namespace) => {
  const childLogger = {
    error: (message, context = {}) => logger.error(`[${namespace}] ${message}`, context),
    warn: (message, context = {}) => logger.warn(`[${namespace}] ${message}`, context),
    info: (message, context = {}) => logger.info(`[${namespace}] ${message}`, context),
    debug: (message, context = {}) => logger.debug(`[${namespace}] ${message}`, context),
    trace: (message, context = {}) => logger.trace(`[${namespace}] ${message}`, context),
  };

  return childLogger;
};

export default logger;
