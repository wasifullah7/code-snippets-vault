import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom React hook for Intersection Observer API
 * @param {Object} options - Intersection Observer options
 * @param {Element} options.root - Root element for intersection
 * @param {string} options.rootMargin - Root margin
 * @param {number|Array} options.threshold - Intersection threshold
 * @param {boolean} options.triggerOnce - Trigger only once
 * @returns {Array} [ref, isIntersecting, entry]
 */
export default function useIntersectionObserver(options = {}) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState(null);
  const [hasIntersected, setHasIntersected] = useState(false);
  
  const targetRef = useRef(null);
  const observerRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    const [targetEntry] = entries;
    
    setEntry(targetEntry);
    setIsIntersecting(targetEntry.isIntersecting);
    
    if (targetEntry.isIntersecting && !hasIntersected) {
      setHasIntersected(true);
      
      // Disconnect observer if triggerOnce is true
      if (triggerOnce && observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    }
  }, [triggerOnce, hasIntersected]);

  useEffect(() => {
    const target = targetRef.current;
    
    if (!target) return;

    // Create observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root,
      rootMargin,
      threshold
    });

    // Start observing
    observerRef.current.observe(target);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleIntersection, root, rootMargin, threshold]);

  return [targetRef, isIntersecting, entry];
}

/**
 * Hook for visibility detection with multiple elements
 * @param {Object} options - Intersection Observer options
 * @returns {Object} Visibility state and utilities
 */
export function useMultipleIntersectionObserver(options = {}) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    triggerOnce = false
  } = options;

  const [intersections, setIntersections] = useState(new Map());
  const observerRef = useRef(null);

  const handleIntersection = useCallback((entries) => {
    setIntersections(prev => {
      const newIntersections = new Map(prev);
      
      entries.forEach(entry => {
        const element = entry.target;
        const isIntersecting = entry.isIntersecting;
        
        newIntersections.set(element, {
          isIntersecting,
          entry,
          hasIntersected: prev.get(element)?.hasIntersected || isIntersecting
        });
      });
      
      return newIntersections;
    });
  }, []);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(handleIntersection, {
      root,
      rootMargin,
      threshold
    });

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [handleIntersection, root, rootMargin, threshold]);

  const observe = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element) => {
    if (observerRef.current && element) {
      observerRef.current.unobserve(element);
    }
  }, []);

  const isIntersecting = useCallback((element) => {
    return intersections.get(element)?.isIntersecting || false;
  }, [intersections]);

  const hasIntersected = useCallback((element) => {
    return intersections.get(element)?.hasIntersected || false;
  }, [intersections]);

  const getEntry = useCallback((element) => {
    return intersections.get(element)?.entry || null;
  }, [intersections]);

  return {
    observe,
    unobserve,
    isIntersecting,
    hasIntersected,
    getEntry,
    intersections
  };
}

/**
 * Hook for lazy loading images
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [imgRef, isLoaded, isInView]
 */
export function useLazyImage(options = {}) {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0,
    ...observerOptions
  } = options;

  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const imgRef = useRef(null);
  const [ref, isIntersecting] = useIntersectionObserver({
    root,
    rootMargin,
    threshold,
    ...observerOptions
  });

  // Combine refs
  const combinedRef = useCallback((node) => {
    imgRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref && ref.current !== undefined) {
      ref.current = node;
    }
  }, [ref]);

  useEffect(() => {
    setIsInView(isIntersecting);
    
    if (isIntersecting && !isLoaded && !hasError) {
      const img = imgRef.current;
      if (img && img.src) {
        img.onload = () => setIsLoaded(true);
        img.onerror = () => setHasError(true);
      }
    }
  }, [isIntersecting, isLoaded, hasError]);

  const retry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
  }, []);

  return [combinedRef, isLoaded, isInView, hasError, retry];
}

/**
 * Hook for infinite scrolling
 * @param {Function} loadMore - Function to load more data
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [sentinelRef, isLoading, hasMore]
 */
export function useInfiniteScroll(loadMore, options = {}) {
  const {
    root = null,
    rootMargin = '100px',
    threshold = 0,
    hasMore = true,
    isLoading = false,
    ...observerOptions
  } = options;

  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreData, setHasMoreData] = useState(hasMore);
  
  const sentinelRef = useRef(null);
  const [ref, isIntersecting] = useIntersectionObserver({
    root,
    rootMargin,
    threshold,
    ...observerOptions
  });

  // Combine refs
  const combinedRef = useCallback((node) => {
    sentinelRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref && ref.current !== undefined) {
      ref.current = node;
    }
  }, [ref]);

  useEffect(() => {
    setHasMoreData(hasMore);
  }, [hasMore]);

  useEffect(() => {
    if (isIntersecting && hasMoreData && !isLoading && !isLoadingMore) {
      setIsLoadingMore(true);
      
      const loadData = async () => {
        try {
          await loadMore();
        } catch (error) {
          console.error('Error loading more data:', error);
        } finally {
          setIsLoadingMore(false);
        }
      };
      
      loadData();
    }
  }, [isIntersecting, hasMoreData, isLoading, isLoadingMore, loadMore]);

  return [combinedRef, isLoadingMore, hasMoreData];
}

/**
 * Hook for scroll-based animations
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isVisible, animationState]
 */
export function useScrollAnimation(options = {}) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0.1,
    triggerOnce = true,
    animationType = 'fadeIn',
    delay = 0,
    ...observerOptions
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [animationState, setAnimationState] = useState('hidden');
  
  const [ref, isIntersecting] = useIntersectionObserver({
    root,
    rootMargin,
    threshold,
    triggerOnce,
    ...observerOptions
  });

  useEffect(() => {
    if (isIntersecting) {
      setIsVisible(true);
      
      if (delay > 0) {
        setTimeout(() => {
          setAnimationState('visible');
        }, delay);
      } else {
        setAnimationState('visible');
      }
    } else if (!triggerOnce) {
      setIsVisible(false);
      setAnimationState('hidden');
    }
  }, [isIntersecting, delay, triggerOnce]);

  const animationClasses = {
    fadeIn: animationState === 'visible' ? 'animate-fade-in' : 'opacity-0',
    slideUp: animationState === 'visible' ? 'animate-slide-up' : 'translate-y-8 opacity-0',
    slideDown: animationState === 'visible' ? 'animate-slide-down' : '-translate-y-8 opacity-0',
    slideLeft: animationState === 'visible' ? 'animate-slide-left' : 'translate-x-8 opacity-0',
    slideRight: animationState === 'visible' ? 'animate-slide-right' : '-translate-x-8 opacity-0',
    scale: animationState === 'visible' ? 'animate-scale' : 'scale-0 opacity-0',
    rotate: animationState === 'visible' ? 'animate-rotate' : 'rotate-180 opacity-0'
  };

  return [ref, isVisible, animationState, animationClasses[animationType]];
}

/**
 * Hook for sticky elements
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, isSticky, stickyState]
 */
export function useSticky(options = {}) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = 0,
    ...observerOptions
  } = options;

  const [isSticky, setIsSticky] = useState(false);
  const [stickyState, setStickyState] = useState('normal');
  
  const [ref, isIntersecting, entry] = useIntersectionObserver({
    root,
    rootMargin,
    threshold,
    ...observerOptions
  });

  useEffect(() => {
    if (entry) {
      const { intersectionRatio, boundingClientRect } = entry;
      
      if (intersectionRatio < 1 && boundingClientRect.top <= 0) {
        setIsSticky(true);
        setStickyState('stuck');
      } else if (intersectionRatio === 1) {
        setIsSticky(false);
        setStickyState('normal');
      } else if (boundingClientRect.bottom <= 0) {
        setIsSticky(false);
        setStickyState('past');
      }
    }
  }, [entry]);

  return [ref, isSticky, stickyState];
}

/**
 * Hook for element visibility percentage
 * @param {Object} options - Intersection Observer options
 * @returns {Array} [ref, visibilityPercentage, entry]
 */
export function useVisibilityPercentage(options = {}) {
  const {
    root = null,
    rootMargin = '0px',
    threshold = Array.from({ length: 101 }, (_, i) => i / 100),
    ...observerOptions
  } = options;

  const [visibilityPercentage, setVisibilityPercentage] = useState(0);
  
  const [ref, isIntersecting, entry] = useIntersectionObserver({
    root,
    rootMargin,
    threshold,
    ...observerOptions
  });

  useEffect(() => {
    if (entry) {
      setVisibilityPercentage(Math.round(entry.intersectionRatio * 100));
    }
  }, [entry]);

  return [ref, visibilityPercentage, entry];
}