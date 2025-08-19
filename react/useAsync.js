import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for handling asynchronous operations
 * Provides loading, error, and success states with automatic cleanup
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Hook options
 * @returns {Object} Async state and handlers
 */
function useAsync(asyncFunction, options = {}) {
  const {
    immediate = false,
    initialData = null,
    onSuccess,
    onError,
    onFinally,
    dependencies = []
  } = options;

  const [state, setState] = useState({
    data: initialData,
    loading: false,
    error: null,
    status: 'idle' // 'idle' | 'loading' | 'success' | 'error'
  });

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args) => {
    if (!isMountedRef.current) return;

    // Abort previous request if still running
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      status: 'loading'
    }));

    try {
      const result = await asyncFunction(...args, abortControllerRef.current.signal);
      
      if (!isMountedRef.current) return;

      setState({
        data: result,
        loading: false,
        error: null,
        status: 'success'
      });

      if (onSuccess) {
        onSuccess(result, ...args);
      }
    } catch (error) {
      if (!isMountedRef.current) return;

      // Don't update state if request was aborted
      if (error.name === 'AbortError') return;

      setState(prev => ({
        ...prev,
        loading: false,
        error,
        status: 'error'
      }));

      if (onError) {
        onError(error, ...args);
      }
    } finally {
      if (isMountedRef.current && onFinally) {
        onFinally(...args);
      }
    }
  }, [asyncFunction, onSuccess, onError, onFinally]);

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      status: 'idle'
    });
  }, [initialData]);

  const setData = useCallback((data) => {
    setState(prev => ({
      ...prev,
      data,
      status: 'success'
    }));
  }, []);

  const setError = useCallback((error) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      status: 'error'
    }));
  }, []);

  // Execute immediately if requested
  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate, execute, ...dependencies]);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    isIdle: state.status === 'idle',
    isLoading: state.status === 'loading',
    isSuccess: state.status === 'success',
    isError: state.status === 'error'
  };
}

/**
 * Hook for handling async operations with retry logic
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Hook options
 */
function useAsyncWithRetry(asyncFunction, options = {}) {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    retryCondition = (error) => true,
    ...asyncOptions
  } = options;

  const [retryCount, setRetryCount] = useState(0);
  const retryTimeoutRef = useRef(null);

  const executeWithRetry = useCallback(async (...args) => {
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await asyncFunction(...args);
        setRetryCount(0);
        return result;
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries || !retryCondition(error)) {
          throw error;
        }

        setRetryCount(attempt + 1);
        
        // Wait before retrying
        await new Promise(resolve => {
          retryTimeoutRef.current = setTimeout(resolve, retryDelay * (attempt + 1));
        });
      }
    }
    
    throw lastError;
  }, [asyncFunction, maxRetries, retryDelay, retryCondition]);

  const reset = useCallback(() => {
    setRetryCount(0);
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  }, []);

  const asyncState = useAsync(executeWithRetry, asyncOptions);

  return {
    ...asyncState,
    retryCount,
    reset: () => {
      reset();
      asyncState.reset();
    }
  };
}

/**
 * Hook for handling async operations with caching
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Hook options
 */
function useAsyncWithCache(asyncFunction, options = {}) {
  const {
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    ...asyncOptions
  } = options;

  const cacheRef = useRef(new Map());

  const executeWithCache = useCallback(async (...args) => {
    if (!cacheKey) {
      return asyncFunction(...args);
    }

    const key = typeof cacheKey === 'function' ? cacheKey(...args) : cacheKey;
    const cached = cacheRef.current.get(key);

    if (cached && Date.now() - cached.timestamp < cacheTime) {
      return cached.data;
    }

    const result = await asyncFunction(...args);
    
    cacheRef.current.set(key, {
      data: result,
      timestamp: Date.now()
    });

    return result;
  }, [asyncFunction, cacheKey, cacheTime]);

  const clearCache = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const clearCacheItem = useCallback((key) => {
    cacheRef.current.delete(key);
  }, []);

  const asyncState = useAsync(executeWithCache, asyncOptions);

  return {
    ...asyncState,
    clearCache,
    clearCacheItem
  };
}

/**
 * Hook for handling async operations with optimistic updates
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Hook options
 */
function useAsyncOptimistic(asyncFunction, options = {}) {
  const {
    optimisticUpdate,
    rollbackOnError = true,
    ...asyncOptions
  } = options;

  const [optimisticData, setOptimisticData] = useState(null);
  const previousDataRef = useRef(null);

  const executeOptimistic = useCallback(async (...args) => {
    if (optimisticUpdate) {
      previousDataRef.current = asyncState.data;
      const optimisticResult = optimisticUpdate(...args);
      setOptimisticData(optimisticResult);
    }

    try {
      const result = await asyncFunction(...args);
      setOptimisticData(null);
      return result;
    } catch (error) {
      if (rollbackOnError && optimisticUpdate) {
        setOptimisticData(null);
      }
      throw error;
    }
  }, [asyncFunction, optimisticUpdate, rollbackOnError]);

  const asyncState = useAsync(executeOptimistic, asyncOptions);

  return {
    ...asyncState,
    data: optimisticData !== null ? optimisticData : asyncState.data,
    isOptimistic: optimisticData !== null
  };
}

/**
 * Hook for handling async operations with debouncing
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Hook options
 */
function useAsyncDebounced(asyncFunction, options = {}) {
  const {
    delay = 300,
    ...asyncOptions
  } = options;

  const timeoutRef = useRef(null);

  const executeDebounced = useCallback(async (...args) => {
    return new Promise((resolve, reject) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(async () => {
        try {
          const result = await asyncFunction(...args);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }, [asyncFunction, delay]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const asyncState = useAsync(executeDebounced, asyncOptions);

  return {
    ...asyncState,
    cancel
  };
}

/**
 * Hook for handling async operations with polling
 * @param {Function} asyncFunction - Async function to execute
 * @param {Object} options - Hook options
 */
function useAsyncPolling(asyncFunction, options = {}) {
  const {
    interval = 5000,
    enabled = false,
    maxAttempts = Infinity,
    stopOnError = false,
    ...asyncOptions
  } = options;

  const [attempts, setAttempts] = useState(0);
  const intervalRef = useRef(null);

  const startPolling = useCallback(() => {
    if (intervalRef.current) return;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        stopPolling();
        return;
      }

      try {
        await asyncFunction();
        setAttempts(prev => prev + 1);
      } catch (error) {
        if (stopOnError) {
          stopPolling();
        }
        setAttempts(prev => prev + 1);
      }
    };

    intervalRef.current = setInterval(poll, interval);
    poll(); // Execute immediately
  }, [asyncFunction, interval, attempts, maxAttempts, stopOnError]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    setAttempts(0);
    stopPolling();
  }, [stopPolling]);

  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return stopPolling;
  }, [enabled, startPolling, stopPolling]);

  const asyncState = useAsync(asyncFunction, asyncOptions);

  return {
    ...asyncState,
    attempts,
    startPolling,
    stopPolling,
    reset,
    isPolling: intervalRef.current !== null
  };
}

export {
  useAsync,
  useAsyncWithRetry,
  useAsyncWithCache,
  useAsyncOptimistic,
  useAsyncDebounced,
  useAsyncPolling
};

export default useAsync;
