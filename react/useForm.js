import { useCallback, useEffect, useState } from 'react';

/**
 * useForm - form state management hook
 * @param {Object} initialValues - Initial form values
 * @param {Object} validation - Validation rules
 * @param {Function} onSubmit - Submit handler
 * @returns {Object} Form state and handlers
 */
export default function useForm(initialValues = {}, validation = {}, onSubmit) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Validation function
  const validateField = useCallback((name, value) => {
    const rules = validation[name];
    if (!rules) return '';

    for (const rule of rules) {
      const error = rule(value, values);
      if (error) return error;
    }
    return '';
  }, [validation, values]);

  // Validate all fields
  const validateForm = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(values).forEach(key => {
      const error = validateField(key, values[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validateField]);

  // Set field value
  const setValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  // Set field touched
  const setTouchedField = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  // Handle input change
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  }, [setValue]);

  // Handle input blur
  const handleBlur = useCallback((e) => {
    const { name, value } = e.target;
    setTouchedField(name);
    
    // Validate field on blur
    const error = validateField(name, value);
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [setTouchedField, validateField]);

  // Handle form submit
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    
    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(values).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    // Validate form
    const isValid = validateForm();
    
    if (isValid && onSubmit) {
      try {
        await onSubmit(values, { setFieldError, setFieldValue, resetForm });
      } catch (error) {
        console.error('Form submission error:', error);
      }
    }
    
    setIsSubmitting(false);
  }, [values, validateForm, onSubmit]);

  // Reset form
  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setSubmitCount(0);
  }, [initialValues]);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Set field value (external)
  const setFieldValue = useCallback((name, value) => {
    setValue(name, value);
  }, [setValue]);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 || 
    Object.values(errors).every(error => error === '');

  // Check if form is dirty
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    submitCount,
    isValid,
    isDirty,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    setValue,
    setFieldValue,
    setFieldError,
    setTouchedField,
    validateField,
    validateForm
  };
}

// Common validation rules
export const validationRules = {
  required: (message = 'This field is required') => (value) => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return message;
    }
    return '';
  },

  email: (message = 'Please enter a valid email') => (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return message;
    }
    return '';
  },

  minLength: (min, message) => (value) => {
    if (value && value.length < min) {
      return message || `Must be at least ${min} characters`;
    }
    return '';
  },

  maxLength: (max, message) => (value) => {
    if (value && value.length > max) {
      return message || `Must be no more than ${max} characters`;
    }
    return '';
  },

  pattern: (regex, message = 'Invalid format') => (value) => {
    if (value && !regex.test(value)) {
      return message;
    }
    return '';
  },

  min: (min, message) => (value) => {
    if (value && Number(value) < min) {
      return message || `Must be at least ${min}`;
    }
    return '';
  },

  max: (max, message) => (value) => {
    if (value && Number(value) > max) {
      return message || `Must be no more than ${max}`;
    }
    return '';
  },

  match: (matchValue, message = 'Values do not match') => (value) => {
    if (value !== matchValue) {
      return message;
    }
    return '';
  },

  custom: (validator, message) => (value) => {
    try {
      const result = validator(value);
      if (result === false) {
        return message || 'Invalid value';
      }
      return '';
    } catch (error) {
      return message || 'Validation error';
    }
  }
};