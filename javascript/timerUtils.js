/**
 * Timer utility functions for countdown, intervals, and timeouts
 */

/**
 * Create a countdown timer
 * @param {number} duration - Duration in milliseconds
 * @param {Function} onTick - Callback for each tick
 * @param {Function} onComplete - Callback when complete
 * @returns {Object} Timer control object
 */
export const createCountdown = (duration, onTick, onComplete) => {
  let startTime = Date.now();
  let intervalId = null;
  let isPaused = false;
  let remainingTime = duration;

  const timer = {
    start() {
      if (intervalId) return;
      startTime = Date.now();
      intervalId = setInterval(() => {
        if (isPaused) return;
        
        const elapsed = Date.now() - startTime;
        remainingTime = Math.max(0, duration - elapsed);
        
        if (onTick) onTick(remainingTime);
        
        if (remainingTime <= 0) {
          timer.stop();
          if (onComplete) onComplete();
        }
      }, 100);
    },
    
    pause() {
      isPaused = true;
    },
    
    resume() {
      isPaused = false;
    },
    
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    
    getRemainingTime() {
      return remainingTime;
    },
    
    isRunning() {
      return intervalId !== null && !isPaused;
    }
  };

  return timer;
};

/**
 * Create a reusable interval timer
 * @param {Function} callback - Function to call
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} Interval control object
 */
export const createInterval = (callback, delay) => {
  let intervalId = null;

  const timer = {
    start() {
      if (intervalId) return;
      intervalId = setInterval(callback, delay);
    },
    
    stop() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    },
    
    isRunning() {
      return intervalId !== null;
    }
  };

  return timer;
};

/**
 * Create a debounced timeout
 * @param {Function} callback - Function to call
 * @param {number} delay - Delay in milliseconds
 * @returns {Object} Timeout control object
 */
export const createDebouncedTimeout = (callback, delay) => {
  let timeoutId = null;

  const timer = {
    start() {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(callback, delay);
    },
    
    cancel() {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    },
    
    isPending() {
      return timeoutId !== null;
    }
  };

  return timer;
};

/**
 * Format time in milliseconds to readable format
 * @param {number} ms - Time in milliseconds
 * @returns {string} Formatted time string
 */
export const formatTime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

/**
 * Get time until a specific date
 * @param {Date} targetDate - Target date
 * @returns {Object} Time remaining object
 */
export const getTimeUntil = (targetDate) => {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();
  
  if (diff <= 0) {
    return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { expired: false, days, hours, minutes, seconds };
};
