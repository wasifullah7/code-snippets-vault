import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for network monitoring and operations
 * @returns {Object} Network state and functions
 */
const useNetwork = () => {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator === 'undefined') return false;
    return navigator.onLine;
  });

  const [networkInfo, setNetworkInfo] = useState(() => {
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
  });

  const [ipAddress, setIPAddress] = useState('Unknown');
  const [geolocation, setGeolocation] = useState(null);
  const [networkSpeed, setNetworkSpeed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get network information
  const getNetworkInfo = useCallback(() => {
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
  }, []);

  // Make HTTP request
  const makeRequest = useCallback(async (url, options = {}) => {
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
  }, []);

  // Download file
  const downloadFile = useCallback((url, filename) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Upload file
  const uploadFile = useCallback(async (url, file, options = {}) => {
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
  }, []);

  // Check if URL is reachable
  const isUrlReachable = useCallback(async (url, timeout = 5000) => {
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
  }, []);

  // Get IP address
  const getIPAddress = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      setIPAddress(data.ip);
      return data.ip;
    } catch (error) {
      setError(error.message);
      return 'Unknown';
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get geolocation from IP
  const getGeolocationFromIP = useCallback(async (ip) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();
      setGeolocation(data);
      return data;
    } catch (error) {
      setError(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Test network speed
  const testNetworkSpeed = useCallback(async (testUrl = 'https://httpbin.org/bytes/1024') => {
    try {
      setIsLoading(true);
      setError(null);
      
      const startTime = performance.now();
      const response = await fetch(testUrl);
      const endTime = performance.now();
      
      const duration = endTime - startTime;
      const size = response.headers.get('content-length') || 1024;
      const speed = (size * 8) / (duration / 1000); // bits per second
      
      const speedData = {
        duration,
        size,
        speed,
        speedMbps: speed / (1024 * 1024)
      };
      
      setNetworkSpeed(speedData);
      return speedData;
    } catch (error) {
      setError(error.message);
      throw new Error('Speed test failed');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create WebSocket connection
  const createWebSocket = useCallback((url, options = {}) => {
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
  }, []);

  // Send data via WebSocket
  const sendWebSocketData = useCallback((ws, data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  // Close WebSocket connection
  const closeWebSocket = useCallback((ws, code = 1000, reason = 'Normal closure') => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close(code, reason);
    }
  }, []);

  // Check if WebSocket is supported
  const isWebSocketSupported = useCallback(() => {
    return typeof WebSocket !== 'undefined';
  }, []);

  // Retry network request
  const retryRequest = useCallback(async (requestFn, maxRetries = 3, delay = 1000) => {
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
  }, []);

  // Batch network requests
  const batchRequests = useCallback(async (requests, concurrency = 5) => {
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
  }, []);

  // Update network info
  const updateNetworkInfo = useCallback(() => {
    setNetworkInfo(getNetworkInfo());
  }, [getNetworkInfo]);

  // Effect to monitor network changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updateNetworkInfo();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateNetworkInfo();
    };

    const handleConnectionChange = () => {
      updateNetworkInfo();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkInfo]);

  return {
    // Network state
    isOnline,
    networkInfo,
    ipAddress,
    geolocation,
    networkSpeed,
    isLoading,
    error,
    
    // Network operations
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
    retryRequest,
    batchRequests,
    
    // Utility functions
    updateNetworkInfo
  };
};

export default useNetwork;
