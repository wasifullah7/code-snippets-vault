/**
 * Custom React hook for tracking previous values with advanced features
 * @param {any} value - Current value to track
 * @param {Object} options - Configuration options
 * @param {boolean} options.includeInitial - Include initial value in history (default: true)
 * @param {number} options.maxHistory - Maximum number of previous values to store (default: 1)
 * @param {Function} options.comparator - Custom comparison function
 * @param {boolean} options.deepCompare - Use deep comparison (default: false)
 * @returns {Object} Previous value and history utilities
 */
import { useRef, useEffect, useState, useCallback } from 'react';

function usePrevious(value, options = {}) {
  const {
    includeInitial = true,
    maxHistory = 1,
    comparator = null,
    deepCompare = false
  } = options;

  const [history, setHistory] = useState([]);
  const previousValueRef = useRef();
  const currentValueRef = useRef(value);

  // Deep comparison utility
  const isEqual = useCallback((a, b) => {
    if (comparator) {
      return comparator(a, b);
    }

    if (deepCompare) {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return a === b;
  }, [comparator, deepCompare]);

  // Update history when value changes
  useEffect(() => {
    const hasChanged = !isEqual(currentValueRef.current, value);
    
    if (hasChanged) {
      const newHistory = [...history];
      
      // Add current value to history
      if (includeInitial || history.length > 0) {
        newHistory.push(currentValueRef.current);
      }
      
      // Limit history size
      if (newHistory.length > maxHistory) {
        newHistory.splice(0, newHistory.length - maxHistory);
      }
      
      setHistory(newHistory);
      previousValueRef.current = currentValueRef.current;
      currentValueRef.current = value;
    }
  }, [value, history, includeInitial, maxHistory, isEqual]);

  // Get previous value
  const getPrevious = useCallback((index = 0) => {
    if (index >= history.length) return undefined;
    return history[history.length - 1 - index];
  }, [history]);

  // Get all previous values
  const getAllPrevious = useCallback(() => {
    return [...history];
  }, [history]);

  // Check if value has changed
  const hasChanged = useCallback(() => {
    return history.length > 0;
  }, [history]);

  // Get change count
  const getChangeCount = useCallback(() => {
    return history.length;
  }, [history]);

  // Reset history
  const resetHistory = useCallback(() => {
    setHistory([]);
    previousValueRef.current = undefined;
  }, []);

  // Get previous value with type safety
  const previous = getPrevious(0);

  return {
    previous,
    history: getAllPrevious(),
    hasChanged: hasChanged(),
    changeCount: getChangeCount(),
    getPrevious,
    getAllPrevious,
    hasChanged: hasChanged,
    getChangeCount,
    resetHistory,
    // Utility methods
    isFirstChange: history.length === 1,
    isSecondChange: history.length === 2,
    getNthPrevious: getPrevious,
    // Type-safe getters
    getPreviousString: () => getPrevious(0) || '',
    getPreviousNumber: () => getPrevious(0) || 0,
    getPreviousBoolean: () => getPrevious(0) || false,
    getPreviousArray: () => getPrevious(0) || [],
    getPreviousObject: () => getPrevious(0) || {}
  };
}

// Example usage:
// function Counter() {
//   const [count, setCount] = useState(0);
//   const { previous, hasChanged, changeCount } = usePrevious(count);
//   
//   return (
//     <div>
//       <p>Current: {count}</p>
//       <p>Previous: {previous}</p>
//       <p>Has Changed: {hasChanged ? 'Yes' : 'No'}</p>
//       <p>Change Count: {changeCount}</p>
//       <button onClick={() => setCount(count + 1)}>Increment</button>
//     </div>
//   );
// }
// 
// function FormTracker() {
//   const [formData, setFormData] = useState({ name: '', email: '' });
//   const { previous, history, getPrevious } = usePrevious(formData, {
//     maxHistory: 5,
//     deepCompare: true
//   });
//   
//   return (
//     <div>
//       <input
//         value={formData.name}
//         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//       />
//       <p>Previous form data: {JSON.stringify(previous)}</p>
//       <p>All changes: {history.length}</p>
//     </div>
//   );
// }
// 
// function AdvancedTracker() {
//   const [value, setValue] = useState(0);
//   const {
//     previous,
//     history,
//     getPrevious,
//     getAllPrevious,
//     hasChanged,
//     getChangeCount,
//     resetHistory,
//     isFirstChange,
//     getPreviousNumber
//   } = usePrevious(value, {
//     maxHistory: 3,
//     comparator: (a, b) => Math.abs(a - b) > 5 // Only track if difference > 5
//   });
//   
//   return (
//     <div>
//       <p>Current: {value}</p>
//       <p>Previous: {previous}</p>
//       <p>All History: {JSON.stringify(getAllPrevious())}</p>
//       <p>Second Previous: {getPrevious(1)}</p>
//       <p>Is First Change: {isFirstChange ? 'Yes' : 'No'}</p>
//       <p>Previous as Number: {getPreviousNumber()}</p>
//       <button onClick={() => setValue(value + 1)}>Increment</button>
//       <button onClick={resetHistory}>Reset History</button>
//     </div>
//   );
// }

export default usePrevious;