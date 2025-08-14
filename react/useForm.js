/**
 * Custom React hook for form state management with validation
 * @param {Object} initialValues - Initial form values
 * @param {Object} validationSchema - Validation schema (optional)
 * @param {Function} onSubmit - Form submission handler
 * @param {Object} options - Configuration options
 * @param {boolean} options.validateOnChange - Validate on value change (default: true)
 * @param {boolean} options.validateOnBlur - Validate on field blur (default: true)
 * @param {boolean} options.validateOnSubmit - Validate on form submission (default: true)
 * @returns {Object} Form state and utilities
 */
import { useState, useCallback, useEffect } from 'react';

function useForm(initialValues = {}, validationSchema = null, onSubmit = null, options = {}) {
  const {
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true
  } = options;

  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [isDirty, setIsDirty] = useState(false);

  // Check if form is dirty
  useEffect(() => {
    const dirty = Object.keys(values).some(key => 
      JSON.stringify(values[key]) !== JSON.stringify(initialValues[key])
    );
    setIsDirty(dirty);
  }, [values, initialValues]);

  // Validate single field
  const validateField = useCallback((name, value) => {
    if (!validationSchema || !validationSchema[name]) return '';

    const fieldValidation = validationSchema[name];
    let error = '';

    // Required validation
    if (fieldValidation.required && (!value || value.toString().trim() === '')) {
      error = fieldValidation.required === true ? `${name} is required` : fieldValidation.required;
    }

    // Min length validation
    if (!error && fieldValidation.minLength && value && value.toString().length < fieldValidation.minLength) {
      error = fieldValidation.minLengthMessage || `${name} must be at least ${fieldValidation.minLength} characters`;
    }

    // Max length validation
    if (!error && fieldValidation.maxLength && value && value.toString().length > fieldValidation.maxLength) {
      error = fieldValidation.maxLengthMessage || `${name} must be no more than ${fieldValidation.maxLength} characters`;
    }

    // Pattern validation
    if (!error && fieldValidation.pattern && value && !fieldValidation.pattern.test(value)) {
      error = fieldValidation.patternMessage || `${name} format is invalid`;
    }

    // Custom validation
    if (!error && fieldValidation.validate) {
      const customError = fieldValidation.validate(value, values);
      if (customError) error = customError;
    }

    return error;
  }, [validationSchema, values]);

  // Validate all fields
  const validateForm = useCallback(() => {
    if (!validationSchema) return {};

    const newErrors = {};
    Object.keys(validationSchema).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName] || '');
      if (error) {
        newErrors[fieldName] = error;
      }
    });

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0);
    return newErrors;
  }, [validationSchema, validateField, values]);

  // Handle field change
  const handleChange = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (validateOnChange) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateOnChange, validateField]);

  // Handle field blur
  const handleBlur = useCallback((name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const error = validateField(name, values[name]);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  }, [validateOnBlur, validateField, values]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Mark all fields as touched
      const allTouched = {};
      Object.keys(initialValues).forEach(key => {
        allTouched[key] = true;
      });
      setTouched(allTouched);

      // Validate form
      let formErrors = {};
      if (validateOnSubmit) {
        formErrors = validateForm();
      }

      if (Object.keys(formErrors).length === 0) {
        if (onSubmit) {
          await onSubmit(values, { setSubmitting: setIsSubmitting });
        }
      } else {
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setIsSubmitting(false);
    }
  }, [validateOnSubmit, validateForm, onSubmit, values, initialValues]);

  // Reset form
  const resetForm = useCallback((newValues = initialValues) => {
    setValues(newValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
    setIsValid(true);
    setIsDirty(false);
  }, [initialValues]);

  // Set field value
  const setFieldValue = useCallback((name, value) => {
    handleChange(name, value);
  }, [handleChange]);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  // Set field touched
  const setFieldTouched = useCallback((name, touched = true) => {
    setTouched(prev => ({ ...prev, [name]: touched }));
  }, []);

  // Get field props for input elements
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: (e) => handleChange(name, e.target.value),
      onBlur: () => handleBlur(name),
      error: errors[name],
      touched: touched[name]
    };
  }, [values, errors, touched, handleChange, handleBlur]);

  // Check if field has error
  const hasError = useCallback((name) => {
    return !!(errors[name] && touched[name]);
  }, [errors, touched]);

  // Get field error message
  const getFieldError = useCallback((name) => {
    return hasError(name) ? errors[name] : '';
  }, [hasError, errors]);

  // Check if form is valid
  const isFormValid = useCallback(() => {
    return Object.keys(errors).length === 0 && Object.keys(values).length > 0;
  }, [errors, values]);

  // Get form state summary
  const getFormState = useCallback(() => {
    return {
      values,
      errors,
      touched,
      isSubmitting,
      isValid: isFormValid(),
      isDirty,
      hasErrors: Object.keys(errors).length > 0,
      errorCount: Object.keys(errors).length,
      touchedCount: Object.keys(touched).filter(key => touched[key]).length
    };
  }, [values, errors, touched, isSubmitting, isFormValid, isDirty]);

  return {
    // Form state
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    
    // Form handlers
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    
    // Field utilities
    setFieldValue,
    setFieldError,
    setFieldTouched,
    getFieldProps,
    hasError,
    getFieldError,
    
    // Form utilities
    validateForm,
    isFormValid,
    getFormState
  };
}

// Example validation schema:
// const validationSchema = {
//   email: {
//     required: 'Email is required',
//     pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
//     patternMessage: 'Please enter a valid email address'
//   },
//   password: {
//     required: 'Password is required',
//     minLength: 8,
//     minLengthMessage: 'Password must be at least 8 characters',
//     validate: (value) => {
//       if (!/(?=.*[a-z])/.test(value)) return 'Password must contain at least one lowercase letter';
//       if (!/(?=.*[A-Z])/.test(value)) return 'Password must contain at least one uppercase letter';
//       if (!/(?=.*\d)/.test(value)) return 'Password must contain at least one number';
//       return '';
//     }
//   },
//   confirmPassword: {
//     required: 'Please confirm your password',
//     validate: (value, values) => {
//       return value !== values.password ? 'Passwords do not match' : '';
//     }
//   }
// };

// Example usage:
// function LoginForm() {
//   const form = useForm(
//     { email: '', password: '' },
//     validationSchema,
//     async (values, { setSubmitting }) => {
//       try {
//         await loginUser(values);
//         console.log('Login successful');
//       } catch (error) {
//         console.error('Login failed:', error);
//       } finally {
//         setSubmitting(false);
//       }
//     }
//   );
//
//   const { values, errors, isSubmitting, handleSubmit, getFieldProps, hasError } = form;
//
//   return (
//     <form onSubmit={handleSubmit}>
//       <div>
//         <input
//           {...getFieldProps('email')}
//           type="email"
//           placeholder="Email"
//         />
//         {hasError('email') && <span className="error">{errors.email}</span>}
//       </div>
//
//       <div>
//         <input
//           {...getFieldProps('password')}
//           type="password"
//           placeholder="Password"
//         />
//         {hasError('password') && <span className="error">{errors.password}</span>}
//       </div>
//
//       <button type="submit" disabled={isSubmitting}>
//         {isSubmitting ? 'Logging in...' : 'Login'}
//       </button>
//     </form>
//   );
// }

export default useForm;
