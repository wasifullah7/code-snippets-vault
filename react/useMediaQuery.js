import { useEffect, useState } from 'react';

/**
 * useMediaQuery - responsive hook for CSS media queries
 * @param {string} query - CSS media query string
 * @param {boolean} defaultMatches - Default value for SSR
 * @returns {boolean} Matches query or not
 */
export default function useMediaQuery(query, defaultMatches = false) {
  const [matches, setMatches] = useState(defaultMatches);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Create handler
    const handler = (event) => {
      setMatches(event.matches);
    };

    // Add listener
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handler);
    }

    // Cleanup
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
}

// Common breakpoint helpers
export const useBreakpoint = () => {
  const isXs = useMediaQuery('(max-width: 575px)');
  const isSm = useMediaQuery('(min-width: 576px) and (max-width: 767px)');
  const isMd = useMediaQuery('(min-width: 768px) and (max-width: 991px)');
  const isLg = useMediaQuery('(min-width: 992px) and (max-width: 1199px)');
  const isXl = useMediaQuery('(min-width: 1200px)');
  
  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isMobile: isXs || isSm,
    isTablet: isMd,
    isDesktop: isLg || isXl
  };
};

export const useIsMobile = () => useMediaQuery('(max-width: 767px)');
export const useIsTablet = () => useMediaQuery('(min-width: 768px) and (max-width: 991px)');
export const useIsDesktop = () => useMediaQuery('(min-width: 992px)');
export const useIsDarkMode = () => useMediaQuery('(prefers-color-scheme: dark)');
export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');