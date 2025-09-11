/**
 * Simple in-memory rate limiter for Node.js
 */

class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
    this.requests = new Map();
    this.cleanupInterval = null;
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Check if request is allowed
   * @param {string} key - Unique identifier (IP, user ID, etc.)
   * @returns {Object} { allowed: boolean, remaining: number, resetTime: number }
   */
  isAllowed(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Get or create request history for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }
    
    const keyRequests = this.requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = keyRequests.filter(time => time > windowStart);
    
    // Check if under limit
    const allowed = validRequests.length < this.maxRequests;
    
    if (allowed) {
      validRequests.push(now);
      this.requests.set(key, validRequests);
    }
    
    const remaining = Math.max(0, this.maxRequests - validRequests.length);
    const resetTime = Math.min(...validRequests) + this.windowMs;
    
    return {
      allowed,
      remaining,
      resetTime,
      total: this.maxRequests
    };
  }

  /**
   * Get current status for a key
   * @param {string} key - Unique identifier
   * @returns {Object} Current status
   */
  getStatus(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(key)) {
      return {
        remaining: this.maxRequests,
        resetTime: now + this.windowMs,
        total: this.maxRequests
      };
    }
    
    const keyRequests = this.requests.get(key);
    const validRequests = keyRequests.filter(time => time > windowStart);
    
    return {
      remaining: Math.max(0, this.maxRequests - validRequests.length),
      resetTime: validRequests.length > 0 ? Math.min(...validRequests) + this.windowMs : now + this.windowMs,
      total: this.maxRequests
    };
  }

  /**
   * Reset requests for a specific key
   * @param {string} key - Unique identifier
   */
  reset(key) {
    this.requests.delete(key);
  }

  /**
   * Reset all requests
   */
  resetAll() {
    this.requests.clear();
  }

  /**
   * Start cleanup interval to remove old entries
   */
  startCleanup() {
    if (this.cleanupInterval) return;
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      const windowStart = now - this.windowMs;
      
      for (const [key, requests] of this.requests.entries()) {
        const validRequests = requests.filter(time => time > windowStart);
        if (validRequests.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, validRequests);
        }
      }
    }, this.windowMs);
  }

  /**
   * Stop cleanup interval
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get total number of tracked keys
   * @returns {number} Number of keys
   */
  getKeyCount() {
    return this.requests.size;
  }
}

/**
 * Express middleware for rate limiting
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
function createRateLimitMiddleware(options = {}) {
  const limiter = new RateLimiter(options);
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress || 'unknown';
    const result = limiter.isAllowed(key);
    
    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': result.total,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
      });
    }
    
    next();
  };
}

module.exports = {
  RateLimiter,
  createRateLimitMiddleware
};