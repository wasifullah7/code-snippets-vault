/**
 * Advanced logging utility with multiple transports and formatting options
 * @param {Object} options - Configuration options
 * @param {string} options.level - Log level (default: 'info')
 * @param {string} options.format - Log format (default: 'json')
 * @param {boolean} options.timestamp - Include timestamps (default: true)
 * @param {string} options.filePath - Log file path (default: './logs/app.log')
 * @param {number} options.maxSize - Max file size in MB (default: 10)
 * @param {number} options.maxFiles - Max number of files (default: 5)
 * @param {boolean} options.console - Enable console logging (default: true)
 * @param {boolean} options.file - Enable file logging (default: true)
 */
const fs = require('fs');
const path = require('path');
const util = require('util');

class Logger {
  constructor(options = {}) {
    this.options = {
      level: options.level || 'info',
      format: options.format || 'json',
      timestamp: options.timestamp !== false,
      filePath: options.filePath || './logs/app.log',
      maxSize: options.maxSize || 10,
      maxFiles: options.maxFiles || 5,
      console: options.console !== false,
      file: options.file !== false,
      ...options
    };

    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      trace: 4
    };

    this.currentLevel = this.levels[this.options.level] || 2;
    this.ensureLogDirectory();
  }

  /**
   * Ensure log directory exists
   */
  ensureLogDirectory() {
    if (this.options.file) {
      const logDir = path.dirname(this.options.filePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
    }
  }

  /**
   * Format log message
   * @param {string} level - Log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   * @returns {string} Formatted log message
   */
  formatMessage(level, message, meta = {}) {
    const logEntry = {
      timestamp: this.options.timestamp ? new Date().toISOString() : undefined,
      level: level.toUpperCase(),
      message,
      ...meta
    };

    if (this.options.format === 'json') {
      return JSON.stringify(logEntry);
    } else if (this.options.format === 'simple') {
      const timestamp = logEntry.timestamp ? `[${logEntry.timestamp}]` : '';
      const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
      return `${timestamp} [${logEntry.level}] ${message}${metaStr}`;
    } else if (this.options.format === 'colored') {
      return this.colorize(level, logEntry);
    }

    return JSON.stringify(logEntry);
  }

  /**
   * Colorize log message for console
   * @param {string} level - Log level
   * @param {Object} logEntry - Log entry object
   * @returns {string} Colorized log message
   */
  colorize(level, logEntry) {
    const colors = {
      error: '\x1b[31m', // Red
      warn: '\x1b[33m',  // Yellow
      info: '\x1b[36m',  // Cyan
      debug: '\x1b[35m', // Magenta
      trace: '\x1b[37m'  // White
    };

    const reset = '\x1b[0m';
    const color = colors[level] || '';
    const timestamp = logEntry.timestamp ? `[${logEntry.timestamp}]` : '';
    const metaStr = Object.keys(logEntry).filter(key => !['timestamp', 'level', 'message'].includes(key)).length > 0 
      ? ` ${JSON.stringify(Object.fromEntries(Object.entries(logEntry).filter(([key]) => !['timestamp', 'level', 'message'].includes(key))))}` 
      : '';

    return `${color}${timestamp} [${logEntry.level}] ${logEntry.message}${metaStr}${reset}`;
  }

  /**
   * Write log to file
   * @param {string} message - Log message
   */
  writeToFile(message) {
    if (!this.options.file) return;

    try {
      fs.appendFileSync(this.options.filePath, message + '\n');
      this.rotateLogFile();
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Rotate log file if size exceeds limit
   */
  rotateLogFile() {
    try {
      const stats = fs.statSync(this.options.filePath);
      const fileSizeInMB = stats.size / (1024 * 1024);

      if (fileSizeInMB > this.options.maxSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newFileName = `${this.options.filePath}.${timestamp}`;
        
        fs.renameSync(this.options.filePath, newFileName);
        
        // Keep only maxFiles number of log files
        const logDir = path.dirname(this.options.filePath);
        const logFiles = fs.readdirSync(logDir)
          .filter(file => file.startsWith(path.basename(this.options.filePath)))
          .sort()
          .reverse();

        if (logFiles.length > this.options.maxFiles) {
          logFiles.slice(this.options.maxFiles).forEach(file => {
            fs.unlinkSync(path.join(logDir, file));
          });
        }
      }
    } catch (error) {
      console.error('Log rotation failed:', error);
    }
  }

  /**
   * Log error message
   * @param {string} message - Error message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    if (this.currentLevel >= this.levels.error) {
      const formattedMessage = this.formatMessage('error', message, meta);
      
      if (this.options.console) {
        console.error(formattedMessage);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log warning message
   * @param {string} message - Warning message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    if (this.currentLevel >= this.levels.warn) {
      const formattedMessage = this.formatMessage('warn', message, meta);
      
      if (this.options.console) {
        console.warn(formattedMessage);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log info message
   * @param {string} message - Info message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    if (this.currentLevel >= this.levels.info) {
      const formattedMessage = this.formatMessage('info', message, meta);
      
      if (this.options.console) {
        console.info(formattedMessage);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log debug message
   * @param {string} message - Debug message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    if (this.currentLevel >= this.levels.debug) {
      const formattedMessage = this.formatMessage('debug', message, meta);
      
      if (this.options.console) {
        console.debug(formattedMessage);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log trace message
   * @param {string} message - Trace message
   * @param {Object} meta - Additional metadata
   */
  trace(message, meta = {}) {
    if (this.currentLevel >= this.levels.trace) {
      const formattedMessage = this.formatMessage('trace', message, meta);
      
      if (this.options.console) {
        console.trace(formattedMessage);
      }
      
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * Log with custom level
   * @param {string} level - Custom log level
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  log(level, message, meta = {}) {
    const logMethod = this[level.toLowerCase()];
    if (logMethod) {
      logMethod.call(this, message, meta);
    } else {
      this.info(message, { ...meta, customLevel: level });
    }
  }

  /**
   * Create child logger with additional context
   * @param {Object} context - Additional context
   * @returns {Logger} Child logger instance
   */
  child(context = {}) {
    const childLogger = new Logger(this.options);
    childLogger.context = { ...this.context, ...context };
    
    // Override formatMessage to include context
    const originalFormatMessage = childLogger.formatMessage.bind(childLogger);
    childLogger.formatMessage = (level, message, meta = {}) => {
      return originalFormatMessage(level, message, { ...childLogger.context, ...meta });
    };
    
    return childLogger;
  }

  /**
   * Set log level
   * @param {string} level - New log level
   */
  setLevel(level) {
    if (this.levels[level] !== undefined) {
      this.currentLevel = this.levels[level];
    }
  }

  /**
   * Get current log level
   * @returns {string} Current log level
   */
  getLevel() {
    return Object.keys(this.levels).find(key => this.levels[key] === this.currentLevel);
  }
}

// Example usage:
// const logger = new Logger({
//   level: 'debug',
//   format: 'colored',
//   filePath: './logs/app.log',
//   maxSize: 5,
//   maxFiles: 3
// });
// 
// logger.info('Application started', { version: '1.0.0', port: 3000 });
// logger.warn('Deprecated feature used', { feature: 'oldAPI' });
// logger.error('Database connection failed', { error: 'Connection timeout' });
// logger.debug('Processing request', { userId: 123, action: 'login' });
// 
// // Create child logger with context
// const userLogger = logger.child({ userId: 123, sessionId: 'abc123' });
// userLogger.info('User action performed', { action: 'profile_update' });
// 
// // Set custom log level
// logger.setLevel('warn');
// logger.info('This will not be logged'); // Won't be logged
// logger.warn('This will be logged'); // Will be logged

module.exports = Logger;