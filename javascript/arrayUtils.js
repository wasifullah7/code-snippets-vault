/**
 * Advanced array manipulation utilities for modern JavaScript
 * Collection of commonly needed array operations with performance optimizations
 */

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Size of each chunk
 * @returns {Array} Array of chunks
 */
function chunk(array, size) {
    if (!Array.isArray(array) || size <= 0) return [];
    
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  /**
   * Remove duplicates from array with custom key function
   * @param {Array} array - Array to deduplicate
   * @param {Function} keyFn - Function to extract key for comparison
   * @returns {Array} Deduplicated array
   */
  function uniqueBy(array, keyFn = (item) => item) {
    if (!Array.isArray(array)) return [];
    
    const seen = new Set();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Group array items by key
   * @param {Array} array - Array to group
   * @param {Function} keyFn - Function to extract grouping key
   * @returns {Object} Grouped items
   */
  function groupBy(array, keyFn) {
    if (!Array.isArray(array) || typeof keyFn !== 'function') return {};
    
    return array.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }
  
  /**
   * Flatten nested arrays with optional depth limit
   * @param {Array} array - Array to flatten
   * @param {number} depth - Maximum depth to flatten (default: Infinity)
   * @returns {Array} Flattened array
   */
  function flatten(array, depth = Infinity) {
    if (!Array.isArray(array) || depth < 0) return [];
    
    return array.reduce((flat, item) => {
      if (Array.isArray(item) && depth > 0) {
        return flat.concat(flatten(item, depth - 1));
      }
      return flat.concat(item);
    }, []);
  }
  
  /**
   * Find and return the first item matching the predicate
   * @param {Array} array - Array to search
   * @param {Function} predicate - Function to test each item
   * @param {any} defaultValue - Default value if no match found
   * @returns {any} First matching item or default value
   */
  function findOrDefault(array, predicate, defaultValue = null) {
    if (!Array.isArray(array) || typeof predicate !== 'function') {
      return defaultValue;
    }
    
    const found = array.find(predicate);
    return found !== undefined ? found : defaultValue;
  }
  
  /**
   * Sort array by multiple criteria
   * @param {Array} array - Array to sort
   * @param {Array} criteria - Array of sorting criteria objects
   * @returns {Array} Sorted array
   */
  function sortByMultiple(array, criteria) {
    if (!Array.isArray(array) || !Array.isArray(criteria)) return array;
    
    return [...array].sort((a, b) => {
      for (const criterion of criteria) {
        const { key, order = 'asc' } = criterion;
        const aVal = typeof key === 'function' ? key(a) : a[key];
        const bVal = typeof key === 'function' ? key(b) : b[key];
        
        if (aVal < bVal) return order === 'desc' ? 1 : -1;
        if (aVal > bVal) return order === 'desc' ? -1 : 1;
      }
      return 0;
    });
  }
  
  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  function shuffle(array) {
    if (!Array.isArray(array)) return [];
    
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
  
  /**
   * Get random sample from array
   * @param {Array} array - Array to sample from
   * @param {number} size - Number of items to sample
   * @returns {Array} Random sample
   */
  function sample(array, size = 1) {
    if (!Array.isArray(array) || size <= 0) return [];
    
    const shuffled = shuffle(array);
    return shuffled.slice(0, Math.min(size, array.length));
  }
  
  // Example usage:
  // const users = [
  //   { id: 1, name: 'Alice', age: 25, city: 'NYC' },
  //   { id: 2, name: 'Bob', age: 30, city: 'LA' },
  //   { id: 3, name: 'Alice', age: 28, city: 'NYC' }
  // ];
  // 
  // const chunks = chunk(users, 2);
  // const uniqueUsers = uniqueBy(users, user => user.name);
  // const groupedByCity = groupBy(users, user => user.city);
  // const sortedUsers = sortByMultiple(users, [
  //   { key: 'city', order: 'asc' },
  //   { key: 'age', order: 'desc' }
  // ]);
  
  module.exports = {
    chunk,
    uniqueBy,
    groupBy,
    flatten,
    findOrDefault,
    sortByMultiple,
    shuffle,
    sample
  };