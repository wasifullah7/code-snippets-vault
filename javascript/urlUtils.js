/**
 * URL utilities
 */
const parseUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return {
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      port: urlObj.port,
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      origin: urlObj.origin
    };
  } catch {
    return null;
  }
};

const getQueryParams = (url) => {
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

const addQueryParams = (url, params) => {
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

const removeQueryParams = (url, keys) => {
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

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getDomain = (url) => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

module.exports = {
  parseUrl, getQueryParams, addQueryParams, 
  removeQueryParams, isValidUrl, getDomain
};