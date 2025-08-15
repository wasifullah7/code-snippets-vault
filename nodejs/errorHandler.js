/**
 * Advanced error handling utilities for Node.js applications
 * Comprehensive error management, logging, and recovery mechanisms
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Custom error classes for different types of errors
 */
class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date().toISOString();
    this.stack = this.stack;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = []) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

/**
 * Error logger with different output formats
 */
class ErrorLogger {
  constructor(options = {}) {
    this.logFile = options.logFile || 'error.log';
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.format = options.format || 'json'; // json, text, detailed
    this.includeStack = options.includeStack !== false;
    this.includeTimestamp = options.includeTimestamp !== false;
  }

  /**
   * Log error with specified format
   * @param {Error} error - Error to log
   * @param {Object} context - Additional context
   */
  async log(error, context = {}) {
    const logEntry = this.formatError(error, context);
    
    try {
      await this.writeToFile(logEntry);
      this.writeToConsole(logEntry);
    } catch (writeError) {
      console.error('Failed to write error log:', writeError);
    }
  }

  /**
   * Format error based on specified format
   * @param {Error} error - Error to format
   * @param {Object} context - Additional context
   * @returns {string} Formatted error string
   */
  formatError(error, context = {}) {
    const baseInfo = {
      name: error.name,
      message: error.message,
      stack: this.includeStack ? error.stack : undefined,
      timestamp: this.includeTimestamp ? new Date().toISOString() : undefined,
      ...context
    };

    if (error instanceof AppError) {
      baseInfo.statusCode = error.statusCode;
      baseInfo.isOperational = error.isOperational;
    }

    switch (this.format) {
      case 'json':
        return JSON.stringify(baseInfo, null, 2);
      case 'text':
        return this.formatAsText(baseInfo);
      case 'detailed':
        return this.formatAsDetailed(baseInfo);
      default:
        return JSON.stringify(baseInfo, null, 2);
    }
  }

  /**
   * Format error as plain text
   * @param {Object} errorInfo - Error information
   * @returns {string} Formatted text
   */
  formatAsText(errorInfo) {
    let text = `[${errorInfo.timestamp}] ${errorInfo.name}: ${errorInfo.message}`;
    
    if (errorInfo.statusCode) {
      text += ` (Status: ${errorInfo.statusCode})`;
    }
    
    if (errorInfo.stack) {
      text += `\nStack: ${errorInfo.stack}`;
    }
    
    if (Object.keys(errorInfo).length > 4) {
      const context = { ...errorInfo };
      delete context.name;
      delete context.message;
      delete context.stack;
      delete context.timestamp;
      text += `\nContext: ${JSON.stringify(context, null, 2)}`;
    }
    
    return text;
  }

  /**
   * Format error with detailed information
   * @param {Object} errorInfo - Error information
   * @returns {string} Detailed formatted text
   */
  formatAsDetailed(errorInfo) {
    let text = '='.repeat(80) + '\n';
    text += `ERROR REPORT - ${errorInfo.timestamp}\n`;
    text += '='.repeat(80) + '\n\n';
    
    text += `Error Type: ${errorInfo.name}\n`;
    text += `Message: ${errorInfo.message}\n`;
    
    if (errorInfo.statusCode) {
      text += `Status Code: ${errorInfo.statusCode}\n`;
    }
    
    if (errorInfo.isOperational !== undefined) {
      text += `Operational: ${errorInfo.isOperational}\n`;
    }
    
    if (errorInfo.stack) {
      text += `\nStack Trace:\n${errorInfo.stack}\n`;
    }
    
    const context = { ...errorInfo };
    delete context.name;
    delete context.message;
    delete context.stack;
    delete context.timestamp;
    delete context.statusCode;
    delete context.isOperational;
    
    if (Object.keys(context).length > 0) {
      text += `\nContext:\n${JSON.stringify(context, null, 2)}\n`;
    }
    
    text += '\n' + '='.repeat(80) + '\n';
    return text;
  }

  /**
   * Write error to file with rotation
   * @param {string} logEntry - Log entry to write
   */
  async writeToFile(logEntry) {
    try {
      const logPath = path.resolve(this.logFile);
      const logDir = path.dirname(logPath);
      
      // Ensure log directory exists
      await fs.mkdir(logDir, { recursive: true });
      
      // Check file size and rotate if necessary
      try {
        const stats = await fs.stat(logPath);
        if (stats.size > this.maxFileSize) {
          await this.rotateLogFile(logPath);
        }
      } catch (err) {
        // File doesn't exist, which is fine
      }
      
      await fs.appendFile(logPath, logEntry + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file when it exceeds max size
   * @param {string} logPath - Path to log file
   */
  async rotateLogFile(logPath) {
    for (let i = this.maxFiles - 1; i > 0; i--) {
      const oldFile = `${logPath}.${i}`;
      const newFile = `${logPath}.${i + 1}`;
      
      try {
        await fs.rename(oldFile, newFile);
      } catch (err) {
        // File doesn't exist, continue
      }
    }
    
    try {
      await fs.rename(logPath, `${logPath}.1`);
    } catch (err) {
      // Handle case where file doesn't exist
    }
  }

  /**
   * Write error to console
   * @param {string} logEntry - Log entry to write
   */
  writeToConsole(logEntry) {
    console.error(logEntry);
  }
}

/**
 * Error handler middleware for Express
 */
class ErrorHandler {
  constructor(options = {}) {
    this.logger = new ErrorLogger(options.logger);
    this.isDevelopment = options.isDevelopment || process.env.NODE_ENV === 'development';
    this.isProduction = options.isProduction || process.env.NODE_ENV === 'production';
  }

  /**
   * Express error handling middleware
   * @param {Error} error - Error object
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async handleError(error, req, res, next) {
    // Log the error
    await this.logger.log(error, {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      params: req.params,
      query: req.query
    });

    // Determine error details
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    const isOperational = error.isOperational !== false;

    // Send error response
    if (this.isDevelopment) {
      // Development: Send detailed error information
      res.status(statusCode).json({
        error: {
          message,
          statusCode,
          stack: error.stack,
          name: error.name,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      // Production: Send minimal error information
      res.status(statusCode).json({
        error: {
          message: isOperational ? message : 'Internal Server Error',
          statusCode
        }
      });
    }
  }

  /**
   * Handle unhandled promise rejections
   * @param {Error} error - Unhandled rejection error
   */
  handleUnhandledRejection(error) {
    this.logger.log(error, { type: 'unhandledRejection' });
    
    if (this.isProduction) {
      process.exit(1);
    }
  }

  /**
   * Handle uncaught exceptions
   * @param {Error} error - Uncaught exception error
   */
  handleUncaughtException(error) {
    this.logger.log(error, { type: 'uncaughtException' });
    
    if (this.isProduction) {
      process.exit(1);
    }
  }

  /**
   * Setup global error handlers
   */
  setupGlobalHandlers() {
    process.on('unhandledRejection', this.handleUnhandledRejection.bind(this));
    process.on('uncaughtException', this.handleUncaughtException.bind(this));
  }
}

/**
 * Async error wrapper for Express routes
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Wrapped function
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Error response utility
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 */
function sendError(res, message, statusCode = 500, details = {}) {
  res.status(statusCode).json({
    error: {
      message,
      statusCode,
      timestamp: new Date().toISOString(),
      ...details
    }
  });
}

/**
 * Success response utility
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code
 */
function sendSuccess(res, data, message = 'Success', statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Validation error helper
 * @param {Array} errors - Validation errors
 * @param {string} message - Error message
 * @returns {ValidationError} Validation error instance
 */
function createValidationError(errors, message = 'Validation failed') {
  return new ValidationError(message, errors);
}

/**
 * Error monitoring and alerting
 */
class ErrorMonitor {
  constructor(options = {}) {
    this.errorCounts = new Map();
    this.alertThreshold = options.alertThreshold || 10;
    this.timeWindow = options.timeWindow || 60000; // 1 minute
    this.alertCallback = options.alertCallback || this.defaultAlertCallback;
  }

  /**
   * Track error occurrence
   * @param {Error} error - Error to track
   */
  trackError(error) {
    const errorKey = `${error.name}:${error.message}`;
    const now = Date.now();
    
    if (!this.errorCounts.has(errorKey)) {
      this.errorCounts.set(errorKey, []);
    }
    
    const timestamps = this.errorCounts.get(errorKey);
    timestamps.push(now);
    
    // Remove old timestamps outside the time window
    const cutoff = now - this.timeWindow;
    const recentErrors = timestamps.filter(timestamp => timestamp > cutoff);
    this.errorCounts.set(errorKey, recentErrors);
    
    // Check if we should alert
    if (recentErrors.length >= this.alertThreshold) {
      this.alertCallback(errorKey, recentErrors.length, error);
    }
  }

  /**
   * Default alert callback
   * @param {string} errorKey - Error key
   * @param {number} count - Error count
   * @param {Error} error - Error object
   */
  defaultAlertCallback(errorKey, count, error) {
    console.warn(`🚨 ALERT: ${errorKey} occurred ${count} times in the last minute`);
  }

  /**
   * Get error statistics
   * @returns {Object} Error statistics
   */
  getStats() {
    const stats = {};
    const now = Date.now();
    const cutoff = now - this.timeWindow;
    
    for (const [errorKey, timestamps] of this.errorCounts) {
      const recentErrors = timestamps.filter(timestamp => timestamp > cutoff);
      stats[errorKey] = {
        total: timestamps.length,
        recent: recentErrors.length,
        rate: recentErrors.length / (this.timeWindow / 1000) // errors per second
      };
    }
    
    return stats;
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ErrorLogger,
  ErrorHandler,
  ErrorMonitor,
  asyncHandler,
  sendError,
  sendSuccess,
  createValidationError
};
