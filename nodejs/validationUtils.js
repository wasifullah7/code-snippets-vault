/**
 * Advanced validation utilities for Node.js applications
 * Comprehensive data validation, sanitization, and schema validation
 */

const { EventEmitter } = require('events');

/**
 * Schema validator with support for complex validation rules
 */
class SchemaValidator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
    this.transformers = new Map();
    this.errorMessages = new Map();
  }

  /**
   * Add validation rule
   * @param {string} field - Field name
   * @param {Object} rules - Validation rules
   */
  addRule(field, rules) {
    this.rules.set(field, rules);
  }

  /**
   * Add custom validator
   * @param {string} name - Validator name
   * @param {Function} validator - Validator function
   */
  addCustomValidator(name, validator) {
    this.customValidators.set(name, validator);
  }

  /**
   * Add data transformer
   * @param {string} name - Transformer name
   * @param {Function} transformer - Transformer function
   */
  addTransformer(name, transformer) {
    this.transformers.set(name, transformer);
  }

  /**
   * Set custom error message
   * @param {string} rule - Rule name
   * @param {string} message - Error message
   */
  setErrorMessage(rule, message) {
    this.errorMessages.set(rule, message);
  }

  /**
   * Validate data against schema
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @returns {Object} Validation result
   */
  validate(data, schema = null) {
    const validationSchema = schema || this.rules;
    const errors = {};
    const sanitized = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(validationSchema)) {
      const value = data[field];
      const fieldErrors = [];
      let fieldValue = value;

      // Apply transformers first
      if (fieldRules.transform) {
        const transformers = Array.isArray(fieldRules.transform) 
          ? fieldRules.transform 
          : [fieldRules.transform];

        for (const transformerName of transformers) {
          if (this.transformers.has(transformerName)) {
            fieldValue = this.transformers.get(transformerName)(fieldValue, data);
          }
        }
      }

      // Apply validation rules
      for (const [rule, ruleValue] of Object.entries(fieldRules)) {
        if (rule === 'transform') continue;

        const validationResult = this.validateField(fieldValue, rule, ruleValue, data);
        
        if (!validationResult.isValid) {
          fieldErrors.push(validationResult.message);
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
        isValid = false;
      } else {
        sanitized[field] = fieldValue;
      }
    }

    return {
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : null,
      sanitized
    };
  }

  /**
   * Validate individual field
   * @param {*} value - Field value
   * @param {string} rule - Validation rule
   * @param {*} ruleValue - Rule value
   * @param {Object} data - Full data object
   * @returns {Object} Validation result
   */
  validateField(value, rule, ruleValue, data) {
    switch (rule) {
      case 'required':
        if (ruleValue && (value === undefined || value === null || value === '')) {
          return { 
            isValid: false, 
            message: this.getErrorMessage('required', 'This field is required') 
          };
        }
        break;

      case 'type':
        if (value !== undefined && value !== null) {
          const expectedType = ruleValue;
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          
          if (actualType !== expectedType) {
            return { 
              isValid: false, 
              message: this.getErrorMessage('type', `Expected ${expectedType}, got ${actualType}`) 
            };
          }
        }
        break;

      case 'min':
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value.length < ruleValue) {
            return { 
              isValid: false, 
              message: this.getErrorMessage('min', `Minimum length is ${ruleValue}`) 
            };
          }
          if (typeof value === 'number' && value < ruleValue) {
            return { 
              isValid: false, 
              message: this.getErrorMessage('min', `Minimum value is ${ruleValue}`) 
            };
          }
        }
        break;

      case 'max':
        if (value !== undefined && value !== null) {
          if (typeof value === 'string' && value.length > ruleValue) {
            return { 
              isValid: false, 
              message: this.getErrorMessage('max', `Maximum length is ${ruleValue}`) 
            };
          }
          if (typeof value === 'number' && value > ruleValue) {
            return { 
              isValid: false, 
              message: this.getErrorMessage('max', `Maximum value is ${ruleValue}`) 
            };
          }
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { 
            isValid: false, 
            message: this.getErrorMessage('email', 'Invalid email format') 
          };
        }
        break;

      case 'url':
        if (value && !/^https?:\/\/.+/.test(value)) {
          return { 
            isValid: false, 
            message: this.getErrorMessage('url', 'Invalid URL format') 
          };
        }
        break;

      case 'pattern':
        if (value && !ruleValue.test(value)) {
          return { 
            isValid: false, 
            message: this.getErrorMessage('pattern', 'Invalid format') 
          };
        }
        break;

      case 'enum':
        if (value && !ruleValue.includes(value)) {
          return { 
            isValid: false, 
            message: this.getErrorMessage('enum', `Must be one of: ${ruleValue.join(', ')}`) 
          };
        }
        break;

      case 'custom':
        if (this.customValidators.has(ruleValue)) {
          const validator = this.customValidators.get(ruleValue);
          const result = validator(value, data);
          if (!result.isValid) {
            return result;
          }
        }
        break;

      case 'nested':
        if (value && typeof value === 'object') {
          const nestedValidator = new SchemaValidator();
          Object.entries(ruleValue).forEach(([nestedField, nestedRules]) => {
            nestedValidator.addRule(nestedField, nestedRules);
          });
          
          const nestedResult = nestedValidator.validate(value);
          if (!nestedResult.isValid) {
            return { 
              isValid: false, 
              message: this.getErrorMessage('nested', 'Nested validation failed') 
            };
          }
        }
        break;
    }

    return { isValid: true };
  }

  /**
   * Get error message
   * @param {string} rule - Rule name
   * @param {string} defaultMessage - Default message
   * @returns {string} Error message
   */
  getErrorMessage(rule, defaultMessage) {
    return this.errorMessages.get(rule) || defaultMessage;
  }
}

/**
 * Data sanitizer for cleaning and normalizing input data
 */
class DataSanitizer {
  constructor() {
    this.sanitizers = new Map();
  }

  /**
   * Add sanitizer
   * @param {string} name - Sanitizer name
   * @param {Function} sanitizer - Sanitizer function
   */
  addSanitizer(name, sanitizer) {
    this.sanitizers.set(name, sanitizer);
  }

  /**
   * Sanitize data
   * @param {Object} data - Data to sanitize
   * @param {Object} rules - Sanitization rules
   * @returns {Object} Sanitized data
   */
  sanitize(data, rules) {
    const sanitized = {};

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = data[field];
      let sanitizedValue = value;

      for (const [sanitizerName, sanitizerOptions] of Object.entries(fieldRules)) {
        if (this.sanitizers.has(sanitizerName)) {
          const sanitizer = this.sanitizers.get(sanitizerName);
          sanitizedValue = sanitizer(sanitizedValue, sanitizerOptions);
        }
      }

      sanitized[field] = sanitizedValue;
    }

    return sanitized;
  }

  /**
   * Trim whitespace
   * @param {string} value - Value to trim
   * @returns {string} Trimmed value
   */
  trim(value) {
    return typeof value === 'string' ? value.trim() : value;
  }

  /**
   * Convert to lowercase
   * @param {string} value - Value to convert
   * @returns {string} Lowercase value
   */
  toLowerCase(value) {
    return typeof value === 'string' ? value.toLowerCase() : value;
  }

  /**
   * Convert to uppercase
   * @param {string} value - Value to convert
   * @returns {string} Uppercase value
   */
  toUpperCase(value) {
    return typeof value === 'string' ? value.toUpperCase() : value;
  }

  /**
   * Remove HTML tags
   * @param {string} value - Value to clean
   * @returns {string} Cleaned value
   */
  stripHtml(value) {
    return typeof value === 'string' 
      ? value.replace(/<[^>]*>/g, '') 
      : value;
  }

  /**
   * Escape HTML entities
   * @param {string} value - Value to escape
   * @returns {string} Escaped value
   */
  escapeHtml(value) {
    if (typeof value !== 'string') return value;
    
    const htmlEntities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return value.replace(/[&<>"'/]/g, char => htmlEntities[char]);
  }

  /**
   * Convert to number
   * @param {*} value - Value to convert
   * @returns {number} Number value
   */
  toNumber(value) {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Convert to boolean
   * @param {*} value - Value to convert
   * @returns {boolean} Boolean value
   */
  toBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    return Boolean(value);
  }
}

/**
 * Validation middleware for Express applications
 */
class ValidationMiddleware {
  constructor() {
    this.validator = new SchemaValidator();
    this.sanitizer = new DataSanitizer();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Create validation middleware
   * @param {Object} schema - Validation schema
   * @param {Object} sanitizationRules - Sanitization rules
   * @returns {Function} Express middleware
   */
  createMiddleware(schema, sanitizationRules = {}) {
    return (req, res, next) => {
      const data = {
        ...req.body,
        ...req.query,
        ...req.params
      };

      // Sanitize data first
      let sanitizedData = data;
      if (Object.keys(sanitizationRules).length > 0) {
        sanitizedData = this.sanitizer.sanitize(data, sanitizationRules);
      }

      // Validate data
      const validationResult = this.validator.validate(sanitizedData, schema);

      if (!validationResult.isValid) {
        this.eventEmitter.emit('validation-error', {
          errors: validationResult.errors,
          originalData: data,
          sanitizedData
        });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationResult.errors
        });
      }

      // Add sanitized data to request
      req.sanitizedData = validationResult.sanitized;
      req.originalData = data;

      this.eventEmitter.emit('validation-success', {
        originalData: data,
        sanitizedData: validationResult.sanitized
      });

      next();
    };
  }

  /**
   * Add validation error handler
   * @param {Function} handler - Error handler function
   */
  onValidationError(handler) {
    this.eventEmitter.on('validation-error', handler);
  }

  /**
   * Add validation success handler
   * @param {Function} handler - Success handler function
   */
  onValidationSuccess(handler) {
    this.eventEmitter.on('validation-success', handler);
  }
}

/**
 * Async validation utilities
 */
class AsyncValidator {
  constructor() {
    this.asyncValidators = new Map();
  }

  /**
   * Add async validator
   * @param {string} name - Validator name
   * @param {Function} validator - Async validator function
   */
  addAsyncValidator(name, validator) {
    this.asyncValidators.set(name, validator);
  }

  /**
   * Validate data asynchronously
   * @param {Object} data - Data to validate
   * @param {Object} schema - Validation schema
   * @returns {Promise<Object>} Validation result
   */
  async validate(data, schema) {
    const errors = {};
    let isValid = true;

    for (const [field, fieldRules] of Object.entries(schema)) {
      const value = data[field];
      const fieldErrors = [];

      for (const [rule, ruleValue] of Object.entries(fieldRules)) {
        if (this.asyncValidators.has(rule)) {
          try {
            const validator = this.asyncValidators.get(rule);
            const result = await validator(value, ruleValue, data);
            
            if (!result.isValid) {
              fieldErrors.push(result.message);
            }
          } catch (error) {
            fieldErrors.push(`Validation error: ${error.message}`);
          }
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors;
        isValid = false;
      }
    }

    return {
      isValid,
      errors: Object.keys(errors).length > 0 ? errors : null
    };
  }
}

/**
 * Validation utilities
 */
const validationUtils = {
  /**
   * Check if value is required
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is required
   */
  isRequired(value) {
    return value !== undefined && value !== null && value !== '';
  },

  /**
   * Check if value is email
   * @param {string} value - Value to check
   * @returns {boolean} Whether value is valid email
   */
  isEmail(value) {
    if (!value) return true; // Allow empty values
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  },

  /**
   * Check if value is URL
   * @param {string} value - Value to check
   * @returns {boolean} Whether value is valid URL
   */
  isUrl(value) {
    if (!value) return true; // Allow empty values
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Check if value is numeric
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is numeric
   */
  isNumeric(value) {
    if (value === null || value === undefined || value === '') return true;
    return !isNaN(Number(value));
  },

  /**
   * Check if value is integer
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is integer
   */
  isInteger(value) {
    if (value === null || value === undefined || value === '') return true;
    return Number.isInteger(Number(value));
  },

  /**
   * Check if value is in range
   * @param {number} value - Value to check
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {boolean} Whether value is in range
   */
  isInRange(value, min, max) {
    if (value === null || value === undefined || value === '') return true;
    const num = Number(value);
    return num >= min && num <= max;
  },

  /**
   * Check if value matches pattern
   * @param {string} value - Value to check
   * @param {RegExp} pattern - Pattern to match
   * @returns {boolean} Whether value matches pattern
   */
  matchesPattern(value, pattern) {
    if (!value) return true; // Allow empty values
    return pattern.test(value);
  },

  /**
   * Check if value is in enum
   * @param {*} value - Value to check
   * @param {Array} enumValues - Allowed values
   * @returns {boolean} Whether value is in enum
   */
  isInEnum(value, enumValues) {
    if (value === null || value === undefined || value === '') return true;
    return enumValues.includes(value);
  },

  /**
   * Check if value has minimum length
   * @param {string} value - Value to check
   * @param {number} minLength - Minimum length
   * @returns {boolean} Whether value has minimum length
   */
  hasMinLength(value, minLength) {
    if (!value) return true; // Allow empty values
    return value.length >= minLength;
  },

  /**
   * Check if value has maximum length
   * @param {string} value - Value to check
   * @param {number} maxLength - Maximum length
   * @returns {boolean} Whether value has maximum length
   */
  hasMaxLength(value, maxLength) {
    if (!value) return true; // Allow empty values
    return value.length <= maxLength;
  },

  /**
   * Check if value is date
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is valid date
   */
  isDate(value) {
    if (!value) return true; // Allow empty values
    const date = new Date(value);
    return !isNaN(date.getTime());
  },

  /**
   * Check if value is future date
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is future date
   */
  isFutureDate(value) {
    if (!value) return true; // Allow empty values
    const date = new Date(value);
    return !isNaN(date.getTime()) && date > new Date();
  },

  /**
   * Check if value is past date
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is past date
   */
  isPastDate(value) {
    if (!value) return true; // Allow empty values
    const date = new Date(value);
    return !isNaN(date.getTime()) && date < new Date();
  },

  /**
   * Check if value is array
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is array
   */
  isArray(value) {
    return Array.isArray(value);
  },

  /**
   * Check if value is object
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is object
   */
  isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  /**
   * Check if value is empty
   * @param {*} value - Value to check
   * @returns {boolean} Whether value is empty
   */
  isEmpty(value) {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }
};

module.exports = {
  SchemaValidator,
  DataSanitizer,
  ValidationMiddleware,
  AsyncValidator,
  validationUtils
};
