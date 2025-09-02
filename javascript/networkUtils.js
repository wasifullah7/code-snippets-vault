/**
 * Network utility functions for HTTP requests and network operations
 */

/**
 * Make HTTP GET request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const get = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('GET request failed:', error);
    throw error;
  }
};

/**
 * Make HTTP POST request
 * @param {string} url - Request URL
 * @param {*} data - Request data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const post = async (url, data, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('POST request failed:', error);
    throw error;
  }
};

/**
 * Make HTTP PUT request
 * @param {string} url - Request URL
 * @param {*} data - Request data
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const put = async (url, data, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('PUT request failed:', error);
    throw error;
  }
};

/**
 * Make HTTP DELETE request
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @returns {Promise<Object>} Response data
 */
const del = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('DELETE request failed:', error);
    throw error;
  }
};

/**
 * Make HTTP request with retry logic
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {number} retries - Number of retries
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<Object>} Response data
 */
const requestWithRetry = async (url, options = {}, retries = 3, delay = 1000) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return requestWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
};

/**
 * Check if online
 * @returns {boolean} True if online
 */
const isOnline = () => {
  return navigator.onLine;
};

/**
 * Check network status
 * @returns {Object} Network information
 */
const getNetworkInfo = () => {
  if ('connection' in navigator) {
    const connection = navigator.connection;
    return {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData
    };
  }
  return null;
};

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Download filename
 */
const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download failed:', error);
    throw error;
  }
};

/**
 * Upload file to server
 * @param {string} url - Upload URL
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} Upload response
 */
const uploadFile = async (url, file, options = {}) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    if (options.additionalData) {
      Object.entries(options.additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...options.headers
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Upload failed! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
};

/**
 * Check if URL is accessible
 * @param {string} url - URL to check
 * @returns {Promise<boolean>} True if accessible
 */
const isUrlAccessible = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get file size from URL
 * @param {string} url - File URL
 * @returns {Promise<number>} File size in bytes
 */
const getFileSize = async (url) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength) : null;
  } catch (error) {
    console.error('Failed to get file size:', error);
    return null;
  }
};

/**
 * Create WebSocket connection
 * @param {string} url - WebSocket URL
 * @param {Object} options - WebSocket options
 * @returns {WebSocket} WebSocket instance
 */
const createWebSocket = (url, options = {}) => {
  const ws = new WebSocket(url);
  
  if (options.onOpen) ws.onopen = options.onOpen;
  if (options.onMessage) ws.onmessage = options.onMessage;
  if (options.onError) ws.onerror = options.onError;
  if (options.onClose) ws.onclose = options.onClose;
  
  return ws;
};

/**
 * Make request with timeout
 * @param {string} url - Request URL
 * @param {Object} options - Request options
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<Object>} Response data
 */
const requestWithTimeout = async (url, options = {}, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    throw error;
  }
};

module.exports = {
  get,
  post,
  put,
  del,
  requestWithRetry,
  isOnline,
  getNetworkInfo,
  downloadFile,
  uploadFile,
  isUrlAccessible,
  getFileSize,
  createWebSocket,
  requestWithTimeout
};
