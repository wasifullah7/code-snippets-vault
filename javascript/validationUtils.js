/**
 * Validation utility functions for form validation and data validation
 */

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
 * Validate phone number
 * @param {string} phone - Phone number to validate
 * @param {string} format - Phone format ('us', 'international', 'any')
 * @returns {boolean} True if phone is valid
 */
const isValidPhone = (phone, format = 'any') => {
  if (!phone || typeof phone !== 'string') return false;
  
  const phoneRegex = {
    us: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
    international: /^\+?[1-9]\d{1,14}$/,
    any: /^[\+]?[1-9][\d]{0,15}$/
  };
  
  return phoneRegex[format].test(phone.replace(/\s/g, ''));
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is valid
 */
const isValidUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with score and feedback
 */
const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumbers = true,
    requireSpecialChars = true
  } = options;

  if (!password || typeof password !== 'string') {
    return { isValid: false, score: 0, feedback: ['Password is required'] };
  }

  const feedback = [];
  let score = 0;

  // Length check
  if (password.length < minLength) {
    feedback.push(`Password must be at least ${minLength} characters long`);
  } else {
    score += 1;
  }

  // Uppercase check
  if (requireUppercase && !/[A-Z]/.test(password)) {
    feedback.push('Password must contain at least one uppercase letter');
  } else if (requireUppercase) {
    score += 1;
  }

  // Lowercase check
  if (requireLowercase && !/[a-z]/.test(password)) {
    feedback.push('Password must contain at least one lowercase letter');
  } else if (requireLowercase) {
    score += 1;
  }

  // Numbers check
  if (requireNumbers && !/\d/.test(password)) {
    feedback.push('Password must contain at least one number');
  } else if (requireNumbers) {
    score += 1;
  }

  // Special characters check
  if (requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    feedback.push('Password must contain at least one special character');
  } else if (requireSpecialChars) {
    score += 1;
  }

  // Additional length bonus
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;

  const isValid = feedback.length === 0;
  const strength = score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong';

  return {
    isValid,
    score,
    strength,
    feedback
  };
};

/**
 * Validate credit card number
 * @param {string} cardNumber - Credit card number to validate
 * @returns {Object} Validation result with type and validity
 */
const validateCreditCard = (cardNumber) => {
  if (!cardNumber || typeof cardNumber !== 'string') {
    return { isValid: false, type: 'unknown' };
  }

  const cleanNumber = cardNumber.replace(/\s/g, '');
  
  // Luhn algorithm
  const luhnCheck = (num) => {
    let sum = 0;
    let isEven = false;
    
    for (let i = num.length - 1; i >= 0; i--) {
      let digit = parseInt(num[i]);
      
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

  // Card type detection
  const cardTypes = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
    discover: /^6(?:011|5[0-9]{2})[0-9]{12}$/,
    diners: /^3[0689][0-9]{12}$/,
    jcb: /^(?:2131|1800|35\d{3})\d{11}$/
  };

  let cardType = 'unknown';
  for (const [type, regex] of Object.entries(cardTypes)) {
    if (regex.test(cleanNumber)) {
      cardType = type;
      break;
    }
  }

  const isValid = luhnCheck(cleanNumber) && cardType !== 'unknown';

  return {
    isValid,
    type: cardType,
    formatted: cleanNumber.replace(/(.{4})/g, '$1 ').trim()
  };
};

/**
 * Validate date
 * @param {string|Date} date - Date to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if date is valid
 */
const isValidDate = (date, options = {}) => {
  const { minDate, maxDate, format } = options;
  
  let dateObj;
  
  if (date instanceof Date) {
    dateObj = date;
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else {
    return false;
  }
  
  if (isNaN(dateObj.getTime())) return false;
  
  if (minDate) {
    const min = new Date(minDate);
    if (dateObj < min) return false;
  }
  
  if (maxDate) {
    const max = new Date(maxDate);
    if (dateObj > max) return false;
  }
  
  return true;
};

/**
 * Validate number range
 * @param {number} value - Number to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if number is in valid range
 */
const isValidNumber = (value, options = {}) => {
  const { min, max, integer = false, positive = false } = options;
  
  if (typeof value !== 'number' || isNaN(value)) return false;
  
  if (integer && !Number.isInteger(value)) return false;
  
  if (positive && value <= 0) return false;
  
  if (min !== undefined && value < min) return false;
  
  if (max !== undefined && value > max) return false;
  
  return true;
};

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if string length is valid
 */
const isValidLength = (str, options = {}) => {
  const { min = 0, max = Infinity, exact } = options;
  
  if (typeof str !== 'string') return false;
  
  if (exact !== undefined) {
    return str.length === exact;
  }
  
  return str.length >= min && str.length <= max;
};

/**
 * Validate alphanumeric string
 * @param {string} str - String to validate
 * @param {Object} options - Validation options
 * @returns {boolean} True if string is alphanumeric
 */
const isAlphanumeric = (str, options = {}) => {
  const { allowSpaces = false, allowSpecialChars = false } = options;
  
  if (typeof str !== 'string') return false;
  
  let pattern = '^[a-zA-Z0-9';
  if (allowSpaces) pattern += ' ';
  if (allowSpecialChars) pattern += '\\w\\s';
  pattern += ']+$';
  
  const regex = new RegExp(pattern);
  return regex.test(str);
};

/**
 * Validate IP address
 * @param {string} ip - IP address to validate
 * @param {string} version - IP version ('v4', 'v6', 'any')
 * @returns {boolean} True if IP is valid
 */
const isValidIP = (ip, version = 'any') => {
  if (!ip || typeof ip !== 'string') return false;
  
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  
  switch (version) {
    case 'v4':
      return ipv4Regex.test(ip);
    case 'v6':
      return ipv6Regex.test(ip);
    case 'any':
    default:
      return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  }
};

/**
 * Validate JSON string
 * @param {string} json - JSON string to validate
 * @returns {boolean} True if JSON is valid
 */
const isValidJSON = (json) => {
  if (!json || typeof json !== 'string') return false;
  
  try {
    JSON.parse(json);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate hex color
 * @param {string} color - Hex color to validate
 * @returns {boolean} True if hex color is valid
 */
const isValidHexColor = (color) => {
  if (!color || typeof color !== 'string') return false;
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  return hexRegex.test(color);
};

/**
 * Validate UUID
 * @param {string} uuid - UUID to validate
 * @param {string} version - UUID version ('v1', 'v4', 'any')
 * @returns {boolean} True if UUID is valid
 */
const isValidUUID = (uuid, version = 'any') => {
  if (!uuid || typeof uuid !== 'string') return false;
  
  const uuidRegex = {
    v1: /^[0-9a-f]{8}-[0-9a-f]{4}-1[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    v4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    any: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  };
  
  return uuidRegex[version].test(uuid);
};

/**
 * Validate form data
 * @param {Object} data - Form data to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} Validation result
 */
const validateForm = (data, rules) => {
  const errors = {};
  let isValid = true;
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    const fieldErrors = [];
    
    for (const rule of fieldRules) {
      const { type, message, ...options } = rule;
      
      let result = false;
      
      switch (type) {
        case 'required':
          result = value !== undefined && value !== null && value !== '';
          break;
        case 'email':
          result = isValidEmail(value);
          break;
        case 'phone':
          result = isValidPhone(value, options.format);
          break;
        case 'url':
          result = isValidUrl(value);
          break;
        case 'password':
          result = validatePassword(value, options).isValid;
          break;
        case 'date':
          result = isValidDate(value, options);
          break;
        case 'number':
          result = isValidNumber(value, options);
          break;
        case 'length':
          result = isValidLength(value, options);
          break;
        case 'alphanumeric':
          result = isAlphanumeric(value, options);
          break;
        case 'ip':
          result = isValidIP(value, options.version);
          break;
        case 'json':
          result = isValidJSON(value);
          break;
        case 'hexColor':
          result = isValidHexColor(value);
          break;
        case 'uuid':
          result = isValidUUID(value, options.version);
          break;
        case 'custom':
          result = options.validator ? options.validator(value) : false;
          break;
      }
      
      if (!result) {
        fieldErrors.push(message || `${field} is invalid`);
        isValid = false;
      }
    }
    
    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }
  }
  
  return {
    isValid,
    errors
  };
};

module.exports = {
  isValidEmail,
  isValidPhone,
  isValidUrl,
  validatePassword,
  validateCreditCard,
  isValidDate,
  isValidNumber,
  isValidLength,
  isAlphanumeric,
  isValidIP,
  isValidJSON,
  isValidHexColor,
  isValidUUID,
  validateForm
};