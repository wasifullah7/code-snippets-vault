/**
 * Advanced password hashing and verification utilities
 * @param {Object} options - Configuration options
 * @param {number} options.saltRounds - Number of salt rounds (default: 12)
 * @param {string} options.algorithm - Hashing algorithm (default: 'bcrypt')
 * @param {number} options.memoryCost - Memory cost for Argon2 (default: 65536)
 * @param {number} options.timeCost - Time cost for Argon2 (default: 3)
 * @param {number} options.parallelism - Parallelism for Argon2 (default: 1)
 */
const crypto = require('crypto');
const bcrypt = require('bcrypt');

class PasswordHash {
  constructor(options = {}) {
    this.options = {
      saltRounds: options.saltRounds || 12,
      algorithm: options.algorithm || 'bcrypt',
      memoryCost: options.memoryCost || 65536,
      timeCost: options.timeCost || 3,
      parallelism: options.parallelism || 1,
      ...options
    };
  }

  /**
   * Hash password using bcrypt
   * @param {string} password - Plain text password
   * @returns {Promise<string>} Hashed password
   */
  async hashPassword(password) {
    try {
      if (!password || typeof password !== 'string') {
        throw new Error('Password must be a non-empty string');
      }

      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
      }

      const saltRounds = this.options.saltRounds;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      return hashedPassword;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error.message}`);
    }
  }

  /**
   * Verify password against hash
   * @param {string} password - Plain text password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} True if password matches
   */
  async verifyPassword(password, hash) {
    try {
      if (!password || !hash) {
        return false;
      }

      const isValid = await bcrypt.compare(password, hash);
      return isValid;
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Generate secure random password
   * @param {Object} options - Password generation options
   * @param {number} options.length - Password length (default: 16)
   * @param {boolean} options.uppercase - Include uppercase letters (default: true)
   * @param {boolean} options.lowercase - Include lowercase letters (default: true)
   * @param {boolean} options.numbers - Include numbers (default: true)
   * @param {boolean} options.symbols - Include symbols (default: true)
   * @param {string} options.exclude - Characters to exclude
   * @returns {string} Generated password
   */
  generatePassword(options = {}) {
    const {
      length = 16,
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      exclude = ''
    } = options;

    const charset = {
      uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      lowercase: 'abcdefghijklmnopqrstuvwxyz',
      numbers: '0123456789',
      symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
    };

    let availableChars = '';
    if (uppercase) availableChars += charset.uppercase;
    if (lowercase) availableChars += charset.lowercase;
    if (numbers) availableChars += charset.numbers;
    if (symbols) availableChars += charset.symbols;

    // Remove excluded characters
    if (exclude) {
      availableChars = availableChars.replace(new RegExp(`[${exclude}]`, 'g'), '');
    }

    if (availableChars.length === 0) {
      throw new Error('No characters available for password generation');
    }

    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      password += availableChars[randomBytes[i] % availableChars.length];
    }

    return password;
  }

  /**
   * Check password strength
   * @param {string} password - Password to check
   * @returns {Object} Strength analysis
   */
  checkPasswordStrength(password) {
    if (!password || typeof password !== 'string') {
      return { score: 0, feedback: ['Password is required'] };
    }

    const feedback = [];
    let score = 0;

    // Length check
    if (password.length < 8) {
      feedback.push('Password should be at least 8 characters long');
    } else if (password.length >= 12) {
      score += 2;
    } else {
      score += 1;
    }

    // Character variety checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Additional checks
    if (password.length > 20) score += 1;
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
    if (!/(123|abc|qwe|password|admin)/i.test(password)) score += 1; // No common patterns

    // Determine strength level
    let strength = 'weak';
    if (score >= 6) strength = 'strong';
    else if (score >= 4) strength = 'medium';
    else if (score >= 2) strength = 'fair';

    return {
      score,
      strength,
      feedback: feedback.length > 0 ? feedback : ['Password meets basic requirements'],
      length: password.length,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumbers: /[0-9]/.test(password),
      hasSymbols: /[^A-Za-z0-9]/.test(password)
    };
  }

  /**
   * Hash password with custom salt
   * @param {string} password - Plain text password
   * @param {string} salt - Custom salt
   * @returns {Promise<string>} Hashed password
   */
  async hashWithSalt(password, salt) {
    try {
      const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512');
      return hash.toString('hex');
    } catch (error) {
      throw new Error(`Custom salt hashing failed: ${error.message}`);
    }
  }

  /**
   * Generate secure salt
   * @param {number} length - Salt length (default: 32)
   * @returns {string} Generated salt
   */
  generateSalt(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Validate password requirements
   * @param {string} password - Password to validate
   * @param {Object} requirements - Password requirements
   * @returns {Object} Validation result
   */
  validatePassword(password, requirements = {}) {
    const {
      minLength = 8,
      requireUppercase = true,
      requireLowercase = true,
      requireNumbers = true,
      requireSymbols = false,
      maxLength = 128
    } = requirements;

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }

    if (password.length > maxLength) {
      errors.push(`Password must be no more than ${maxLength} characters long`);
    }

    if (requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (requireSymbols && !/[^A-Za-z0-9]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Example usage:
// const passwordHash = new PasswordHash({ saltRounds: 12 });
// 
// // Hash password
// const hashedPassword = await passwordHash.hashPassword('mySecurePassword123!');
// 
// // Verify password
// const isValid = await passwordHash.verifyPassword('mySecurePassword123!', hashedPassword);
// 
// // Generate secure password
// const newPassword = passwordHash.generatePassword({
//   length: 20,
//   uppercase: true,
//   lowercase: true,
//   numbers: true,
//   symbols: true
// });
// 
// // Check password strength
// const strength = passwordHash.checkPasswordStrength('MyPassword123!');
// console.log(strength); // { score: 7, strength: 'strong', feedback: [...] }
// 
// // Validate password requirements
// const validation = passwordHash.validatePassword('MyPassword123!', {
//   minLength: 10,
//   requireUppercase: true,
//   requireSymbols: true
// });

module.exports = PasswordHash;