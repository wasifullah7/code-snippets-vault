import { useState, useCallback, useEffect } from 'react';

/**
 * React hook for form validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationRules - Validation rules
 * @param {Object} options - Hook options
 * @returns {Object} Validation state and functions
 */
const useValidation = (initialValues = {}, validationRules = {}, options = {}) => {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    debounceMs = 300
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Validation functions
  const isValidEmail = useCallback((email) => {
    if (!email || typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const isValidPhone = useCallback((phone, format = 'any') => {
    if (!phone || typeof phone !== 'string') return false;
    
    const phoneRegex = {
      us: /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/,
      international: /^\+?[1-9]\d{1,14}$/,
      any: /^[\+]?[1-9][\d]{0,15}$/
    };
    
    return phoneRegex[format].test(phone.replace(/\s/g, ''));
  }, []);

  const isValidUrl = useCallback((url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, []);

  const validatePassword = useCallback((password, options = {}) => {
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
  }, []);

  const isValidDate = useCallback((date, options = {}) => {
    const { minDate, maxDate } = options;
    
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
  }, []);

  const isValidNumber = useCallback((value, options = {}) => {
    const { min, max, integer = false, positive = false } = options;
    
    if (typeof value !== 'number' || isNaN(value)) return false;
    
    if (integer && !Number.isInteger(value)) return false;
    
    if (positive && value <= 0) return false;
    
    if (min !== undefined && value < min) return false;
    
    if (max !== undefined && value > max) return false;
    
    return true;
  }, []);

  const isValidLength = useCallback((str, options = {}) => {
    const { min = 0, max = Infinity, exact } = options;
    
    if (typeof str !== 'string') return false;
    
    if (exact !== undefined) {
      return str.length === exact;
    }
    
    return str.length >= min && str.length <= max;
  }, []);

  const isValidIP = useCallback((ip, version = 'any') => {
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
  }, []);

  const isValidHexColor = useCallback((color) => {
    if (!color || typeof color !== 'string') return false;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }, []);

  // Validate single field
  const validateField = useCallback((fieldName, value, rules) => {
    if (!rules || rules.length === 0) return [];

    const fieldErrors = [];

    for (const rule of rules) {
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
        case 'ip':
          result = isValidIP(value, options.version);
          break;
        case 'hexColor':
          result = isValidHexColor(value);
          break;
        case 'custom':
          result = options.validator ? options.validator(value) : false;
          break;
      }
      
      if (!result) {
        fieldErrors.push(message || `${fieldName} is invalid`);
      }
    }
    
    return fieldErrors;
  }, [isValidEmail, isValidPhone, isValidUrl, validatePassword, isValidDate, isValidNumber, isValidLength, isValidIP, isValidHexColor]);

  // Validate all fields
  const validateAll = useCallback(() => {
    setIsValidating(true);
    const newErrors = {};
    let formIsValid = true;

    for (const [fieldName, fieldRules] of Object.entries(validationRules)) {
      const value = values[fieldName];
      const fieldErrors = validateField(fieldName, value, fieldRules);
      
      if (fieldErrors.length > 0) {
        newErrors[fieldName] = fieldErrors;
        formIsValid = false;
      }
    }

    setErrors(newErrors);
    setIsValid(formIsValid);
    setIsValidating(false);
    
    return { isValid: formIsValid, errors: newErrors };
  }, [values, validationRules, validateField]);

  // Debounced validation
  const debouncedValidate = useCallback(() => {
    const timeoutId = setTimeout(() => {
      validateAll();
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [validateAll, debounceMs]);

  // Set field value
  const setFieldValue = useCallback((fieldName, value) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (validateOnChange) {
      debouncedValidate();
    }
  }, [validateOnChange, debouncedValidate]);

  // Set field touched
  const setFieldTouched = useCallback((fieldName, isTouched = true) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: isTouched
    }));

    if (validateOnBlur && isTouched) {
      const fieldRules = validationRules[fieldName];
      if (fieldRules) {
        const fieldErrors = validateField(fieldName, values[fieldName], fieldRules);
        setErrors(prev => ({
          ...prev,
          [fieldName]: fieldErrors
        }));
      }
    }
  }, [validateOnBlur, validationRules, values, validateField]);

  // Handle input change
  const handleChange = useCallback((fieldName) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setFieldValue(fieldName, value);
  }, [setFieldValue]);

  // Handle input blur
  const handleBlur = useCallback((fieldName) => () => {
    setFieldTouched(fieldName, true);
  }, [setFieldTouched]);

  // Handle form submit
  const handleSubmit = useCallback((onSubmit) => (event) => {
    event.preventDefault();
    
    if (validateOnSubmit) {
      const validationResult = validateAll();
      if (validationResult.isValid) {
        onSubmit(values);
      }
    } else {
      onSubmit(values);
    }
  }, [validateOnSubmit, validateAll, values]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsValid(false);
    setIsValidating(false);
  }, [initialValues]);

  // Set form values
  const setFormValues = useCallback((newValues) => {
    setValues(newValues);
    if (validateOnChange) {
      debouncedValidate();
    }
  }, [validateOnChange, debouncedValidate]);

  // Get field error
  const getFieldError = useCallback((fieldName) => {
    return errors[fieldName] ? errors[fieldName][0] : null;
  }, [errors]);

  // Check if field has error
  const hasFieldError = useCallback((fieldName) => {
    return errors[fieldName] && errors[fieldName].length > 0;
  }, [errors]);

  // Check if field is touched
  const isFieldTouched = useCallback((fieldName) => {
    return touched[fieldName] || false;
  }, [touched]);

  // Check if field should show error
  const shouldShowFieldError = useCallback((fieldName) => {
    return isFieldTouched(fieldName) && hasFieldError(fieldName);
  }, [isFieldTouched, hasFieldError]);

  // Get all field errors
  const getAllErrors = useCallback(() => {
    return errors;
  }, [errors]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return isValid && Object.keys(errors).length === 0;
  }, [isValid, errors]);

  // Validate specific field
  const validateSpecificField = useCallback((fieldName) => {
    const fieldRules = validationRules[fieldName];
    if (fieldRules) {
      const fieldErrors = validateField(fieldName, values[fieldName], fieldRules);
      setErrors(prev => ({
        ...prev,
        [fieldName]: fieldErrors
      }));
      return fieldErrors.length === 0;
    }
    return true;
  }, [validationRules, values, validateField]);

  // Effect to validate on mount
  useEffect(() => {
    if (Object.keys(validationRules).length > 0) {
      validateAll();
    }
  }, [validateAll]);

  return {
    // State
    values,
    errors,
    touched,
    isValidating,
    isValid,
    
    // Form operations
    setFieldValue,
    setFieldTouched,
    setFormValues,
    resetForm,
    
    // Validation
    validateAll,
    validateSpecificField,
    
    // Event handlers
    handleChange,
    handleBlur,
    handleSubmit,
    
    // Field utilities
    getFieldError,
    hasFieldError,
    isFieldTouched,
    shouldShowFieldError,
    getAllErrors,
    isFormValid,
    
    // Validation functions
    isValidEmail,
    isValidPhone,
    isValidUrl,
    validatePassword,
    isValidDate,
    isValidNumber,
    isValidLength,
    isValidIP,
    isValidHexColor
  };
};

export default useValidation;