import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for geolocation functionality
 * Provides real-time location tracking and geolocation utilities
 * @param {Object} options - Geolocation options
 * @returns {Object} Geolocation state and methods
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
  const [isLoading, setIsLoading] = useState(false);
  const [accuracy, setAccuracy] = useState(null);
  const [timestamp, setTimestamp] = useState(null);
  const [heading, setHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [altitude, setAltitude] = useState(null);
  const [altitudeAccuracy, setAltitudeAccuracy] = useState(null);

  const watchIdRef = useRef(null);
  const isSupportedRef = useRef('geolocation' in navigator);

  // Get current position
  const getCurrentPosition = useCallback(() => {
    if (!isSupportedRef.current) {
      setError(new Error('Geolocation is not supported by this browser'));
      return;
    }

    setIsLoading(true);
    setError(null);

    const successCallback = (pos) => {
      const { coords, timestamp: posTimestamp } = pos;
      
      setPosition({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      setAccuracy(coords.accuracy);
      setTimestamp(posTimestamp);
      setHeading(coords.heading);
      setSpeed(coords.speed);
      setAltitude(coords.altitude);
      setAltitudeAccuracy(coords.altitudeAccuracy);
      setIsLoading(false);

      if (onSuccess) {
        onSuccess(pos);
      }
    };

    const errorCallback = (err) => {
      let errorMessage = 'Unknown geolocation error';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Geolocation permission denied';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case err.TIMEOUT:
          errorMessage = 'Geolocation request timed out';
          break;
      }

      const geolocationError = new Error(errorMessage);
      setError(geolocationError);
      setIsLoading(false);

      if (onError) {
        onError(geolocationError);
      }
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  // Start watching position
  const startWatching = useCallback(() => {
    if (!isSupportedRef.current) {
      setError(new Error('Geolocation is not supported by this browser'));
      return;
    }

    if (watchIdRef.current) {
      return; // Already watching
    }

    setIsLoading(true);
    setError(null);

    const successCallback = (pos) => {
      const { coords, timestamp: posTimestamp } = pos;
      
      setPosition({
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      setAccuracy(coords.accuracy);
      setTimestamp(posTimestamp);
      setHeading(coords.heading);
      setSpeed(coords.speed);
      setAltitude(coords.altitude);
      setAltitudeAccuracy(coords.altitudeAccuracy);
      setIsLoading(false);

      if (onSuccess) {
        onSuccess(pos);
      }
    };

    const errorCallback = (err) => {
      let errorMessage = 'Unknown geolocation error';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Geolocation permission denied';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable';
          break;
        case err.TIMEOUT:
          errorMessage = 'Geolocation request timed out';
          break;
      }

      const geolocationError = new Error(errorMessage);
      setError(geolocationError);
      setIsLoading(false);

      if (onError) {
        onError(geolocationError);
      }
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      successCallback,
      errorCallback,
      {
        enableHighAccuracy,
        timeout,
        maximumAge
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, onSuccess, onError]);

  // Stop watching position
  const stopWatching = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Clear position data
  const clearPosition = useCallback(() => {
    setPosition(null);
    setError(null);
    setAccuracy(null);
    setTimestamp(null);
    setHeading(null);
    setSpeed(null);
    setAltitude(null);
    setAltitudeAccuracy(null);
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Get distance from current position to target
  const getDistanceTo = useCallback((targetLat, targetLon) => {
    if (!position) {
      return null;
    }
    return calculateDistance(position.latitude, position.longitude, targetLat, targetLon);
  }, [position, calculateDistance]);

  // Get bearing to target
  const getBearingTo = useCallback((targetLat, targetLon) => {
    if (!position) {
      return null;
    }

    const lat1 = position.latitude * Math.PI / 180;
    const lat2 = targetLat * Math.PI / 180;
    const dLon = (targetLon - position.longitude) * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    let bearing = Math.atan2(y, x) * 180 / Math.PI;
    bearing = (bearing + 360) % 360;
    
    return bearing;
  }, [position]);

  // Get formatted address from coordinates
  const getAddressFromCoords = useCallback(async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error('Error getting address:', error);
      return null;
    }
  }, []);

  // Get current address
  const getCurrentAddress = useCallback(async () => {
    if (!position) {
      return null;
    }
    return getAddressFromCoords(position.latitude, position.longitude);
  }, [position, getAddressFromCoords]);

  // Get coordinates from address
  const getCoordsFromAddress = useCallback(async (address) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting coordinates:', error);
      return null;
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
      if (watchIdRef.current) {
        stopWatching();
      }
    };
  }, [watchPosition, startWatching, getCurrentPosition, stopWatching]);

  return {
    // State
    position,
    error,
    isLoading,
    accuracy,
    timestamp,
    heading,
    speed,
    altitude,
    altitudeAccuracy,
    isSupported: isSupportedRef.current,
    
    // Methods
    getCurrentPosition,
    startWatching,
    stopWatching,
    clearPosition,
    calculateDistance,
    getDistanceTo,
    getBearingTo,
    getAddressFromCoords,
    getCurrentAddress,
    getCoordsFromAddress
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
    updateInterval = 5000,
    ...geolocationOptions
  } = options;

  const [isNearTarget, setIsNearTarget] = useState(false);
  const [distanceToTarget, setDistanceToTarget] = useState(null);
  const [bearingToTarget, setBearingToTarget] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [averageSpeed, setAverageSpeed] = useState(null);

  const geolocation = useGeolocation({
    ...geolocationOptions,
    watchPosition: true
  });

  // Update location history
  useEffect(() => {
    if (geolocation.position) {
      setLocationHistory(prev => [...prev.slice(-49), {
        ...geolocation.position,
        timestamp: geolocation.timestamp,
        accuracy: geolocation.accuracy
      }]);
    }
  }, [geolocation.position, geolocation.timestamp, geolocation.accuracy]);

  // Calculate average speed
  useEffect(() => {
    if (locationHistory.length >= 2) {
      const recentPositions = locationHistory.slice(-10);
      let totalDistance = 0;
      let totalTime = 0;

      for (let i = 1; i < recentPositions.length; i++) {
        const prev = recentPositions[i - 1];
        const curr = recentPositions[i];
        
        const distance = geolocation.calculateDistance(
          prev.latitude, prev.longitude,
          curr.latitude, curr.longitude
        );
        
        const time = (curr.timestamp - prev.timestamp) / 1000 / 3600; // hours
        
        totalDistance += distance;
        totalTime += time;
      }

      if (totalTime > 0) {
        setAverageSpeed(totalDistance / totalTime); // km/h
      }
    }
  }, [locationHistory, geolocation.calculateDistance]);

  // Check if near target
  useEffect(() => {
    if (targetLocation && geolocation.position) {
      const distance = geolocation.getDistanceTo(targetLocation.latitude, targetLocation.longitude);
      setDistanceToTarget(distance);
      setIsNearTarget(distance <= (targetLocation.radius || 0.1)); // Default 100m radius
      
      const bearing = geolocation.getBearingTo(targetLocation.latitude, targetLocation.longitude);
      setBearingToTarget(bearing);
    }
  }, [targetLocation, geolocation.position, geolocation.getDistanceTo, geolocation.getBearingTo]);

  // Get movement direction
  const getMovementDirection = useCallback(() => {
    if (locationHistory.length < 2) {
      return null;
    }

    const recent = locationHistory.slice(-2);
    const bearing = geolocation.getBearingTo(
      recent[1].latitude,
      recent[1].longitude
    );

    if (bearing >= 315 || bearing < 45) return 'N';
    if (bearing >= 45 && bearing < 135) return 'E';
    if (bearing >= 135 && bearing < 225) return 'S';
    if (bearing >= 225 && bearing < 315) return 'W';
    
    return null;
  }, [locationHistory, geolocation.getBearingTo]);

  // Get total distance traveled
  const getTotalDistance = useCallback(() => {
    if (locationHistory.length < 2) {
      return 0;
    }

    let totalDistance = 0;
    for (let i = 1; i < locationHistory.length; i++) {
      const prev = locationHistory[i - 1];
      const curr = locationHistory[i];
      
      totalDistance += geolocation.calculateDistance(
        prev.latitude, prev.longitude,
        curr.latitude, curr.longitude
      );
    }

    return totalDistance;
  }, [locationHistory, geolocation.calculateDistance]);

  // Get estimated time of arrival
  const getETA = useCallback((targetLat, targetLon, speed = averageSpeed) => {
    if (!geolocation.position || !speed || speed <= 0) {
      return null;
    }

    const distance = geolocation.getDistanceTo(targetLat, targetLon);
    if (!distance) {
      return null;
    }

    const timeHours = distance / speed;
    const timeMinutes = timeHours * 60;
    
    return {
      hours: Math.floor(timeHours),
      minutes: Math.floor(timeMinutes % 60),
      totalMinutes: Math.floor(timeMinutes)
    };
  }, [geolocation.position, geolocation.getDistanceTo, averageSpeed]);

  return {
    ...geolocation,
    isNearTarget,
    distanceToTarget,
    bearingToTarget,
    locationHistory,
    averageSpeed,
    getMovementDirection,
    getTotalDistance,
    getETA
  };
}

/**
 * Hook for geofencing functionality
 * @param {Array} geofences - Array of geofence objects
 * @param {Object} options - Hook options
 * @returns {Object} Geofencing state and methods
 */
function useGeofencing(geofences = [], options = {}) {
  const {
    checkInterval = 1000,
    onEnter = null,
    onExit = null,
    ...geolocationOptions
  } = options;

  const [activeGeofences, setActiveGeofences] = useState([]);
  const [geofenceEvents, setGeofenceEvents] = useState([]);

  const geolocation = useGeolocation({
    ...geolocationOptions,
    watchPosition: true
  });

  // Check geofences
  useEffect(() => {
    if (!geolocation.position || geofences.length === 0) {
      return;
    }

    const interval = setInterval(() => {
      const currentPosition = geolocation.position;
      const newActiveGeofences = [];

      geofences.forEach(geofence => {
        const distance = geolocation.getDistanceTo(geofence.latitude, geofence.longitude);
        const isInside = distance <= geofence.radius;

        if (isInside) {
          newActiveGeofences.push(geofence);
        }

        // Check if entering or exiting
        const wasInside = activeGeofences.some(g => g.id === geofence.id);
        
        if (isInside && !wasInside) {
          // Entering geofence
          const event = {
            type: 'enter',
            geofence,
            timestamp: Date.now(),
            position: currentPosition
          };
          
          setGeofenceEvents(prev => [...prev, event]);
          if (onEnter) onEnter(event);
        } else if (!isInside && wasInside) {
          // Exiting geofence
          const event = {
            type: 'exit',
            geofence,
            timestamp: Date.now(),
            position: currentPosition
          };
          
          setGeofenceEvents(prev => [...prev, event]);
          if (onExit) onExit(event);
        }
      });

      setActiveGeofences(newActiveGeofences);
    }, checkInterval);

    return () => clearInterval(interval);
  }, [geolocation.position, geofences, activeGeofences, geolocation.getDistanceTo, checkInterval, onEnter, onExit]);

  return {
    ...geolocation,
    activeGeofences,
    geofenceEvents,
    clearEvents: () => setGeofenceEvents([])
  };
}

export {
  useGeolocation,
  useLocationFeatures,
  useGeofencing
};

export default useGeolocation;
