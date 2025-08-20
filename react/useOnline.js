import { useState, useEffect, useCallback } from 'react';

/**
 * Custom React hook for monitoring online/offline status
 * Provides real-time network connectivity status and connection information
 * @param {Object} options - Hook options
 * @returns {Object} Online status and connection information
 */
function useOnline(options = {}) {
  const {
    onOnline = null,
    onOffline = null,
    onConnectionChange = null,
    pollInterval = 30000, // 30 seconds
    enablePolling = false
  } = options;

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionInfo, setConnectionInfo] = useState(null);
  const [lastSeen, setLastSeen] = useState(new Date());
  const [offlineSince, setOfflineSince] = useState(null);

  // Get connection information if available
  const getConnectionInfo = useCallback(() => {
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
  }, []);

  // Update online status
  const updateOnlineStatus = useCallback((online) => {
    setIsOnline(online);
    setLastSeen(new Date());
    
    if (online) {
      setOfflineSince(null);
      if (onOnline) onOnline();
    } else {
      setOfflineSince(new Date());
      if (onOffline) onOffline();
    }
  }, [onOnline, onOffline]);

  // Handle online event
  const handleOnline = useCallback(() => {
    updateOnlineStatus(true);
  }, [updateOnlineStatus]);

  // Handle offline event
  const handleOffline = useCallback(() => {
    updateOnlineStatus(false);
  }, [updateOnlineStatus]);

  // Handle connection change
  const handleConnectionChange = useCallback(() => {
    const newConnectionInfo = getConnectionInfo();
    setConnectionInfo(newConnectionInfo);
    
    if (onConnectionChange) {
      onConnectionChange(newConnectionInfo);
    }
  }, [getConnectionInfo, onConnectionChange]);

  // Poll for online status (fallback for unreliable events)
  const pollOnlineStatus = useCallback(async () => {
    try {
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      if (!isOnline) {
        updateOnlineStatus(true);
      }
    } catch (error) {
      if (isOnline) {
        updateOnlineStatus(false);
      }
    }
  }, [isOnline, updateOnlineStatus]);

  // Set up event listeners
  useEffect(() => {
    // Set initial connection info
    setConnectionInfo(getConnectionInfo());

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Add connection change listener if supported
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', handleConnectionChange);
    }

    // Set up polling if enabled
    let pollIntervalId;
    if (enablePolling && pollInterval > 0) {
      pollIntervalId = setInterval(pollOnlineStatus, pollInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', handleConnectionChange);
      }
      
      if (pollIntervalId) {
        clearInterval(pollIntervalId);
      }
    };
  }, [handleOnline, handleOffline, handleConnectionChange, pollOnlineStatus, enablePolling, pollInterval]);

  // Get offline duration
  const getOfflineDuration = useCallback(() => {
    if (!offlineSince) return 0;
    return Date.now() - offlineSince.getTime();
  }, [offlineSince]);

  // Check if connection is slow
  const isSlowConnection = useCallback(() => {
    if (!connectionInfo) return false;
    return connectionInfo.effectiveType === 'slow-2g' || 
           connectionInfo.effectiveType === '2g' || 
           connectionInfo.effectiveType === '3g';
  }, [connectionInfo]);

  // Check if connection is fast
  const isFastConnection = useCallback(() => {
    if (!connectionInfo) return false;
    return connectionInfo.effectiveType === '4g';
  }, [connectionInfo]);

  // Get connection speed in Mbps
  const getConnectionSpeed = useCallback(() => {
    if (!connectionInfo || !connectionInfo.downlink) return null;
    return connectionInfo.downlink;
  }, [connectionInfo]);

  // Get round trip time in milliseconds
  const getRTT = useCallback(() => {
    if (!connectionInfo || !connectionInfo.rtt) return null;
    return connectionInfo.rtt;
  }, [connectionInfo]);

  return {
    isOnline,
    connectionInfo,
    lastSeen,
    offlineSince,
    offlineDuration: getOfflineDuration(),
    isSlowConnection: isSlowConnection(),
    isFastConnection: isFastConnection(),
    connectionSpeed: getConnectionSpeed(),
    rtt: getRTT(),
    // Utility functions
    getOfflineDuration,
    isSlowConnection,
    isFastConnection,
    getConnectionSpeed,
    getRTT
  };
}

/**
 * Hook for network quality monitoring
 * @param {Object} options - Hook options
 * @returns {Object} Network quality information
 */
function useNetworkQuality(options = {}) {
  const {
    testInterval = 60000, // 1 minute
    testUrl = '/api/ping',
    ...onlineOptions
  } = options;

  const [networkQuality, setNetworkQuality] = useState({
    latency: null,
    jitter: null,
    packetLoss: null,
    quality: 'unknown'
  });

  const [testResults, setTestResults] = useState([]);
  const onlineStatus = useOnline(onlineOptions);

  // Test network latency
  const testLatency = useCallback(async () => {
    const startTime = performance.now();
    
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      const endTime = performance.now();
      const latency = endTime - startTime;
      
      const result = {
        timestamp: new Date(),
        latency,
        success: response.ok
      };
      
      setTestResults(prev => [...prev.slice(-9), result]); // Keep last 10 results
      
      // Calculate network quality metrics
      const recentResults = testResults.slice(-5).concat(result);
      const successfulResults = recentResults.filter(r => r.success);
      
      if (successfulResults.length > 0) {
        const avgLatency = successfulResults.reduce((sum, r) => sum + r.latency, 0) / successfulResults.length;
        
        // Calculate jitter (standard deviation of latency)
        const variance = successfulResults.reduce((sum, r) => sum + Math.pow(r.latency - avgLatency, 2), 0) / successfulResults.length;
        const jitter = Math.sqrt(variance);
        
        // Calculate packet loss
        const packetLoss = ((recentResults.length - successfulResults.length) / recentResults.length) * 100;
        
        // Determine quality level
        let quality = 'unknown';
        if (avgLatency < 50 && jitter < 10 && packetLoss < 1) {
          quality = 'excellent';
        } else if (avgLatency < 100 && jitter < 20 && packetLoss < 5) {
          quality = 'good';
        } else if (avgLatency < 200 && jitter < 50 && packetLoss < 10) {
          quality = 'fair';
        } else {
          quality = 'poor';
        }
        
        setNetworkQuality({
          latency: avgLatency,
          jitter,
          packetLoss,
          quality
        });
      }
    } catch (error) {
      const result = {
        timestamp: new Date(),
        latency: null,
        success: false
      };
      
      setTestResults(prev => [...prev.slice(-9), result]);
    }
  }, [testUrl, testResults]);

  // Set up periodic testing
  useEffect(() => {
    if (!onlineStatus.isOnline) return;
    
    const intervalId = setInterval(testLatency, testInterval);
    
    // Run initial test
    testLatency();
    
    return () => clearInterval(intervalId);
  }, [testLatency, testInterval, onlineStatus.isOnline]);

  return {
    ...onlineStatus,
    networkQuality,
    testResults,
    testLatency
  };
}

/**
 * Hook for network status with detailed metrics
 * @param {Object} options - Hook options
 * @returns {Object} Comprehensive network status
 */
function useNetworkStatus(options = {}) {
  const networkQuality = useNetworkQuality(options);
  
  // Get connection type description
  const getConnectionTypeDescription = useCallback(() => {
    if (!networkQuality.connectionInfo) return 'Unknown';
    
    const type = networkQuality.connectionInfo.effectiveType;
    const descriptions = {
      'slow-2g': 'Very Slow (2G)',
      '2g': 'Slow (2G)',
      '3g': 'Moderate (3G)',
      '4g': 'Fast (4G)'
    };
    
    return descriptions[type] || type;
  }, [networkQuality.connectionInfo]);

  // Get network status summary
  const getStatusSummary = useCallback(() => {
    if (!networkQuality.isOnline) {
      return {
        status: 'offline',
        message: 'No internet connection',
        severity: 'error'
      };
    }
    
    if (networkQuality.isSlowConnection()) {
      return {
        status: 'slow',
        message: 'Slow connection detected',
        severity: 'warning'
      };
    }
    
    if (networkQuality.networkQuality.quality === 'poor') {
      return {
        status: 'poor',
        message: 'Poor network quality',
        severity: 'warning'
      };
    }
    
    return {
      status: 'good',
      message: 'Good connection',
      severity: 'success'
    };
  }, [networkQuality.isOnline, networkQuality.isSlowConnection, networkQuality.networkQuality.quality]);

  return {
    ...networkQuality,
    connectionTypeDescription: getConnectionTypeDescription(),
    statusSummary: getStatusSummary(),
    // Additional utility functions
    getConnectionTypeDescription,
    getStatusSummary
  };
}

/**
 * Hook for network-aware component rendering
 * @param {Object} options - Hook options
 * @returns {Object} Network-aware rendering options
 */
function useNetworkAware(options = {}) {
  const {
    offlineFallback = true,
    slowConnectionFallback = true,
    qualityThreshold = 'fair',
    ...networkOptions
  } = options;

  const networkStatus = useNetworkStatus(networkOptions);
  
  // Determine if we should show fallback content
  const shouldShowFallback = useCallback(() => {
    if (!networkStatus.isOnline && offlineFallback) {
      return true;
    }
    
    if (networkStatus.isSlowConnection() && slowConnectionFallback) {
      return true;
    }
    
    const qualityLevels = { 'excellent': 4, 'good': 3, 'fair': 2, 'poor': 1 };
    const currentQuality = qualityLevels[networkStatus.networkQuality.quality] || 0;
    const thresholdQuality = qualityLevels[qualityThreshold] || 2;
    
    return currentQuality < thresholdQuality;
  }, [networkStatus.isOnline, networkStatus.isSlowConnection, networkStatus.networkQuality.quality, offlineFallback, slowConnectionFallback, qualityThreshold]);

  // Get appropriate content strategy
  const getContentStrategy = useCallback(() => {
    if (!networkStatus.isOnline) {
      return 'offline';
    }
    
    if (networkStatus.isSlowConnection()) {
      return 'low-bandwidth';
    }
    
    if (networkStatus.networkQuality.quality === 'poor') {
      return 'reduced';
    }
    
    return 'full';
  }, [networkStatus.isOnline, networkStatus.isSlowConnection, networkStatus.networkQuality.quality]);

  return {
    ...networkStatus,
    shouldShowFallback: shouldShowFallback(),
    contentStrategy: getContentStrategy(),
    // Utility functions
    shouldShowFallback,
    getContentStrategy
  };
}

export {
  useOnline,
  useNetworkQuality,
  useNetworkStatus,
  useNetworkAware
};

export default useOnline;
