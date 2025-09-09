import { useCallback, useEffect, useRef } from 'react';

/**
 * useTimeout - run a callback after a delay with cancel/reset
 * @param {Function} callback
 * @param {number|null} delay ms (null disables)
 */
export default function useTimeout(callback, delay) {
  const savedCallback = useRef(callback);
  const timeoutId = useRef(null);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const clear = useCallback(() => {
    if (timeoutId.current) {
      clearTimeout(timeoutId.current);
      timeoutId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    if (delay == null) return;
    timeoutId.current = setTimeout(() => savedCallback.current?.(), delay);
  }, [delay, clear]);

  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  return { start, clear };
}


