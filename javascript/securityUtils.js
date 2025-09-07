/**
 * Security utility functions for data protection and validation
 */

/**
 * Sanitize HTML content
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
const sanitizeHTML = (html) => {
  if (!html || typeof html !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
};

/**
 * Escape HTML characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHTML = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;'
  };
  
  return text.replace(/[&<>"'/]/g, (s) => map[s]);
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return {
      isValid: false,
      score: 0,
      feedback: ['Password is required']
    };
  }
  
  const feedback = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password must be at least 8 characters long');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one lowercase letter');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one number');
  }
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password must contain at least one special character');
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback
  };
};

/**
 * Generate secure random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
const generateSecureRandom = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
  } else {
    // Fallback for older browsers
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  
  return result;
};

/**
 * Hash string using Web Crypto API
 * @param {string} text - Text to hash
 * @param {string} algorithm - Hash algorithm
 * @returns {Promise<string>} Hashed string
 */
const hashString = async (text, algorithm = 'SHA-256') => {
  if (!text || typeof text !== 'string') return '';
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest(algorithm, data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  return '';
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if string contains XSS
 * @param {string} text - Text to check
 * @returns {boolean} True if contains XSS
 */
const containsXSS = (text) => {
  if (!text || typeof text !== 'string') return false;
  
  const xssPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>.*?<\/embed>/gi,
    /<link[^>]*>.*?<\/link>/gi,
    /<meta[^>]*>.*?<\/meta>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(text));
};

/**
 * Sanitize input text
 * @param {string} text - Text to sanitize
 * @returns {string} Sanitized text
 */
const sanitizeInput = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Check if password is common
 * @param {string} password - Password to check
 * @returns {boolean} True if password is common
 */
const isCommonPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  
  const commonPasswords = [
    'password', '123456', '123456789', 'qwerty', 'abc123',
    'password123', 'admin', 'letmein', 'welcome', 'monkey',
    '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
  ];
  
  return commonPasswords.includes(password.toLowerCase());
};

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
  return generateSecureRandom(32);
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @param {string} expected - Expected token
 * @returns {boolean} True if token is valid
 */
const validateCSRFToken = (token, expected) => {
  if (!token || !expected) return false;
  return token === expected;
};

/**
 * Check if request is secure
 * @returns {boolean} True if request is secure
 */
const isSecureRequest = () => {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:';
};

/**
 * Get security headers
 * @returns {Object} Security headers
 */
const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': "default-src 'self'"
  };
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  } = options;
  
  const errors = [];
  
  if (!file) {
    errors.push('No file provided');
    return { isValid: false, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!allowedExtensions.includes(extension)) {
    errors.push(`File extension ${extension} is not allowed`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Rate limiting check
 * @param {string} key - Rate limit key
 * @param {number} limit - Request limit
 * @param {number} window - Time window in milliseconds
 * @returns {boolean} True if within limit
 */
const checkRateLimit = (key, limit = 100, window = 60000) => {
  if (typeof window === 'undefined') return true;
  
  const now = Date.now();
  const storageKey = `rate_limit_${key}`;
  
  let data = JSON.parse(localStorage.getItem(storageKey) || '{"count": 0, "resetTime": 0}');
  
  if (now > data.resetTime) {
    data = { count: 0, resetTime: now + window };
  }
  
  if (data.count >= limit) {
    return false;
  }
  
  data.count++;
  localStorage.setItem(storageKey, JSON.stringify(data));
  
  return true;
};

/**
 * Encrypt data (basic implementation)
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} Encrypted data
 */
const encryptData = (data, key) => {
  if (!data || !key) return '';
  
  // Simple XOR encryption (not secure for production)
  let encrypted = '';
  for (let i = 0; i < data.length; i++) {
    encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  
  return btoa(encrypted);
};

/**
 * Decrypt data (basic implementation)
 * @param {string} encryptedData - Encrypted data
 * @param {string} key - Decryption key
 * @returns {string} Decrypted data
 */
const decryptData = (encryptedData, key) => {
  if (!encryptedData || !key) return '';
  
  try {
    const data = atob(encryptedData);
    let decrypted = '';
    
    for (let i = 0; i < data.length; i++) {
      decrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    return decrypted;
  } catch {
    return '';
  }
};

module.exports = {
  sanitizeHTML,
  escapeHTML,
  validatePassword,
  generateSecureRandom,
  hashString,
  isValidEmail,
  isValidURL,
  containsXSS,
  sanitizeInput,
  isCommonPassword,
  generateCSRFToken,
  validateCSRFToken,
  isSecureRequest,
  getSecurityHeaders,
  validateFileUpload,
  checkRateLimit,
  encryptData,
  decryptData
};