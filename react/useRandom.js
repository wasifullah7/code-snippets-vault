import { useState, useCallback } from 'react';

/**
 * React hook for random operations
 * @returns {Object} Random functions
 */
const useRandom = () => {
  const [lastRandom, setLastRandom] = useState(null);

  const randomNumber = useCallback((min, max) => {
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    setLastRandom(result);
    return result;
  }, []);

  const randomString = useCallback((length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const result = Array.from({length}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    setLastRandom(result);
    return result;
  }, []);

  const randomItem = useCallback((array) => {
    const result = array[Math.floor(Math.random() * array.length)];
    setLastRandom(result);
    return result;
  }, []);

  const shuffleArray = useCallback((array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setLastRandom(shuffled);
    return shuffled;
  }, []);

  return {
    randomNumber,
    randomString,
    randomItem,
    shuffleArray,
    lastRandom
  };
};

export default useRandom;
