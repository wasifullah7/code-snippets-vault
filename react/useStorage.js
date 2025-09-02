import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for storage operations
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @param {Object} options - Storage options
 * @param {string} options.type - Storage type ('local' or 'session')
 * @param {number} options.ttl - Time to live in milliseconds
 * @returns {Array} [storedValue, setValue, removeValue]
 */
const useStorage = (key, initialValue, options = {}) => {
  const { type = 'local', ttl } = options;
  const storage = type === 'local' ? localStorage : sessionStorage;

  // Get initial value from storage
  const getStoredValue = useCallback(() => {
    try {
      const item = storage.getItem(key);
      if (!item) return initialValue;

      const parsed = JSON.parse(item);
      
      // Check TTL if provided
      if (ttl && parsed.timestamp) {
        const now = Date.now();
        if (now - parsed.timestamp > ttl) {
          storage.removeItem(key);
          return initialValue;
        }
      }

      return parsed.value || parsed;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return initialValue;
    }
  }, [key, initialValue, storage, ttl]);

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Set value in storage
  const setValue = useCallback((value) => {
    try {
      let itemToStore = value;
      
      // Add TTL if provided
      if (ttl) {
        itemToStore = {
          value,
          timestamp: Date.now(),
          ttl
        };
      }

      storage.setItem(key, JSON.stringify(itemToStore));
      setStoredValue(value);
    } catch (error) {
      console.error('Error setting storage value:', error);
    }
  }, [key, storage, ttl]);

  // Remove value from storage
  const removeValue = useCallback(() => {
    try {
      storage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing storage value:', error);
    }
  }, [key, storage, initialValue]);

  // Update stored value when key changes
  useEffect(() => {
    setStoredValue(getStoredValue());
  }, [key, getStoredValue]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key && e.storageArea === storage) {
        if (e.newValue === null) {
          setStoredValue(initialValue);
        } else {
          try {
            const parsed = JSON.parse(e.newValue);
            setStoredValue(parsed.value || parsed);
          } catch {
            setStoredValue(e.newValue);
          }
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, storage, initialValue]);

  return [storedValue, setValue, removeValue];
};

/**
 * React hook for localStorage
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @param {Object} options - Storage options
 * @returns {Array} [storedValue, setValue, removeValue]
 */
export const useLocalStorage = (key, initialValue, options = {}) => {
  return useStorage(key, initialValue, { ...options, type: 'local' });
};

/**
 * React hook for sessionStorage
 * @param {string} key - Storage key
 * @param {*} initialValue - Initial value
 * @param {Object} options - Storage options
 * @returns {Array} [storedValue, setValue, removeValue]
 */
export const useSessionStorage = (key, initialValue, options = {}) => {
  return useStorage(key, initialValue, { ...options, type: 'session' });
};

export default useStorage;
