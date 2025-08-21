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
      hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password),
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
      score: Math.max(0, score),
      strength,
      feedback,
      suggestions,
      analysis
    };
  }

  /**
   * Check if password meets minimum requirements
   * @param {string} password - Password to check
   * @returns {boolean} Whether password meets requirements
   */
  meetsRequirements(password) {
    const analysis = this.analyze(password);
    return analysis.score >= 8 && analysis.feedback.length === 0;
  }

  /**
   * Generate secure password
   * @param {number} length - Password length
   * @param {Object} options - Generation options
   * @returns {string} Generated password
   */
  generatePassword(length = 12, options = {}) {
    const {
      includeUppercase = true,
      includeLowercase = true,
      includeNumbers = true,
      includeSpecialChars = true,
      excludeSimilar = true
    } = options;

    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const similar = 'il1Lo0O';

    let chars = '';
    if (includeUppercase) chars += uppercase;
    if (includeLowercase) chars += lowercase;
    if (includeNumbers) chars += numbers;
    if (includeSpecialChars) chars += special;

    if (excludeSimilar) {
      chars = chars.split('').filter(char => !similar.includes(char)).join('');
    }

    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
  }
}

/**
 * Input sanitizer for security
 * Sanitizes various types of input to prevent XSS and injection attacks
 */
class InputSanitizer {
  constructor() {
    this.htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
  }

  /**
   * Sanitize HTML content
   * @param {string} html - HTML content to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized HTML
   */
  sanitizeHtml(html, options = {}) {
    const {
      allowedTags = ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      allowedAttributes = ['class', 'id'],
      stripComments = true
    } = options;

    if (!html) return '';

    let sanitized = html;

    // Remove comments
    if (stripComments) {
      sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
    }

    // Remove script tags and event handlers
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');

    // Remove dangerous tags
    const dangerousTags = ['script', 'object', 'embed', 'form', 'input', 'textarea', 'select', 'button'];
    dangerousTags.forEach(tag => {
      const regex = new RegExp(`<\\/?${tag}\\b[^>]*>`, 'gi');
      sanitized = sanitized.replace(regex, '');
    });

    // Allow only specified tags
    const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g;
    sanitized = sanitized.replace(tagRegex, (match, slash, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        return match;
      }
      return '';
    });

    return sanitized;
  }

  /**
   * Sanitize plain text
   * @param {string} text - Text to sanitize
   * @returns {string} Sanitized text
   */
  sanitizeText(text) {
    if (!text) return '';
    
    return text
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload/gi, '')
      .replace(/onerror/gi, '')
      .trim();
  }

  /**
   * Sanitize URL
   * @param {string} url - URL to sanitize
   * @param {Object} options - Sanitization options
   * @returns {string} Sanitized URL
   */
  sanitizeUrl(url, options = {}) {
    const {
      allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:'],
      requireProtocol = true
    } = options;

    if (!url) return '';

    let sanitized = url.trim();

    // Remove dangerous protocols
    const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
    dangerousProtocols.forEach(protocol => {
      if (sanitized.toLowerCase().startsWith(protocol)) {
        sanitized = sanitized.replace(new RegExp(`^${protocol}`, 'i'), '');
      }
    });

    // Add protocol if required and missing
    if (requireProtocol && !/^[a-zA-Z]+:/.test(sanitized)) {
      sanitized = 'https://' + sanitized;
    }

    // Validate protocol
    try {
      const urlObj = new URL(sanitized);
      if (!allowedProtocols.includes(urlObj.protocol)) {
        return '';
      }
    } catch (error) {
      return '';
    }

    return sanitized;
  }

  /**
   * Sanitize email address
   * @param {string} email - Email to sanitize
   * @returns {string} Sanitized email
   */
  sanitizeEmail(email) {
    if (!email) return '';

    const sanitized = email.trim().toLowerCase();
    
    // Basic email validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailRegex.test(sanitized)) {
      return '';
    }

    return sanitized;
  }

  /**
   * Sanitize SQL input (basic)
   * @param {string} input - Input to sanitize
   * @returns {string} Sanitized input
   */
  sanitizeSql(input) {
    if (!input) return '';

    return input
      .replace(/['";\\]/g, '')
      .replace(/--/g, '')
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .replace(/union/gi, '')
      .replace(/select/gi, '')
      .replace(/insert/gi, '')
      .replace(/update/gi, '')
      .replace(/delete/gi, '')
      .replace(/drop/gi, '')
      .replace(/create/gi, '')
      .replace(/alter/gi, '')
      .trim();
  }
}

/**
 * CSRF protection utilities
 * Generates and validates CSRF tokens
 */
class CSRFProtection {
  constructor(options = {}) {
    this.secret = options.secret || this.generateSecret();
    this.tokenLength = options.tokenLength || 32;
    this.expiryTime = options.expiryTime || 24 * 60 * 60 * 1000; // 24 hours
    this.tokens = new Map();
  }

  /**
   * Generate CSRF token
   * @param {string} sessionId - Session identifier
   * @returns {string} Generated token
   */
  generateToken(sessionId) {
    const token = this.generateRandomString(this.tokenLength);
    const expiry = Date.now() + this.expiryTime;
    
    this.tokens.set(token, {
      sessionId,
      expiry,
      used: false
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
    if (!token || !sessionId) return false;

    const tokenData = this.tokens.get(token);
    
    if (!tokenData) return false;
    
    if (tokenData.sessionId !== sessionId) return false;
    
    if (tokenData.expiry < Date.now()) {
      this.tokens.delete(token);
      return false;
    }
    
    if (tokenData.used) return false;

    // Mark token as used
    tokenData.used = true;
    this.tokens.set(token, tokenData);

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
      if (data.expiry < now) {
        this.tokens.delete(token);
      }
    }
  }

  /**
   * Generate random string
   * @param {number} length - String length
   * @returns {string} Random string
   */
  generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate secret for token signing
   * @returns {string} Generated secret
   */
  generateSecret() {
    return this.generateRandomString(64);
  }
}

/**
 * Security rate limiter
 * Rate limiting specifically for security-sensitive operations
 */
class SecurityRateLimiter {
  constructor(options = {}) {
    this.maxAttempts = options.maxAttempts || 5;
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.blockDuration = options.blockDuration || 60 * 60 * 1000; // 1 hour
    this.attempts = new Map();
    this.blocked = new Map();
  }

  /**
   * Check if operation is allowed
   * @param {string} key - Rate limit key (usually IP or user ID)
   * @param {string} operation - Operation type
   * @returns {Object} Rate limit result
   */
  check(key, operation = 'default') {
    const fullKey = `${key}:${operation}`;
    const now = Date.now();

    // Check if key is blocked
    const blockedUntil = this.blocked.get(fullKey);
    if (blockedUntil && blockedUntil > now) {
      return {
        allowed: false,
        blocked: true,
        remainingTime: blockedUntil - now,
        reason: 'Rate limit exceeded'
      };
    }

    // Remove block if expired
    if (blockedUntil && blockedUntil <= now) {
      this.blocked.delete(fullKey);
    }

    // Get current attempts
    const attempts = this.attempts.get(fullKey) || [];
    const validAttempts = attempts.filter(timestamp => timestamp > now - this.windowMs);

    if (validAttempts.length >= this.maxAttempts) {
      // Block the key
      this.blocked.set(fullKey, now + this.blockDuration);
      this.attempts.delete(fullKey);

      return {
        allowed: false,
        blocked: true,
        remainingTime: this.blockDuration,
        reason: 'Rate limit exceeded'
      };
    }

    // Add current attempt
    validAttempts.push(now);
    this.attempts.set(fullKey, validAttempts);

    return {
      allowed: true,
      blocked: false,
      remainingAttempts: this.maxAttempts - validAttempts.length,
      resetTime: now + this.windowMs
    };
  }

  /**
   * Reset attempts for a key
   * @param {string} key - Rate limit key
   * @param {string} operation - Operation type
   */
  reset(key, operation = 'default') {
    const fullKey = `${key}:${operation}`;
    this.attempts.delete(fullKey);
    this.blocked.delete(fullKey);
  }

  /**
   * Get rate limit status
   * @param {string} key - Rate limit key
   * @param {string} operation - Operation type
   * @returns {Object} Rate limit status
   */
  getStatus(key, operation = 'default') {
    const fullKey = `${key}:${operation}`;
    const now = Date.now();

    const blockedUntil = this.blocked.get(fullKey);
    const attempts = this.attempts.get(fullKey) || [];
    const validAttempts = attempts.filter(timestamp => timestamp > now - this.windowMs);

    return {
      isBlocked: blockedUntil && blockedUntil > now,
      blockedUntil,
      attempts: validAttempts.length,
      maxAttempts: this.maxAttempts,
      remainingAttempts: Math.max(0, this.maxAttempts - validAttempts.length),
      resetTime: now + this.windowMs
    };
  }
}

/**
 * Security utilities
 */
const securityUtils = {
  /**
   * Hash string using SHA-256
   * @param {string} input - Input to hash
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
   * @param {number} length - String length
   * @param {string} charset - Character set
   * @returns {string} Random string
   */
  generateRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  },

  /**
   * Generate secure random bytes
   * @param {number} length - Number of bytes
   * @returns {Uint8Array} Random bytes
   */
  generateRandomBytes(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return array;
  },

  /**
   * Escape HTML entities
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'/]/g, char => htmlEntities[char]);
  },

  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   */
  isValidEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   * @param {string} url - URL to validate
   * @returns {boolean} Whether URL is valid
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if string contains potentially dangerous content
   * @param {string} input - Input to check
   * @returns {boolean} Whether input is potentially dangerous
   */
  isPotentiallyDangerous(input) {
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/i,
      /javascript:/i,
      /vbscript:/i,
      /data:/i,
      /file:/i,
      /on\w+\s*=/i,
      /union\s+select/i,
      /<iframe/i,
      /<object/i,
      /<embed/i
    ];

    return dangerousPatterns.some(pattern => pattern.test(input));
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
