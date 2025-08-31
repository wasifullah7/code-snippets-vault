import { useState, useCallback } from 'react';

/**
 * React hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules
 * @returns {Object} Validation state and functions
 */
const useValidation = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Validation functions
  const isValidEmail = useCallback((email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const validatePassword = useCallback((password) => {
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
  }, []);

  const isValidPhone = useCallback((phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  }, []);

  const isValidUrl = useCallback((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isRequired = useCallback((value) => {
    if (typeof value === 'string') {
      return value.trim().length > 0;
    }
    return value !== null && value !== undefined;
  }, []);

  const hasMinLength = useCallback((value, minLength) => {
    return value && value.length >= minLength;
  }, []);

  const hasMaxLength = useCallback((value, maxLength) => {
    return value && value.length <= maxLength;
  }, []);

  const isInRange = useCallback((value, min, max) => {
    return value >= min && value <= max;
  }, []);

  // Validate single field
  const validateField = useCallback((name, value, rules) => {
    if (!rules) return null;

    const fieldRules = rules[name];
    if (!fieldRules) return null;

    const fieldErrors = [];

    // Required validation
    if (fieldRules.required && !isRequired(value)) {
      fieldErrors.push(fieldRules.requiredMessage || `${name} is required`);
    }

    // Email validation
    if (fieldRules.email && value && !isValidEmail(value)) {
      fieldErrors.push(fieldRules.emailMessage || 'Invalid email format');
    }

    // Password validation
    if (fieldRules.password && value) {
      const passwordResult = validatePassword(value);
      if (!passwordResult.isValid) {
        fieldErrors.push(fieldRules.passwordMessage || 'Password does not meet requirements');
      }
    }

    // Phone validation
    if (fieldRules.phone && value && !isValidPhone(value)) {
      fieldErrors.push(fieldRules.phoneMessage || 'Invalid phone number');
    }

    // URL validation
    if (fieldRules.url && value && !isValidUrl(value)) {
      fieldErrors.push(fieldRules.urlMessage || 'Invalid URL format');
    }

    // Min length validation
    if (fieldRules.minLength && !hasMinLength(value, fieldRules.minLength)) {
      fieldErrors.push(fieldRules.minLengthMessage || `${name} must be at least ${fieldRules.minLength} characters`);
    }

    // Max length validation
    if (fieldRules.maxLength && !hasMaxLength(value, fieldRules.maxLength)) {
      fieldErrors.push(fieldRules.maxLengthMessage || `${name} must be no more than ${fieldRules.maxLength} characters`);
    }

    // Range validation
    if (fieldRules.range && !isInRange(value, fieldRules.range.min, fieldRules.range.max)) {
      fieldErrors.push(fieldRules.rangeMessage || `${name} must be between ${fieldRules.range.min} and ${fieldRules.range.max}`);
    }

    // Custom validation
    if (fieldRules.custom && typeof fieldRules.custom === 'function') {
      const customError = fieldRules.custom(value, values);
      if (customError) {
        fieldErrors.push(customError);
      }
    }

    return fieldErrors.length > 0 ? fieldErrors : null;
  }, [isRequired, isValidEmail, validatePassword, isValidPhone, isValidUrl, hasMinLength, hasMaxLength, isInRange, values]);

  // Update field value
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Validate field if touched
    if (touched[name]) {
      const fieldErrors = validateField(name, value, validationRules);
      setErrors(prev => ({ ...prev, [name]: fieldErrors }));
    }
  }, [touched, validateField, validationRules]);

  // Mark field as touched
  const setTouchedField = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    // Validate field
    const fieldErrors = validateField(name, values[name], validationRules);
    setErrors(prev => ({ ...prev, [name]: fieldErrors }));
  }, [values, validateField, validationRules]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(name => {
      const fieldErrors = validateField(name, values[name], validationRules);
      if (fieldErrors) {
        newErrors[name] = fieldErrors;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules, validateField]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    setValue,
    setTouchedField,
    validateForm,
    resetForm,
    isFormValid: isFormValid(),
    isValidEmail,
    validatePassword,
    isValidPhone,
    isValidUrl,
    isRequired,
    hasMinLength,
    hasMaxLength,
    isInRange
  };
};

export default useValidation;
