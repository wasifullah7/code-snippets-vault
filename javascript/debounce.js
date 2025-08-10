/**
 * Debounce function to delay execution
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function}
 */
function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
  
  // Example usage:
  // const debouncedSearch = debounce((searchTerm) => {
  //   console.log('Searching for:', searchTerm);
  //   // Perform search API call
  // }, 300);
  // 
  // // Use in event listener
  // searchInput.addEventListener('input', (e) => {
  //   debouncedSearch(e.target.value);
  // });
  
  module.exports = debounce;