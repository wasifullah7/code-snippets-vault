import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for device detection and information
 * @returns {Object} Device state and functions
 */
const useDevice = () => {
  const [deviceInfo, setDeviceInfo] = useState(() => {
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
  });

  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isMacOS, setIsMacOS] = useState(false);
  const [isLinux, setIsLinux] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');
  const [operatingSystem, setOperatingSystem] = useState('Unknown');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [screenOrientation, setScreenOrientation] = useState('landscape');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const [isHighDPI, setIsHighDPI] = useState(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState(1);
  const [isOnline, setIsOnline] = useState(true);
  const [connectionInfo, setConnectionInfo] = useState({
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  });
  const [browserInfo, setBrowserInfo] = useState({
    name: 'Unknown',
    version: 'Unknown',
    engine: 'Unknown'
  });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Device detection functions
  const detectMobile = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const mobileKeywords = [
      'mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone',
      'opera mini', 'iemobile', 'mobile safari', 'webos', 'palm'
    ];
    
    return mobileKeywords.some(keyword => userAgent.includes(keyword));
  }, []);

  const detectTablet = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    const tabletKeywords = ['ipad', 'tablet', 'kindle', 'silk', 'playbook'];
    
    return tabletKeywords.some(keyword => userAgent.includes(keyword));
  }, []);

  const detectIOS = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(userAgent);
  }, []);

  const detectAndroid = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /android/.test(userAgent);
  }, []);

  const detectWindows = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /windows/.test(userAgent);
  }, []);

  const detectMacOS = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /macintosh|mac os x/.test(userAgent);
  }, []);

  const detectLinux = useCallback(() => {
    if (typeof navigator === 'undefined') return false;
    
    const userAgent = navigator.userAgent.toLowerCase();
    return /linux/.test(userAgent) && !/android/.test(userAgent);
  }, []);

  const detectTouchDevice = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    );
  }, []);

  const detectScreenOrientation = useCallback(() => {
    if (typeof screen === 'undefined') return 'landscape';
    
    return screen.width > screen.height ? 'landscape' : 'portrait';
  }, []);

  const detectBrowserInfo = useCallback(() => {
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
  }, []);

  const detectConnectionInfo = useCallback(() => {
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

  const detectDarkMode = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }, []);

  const detectReducedMotion = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Update device information
  const updateDeviceInfo = useCallback(() => {
    if (typeof navigator === 'undefined') return;

    const newDeviceInfo = {
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

    setDeviceInfo(newDeviceInfo);
    setIsMobile(detectMobile());
    setIsTablet(detectTablet());
    setIsDesktop(!detectMobile() && !detectTablet());
    setIsIOS(detectIOS());
    setIsAndroid(detectAndroid());
    setIsWindows(detectWindows());
    setIsMacOS(detectMacOS());
    setIsLinux(detectLinux());
    setIsTouchDevice(detectTouchDevice());
    setScreenOrientation(detectScreenOrientation());
    setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    setScreenSize({ width: screen.width, height: screen.height });
    setIsHighDPI((window.devicePixelRatio || 1) > 1);
    setDevicePixelRatio(window.devicePixelRatio || 1);
    setIsOnline(navigator.onLine);
    setConnectionInfo(detectConnectionInfo());
    setBrowserInfo(detectBrowserInfo());
    setIsDarkMode(detectDarkMode());
    setPrefersReducedMotion(detectReducedMotion());

    // Set device type
    if (detectMobile()) {
      setDeviceType('mobile');
    } else if (detectTablet()) {
      setDeviceType('tablet');
    } else {
      setDeviceType('desktop');
    }

    // Set operating system
    if (detectIOS()) {
      setOperatingSystem('iOS');
    } else if (detectAndroid()) {
      setOperatingSystem('Android');
    } else if (detectWindows()) {
      setOperatingSystem('Windows');
    } else if (detectMacOS()) {
      setOperatingSystem('macOS');
    } else if (detectLinux()) {
      setOperatingSystem('Linux');
    } else {
      setOperatingSystem('Unknown');
    }
  }, [detectMobile, detectTablet, detectIOS, detectAndroid, detectWindows, detectMacOS, detectLinux, detectTouchDevice, detectScreenOrientation, detectConnectionInfo, detectBrowserInfo, detectDarkMode, detectReducedMotion]);

  // Check if device is in portrait mode
  const isPortrait = useCallback(() => {
    return screenOrientation === 'portrait';
  }, [screenOrientation]);

  // Check if device is in landscape mode
  const isLandscape = useCallback(() => {
    return screenOrientation === 'landscape';
  }, [screenOrientation]);

  // Get device capabilities
  const getDeviceCapabilities = useCallback(() => {
    return {
      touch: isTouchDevice,
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      serviceWorkers: 'serviceWorker' in navigator,
      webgl: (() => {
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
          return false;
        }
      })(),
      webrtc: !!(window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection),
      webassembly: typeof WebAssembly === 'object',
      online: isOnline,
      highDPI: isHighDPI,
      darkMode: isDarkMode,
      reducedMotion: prefersReducedMotion
    };
  }, [isTouchDevice, isOnline, isHighDPI, isDarkMode, prefersReducedMotion]);

  // Effect to update device info on mount and resize
  useEffect(() => {
    updateDeviceInfo();

    const handleResize = () => {
      updateDeviceInfo();
    };

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleOrientationChange = () => {
      updateDeviceInfo();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [updateDeviceInfo]);

  return {
    // Device information
    deviceInfo,
    
    // Device type detection
    isMobile,
    isTablet,
    isDesktop,
    deviceType,
    
    // Operating system detection
    isIOS,
    isAndroid,
    isWindows,
    isMacOS,
    isLinux,
    operatingSystem,
    
    // Device capabilities
    isTouchDevice,
    screenOrientation,
    isPortrait,
    isLandscape,
    viewportSize,
    screenSize,
    isHighDPI,
    devicePixelRatio,
    isOnline,
    connectionInfo,
    browserInfo,
    isDarkMode,
    prefersReducedMotion,
    getDeviceCapabilities,
    
    // Utility functions
    updateDeviceInfo
  };
};

export default useDevice;