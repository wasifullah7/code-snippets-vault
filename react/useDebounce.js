/**
 * Custom React hook for debouncing values with advanced features
 * @param {any} value - Value to debounce
 * @param {number} delay - Delay in milliseconds
 * @param {Object} options - Configuration options
 * @param {boolean} options.leading - Execute on leading edge (default: false)
 * @param {boolean} options.trailing - Execute on trailing edge (default: true)
 * @param {Function} options.equalityFn - Custom equality function
 * @param {boolean} options.maxWait - Maximum wait time in milliseconds
 * @returns {any} Debounced value
 */
import { useState, useEffect, useRef, useCallback } from 'react';

function useDebounce(value, delay, options = {}) {
  const {
    leading = false,
    trailing = true,
    equalityFn = (a, b) => a === b,
    maxWait
  } = options;

  const [debouncedValue, setDebouncedValue] = useState(value);
  const timeoutRef = useRef(null);
  const lastCallTimeRef = useRef(0);
  const lastValueRef = useRef(value);

  // Check if values are equal
  const isEqual = useCallback((a, b) => {
    return equalityFn(a, b);
  }, [equalityFn]);

  // Clear timeout
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set timeout
  const setTimeout = useCallback((callback, waitTime) => {
    clearTimeout();
    timeoutRef.current = window.setTimeout(callback, waitTime);
  }, [clearTimeout]);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCallTimeRef.current;
    const shouldCallLeading = leading && lastCallTimeRef.current === 0;

    // Handle leading edge
    if (shouldCallLeading && !isEqual(value, lastValueRef.current)) {
      setDebouncedValue(value);
      lastValueRef.current = value;
      lastCallTimeRef.current = now;
      return;
    }

    // Handle maxWait
    if (maxWait && timeSinceLastCall >= maxWait) {
      if (trailing) {
        setDebouncedValue(value);
        lastValueRef.current = value;
      }
      lastCallTimeRef.current = now;
      clearTimeout();
      return;
    }

    // Handle trailing edge
    if (trailing) {
      const remainingDelay = delay - timeSinceLastCall;
      const waitTime = Math.max(0, remainingDelay);

      setTimeout(() => {
        setDebouncedValue(value);
        lastValueRef.current = value;
        lastCallTimeRef.current = Date.now();
      }, waitTime);
    }

    // Update last value reference
    lastValueRef.current = value;
  }, [value, delay, leading, trailing, maxWait, isEqual, clearTimeout, setTimeout]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout();
    };
  }, [clearTimeout]);

  // Utility functions
  const cancel = useCallback(() => {
    clearTimeout();
    lastCallTimeRef.current = 0;
  }, [clearTimeout]);

  const flush = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout();
      setDebouncedValue(value);
      lastValueRef.current = value;
      lastCallTimeRef.current = Date.now();
    }
  }, [value, clearTimeout]);

  const isPending = useCallback(() => {
    return timeoutRef.current !== null;
  }, []);

  return {
    value: debouncedValue,
    cancel,
    flush,
    isPending: isPending()
  };
}

// Example usage:
// function SearchComponent() {
//   const [searchTerm, setSearchTerm] = useState('');
//   const { value: debouncedSearchTerm, cancel, flush } = useDebounce(
//     searchTerm,
//     300,
//     {
//       leading: false,
//       trailing: true,
//       maxWait: 1000
//     }
//   );
//   
//   useEffect(() => {
//     if (debouncedSearchTerm) {
//       performSearch(debouncedSearchTerm);
//     }
//   }, [debouncedSearchTerm]);
//   
//   return (
//     <div>
//       <input
//         value={searchTerm}
//         onChange={(e) => setSearchTerm(e.target.value)}
//         placeholder="Search..."
//       />
//       <button onClick={cancel}>Cancel</button>
//       <button onClick={flush}>Flush</button>
//     </div>
//   );
// }
// 
// function AdvancedDebounceExample() {
//   const [value, setValue] = useState('');
//   const { value: debouncedValue, isPending } = useDebounce(
//     value,
//     500,
//     {
//       leading: true,
//       trailing: true,
//       maxWait: 2000,
//       equalityFn: (a, b) => a.trim() === b.trim()
//     }
//   );
//   
//   return (
//     <div>
//       <input
//         value={value}
//         onChange={(e) => setValue(e.target.value)}
//       />
//       <p>Current: {value}</p>
//       <p>Debounced: {debouncedValue}</p>
//       <p>Pending: {isPending ? 'Yes' : 'No'}</p>
//     </div>
//   );
// }

export default useDebounce;