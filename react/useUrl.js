import { useState, useCallback, useEffect } from 'react';

/**
 * React hook for URL operations
 * @param {string} initialUrl - Initial URL
 * @returns {Object} URL state and functions
 */
const useUrl = (initialUrl = window.location.href) => {
  const [url, setUrl] = useState(initialUrl);

  // Parse URL into components
  const parseUrl = useCallback((urlToParse = url) => {
    if (!urlToParse || typeof urlToParse !== 'string') return null;
    
    try {
      const urlObj = new URL(urlToParse);
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
  }, [url]);

  // Get query parameters
  const getQueryParams = useCallback((urlToParse = url) => {
    if (!urlToParse || typeof urlToParse !== 'string') return {};
    
    try {
      const urlObj = new URL(urlToParse);
      const params = {};
      
      urlObj.searchParams.forEach((value, key) => {
        params[key] = value;
      });
      
      return params;
    } catch {
      return {};
    }
  }, [url]);

  // Add query parameters
  const addQueryParams = useCallback((params) => {
    if (!params || typeof params !== 'object') return;
    
    try {
      const urlObj = new URL(url);
      
      Object.entries(params).forEach(([key, value]) => {
        urlObj.searchParams.set(key, value);
      });
      
      setUrl(urlObj.href);
    } catch (error) {
      console.error('Error adding query params:', error);
    }
  }, [url]);

  // Remove query parameters
  const removeQueryParams = useCallback((keys) => {
    if (!keys) return;
    
    try {
      const urlObj = new URL(url);
      const keysToRemove = Array.isArray(keys) ? keys : [keys];
      
      keysToRemove.forEach(key => {
        urlObj.searchParams.delete(key);
      });
      
      setUrl(urlObj.href);
    } catch (error) {
      console.error('Error removing query params:', error);
    }
  }, [url]);

  // Update query parameter
  const updateQueryParam = useCallback((key, value) => {
    if (!key) return;
    
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.set(key, value);
      setUrl(urlObj.href);
    } catch (error) {
      console.error('Error updating query param:', error);
    }
  }, [url]);

  // Get specific query parameter
  const getQueryParam = useCallback((key) => {
    if (!key) return null;
    
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams.get(key);
    } catch {
      return null;
    }
  }, [url]);

  // Check if URL is valid
  const isValidUrl = useCallback((urlToCheck = url) => {
    if (!urlToCheck || typeof urlToCheck !== 'string') return false;
    
    try {
      new URL(urlToCheck);
      return true;
    } catch {
      return false;
    }
  }, [url]);

  // Get domain
  const getDomain = useCallback((urlToParse = url) => {
    if (!urlToParse || typeof urlToParse !== 'string') return '';
    
    try {
      const urlObj = new URL(urlToParse);
      return urlObj.hostname;
    } catch {
      return '';
    }
  }, [url]);

  // Get subdomain
  const getSubdomain = useCallback((urlToParse = url) => {
    if (!urlToParse || typeof urlToParse !== 'string') return '';
    
    try {
      const urlObj = new URL(urlToParse);
      const hostname = urlObj.hostname;
      const parts = hostname.split('.');
      
      if (parts.length > 2) {
        return parts.slice(0, -2).join('.');
      }
      
      return '';
    } catch {
      return '';
    }
  }, [url]);

  // Get path segments
  const getPathSegments = useCallback((urlToParse = url) => {
    if (!urlToParse || typeof urlToParse !== 'string') return [];
    
    try {
      const urlObj = new URL(urlToParse);
      return urlObj.pathname.split('/').filter(segment => segment !== '');
    } catch {
      return [];
    }
  }, [url]);

  // Build URL from components
  const buildUrl = useCallback((components) => {
    if (!components || typeof components !== 'object') return '';
    
    const {
      protocol = 'https:',
      hostname = '',
      port = '',
      pathname = '/',
      search = '',
      hash = ''
    } = components;
    
    let builtUrl = protocol + '//' + hostname;
    
    if (port) {
      builtUrl += ':' + port;
    }
    
    builtUrl += pathname + search + hash;
    
    return builtUrl;
  }, []);

  // Normalize URL
  const normalizeUrl = useCallback((urlToNormalize = url) => {
    if (!urlToNormalize || typeof urlToNormalize !== 'string') return '';
    
    try {
      const urlObj = new URL(urlToNormalize);
      
      // Remove trailing slash from pathname (except root)
      if (urlObj.pathname !== '/' && urlObj.pathname.endsWith('/')) {
        urlObj.pathname = urlObj.pathname.slice(0, -1);
      }
      
      return urlObj.href;
    } catch {
      return urlToNormalize;
    }
  }, [url]);

  // Get relative URL
  const getRelativeUrl = useCallback((from, to) => {
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
  }, []);

  // Check if URL is absolute
  const isAbsoluteUrl = useCallback((urlToCheck = url) => {
    if (!urlToCheck || typeof urlToCheck !== 'string') return false;
    
    return /^https?:\/\//.test(urlToCheck);
  }, [url]);

  // Check if URL is relative
  const isRelativeUrl = useCallback((urlToCheck = url) => {
    if (!urlToCheck || typeof urlToCheck !== 'string') return false;
    
    return !isAbsoluteUrl(urlToCheck);
  }, [url, isAbsoluteUrl]);

  // Resolve relative URL against base URL
  const resolveUrl = useCallback((base, relative) => {
    if (!base || !relative || typeof base !== 'string' || typeof relative !== 'string') return '';
    
    try {
      return new URL(relative, base).href;
    } catch {
      return relative;
    }
  }, []);

  // Encode parameters
  const encodeParams = useCallback((params) => {
    if (!params || typeof params !== 'object') return '';
    
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    
    return searchParams.toString();
  }, []);

  // Decode parameters
  const decodeParams = useCallback((queryString) => {
    if (!queryString || typeof queryString !== 'string') return {};
    
    const params = {};
    const searchParams = new URLSearchParams(queryString);
    
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    return params;
  }, []);

  // Set URL
  const setUrlValue = useCallback((newUrl) => {
    if (typeof newUrl === 'string') {
      setUrl(newUrl);
    }
  }, []);

  // Get current URL components
  const getUrlComponents = useCallback(() => {
    return parseUrl();
  }, [parseUrl]);

  // Get current query parameters
  const getCurrentQueryParams = useCallback(() => {
    return getQueryParams();
  }, [getQueryParams]);

  // Get current domain
  const getCurrentDomain = useCallback(() => {
    return getDomain();
  }, [getDomain]);

  // Get current subdomain
  const getCurrentSubdomain = useCallback(() => {
    return getSubdomain();
  }, [getSubdomain]);

  // Get current path segments
  const getCurrentPathSegments = useCallback(() => {
    return getPathSegments();
  }, [getPathSegments]);

  // Check if current URL is valid
  const isCurrentUrlValid = useCallback(() => {
    return isValidUrl();
  }, [isValidUrl]);

  // Check if current URL is absolute
  const isCurrentUrlAbsolute = useCallback(() => {
    return isAbsoluteUrl();
  }, [isAbsoluteUrl]);

  // Check if current URL is relative
  const isCurrentUrlRelative = useCallback(() => {
    return isRelativeUrl();
  }, [isRelativeUrl]);

  // Get normalized current URL
  const getNormalizedUrl = useCallback(() => {
    return normalizeUrl();
  }, [normalizeUrl]);

  return {
    // State
    url,
    
    // URL operations
    setUrl: setUrlValue,
    parseUrl,
    buildUrl,
    normalizeUrl,
    
    // Query parameter operations
    getQueryParams,
    getQueryParam,
    addQueryParams,
    removeQueryParams,
    updateQueryParam,
    encodeParams,
    decodeParams,
    
    // URL validation
    isValidUrl,
    isAbsoluteUrl,
    isRelativeUrl,
    
    // URL components
    getDomain,
    getSubdomain,
    getPathSegments,
    getRelativeUrl,
    resolveUrl,
    
    // Current URL utilities
    getUrlComponents,
    getCurrentQueryParams,
    getCurrentDomain,
    getCurrentSubdomain,
    getCurrentPathSegments,
    isCurrentUrlValid,
    isCurrentUrlAbsolute,
    isCurrentUrlRelative,
    getNormalizedUrl
  };
};

export default useUrl;
