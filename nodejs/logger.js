/**
 * Enhanced logging utility with multiple log levels and formatting options
 * @param {Object} options - Logger configuration options
 * @param {string} [options.level='info'] - Log level (error, warn, info, debug)
 * @param {boolean} [options.timestamp=true] - Include timestamps
 * @param {string} [options.timestampFormat='ISO'] - Timestamp format ('ISO', 'local', 'custom')
 * @param {string} [options.customFormat] - Custom timestamp format string
 * @returns {Object} Logger object with log methods
 */
function createLogger(options = {}) {
  const {
    level = 'info',
    timestamp = true,
    timestampFormat = 'ISO',
    customFormat = 'YYYY-MM-DD HH:mm:ss'
  } = options;

  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3
  };

  let currentLevel = levels[level] || levels.info;

  const getTimestamp = () => {
    if (!timestamp) return '';
    
    const now = new Date();
    
    switch (timestampFormat) {
      case 'ISO':
        return `[${now.toISOString()}]`;
      case 'local':
        return `[${now.toLocaleString()}]`;
      case 'custom':
        // Simple custom format implementation
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        return `[${year}-${month}-${day} ${hours}:${minutes}:${seconds}]`;
      default:
        return `[${now.toISOString()}]`;
    }
  };

  const log = (level, message, data = null) => {
    if (levels[level] <= currentLevel) {
      const timestamp = getTimestamp();
      const prefix = timestamp ? `${timestamp} [${level.toUpperCase()}]` : `[${level.toUpperCase()}]`;
      
      if (data) {
        console[level](`${prefix} ${message}`, data);
      } else {
        console[level](`${prefix} ${message}`);
      }
    }
  };

  return {
    error: (message, data) => log('error', message, data),
    warn: (message, data) => log('warn', message, data),
    info: (message, data) => log('info', message, data),
    debug: (message, data) => log('debug', message, data),
    
    // Utility methods
    setLevel: (newLevel) => {
      if (levels[newLevel] !== undefined) {
        currentLevel = levels[newLevel];
      }
    },
    
    // Performance logging
    time: (label) => console.time(label),
    timeEnd: (label) => console.timeEnd(label),
    
    // Group logging
    group: (label) => console.group(label),
    groupEnd: () => console.groupEnd(),
    
    // Table logging
    table: (data) => console.table(data),
    
    // Structured logging
    log: (level, message, metadata = {}) => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        ...metadata
      };
      console.log(JSON.stringify(logEntry));
    },
    
    // Success logging
    success: (message, data) => log('info', `✅ ${message}`, data),
    
    // Failure logging
    failure: (message, data) => log('error', `❌ ${message}`, data)
  };
}

// Example usage:
// const logger = createLogger({ 
//   level: 'debug', 
//   timestamp: true, 
//   timestampFormat: 'local' 
// });
// 
// logger.info('Server started', { port: 3000 });
// logger.error('Database connection failed', { error: 'Connection timeout' });

module.exports = createLogger;