/**
 * Device utility functions for device detection and information
 */

/**
 * Get device information
 * @returns {Object} Device information
 */
const getDeviceInfo = () => {
  if (typeof navigator === 'undefined') {
    return {
      userAgent: '',
      platform: '',
      language: '',
      cookieEnabled: false,
      onLine: false,
      screenWidth: 0,
      screenHeight: 0,
      windowWidth: 0,
      windowHeight: 0,
      colorDepth: 0,
      pixelRatio: 1,
      timezone: '',
      timezoneOffset: 0
    };
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screenWidth: screen.width,
    screenHeight: screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    colorDepth: screen.colorDepth,
    pixelRatio: window.devicePixelRatio || 1,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset()
  };
};

/**
 * Check if device is mobile
 * @returns {boolean} True if device is mobile
 */
const isMobile = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    'mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone',
    'opera mini', 'iemobile', 'mobile safari', 'webos', 'palm'
  ];
  
  return mobileKeywords.some(keyword => userAgent.includes(keyword));
};

/**
 * Check if device is tablet
 * @returns {boolean} True if device is tablet
 */
const isTablet = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'playbook'];
  
  return tabletKeywords.some(keyword => userAgent.includes(keyword));
};

/**
 * Check if device is desktop
 * @returns {boolean} True if device is desktop
 */
const isDesktop = () => {
  return !isMobile() && !isTablet();
};

/**
 * Check if device is iOS
 * @returns {boolean} True if device is iOS
 */
const isIOS = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
};

/**
 * Check if device is Android
 * @returns {boolean} True if device is Android
 */
const isAndroid = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /android/.test(userAgent);
};

/**
 * Check if device is Windows
 * @returns {boolean} True if device is Windows
 */
const isWindows = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /windows/.test(userAgent);
};

/**
 * Check if device is macOS
 * @returns {boolean} True if device is macOS
 */
const isMacOS = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /macintosh|mac os x/.test(userAgent);
};

/**
 * Check if device is Linux
 * @returns {boolean} True if device is Linux
 */
const isLinux = () => {
  if (typeof navigator === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return /linux/.test(userAgent) && !/android/.test(userAgent);
};

/**
 * Get device type
 * @returns {string} Device type ('mobile', 'tablet', 'desktop')
 */
const getDeviceType = () => {
  if (isMobile()) return 'mobile';
  if (isTablet()) return 'tablet';
  return 'desktop';
};

/**
 * Get operating system
 * @returns {string} Operating system name
 */
const getOperatingSystem = () => {
  if (isIOS()) return 'iOS';
  if (isAndroid()) return 'Android';
  if (isWindows()) return 'Windows';
  if (isMacOS()) return 'macOS';
  if (isLinux()) return 'Linux';
  return 'Unknown';
};

/**
 * Check if device supports touch
 * @returns {boolean} True if device supports touch
 */
const isTouchDevice = () => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Get screen orientation
 * @returns {string} Screen orientation ('portrait', 'landscape')
 */
const getScreenOrientation = () => {
  if (typeof screen === 'undefined') return 'unknown';
  
  return screen.width > screen.height ? 'landscape' : 'portrait';
};

/**
 * Check if screen is in portrait mode
 * @returns {boolean} True if screen is in portrait mode
 */
const isPortrait = () => {
  return getScreenOrientation() === 'portrait';
};

/**
 * Check if screen is in landscape mode
 * @returns {boolean} True if screen is in landscape mode
 */
const isLandscape = () => {
  return getScreenOrientation() === 'landscape';
};

/**
 * Get viewport size
 * @returns {Object} Viewport dimensions
 */
const getViewportSize = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
};

/**
 * Get screen size
 * @returns {Object} Screen dimensions
 */
const getScreenSize = () => {
  if (typeof screen === 'undefined') {
    return { width: 0, height: 0 };
  }
  
  return {
    width: screen.width,
    height: screen.height
  };
};

/**
 * Check if device has high DPI display
 * @returns {boolean} True if device has high DPI display
 */
const isHighDPI = () => {
  if (typeof window === 'undefined') return false;
  
  return (window.devicePixelRatio || 1) > 1;
};

/**
 * Get device pixel ratio
 * @returns {number} Device pixel ratio
 */
const getDevicePixelRatio = () => {
  if (typeof window === 'undefined') return 1;
  
  return window.devicePixelRatio || 1;
};

/**
 * Check if device is online
 * @returns {boolean} True if device is online
 */
const isOnline = () => {
  if (typeof navigator === 'undefined') return false;
  
  return navigator.onLine;
};

/**
 * Get connection information
 * @returns {Object} Connection information
 */
const getConnectionInfo = () => {
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
 * Check if device supports geolocation
 * @returns {boolean} True if device supports geolocation
 */
const supportsGeolocation = () => {
  if (typeof navigator === 'undefined') return false;
  
  return 'geolocation' in navigator;
};

/**
 * Check if device supports notifications
 * @returns {boolean} True if device supports notifications
 */
const supportsNotifications = () => {
  if (typeof window === 'undefined') return false;
  
  return 'Notification' in window;
};

/**
 * Check if device supports service workers
 * @returns {boolean} True if device supports service workers
 */
const supportsServiceWorkers = () => {
  if (typeof navigator === 'undefined') return false;
  
  return 'serviceWorker' in navigator;
};

/**
 * Check if device supports WebGL
 * @returns {boolean} True if device supports WebGL
 */
const supportsWebGL = () => {
  if (typeof window === 'undefined') return false;
  
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
};

/**
 * Check if device supports WebRTC
 * @returns {boolean} True if device supports WebRTC
 */
const supportsWebRTC = () => {
  if (typeof window === 'undefined') return false;
  
  return !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection);
};

/**
 * Check if device supports WebAssembly
 * @returns {boolean} True if device supports WebAssembly
 */
const supportsWebAssembly = () => {
  if (typeof window === 'undefined') return false;
  
  return typeof WebAssembly === 'object';
};

/**
 * Get browser information
 * @returns {Object} Browser information
 */
const getBrowserInfo = () => {
  if (typeof navigator === 'undefined') {
    return {
      name: 'Unknown',
      version: 'Unknown',
      engine: 'Unknown'
    };
  }
  
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let engine = 'Unknown';
  
  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserName = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Firefox')) {
    browserName = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserName = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('Edg')) {
    browserName = 'Edge';
    const match = userAgent.match(/Edg\/(\d+)/);
    if (match) browserVersion = match[1];
  } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
    browserName = 'Internet Explorer';
    const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
    if (match) browserVersion = match[1];
  }
  
  // Detect engine
  if (userAgent.includes('WebKit')) {
    engine = 'WebKit';
  } else if (userAgent.includes('Gecko')) {
    engine = 'Gecko';
  } else if (userAgent.includes('Trident')) {
    engine = 'Trident';
  }
  
  return {
    name: browserName,
    version: browserVersion,
    engine: engine
  };
};

/**
 * Check if device is in dark mode
 * @returns {boolean} True if device is in dark mode
 */
const isDarkMode = () => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/**
 * Check if device prefers reduced motion
 * @returns {boolean} True if device prefers reduced motion
 */
const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Get device capabilities
 * @returns {Object} Device capabilities
 */
const getDeviceCapabilities = () => {
  return {
    touch: isTouchDevice(),
    geolocation: supportsGeolocation(),
    notifications: supportsNotifications(),
    serviceWorkers: supportsServiceWorkers(),
    webgl: supportsWebGL(),
    webrtc: supportsWebRTC(),
    webassembly: supportsWebAssembly(),
    online: isOnline(),
    highDPI: isHighDPI(),
    darkMode: isDarkMode(),
    reducedMotion: prefersReducedMotion()
  };
};

module.exports = {
  getDeviceInfo,
  isMobile,
  isTablet,
  isDesktop,
  isIOS,
  isAndroid,
  isWindows,
  isMacOS,
  isLinux,
  getDeviceType,
  getOperatingSystem,
  isTouchDevice,
  getScreenOrientation,
  isPortrait,
  isLandscape,
  getViewportSize,
  getScreenSize,
  isHighDPI,
  getDevicePixelRatio,
  isOnline,
  getConnectionInfo,
  supportsGeolocation,
  supportsNotifications,
  supportsServiceWorkers,
  supportsWebGL,
  supportsWebRTC,
  supportsWebAssembly,
  getBrowserInfo,
  isDarkMode,
  prefersReducedMotion,
  getDeviceCapabilities
};