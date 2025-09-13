/**
 * Simple in-memory cache utility for Node.js
 */

class MemoryCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 1000;
    this.ttl = options.ttl || 3600000; // 1 hour in milliseconds
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set cache entry
   * @param {string} key - Cache key
   * @param {*} value - Cache value
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = null) {
    // Remove existing timer
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Check cache size limit
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.delete(firstKey);
    }

    // Set cache entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.ttl
    });

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttl || this.ttl);

    this.timers.set(key, timer);
  }

  /**
   * Get cache entry
   * @param {string} key - Cache key
   * @returns {*} Cache value or null
   */
  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.value;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} Exists and valid
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Delete cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  /**
   * Clear all cache entries
   */
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers.clear();
    
    // Clear cache
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    
    this.cache.forEach(entry => {
      if (now - entry.timestamp > entry.ttl) {
        expired++;
      }
    });

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      hitRate: this.hits / (this.hits + this.misses) || 0
    };
  }

  /**
   * Clean expired entries
   */
  cleanExpired() {
    const now = Date.now();
    const expiredKeys = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
  }

  /**
   * Get all keys
   * @returns {Array} Array of keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   * @returns {Array} Array of values
   */
  values() {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  /**
   * Get cache size
   * @returns {number} Number of entries
   */
  size() {
    return this.cache.size;
  }
}

/**
 * LRU Cache implementation
 */
class LRUCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || 3600000;
    this.cache = new Map();
  }

  set(key, value, ttl = null) {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.ttl
    });
  }

  get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  size() {
    return this.cache.size;
  }
}

/**
 * Cache middleware factory
 * @param {Object} cache - Cache instance
 * @param {Function} keyGenerator - Key generation function
 * @returns {Function} Express middleware
 */
function createCacheMiddleware(cache, keyGenerator = (req) => req.originalUrl) {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const cached = cache.get(key);

    if (cached) {
      return res.json(cached);
    }

    // Store original res.json
    const originalJson = res.json;

    // Override res.json to cache response
    res.json = function(data) {
      cache.set(key, data);
      return originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Cache decorator for functions
 * @param {Object} cache - Cache instance
 * @param {Function} keyGenerator - Key generation function
 * @returns {Function} Decorated function
 */
function cacheDecorator(cache, keyGenerator = (...args) => JSON.stringify(args)) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = function(...args) {
      const key = keyGenerator(...args);
      const cached = cache.get(key);

      if (cached) {
        return cached;
      }

      const result = originalMethod.apply(this, args);
      
      // Handle promises
      if (result instanceof Promise) {
        return result.then(value => {
          cache.set(key, value);
          return value;
        });
      }

      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}

module.exports = {
  MemoryCache,
  LRUCache,
  createCacheMiddleware,
  cacheDecorator
};
