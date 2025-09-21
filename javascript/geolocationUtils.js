/**
 * Geolocation utilities for web applications
 */

/**
 * Get current position with options
 * @param {Object} options - Geolocation options
 * @returns {Promise<Object>} Position data
 */
export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
          timestamp: position.timestamp
        });
      },
      (error) => {
        let errorMessage;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'User denied the request for Geolocation';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'The request to get user location timed out';
            break;
          default:
            errorMessage = 'An unknown error occurred';
            break;
        }
        reject(new Error(errorMessage));
      },
      { ...defaultOptions, ...options }
    );
  });
};

/**
 * Watch position changes
 * @param {Function} callback - Success callback
 * @param {Function} errorCallback - Error callback
 * @param {Object} options - Watch options
 * @returns {number} Watch ID
 */
export const watchPosition = (callback, errorCallback, options = {}) => {
  if (!navigator.geolocation) {
    errorCallback(new Error('Geolocation is not supported'));
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      callback({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        altitudeAccuracy: position.coords.altitudeAccuracy,
        heading: position.coords.heading,
        speed: position.coords.speed,
        timestamp: position.timestamp
      });
    },
    errorCallback,
    { ...defaultOptions, ...options }
  );
};

/**
 * Clear position watch
 * @param {number} watchId - Watch ID to clear
 */
export const clearWatch = (watchId) => {
  if (navigator.geolocation && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
};

/**
 * Calculate distance between two coordinates (Haversine formula)
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @param {string} unit - Unit of measurement (km, mi, m, ft)
 * @returns {number} Distance in specified unit
 */
export const calculateDistance = (coord1, coord2, unit = 'km') => {
  const R = {
    km: 6371,
    mi: 3959,
    m: 6371000,
    ft: 20902231
  };

  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) * 
    Math.cos(toRadians(coord2.latitude)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R[unit] * c;

  return Math.round(distance * 100) / 100;
};

/**
 * Convert degrees to radians
 * @param {number} degrees - Degrees to convert
 * @returns {number} Radians
 */
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Convert radians to degrees
 * @param {number} radians - Radians to convert
 * @returns {number} Degrees
 */
const toDegrees = (radians) => {
  return radians * (180 / Math.PI);
};

/**
 * Calculate bearing between two coordinates
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Bearing in degrees
 */
export const calculateBearing = (coord1, coord2) => {
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = 
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360;
};

/**
 * Find midpoint between two coordinates
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {Object} Midpoint coordinate
 */
export const findMidpoint = (coord1, coord2) => {
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const Bx = Math.cos(lat2) * Math.cos(dLon);
  const By = Math.cos(lat2) * Math.sin(dLon);

  const lat3 = Math.atan2(
    Math.sin(lat1) + Math.sin(lat2),
    Math.sqrt((Math.cos(lat1) + Bx) * (Math.cos(lat1) + Bx) + By * By)
  );

  const lon3 = toRadians(coord1.longitude) + Math.atan2(By, Math.cos(lat1) + Bx);

  return {
    latitude: toDegrees(lat3),
    longitude: toDegrees(lon3)
  };
};

/**
 * Check if coordinates are within a bounding box
 * @param {Object} coord - Coordinate to check {latitude, longitude}
 * @param {Object} bounds - Bounding box {north, south, east, west}
 * @returns {boolean} Is within bounds
 */
export const isWithinBounds = (coord, bounds) => {
  return (
    coord.latitude >= bounds.south &&
    coord.latitude <= bounds.north &&
    coord.longitude >= bounds.west &&
    coord.longitude <= bounds.east
  );
};

/**
 * Create bounding box from center point and radius
 * @param {Object} center - Center coordinate {latitude, longitude}
 * @param {number} radiusKm - Radius in kilometers
 * @returns {Object} Bounding box
 */
export const createBoundingBox = (center, radiusKm) => {
  const earthRadius = 6371; // km
  const latDelta = (radiusKm / earthRadius) * (180 / Math.PI);
  const lonDelta = latDelta / Math.cos(center.latitude * Math.PI / 180);

  return {
    north: center.latitude + latDelta,
    south: center.latitude - latDelta,
    east: center.longitude + lonDelta,
    west: center.longitude - lonDelta
  };
};

/**
 * Format coordinates for display
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @param {string} format - Format type (decimal, dms, ddm)
 * @param {number} precision - Decimal precision
 * @returns {string} Formatted coordinates
 */
export const formatCoordinates = (latitude, longitude, format = 'decimal', precision = 6) => {
  switch (format) {
    case 'decimal':
      return `${latitude.toFixed(precision)}, ${longitude.toFixed(precision)}`;
    
    case 'dms': // Degrees, Minutes, Seconds
      const latDMS = toDMS(latitude, 'lat');
      const lonDMS = toDMS(longitude, 'lon');
      return `${latDMS}, ${lonDMS}`;
    
    case 'ddm': // Degrees, Decimal Minutes
      const latDDM = toDDM(latitude, 'lat');
      const lonDDM = toDDM(longitude, 'lon');
      return `${latDDM}, ${lonDDM}`;
    
    default:
      return `${latitude}, ${longitude}`;
  }
};

/**
 * Convert decimal degrees to DMS format
 * @param {number} decimal - Decimal degrees
 * @param {string} type - Type (lat or lon)
 * @returns {string} DMS format
 */
const toDMS = (decimal, type) => {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutes = Math.floor((abs - degrees) * 60);
  const seconds = ((abs - degrees) * 60 - minutes) * 60;
  
  const direction = type === 'lat' 
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');
  
  return `${degrees}°${minutes}'${seconds.toFixed(2)}"${direction}`;
};

/**
 * Convert decimal degrees to DDM format
 * @param {number} decimal - Decimal degrees
 * @param {string} type - Type (lat or lon)
 * @returns {string} DDM format
 */
const toDDM = (decimal, type) => {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutes = (abs - degrees) * 60;
  
  const direction = type === 'lat' 
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');
  
  return `${degrees}°${minutes.toFixed(4)}'${direction}`;
};

/**
 * Generate Google Maps URL
 * @param {Object} coord - Coordinate {latitude, longitude}
 * @param {string} type - URL type (maps, satellite, street)
 * @param {number} zoom - Zoom level
 * @returns {string} Google Maps URL
 */
export const generateGoogleMapsUrl = (coord, type = 'maps', zoom = 15) => {
  const baseUrl = 'https://www.google.com/maps';
  
  switch (type) {
    case 'satellite':
      return `${baseUrl}/@${coord.latitude},${coord.longitude},${zoom}z/data=!3m1!1e3`;
    case 'street':
      return `${baseUrl}/@${coord.latitude},${coord.longitude},${zoom}z/data=!3m1!1e1`;
    default:
      return `${baseUrl}/@${coord.latitude},${coord.longitude},${zoom}z`;
  }
};

/**
 * Generate OpenStreetMap URL
 * @param {Object} coord - Coordinate {latitude, longitude}
 * @param {number} zoom - Zoom level
 * @returns {string} OpenStreetMap URL
 */
export const generateOpenStreetMapUrl = (coord, zoom = 15) => {
  return `https://www.openstreetmap.org/#map=${zoom}/${coord.latitude}/${coord.longitude}`;
};

/**
 * Geolocation manager class
 */
export class GeolocationManager {
  constructor() {
    this.watchId = null;
    this.isWatching = false;
    this.lastPosition = null;
    this.listeners = new Set();
    this.errorListeners = new Set();
  }

  /**
   * Get current position
   * @param {Object} options - Options
   * @returns {Promise<Object>} Position data
   */
  async getCurrentPosition(options = {}) {
    try {
      const position = await getCurrentPosition(options);
      this.lastPosition = position;
      return position;
    } catch (error) {
      this.notifyErrorListeners(error);
      throw error;
    }
  }

  /**
   * Start watching position
   * @param {Object} options - Watch options
   * @returns {boolean} Success status
   */
  startWatching(options = {}) {
    if (this.isWatching) return false;

    this.watchId = watchPosition(
      (position) => {
        this.lastPosition = position;
        this.notifyListeners(position);
      },
      (error) => {
        this.notifyErrorListeners(error);
      },
      options
    );

    this.isWatching = true;
    return true;
  }

  /**
   * Stop watching position
   */
  stopWatching() {
    if (this.watchId) {
      clearWatch(this.watchId);
      this.watchId = null;
      this.isWatching = false;
    }
  }

  /**
   * Add position change listener
   * @param {Function} listener - Listener function
   */
  addListener(listener) {
    this.listeners.add(listener);
  }

  /**
   * Remove position change listener
   * @param {Function} listener - Listener function
   */
  removeListener(listener) {
    this.listeners.delete(listener);
  }

  /**
   * Add error listener
   * @param {Function} listener - Error listener function
   */
  addErrorListener(listener) {
    this.errorListeners.add(listener);
  }

  /**
   * Remove error listener
   * @param {Function} listener - Error listener function
   */
  removeErrorListener(listener) {
    this.errorListeners.delete(listener);
  }

  /**
   * Notify position listeners
   * @param {Object} position - Position data
   */
  notifyListeners(position) {
    this.listeners.forEach(listener => {
      try {
        listener(position);
      } catch (error) {
        console.error('Geolocation listener error:', error);
      }
    });
  }

  /**
   * Notify error listeners
   * @param {Error} error - Error object
   */
  notifyErrorListeners(error) {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (err) {
        console.error('Geolocation error listener error:', err);
      }
    });
  }

  /**
   * Get last known position
   * @returns {Object|null} Last position or null
   */
  getLastPosition() {
    return this.lastPosition;
  }

  /**
   * Check if currently watching
   * @returns {boolean} Watching status
   */
  isCurrentlyWatching() {
    return this.isWatching;
  }

  /**
   * Clean up resources
   */
  destroy() {
    this.stopWatching();
    this.listeners.clear();
    this.errorListeners.clear();
    this.lastPosition = null;
  }
}
