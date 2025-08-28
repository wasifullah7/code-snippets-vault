import { useState, useCallback } from 'react';

/**
 * React hook for array operations
 * @param {Array} initialArray - Initial array
 * @returns {Object} Array state and functions
 */
const useArray = (initialArray = []) => {
  const [array, setArray] = useState(initialArray);

  const add = useCallback((item) => {
    setArray(prev => [...prev, item]);
  }, []);

  const remove = useCallback((index) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  const update = useCallback((index, item) => {
    setArray(prev => prev.map((val, i) => i === index ? item : val));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const removeDuplicates = useCallback(() => {
    setArray(prev => [...new Set(prev)]);
  }, []);

  const shuffle = useCallback(() => {
    setArray(prev => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    });
  }, []);

  const reverse = useCallback(() => {
    setArray(prev => [...prev].reverse());
  }, []);

  const sort = useCallback((compareFn) => {
    setArray(prev => [...prev].sort(compareFn));
  }, []);

  return {
    array,
    add,
    remove,
    update,
    clear,
    removeDuplicates,
    shuffle,
    reverse,
    sort,
    length: array.length
  };
};

export default useArray;
