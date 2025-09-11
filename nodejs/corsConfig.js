/**
 * CORS configuration utility for Express.js
 */

/**
 * Create CORS configuration object
 * @param {Object} options - CORS options
 * @returns {Object} CORS configuration
 */
function createCorsConfig(options = {}) {
  const {
    origin = true,
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders = [],
    maxAge = 86400,
    preflightContinue = false,
    optionsSuccessStatus = 204
  } = options;

  return {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      
      if (typeof origin === 'boolean') {
        return callback(null, origin);
      }
      
      if (typeof origin === 'function') {
        return origin(origin, callback);
      }
      
      // Handle array of origins
      if (Array.isArray(origin)) {
        return callback(null, origin.includes(origin));
      }
      
      // Handle string pattern
      if (typeof origin === 'string') {
        return callback(null, origin);
      }
      
      callback(new Error('Invalid origin configuration'));
    },
    credentials,
    methods,
    allowedHeaders,
    exposedHeaders,
    maxAge,
    preflightContinue,
    optionsSuccessStatus
  };
}

/**
 * Common CORS configurations
 */
const corsConfigs = {
  // Allow all origins (development only)
  development: createCorsConfig({
    origin: true,
    credentials: true
  }),
  
  // Production with specific origins
  production: createCorsConfig({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'],
    credentials: true,
    maxAge: 86400
  }),
  
  // API-only (no credentials)
  api: createCorsConfig({
    origin: true,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }),
  
  // Mobile app specific
  mobile: createCorsConfig({
    origin: [
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost',
      'http://localhost:8080',
      'http://localhost:8100'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }),
  
  // Static file serving
  static: createCorsConfig({
    origin: true,
    credentials: false,
    methods: ['GET', 'HEAD'],
    maxAge: 86400
  })
};

/**
 * Dynamic origin checker
 * @param {Array} allowedDomains - Array of allowed domain patterns
 * @returns {Function} Origin checker function
 */
function createOriginChecker(allowedDomains) {
  return (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isAllowed = allowedDomains.some(domain => {
      if (typeof domain === 'string') {
        return origin === domain || origin.endsWith(`.${domain}`);
      }
      if (domain instanceof RegExp) {
        return domain.test(origin);
      }
      return false;
    });
    
    callback(null, isAllowed);
  };
}

/**
 * Environment-based CORS configuration
 * @param {Object} customConfig - Custom configuration overrides
 * @returns {Object} CORS configuration
 */
function getCorsConfig(customConfig = {}) {
  const env = process.env.NODE_ENV || 'development';
  const baseConfig = corsConfigs[env] || corsConfigs.development;
  
  return {
    ...baseConfig,
    ...customConfig
  };
}

module.exports = {
  createCorsConfig,
  corsConfigs,
  createOriginChecker,
  getCorsConfig
};
