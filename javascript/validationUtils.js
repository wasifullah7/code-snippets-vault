/**
 * Advanced form validation utilities with comprehensive validation rules
 * @param {Object} options - Configuration options
 * @param {boolean} options.stopOnFirstError - Stop validation on first error (default: false)
 * @param {boolean} options.trimValues - Auto-trim input values (default: true)
 * @param {Object} options.customRules - Custom validation rules
 * @returns {Object} Validation utilities
 */
class ValidationUtils {
    constructor(options = {}) {
      this.options = {
        stopOnFirstError: options.stopOnFirstError || false,
        trimValues: options.trimValues !== false,
        customRules: options.customRules || {},
        ...options
      };
    }
  
    /**
     * Validate email address
     * @param {string} email - Email to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateEmail(email, options = {}) {
      const { required = true, allowEmpty = false } = options;
      
      if (!email && !required) return { isValid: true };
      if (!email && required) return { isValid: false, error: 'Email is required' };
      
      const trimmedEmail = this.options.trimValues ? email.trim() : email;
      
      if (!trimmedEmail && allowEmpty) return { isValid: true };
      if (!trimmedEmail) return { isValid: false, error: 'Email is required' };
  
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValid = emailRegex.test(trimmedEmail);
      
      return {
        isValid,
        error: isValid ? null : 'Invalid email format',
        value: trimmedEmail
      };
    }
  
    /**
     * Validate password strength
     * @param {string} password - Password to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validatePassword(password, options = {}) {
      const {
        required = true,
        minLength = 8,
        requireUppercase = true,
        requireLowercase = true,
        requireNumbers = true,
        requireSymbols = false,
        maxLength = 128
      } = options;
  
      if (!password && !required) return { isValid: true };
      if (!password && required) return { isValid: false, error: 'Password is required' };
  
      const trimmedPassword = this.options.trimValues ? password.trim() : password;
      
      if (!trimmedPassword) return { isValid: false, error: 'Password is required' };
  
      const errors = [];
      const strength = {
        length: trimmedPassword.length >= minLength,
        uppercase: requireUppercase ? /[A-Z]/.test(trimmedPassword) : true,
        lowercase: requireLowercase ? /[a-z]/.test(trimmedPassword) : true,
        numbers: requireNumbers ? /\d/.test(trimmedPassword) : true,
        symbols: requireSymbols ? /[^A-Za-z0-9]/.test(trimmedPassword) : true,
        maxLength: trimmedPassword.length <= maxLength
      };
  
      if (!strength.length) errors.push(`Password must be at least ${minLength} characters long`);
      if (!strength.uppercase) errors.push('Password must contain at least one uppercase letter');
      if (!strength.lowercase) errors.push('Password must contain at least one lowercase letter');
      if (!strength.numbers) errors.push('Password must contain at least one number');
      if (!strength.symbols) errors.push('Password must contain at least one special character');
      if (!strength.maxLength) errors.push(`Password must be no more than ${maxLength} characters long`);
  
      const score = Object.values(strength).filter(Boolean).length;
      const strengthLevel = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';
  
      return {
        isValid: errors.length === 0,
        errors,
        strength: {
          score,
          level: strengthLevel,
          details: strength
        },
        value: trimmedPassword
      };
    }
  
    /**
     * Validate phone number
     * @param {string} phone - Phone number to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validatePhone(phone, options = {}) {
      const { required = true, format = 'international' } = options;
      
      if (!phone && !required) return { isValid: true };
      if (!phone && required) return { isValid: false, error: 'Phone number is required' };
  
      const trimmedPhone = this.options.trimValues ? phone.trim() : phone;
      
      if (!trimmedPhone) return { isValid: false, error: 'Phone number is required' };
  
      let regex;
      switch (format) {
        case 'international':
          regex = /^\+?[1-9]\d{1,14}$/;
          break;
        case 'us':
          regex = /^\+?1?\s*\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/;
          break;
        case 'european':
          regex = /^\+?[1-9]\d{1,14}$/;
          break;
        default:
          regex = /^\+?[1-9]\d{1,14}$/;
      }
  
      const isValid = regex.test(trimmedPhone.replace(/\s/g, ''));
      
      return {
        isValid,
        error: isValid ? null : 'Invalid phone number format',
        value: trimmedPhone
      };
    }
  
    /**
     * Validate URL
     * @param {string} url - URL to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateUrl(url, options = {}) {
      const { required = true, protocols = ['http', 'https'] } = options;
      
      if (!url && !required) return { isValid: true };
      if (!url && required) return { isValid: false, error: 'URL is required' };
  
      const trimmedUrl = this.options.trimValues ? url.trim() : url;
      
      if (!trimmedUrl) return { isValid: false, error: 'URL is required' };
  
      try {
        const urlObj = new URL(trimmedUrl);
        const isValidProtocol = protocols.includes(urlObj.protocol.replace(':', ''));
        
        return {
          isValid: isValidProtocol,
          error: isValidProtocol ? null : `URL must use one of: ${protocols.join(', ')}`,
          value: trimmedUrl,
          parsed: urlObj
        };
      } catch {
        return {
          isValid: false,
          error: 'Invalid URL format',
          value: trimmedUrl
        };
      }
    }
  
    /**
     * Validate number range
     * @param {number} value - Number to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateNumber(value, options = {}) {
      const { required = true, min, max, integer = false } = options;
      
      if (value === null || value === undefined) {
        if (!required) return { isValid: true };
        return { isValid: false, error: 'Number is required' };
      }
  
      const num = Number(value);
      
      if (isNaN(num)) return { isValid: false, error: 'Value must be a valid number' };
      if (integer && !Number.isInteger(num)) return { isValid: false, error: 'Value must be an integer' };
      if (min !== undefined && num < min) return { isValid: false, error: `Value must be at least ${min}` };
      if (max !== undefined && num > max) return { isValid: false, error: `Value must be no more than ${max}` };
  
      return {
        isValid: true,
        value: num
      };
    }
  
    /**
     * Validate string length
     * @param {string} value - String to validate
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateString(value, options = {}) {
      const { required = true, minLength, maxLength, pattern } = options;
      
      if (!value && !required) return { isValid: true };
      if (!value && required) return { isValid: false, error: 'String is required' };
  
      const trimmedValue = this.options.trimValues ? value.trim() : value;
      
      if (!trimmedValue && required) return { isValid: false, error: 'String is required' };
  
      const errors = [];
  
      if (minLength !== undefined && trimmedValue.length < minLength) {
        errors.push(`String must be at least ${minLength} characters long`);
      }
  
      if (maxLength !== undefined && trimmedValue.length > maxLength) {
        errors.push(`String must be no more than ${maxLength} characters long`);
      }
  
      if (pattern && !new RegExp(pattern).test(trimmedValue)) {
        errors.push('String does not match required pattern');
      }
  
      return {
        isValid: errors.length === 0,
        errors: errors.length > 0 ? errors : null,
        value: trimmedValue
      };
    }
  
    /**
     * Validate form object
     * @param {Object} formData - Form data to validate
     * @param {Object} rules - Validation rules
     * @returns {Object} Validation result
     */
    validateForm(formData, rules) {
      const errors = {};
      const isValid = {};
  
      for (const [field, fieldRules] of Object.entries(rules)) {
        const value = formData[field];
        const validationResult = this.validateField(value, fieldRules);
        
        if (!validationResult.isValid) {
          errors[field] = validationResult.error || validationResult.errors;
          if (this.options.stopOnFirstError) break;
        }
        
        isValid[field] = validationResult.isValid;
      }
  
      return {
        isValid: Object.keys(errors).length === 0,
        errors,
        fieldResults: isValid
      };
    }
  
    /**
     * Validate single field
     * @param {any} value - Field value
     * @param {Object} rules - Field validation rules
     * @returns {Object} Validation result
     */
    validateField(value, rules) {
      const { type, ...options } = rules;
  
      switch (type) {
        case 'email':
          return this.validateEmail(value, options);
        case 'password':
          return this.validatePassword(value, options);
        case 'phone':
          return this.validatePhone(value, options);
        case 'url':
          return this.validateUrl(value, options);
        case 'number':
          return this.validateNumber(value, options);
        case 'string':
          return this.validateString(value, options);
        default:
          if (this.options.customRules[type]) {
            return this.options.customRules[type](value, options);
          }
          return { isValid: false, error: `Unknown validation type: ${type}` };
      }
    }
  }
  
  // Example usage:
  // const validator = new ValidationUtils({
  //   stopOnFirstError: false,
  //   trimValues: true
  // });
  // 
  // // Validate email
  // const emailResult = validator.validateEmail('user@example.com');
  // 
  // // Validate password
  // const passwordResult = validator.validatePassword('MyPass123!', {
  //   minLength: 8,
  //   requireSymbols: true
  // });
  // 
  // // Validate form
  // const formData = {
  //   email: 'user@example.com',
  //   password: 'MyPass123!',
  //   phone: '+1234567890'
  // };
  // 
  // const formRules = {
  //   email: { type: 'email', required: true },
  //   password: { type: 'password', minLength: 8 },
  //   phone: { type: 'phone', format: 'us' }
  // };
  // 
  // const formResult = validator.validateForm(formData, formRules);
  
  module.exports = ValidationUtils;