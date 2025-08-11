/**
 * Advanced email validation utility with multiple validation levels
 * @param {string} email - Email address to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.strict - Use strict validation (default: false)
 * @param {boolean} options.checkDisposable - Check for disposable emails (default: false)
 * @param {boolean} options.checkMX - Check MX records (default: false)
 * @param {Array} options.allowedDomains - List of allowed domains
 * @param {Array} options.blockedDomains - List of blocked domains
 * @returns {Object} Validation result with details
 */
const dns = require('dns').promises;

async function validateEmail(email, options = {}) {
  const {
    strict = false,
    checkDisposable = false,
    checkMX = false,
    allowedDomains = [],
    blockedDomains = []
  } = options;

  const result = {
    isValid: false,
    email: email,
    errors: [],
    warnings: [],
    details: {}
  };

  try {
    // Basic format validation
    if (!email || typeof email !== 'string') {
      result.errors.push('Email is required and must be a string');
      return result;
    }

    // Trim whitespace
    email = email.trim().toLowerCase();

    // Basic regex validation
    const emailRegex = strict 
      ? /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
      : /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      result.errors.push('Invalid email format');
      return result;
    }

    // Extract domain
    const domain = email.split('@')[1];
    result.details.domain = domain;

    // Check domain length
    if (domain.length > 253) {
      result.errors.push('Domain name too long');
      return result;
    }

    // Check local part length
    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      result.errors.push('Local part too long');
      return result;
    }

    // Check allowed/blocked domains
    if (allowedDomains.length > 0 && !allowedDomains.includes(domain)) {
      result.errors.push('Domain not in allowed list');
      return result;
    }

    if (blockedDomains.includes(domain)) {
      result.errors.push('Domain is blocked');
      return result;
    }

    // Check for disposable email domains (basic list)
    if (checkDisposable) {
      const disposableDomains = [
        '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
        'mailinator.com', 'yopmail.com', 'throwaway.email'
      ];
      
      if (disposableDomains.includes(domain)) {
        result.warnings.push('Disposable email detected');
      }
    }

    // Check MX records
    if (checkMX) {
      try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords.length === 0) {
          result.errors.push('No MX records found for domain');
          return result;
        }
        result.details.mxRecords = mxRecords;
      } catch (error) {
        result.errors.push('Failed to resolve MX records');
        return result;
      }
    }

    // Additional strict validations
    if (strict) {
      // Check for consecutive dots
      if (email.includes('..')) {
        result.errors.push('Consecutive dots not allowed');
        return result;
      }

      // Check for invalid characters in domain
      if (!/^[a-zA-Z0-9.-]+$/.test(domain)) {
        result.errors.push('Invalid characters in domain');
        return result;
      }

      // Check domain starts/ends with valid character
      if (!/^[a-zA-Z0-9]/.test(domain) || !/[a-zA-Z0-9]$/.test(domain)) {
        result.errors.push('Domain must start and end with alphanumeric character');
        return result;
      }
    }

    // If we get here, email is valid
    result.isValid = true;
    result.details.validationLevel = strict ? 'strict' : 'basic';
    result.details.checksPerformed = {
      format: true,
      domainLength: true,
      localPartLength: true,
      allowedDomains: allowedDomains.length > 0,
      blockedDomains: blockedDomains.length > 0,
      disposableCheck: checkDisposable,
      mxCheck: checkMX,
      strictValidation: strict
    };

  } catch (error) {
    result.errors.push(`Validation error: ${error.message}`);
  }

  return result;
}

// Example usage:
// const validateUserEmail = async (email) => {
//   const result = await validateEmail(email, {
//     strict: true,
//     checkDisposable: true,
//     checkMX: true,
//     allowedDomains: ['company.com', 'partner.com'],
//     blockedDomains: ['spam.com']
//   });
//   
//   if (!result.isValid) {
//     console.log('Email validation failed:', result.errors);
//     return false;
//   }
//   
//   if (result.warnings.length > 0) {
//     console.log('Email warnings:', result.warnings);
//   }
//   
//   return true;
// };

module.exports = validateEmail;