/**
 * Advanced URL utilities for modern JavaScript
 * Comprehensive URL manipulation, parsing, and validation utilities
 */

/**
 * Parse URL into components with additional metadata
 * @param {string} url - URL to parse
 * @returns {Object} Parsed URL object with metadata
 */
function parseUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin,
      href: urlObj.href,
      // Additional metadata
      pathSegments: pathParts,
      depth: pathParts.length,
      isSecure: urlObj.protocol === 'https:',
      isLocalhost: urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1',
      hasQuery: urlObj.search.length > 0,
      hasHash: urlObj.hash.length > 0,
      // Query parameters as object
      queryParams: Object.fromEntries(urlObj.searchParams),
      // File extension if present
      fileExtension: pathParts.length > 0 ? pathParts[pathParts.length - 1].split('.').pop() : null
    };
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
}

/**
 * Build URL from components
 * @param {Object} components - URL components
 * @returns {string} Constructed URL
 */
function buildUrl(components = {}) {
  const {
    protocol = 'https:',
    hostname = '',
    port = '',
    pathname = '',
    search = '',
    hash = ''
  } = components;

  let url = protocol + '//' + hostname;
  if (port) url += ':' + port;
  if (pathname) url += pathname.startsWith('/') ? pathname : '/' + pathname;
  if (search) url += search.startsWith('?') ? search : '?' + search;
  if (hash) url += hash.startsWith('#') ? hash : '#' + hash;

  return url;
}

/**
 * Add query parameters to URL
 * @param {string} url - Base URL
 * @param {Object} params - Parameters to add
 * @param {boolean} replace - Whether to replace existing params
 * @returns {string} URL with added parameters
 */
function addQueryParams(url, params = {}, replace = false) {
  const urlObj = new URL(url);
  
  Object.entries(params).forEach(([key, value]) => {
    if (replace || !urlObj.searchParams.has(key)) {
      urlObj.searchParams.set(key, value);
    }
  });
  
  return urlObj.toString();
}

/**
 * Remove query parameters from URL
 * @param {string} url - Base URL
 * @param {string|Array} params - Parameters to remove
 * @returns {string} URL with removed parameters
 */
function removeQueryParams(url, params) {
  const urlObj = new URL(url);
  const paramArray = Array.isArray(params) ? params : [params];
  
  paramArray.forEach(param => {
    urlObj.searchParams.delete(param);
  });
  
  return urlObj.toString();
}

/**
 * Get query parameter value
 * @param {string} url - URL to parse
 * @param {string} param - Parameter name
 * @param {*} defaultValue - Default value if parameter not found
 * @returns {*} Parameter value or default
 */
function getQueryParam(url, param, defaultValue = null) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get(param) ?? defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Get all query parameters as object
 * @param {string} url - URL to parse
 * @returns {Object} Query parameters object
 */
function getQueryParams(url) {
  try {
    const urlObj = new URL(url);
    return Object.fromEntries(urlObj.searchParams);
  } catch (error) {
    return {};
  }
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @param {Object} options - Validation options
 * @returns {boolean} Whether URL is valid
 */
function isValidUrl(url, options = {}) {
  const { protocols = ['http:', 'https:'], requireProtocol = false } = options;
  
  try {
    const urlObj = new URL(url);
    
    if (requireProtocol && !urlObj.protocol) {
      return false;
    }
    
    if (protocols.length > 0 && !protocols.includes(urlObj.protocol)) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Normalize URL (remove trailing slash, normalize protocol, etc.)
 * @param {string} url - URL to normalize
 * @param {Object} options - Normalization options
 * @returns {string} Normalized URL
 */
function normalizeUrl(url, options = {}) {
  const { 
    removeTrailingSlash = true, 
    forceHttps = false, 
    removeHash = false,
    removeQuery = false 
  } = options;
  
  try {
    const urlObj = new URL(url);
    
    if (forceHttps && urlObj.protocol === 'http:') {
      urlObj.protocol = 'https:';
    }
    
    if (removeTrailingSlash && urlObj.pathname.endsWith('/') && urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.slice(0, -1);
    }
    
    if (removeHash) {
      urlObj.hash = '';
    }
    
    if (removeQuery) {
      urlObj.search = '';
    }
    
    return urlObj.toString();
  } catch (error) {
    return url;
  }
}

/**
 * Get domain from URL
 * @param {string} url - URL to extract domain from
 * @param {boolean} includeSubdomain - Whether to include subdomain
 * @returns {string} Domain
 */
function getDomain(url, includeSubdomain = true) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    if (includeSubdomain) {
      return hostname;
    }
    
    // Remove subdomain
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    
    return hostname;
  } catch (error) {
    return '';
  }
}

/**
 * Check if URL is absolute
 * @param {string} url - URL to check
 * @returns {boolean} Whether URL is absolute
 */
function isAbsoluteUrl(url) {
  return /^[a-z][a-z0-9+.-]*:/.test(url);
}

/**
 * Convert relative URL to absolute
 * @param {string} relativeUrl - Relative URL
 * @param {string} baseUrl - Base URL
 * @returns {string} Absolute URL
 */
function toAbsoluteUrl(relativeUrl, baseUrl) {
  try {
    return new URL(relativeUrl, baseUrl).toString();
  } catch (error) {
    return relativeUrl;
  }
}

/**
 * Extract file information from URL
 * @param {string} url - URL to analyze
 * @returns {Object} File information
 */
function getFileInfo(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop();
    
    if (!filename || !filename.includes('.')) {
      return { hasFile: false };
    }
    
    const [name, extension] = filename.split('.');
    
    return {
      hasFile: true,
      filename,
      name,
      extension: extension?.toLowerCase(),
      fullPath: pathname,
      directory: pathname.substring(0, pathname.lastIndexOf('/') + 1)
    };
  } catch (error) {
    return { hasFile: false };
  }
}

/**
 * Create URL with dynamic parameters
 * @param {string} template - URL template with placeholders
 * @param {Object} params - Parameters to substitute
 * @returns {string} URL with substituted parameters
 */
function createUrlFromTemplate(template, params = {}) {
  let url = template;
  
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = `:${key}`;
    url = url.replace(new RegExp(placeholder, 'g'), encodeURIComponent(value));
  });
  
  return url;
}

/**
 * URL encoder with options
 * @param {string} url - URL to encode
 * @param {Object} options - Encoding options
 * @returns {string} Encoded URL
 */
function encodeUrl(url, options = {}) {
  const { 
    encodePath = true, 
    encodeQuery = true, 
    encodeHash = false,
    preserveReserved = true 
  } = options;
  
  try {
    const urlObj = new URL(url);
    
    if (encodePath) {
      urlObj.pathname = encodeURI(urlObj.pathname);
    }
    
    if (encodeQuery) {
      const params = new URLSearchParams();
      urlObj.searchParams.forEach((value, key) => {
        params.set(key, value);
      });
      urlObj.search = params.toString();
    }
    
    if (encodeHash) {
      urlObj.hash = encodeURI(urlObj.hash);
    }
    
    return urlObj.toString();
  } catch (error) {
    return encodeURI(url);
  }
}

/**
 * URL decoder
 * @param {string} url - URL to decode
 * @returns {string} Decoded URL
 */
function decodeUrl(url) {
  try {
    return decodeURI(url);
  } catch (error) {
    return url;
  }
}

/**
 * Compare two URLs
 * @param {string} url1 - First URL
 * @param {string} url2 - Second URL
 * @param {Object} options - Comparison options
 * @returns {boolean} Whether URLs are equal
 */
function compareUrls(url1, url2, options = {}) {
  const { 
    ignoreProtocol = false, 
    ignoreHash = true, 
    ignoreQuery = false,
    normalize = true 
  } = options;
  
  try {
    let u1 = normalize ? normalizeUrl(url1) : url1;
    let u2 = normalize ? normalizeUrl(url2) : url2;
    
    const urlObj1 = new URL(u1);
    const urlObj2 = new URL(u2);
    
    if (ignoreProtocol) {
      urlObj1.protocol = '';
      urlObj2.protocol = '';
    }
    
    if (ignoreHash) {
      urlObj1.hash = '';
      urlObj2.hash = '';
    }
    
    if (ignoreQuery) {
      urlObj1.search = '';
      urlObj2.search = '';
    }
    
    return urlObj1.toString() === urlObj2.toString();
  } catch (error) {
    return false;
  }
}

module.exports = {
  parseUrl,
  buildUrl,
  addQueryParams,
  removeQueryParams,
  getQueryParam,
  getQueryParams,
  isValidUrl,
  normalizeUrl,
  getDomain,
  isAbsoluteUrl,
  toAbsoluteUrl,
  getFileInfo,
  createUrlFromTemplate,
  encodeUrl,
  decodeUrl,
  compareUrls
};
