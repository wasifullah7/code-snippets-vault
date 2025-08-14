/**
 * Advanced rate limiting middleware for Node.js applications
 * @param {Object} options - Configuration options
 * @param {number} options.windowMs - Time window in milliseconds (default: 900000 - 15 minutes)
 * @param {number} options.max - Maximum requests per window (default: 100)
 * @param {string} options.algorithm - Rate limiting algorithm (default: 'sliding-window')
 * @param {Object} options.store - Storage implementation (default: MemoryStore)
 * @param {boolean} options.skipSuccessfulRequests - Skip successful requests (default: false)
 * @param {boolean} options.skipFailedRequests - Skip failed requests (default: false)
 * @param {Function} options.keyGenerator - Custom key generator function
 * @param {Function} options.handler - Custom error handler
 * @param {Array} options.whitelist - Array of IPs to whitelist
 * @param {Array} options.blacklist - Array of IPs to blacklist
 * @returns {Function} Express middleware function
 */
const crypto = require('crypto');

class RateLimiter {
  constructor(options = {}) {
    this.options = {
      windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes
      max: options.max || 100,
      algorithm: options.algorithm || 'sliding-window',
      store: options.store || new MemoryStore(),
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      handler: options.handler || this.defaultHandler,
      whitelist: options.whitelist || [],
      blacklist: options.blacklist || [],
      ...options
    };

    this.store = this.options.store;
    this.algorithm = this.options.algorithm;
  }

  /**
   * Default key generator
   * @param {Object} req - Express request object
   * @returns {string} Generated key
   */
  defaultKeyGenerator(req) {
    return req.ip || req.connection.remoteAddress || 'unknown';
  }

  /**
   * Default error handler
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} options - Rate limit options
   */
  defaultHandler(req, res, options) {
    res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${Math.ceil(options.windowMs / 1000)} seconds.`,
      retryAfter: Math.ceil(options.windowMs / 1000)
    });
  }

  /**
   * Check if IP is whitelisted
   * @param {string} ip - IP address
   * @returns {boolean} True if whitelisted
   */
  isWhitelisted(ip) {
    return this.options.whitelist.includes(ip);
  }

  /**
   * Check if IP is blacklisted
   * @param {string} ip - IP address
   * @returns {boolean} True if blacklisted
   */
  isBlacklisted(ip) {
    return this.options.blacklist.includes(ip);
  }

  /**
   * Sliding window rate limiting algorithm
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Time window
   * @param {number} max - Maximum requests
   * @returns {Object} Rate limit result
   */
  async slidingWindow(key, windowMs, max) {
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get all requests in the current window
    const requests = await this.store.get(key) || [];
    const validRequests = requests.filter(timestamp => timestamp > windowStart);

    // Check if limit exceeded
    if (validRequests.length >= max) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + windowMs;
      
      return {
        limit: max,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        exceeded: true
      };
    }

    // Add current request
    validRequests.push(now);
    await this.store.set(key, validRequests, windowMs);

    return {
      limit: max,
      remaining: max - validRequests.length,
      reset: now + windowMs,
      retryAfter: 0,
      exceeded: false
    };
  }

  /**
   * Fixed window rate limiting algorithm
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Time window
   * @param {number} max - Maximum requests
   * @returns {Object} Rate limit result
   */
  async fixedWindow(key, windowMs, max) {
    const now = Date.now();
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const windowKey = `${key}:${windowStart}`;

    const current = await this.store.get(windowKey) || 0;

    if (current >= max) {
      const resetTime = windowStart + windowMs;
      
      return {
        limit: max,
        remaining: 0,
        reset: resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000),
        exceeded: true
      };
    }

    await this.store.set(windowKey, current + 1, windowMs);

    return {
      limit: max,
      remaining: max - current - 1,
      reset: windowStart + windowMs,
      retryAfter: 0,
      exceeded: false
    };
  }

  /**
   * Token bucket rate limiting algorithm
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Time window
   * @param {number} max - Maximum requests
   * @returns {Object} Rate limit result
   */
  async tokenBucket(key, windowMs, max) {
    const now = Date.now();
    const bucketKey = `${key}:bucket`;
    
    const bucket = await this.store.get(bucketKey) || {
      tokens: max,
      lastRefill: now
    };

    const tokensPerMs = max / windowMs;
    const timePassed = now - bucket.lastRefill;
    const tokensToAdd = timePassed * tokensPerMs;
    
    bucket.tokens = Math.min(max, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      const timeToNextToken = (1 - bucket.tokens) / tokensPerMs;
      
      return {
        limit: max,
        remaining: 0,
        reset: now + timeToNextToken,
        retryAfter: Math.ceil(timeToNextToken / 1000),
        exceeded: true
      };
    }

    bucket.tokens -= 1;
    await this.store.set(bucketKey, bucket, windowMs);

    return {
      limit: max,
      remaining: Math.floor(bucket.tokens),
      reset: now + windowMs,
      retryAfter: 0,
      exceeded: false
    };
  }

  /**
   * Leaky bucket rate limiting algorithm
   * @param {string} key - Rate limit key
   * @param {number} windowMs - Time window
   * @param {number} max - Maximum requests
   * @returns {Object} Rate limit result
   */
  async leakyBucket(key, windowMs, max) {
    const now = Date.now();
    const bucketKey = `${key}:leaky`;
    
    const bucket = await this.store.get(bucketKey) || {
      queue: [],
      lastLeak: now
    };

    const leakRate = max / windowMs;
    const timePassed = now - bucket.lastLeak;
    const leaked = timePassed * leakRate;

    // Remove leaked items from queue
    bucket.queue = bucket.queue.slice(Math.floor(leaked));
    bucket.lastLeak = now;

    if (bucket.queue.length >= max) {
      const oldestRequest = bucket.queue[0];
      const timeToNextLeak = (1 / leakRate) * 1000;
      
      return {
        limit: max,
        remaining: 0,
        reset: oldestRequest + timeToNextLeak,
        retryAfter: Math.ceil(timeToNextLeak / 1000),
        exceeded: true
      };
    }

    bucket.queue.push(now);
    await this.store.set(bucketKey, bucket, windowMs);

    return {
      limit: max,
      remaining: max - bucket.queue.length,
      reset: now + windowMs,
      retryAfter: 0,
      exceeded: false
    };
  }

  /**
   * Main rate limiting middleware
   * @returns {Function} Express middleware
   */
  middleware() {
    return async (req, res, next) => {
      try {
        const key = this.options.keyGenerator(req);
        
        // Check whitelist/blacklist
        if (this.isWhitelisted(key)) {
          return next();
        }
        
        if (this.isBlacklisted(key)) {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied'
          });
        }

        // Apply rate limiting based on algorithm
        let result;
        switch (this.algorithm) {
          case 'sliding-window':
            result = await this.slidingWindow(key, this.options.windowMs, this.options.max);
            break;
          case 'fixed-window':
            result = await this.fixedWindow(key, this.options.windowMs, this.options.max);
            break;
          case 'token-bucket':
            result = await this.tokenBucket(key, this.options.windowMs, this.options.max);
            break;
          case 'leaky-bucket':
            result = await this.leakyBucket(key, this.options.windowMs, this.options.max);
            break;
          default:
            result = await this.slidingWindow(key, this.options.windowMs, this.options.max);
        }

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': result.limit,
          'X-RateLimit-Remaining': result.remaining,
          'X-RateLimit-Reset': result.reset,
          'Retry-After': result.retryAfter
        });

        if (result.exceeded) {
          return this.options.handler(req, res, {
            windowMs: this.options.windowMs,
            max: this.options.max,
            algorithm: this.algorithm
          });
        }

        // Store rate limit info in request
        req.rateLimit = result;

        next();
      } catch (error) {
        console.error('Rate limiting error:', error);
        next();
      }
    };
  }

  /**
   * Reset rate limit for a specific key
   * @param {string} key - Rate limit key
   */
  async resetKey(key) {
    await this.store.delete(key);
  }

  /**
   * Get current rate limit status for a key
   * @param {string} key - Rate limit key
   * @returns {Object} Rate limit status
   */
  async getKeyStatus(key) {
    const data = await this.store.get(key);
    return {
      key,
      data,
      algorithm: this.algorithm,
      windowMs: this.options.windowMs,
      max: this.options.max
    };
  }
}

/**
 * In-memory storage implementation
 */
class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key, value, ttl) {
    this.store.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  async delete(key) {
    this.store.delete(key);
  }

  async clear() {
    this.store.clear();
  }
}

/**
 * Redis storage implementation
 */
class RedisStore {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl) {
    await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value));
  }

  async delete(key) {
    await this.redis.del(key);
  }

  async clear() {
    // Note: This clears all keys - use with caution
    await this.redis.flushdb();
  }
}

// Example usage:
// const rateLimiter = new RateLimiter({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   algorithm: 'sliding-window',
//   handler: (req, res, options) => {
//     res.status(429).json({
//       error: 'Rate limit exceeded',
//       retryAfter: Math.ceil(options.windowMs / 1000)
//     });
//   }
// });
// 
// // Use in Express app
// app.use(rateLimiter.middleware());
// 
// // With Redis storage
// const redis = require('redis');
// const redisClient = redis.createClient();
// const redisStore = new RedisStore(redisClient);
// 
// const rateLimiter = new RateLimiter({
//   store: redisStore,
//   windowMs: 15 * 60 * 1000,
//   max: 100
// });

module.exports = {
  RateLimiter,
  MemoryStore,
  RedisStore
};
