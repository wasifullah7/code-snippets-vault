/**
 * Network and HTTP utility functions
 */

/**
 * Check if device is online
 * @returns {boolean} Online status
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Get network connection information
 * @returns {Object} Connection info
 */
export const getConnectionInfo = () => {
  if (!navigator.connection) {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }
  
  return {
    effectiveType: navigator.connection.effectiveType,
    downlink: navigator.connection.downlink,
    rtt: navigator.connection.rtt,
    saveData: navigator.connection.saveData
  };
};

/**
 * Simple fetch wrapper with timeout
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Retry fetch with exponential backoff
 * @param {string} url - Request URL
 * @param {Object} options - Fetch options
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<Response>} Fetch response
 */
export const fetchWithRetry = async (url, options = {}, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fetch(url, options);
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Download filename
 * @returns {Promise<void>}
 */
export const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
};

/**
 * Upload file with progress tracking
 * @param {File} file - File to upload
 * @param {string} url - Upload endpoint
 * @param {Function} onProgress - Progress callback
 * @param {Object} options - Upload options
 * @returns {Promise<Response>} Upload response
 */
export const uploadFile = async (file, url, onProgress, options = {}) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Progress tracking
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    // Setup request
    const formData = new FormData();
    formData.append(options.fieldName || 'file', file);
    
    // Add additional fields
    if (options.fields) {
      Object.entries(options.fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }
    
    xhr.open(options.method || 'POST', url);
    
    // Add headers (except Content-Type for FormData)
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== 'content-type') {
          xhr.setRequestHeader(key, value);
        }
      });
    }
    
    xhr.send(formData);
  });
};

/**
 * Ping URL to check availability
 * @param {string} url - URL to ping
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Ping result
 */
export const pingUrl = async (url, timeout = 5000) => {
  const startTime = performance.now();
  
  try {
    const response = await fetchWithTimeout(url, { method: 'HEAD' }, timeout);
    const endTime = performance.now();
    
    return {
      success: response.ok,
      status: response.status,
      latency: Math.round(endTime - startTime),
      url
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      latency: 0,
      url,
      error: error.message
    };
  }
};

/**
 * Get user's public IP address
 * @returns {Promise<string>} Public IP address
 */
export const getPublicIP = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    throw new Error('Failed to get public IP');
  }
};

/**
 * Check if URL is reachable
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} Reachability status
 */
export const isUrlReachable = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get domain information
 * @param {string} url - URL to analyze
 * @returns {Object} Domain information
 */
export const getDomainInfo = (url) => {
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
      subdomain: urlObj.hostname.split('.').slice(0, -2).join('.'),
      domain: urlObj.hostname.split('.').slice(-2).join('.'),
      tld: urlObj.hostname.split('.').pop()
    };
  } catch (error) {
    throw new Error('Invalid URL');
  }
};