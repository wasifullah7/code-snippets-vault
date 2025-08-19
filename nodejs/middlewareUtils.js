/**
 * Advanced middleware utilities for Node.js/Express applications
 * Comprehensive middleware helpers, validators, and utilities
 */

const crypto = require('crypto');

/**
 * Request logging middleware with customizable options
 * @param {Object} options - Logging options
 * @returns {Function} Express middleware
 */
function requestLogger(options = {}) {
  const {
    format = 'combined',
    includeHeaders = false,
    includeBody = false,
    excludePaths = [],
    customFormat
  } = options;

  return (req, res, next) => {
    const startTime = Date.now();
    const originalSend = res.send;

    // Skip logging for excluded paths
    if (excludePaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Override res.send to capture response
    res.send = function(data) {
      const duration = Date.now() - startTime;
      const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      if (includeHeaders) {
        logData.headers = req.headers;
      }

      if (includeBody && req.body) {
        logData.body = req.body;
      }

      if (customFormat) {
        console.log(customFormat(logData));
      } else {
        switch (format) {
          case 'combined':
            console.log(`${logData.method} ${logData.url} ${logData.statusCode} ${logData.duration}`);
            break;
          case 'detailed':
            console.log(JSON.stringify(logData, null, 2));
            break;
          case 'minimal':
            console.log(`${logData.method} ${logData.url} ${logData.statusCode}`);
            break;
          default:
            console.log(`${logData.method} ${logData.url} ${logData.statusCode} ${logData.duration}`);
        }
      }

      originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Request validation middleware
 * @param {Object} schema - Validation schema
 * @param {Object} options - Validation options
 * @returns {Function} Express middleware
 */
function validateRequest(schema, options = {}) {
  const {
    location = 'body', // 'body', 'query', 'params', 'headers'
    abortEarly = false,
    allowUnknown = true,
    stripUnknown = true
  } = options;

  return (req, res, next) => {
    try {
      const data = req[location];
      const { error, value } = schema.validate(data, {
        abortEarly,
        allowUnknown,
        stripUnknown
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          error: 'Validation failed',
          details: errors
        });
      }

      // Replace validated data
      req[location] = value;
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Authentication middleware
 * @param {Object} options - Authentication options
 * @returns {Function} Express middleware
 */
function authenticate(options = {}) {
  const {
    tokenHeader = 'Authorization',
    tokenPrefix = 'Bearer ',
    secret = process.env.JWT_SECRET,
    algorithms = ['HS256'],
    issuer,
    audience,
    clockTolerance = 0
  } = options;

  return (req, res, next) => {
    try {
      const authHeader = req.get(tokenHeader);
      
      if (!authHeader) {
        return res.status(401).json({
          error: 'No authorization header'
        });
      }

      if (!authHeader.startsWith(tokenPrefix)) {
        return res.status(401).json({
          error: 'Invalid token format'
        });
      }

      const token = authHeader.substring(tokenPrefix.length);
      
      // Verify JWT token (you'll need to implement this based on your JWT library)
      // const decoded = jwt.verify(token, secret, { algorithms, issuer, audience, clockTolerance });
      
      // For now, we'll just check if token exists
      if (!token) {
        return res.status(401).json({
          error: 'Invalid token'
        });
      }

      // Add user info to request
      req.user = { token }; // Replace with actual decoded user info
      next();
    } catch (error) {
      return res.status(401).json({
        error: 'Authentication failed',
        details: error.message
      });
    }
  };
}

/**
 * Authorization middleware
 * @param {Array|Function} roles - Required roles or permission function
 * @returns {Function} Express middleware
 */
function authorize(roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }

    if (typeof roles === 'function') {
      // Custom permission function
      if (!roles(req.user, req)) {
        return res.status(403).json({
          error: 'Insufficient permissions'
        });
      }
    } else if (Array.isArray(roles)) {
      // Role-based authorization
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions'
        });
      }
    }

    next();
  };
}

/**
 * CORS middleware with advanced options
 * @param {Object} options - CORS options
 * @returns {Function} Express middleware
 */
function cors(options = {}) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400,
    preflightContinue = false
  } = options;

  return (req, res, next) => {
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Methods', methods.join(', '));
      res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      res.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));
      res.header('Access-Control-Allow-Credentials', credentials);
      res.header('Access-Control-Max-Age', maxAge);

      if (preflightContinue) {
        return next();
      } else {
        return res.status(200).end();
      }
    }

    // Handle actual requests
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', credentials);
    res.header('Access-Control-Expose-Headers', exposedHeaders.join(', '));

    next();
  };
}

/**
 * Rate limiting middleware
 * @param {Object} options - Rate limiting options
 * @returns {Function} Express middleware
 */
function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests from this IP',
    statusCode = 429,
    headers = true,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  const store = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!store.has(key)) {
      store.set(key, []);
    }

    const requests = store.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    store.set(key, validRequests);

    if (validRequests.length >= max) {
      if (headers) {
        res.set('X-RateLimit-Limit', max);
        res.set('X-RateLimit-Remaining', 0);
        res.set('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
      }

      return res.status(statusCode).json({
        error: message
      });
    }

    // Add current request
    validRequests.push(now);
    store.set(key, validRequests);

    if (headers) {
      res.set('X-RateLimit-Limit', max);
      res.set('X-RateLimit-Remaining', max - validRequests.length);
      res.set('X-RateLimit-Reset', new Date(now + windowMs).toISOString());
    }

    next();
  };
}

/**
 * Request sanitization middleware
 * @param {Object} options - Sanitization options
 * @returns {Function} Express middleware
 */
function sanitizeRequest(options = {}) {
  const {
    body = true,
    query = true,
    params = true,
    headers = false,
    removeFields = ['password', 'token', 'secret'],
    allowedTags = [],
    allowedAttributes = {}
  } = options;

  const sanitizeData = (data) => {
    if (!data || typeof data !== 'object') return data;

    const sanitized = Array.isArray(data) ? [] : {};

    for (const [key, value] of Object.entries(data)) {
      // Remove sensitive fields
      if (removeFields.includes(key.toLowerCase())) {
        continue;
      }

      if (typeof value === 'string') {
        // Basic XSS protection
        sanitized[key] = value
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  };

  return (req, res, next) => {
    if (body && req.body) {
      req.body = sanitizeData(req.body);
    }

    if (query && req.query) {
      req.query = sanitizeData(req.query);
    }

    if (params && req.params) {
      req.params = sanitizeData(req.params);
    }

    if (headers && req.headers) {
      req.headers = sanitizeData(req.headers);
    }

    next();
  };
}

/**
 * Request compression middleware
 * @param {Object} options - Compression options
 * @returns {Function} Express middleware
 */
function compress(options = {}) {
  const {
    threshold = 1024, // Only compress responses larger than 1KB
    level = 6, // Compression level (0-9)
    filter = (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return /json|text|javascript|css/.test(res.getHeader('Content-Type'));
    }
  } = options;

  return (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    res.send = function(data) {
      const contentLength = Buffer.byteLength(data);
      
      if (contentLength > threshold && filter(req, res)) {
        // Add compression headers
        res.set('Content-Encoding', 'gzip');
        res.set('Vary', 'Accept-Encoding');
        
        // Compress data (you'll need to implement actual compression)
        // const compressed = zlib.gzipSync(data, { level });
        // originalSend.call(this, compressed);
      }
      
      originalSend.call(this, data);
    };

    res.json = function(data) {
      const jsonString = JSON.stringify(data);
      const contentLength = Buffer.byteLength(jsonString);
      
      if (contentLength > threshold && filter(req, res)) {
        res.set('Content-Encoding', 'gzip');
        res.set('Vary', 'Accept-Encoding');
      }
      
      originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Request caching middleware
 * @param {Object} options - Caching options
 * @returns {Function} Express middleware
 */
function cache(options = {}) {
  const {
    duration = 300, // Cache duration in seconds
    key = (req) => `${req.method}:${req.originalUrl}`,
    condition = (req, res) => req.method === 'GET' && res.statusCode === 200,
    store = new Map()
  } = options;

  return (req, res, next) => {
    const cacheKey = typeof key === 'function' ? key(req) : key;
    
    if (req.method === 'GET' && store.has(cacheKey)) {
      const cached = store.get(cacheKey);
      
      if (Date.now() - cached.timestamp < duration * 1000) {
        res.set('X-Cache', 'HIT');
        res.set('Cache-Control', `public, max-age=${duration}`);
        return res.json(cached.data);
      } else {
        store.delete(cacheKey);
      }
    }

    const originalJson = res.json;
    res.json = function(data) {
      if (condition(req, res)) {
        store.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
        res.set('X-Cache', 'MISS');
      }
      
      originalJson.call(this, data);
    };

    next();
  };
}

/**
 * Error handling middleware
 * @param {Object} options - Error handling options
 * @returns {Function} Express middleware
 */
function errorHandler(options = {}) {
  const {
    logErrors = true,
    includeStack = process.env.NODE_ENV !== 'production',
    customHandler
  } = options;

  return (err, req, res, next) => {
    if (logErrors) {
      console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }

    if (customHandler) {
      return customHandler(err, req, res, next);
    }

    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
      error: message,
      ...(includeStack && { stack: err.stack })
    });
  };
}

/**
 * Security headers middleware
 * @param {Object} options - Security options
 * @returns {Function} Express middleware
 */
function securityHeaders(options = {}) {
  const {
    hsts = true,
    xssProtection = true,
    noSniff = true,
    frameDeny = true,
    contentSecurityPolicy = true
  } = options;

  return (req, res, next) => {
    if (hsts) {
      res.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    if (xssProtection) {
      res.set('X-XSS-Protection', '1; mode=block');
    }

    if (noSniff) {
      res.set('X-Content-Type-Options', 'nosniff');
    }

    if (frameDeny) {
      res.set('X-Frame-Options', 'DENY');
    }

    if (contentSecurityPolicy) {
      res.set('Content-Security-Policy', "default-src 'self'");
    }

    res.set('X-Powered-By', null);

    next();
  };
}

module.exports = {
  requestLogger,
  validateRequest,
  authenticate,
  authorize,
  cors,
  rateLimit,
  sanitizeRequest,
  compress,
  cache,
  errorHandler,
  securityHeaders
};
