/**
 * Advanced array utilities for modern JavaScript
 * Comprehensive array operations, manipulation, and statistical functions
 */

/**
 * Array sorting utilities
 */
class ArraySorter {
  /**
   * Sort array by multiple properties
   * @param {Array} array - Array to sort
   * @param {Array} properties - Array of property names to sort by
   * @param {Array} directions - Array of sort directions ('asc' or 'desc')
   * @returns {Array} Sorted array
   */
  static sortByMultiple(array, properties, directions = []) {
    return [...array].sort((a, b) => {
      for (let i = 0; i < properties.length; i++) {
        const prop = properties[i];
        const direction = directions[i] || 'asc';
        const aVal = this.getNestedValue(a, prop);
        const bVal = this.getNestedValue(b, prop);
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }

  /**
   * Sort array by string length
   * @param {Array} array - Array of strings
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted array
   */
  static sortByLength(array, direction = 'asc') {
    return [...array].sort((a, b) => {
      const comparison = a.length - b.length;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Sort array by date
   * @param {Array} array - Array of objects with date properties
   * @param {string} dateProperty - Property name containing date
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted array
   */
  static sortByDate(array, dateProperty, direction = 'asc') {
    return [...array].sort((a, b) => {
      const aDate = new Date(a[dateProperty]);
      const bDate = new Date(b[dateProperty]);
      const comparison = aDate - bDate;
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Sort array by frequency
   * @param {Array} array - Array to sort
   * @param {string} direction - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted array
   */
  static sortByFrequency(array, direction = 'desc') {
    const frequency = {};
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
    });
    
    return [...array].sort((a, b) => {
      const comparison = frequency[a] - frequency[b];
      return direction === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Get nested object value
   * @param {Object} obj - Object to get value from
   * @param {string} path - Property path (e.g., 'user.address.city')
   * @returns {*} Value at path
   */
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

/**
 * Array filtering utilities
 */
class ArrayFilter {
  /**
   * Filter array by multiple conditions
   * @param {Array} array - Array to filter
   * @param {Array} conditions - Array of filter conditions
   * @returns {Array} Filtered array
   */
  static filterByMultiple(array, conditions) {
    return array.filter(item => {
      return conditions.every(condition => {
        const { property, operator, value } = condition;
        const itemValue = ArraySorter.getNestedValue(item, property);
        
        switch (operator) {
          case 'equals': return itemValue === value;
          case 'notEquals': return itemValue !== value;
          case 'contains': return String(itemValue).includes(value);
          case 'startsWith': return String(itemValue).startsWith(value);
          case 'endsWith': return String(itemValue).endsWith(value);
          case 'greaterThan': return itemValue > value;
          case 'lessThan': return itemValue < value;
          case 'greaterThanOrEqual': return itemValue >= value;
          case 'lessThanOrEqual': return itemValue <= value;
          case 'in': return Array.isArray(value) && value.includes(itemValue);
          case 'notIn': return Array.isArray(value) && !value.includes(itemValue);
          case 'between': return itemValue >= value[0] && itemValue <= value[1];
          case 'regex': return new RegExp(value).test(String(itemValue));
          default: return true;
        }
      });
    });
  }

  /**
   * Filter array by unique values
   * @param {Array} array - Array to filter
   * @param {string} property - Property to check uniqueness
   * @returns {Array} Array with unique values
   */
  static uniqueBy(array, property) {
    const seen = new Set();
    return array.filter(item => {
      const value = ArraySorter.getNestedValue(item, property);
      if (seen.has(value)) {
        return false;
      }
      seen.add(value);
      return true;
    });
  }

  /**
   * Filter array by removing falsy values
   * @param {Array} array - Array to filter
   * @returns {Array} Filtered array
   */
  static removeFalsy(array) {
    return array.filter(item => Boolean(item));
  }

  /**
   * Filter array by removing null and undefined values
   * @param {Array} array - Array to filter
   * @returns {Array} Filtered array
   */
  static removeNullish(array) {
    return array.filter(item => item != null);
  }
}

/**
 * Array grouping utilities
 */
class ArrayGroup {
  /**
   * Group array by property
   * @param {Array} array - Array to group
   * @param {string} property - Property to group by
   * @returns {Object} Grouped object
   */
  static byProperty(array, property) {
    return array.reduce((groups, item) => {
      const key = ArraySorter.getNestedValue(item, property);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Group array by function
   * @param {Array} array - Array to group
   * @param {Function} groupFn - Function to determine group key
   * @returns {Object} Grouped object
   */
  static byFunction(array, groupFn) {
    return array.reduce((groups, item) => {
      const key = groupFn(item);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }

  /**
   * Group array by multiple properties
   * @param {Array} array - Array to group
   * @param {Array} properties - Array of properties to group by
   * @returns {Object} Grouped object
   */
  static byMultiple(array, properties) {
    return array.reduce((groups, item) => {
      const key = properties.map(prop => ArraySorter.getNestedValue(item, prop)).join('|');
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {});
  }
}

/**
 * Array transformation utilities
 */
class ArrayTransform {
  /**
   * Chunk array into smaller arrays
   * @param {Array} array - Array to chunk
   * @param {number} size - Size of each chunk
   * @returns {Array} Array of chunks
   */
  static chunk(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Flatten nested array
   * @param {Array} array - Array to flatten
   * @param {number} depth - Flattening depth (default: Infinity)
   * @returns {Array} Flattened array
   */
  static flatten(array, depth = Infinity) {
    return array.flat(depth);
  }

  /**
   * Rotate array
   * @param {Array} array - Array to rotate
   * @param {number} positions - Number of positions to rotate (positive = right, negative = left)
   * @returns {Array} Rotated array
   */
  static rotate(array, positions) {
    const len = array.length;
    const normalizedPositions = ((positions % len) + len) % len;
    return [...array.slice(normalizedPositions), ...array.slice(0, normalizedPositions)];
  }

  /**
   * Shuffle array
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  static shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Remove duplicates from array
   * @param {Array} array - Array to deduplicate
   * @param {Function} keyFn - Function to generate key for comparison
   * @returns {Array} Array without duplicates
   */
  static unique(array, keyFn = null) {
    if (!keyFn) {
      return [...new Set(array)];
    }
    
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
}

/**
 * Array statistical utilities
 */
class ArrayStats {
  /**
   * Calculate mean of array
   * @param {Array} array - Array of numbers
   * @returns {number} Mean value
   */
  static mean(array) {
    if (array.length === 0) return 0;
    return array.reduce((sum, val) => sum + val, 0) / array.length;
  }

  /**
   * Calculate median of array
   * @param {Array} array - Array of numbers
   * @returns {number} Median value
   */
  static median(array) {
    if (array.length === 0) return 0;
    
    const sorted = [...array].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
  }

  /**
   * Calculate mode of array
   * @param {Array} array - Array of values
   * @returns {Array} Mode values
   */
  static mode(array) {
    if (array.length === 0) return [];
    
    const frequency = {};
    let maxFreq = 0;
    
    array.forEach(item => {
      frequency[item] = (frequency[item] || 0) + 1;
      maxFreq = Math.max(maxFreq, frequency[item]);
    });
    
    return Object.keys(frequency).filter(key => frequency[key] === maxFreq);
  }

  /**
   * Calculate standard deviation
   * @param {Array} array - Array of numbers
   * @returns {number} Standard deviation
   */
  static standardDeviation(array) {
    if (array.length === 0) return 0;
    
    const mean = this.mean(array);
    const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
    const variance = this.mean(squaredDiffs);
    
    return Math.sqrt(variance);
  }

  /**
   * Calculate variance
   * @param {Array} array - Array of numbers
   * @returns {number} Variance
   */
  static variance(array) {
    if (array.length === 0) return 0;
    
    const mean = this.mean(array);
    const squaredDiffs = array.map(val => Math.pow(val - mean, 2));
    
    return this.mean(squaredDiffs);
  }

  /**
   * Get minimum and maximum values
   * @param {Array} array - Array of numbers
   * @returns {Object} Object with min and max values
   */
  static minMax(array) {
    if (array.length === 0) return { min: 0, max: 0 };
    
    return {
      min: Math.min(...array),
      max: Math.max(...array)
    };
  }

  /**
   * Calculate percentile
   * @param {Array} array - Array of numbers
   * @param {number} percentile - Percentile (0-100)
   * @returns {number} Percentile value
   */
  static percentile(array, percentile) {
    if (array.length === 0) return 0;
    
    const sorted = [...array].sort((a, b) => a - b);
    const index = (percentile / 100) * (sorted.length - 1);
    
    if (Number.isInteger(index)) {
      return sorted[index];
    }
    
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

/**
 * Array search utilities
 */
class ArraySearch {
  /**
   * Binary search
   * @param {Array} array - Sorted array
   * @param {*} target - Target value
   * @param {Function} compareFn - Comparison function
   * @returns {number} Index of target or -1 if not found
   */
  static binarySearch(array, target, compareFn = (a, b) => a - b) {
    let left = 0;
    let right = array.length - 1;
    
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      const comparison = compareFn(array[mid], target);
      
      if (comparison === 0) {
        return mid;
      } else if (comparison < 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    
    return -1;
  }

  /**
   * Find closest value
   * @param {Array} array - Array of numbers
   * @param {number} target - Target value
   * @returns {number} Closest value
   */
  static findClosest(array, target) {
    if (array.length === 0) return null;
    
    return array.reduce((closest, current) => {
      const closestDiff = Math.abs(closest - target);
      const currentDiff = Math.abs(current - target);
      return currentDiff < closestDiff ? current : closest;
    });
  }

  /**
   * Find all occurrences
   * @param {Array} array - Array to search
   * @param {*} target - Target value
   * @returns {Array} Array of indices
   */
  static findAll(array, target) {
    const indices = [];
    array.forEach((item, index) => {
      if (item === target) {
        indices.push(index);
      }
    });
    return indices;
  }
}

/**
 * Array utilities
 */
const arrayUtils = {
  /**
   * Check if array is empty
   * @param {Array} array - Array to check
   * @returns {boolean} Whether array is empty
   */
  isEmpty(array) {
    return !Array.isArray(array) || array.length === 0;
  },

  /**
   * Check if array has duplicates
   * @param {Array} array - Array to check
   * @returns {boolean} Whether array has duplicates
   */
  hasDuplicates(array) {
    return new Set(array).size !== array.length;
  },

  /**
   * Get random element from array
   * @param {Array} array - Array to get element from
   * @returns {*} Random element
   */
  random(array) {
    if (this.isEmpty(array)) return null;
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Get first element of array
   * @param {Array} array - Array to get element from
   * @returns {*} First element
   */
  first(array) {
    return array?.[0] ?? null;
  },

  /**
   * Get last element of array
   * @param {Array} array - Array to get element from
   * @returns {*} Last element
   */
  last(array) {
    return array?.[array.length - 1] ?? null;
  },

  /**
   * Get array without first element
   * @param {Array} array - Array to modify
   * @returns {Array} Array without first element
   */
  tail(array) {
    return array?.slice(1) ?? [];
  },

  /**
   * Get array without last element
   * @param {Array} array - Array to modify
   * @returns {Array} Array without last element
   */
  init(array) {
    return array?.slice(0, -1) ?? [];
  },

  /**
   * Count occurrences of value in array
   * @param {Array} array - Array to count in
   * @param {*} value - Value to count
   * @returns {number} Number of occurrences
   */
  count(array, value) {
    return array.filter(item => item === value).length;
  },

  /**
   * Check if all elements match condition
   * @param {Array} array - Array to check
   * @param {Function} predicate - Condition function
   * @returns {boolean} Whether all elements match
   */
  all(array, predicate) {
    return array.every(predicate);
  },

  /**
   * Check if any element matches condition
   * @param {Array} array - Array to check
   * @param {Function} predicate - Condition function
   * @returns {boolean} Whether any element matches
   */
  any(array, predicate) {
    return array.some(predicate);
  },

  /**
   * Get intersection of two arrays
   * @param {Array} array1 - First array
   * @param {Array} array2 - Second array
   * @returns {Array} Intersection array
   */
  intersection(array1, array2) {
    const set2 = new Set(array2);
    return array1.filter(item => set2.has(item));
  },

  /**
   * Get union of two arrays
   * @param {Array} array1 - First array
   * @param {Array} array2 - Second array
   * @returns {Array} Union array
   */
  union(array1, array2) {
    return [...new Set([...array1, ...array2])];
  },

  /**
   * Get difference between two arrays
   * @param {Array} array1 - First array
   * @param {Array} array2 - Second array
   * @returns {Array} Difference array
   */
  difference(array1, array2) {
    const set2 = new Set(array2);
    return array1.filter(item => !set2.has(item));
  }
};

// Export all classes and utilities
export {
  ArraySorter,
  ArrayFilter,
  ArrayGroup,
  ArrayTransform,
  ArrayStats,
  ArraySearch,
  arrayUtils
};

export default arrayUtils;