import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom React hook for synchronized localStorage across browser tabs
 * Provides real-time synchronization of localStorage data between tabs
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value if key doesn't exist
 * @param {Object} options - Hook options
 * @returns {Array} [value, setValue, removeValue, isSynced]
 */
function useLocalStorageSync(key, initialValue, options = {}) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onSync = null,
    onError = null,
    syncInterval = 1000,
    enableSync = true
  } = options;

  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      if (onError) onError(error);
      return initialValue;
    }
  });

  const [isSynced, setIsSynced] = useState(true);
  const [lastSync, setLastSync] = useState(Date.now());
  const syncTimeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Get current value from localStorage
  const getStoredValue = useCallback(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      if (onError) onError(error);
      return initialValue;
    }
  }, [key, deserialize, initialValue, onError]);

  // Set value in localStorage
  const setStoredValue = useCallback((newValue) => {
    try {
      const serializedValue = serialize(newValue);
      window.localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      if (onError) onError(error);
      return false;
    }
  }, [key, serialize, onError]);

  // Remove value from localStorage
  const removeStoredValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      return true;
    } catch (error) {
      if (onError) onError(error);
      return false;
    }
  }, [key, onError]);

  // Update local state and localStorage
  const updateValue = useCallback((newValue) => {
    const success = setStoredValue(newValue);
    if (success) {
      setValue(newValue);
      setLastSync(Date.now());
      setIsSynced(true);
      
      // Dispatch custom event for other tabs
      if (enableSync) {
        const event = new CustomEvent('localStorageSync', {
          detail: { key, value: newValue, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
      }
    }
  }, [setStoredValue, enableSync, key]);

  // Handle storage events from other tabs
  const handleStorageChange = useCallback((event) => {
    if (event.key === key && event.newValue !== null) {
      try {
        const newValue = deserialize(event.newValue);
        setValue(newValue);
        setLastSync(Date.now());
        setIsSynced(true);
        
        if (onSync) {
          onSync(newValue, 'storage');
        }
      } catch (error) {
        if (onError) onError(error);
      }
    }
  }, [key, deserialize, onSync, onError]);

  // Handle custom sync events
  const handleCustomSync = useCallback((event) => {
    const { key: eventKey, value: eventValue, timestamp } = event.detail;
    
    if (eventKey === key && timestamp > lastSync) {
      setValue(eventValue);
      setLastSync(timestamp);
      setIsSynced(true);
      
      if (onSync) {
        onSync(eventValue, 'custom');
      }
    }
  }, [key, lastSync, onSync]);

  // Periodic sync check
  const checkSync = useCallback(() => {
    if (!enableSync) return;
    
    const storedValue = getStoredValue();
    if (JSON.stringify(storedValue) !== JSON.stringify(value)) {
      setValue(storedValue);
      setLastSync(Date.now());
      setIsSynced(true);
      
      if (onSync) {
        onSync(storedValue, 'periodic');
      }
    }
  }, [enableSync, getStoredValue, value, onSync]);

  // Remove value
  const removeValue = useCallback(() => {
    const success = removeStoredValue();
    if (success) {
      setValue(initialValue);
      setLastSync(Date.now());
      setIsSynced(true);
      
      if (enableSync) {
        const event = new CustomEvent('localStorageSync', {
          detail: { key, value: null, timestamp: Date.now() }
        });
        window.dispatchEvent(event);
      }
    }
  }, [removeStoredValue, initialValue, enableSync, key]);

  // Initialize sync
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // Set initial value if not exists
    const storedValue = getStoredValue();
    if (storedValue === initialValue && value !== initialValue) {
      updateValue(value);
    }
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!enableSync) return;

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('localStorageSync', handleCustomSync);

    // Set up periodic sync
    if (syncInterval > 0) {
      syncTimeoutRef.current = setInterval(checkSync, syncInterval);
    }

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageSync', handleCustomSync);
      
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
    };
  }, [enableSync, handleStorageChange, handleCustomSync, checkSync, syncInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearInterval(syncTimeoutRef.current);
      }
    };
  }, []);

  return [value, updateValue, removeValue, isSynced];
}

/**
 * Hook for managing multiple synchronized localStorage keys
 * @param {Object} keys - Object with key-value pairs
 * @param {Object} options - Hook options
 * @returns {Object} Object with values and setters
 */
function useLocalStorageSyncMultiple(keys, options = {}) {
  const [values, setValues] = useState({});
  const [syncStatus, setSyncStatus] = useState({});

  useEffect(() => {
    const initialValues = {};
    const initialSyncStatus = {};

    Object.keys(keys).forEach(key => {
      try {
        const item = window.localStorage.getItem(key);
        initialValues[key] = item ? JSON.parse(item) : keys[key];
        initialSyncStatus[key] = true;
      } catch (error) {
        initialValues[key] = keys[key];
        initialSyncStatus[key] = false;
      }
    });

    setValues(initialValues);
    setSyncStatus(initialSyncStatus);
  }, []);

  const setValue = useCallback((key, value) => {
    try {
      const serializedValue = JSON.stringify(value);
      window.localStorage.setItem(key, serializedValue);
      
      setValues(prev => ({ ...prev, [key]: value }));
      setSyncStatus(prev => ({ ...prev, [key]: true }));
      
      // Dispatch custom event
      const event = new CustomEvent('localStorageSync', {
        detail: { key, value, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    } catch (error) {
      if (options.onError) options.onError(error);
    }
  }, [options]);

  const removeValue = useCallback((key) => {
    try {
      window.localStorage.removeItem(key);
      
      setValues(prev => ({ ...prev, [key]: keys[key] }));
      setSyncStatus(prev => ({ ...prev, [key]: true }));
      
      // Dispatch custom event
      const event = new CustomEvent('localStorageSync', {
        detail: { key, value: null, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    } catch (error) {
      if (options.onError) options.onError(error);
    }
  }, [keys, options]);

  const clearAll = useCallback(() => {
    Object.keys(keys).forEach(key => {
      removeValue(key);
    });
  }, [keys, removeValue]);

  return {
    values,
    setValue,
    removeValue,
    clearAll,
    syncStatus,
    isAllSynced: Object.values(syncStatus).every(status => status)
  };
}

/**
 * Hook for localStorage with encryption
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value
 * @param {Object} options - Hook options
 * @returns {Array} [value, setValue, removeValue, isSynced]
 */
function useLocalStorageSyncEncrypted(key, initialValue, options = {}) {
  const {
    encryptionKey = 'default-key',
    algorithm = 'AES-GCM',
    ...syncOptions
  } = options;

  // Simple encryption (you should use a proper encryption library in production)
  const encrypt = useCallback((text, key) => {
    try {
      // This is a simple XOR encryption for demonstration
      // In production, use proper encryption libraries
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(result);
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  }, []);

  const decrypt = useCallback((encryptedText, key) => {
    try {
      const decoded = atob(encryptedText);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return result;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }, []);

  const customSerialize = useCallback((value) => {
    const jsonString = JSON.stringify(value);
    return encrypt(jsonString, encryptionKey);
  }, [encrypt, encryptionKey]);

  const customDeserialize = useCallback((encryptedString) => {
    const decryptedString = decrypt(encryptedString, encryptionKey);
    return JSON.parse(decryptedString);
  }, [decrypt, encryptionKey]);

  return useLocalStorageSync(key, initialValue, {
    ...syncOptions,
    serialize: customSerialize,
    deserialize: customDeserialize
  });
}

/**
 * Hook for localStorage with TTL (Time To Live)
 * @param {string} key - localStorage key
 * @param {*} initialValue - Initial value
 * @param {Object} options - Hook options
 * @returns {Array} [value, setValue, removeValue, isExpired]
 */
function useLocalStorageSyncTTL(key, initialValue, options = {}) {
  const {
    ttl = 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    ...syncOptions
  } = options;

  const [isExpired, setIsExpired] = useState(false);

  const customSerialize = useCallback((value) => {
    const data = {
      value,
      timestamp: Date.now(),
      ttl
    };
    return JSON.stringify(data);
  }, [ttl]);

  const customDeserialize = useCallback((serializedData) => {
    try {
      const data = JSON.parse(serializedData);
      const now = Date.now();
      const isExpired = now - data.timestamp > data.ttl;
      
      setIsExpired(isExpired);
      
      if (isExpired) {
        // Remove expired data
        window.localStorage.removeItem(key);
        return initialValue;
      }
      
      return data.value;
    } catch (error) {
      return initialValue;
    }
  }, [key, initialValue]);

  const setValueWithTTL = useCallback((newValue) => {
    const data = {
      value: newValue,
      timestamp: Date.now(),
      ttl
    };
    
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
      setIsExpired(false);
      
      // Dispatch custom event
      const event = new CustomEvent('localStorageSync', {
        detail: { key, value: newValue, timestamp: Date.now() }
      });
      window.dispatchEvent(event);
    } catch (error) {
      if (syncOptions.onError) syncOptions.onError(error);
    }
  }, [key, ttl, syncOptions]);

  const [value, setValue, removeValue, isSynced] = useLocalStorageSync(key, initialValue, {
    ...syncOptions,
    serialize: customSerialize,
    deserialize: customDeserialize
  });

  return [value, setValueWithTTL, removeValue, isExpired, isSynced];
}

export {
  useLocalStorageSync,
  useLocalStorageSyncMultiple,
  useLocalStorageSyncEncrypted,
  useLocalStorageSyncTTL
};

export default useLocalStorageSync;
