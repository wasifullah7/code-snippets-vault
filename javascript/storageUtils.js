/**
 * Storage utilities
 */
const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('LocalStorage set error:', e);
    return false;
  }
};

const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('LocalStorage get error:', e);
    return defaultValue;
  }
};

const setSessionStorage = (key, value) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e) {
    console.error('SessionStorage set error:', e);
    return false;
  }
};

const getSessionStorage = (key, defaultValue = null) => {
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    console.error('SessionStorage get error:', e);
    return defaultValue;
  }
};

const removeStorageItem = (key, type = 'local') => {
  if (type === 'local') {
    localStorage.removeItem(key);
  } else {
    sessionStorage.removeItem(key);
  }
};

const clearStorage = (type = 'both') => {
  if (type === 'local' || type === 'both') {
    localStorage.clear();
  }
  if (type === 'session' || type === 'both') {
    sessionStorage.clear();
  }
};

module.exports = {
  setLocalStorage, getLocalStorage, setSessionStorage, 
  getSessionStorage, removeStorageItem, clearStorage
};