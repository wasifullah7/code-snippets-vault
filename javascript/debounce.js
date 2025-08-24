/**
 * Debounce function to limit the rate at which a function can fire
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {boolean} [leading=false] - Whether to call on the leading edge
 * @returns {Function} The debounced function
 */
function debounce(func, wait, leading = false) {
  let timeoutId;
  
  return function executedFunction(...args) {
    const later = () => {
      timeoutId = null;
      if (!leading) func.apply(this, args);
    };
    
    const callNow = leading && !timeoutId;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  };
}

// Usage examples:
// const debouncedSearch = debounce(searchFunction, 300);
// const debouncedResize = debounce(handleResize, 250, true);

module.exports = debounce;