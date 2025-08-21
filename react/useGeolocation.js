import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for geolocation functionality
 * Provides real-time location tracking, geocoding, and location utilities
 * @param {Object} options - Hook options
 * @returns {Object} Geolocation state and utilities
 */
function useGeolocation(options = {}) {
  const {
    enableHighAccuracy = true,
    timeout = 10000,
    maximumAge = 300000, // 5 minutes
    watchPosition = false,
    onSuccess = null,
    onError = null
  } = options;

  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const positionRef = useRef(null);
  const errorRef = useRef(null);

  // Success callback
  const handleSuccess = useCallback((pos) => {
    const newPosition = {
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      altitude: pos.coords.altitude,
      altitudeAccuracy: pos.coords.altitudeAccuracy,
      heading: pos.coords.heading,
      speed: pos.coords.speed,
      timestamp: pos.timestamp
    };

    setPosition(newPosition);
    setError(null);
    setLoading(false);
    setLastUpdated(new Date());
    positionRef.current = newPosition;

    if (onSuccess) {
      onSuccess(newPosition);
    }
  }, [onSuccess]);

  // Error callback
  const handleError = useCallback((err) => {
    const errorInfo = {
      code: err.code,
      message: err.message,
      timestamp: Date.now()
    };

    setError(errorInfo);
    setLoading(false);
    errorRef.current = errorInfo;

    if (onError) {
      onError(errorInfo);
    }
  }, [onError]);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) {
      handleError({
        code: 2,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      handleError({
        code: 2,
        message: 'Geolocation is not supported by this browser'
      });
      return;
    }

    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
    }

    setLoading(true);
    setError(null);

    const id = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, handleSuccess, handleError, watchId]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  // Calculate distance between two points
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Calculate bearing between two points
  const calculateBearing = useCallback((lat1, lon1, lat2, lon2) => {
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const lat1Rad = lat1 * Math.PI / 180;
    const lat2Rad = lat2 * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2Rad);
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
              Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLon);
    
    return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
  }, []);

  // Check if position is within radius
  const isWithinRadius = useCallback((targetLat, targetLon, radiusKm) => {
    if (!position) return false;
    
    const distance = calculateDistance(
      position.latitude,
      position.longitude,
      targetLat,
      targetLon
    );
    
    return distance <= radiusKm;
  }, [position, calculateDistance]);

  // Get formatted address from coordinates
  const getAddressFromCoords = useCallback(async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Geocoding error: ${error.message}`);
    }
  }, []);

  // Get coordinates from address
  const getCoordsFromAddress = useCallback(async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch coordinates');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        throw new Error('Address not found');
      }
      
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
        displayName: data[0].display_name
      };
    } catch (error) {
      throw new Error(`Reverse geocoding error: ${error.message}`);
    }
  }, []);

  // Initialize geolocation
  useEffect(() => {
    if (watchPosition) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      if (watchId) {
        stopWatching();
      }
    };
  }, [watchPosition, startWatching, getCurrentPosition, stopWatching, watchId]);

  return {
    // State
    position,
    error,
    loading,
    lastUpdated,
    isWatching: !!watchId,
    
    // Actions
    getCurrentPosition,
    startWatching,
    stopWatching,
    
    // Utilities
    calculateDistance,
    calculateBearing,
    isWithinRadius,
    getAddressFromCoords,
    getCoordsFromAddress,
    
    // Computed values
    hasPosition: !!position,
    hasError: !!error,
    accuracy: position?.accuracy || null,
    speed: position?.speed || null,
    heading: position?.heading || null,
    altitude: position?.altitude || null
  };
}

/**
 * Hook for location-based features
 * @param {Object} options - Hook options
 * @returns {Object} Location-based utilities
 */
function useLocationFeatures(options = {}) {
  const {
    targetLocation = null,
    radiusKm = 1,
    checkInterval = 30000, // 30 seconds
    ...geolocationOptions
  } = options;

  const geolocation = useGeolocation({
    watchPosition: true,
    ...geolocationOptions
  });

  const [isNearTarget, setIsNearTarget] = useState(false);
  const [distanceToTarget, setDistanceToTarget] = useState(null);
  const [bearingToTarget, setBearingToTarget] = useState(null);

  // Check proximity to target
  useEffect(() => {
    if (!targetLocation || !geolocation.position) return;

    const distance = geolocation.calculateDistance(
      geolocation.position.latitude,
      geolocation.position.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );

    const bearing = geolocation.calculateBearing(
      geolocation.position.latitude,
      geolocation.position.longitude,
      targetLocation.latitude,
      targetLocation.longitude
    );

    setDistanceToTarget(distance);
    setBearingToTarget(bearing);
    setIsNearTarget(distance <= radiusKm);
  }, [geolocation.position, targetLocation, radiusKm, geolocation.calculateDistance, geolocation.calculateBearing]);

  return {
    ...geolocation,
    isNearTarget,
    distanceToTarget,
    bearingToTarget,
    targetLocation
  };
}

/**
 * Hook for location history tracking
 * @param {Object} options - Hook options
 * @returns {Object} Location history utilities
 */
function useLocationHistory(options = {}) {
  const {
    maxHistorySize = 100,
    saveToStorage = false,
    storageKey = 'location_history',
    ...geolocationOptions
  } = options;

  const geolocation = useGeolocation({
    watchPosition: true,
    ...geolocationOptions
  });

  const [history, setHistory] = useState([]);
  const [totalDistance, setTotalDistance] = useState(0);

  // Load history from storage
  useEffect(() => {
    if (saveToStorage) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          setHistory(parsed.history || []);
          setTotalDistance(parsed.totalDistance || 0);
        }
      } catch (error) {
        console.error('Failed to load location history:', error);
      }
    }
  }, [saveToStorage, storageKey]);

  // Save history to storage
  useEffect(() => {
    if (saveToStorage && history.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          history,
          totalDistance,
          lastUpdated: Date.now()
        }));
      } catch (error) {
        console.error('Failed to save location history:', error);
      }
    }
  }, [history, totalDistance, saveToStorage, storageKey]);

  // Add position to history
  useEffect(() => {
    if (!geolocation.position) return;

    setHistory(prev => {
      const newHistory = [...prev, {
        ...geolocation.position,
        timestamp: Date.now()
      }];

      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.splice(0, newHistory.length - maxHistorySize);
      }

      return newHistory;
    });
  }, [geolocation.position, maxHistorySize]);

  // Calculate total distance
  useEffect(() => {
    if (history.length < 2) {
      setTotalDistance(0);
      return;
    }

    let total = 0;
    for (let i = 1; i < history.length; i++) {
      const prev = history[i - 1];
      const curr = history[i];
      
      total += geolocation.calculateDistance(
        prev.latitude,
        prev.longitude,
        curr.latitude,
        curr.longitude
      );
    }

    setTotalDistance(total);
  }, [history, geolocation.calculateDistance]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    setTotalDistance(0);
    
    if (saveToStorage) {
      localStorage.removeItem(storageKey);
    }
  }, [saveToStorage, storageKey]);

  // Get history statistics
  const getHistoryStats = useCallback(() => {
    if (history.length === 0) {
      return {
        totalPoints: 0,
        totalDistance: 0,
        averageSpeed: 0,
        duration: 0,
        startTime: null,
        endTime: null
      };
    }

    const startTime = history[0].timestamp;
    const endTime = history[history.length - 1].timestamp;
    const duration = (endTime - startTime) / 1000 / 60; // minutes

    const speeds = history
      .filter(pos => pos.speed !== null && pos.speed !== undefined)
      .map(pos => pos.speed);

    const averageSpeed = speeds.length > 0 
      ? speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
      : 0;

    return {
      totalPoints: history.length,
      totalDistance,
      averageSpeed,
      duration,
      startTime: new Date(startTime),
      endTime: new Date(endTime)
    };
  }, [history, totalDistance]);

  return {
    ...geolocation,
    history,
    totalDistance,
    clearHistory,
    getHistoryStats
  };
}

/**
 * Hook for location-based notifications
 * @param {Object} options - Hook options
 * @returns {Object} Location notification utilities
 */
function useLocationNotifications(options = {}) {
  const {
    notifications = [],
    checkInterval = 10000, // 10 seconds
    ...geolocationOptions
  } = options;

  const geolocation = useGeolocation({
    watchPosition: true,
    ...geolocationOptions
  });

  const [triggeredNotifications, setTriggeredNotifications] = useState(new Set());
  const [lastCheck, setLastCheck] = useState(null);

  // Check notifications
  useEffect(() => {
    if (!geolocation.position || notifications.length === 0) return;

    const now = Date.now();
    if (lastCheck && now - lastCheck < checkInterval) return;

    setLastCheck(now);

    notifications.forEach(notification => {
      if (triggeredNotifications.has(notification.id)) return;

      const isNearby = geolocation.isWithinRadius(
        notification.latitude,
        notification.longitude,
        notification.radiusKm || 1
      );

      if (isNearby) {
        setTriggeredNotifications(prev => new Set([...prev, notification.id]));
        
        if (notification.onTrigger) {
          notification.onTrigger({
            ...notification,
            currentPosition: geolocation.position,
            distance: geolocation.calculateDistance(
              geolocation.position.latitude,
              geolocation.position.longitude,
              notification.latitude,
              notification.longitude
            )
          });
        }
      }
    });
  }, [
    geolocation.position,
    notifications,
    triggeredNotifications,
    lastCheck,
    checkInterval,
    geolocation.isWithinRadius,
    geolocation.calculateDistance
  ]);

  // Reset triggered notifications
  const resetNotifications = useCallback(() => {
    setTriggeredNotifications(new Set());
  }, []);

  // Clear specific notification
  const clearNotification = useCallback((notificationId) => {
    setTriggeredNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(notificationId);
      return newSet;
    });
  }, []);

  return {
    ...geolocation,
    triggeredNotifications: Array.from(triggeredNotifications),
    resetNotifications,
    clearNotification
  };
}

export {
  useGeolocation,
  useLocationFeatures,
  useLocationHistory,
  useLocationNotifications
};

export default useGeolocation;
