/**
 * Validation utilities for Node.js
 */

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  const isLongEnough = password.length >= minLength;

  return {
    isValid: isLongEnough && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
    isLongEnough,
    hasUpperCase,
    hasLowerCase,
    hasNumbers,
    hasSpecialChar,
    strength: [isLongEnough, hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length
  };
};

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate credit card number (Luhn algorithm)
 * @param {string} cardNumber - Card number to validate
 * @returns {boolean} True if valid card number
 */
const isValidCreditCard = (cardNumber) => {
  const cleanNumber = cardNumber.replace(/\s/g, '');
  if (!/^\d{13,19}$/.test(cleanNumber)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} date - Date string to validate
 * @returns {boolean} True if valid date
 */
const isValidDate = (date) => {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d) && d.toISOString().slice(0, 10) === date;
};

/**
 * Validate required field
 * @param {*} value - Value to validate
 * @returns {boolean} True if not empty
 */
const isRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Validate minimum length
 * @param {string} value - String to validate
 * @param {number} minLength - Minimum length
 * @returns {boolean} True if meets minimum length
 */
const hasMinLength = (value, minLength) => {
  return value && value.length >= minLength;
};

/**
 * Validate maximum length
 * @param {string} value - String to validate
 * @param {number} maxLength - Maximum length
 * @returns {boolean} True if within maximum length
 */
const hasMaxLength = (value, maxLength) => {
  return value && value.length <= maxLength;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} True if within range
 */
const isInRange = (value, min, max) => {
  return value >= min && value <= max;
};

/**
 * Validate object schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation result
 */
const validateSchema = (data, schema) => {
  const errors = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors = [];

    // Required validation
    if (rules.required && !isRequired(value)) {
      fieldErrors.push(`${field} is required`);
    }

    // Type validation
    if (rules.type && value !== undefined) {
      if (rules.type === 'string' && typeof value !== 'string') {
        fieldErrors.push(`${field} must be a string`);
      } else if (rules.type === 'number' && typeof value !== 'number') {
        fieldErrors.push(`${field} must be a number`);
      } else if (rules.type === 'boolean' && typeof value !== 'boolean') {
        fieldErrors.push(`${field} must be a boolean`);
      } else if (rules.type === 'array' && !Array.isArray(value)) {
        fieldErrors.push(`${field} must be an array`);
      } else if (rules.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
        fieldErrors.push(`${field} must be an object`);
      }
    }

    // Email validation
    if (rules.email && value && !isValidEmail(value)) {
      fieldErrors.push(`${field} must be a valid email`);
    }

    // Phone validation
    if (rules.phone && value && !isValidPhone(value)) {
      fieldErrors.push(`${field} must be a valid phone number`);
    }

    // URL validation
    if (rules.url && value && !isValidUrl(value)) {
      fieldErrors.push(`${field} must be a valid URL`);
    }

    // Min length validation
    if (rules.minLength && !hasMinLength(value, rules.minLength)) {
      fieldErrors.push(`${field} must be at least ${rules.minLength} characters`);
    }

    // Max length validation
    if (rules.maxLength && !hasMaxLength(value, rules.maxLength)) {
      fieldErrors.push(`${field} must be no more than ${rules.maxLength} characters`);
    }

    // Range validation
    if (rules.range && !isInRange(value, rules.range.min, rules.range.max)) {
      fieldErrors.push(`${field} must be between ${rules.range.min} and ${rules.range.max}`);
    }

    // Custom validation
    if (rules.custom && typeof rules.custom === 'function') {
      const customError = rules.custom(value, data);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
      isValid = false;
    }
  }

  return {
    isValid,
    errors
  };
};

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
const sanitizeString = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[&]/g, '&amp;') // Escape ampersands
    .replace(/["]/g, '&quot;') // Escape quotes
    .replace(/[']/g, '&#x27;'); // Escape apostrophes
};

/**
 * Validate and sanitize form data
 * @param {Object} formData - Form data to validate
 * @param {Object} schema - Validation schema
 * @returns {Object} Validation and sanitization result
 */
const validateAndSanitize = (formData, schema) => {
  const sanitizedData = {};
  
  // Sanitize all string fields
  for (const [field, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      sanitizedData[field] = sanitizeString(value);
    } else {
      sanitizedData[field] = value;
    }
  }

  // Validate sanitized data
  const validation = validateSchema(sanitizedData, schema);

  return {
    ...validation,
    data: sanitizedData
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidUrl,
  isValidCreditCard,
  isValidDate,
  isRequired,
  hasMinLength,
  hasMaxLength,
  isInRange,
  validateSchema,
  sanitizeString,
  validateAndSanitize
};
