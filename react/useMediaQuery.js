/**
 * Custom React hook for media query management
 * @param {string|Object} query - Media query string or object
 * @param {Object} options - Configuration options
 * @param {boolean} options.defaultMatches - Default match state (default: false)
 * @param {boolean} options.noSSR - Disable SSR (default: false)
 * @param {boolean} options.ssrMatchMedia - SSR match media function
 * @returns {boolean} Whether the media query matches
 */
import { useState, useEffect, useMemo } from 'react';

function useMediaQuery(query, options = {}) {
  const {
    defaultMatches = false,
    noSSR = false,
    ssrMatchMedia = null
  } = options;

  // Parse query if it's an object
  const mediaQuery = useMemo(() => {
    if (typeof query === 'string') {
      return query;
    }
    
    if (typeof query === 'object') {
      const { minWidth, maxWidth, minHeight, maxHeight, orientation, aspectRatio } = query;
      const parts = [];
      
      if (minWidth) parts.push(`(min-width: ${minWidth}px)`);
      if (maxWidth) parts.push(`(max-width: ${maxWidth}px)`);
      if (minHeight) parts.push(`(min-height: ${minHeight}px)`);
      if (maxHeight) parts.push(`(max-height: ${maxHeight}px)`);
      if (orientation) parts.push(`(orientation: ${orientation})`);
      if (aspectRatio) parts.push(`(aspect-ratio: ${aspectRatio})`);
      
      return parts.join(' and ');
    }
    
    return '';
  }, [query]);

  const [matches, setMatches] = useState(() => {
    if (noSSR) {
      return defaultMatches;
    }
    
    if (ssrMatchMedia) {
      return ssrMatchMedia(mediaQuery).matches;
    }
    
    if (typeof window !== 'undefined') {
      return window.matchMedia(mediaQuery).matches;
    }
    
    return defaultMatches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(mediaQuery);
    
    // Set initial value
    setMatches(mediaQueryList.matches);
    
    // Create event listener
    const handleChange = (event) => {
      setMatches(event.matches);
    };
    
    // Add listener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQueryList.addListener(handleChange);
    }
    
    // Cleanup
    return () => {
      if (mediaQueryList.removeEventListener) {
        mediaQueryList.removeEventListener('change', handleChange);
      } else {
        // Fallback for older browsers
        mediaQueryList.removeListener(handleChange);
      }
    };
  }, [mediaQuery]);

  return matches;
}

/**
 * Hook for responsive breakpoints
 * @param {Object} breakpoints - Breakpoint definitions
 * @returns {Object} Current breakpoint state
 */
function useBreakpoints(breakpoints = {}) {
  const defaultBreakpoints = {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200,
    xxl: 1400,
    ...breakpoints
  };

  const queries = useMemo(() => {
    const sorted = Object.entries(defaultBreakpoints).sort(([, a], [, b]) => a - b);
    const result = {};
    
    sorted.forEach(([name, width], index) => {
      if (index === 0) {
        result[name] = `(max-width: ${sorted[index + 1]?.[1] - 1}px)`;
      } else if (index === sorted.length - 1) {
        result[name] = `(min-width: ${width}px)`;
      } else {
        result[name] = `(min-width: ${width}px) and (max-width: ${sorted[index + 1][1] - 1}px)`;
      }
    });
    
    return result;
  }, [defaultBreakpoints]);

  const breakpointStates = {};
  
  Object.entries(queries).forEach(([name, query]) => {
    breakpointStates[name] = useMediaQuery(query);
  });

  return breakpointStates;
}

/**
 * Hook for device type detection
 * @returns {Object} Device type information
 */
function useDeviceType() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const isLargeDesktop = useMediaQuery('(min-width: 1440px)');
  
  const isTouch = useMediaQuery('(pointer: coarse)');
  const isHover = useMediaQuery('(hover: hover)');
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPortrait = useMediaQuery('(orientation: portrait)');

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isTouch,
    isHover,
    isLandscape,
    isPortrait,
    deviceType: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop'
  };
}

/**
 * Hook for screen size tracking
 * @returns {Object} Screen size information
 */
function useScreenSize() {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return screenSize;
}

/**
 * Hook for dark mode detection
 * @returns {boolean} Whether dark mode is active
 */
function useDarkMode() {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

/**
 * Hook for reduced motion preference
 * @returns {boolean} Whether reduced motion is preferred
 */
function useReducedMotion() {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook for high contrast mode
 * @returns {boolean} Whether high contrast mode is active
 */
function useHighContrast() {
  return useMediaQuery('(prefers-contrast: high)');
}

/**
 * Hook for print media
 * @returns {boolean} Whether currently printing
 */
function usePrint() {
  return useMediaQuery('print');
}

/**
 * Hook for specific aspect ratio
 * @param {string} ratio - Aspect ratio (e.g., '16/9', '4/3')
 * @returns {boolean} Whether the aspect ratio matches
 */
function useAspectRatio(ratio) {
  return useMediaQuery(`(aspect-ratio: ${ratio})`);
}

/**
 * Hook for specific resolution
 * @param {number} dpi - DPI value
 * @returns {boolean} Whether the resolution matches
 */
function useResolution(dpi) {
  return useMediaQuery(`(resolution: ${dpi}dpi)`);
}

/**
 * Hook for multiple media queries
 * @param {Array} queries - Array of media query strings
 * @returns {Array} Array of boolean values
 */
function useMediaQueries(queries) {
  return queries.map(query => useMediaQuery(query));
}

// Example usage:
// const isMobile = useMediaQuery('(max-width: 767px)');
// const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
// const isDesktop = useMediaQuery('(min-width: 1024px)');
// 
// const breakpoints = useBreakpoints();
// console.log('Current breakpoint:', breakpoints);
// 
// const device = useDeviceType();
// console.log('Device type:', device.deviceType);
// 
// const { width, height } = useScreenSize();
// console.log('Screen size:', width, height);
// 
// const isDark = useDarkMode();
// const prefersReducedMotion = useReducedMotion();
// const isPrinting = usePrint();

export {
  useMediaQuery,
  useBreakpoints,
  useDeviceType,
  useScreenSize,
  useDarkMode,
  useReducedMotion,
  useHighContrast,
  usePrint,
  useAspectRatio,
  useResolution,
  useMediaQueries
};

export default useMediaQuery;
