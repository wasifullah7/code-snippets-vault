/**
 * Advanced logging utilities for Node.js applications
 * Comprehensive logging system with multiple transports, levels, and monitoring
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

/**
 * Log levels and their priorities
 */
const LogLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  TRACE: 4
};

/**
 * Log level names
 */
const LogLevelNames = {
  0: 'ERROR',
  1: 'WARN',
  2: 'INFO',
  3: 'DEBUG',
  4: 'TRACE'
};

/**
 * Base transport class
 */
class Transport {
  constructor(options = {}) {
    this.level = options.level || 'INFO';
    this.format = options.format || 'json';
    this.enabled = options.enabled !== false;
  }

  /**
   * Check if transport should handle this log level
   * @param {string} level - Log level
   * @returns {boolean} Whether transport should handle level
   */
  shouldLog(level) {
    return this.enabled && LogLevels[level] <= LogLevels[this.level];
  }

  /**
   * Format log message
   * @param {Object} logEntry - Log entry object
   * @returns {string} Formatted log message
   */
  formatMessage(logEntry) {
    switch (this.format) {
      case 'json':
        return JSON.stringify(logEntry);
      case 'text':
        return `${logEntry.timestamp} [${logEntry.level}] ${logEntry.message}`;
      case 'simple':
        return `${logEntry.level}: ${logEntry.message}`;
      default:
        return JSON.stringify(logEntry);
    }
  }

  /**
   * Log message (to be implemented by subclasses)
   * @param {Object} logEntry - Log entry object
   */
  log(logEntry) {
    throw new Error('log method must be implemented by transport subclass');
  }
}

/**
 * Console transport
 */
class ConsoleTransport extends Transport {
  constructor(options = {}) {
    super(options);
    this.colors = options.colors !== false;
    this.timestamp = options.timestamp !== false;
  }

  /**
   * Get color for log level
   * @param {string} level - Log level
   * @returns {string} Color code
   */
  getColor(level) {
    const colors = {
      ERROR: '\x1b[31m', // Red
      WARN: '\x1b[33m',  // Yellow
      INFO: '\x1b[36m',  // Cyan
      DEBUG: '\x1b[35m', // Magenta
      TRACE: '\x1b[37m'  // White
    };
    return colors[level] || '\x1b[0m';
  }

  /**
   * Reset color
   * @returns {string} Reset color code
   */
  getResetColor() {
    return '\x1b[0m';
  }

  /**
   * Log to console
   * @param {Object} logEntry - Log entry object
   */
  log(logEntry) {
    if (!this.shouldLog(logEntry.level)) return;

    const message = this.formatMessage(logEntry);
    
    if (this.colors) {
      const color = this.getColor(logEntry.level);
      const reset = this.getResetColor();
      console.log(`${color}${message}${reset}`);
    } else {
      console.log(message);
    }
  }
}

/**
 * File transport
 */
class FileTransport extends Transport {
  constructor(options = {}) {
    super(options);
    this.filename = options.filename || 'app.log';
    this.dirname = options.dirname || './logs';
    this.maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.rotation = options.rotation || 'daily';
    
    this.ensureDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureDirectory() {
    if (!fs.existsSync(this.dirname)) {
      fs.mkdirSync(this.dirname, { recursive: true });
    }
  }

  /**
   * Get current log filename
   * @returns {string} Log filename
   */
  getCurrentFilename() {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    
    if (this.rotation === 'daily') {
      return path.join(this.dirname, `${date}-${this.filename}`);
    }
    
    return path.join(this.dirname, this.filename);
  }

  /**
   * Rotate log files
   */
  rotateLogs() {
    const currentFile = this.getCurrentFilename();
    
    if (fs.existsSync(currentFile)) {
      const stats = fs.statSync(currentFile);
      
      if (stats.size > this.maxSize) {
        // Rotate existing files
        for (let i = this.maxFiles - 1; i > 0; i--) {
          const oldFile = `${currentFile}.${i}`;
          const newFile = `${currentFile}.${i + 1}`;
          
          if (fs.existsSync(oldFile)) {
            if (i === this.maxFiles - 1) {
              fs.unlinkSync(oldFile);
            } else {
              fs.renameSync(oldFile, newFile);
            }
          }
        }
        
        // Move current file
        fs.renameSync(currentFile, `${currentFile}.1`);
      }
    }
  }

  /**
   * Log to file
   * @param {Object} logEntry - Log entry object
   */
  log(logEntry) {
    if (!this.shouldLog(logEntry.level)) return;

    try {
      this.rotateLogs();
      
      const message = this.formatMessage(logEntry) + '\n';
      const filename = this.getCurrentFilename();
      
      fs.appendFileSync(filename, message);
    } catch (error) {
      console.error('File transport error:', error);
    }
  }
}

/**
 * HTTP transport
 */
class HttpTransport extends Transport {
  constructor(options = {}) {
    super(options);
    this.url = options.url;
    this.method = options.method || 'POST';
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.timeout = options.timeout || 5000;
    this.retries = options.retries || 3;
  }

  /**
   * Send HTTP request
   * @param {Object} logEntry - Log entry object
   */
  async log(logEntry) {
    if (!this.shouldLog(logEntry.level)) return;

    const message = this.formatMessage(logEntry);
    
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(this.url, {
          method: this.method,
          headers: this.headers,
          body: message,
          timeout: this.timeout
        });
        
        if (response.ok) {
          break;
        }
      } catch (error) {
        if (attempt === this.retries) {
          console.error('HTTP transport error:', error);
        }
      }
    }
  }
}

/**
 * Memory transport for testing and debugging
 */
class MemoryTransport extends Transport {
  constructor(options = {}) {
    super(options);
    this.maxEntries = options.maxEntries || 1000;
    this.entries = [];
  }

  /**
   * Log to memory
   * @param {Object} logEntry - Log entry object
   */
  log(logEntry) {
    if (!this.shouldLog(logEntry.level)) return;

    this.entries.push(logEntry);
    
    if (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  /**
   * Get all log entries
   * @returns {Array} Log entries
   */
  getEntries() {
    return [...this.entries];
  }

  /**
   * Get entries by level
   * @param {string} level - Log level
   * @returns {Array} Filtered log entries
   */
  getEntriesByLevel(level) {
    return this.entries.filter(entry => entry.level === level);
  }

  /**
   * Clear all entries
   */
  clear() {
    this.entries = [];
  }
}

/**
 * Main logger class
 */
class Logger extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = options.name || 'app';
    this.level = options.level || 'INFO';
    this.transports = [];
    this.metadata = options.metadata || {};
    
    // Add default console transport
    if (options.console !== false) {
      this.addTransport(new ConsoleTransport(options.console));
    }
  }

  /**
   * Add transport
   * @param {Transport} transport - Transport instance
   */
  addTransport(transport) {
    this.transports.push(transport);
  }

  /**
   * Remove transport
   * @param {Transport} transport - Transport instance
   */
  removeTransport(transport) {
    const index = this.transports.indexOf(transport);
    if (index > -1) {
      this.transports.splice(index, 1);
    }
  }

  /**
   * Create log entry
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {Object} Log entry
   */
  createLogEntry(level, message, meta = {}) {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      name: this.name,
      ...this.metadata,
      ...meta
    };
  }

  /**
   * Log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    if (LogLevels[level] > LogLevels[this.level]) return;

    const logEntry = this.createLogEntry(level, message, meta);
    
    // Emit log event
    this.emit('log', logEntry);
    
    // Send to transports
    this.transports.forEach(transport => {
      try {
        transport.log(logEntry);
      } catch (error) {
        console.error('Transport error:', error);
      }
    });
  }

  /**
   * Log error
   * @param {string} message - Error message
   * @param {Error|Object} error - Error object or metadata
   */
  error(message, error = {}) {
    const meta = error instanceof Error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : error;
    
    this.log('ERROR', message, meta);
  }

  /**
   * Log warning
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  /**
   * Log info
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  /**
   * Log debug
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  /**
   * Log trace
   * @param {string} message - Trace message
   * @param {Object} meta - Additional metadata
   */
  trace(message, meta = {}) {
    this.log('TRACE', message, meta);
  }

  /**
   * Create child logger
   * @param {string} name - Child logger name
   * @param {Object} metadata - Additional metadata
   * @returns {Logger} Child logger instance
   */
  child(name, metadata = {}) {
    const childLogger = new Logger({
      name: `${this.name}:${name}`,
      level: this.level,
      metadata: { ...this.metadata, ...metadata },
      console: false
    });
    
    // Copy transports
    this.transports.forEach(transport => {
      childLogger.addTransport(transport);
    });
    
    return childLogger;
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (LogLevels[level] !== undefined) {
      this.level = level;
    }
  }

  /**
   * Get current log level
   * @returns {string} Current log level
   */
  getLevel() {
    return this.level;
  }

  /**
   * Check if level is enabled
   * @param {string} level - Log level to check
   * @returns {boolean} Whether level is enabled
   */
  isLevelEnabled(level) {
    return LogLevels[level] <= LogLevels[this.level];
  }
}

/**
 * Request logger middleware for Express
 */
class RequestLogger {
  constructor(logger, options = {}) {
    this.logger = logger;
    this.options = {
      logRequests: options.logRequests !== false,
      logResponses: options.logResponses !== false,
      logErrors: options.logErrors !== false,
      excludePaths: options.excludePaths || [],
      includeHeaders: options.includeHeaders || [],
      ...options
    };
  }

  /**
   * Create middleware function
   * @returns {Function} Express middleware
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Check if path should be excluded
      if (this.options.excludePaths.some(path => req.path.startsWith(path))) {
        return next();
      }

      // Log request
      if (this.options.logRequests) {
        const requestMeta = {
          method: req.method,
          url: req.url,
          headers: this.filterHeaders(req.headers),
          ip: req.ip,
          userAgent: req.get('User-Agent')
        };
        
        this.logger.info(`${req.method} ${req.url}`, requestMeta);
      }

      // Override res.end to log response
      const originalEnd = res.end;
      res.end = (chunk, encoding) => {
        const duration = Date.now() - startTime;
        
        // Log response
        if (this.options.logResponses) {
          const responseMeta = {
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            duration,
            contentLength: res.get('Content-Length')
          };
          
          const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
          this.logger[level.toLowerCase()](`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`, responseMeta);
        }
        
        originalEnd.call(res, chunk, encoding);
      };

      // Log errors
      if (this.options.logErrors) {
        res.on('error', (error) => {
          this.logger.error(`Response error for ${req.method} ${req.url}`, { error });
        });
      }

      next();
    };
  }

  /**
   * Filter headers based on includeHeaders option
   * @param {Object} headers - Request headers
   * @returns {Object} Filtered headers
   */
  filterHeaders(headers) {
    if (this.options.includeHeaders.length === 0) {
      return {};
    }
    
    const filtered = {};
    this.options.includeHeaders.forEach(header => {
      if (headers[header]) {
        filtered[header] = headers[header];
      }
    });
    
    return filtered;
  }
}

/**
 * Performance logger
 */
class PerformanceLogger {
  constructor(logger) {
    this.logger = logger;
    this.marks = new Map();
    this.measures = new Map();
  }

  /**
   * Mark a point in time
   * @param {string} name - Mark name
   * @param {Object} meta - Additional metadata
   */
  mark(name, meta = {}) {
    const timestamp = performance.now();
    this.marks.set(name, { timestamp, meta });
    this.logger.debug(`Performance mark: ${name}`, { timestamp, ...meta });
  }

  /**
   * Measure time between two marks
   * @param {string} name - Measure name
   * @param {string} startMark - Start mark name
   * @param {string} endMark - End mark name
   * @param {Object} meta - Additional metadata
   */
  measure(name, startMark, endMark, meta = {}) {
    const start = this.marks.get(startMark);
    const end = this.marks.get(endMark);
    
    if (!start || !end) {
      this.logger.warn(`Cannot measure ${name}: marks not found`, { startMark, endMark });
      return;
    }
    
    const duration = end.timestamp - start.timestamp;
    this.measures.set(name, { duration, start, end, meta });
    
    this.logger.info(`Performance measure: ${name}`, {
      duration: `${duration.toFixed(2)}ms`,
      startMark,
      endMark,
      ...meta
    });
  }

  /**
   * Time a function execution
   * @param {string} name - Timer name
   * @param {Function} fn - Function to time
   * @param {Object} meta - Additional metadata
   * @returns {Promise} Function result
   */
  async time(name, fn, meta = {}) {
    const start = performance.now();
    
    try {
      const result = await fn();
      const duration = performance.now() - start;
      
      this.logger.info(`Function timer: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        success: true,
        ...meta
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      
      this.logger.error(`Function timer: ${name}`, {
        duration: `${duration.toFixed(2)}ms`,
        success: false,
        error: error.message,
        ...meta
      });
      
      throw error;
    }
  }
}

/**
 * Logger utilities
 */
const loggerUtils = {
  /**
   * Create a simple logger
   * @param {Object} options - Logger options
   * @returns {Logger} Logger instance
   */
  createLogger(options = {}) {
    return new Logger(options);
  },

  /**
   * Create a file logger
   * @param {string} filename - Log filename
   * @param {Object} options - Logger options
   * @returns {Logger} Logger instance
   */
  createFileLogger(filename, options = {}) {
    const logger = new Logger({ ...options, console: false });
    logger.addTransport(new FileTransport({ filename, ...options }));
    return logger;
  },

  /**
   * Create a development logger
   * @param {Object} options - Logger options
   * @returns {Logger} Logger instance
   */
  createDevLogger(options = {}) {
    return new Logger({
      level: 'DEBUG',
      console: { colors: true, timestamp: true },
      ...options
    });
  },

  /**
   * Create a production logger
   * @param {Object} options - Logger options
   * @returns {Logger} Logger instance
   */
  createProdLogger(options = {}) {
    const logger = new Logger({
      level: 'INFO',
      console: false,
      ...options
    });
    
    logger.addTransport(new FileTransport({
      filename: 'app.log',
      rotation: 'daily',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 30,
      ...options
    }));
    
    return logger;
  }
};

module.exports = {
  Logger,
  Transport,
  ConsoleTransport,
  FileTransport,
  HttpTransport,
  MemoryTransport,
  RequestLogger,
  PerformanceLogger,
  LogLevels,
  LogLevelNames,
  loggerUtils
};
module.exports = Logger;