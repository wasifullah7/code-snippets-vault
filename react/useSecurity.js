import { useState, useCallback, useEffect } from 'react';

/**
 * React hook for security operations
 * @returns {Object} Security state and functions
 */
const useSecurity = () => {
  const [isSecure, setIsSecure] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.protocol === 'https:';
  });

  const [rateLimitData, setRateLimitData] = useState({});
  const [encryptedData, setEncryptedData] = useState({});

  // Sanitize HTML content
  const sanitizeHTML = useCallback((html) => {
    if (!html || typeof html !== 'string') return '';
    
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }, []);

  // Escape HTML characters
  const escapeHTML = useCallback((text) => {
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
  }, []);

  // Validate password strength
  const validatePassword = useCallback((password) => {
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
  }, []);

  // Generate secure random string
  const generateSecureRandom = useCallback((length = 32) => {
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
  }, []);

  // Hash string using Web Crypto API
  const hashString = useCallback(async (text, algorithm = 'SHA-256') => {
    if (!text || typeof text !== 'string') return '';
    
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(text);
      const hashBuffer = await crypto.subtle.digest(algorithm, data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    return '';
  }, []);

  // Validate email address
  const isValidEmail = useCallback((email) => {
    if (!email || typeof email !== 'string') return false;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  // Validate URL
  const isValidURL = useCallback((url) => {
    if (!url || typeof url !== 'string') return false;
    
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Check if string contains XSS
  const containsXSS = useCallback((text) => {
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
  }, []);

  // Sanitize input text
  const sanitizeInput = useCallback((text) => {
    if (!text || typeof text !== 'string') return '';
    
    return text
      .trim()
      .replace(/[<>]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  }, []);

  // Check if password is common
  const isCommonPassword = useCallback((password) => {
    if (!password || typeof password !== 'string') return false;
    
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', 'qwerty123', 'dragon', 'master'
    ];
    
    return commonPasswords.includes(password.toLowerCase());
  }, []);

  // Generate CSRF token
  const generateCSRFToken = useCallback(() => {
    return generateSecureRandom(32);
  }, [generateSecureRandom]);

  // Validate CSRF token
  const validateCSRFToken = useCallback((token, expected) => {
    if (!token || !expected) return false;
    return token === expected;
  }, []);

  // Get security headers
  const getSecurityHeaders = useCallback(() => {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'"
    };
  }, []);

  // Validate file upload
  const validateFileUpload = useCallback((file, options = {}) => {
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
  }, []);

  // Rate limiting check
  const checkRateLimit = useCallback((key, limit = 100, window = 60000) => {
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
    
    setRateLimitData(prev => ({
      ...prev,
      [key]: data
    }));
    
    return true;
  }, []);

  // Encrypt data (basic implementation)
  const encryptData = useCallback((data, key) => {
    if (!data || !key) return '';
    
    // Simple XOR encryption (not secure for production)
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    
    const encryptedResult = btoa(encrypted);
    
    setEncryptedData(prev => ({
      ...prev,
      [key]: encryptedResult
    }));
    
    return encryptedResult;
  }, []);

  // Decrypt data (basic implementation)
  const decryptData = useCallback((encryptedData, key) => {
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
  }, []);

  // Update security status
  const updateSecurityStatus = useCallback(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.location.protocol === 'https:');
    }
  }, []);

  // Effect to monitor security status
  useEffect(() => {
    updateSecurityStatus();
    
    const handleSecurityChange = () => {
      updateSecurityStatus();
    };
    
    window.addEventListener('beforeunload', handleSecurityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleSecurityChange);
    };
  }, [updateSecurityStatus]);

  return {
    // Security state
    isSecure,
    rateLimitData,
    encryptedData,
    
    // Security operations
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
    getSecurityHeaders,
    validateFileUpload,
    checkRateLimit,
    encryptData,
    decryptData,
    
    // Utility functions
    updateSecurityStatus
  };
};

export default useSecurity;
