/**
 * Advanced storage utilities for modern JavaScript
 * Comprehensive storage management with localStorage, sessionStorage, and IndexedDB
 */

/**
 * LocalStorage wrapper with advanced features
 */
class LocalStorageManager {
  constructor(prefix = 'app_') {
    this.prefix = prefix;
    this.storage = window.localStorage;
  }

  /**
   * Set item with prefix
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {Object} options - Storage options
   * @param {number} options.ttl - Time to live in milliseconds
   * @param {boolean} options.encrypt - Whether to encrypt value
   * @returns {boolean} Success status
   */
  set(key, value, options = {}) {
    try {
      const fullKey = this.prefix + key;
      let dataToStore = value;

      if (options.encrypt) {
        dataToStore = this.encrypt(JSON.stringify(value));
      } else if (typeof value === 'object') {
        dataToStore = JSON.stringify(value);
      }

      const storageData = {
        value: dataToStore,
        timestamp: Date.now(),
        ttl: options.ttl || null,
        encrypted: options.encrypt || false
      };

      this.storage.setItem(fullKey, JSON.stringify(storageData));
      return true;
    } catch (error) {
      console.error('LocalStorage set error:', error);
      return false;
    }
  }

  /**
   * Get item with prefix
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} Stored value or default
   */
  get(key, defaultValue = null) {
    try {
      const fullKey = this.prefix + key;
      const item = this.storage.getItem(fullKey);

      if (!item) return defaultValue;

      const storageData = JSON.parse(item);

      // Check TTL
      if (storageData.ttl && Date.now() > storageData.timestamp + storageData.ttl) {
        this.remove(key);
        return defaultValue;
      }

      let value = storageData.value;

      if (storageData.encrypted) {
        value = JSON.parse(this.decrypt(value));
      } else if (typeof value === 'string') {
        try {
          value = JSON.parse(value);
        } catch {
          // Value is a plain string
        }
      }

      return value;
    } catch (error) {
      console.error('LocalStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  remove(key) {
    try {
      const fullKey = this.prefix + key;
      this.storage.removeItem(fullKey);
      return true;
    } catch (error) {
      console.error('LocalStorage remove error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    const fullKey = this.prefix + key;
    return this.storage.getItem(fullKey) !== null;
  }

  /**
   * Get all keys with prefix
   * @returns {Array} Array of keys
   */
  keys() {
    const keys = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys;
  }

  /**
   * Clear all items with prefix
   * @returns {boolean} Success status
   */
  clear() {
    try {
      const keys = this.keys();
      keys.forEach(key => this.remove(key));
      return true;
    } catch (error) {
      console.error('LocalStorage clear error:', error);
      return false;
    }
  }

  /**
   * Get storage size
   * @returns {number} Storage size in bytes
   */
  size() {
    let size = 0;
    const keys = this.keys();
    keys.forEach(key => {
      const fullKey = this.prefix + key;
      size += this.storage.getItem(fullKey).length;
    });
    return size;
  }

  /**
   * Simple encryption (for demo purposes - use proper encryption in production)
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  encrypt(text) {
    return btoa(encodeURIComponent(text));
  }

  /**
   * Simple decryption (for demo purposes - use proper decryption in production)
   * @param {string} text - Text to decrypt
   * @returns {string} Decrypted text
   */
  decrypt(text) {
    return decodeURIComponent(atob(text));
  }
}

/**
 * SessionStorage wrapper with advanced features
 */
class SessionStorageManager extends LocalStorageManager {
  constructor(prefix = 'session_') {
    super(prefix);
    this.storage = window.sessionStorage;
  }
}

/**
 * IndexedDB wrapper for complex data storage
 */
class IndexedDBManager {
  constructor(dbName = 'AppDatabase', version = 1) {
    this.dbName = dbName;
    this.version = version;
    this.db = null;
  }

  /**
   * Initialize database
   * @param {Array} stores - Array of store configurations
   * @returns {Promise<boolean>} Success status
   */
  async init(stores = []) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        stores.forEach(store => {
          if (!db.objectStoreNames.contains(store.name)) {
            const objectStore = db.createObjectStore(store.name, {
              keyPath: store.keyPath || 'id',
              autoIncrement: store.autoIncrement || false
            });

            if (store.indexes) {
              store.indexes.forEach(index => {
                objectStore.createIndex(index.name, index.keyPath, {
                  unique: index.unique || false
                });
              });
            }
          }
        });
      };
    });
  }

  /**
   * Add item to store
   * @param {string} storeName - Store name
   * @param {*} data - Data to store
   * @returns {Promise<boolean>} Success status
   */
  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get item from store
   * @param {string} storeName - Store name
   * @param {*} key - Item key
   * @returns {Promise<*>} Stored data
   */
  async get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update item in store
   * @param {string} storeName - Store name
   * @param {*} data - Data to update
   * @returns {Promise<boolean>} Success status
   */
  async update(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete item from store
   * @param {string} storeName - Store name
   * @param {*} key - Item key
   * @returns {Promise<boolean>} Success status
   */
  async delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all items from store
   * @param {string} storeName - Store name
   * @returns {Promise<Array>} All items
   */
  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear store
   * @param {string} storeName - Store name
   * @returns {Promise<boolean>} Success status
   */
  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * Cookie management utilities
 */
class CookieManager {
  /**
   * Set cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   * @param {number} options.days - Days until expiration
   * @param {string} options.path - Cookie path
   * @param {string} options.domain - Cookie domain
   * @param {boolean} options.secure - Secure flag
   * @param {boolean} options.sameSite - SameSite attribute
   */
  static set(name, value, options = {}) {
    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

    if (options.days) {
      const date = new Date();
      date.setTime(date.getTime() + (options.days * 24 * 60 * 60 * 1000));
      cookie += `; expires=${date.toUTCString()}`;
    }

    if (options.path) cookie += `; path=${options.path}`;
    if (options.domain) cookie += `; domain=${options.domain}`;
    if (options.secure) cookie += '; secure';
    if (options.sameSite) cookie += `; samesite=${options.sameSite}`;

    document.cookie = cookie;
  }

  /**
   * Get cookie
   * @param {string} name - Cookie name
   * @returns {string|null} Cookie value
   */
  static get(name) {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }

    return null;
  }

  /**
   * Delete cookie
   * @param {string} name - Cookie name
   * @param {Object} options - Cookie options
   */
  static delete(name, options = {}) {
    this.set(name, '', { ...options, days: -1 });
  }

  /**
   * Get all cookies
   * @returns {Object} All cookies
   */
  static getAll() {
    const cookies = {};
    const cookieList = document.cookie.split(';');

    cookieList.forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    });

    return cookies;
  }
}

/**
 * Storage quota management
 */
class StorageQuotaManager {
  /**
   * Get storage quota information
   * @returns {Promise<Object>} Quota information
   */
  static async getQuotaInfo() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage,
        quota: estimate.quota,
        percentage: (estimate.usage / estimate.quota) * 100
      };
    }
    return null;
  }

  /**
   * Request persistent storage
   * @returns {Promise<boolean>} Success status
   */
  static async requestPersistentStorage() {
    if ('storage' in navigator && 'persist' in navigator.storage) {
      return await navigator.storage.persist();
    }
    return false;
  }

  /**
   * Check if storage is persistent
   * @returns {Promise<boolean>} Whether storage is persistent
   */
  static async isPersistent() {
    if ('storage' in navigator && 'persisted' in navigator.storage) {
      return await navigator.storage.persisted();
    }
    return false;
  }
}

// Example usage:
// const localStorage = new LocalStorageManager('myapp_');
// localStorage.set('user', { id: 1, name: 'John' }, { ttl: 3600000 }); // 1 hour
// const user = localStorage.get('user');
// 
// const sessionStorage = new SessionStorageManager('session_');
// sessionStorage.set('temp', 'data');
// 
// const db = new IndexedDBManager('MyApp', 1);
// await db.init([
//   { name: 'users', keyPath: 'id', indexes: [{ name: 'email', keyPath: 'email', unique: true }] }
// ]);
// await db.add('users', { id: 1, name: 'John', email: 'john@example.com' });
// 
// CookieManager.set('session', 'abc123', { days: 7, secure: true });
// const session = CookieManager.get('session');
// 
// const quota = await StorageQuotaManager.getQuotaInfo();
// console.log('Storage usage:', quota.percentage + '%');

module.exports = {
  LocalStorageManager,
  SessionStorageManager,
  IndexedDBManager,
  CookieManager,
  StorageQuotaManager
};
