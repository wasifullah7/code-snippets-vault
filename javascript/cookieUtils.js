/**
 * Cookie utility functions for managing browser cookies
 */

/**
 * Set a cookie with optional configuration
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {Object} options - Cookie options
 */
export const setCookie = (name, value, options = {}) => {
  const {
    expires = null,
    maxAge = null,
    path = '/',
    domain = null,
    secure = false,
    sameSite = 'Lax'
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    cookieString += `; expires=${expires.toUTCString()}`;
  }
  if (maxAge) {
    cookieString += `; max-age=${maxAge}`;
  }
  if (path) {
    cookieString += `; path=${path}`;
  }
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  if (secure) {
    cookieString += `; secure`;
  }
  if (sameSite) {
    cookieString += `; samesite=${sameSite}`;
  }

  document.cookie = cookieString;
};

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null
 */
export const getCookie = (name) => {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
};

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 * @param {string} path - Cookie path
 * @param {string} domain - Cookie domain
 */
export const deleteCookie = (name, path = '/', domain = null) => {
  setCookie(name, '', {
    expires: new Date(0),
    path,
    domain
  });
};

/**
 * Get all cookies as an object
 * @returns {Object} All cookies
 */
export const getAllCookies = () => {
  const cookies = {};
  document.cookie.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[decodeURIComponent(name)] = decodeURIComponent(value);
    }
  });
  return cookies;
};

/**
 * Check if cookies are enabled
 * @returns {boolean} True if cookies are enabled
 */
export const areCookiesEnabled = () => {
  try {
    setCookie('test', 'test');
    return getCookie('test') === 'test';
  } catch {
    return false;
  } finally {
    deleteCookie('test');
  }
};
