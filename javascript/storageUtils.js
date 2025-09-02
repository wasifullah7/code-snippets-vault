/**
 * Storage utility functions for localStorage and sessionStorage
 */

/**
 * Set item in localStorage with expiration
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 * @param {number} ttl - Time to live in milliseconds
 */
const setLocalStorageWithTTL = (key, value, ttl = 24 * 60 * 60 * 1000) => {
  const item = {
    value,
    timestamp: Date.now(),
    ttl
  };
  localStorage.setItem(key, JSON.stringify(item));
};

/**
 * Get item from localStorage with TTL check
 * @param {string} key - Storage key
 * @returns {*} Stored value or null if expired
 */
const getLocalStorageWithTTL = (key) => {
  const item = localStorage.getItem(key);
  if (!item) return null;

  try {
    const parsed = JSON.parse(item);
    const now = Date.now();
    
    if (now - parsed.timestamp > parsed.ttl) {
      localStorage.removeItem(key);
      return null;
    }
    
    return parsed.value;
  } catch {
    return null;
  }
};

/**
 * Set item in sessionStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
const setSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to set sessionStorage item:', error);
  }
};

/**
 * Get item from sessionStorage
 * @param {string} key - Storage key
 * @returns {*} Stored value or null
 */
const getSessionStorage = (key) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Failed to get sessionStorage item:', error);
    return null;
  }
};

/**
 * Remove item from storage
 * @param {string} key - Storage key
 * @param {string} type - Storage type ('local' or 'session')
 */
const removeStorageItem = (key, type = 'local') => {
  if (type === 'local') {
    localStorage.removeItem(key);
  } else {
    sessionStorage.removeItem(key);
  }
};

/**
 * Clear all storage
 * @param {string} type - Storage type ('local', 'session', or 'both')
 */
const clearStorage = (type = 'both') => {
  if (type === 'local' || type === 'both') {
    localStorage.clear();
  }
  if (type === 'session' || type === 'both') {
    sessionStorage.clear();
  }
};

/**
 * Get storage size in bytes
 * @param {string} type - Storage type ('local' or 'session')
 * @returns {number} Storage size in bytes
 */
const getStorageSize = (type = 'local') => {
  const storage = type === 'local' ? localStorage : sessionStorage;
  let size = 0;
  
  for (let key in storage) {
    if (storage.hasOwnProperty(key)) {
      size += storage[key].length + key.length;
    }
  }
  
  return size;
};

/**
 * Get all storage keys
 * @param {string} type - Storage type ('local' or 'session')
 * @returns {Array} Array of storage keys
 */
const getStorageKeys = (type = 'local') => {
  const storage = type === 'local' ? localStorage : sessionStorage;
  return Object.keys(storage);
};

/**
 * Check if storage is available
 * @param {string} type - Storage type ('local' or 'session')
 * @returns {boolean} True if storage is available
 */
const isStorageAvailable = (type = 'local') => {
  try {
    const storage = type === 'local' ? localStorage : sessionStorage;
    const testKey = '__storage_test__';
    storage.setItem(testKey, 'test');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
};

/**
 * Set multiple items at once
 * @param {Object} items - Object with key-value pairs
 * @param {string} type - Storage type ('local' or 'session')
 */
const setMultipleItems = (items, type = 'local') => {
  const storage = type === 'local' ? localStorage : sessionStorage;
  
  Object.entries(items).forEach(([key, value]) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to set ${key}:`, error);
    }
  });
};

/**
 * Get multiple items at once
 * @param {Array} keys - Array of storage keys
 * @param {string} type - Storage type ('local' or 'session')
 * @returns {Object} Object with key-value pairs
 */
const getMultipleItems = (keys, type = 'local') => {
  const storage = type === 'local' ? localStorage : sessionStorage;
  const result = {};
  
  keys.forEach(key => {
    try {
      const item = storage.getItem(key);
      if (item) {
        result[key] = JSON.parse(item);
      }
    } catch (error) {
      console.error(`Failed to get ${key}:`, error);
    }
  });
  
  return result;
};

module.exports = {
  setLocalStorageWithTTL,
  getLocalStorageWithTTL,
  setSessionStorage,
  getSessionStorage,
  removeStorageItem,
  clearStorage,
  getStorageSize,
  getStorageKeys,
  isStorageAvailable,
  setMultipleItems,
  getMultipleItems
};
