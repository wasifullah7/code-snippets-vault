/**
 * Custom React hook for tracking window size with advanced features
 * @param {Object} options - Configuration options
 * @param {boolean} options.listenOrientation - Listen for orientation changes (default: true)
 * @param {number} options.throttleMs - Throttle interval in milliseconds (default: 100)
 * @param {boolean} options.includeScrollbar - Include scrollbar dimensions (default: false)
 * @returns {Object} Window size and orientation information
 */
import { useState, useEffect, useCallback } from 'react';

function useWindowSize(options = {}) {
  const {
    listenOrientation = true,
    throttleMs = 100,
    includeScrollbar = false
  } = options;

  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
    outerWidth: typeof window !== 'undefined' ? window.outerWidth : 0,
    outerHeight: typeof window !== 'undefined' ? window.outerHeight : 0,
    scrollbarWidth: 0,
    scrollbarHeight: 0,
    orientation: typeof window !== 'undefined' ? 
      window.innerWidth > window.innerHeight ? 'landscape' : 'portrait' : 'portrait',
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isMobile: typeof window !== 'undefined' ? window.innerWidth <= 768 : false,
    isTablet: typeof window !== 'undefined' ? window.innerWidth > 768 && window.innerWidth <= 1024 : false,
    isDesktop: typeof window !== 'undefined' ? window.innerWidth > 1024 : false
  });

  // Calculate scrollbar dimensions
  const getScrollbarDimensions = useCallback(() => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };

    const div = document.createElement('div');
    div.style.width = '100px';
    div.style.height = '100px';
    div.style.overflow = 'scroll';
    div.style.position = 'absolute';
    div.style.top = '-9999px';
    
    document.body.appendChild(div);
    
    const scrollbarWidth = div.offsetWidth - div.clientWidth;
    const scrollbarHeight = div.offsetHeight - div.clientHeight;
    
    document.body.removeChild(div);
    
    return { width: scrollbarWidth, height: scrollbarHeight };
  }, []);

  // Throttled update function
  const updateSize = useCallback(() => {
    if (typeof window === 'undefined') return;

    const newSize = {
      width: window.innerWidth,
      height: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      orientation: window.innerWidth > window.innerHeight ? 'landscape' : 'portrait',
      pixelRatio: window.devicePixelRatio,
      isMobile: window.innerWidth <= 768,
      isTablet: window.innerWidth > 768 && window.innerWidth <= 1024,
      isDesktop: window.innerWidth > 1024
    };

    if (includeScrollbar) {
      const scrollbarDims = getScrollbarDimensions();
      newSize.scrollbarWidth = scrollbarDims.width;
      newSize.scrollbarHeight = scrollbarDims.height;
    }

    setWindowSize(newSize);
  }, [includeScrollbar, getScrollbarDimensions]);

  // Throttled version of updateSize
  const throttledUpdateSize = useCallback(() => {
    let timeoutId;
    return () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        updateSize();
        timeoutId = null;
      }, throttleMs);
    };
  }, [updateSize, throttleMs]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initial size calculation
    updateSize();

    // Throttled resize handler
    const handleResize = throttledUpdateSize();
    
    // Orientation change handler
    const handleOrientationChange = () => {
      if (listenOrientation) {
        setTimeout(updateSize, 100); // Small delay for orientation change
      }
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    if (listenOrientation) {
      window.addEventListener('orientationchange', handleOrientationChange);
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (listenOrientation) {
        window.removeEventListener('orientationchange', handleOrientationChange);
      }
    };
  }, [updateSize, throttledUpdateSize, listenOrientation]);

  // Utility functions
  const isBreakpoint = useCallback((breakpoint) => {
    const breakpoints = {
      xs: windowSize.width < 576,
      sm: windowSize.width >= 576 && windowSize.width < 768,
      md: windowSize.width >= 768 && windowSize.width < 992,
      lg: windowSize.width >= 992 && windowSize.width < 1200,
      xl: windowSize.width >= 1200
    };
    return breakpoints[breakpoint] || false;
  }, [windowSize.width]);

  const getViewportArea = useCallback(() => {
    return windowSize.width * windowSize.height;
  }, [windowSize.width, windowSize.height]);

  return {
    ...windowSize,
    isBreakpoint,
    getViewportArea,
    // Responsive helpers
    isExtraSmall: isBreakpoint('xs'),
    isSmall: isBreakpoint('sm'),
    isMedium: isBreakpoint('md'),
    isLarge: isBreakpoint('lg'),
    isExtraLarge: isBreakpoint('xl')
  };
}

// Example usage:
// function ResponsiveComponent() {
//   const {
//     width,
//     height,
//     orientation,
//     isMobile,
//     isTablet,
//     isDesktop,
//     isBreakpoint,
//     getViewportArea
//   } = useWindowSize({
//     throttleMs: 150,
//     includeScrollbar: true
//   });
//   
//   return (
//     <div>
//       <p>Window Size: {width} x {height}</p>
//       <p>Orientation: {orientation}</p>
//       <p>Device: {isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</p>
//       <p>Is Large Screen: {isBreakpoint('lg') ? 'Yes' : 'No'}</p>
//       <p>Viewport Area: {getViewportArea()} pixels</p>
//     </div>
//   );
// }
// 
// function AdaptiveLayout() {
//   const { isMobile, isTablet, isDesktop } = useWindowSize();
//   
//   if (isMobile) return <MobileLayout />;
//   if (isTablet) return <TabletLayout />;
//   return <DesktopLayout />;
// }

export default useWindowSize;