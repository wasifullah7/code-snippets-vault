import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useAsync - handle async operations with loading, error, and data states
 * @param {Function} asyncFunction - Async function to execute
 * @param {Array} deps - Dependencies array
 * @param {boolean} immediate - Execute immediately on mount
 */
export default function useAsync(asyncFunction, deps = [], immediate = true) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async (...args) => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, deps);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
}