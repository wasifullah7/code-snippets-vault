/**
 * URL utilities for Node.js
 */

/**
 * Parse URL into components
 * @param {string} url - URL to parse
 * @returns {Object} URL components
 */
const parseUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
      href: urlObj.href
    };
  } catch {
    return null;
  }
};

/**
 * Get query parameters from URL
 * @param {string} url - URL to parse
 * @returns {Object} Query parameters
 */
const getQueryParams = (url) => {
  if (!url || typeof url !== 'string') return {};
  
  try {
    const urlObj = new URL(url);
    const params = {};
    
    urlObj.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  } catch {
    return {};
  }
};

/**
 * Add query parameters to URL
 * @param {string} url - Base URL
 * @param {Object} params - Parameters to add
 * @returns {string} URL with parameters
 */
const addQueryParams = (url, params) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    
    Object.entries(params).forEach(([key, value]) => {
      urlObj.searchParams.set(key, value);
    });
    
    return urlObj.href;
  } catch {
    return url;
  }
};

/**
 * Remove query parameters from URL
 * @param {string} url - URL to modify
 * @param {Array|string} keys - Keys to remove
 * @returns {string} URL without specified parameters
 */
const removeQueryParams = (url, keys) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    const keysToRemove = Array.isArray(keys) ? keys : [keys];
    
    keysToRemove.forEach(key => {
      urlObj.searchParams.delete(key);
    });
    
    return urlObj.href;
  } catch {
    return url;
  }
};

/**
 * Update query parameter in URL
 * @param {string} url - URL to modify
 * @param {string} key - Parameter key
 * @param {string} value - Parameter value
 * @returns {string} URL with updated parameter
 */
const updateQueryParam = (url, key, value) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    urlObj.searchParams.set(key, value);
    return urlObj.href;
  } catch {
    return url;
  }
};

/**
 * Check if URL is valid
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
 * Get domain from URL
 * @param {string} url - URL to extract domain from
 * @returns {string} Domain name
 */
const getDomain = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
};

/**
 * Get subdomain from URL
 * @param {string} url - URL to extract subdomain from
 * @returns {string} Subdomain
 */
const getSubdomain = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const parts = hostname.split('.');
    
    if (parts.length > 2) {
      return parts.slice(0, -2).join('.');
    }
    
    return '';
  } catch {
    return '';
  }
};

/**
 * Get path segments from URL
 * @param {string} url - URL to extract path from
 * @returns {Array} Path segments
 */
const getPathSegments = (url) => {
  if (!url || typeof url !== 'string') return [];
  
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split('/').filter(segment => segment !== '');
  } catch {
    return [];
  }
};

/**
 * Build URL from components
 * @param {Object} components - URL components
 * @returns {string} Built URL
 */
const buildUrl = (components) => {
  if (!components || typeof components !== 'object') return '';
  
  const {
    protocol = 'https:',
    hostname = '',
    port = '',
    pathname = '/',
    search = '',
    hash = ''
  } = components;
  
  let url = protocol + '//' + hostname;
  
  if (port) {
    url += ':' + port;
  }
  
  url += pathname + search + hash;
  
  return url;
};

/**
 * Normalize URL
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
const normalizeUrl = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    
    // Remove trailing slash from pathname (except root)
    if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    return urlObj.href;
  } catch {
    return url;
  }
};

/**
 * Get relative URL
 * @param {string} from - Source URL
 * @param {string} to - Target URL
 * @returns {string} Relative URL
 */
const getRelativeUrl = (from, to) => {
  if (!from || !to || typeof from !== 'string' || typeof to !== 'string') return '';
  
  try {
    const fromUrl = new URL(from);
    const toUrl = new URL(to);
    
    if (fromUrl.origin !== toUrl.origin) {
      return to;
    }
    
    return toUrl.pathname + toUrl.search + toUrl.hash;
  } catch {
    return to;
  }
};

/**
 * Check if URL is absolute
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is absolute
 */
const isAbsoluteUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  return /^https?:\/\//.test(url);
};

/**
 * Check if URL is relative
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is relative
 */
const isRelativeUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  return !isAbsoluteUrl(url);
};

/**
 * Resolve relative URL against base URL
 * @param {string} base - Base URL
 * @param {string} relative - Relative URL
 * @returns {string} Resolved URL
 */
const resolveUrl = (base, relative) => {
  if (!base || !relative || typeof base !== 'string' || typeof relative !== 'string') return '';
  
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
};

/**
 * Encode URL parameters
 * @param {Object} params - Parameters to encode
 * @returns {string} Encoded query string
 */
const encodeParams = (params) => {
  if (!params || typeof params !== 'object') return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined) {
      searchParams.append(key, String(value));
    }
  });
  
  return searchParams.toString();
};

/**
 * Decode URL parameters
 * @param {string} queryString - Query string to decode
 * @returns {Object} Decoded parameters
 */
const decodeParams = (queryString) => {
  if (!queryString || typeof queryString !== 'string') return {};
  
  const params = {};
  const searchParams = new URLSearchParams(queryString);
  
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  
  return params;
};

/**
 * Sanitize URL
 * @param {string} url - URL to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized URL
 */
const sanitizeUrl = (url, options = {}) => {
  const {
    allowedProtocols = ['http:', 'https:'],
    allowedHostnames = [],
    blockPrivateIPs = true
  } = options;
  
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(urlObj.protocol)) {
      return '';
    }
    
    // Check hostname
    if (allowedHostnames.length > 0 && !allowedHostnames.includes(urlObj.hostname)) {
      return '';
    }
    
    // Check for private IPs
    if (blockPrivateIPs) {
      const isPrivateIP = /^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(urlObj.hostname);
      if (isPrivateIP) {
        return '';
      }
    }
    
    return urlObj.href;
  } catch {
    return '';
  }
};

/**
 * Extract domain from email
 * @param {string} email - Email address
 * @returns {string} Domain part of email
 */
const extractEmailDomain = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  const parts = email.split('@');
  return parts.length === 2 ? parts[1] : '';
};

/**
 * Generate URL slug
 * @param {string} text - Text to convert to slug
 * @returns {string} URL-friendly slug
 */
const generateSlug = (text) => {
  if (!text || typeof text !== 'string') return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

/**
 * Check if URL is HTTPS
 * @param {string} url - URL to check
 * @returns {boolean} True if URL uses HTTPS
 */
const isHttps = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Get URL without protocol
 * @param {string} url - URL to modify
 * @returns {string} URL without protocol
 */
const removeProtocol = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  return url.replace(/^https?:\/\//, '');
};

/**
 * Add protocol to URL
 * @param {string} url - URL to modify
 * @param {string} protocol - Protocol to add (default: 'https')
 * @returns {string} URL with protocol
 */
const addProtocol = (url, protocol = 'https') => {
  if (!url || typeof url !== 'string') return '';
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  return `${protocol}://${url}`;
};

/**
 * Get URL without query parameters
 * @param {string} url - URL to modify
 * @returns {string} URL without query parameters
 */
const removeQueryString = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname + urlObj.hash;
  } catch {
    return url;
  }
};

/**
 * Get URL without hash
 * @param {string} url - URL to modify
 * @returns {string} URL without hash
 */
const removeHash = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.origin + urlObj.pathname + urlObj.search;
  } catch {
    return url;
  }
};

/**
 * Get URL without path
 * @param {string} url - URL to modify
 * @returns {string} URL without path
 */
const removePath = (url) => {
  if (!url || typeof url !== 'string') return '';
  
  try {
    const urlObj = new URL(url);
    return urlObj.origin;
  } catch {
    return url;
  }
};

/**
 * Check if URL has query parameters
 * @param {string} url - URL to check
 * @returns {boolean} True if URL has query parameters
 */
const hasQueryParams = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.search.length > 0;
  } catch {
    return false;
  }
};

/**
 * Check if URL has hash
 * @param {string} url - URL to check
 * @returns {boolean} True if URL has hash
 */
const hasHash = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return urlObj.hash.length > 0;
  } catch {
    return false;
  }
};

module.exports = {
  parseUrl,
  getQueryParams,
  addQueryParams,
  removeQueryParams,
  updateQueryParam,
  isValidUrl,
  getDomain,
  getSubdomain,
  getPathSegments,
  buildUrl,
  normalizeUrl,
  getRelativeUrl,
  isAbsoluteUrl,
  isRelativeUrl,
  resolveUrl,
  encodeParams,
  decodeParams,
  sanitizeUrl,
  extractEmailDomain,
  generateSlug,
  isHttps,
  removeProtocol,
  addProtocol,
  removeQueryString,
  removeHash,
  removePath,
  hasQueryParams,
  hasHash
};
