/**
 * Network utility functions for network operations and monitoring
 */

/**
 * Check if device is online
 * @returns {boolean} True if device is online
 */
const isOnline = () => {
  if (typeof navigator === 'undefined') return false;
  return navigator.onLine;
};

/**
 * Get network information
 * @returns {Object} Network information
 */
const getNetworkInfo = () => {
  if (typeof navigator === 'undefined') {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }
  
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return {
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0,
      saveData: false
    };
  }
  
  return {
    effectiveType: connection.effectiveType || 'unknown',
    downlink: connection.downlink || 0,
    rtt: connection.rtt || 0,
    saveData: connection.saveData || false
  };
};

/**
 * Make HTTP request
 * @param {string} url - URL to request
 * @param {Object} options - Request options
 * @returns {Promise} Response promise
 */
const makeRequest = async (url, options = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    timeout = 10000
  } = options;
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

/**
 * Download file from URL
 * @param {string} url - File URL
 * @param {string} filename - Download filename
 */
const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Upload file
 * @param {string} url - Upload endpoint
 * @param {File} file - File to upload
 * @param {Object} options - Upload options
 * @returns {Promise} Upload promise
 */
const uploadFile = async (url, file, options = {}) => {
  const {
    onProgress = null,
    headers = {}
  } = options;
  
  const formData = new FormData();
  formData.append('file', file);
  
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    if (onProgress) {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Upload failed'));
    });
    
    xhr.open('POST', url);
    
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });
    
    xhr.send(formData);
  });
};

/**
 * Check if URL is reachable
 * @param {string} url - URL to check
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<boolean>} True if URL is reachable
 */
const isUrlReachable = async (url, timeout = 5000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Get IP address
 * @returns {Promise<string>} IP address
 */
const getIPAddress = async () => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch {
    return 'Unknown';
  }
};

/**
 * Get geolocation from IP
 * @param {string} ip - IP address
 * @returns {Promise<Object>} Geolocation data
 */
const getGeolocationFromIP = async (ip) => {
  try {
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * Test network speed
 * @param {string} testUrl - URL for speed test
 * @returns {Promise<Object>} Speed test results
 */
const testNetworkSpeed = async (testUrl = 'https://httpbin.org/bytes/1024') => {
  const startTime = performance.now();
  
  try {
    const response = await fetch(testUrl);
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    const size = response.headers.get('content-length') || 1024;
    const speed = (size * 8) / (duration / 1000); // bits per second
    
    return {
      duration,
      size,
      speed,
      speedMbps: speed / (1024 * 1024)
    };
  } catch (error) {
    throw new Error('Speed test failed');
  }
};

/**
 * Create WebSocket connection
 * @param {string} url - WebSocket URL
 * @param {Object} options - Connection options
 * @returns {WebSocket} WebSocket instance
 */
const createWebSocket = (url, options = {}) => {
  const {
    protocols = [],
    onOpen = null,
    onMessage = null,
    onClose = null,
    onError = null
  } = options;
  
  const ws = new WebSocket(url, protocols);
  
  if (onOpen) ws.onopen = onOpen;
  if (onMessage) ws.onmessage = onMessage;
  if (onClose) ws.onclose = onClose;
  if (onError) ws.onerror = onError;
  
  return ws;
};

/**
 * Send data via WebSocket
 * @param {WebSocket} ws - WebSocket instance
 * @param {*} data - Data to send
 * @returns {boolean} True if sent successfully
 */
const sendWebSocketData = (ws, data) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
    return true;
  }
  return false;
};

/**
 * Close WebSocket connection
 * @param {WebSocket} ws - WebSocket instance
 * @param {number} code - Close code
 * @param {string} reason - Close reason
 */
const closeWebSocket = (ws, code = 1000, reason = 'Normal closure') => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.close(code, reason);
  }
};

/**
 * Check if WebSocket is supported
 * @returns {boolean} True if WebSocket is supported
 */
const isWebSocketSupported = () => {
  return typeof WebSocket !== 'undefined';
};

/**
 * Get network status
 * @returns {Object} Network status
 */
const getNetworkStatus = () => {
  return {
    online: isOnline(),
    connection: getNetworkInfo(),
    webSocketSupported: isWebSocketSupported()
  };
};

/**
 * Monitor network changes
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
const monitorNetworkChanges = (callback) => {
  if (typeof window === 'undefined') return () => {};
  
  const handleOnline = () => callback({ type: 'online' });
  const handleOffline = () => callback({ type: 'offline' });
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

/**
 * Retry network request
 * @param {Function} requestFn - Request function
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries
 * @returns {Promise} Request promise
 */
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

/**
 * Batch network requests
 * @param {Array} requests - Array of request functions
 * @param {number} concurrency - Maximum concurrent requests
 * @returns {Promise<Array>} Results array
 */
const batchRequests = async (requests, concurrency = 5) => {
  const results = [];
  const executing = [];
  
  for (const request of requests) {
    const promise = request().then(result => {
      results.push(result);
      return result;
    });
    
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  await Promise.all(executing);
  return results;
};

module.exports = {
  isOnline,
  getNetworkInfo,
  makeRequest,
  downloadFile,
  uploadFile,
  isUrlReachable,
  getIPAddress,
  getGeolocationFromIP,
  testNetworkSpeed,
  createWebSocket,
  sendWebSocketData,
  closeWebSocket,
  isWebSocketSupported,
  getNetworkStatus,
  monitorNetworkChanges,
  retryRequest,
  batchRequests
};