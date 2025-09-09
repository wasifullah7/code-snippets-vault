/**
 * Query string and URL parameter utilities
 */

/**
 * Parse query string into object
 * @param {string} queryString - Query string (with or without ?)
 * @returns {Object} Parsed query parameters
 */
export const parseQueryString = (queryString = window.location.search) => {
  const params = {};
  const cleanQuery = queryString.replace(/^\?/, '');
  
  if (!cleanQuery) return params;
  
  cleanQuery.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  });
  
  return params;
};

/**
 * Build query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

/**
 * Get query parameter value
 * @param {string} name - Parameter name
 * @param {string} queryString - Query string (optional)
 * @returns {string|null} Parameter value
 */
export const getQueryParam = (name, queryString = window.location.search) => {
  const params = parseQueryString(queryString);
  return params[name] || null;
};

/**
 * Set query parameter in URL
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 * @param {boolean} replace - Replace current URL
 */
export const setQueryParam = (name, value, replace = true) => {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};

/**
 * Remove query parameter from URL
 * @param {string} name - Parameter name
 * @param {boolean} replace - Replace current URL
 */
export const removeQueryParam = (name, replace = true) => {
  const url = new URL(window.location);
  url.searchParams.delete(name);
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};

/**
 * Clear all query parameters
 * @param {boolean} replace - Replace current URL
 */
export const clearQueryParams = (replace = true) => {
  const url = new URL(window.location);
  url.search = '';
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};

/**
 * Query string and URL parameter utilities
 */

/**
 * Parse query string into object
 * @param {string} queryString - Query string (with or without ?)
 * @returns {Object} Parsed query parameters
 */
export const parseQueryString = (queryString = window.location.search) => {
  const params = {};
  const cleanQuery = queryString.replace(/^\?/, '');
  
  if (!cleanQuery) return params;
  
  cleanQuery.split('&').forEach(param => {
    const [key, value] = param.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  });
  
  return params;
};

/**
 * Build query string from object
 * @param {Object} params - Parameters object
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
  return Object.entries(params)
    .filter(([_, value]) => value !== null && value !== undefined)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
};

/**
 * Get query parameter value
 * @param {string} name - Parameter name
 * @param {string} queryString - Query string (optional)
 * @returns {string|null} Parameter value
 */
export const getQueryParam = (name, queryString = window.location.search) => {
  const params = parseQueryString(queryString);
  return params[name] || null;
};

/**
 * Set query parameter in URL
 * @param {string} name - Parameter name
 * @param {string} value - Parameter value
 * @param {boolean} replace - Replace current URL
 */
export const setQueryParam = (name, value, replace = true) => {
  const url = new URL(window.location);
  url.searchParams.set(name, value);
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};

/**
 * Remove query parameter from URL
 * @param {string} name - Parameter name
 * @param {boolean} replace - Replace current URL
 */
export const removeQueryParam = (name, replace = true) => {
  const url = new URL(window.location);
  url.searchParams.delete(name);
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};

/**
 * Clear all query parameters
 * @param {boolean} replace - Replace current URL
 */
export const clearQueryParams = (replace = true) => {
  const url = new URL(window.location);
  url.search = '';
  
  if (replace) {
    window.history.replaceState({}, '', url);
  } else {
    window.history.pushState({}, '', url);
  }
};
