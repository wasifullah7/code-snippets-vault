/**
 * Array utilities for Node.js
 */

/**
 * Remove duplicates from array
 * @param {Array} array - Array to deduplicate
 * @returns {Array} Array without duplicates
 */
const removeDuplicates = (array) => {
  return [...new Set(array)];
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
const groupBy = (array, key) => {
  return array.reduce((groups, item) => {
    const group = item[key];
    groups[group] = groups[group] || [];
    groups[group].push(item);
    return groups;
  }, {});
};

/**
 * Chunk array into smaller arrays
 * @param {Array} array - Array to chunk
 * @param {number} size - Chunk size
 * @returns {Array} Array of chunks
 */
const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

/**
 * Flatten nested array
 * @param {Array} array - Array to flatten
 * @returns {Array} Flattened array
 */
const flatten = (array) => {
  return array.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item);
  }, []);
};

/**
 * Find intersection of two arrays
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Intersection array
 */
const intersection = (arr1, arr2) => {
  return arr1.filter(item => arr2.includes(item));
};

/**
 * Find difference between two arrays
 * @param {Array} arr1 - First array
 * @param {Array} arr2 - Second array
 * @returns {Array} Difference array
 */
const difference = (arr1, arr2) => {
  return arr1.filter(item => !arr2.includes(item));
};

/**
 * Sort array by multiple criteria
 * @param {Array} array - Array to sort
 * @param {Array} criteria - Array of sort criteria
 * @returns {Array} Sorted array
 */
const sortByMultiple = (array, criteria) => {
  return array.sort((a, b) => {
    for (const criterion of criteria) {
      const { key, order = 'asc' } = criterion;
      const aVal = a[key];
      const bVal = b[key];
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1;
      if (aVal > bVal) return order === 'asc' ? 1 : -1;
    }
    return 0;
  });
};

module.exports = {
  removeDuplicates,
  groupBy,
  chunk,
  flatten,
  intersection,
  difference,
  sortByMultiple
};
