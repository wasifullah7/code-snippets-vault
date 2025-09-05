/**
 * URL utility functions for URL manipulation and parsing
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
  decodeParams
};