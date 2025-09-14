/**
 * Security utilities for Node.js applications
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @param {string} encoding - Encoding format (default: 'hex')
 * @returns {string} Random token
 */
const generateSecureToken = (length = 32, encoding = 'hex') => {
  return crypto.randomBytes(length).toString(encoding);
};

/**
 * Generate secure random string
 * @param {number} length - String length
 * @param {string} charset - Character set (default: alphanumeric)
 * @returns {string} Random string
 */
const generateSecureString = (length = 16, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return result;
};

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @param {number} rounds - Salt rounds (default: 12)
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password, rounds = 12) => {
  return await bcrypt.hash(password, rounds);
};

/**
 * Verify password against hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Verification result
 */
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate JWT token
 * @param {Object} payload - Token payload
 * @param {string} secret - JWT secret
 * @param {Object} options - Token options
 * @returns {string} JWT token
 */
const generateJWT = (payload, secret, options = {}) => {
  const jwt = require('jsonwebtoken');
  
  const defaultOptions = {
    expiresIn: '1h',
    issuer: 'your-app',
    audience: 'your-app-users',
    ...options
  };
  
  return jwt.sign(payload, secret, defaultOptions);
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @param {string} secret - JWT secret
 * @param {Object} options - Verification options
 * @returns {Object} Decoded payload
 */
const verifyJWT = (token, secret, options = {}) => {
  const jwt = require('jsonwebtoken');
  
  const defaultOptions = {
    issuer: 'your-app',
    audience: 'your-app-users',
    ...options
  };
  
  return jwt.verify(token, secret, defaultOptions);
};

/**
 * Encrypt data using AES-256-GCM
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key (32 bytes)
 * @returns {Object} Encrypted data with IV and auth tag
 */
const encryptData = (data, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-gcm', key);
  cipher.setAAD(Buffer.from('additional-data'));
  
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
};

/**
 * Decrypt data using AES-256-GCM
 * @param {Object} encryptedData - Encrypted data object
 * @param {string} key - Decryption key (32 bytes)
 * @returns {string} Decrypted data
 */
const decryptData = (encryptedData, key) => {
  const decipher = crypto.createDecipher('aes-256-gcm', key);
  decipher.setAAD(Buffer.from('additional-data'));
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @param {string} encoding - Output encoding (default: 'hex')
 * @returns {string} Hash
 */
const hashData = (data, encoding = 'hex') => {
  return crypto.createHash('sha256').update(data).digest(encoding);
};

/**
 * Generate HMAC signature
 * @param {string} data - Data to sign
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default: 'sha256')
 * @returns {string} HMAC signature
 */
const generateHMAC = (data, secret, algorithm = 'sha256') => {
  return crypto.createHmac(algorithm, secret).update(data).digest('hex');
};

/**
 * Verify HMAC signature
 * @param {string} data - Original data
 * @param {string} signature - HMAC signature
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (default: 'sha256')
 * @returns {boolean} Verification result
 */
const verifyHMAC = (data, signature, secret, algorithm = 'sha256') => {
  const expectedSignature = generateHMAC(data, secret, algorithm);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Sanitize input to prevent XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validatePasswordStrength = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true,
    forbiddenWords = []
  } = options;
  
  const errors = [];
  const warnings = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for forbidden words
  forbiddenWords.forEach(word => {
    if (password.toLowerCase().includes(word.toLowerCase())) {
      warnings.push(`Password contains forbidden word: ${word}`);
    }
  });
  
  // Check for common patterns
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Password contains repeated characters');
  }
  
  if (/123|abc|qwe/i.test(password)) {
    warnings.push('Password contains common sequences');
  }
  
  const score = calculatePasswordScore(password);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    score,
    strength: getPasswordStrength(score)
  };
};

/**
 * Calculate password strength score
 * @param {string} password - Password to score
 * @returns {number} Score (0-100)
 */
const calculatePasswordScore = (password) => {
  let score = 0;
  
  // Length bonus
  score += Math.min(password.length * 2, 25);
  
  // Character variety bonus
  if (/[a-z]/.test(password)) score += 5;
  if (/[A-Z]/.test(password)) score += 5;
  if (/\d/.test(password)) score += 5;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 10;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 10;
  if (/123|abc|qwe/i.test(password)) score -= 15;
  
  return Math.max(0, Math.min(100, score));
};

/**
 * Get password strength description
 * @param {number} score - Password score
 * @returns {string} Strength description
 */
const getPasswordStrength = (score) => {
  if (score < 20) return 'Very Weak';
  if (score < 40) return 'Weak';
  if (score < 60) return 'Fair';
  if (score < 80) return 'Good';
  return 'Strong';
};

/**
 * Rate limiting helper
 * @param {Object} options - Rate limiting options
 * @returns {Function} Rate limiting middleware
 */
const createRateLimiter = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    maxRequests = 100,
    keyGenerator = (req) => req.ip,
    skipSuccessfulRequests = false
  } = options;
  
  const requests = new Map();
  
  return (req, res, next) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    // Clean up old entries
    for (const [k, v] of requests.entries()) {
      if (now - v.firstRequest > windowMs) {
        requests.delete(k);
      }
    }
    
    const userRequests = requests.get(key) || { count: 0, firstRequest: now };
    
    if (userRequests.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((userRequests.firstRequest + windowMs - now) / 1000)
      });
    }
    
    userRequests.count++;
    requests.set(key, userRequests);
    
    // Track response status if needed
    if (skipSuccessfulRequests) {
      const originalSend = res.send;
      res.send = function(data) {
        if (res.statusCode < 400) {
          userRequests.count--;
        }
        return originalSend.call(this, data);
      };
    }
    
    next();
  };
};

/**
 * CORS security helper
 * @param {Object} options - CORS options
 * @returns {Function} CORS middleware
 */
const createSecureCORS = (options = {}) => {
  const {
    origin = true,
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    maxAge = 86400
  } = options;
  
  return (req, res, next) => {
    // Set CORS headers
    if (origin === true) {
      res.header('Access-Control-Allow-Origin', req.headers.origin);
    } else if (typeof origin === 'function') {
      const allowedOrigin = origin(req);
      if (allowedOrigin) {
        res.header('Access-Control-Allow-Origin', allowedOrigin);
      }
    } else if (Array.isArray(origin)) {
      const requestOrigin = req.headers.origin;
      if (origin.includes(requestOrigin)) {
        res.header('Access-Control-Allow-Origin', requestOrigin);
      }
    } else {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Credentials', credentials.toString());
    res.header('Access-Control-Allow-Methods', methods.join(', '));
    res.header('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    res.header('Access-Control-Max-Age', maxAge.toString());
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    
    next();
  };
};

module.exports = {
  generateSecureToken,
  generateSecureString,
  hashPassword,
  verifyPassword,
  generateJWT,
  verifyJWT,
  encryptData,
  decryptData,
  hashData,
  generateHMAC,
  verifyHMAC,
  sanitizeInput,
  validatePasswordStrength,
  calculatePasswordScore,
  getPasswordStrength,
  createRateLimiter,
  createSecureCORS
};
