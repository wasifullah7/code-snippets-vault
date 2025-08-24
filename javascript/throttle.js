/**
 * Throttle function to limit execution frequency
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @param {Object} options - Additional options
 * @param {boolean} options.leading - Execute on the leading edge (default: true)
 * @param {boolean} options.trailing - Execute on the trailing edge (default: true)
 * @returns {Function}
 */
function throttle(func, limit, options = {}) {
    const { leading = true, trailing = true } = options;
    let inThrottle;
    let lastFunc;
    let lastRan;
  
    return function (...args) {
      if (!inThrottle) {
        if (leading) {
          func.apply(this, args);
        }
        lastRan = Date.now();
        inThrottle = true;
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if (Date.now() - lastRan >= limit) {
            if (trailing) {
              func.apply(this, args);
            }
            inThrottle = false;
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }
  
  // Example usage:
  // const throttledScroll = throttle(() => {
  //   console.log('Scroll event throttled');
  //   // Handle scroll events efficiently
  // }, 100, { leading: true, trailing: false });
  // 
  // // Use in event listener
  // window.addEventListener('scroll', throttledScroll);
  // 
  // // Throttle API calls
  // const throttledApiCall = throttle(async (searchTerm) => {
  //   const response = await fetch(`/api/search?q=${searchTerm}`);
  //   const data = await response.json();
  //   updateSearchResults(data);
  // }, 500);
  
  module.exports = throttle;