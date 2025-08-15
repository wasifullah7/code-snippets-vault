/**
 * Custom React hook for Intersection Observer API
 * Advanced intersection observer with multiple features for scroll-based interactions
 */
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * Main intersection observer hook
 * @param {Object} options - Intersection observer options
 * @param {Element|string} options.target - Target element or selector
 * @param {Object} options.threshold - Intersection threshold (0-1)
 * @param {string} options.root - Root element selector
 * @param {string} options.rootMargin - Root margin
 * @param {boolean} options.triggerOnce - Trigger only once
 * @param {boolean} options.disabled - Disable observer
 * @returns {Object} Intersection observer state
 */
function useIntersectionObserver(options = {}) {
  const {
    target,
    threshold = 0,
    root = null,
    rootMargin = '0px',
    triggerOnce = false,
    disabled = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const [entry, setEntry] = useState(null);
  const targetRef = useRef(null);

  const observerOptions = useMemo(() => ({
    threshold,
    root: root ? document.querySelector(root) : null,
    rootMargin
  }), [threshold, root, rootMargin]);

  const handleIntersection = useCallback((entries) => {
    const [entry] = entries;
    
    setIsIntersecting(entry.isIntersecting);
    setIntersectionRatio(entry.intersectionRatio);
    setEntry(entry);

    if (triggerOnce && entry.isIntersecting) {
      // Disconnect observer after first intersection
      if (targetRef.current) {
        targetRef.current.disconnect();
      }
    }
  }, [triggerOnce]);

  useEffect(() => {
    if (disabled) return;

    let element = target;
    
    // If target is a string, treat as selector
    if (typeof target === 'string') {
      element = document.querySelector(target);
    } else if (targetRef.current) {
      element = targetRef.current;
    }

    if (!element) return;

    const observer = new IntersectionObserver(handleIntersection, observerOptions);
    observer.observe(element);
    targetRef.current = observer;

    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, [target, disabled, observerOptions, handleIntersection]);

  return {
    isIntersecting,
    intersectionRatio,
    entry,
    ref: targetRef
  };
}

/**
 * Hook for lazy loading images
 * @param {Object} options - Lazy loading options
 * @param {string} options.src - Image source
 * @param {string} options.placeholder - Placeholder image
 * @param {string} options.error - Error image
 * @param {number} options.threshold - Intersection threshold
 * @returns {Object} Lazy loading state
 */
function useLazyImage(options = {}) {
  const {
    src,
    placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PC9zdmc+',
    error = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZmYwMDAwIi8+PC9zdmc+',
    threshold = 0.1
  } = options;

  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce: true
  });

  useEffect(() => {
    if (!isIntersecting || !src) return;

    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
      setHasError(false);
    };

    img.onerror = () => {
      setImageSrc(error);
      setHasError(true);
      setIsLoaded(false);
    };

    img.src = src;
  }, [isIntersecting, src, error]);

  return {
    src: imageSrc,
    isLoaded,
    hasError,
    isIntersecting
  };
}

/**
 * Hook for infinite scrolling
 * @param {Object} options - Infinite scroll options
 * @param {Function} options.onLoadMore - Load more callback
 * @param {boolean} options.hasMore - Whether there's more data
 * @param {number} options.threshold - Intersection threshold
 * @param {number} options.delay - Delay between loads
 * @returns {Object} Infinite scroll state
 */
function useInfiniteScroll(options = {}) {
  const {
    onLoadMore,
    hasMore = true,
    threshold = 0.1,
    delay = 100
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef(null);

  const { isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce: false
  });

  useEffect(() => {
    if (!isIntersecting || !hasMore || isLoading) return;

    setIsLoading(true);
    
    timeoutRef.current = setTimeout(async () => {
      try {
        await onLoadMore();
      } catch (error) {
        console.error('Infinite scroll error:', error);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isIntersecting, hasMore, isLoading, onLoadMore, delay]);

  return {
    isLoading,
    isIntersecting
  };
}

/**
 * Hook for scroll-based animations
 * @param {Object} options - Animation options
 * @param {string} options.animation - CSS animation class
 * @param {number} options.threshold - Intersection threshold
 * @param {boolean} options.triggerOnce - Trigger only once
 * @param {number} options.delay - Animation delay
 * @returns {Object} Animation state
 */
function useScrollAnimation(options = {}) {
  const {
    animation = 'fade-in',
    threshold = 0.1,
    triggerOnce = true,
    delay = 0
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  const { isIntersecting } = useIntersectionObserver({
    threshold,
    triggerOnce
  });

  useEffect(() => {
    if (!isIntersecting || (triggerOnce && hasAnimated)) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      setHasAnimated(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isIntersecting, triggerOnce, hasAnimated, delay]);

  return {
    isVisible,
    hasAnimated,
    className: isVisible ? animation : ''
  };
}

/**
 * Hook for sticky elements
 * @param {Object} options - Sticky options
 * @param {number} options.offset - Sticky offset
 * @param {string} options.position - Sticky position
 * @returns {Object} Sticky state
 */
function useSticky(options = {}) {
  const {
    offset = 0,
    position = 'top'
  } = options;

  const [isSticky, setIsSticky] = useState(false);
  const [stickyStyle, setStickyStyle] = useState({});

  const { isIntersecting, entry } = useIntersectionObserver({
    threshold: 0,
    triggerOnce: false
  });

  useEffect(() => {
    if (!entry) return;

    const rect = entry.boundingClientRect;
    const isStickyNow = !isIntersecting && rect[position] <= offset;

    setIsSticky(isStickyNow);

    if (isStickyNow) {
      setStickyStyle({
        position: 'fixed',
        [position]: offset + 'px',
        width: rect.width + 'px',
        zIndex: 1000
      });
    } else {
      setStickyStyle({});
    }
  }, [isIntersecting, entry, offset, position]);

  return {
    isSticky,
    stickyStyle
  };
}

/**
 * Hook for viewport tracking
 * @param {Object} options - Viewport options
 * @param {number} options.threshold - Intersection threshold
 * @returns {Object} Viewport state
 */
function useViewport(options = {}) {
  const { threshold = 0 } = options;

  const { isIntersecting, intersectionRatio, entry } = useIntersectionObserver({
    threshold,
    triggerOnce: false
  });

  const viewportState = useMemo(() => {
    if (!entry) return {};

    const rect = entry.boundingClientRect;
    const isFullyVisible = intersectionRatio >= 1;
    const isPartiallyVisible = intersectionRatio > 0;
    const isAboveViewport = rect.bottom < 0;
    const isBelowViewport = rect.top > window.innerHeight;

    return {
      isFullyVisible,
      isPartiallyVisible,
      isAboveViewport,
      isBelowViewport,
      visibilityPercentage: Math.round(intersectionRatio * 100),
      distanceFromTop: rect.top,
      distanceFromBottom: rect.bottom
    };
  }, [entry, intersectionRatio]);

  return {
    isIntersecting,
    intersectionRatio,
    ...viewportState
  };
}

/**
 * Hook for scroll progress
 * @param {Object} options - Progress options
 * @param {string} options.target - Target element
 * @param {string} options.direction - Progress direction
 * @returns {Object} Progress state
 */
function useScrollProgress(options = {}) {
  const {
    target = null,
    direction = 'vertical'
  } = options;

  const [progress, setProgress] = useState(0);
  const { entry } = useIntersectionObserver({
    target,
    threshold: Array.from({ length: 101 }, (_, i) => i / 100),
    triggerOnce: false
  });

  useEffect(() => {
    if (!entry) return;

    const rect = entry.boundingClientRect;
    const containerHeight = window.innerHeight;
    
    let currentProgress = 0;

    if (direction === 'vertical') {
      const elementHeight = rect.height;
      const elementTop = rect.top;
      
      if (elementTop <= 0 && elementTop + elementHeight >= containerHeight) {
        // Element is fully in viewport
        currentProgress = 100;
      } else if (elementTop <= 0) {
        // Element is partially scrolled past
        currentProgress = Math.abs(elementTop) / (elementHeight - containerHeight) * 100;
      } else if (elementTop + elementHeight <= containerHeight) {
        // Element is fully scrolled past
        currentProgress = 100;
      } else {
        // Element is entering viewport
        currentProgress = (containerHeight - elementTop) / elementHeight * 100;
      }
    }

    setProgress(Math.max(0, Math.min(100, currentProgress)));
  }, [entry, direction]);

  return {
    progress,
    percentage: Math.round(progress)
  };
}

// Example usage:
// const { isIntersecting, intersectionRatio } = useIntersectionObserver({
//   threshold: 0.5,
//   triggerOnce: true
// });
// 
// const { src, isLoaded } = useLazyImage({
//   src: 'https://example.com/image.jpg',
//   threshold: 0.1
// });
// 
// const { isLoading } = useInfiniteScroll({
//   onLoadMore: fetchMoreData,
//   hasMore: hasMoreData
// });
// 
// const { isVisible, className } = useScrollAnimation({
//   animation: 'slide-in-up',
//   delay: 200
// });
// 
// const { isSticky, stickyStyle } = useSticky({
//   offset: 20
// });
// 
// const { isFullyVisible, visibilityPercentage } = useViewport();
// 
// const { progress } = useScrollProgress({
//   target: '.scroll-container'
// });

export {
  useIntersectionObserver,
  useLazyImage,
  useInfiniteScroll,
  useScrollAnimation,
  useSticky,
  useViewport,
  useScrollProgress
};

export default useIntersectionObserver;
