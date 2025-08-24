/**
 * Custom React hook for localStorage with advanced features
 * @param {string} key - localStorage key
 * @param {any} initialValue - Initial value if key doesn't exist
 * @param {Object} options - Configuration options
 * @param {boolean} options.serialize - Whether to serialize/deserialize (default: true)
 * @param {Function} options.serializer - Custom serializer function
 * @param {Function} options.deserializer - Custom deserializer function
 * @param {boolean} options.sync - Sync across browser tabs (default: true)
 * @returns {Array} [storedValue, setValue, removeValue, clearAll]
 */
import { useState, useEffect, useCallback } from 'react';

function useLocalStorage(key, initialValue, options = {}) {
  const {
    serialize = true,
    serializer = JSON.stringify,
    deserializer = JSON.parse,
    sync = true
  } = options;

  // Get initial value from localStorage or use provided initial value
  const getStoredValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue;
      }
      return serialize ? deserializer(item) : item;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  }, [key, initialValue, serialize, deserializer]);

  const [storedValue, setStoredValue] = useState(getStoredValue);

  // Set value in localStorage and state
  const setValue = useCallback((value) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save to state
      setStoredValue(valueToStore);
      
      // Save to localStorage
      const serializedValue = serialize ? serializer(valueToStore) : valueToStore;
      window.localStorage.setItem(key, serializedValue);
      
      // Dispatch custom event for cross-tab synchronization
      if (sync) {
        window.dispatchEvent(new StorageEvent('localStorage', {
          key,
          newValue: serializedValue
        }));
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue, serialize, serializer, sync]);

  // Remove value from localStorage and state
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
      
      if (sync) {
        window.dispatchEvent(new StorageEvent('localStorage', {
          key,
          newValue: null
        }));
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue, sync]);

  // Clear all localStorage items
  const clearAll = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.clear();
      
      if (sync) {
        window.dispatchEvent(new StorageEvent('localStorage', {
          key: null,
          newValue: null
        }));
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }, [initialValue, sync]);

  // Listen for changes in other tabs
  useEffect(() => {
    if (!sync) return;

    const handleStorageChange = (event) => {
      if (event.key === key && event.newValue !== null) {
        try {
          const newValue = serialize ? deserializer(event.newValue) : event.newValue;
          setStoredValue(newValue);
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, sync, serialize, deserializer]);

  return [storedValue, setValue, removeValue, clearAll];
}

// Example usage:
// function UserPreferences() {
//   const [theme, setTheme, removeTheme] = useLocalStorage('theme', 'light');
//   const [user, setUser] = useLocalStorage('user', null, {
//     serialize: true,
//     sync: true
//   });
//   
//   return (
//     <div>
//       <select value={theme} onChange={(e) => setTheme(e.target.value)}>
//         <option value="light">Light</option>
//         <option value="dark">Dark</option>
//       </select>
//       <button onClick={removeTheme}>Reset Theme</button>
//     </div>
//   );
// }

export default useLocalStorage;