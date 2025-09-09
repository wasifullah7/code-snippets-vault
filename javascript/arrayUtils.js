/**
 * Array manipulation utility functions
 */

/**
 * Remove duplicates from array
 * @param {Array} arr - Input array
 * @returns {Array} Array without duplicates
 */
export const unique = (arr) => [...new Set(arr)];

/**
 * Chunk array into smaller arrays
 * @param {Array} arr - Input array
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
export const chunk = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Flatten nested array
 * @param {Array} arr - Input array
 * @param {number} depth - Flatten depth
 * @returns {Array} Flattened array
 */
export const flatten = (arr, depth = 1) => {
  return arr.flat(depth);
};

/**
 * Group array by key
 * @param {Array} arr - Input array
 * @param {string|Function} key - Grouping key or function
 * @returns {Object} Grouped object
 */
export const groupBy = (arr, key) => {
  return arr.reduce((groups, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
    return groups;
  }, {});
};

/**
 * Shuffle array randomly
 * @param {Array} arr - Input array
 * @returns {Array} Shuffled array
 */
export const shuffle = (arr) => {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Get random sample from array
 * @param {Array} arr - Input array
 * @param {number} count - Number of samples
 * @returns {Array} Random samples
 */
export const sample = (arr, count = 1) => {
  const shuffled = shuffle(arr);
  return shuffled.slice(0, count);
};

/**
 * Find item or return default
 * @param {Array} arr - Input array
 * @param {Function} predicate - Find condition
 * @param {*} defaultValue - Default value
 * @returns {*} Found item or default
 */
export const findOrDefault = (arr, predicate, defaultValue = null) => {
  return arr.find(predicate) || defaultValue;
};

/**
 * Sort array by multiple keys
 * @param {Array} arr - Input array
 * @param {Array} keys - Sort keys
 * @returns {Array} Sorted array
 */
export const sortByMultiple = (arr, keys) => {
  return arr.sort((a, b) => {
    for (const key of keys) {
      const aVal = a[key];
      const bVal = b[key];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
    }
    return 0;
  });
};