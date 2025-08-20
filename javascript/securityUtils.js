/**
 * Advanced security utilities for modern JavaScript
 * Comprehensive security operations, validation, and protection utilities
 */

/**
 * Password strength analyzer
 * Analyzes password strength and provides detailed feedback
 */
class PasswordStrengthAnalyzer {
  constructor(options = {}) {
    this.minLength = options.minLength || 8;
    this.requireUppercase = options.requireUppercase !== false;
    this.requireLowercase = options.requireLowercase !== false;
    this.requireNumbers = options.requireNumbers !== false;
    this.requireSpecialChars = options.requireSpecialChars !== false;
    this.maxLength = options.maxLength || 128;
  }

  /**
   * Analyze password strength
   * @param {string} password - Password to analyze
   * @returns {Object} Strength analysis result
   */
  analyze(password) {
    if (!password) {
      return {
        score: 0,
        strength: 'very-weak',
        feedback: ['Password is required'],
        suggestions: ['Enter a password']
      };
    }

    const analysis = {
      length: password.length,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
      hasRepeatingChars: /(.)\1{2,}/.test(password),
      hasSequentialChars: /(abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|012)/i.test(password),
      hasCommonPatterns: /(password|123456|qwerty|admin|letmein|welcome|monkey|dragon|master|football)/i.test(password)
    };

    // Calculate score
    let score = 0;
    const feedback = [];
    const suggestions = [];

    // Length scoring
    if (analysis.length >= this.minLength) {
      score += Math.min(analysis.length - this.minLength + 1, 10);
    } else {
      feedback.push(`Password must be at least ${this.minLength} characters long`);
      suggestions.push(`Add ${this.minLength - analysis.length} more characters`);
    }

    // Character type scoring
    if (analysis.hasUppercase) score += 2;
    if (analysis.hasLowercase) score += 2;
    if (analysis.hasNumbers) score += 2;
    if (analysis.hasSpecialChars) score += 3;

    // Penalties
    if (analysis.hasRepeatingChars) {
      score -= 2;
      feedback.push('Avoid repeating characters');
      suggestions.push('Use varied characters');
    }

    if (analysis.hasSequentialChars) {
      score -= 3;
      feedback.push('Avoid sequential characters');
      suggestions.push('Use random character combinations');
    }

    if (analysis.hasCommonPatterns) {
      score -= 5;
      feedback.push('Avoid common password patterns');
      suggestions.push('Use unique, random combinations');
    }

    // Length penalties
    if (analysis.length > this.maxLength) {
      score -= 2;
      feedback.push(`Password should not exceed ${this.maxLength} characters`);
    }

    // Determine strength level
    let strength = 'very-weak';
    if (score >= 15) strength = 'very-strong';
    else if (score >= 12) strength = 'strong';
    else if (score >= 8) strength = 'moderate';
    else if (score >= 4) strength = 'weak';

    // Additional suggestions based on missing requirements
    if (this.requireUppercase && !analysis.hasUppercase) {
      suggestions.push('Add uppercase letters');
    }
    if (this.requireLowercase && !analysis.hasLowercase) {
      suggestions.push('Add lowercase letters');
    }
    if (this.requireNumbers && !analysis.hasNumbers) {
      suggestions.push('Add numbers');
    }
    if (this.requireSpecialChars && !analysis.hasSpecialChars) {
      suggestions.push('Add special characters');
    }

    return {
      score: Math.max(0, Math.min(score, 20)),
      strength,
      feedback: feedback.length > 0 ? feedback : ['Password meets basic requirements'],
      suggestions,
      analysis
    };
  }

  /**
   * Generate strong password
   * @param {Object} options - Password generation options
   * @returns {string} Generated password
   */
  generatePassword(options = {}) {
    const length = options.length || this.minLength;
    const includeUppercase = options.includeUppercase !== false;
    const includeLowercase = options.includeLowercase !== false;
    const includeNumbers = options.includeNumbers !== false;
    const includeSpecialChars = options.includeSpecialChars !== false;

    const chars = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let availableChars = '';
    let requiredChars = '';

    if (includeUppercase) {
      availableChars += chars.uppercase;
      requiredChars += chars.uppercase[Math.floor(Math.random() * chars.uppercase.length)];
    }
    if (includeLowercase) {
      availableChars += chars.lowercase;
      requiredChars += chars.lowercase[Math.floor(Math.random() * chars.lowercase.length)];
    }
    if (includeNumbers) {
      availableChars += chars.numbers;
      requiredChars += chars.numbers[Math.floor(Math.random() * chars.numbers.length)];
    }
    if (includeSpecialChars) {
      availableChars += chars.special;
      requiredChars += chars.special[Math.floor(Math.random() * chars.special.length)];
    }

    // Generate random characters
    let password = '';
    for (let i = 0; i < length - requiredChars.length; i++) {
      password += availableChars[Math.floor(Math.random() * availableChars.length)];
    }

    // Add required characters
    password += requiredChars;

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}

/**
 * Input sanitizer for XSS prevention
 */
class InputSanitizer {
  constructor(options = {}) {
    this.allowedTags = options.allowedTags || [];
    this.allowedAttributes = options.allowedAttributes || [];
    this.stripScripts = options.stripScripts !== false;
    this.stripStyles = options.stripStyles !== false;
  }

  /**
   * Sanitize HTML content
   * @param {string} html - HTML content to sanitize
   * @returns {string} Sanitized HTML
   */
  sanitizeHTML(html) {
    if (!html || typeof html !== 'string') {
      return '';
    }

    let sanitized = html;

    // Remove script tags and their content
    if (this.stripScripts) {
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }

    // Remove style tags and their content
    if (this.stripStyles) {
      sanitized = sanitized.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
    }

    // Remove dangerous attributes
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s*javascript\s*:/gi, '');
    sanitized = sanitized.replace(/\s*data\s*:/gi, '');

    // Remove iframe tags
    sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');

    // Remove object and embed tags
    sanitized = sanitized.replace(/<(object|embed)\b[^<]*(?:(?!<\/(object|embed)>)<[^<]*)*<\/(object|embed)>/gi, '');

    return sanitized;
  }

  /**
   * Sanitize plain text
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/data:/gi, '') // Remove data protocol
      .trim();
  }

  /**
   * Validate and sanitize URL
   * @param {string} url - URL to validate and sanitize
   * @returns {string|null} Sanitized URL or null if invalid
   */
  sanitizeURL(url) {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = url.toLowerCase();
    
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        return null;
      }
    }

    // Ensure URL has a safe protocol
    if (!url.match(/^https?:\/\//)) {
      return null;
    }

    return url.trim();
  }

  /**
   * Sanitize email address
   * @param {string} email - Email to sanitize
   * @returns {string|null} Sanitized email or null if invalid
   */
  sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return null;
    }

    const sanitized = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(sanitized) ? sanitized : null;
  }
}

/**
 * CSRF token generator and validator
 */
class CSRFProtection {
  constructor(options = {}) {
    this.secret = options.secret || this.generateSecret();
    this.tokenLength = options.tokenLength || 32;
    this.expiryTime = options.expiryTime || 24 * 60 * 60 * 1000; // 24 hours
    this.tokens = new Map();
  }

  /**
   * Generate a secret key
   * @returns {string} Generated secret
   */
  generateSecret() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Generate CSRF token
   * @param {string} sessionId - Session identifier
   * @returns {string} Generated token
   */
  generateToken(sessionId) {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(this.tokenLength)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    this.tokens.set(token, {
      sessionId,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.expiryTime
    });

    return token;
  }

  /**
   * Validate CSRF token
   * @param {string} token - Token to validate
   * @param {string} sessionId - Session identifier
   * @returns {boolean} Whether token is valid
   */
  validateToken(token, sessionId) {
    const tokenData = this.tokens.get(token);
    
    if (!tokenData) {
      return false;
    }

    if (tokenData.sessionId !== sessionId) {
      return false;
    }

    if (Date.now() > tokenData.expiresAt) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Invalidate CSRF token
   * @param {string} token - Token to invalidate
   */
  invalidateToken(token) {
    this.tokens.delete(token);
  }

  /**
   * Clean expired tokens
   */
  cleanExpiredTokens() {
    const now = Date.now();
    for (const [token, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Get token statistics
   * @returns {Object} Token statistics
   */
  getStats() {
    const now = Date.now();
    let activeTokens = 0;
    let expiredTokens = 0;

    for (const data of this.tokens.values()) {
      if (now > data.expiresAt) {
        expiredTokens++;
      } else {
        activeTokens++;
      }
    }

    return {
      totalTokens: this.tokens.size,
      activeTokens,
      expiredTokens
    };
  }
}

/**
 * Rate limiting for security
 */
class SecurityRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.maxAttempts = options.maxAttempts || 5;
    this.blockDuration = options.blockDuration || 60 * 60 * 1000; // 1 hour
    this.attempts = new Map();
    this.blocked = new Map();
  }

  /**
   * Check if action is allowed
   * @param {string} key - Rate limit key (IP, user ID, etc.)
   * @param {string} action - Action type
   * @returns {Object} Rate limit result
   */
  check(key, action = 'default') {
    const fullKey = `${key}:${action}`;
    const now = Date.now();

    // Check if key is blocked
    const blockData = this.blocked.get(fullKey);
    if (blockData && now < blockData.until) {
      return {
        allowed: false,
        reason: 'blocked',
        remainingTime: blockData.until - now
      };
    }

    // Remove expired block
    if (blockData && now >= blockData.until) {
      this.blocked.delete(fullKey);
    }

    // Get or create attempts data
    if (!this.attempts.has(fullKey)) {
      this.attempts.set(fullKey, []);
    }

    const attempts = this.attempts.get(fullKey);
    const windowStart = now - this.windowMs;

    // Remove old attempts
    const validAttempts = attempts.filter(timestamp => timestamp > windowStart);
    this.attempts.set(fullKey, validAttempts);

    // Check if limit exceeded
    if (validAttempts.length >= this.maxAttempts) {
      // Block the key
      this.blocked.set(fullKey, {
        until: now + this.blockDuration,
        reason: 'rate_limit_exceeded'
      });

      return {
        allowed: false,
        reason: 'rate_limit_exceeded',
        remainingTime: this.blockDuration
      };
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(fullKey, validAttempts);

    return {
      allowed: true,
      remainingAttempts: this.maxAttempts - validAttempts.length,
      resetTime: windowStart + this.windowMs
    };
  }

  /**
   * Manually block a key
   * @param {string} key - Key to block
   * @param {string} action - Action type
   * @param {number} duration - Block duration in milliseconds
   */
  block(key, action = 'default', duration = this.blockDuration) {
    const fullKey = `${key}:${action}`;
    this.blocked.set(fullKey, {
      until: Date.now() + duration,
      reason: 'manual_block'
    });
  }

  /**
   * Unblock a key
   * @param {string} key - Key to unblock
   * @param {string} action - Action type
   */
  unblock(key, action = 'default') {
    const fullKey = `${key}:${action}`;
    this.blocked.delete(fullKey);
    this.attempts.delete(fullKey);
  }

  /**
   * Get statistics
   * @returns {Object} Rate limiter statistics
   */
  getStats() {
    const now = Date.now();
    let activeBlocks = 0;
    let expiredBlocks = 0;

    for (const data of this.blocked.values()) {
      if (now < data.until) {
        activeBlocks++;
      } else {
        expiredBlocks++;
      }
    }

    return {
      totalAttempts: Array.from(this.attempts.values()).reduce((sum, attempts) => sum + attempts.length, 0),
      totalBlocks: this.blocked.size,
      activeBlocks,
      expiredBlocks
    };
  }
}

/**
 * Security utilities
 */
const securityUtils = {
  /**
   * Hash a string using SHA-256
   * @param {string} input - String to hash
   * @returns {Promise<string>} Hashed string
   */
  async hash(input) {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /**
   * Generate random string
   * @param {number} length - Length of string
   * @returns {string} Random string
   */
  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);
    
    for (let i = 0; i < length; i++) {
      result += chars[randomArray[i] % chars.length];
    }
    
    return result;
  },

  /**
   * Validate password against common patterns
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validatePassword(password) {
    const analyzer = new PasswordStrengthAnalyzer();
    return analyzer.analyze(password);
  },

  /**
   * Generate strong password
   * @param {Object} options - Generation options
   * @returns {string} Generated password
   */
  generatePassword(options = {}) {
    const analyzer = new PasswordStrengthAnalyzer();
    return analyzer.generatePassword(options);
  },

  /**
   * Sanitize user input
   * @param {string} input - Input to sanitize
   * @param {string} type - Input type ('text', 'html', 'url', 'email')
   * @returns {string|null} Sanitized input
   */
  sanitizeInput(input, type = 'text') {
    const sanitizer = new InputSanitizer();
    
    switch (type) {
      case 'html':
        return sanitizer.sanitizeHTML(input);
      case 'url':
        return sanitizer.sanitizeURL(input);
      case 'email':
        return sanitizer.sanitizeEmail(input);
      default:
        return sanitizer.sanitizeText(input);
    }
  },

  /**
   * Check if string contains potentially dangerous content
   * @param {string} input - Input to check
   * @returns {Object} Security check result
   */
  securityCheck(input) {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b/gi,
      /<object\b/gi,
      /<embed\b/gi
    ];

    const threats = [];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(input)) {
        threats.push(pattern.source);
      }
    }

    return {
      isSafe: threats.length === 0,
      threats,
      riskLevel: threats.length === 0 ? 'low' : threats.length > 2 ? 'high' : 'medium'
    };
  }
};

// Export all classes and utilities
export {
  PasswordStrengthAnalyzer,
  InputSanitizer,
  CSRFProtection,
  SecurityRateLimiter,
  securityUtils
};

export default securityUtils;
