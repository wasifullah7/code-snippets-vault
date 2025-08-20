/**
 * Advanced network utilities for modern JavaScript
 * Comprehensive network monitoring, connectivity checks, and API utilities
 */

/**
 * Network connectivity monitor
 * Monitors network status and provides real-time connectivity information
 */
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.connectionType = null;
    this.downlink = null;
    this.rtt = null;
    this.effectiveType = null;
    this.listeners = new Map();
    
    this.initialize();
  }

  /**
   * Initialize network monitoring
   */
  initialize() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('online');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('offline');
    });

    // Monitor connection changes if supported
    if ('connection' in navigator) {
      const connection = navigator.connection;
      
      this.connectionType = connection.effectiveType;
      this.downlink = connection.downlink;
      this.rtt = connection.rtt;
      this.effectiveType = connection.effectiveType;

      connection.addEventListener('change', () => {
        this.connectionType = connection.effectiveType;
        this.downlink = connection.downlink;
        this.rtt = connection.rtt;
        this.effectiveType = connection.effectiveType;
        
        this.emit('change', {
          type: this.connectionType,
          downlink: this.downlink,
          rtt: this.rtt,
          effectiveType: this.effectiveType
        });
      });
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  /**
   * Get current network status
   * @returns {Object} Network status information
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      connectionType: this.connectionType,
      downlink: this.downlink,
      rtt: this.rtt,
      effectiveType: this.effectiveType
    };
  }

  /**
   * Check if connection is slow (2G or 3G)
   * @returns {boolean} Whether connection is slow
   */
  isSlowConnection() {
    return this.effectiveType === 'slow-2g' || 
           this.effectiveType === '2g' || 
           this.effectiveType === '3g';
  }

  /**
   * Check if connection is fast (4G)
   * @returns {boolean} Whether connection is fast
   */
  isFastConnection() {
    return this.effectiveType === '4g';
  }
}

/**
 * Network speed tester
 * Tests download and upload speeds
 */
class NetworkSpeedTester {
  constructor() {
    this.testResults = [];
  }

  /**
   * Test download speed
   * @param {string} testUrl - URL to test download speed
   * @param {number} fileSize - File size in bytes
   * @returns {Promise<Object>} Download speed test result
   */
  async testDownloadSpeed(testUrl, fileSize) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const endTime = performance.now();
      
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      const speed = (blob.size / duration) / (1024 * 1024); // MB/s
      
      const result = {
        type: 'download',
        speed: speed,
        duration: duration,
        size: blob.size,
        timestamp: new Date(),
        success: true
      };
      
      this.testResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'download',
        speed: 0,
        duration: 0,
        size: 0,
        timestamp: new Date(),
        success: false,
        error: error.message
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  /**
   * Test upload speed
   * @param {string} uploadUrl - URL to test upload speed
   * @param {Blob} testData - Test data to upload
   * @returns {Promise<Object>} Upload speed test result
   */
  async testUploadSpeed(uploadUrl, testData) {
    const startTime = performance.now();
    
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: testData,
        cache: 'no-cache'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const endTime = performance.now();
      const duration = (endTime - startTime) / 1000; // Convert to seconds
      const speed = (testData.size / duration) / (1024 * 1024); // MB/s
      
      const result = {
        type: 'upload',
        speed: speed,
        duration: duration,
        size: testData.size,
        timestamp: new Date(),
        success: true
      };
      
      this.testResults.push(result);
      return result;
    } catch (error) {
      const result = {
        type: 'upload',
        speed: 0,
        duration: 0,
        size: testData.size,
        timestamp: new Date(),
        success: false,
        error: error.message
      };
      
      this.testResults.push(result);
      return result;
    }
  }

  /**
   * Get average speed from test results
   * @param {string} type - Test type ('download' or 'upload')
   * @returns {number} Average speed in MB/s
   */
  getAverageSpeed(type = 'download') {
    const results = this.testResults.filter(r => r.type === type && r.success);
    
    if (results.length === 0) {
      return 0;
    }
    
    const totalSpeed = results.reduce((sum, result) => sum + result.speed, 0);
    return totalSpeed / results.length;
  }

  /**
   * Get latest test result
   * @param {string} type - Test type ('download' or 'upload')
   * @returns {Object|null} Latest test result
   */
  getLatestResult(type = 'download') {
    const results = this.testResults.filter(r => r.type === type);
    return results.length > 0 ? results[results.length - 1] : null;
  }

  /**
   * Clear test results
   */
  clearResults() {
    this.testResults = [];
  }
}

/**
 * API request manager with retry logic and caching
 */
class ApiManager {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || '';
    this.defaultHeaders = options.defaultHeaders || {};
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.cache = new Map();
    this.cacheTimeout = options.cacheTimeout || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Make HTTP request with retry logic
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async request(url, options = {}) {
    const fullUrl = this.baseUrl + url;
    const requestOptions = {
      headers: { ...this.defaultHeaders, ...options.headers },
      timeout: options.timeout || this.timeout,
      ...options
    };

    let lastError;
    
    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
        
        const response = await fetch(fullUrl, {
          ...requestOptions,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        return { data, response, attempt };
      } catch (error) {
        lastError = error;
        
        if (attempt < this.retryAttempts) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async get(url, options = {}) {
    return this.request(url, { method: 'GET', ...options });
  }

  /**
   * POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async post(url, data, options = {}) {
    return this.request(url, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
  }

  /**
   * PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request data
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async put(url, data, options = {}) {
    return this.request(url, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
  }

  /**
   * DELETE request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async delete(url, options = {}) {
    return this.request(url, { method: 'DELETE', ...options });
  }

  /**
   * Cached GET request
   * @param {string} url - Request URL
   * @param {Object} options - Request options
   * @returns {Promise<Object>} Response data
   */
  async getCached(url, options = {}) {
    const cacheKey = `${url}_${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    
    const result = await this.get(url, options);
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });
    
    return result;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * WebSocket manager with reconnection logic
 */
class WebSocketManager {
  constructor(url, options = {}) {
    this.url = url;
    this.options = {
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000,
      maxReconnectDelay: options.maxReconnectDelay || 30000,
      ...options
    };
    
    this.ws = null;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.listeners = new Map();
    this.isConnecting = false;
    
    this.connect();
  }

  /**
   * Connect to WebSocket
   */
  connect() {
    if (this.isConnecting) return;
    
    this.isConnecting = true;
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        this.isConnecting = false;
        this.reconnectCount = 0;
        this.emit('open');
      };
      
      this.ws.onmessage = (event) => {
        this.emit('message', event.data);
      };
      
      this.ws.onclose = (event) => {
        this.isConnecting = false;
        this.emit('close', event);
        
        if (!event.wasClean && this.reconnectCount < this.options.reconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        this.isConnecting = false;
        this.emit('error', error);
      };
    } catch (error) {
      this.isConnecting = false;
      this.emit('error', error);
    }
  }

  /**
   * Schedule reconnection
   */
  scheduleReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    const delay = Math.min(
      this.options.reconnectDelay * Math.pow(2, this.reconnectCount),
      this.options.maxReconnectDelay
    );
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectCount++;
      this.connect();
    }, delay);
  }

  /**
   * Send message
   * @param {*} data - Data to send
   */
  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      throw new Error('WebSocket is not connected');
    }
  }

  /**
   * Close connection
   */
  close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.ws) {
      this.ws.close();
    }
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  /**
   * Get connection state
   * @returns {string} Connection state
   */
  getState() {
    if (!this.ws) return 'CLOSED';
    
    const states = {
      [WebSocket.CONNECTING]: 'CONNECTING',
      [WebSocket.OPEN]: 'OPEN',
      [WebSocket.CLOSING]: 'CLOSING',
      [WebSocket.CLOSED]: 'CLOSED'
    };
    
    return states[this.ws.readyState] || 'UNKNOWN';
  }
}

/**
 * Network utilities
 */
const networkUtils = {
  /**
   * Check if user is online
   * @returns {boolean} Whether user is online
   */
  isOnline() {
    return navigator.onLine;
  },

  /**
   * Get connection information
   * @returns {Object} Connection information
   */
  getConnectionInfo() {
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
  },

  /**
   * Ping a URL to check connectivity
   * @param {string} url - URL to ping
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<boolean>} Whether ping was successful
   */
  async ping(url, timeout = 5000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  },

  /**
   * Get IP address using external service
   * @returns {Promise<string>} IP address
   */
  async getIpAddress() {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      throw new Error('Failed to get IP address');
    }
  },

  /**
   * Get geolocation from IP
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Geolocation data
   */
  async getIpGeolocation(ip) {
    try {
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error('Failed to get geolocation');
    }
  }
};

// Export all classes and utilities
export {
  NetworkMonitor,
  NetworkSpeedTester,
  ApiManager,
  WebSocketManager,
  networkUtils
};

export default networkUtils;
