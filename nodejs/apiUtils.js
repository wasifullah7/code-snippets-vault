/**
 * Advanced API utilities for Node.js applications
 * Comprehensive API development, testing, and management utilities
 */

const { EventEmitter } = require('events');

/**
 * API response formatter
 * Standardizes API responses across the application
 */
class ApiResponseFormatter {
  constructor(options = {}) {
    this.defaultStatus = options.defaultStatus || 200;
    this.includeTimestamp = options.includeTimestamp !== false;
    this.includePath = options.includePath !== false;
    this.includeVersion = options.includeVersion !== false;
    this.version = options.version || '1.0.0';
  }

  /**
   * Format success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} status - HTTP status code
   * @param {Object} options - Additional options
   * @returns {Object} Formatted response
   */
  success(data = null, message = 'Success', status = 200, options = {}) {
    const response = {
      success: true,
      message,
      data,
      status
    };

    if (this.includeTimestamp) {
      response.timestamp = new Date().toISOString();
    }

    if (this.includePath && options.path) {
      response.path = options.path;
    }

    if (this.includeVersion) {
      response.version = this.version;
    }

    if (options.meta) {
      response.meta = options.meta;
    }

    return response;
  }

  /**
   * Format error response
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {*} errors - Error details
   * @param {Object} options - Additional options
   * @returns {Object} Formatted error response
   */
  error(message = 'Error', status = 400, errors = null, options = {}) {
    const response = {
      success: false,
      message,
      status
    };

    if (errors) {
      response.errors = errors;
    }

    if (this.includeTimestamp) {
      response.timestamp = new Date().toISOString();
    }

    if (this.includePath && options.path) {
      response.path = options.path;
    }

    if (this.includeVersion) {
      response.version = this.version;
    }

    if (options.code) {
      response.code = options.code;
    }

    if (options.stack && process.env.NODE_ENV === 'development') {
      response.stack = options.stack;
    }

    return response;
  }

  /**
   * Format paginated response
   * @param {Array} data - Response data
   * @param {Object} pagination - Pagination info
   * @param {string} message - Success message
   * @param {Object} options - Additional options
   * @returns {Object} Formatted paginated response
   */
  paginated(data, pagination, message = 'Success', options = {}) {
    const response = this.success(data, message, 200, options);
    
    response.pagination = {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      pages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNext: pagination.hasNext || false,
      hasPrev: pagination.hasPrev || false
    };

    return response;
  }
}

/**
 * API rate limiter with multiple strategies
 */
class ApiRateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    this.max = options.max || 100; // limit each IP to 100 requests per windowMs
    this.message = options.message || 'Too many requests from this IP';
    this.statusCode = options.statusCode || 429;
    this.headers = options.headers || true;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    
    this.store = new Map();
    this.eventEmitter = new EventEmitter();
  }

  /**
   * Check if request is allowed
   * @param {string} key - Rate limit key (usually IP)
   * @returns {Object} Rate limit result
   */
  check(key) {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.store.has(key)) {
      this.store.set(key, []);
    }
    
    const requests = this.store.get(key);
    
    // Remove old requests outside the window
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    this.store.set(key, validRequests);
    
    const currentCount = validRequests.length;
    const remaining = Math.max(0, this.max - currentCount);
    const resetTime = new Date(now + this.windowMs);
    
    if (currentCount >= this.max) {
      this.eventEmitter.emit('limit-exceeded', { key, count: currentCount });
      return {
        allowed: false,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil(this.windowMs / 1000)
      };
    }
    
    // Add current request
    validRequests.push(now);
    this.store.set(key, validRequests);
    
    this.eventEmitter.emit('request', { key, count: currentCount + 1 });
    
    return {
      allowed: true,
      remaining: remaining - 1,
      resetTime,
      retryAfter: 0
    };
  }

  /**
   * Get rate limit headers
   * @param {Object} result - Rate limit check result
   * @returns {Object} Headers object
   */
  getHeaders(result) {
    return {
      'X-RateLimit-Limit': this.max,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Reset': result.resetTime.getTime(),
      'Retry-After': result.retryAfter
    };
  }

  /**
   * Clear rate limit for a key
   * @param {string} key - Rate limit key
   */
  clear(key) {
    this.store.delete(key);
    this.eventEmitter.emit('cleared', { key });
  }

  /**
   * Get rate limit statistics
   * @returns {Object} Statistics
   */
  getStats() {
    const keys = Array.from(this.store.keys());
    const totalRequests = keys.reduce((sum, key) => {
      return sum + this.store.get(key).length;
    }, 0);
    
    return {
      totalKeys: keys.length,
      totalRequests,
      averageRequestsPerKey: keys.length > 0 ? totalRequests / keys.length : 0
    };
  }
}

/**
 * API validation middleware
 */
class ApiValidator {
  constructor() {
    this.rules = new Map();
    this.customValidators = new Map();
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
   * Validate data against rules
   * @param {Object} data - Data to validate
   * @param {Object} rules - Validation rules
   * @returns {Object} Validation result
   */
  validate(data, rules = null) {
    const validationRules = rules || this.rules;
    const errors = {};
    const isValid = true;

    for (const [field, fieldRules] of Object.entries(validationRules)) {
      const value = data[field];
      const fieldErrors = [];

      for (const [rule, ruleValue] of Object.entries(fieldRules)) {
        const validationResult = this.validateField(value, rule, ruleValue, data);
        
        if (!validationResult.isValid) {
          fieldErrors.push(validationResult.message);
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
          return { isValid: false, message: 'This field is required' };
        }
        break;

      case 'min':
        if (value !== undefined && value !== null && value.length < ruleValue) {
          return { isValid: false, message: `Minimum length is ${ruleValue}` };
        }
        break;

      case 'max':
        if (value !== undefined && value !== null && value.length > ruleValue) {
          return { isValid: false, message: `Maximum length is ${ruleValue}` };
        }
        break;

      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { isValid: false, message: 'Invalid email format' };
        }
        break;

      case 'url':
        if (value && !/^https?:\/\/.+/.test(value)) {
          return { isValid: false, message: 'Invalid URL format' };
        }
        break;

      case 'pattern':
        if (value && !ruleValue.test(value)) {
          return { isValid: false, message: 'Invalid format' };
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
    }

    return { isValid: true };
  }
}

/**
 * API documentation generator
 */
class ApiDocGenerator {
  constructor(options = {}) {
    this.title = options.title || 'API Documentation';
    this.version = options.version || '1.0.0';
    this.description = options.description || '';
    this.baseUrl = options.baseUrl || '';
    this.endpoints = new Map();
  }

  /**
   * Add endpoint documentation
   * @param {string} path - Endpoint path
   * @param {string} method - HTTP method
   * @param {Object} docs - Endpoint documentation
   */
  addEndpoint(path, method, docs) {
    const key = `${method.toUpperCase()} ${path}`;
    this.endpoints.set(key, {
      path,
      method: method.toUpperCase(),
      ...docs
    });
  }

  /**
   * Generate OpenAPI/Swagger specification
   * @returns {Object} OpenAPI specification
   */
  generateOpenAPI() {
    const paths = {};
    
    for (const [key, endpoint] of this.endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }
      
      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary || '',
        description: endpoint.description || '',
        tags: endpoint.tags || [],
        parameters: endpoint.parameters || [],
        requestBody: endpoint.requestBody || null,
        responses: endpoint.responses || {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'object'
                }
              }
            }
          }
        }
      };
    }

    return {
      openapi: '3.0.0',
      info: {
        title: this.title,
        version: this.version,
        description: this.description
      },
      servers: [
        {
          url: this.baseUrl,
          description: 'Production server'
        }
      ],
      paths
    };
  }

  /**
   * Generate Markdown documentation
   * @returns {string} Markdown documentation
   */
  generateMarkdown() {
    let markdown = `# ${this.title}\n\n`;
    markdown += `Version: ${this.version}\n\n`;
    
    if (this.description) {
      markdown += `${this.description}\n\n`;
    }

    markdown += `## Endpoints\n\n`;

    for (const [key, endpoint] of this.endpoints) {
      markdown += `### ${endpoint.method} ${endpoint.path}\n\n`;
      
      if (endpoint.summary) {
        markdown += `**${endpoint.summary}**\n\n`;
      }
      
      if (endpoint.description) {
        markdown += `${endpoint.description}\n\n`;
      }

      if (endpoint.parameters && endpoint.parameters.length > 0) {
        markdown += `#### Parameters\n\n`;
        markdown += `| Name | Type | Required | Description |\n`;
        markdown += `|------|------|----------|-------------|\n`;
        
        for (const param of endpoint.parameters) {
          markdown += `| ${param.name} | ${param.type} | ${param.required ? 'Yes' : 'No'} | ${param.description || ''} |\n`;
        }
        markdown += `\n`;
      }

      if (endpoint.requestBody) {
        markdown += `#### Request Body\n\n`;
        markdown += `\`\`\`json\n${JSON.stringify(endpoint.requestBody, null, 2)}\n\`\`\`\n\n`;
      }

      if (endpoint.responses) {
        markdown += `#### Responses\n\n`;
        
        for (const [code, response] of Object.entries(endpoint.responses)) {
          markdown += `**${code}** - ${response.description}\n\n`;
          
          if (response.content && response.content['application/json']) {
            markdown += `\`\`\`json\n${JSON.stringify(response.content['application/json'].schema, null, 2)}\n\`\`\`\n\n`;
          }
        }
      }

      markdown += `---\n\n`;
    }

    return markdown;
  }
}

/**
 * API testing utilities
 */
class ApiTester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.tests = [];
    this.results = [];
  }

  /**
   * Add test case
   * @param {string} name - Test name
   * @param {Function} testFn - Test function
   */
  addTest(name, testFn) {
    this.tests.push({ name, testFn });
  }

  /**
   * Run all tests
   * @returns {Promise<Array>} Test results
   */
  async runTests() {
    this.results = [];
    
    for (const test of this.tests) {
      try {
        const startTime = Date.now();
        const result = await test.testFn();
        const duration = Date.now() - startTime;
        
        this.results.push({
          name: test.name,
          success: true,
          duration,
          result
        });
      } catch (error) {
        this.results.push({
          name: test.name,
          success: false,
          error: error.message,
          duration: 0
        });
      }
    }
    
    return this.results;
  }

  /**
   * Generate test report
   * @returns {Object} Test report
   */
  generateReport() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / total;

    return {
      summary: {
        total,
        passed,
        failed,
        successRate: (passed / total) * 100,
        avgDuration
      },
      results: this.results
    };
  }

  /**
   * Helper method for making test requests
   * @param {string} endpoint - API endpoint
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();
    
    return {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data
    };
  }
}

/**
 * API utilities
 */
const apiUtils = {
  /**
   * Create standardized API response
   * @param {boolean} success - Success status
   * @param {*} data - Response data
   * @param {string} message - Response message
   * @param {number} status - HTTP status code
   * @returns {Object} Standardized response
   */
  createResponse(success, data, message, status = 200) {
    return {
      success,
      message,
      data,
      status,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Create success response
   * @param {*} data - Response data
   * @param {string} message - Success message
   * @param {number} status - HTTP status code
   * @returns {Object} Success response
   */
  success(data, message = 'Success', status = 200) {
    return this.createResponse(true, data, message, status);
  },

  /**
   * Create error response
   * @param {string} message - Error message
   * @param {number} status - HTTP status code
   * @param {*} errors - Error details
   * @returns {Object} Error response
   */
  error(message = 'Error', status = 400, errors = null) {
    const response = this.createResponse(false, null, message, status);
    if (errors) {
      response.errors = errors;
    }
    return response;
  },

  /**
   * Validate required fields
   * @param {Object} data - Data to validate
   * @param {Array} requiredFields - Required field names
   * @returns {Object} Validation result
   */
  validateRequired(data, requiredFields) {
    const missing = [];
    
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missing.push(field);
      }
    }
    
    return {
      isValid: missing.length === 0,
      missing
    };
  },

  /**
   * Sanitize request data
   * @param {Object} data - Data to sanitize
   * @param {Array} allowedFields - Allowed field names
   * @returns {Object} Sanitized data
   */
  sanitizeData(data, allowedFields) {
    const sanitized = {};
    
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        sanitized[field] = data[field];
      }
    }
    
    return sanitized;
  }
};

module.exports = {
  ApiResponseFormatter,
  ApiRateLimiter,
  ApiValidator,
  ApiDocGenerator,
  ApiTester,
  apiUtils
};
