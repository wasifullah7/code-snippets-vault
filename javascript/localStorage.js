/**
 * Advanced localStorage utilities with encryption, expiration, and error handling
 * @param {Object} options - Configuration options
 * @param {boolean} options.encrypt - Enable encryption (default: false)
 * @param {string} options.encryptionKey - Encryption key for AES
 * @param {boolean} options.compress - Enable compression (default: false)
 * @param {number} options.maxSize - Maximum storage size in MB (default: 10)
 * @param {boolean} options.autoCleanup - Auto cleanup expired items (default: true)
 */
class LocalStorage {
    constructor(options = {}) {
      this.options = {
        encrypt: options.encrypt || false,
        encryptionKey: options.encryptionKey || 'default-key',
        compress: options.compress || false,
        maxSize: options.maxSize || 10,
        autoCleanup: options.autoCleanup !== false,
        ...options
      };
  
      this.storageKey = 'localStorage_metadata';
      this.init();
    }
  
    /**
     * Initialize storage and cleanup expired items
     */
    init() {
      if (this.options.autoCleanup) {
        this.cleanupExpired();
      }
    }
  
    /**
     * Set item in localStorage with optional expiration
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {Object} options - Storage options
     * @param {number} options.expires - Expiration time in milliseconds
     * @param {boolean} options.encrypt - Override global encryption setting
     * @returns {boolean} Success status
     */
    set(key, value, options = {}) {
      try {
        if (!this.isStorageAvailable()) {
          throw new Error('localStorage is not available');
        }
  
        const storageItem = {
          value,
          timestamp: Date.now(),
          expires: options.expires ? Date.now() + options.expires : null,
          encrypted: options.encrypt !== undefined ? options.encrypt : this.options.encrypt
        };
  
        let serializedValue = JSON.stringify(storageItem);
        
        // Compress if enabled
        if (this.options.compress) {
          serializedValue = this.compress(serializedValue);
        }
  
        // Encrypt if enabled
        if (storageItem.encrypted) {
          serializedValue = this.encrypt(serializedValue);
        }
  
        // Check storage size
        if (!this.checkStorageSize(key, serializedValue)) {
          throw new Error('Storage quota exceeded');
        }
  
        localStorage.setItem(key, serializedValue);
        this.updateMetadata(key, storageItem);
        
        return true;
      } catch (error) {
        console.error('localStorage set error:', error);
        return false;
      }
    }
  
    /**
     * Get item from localStorage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Stored value or default
     */
    get(key, defaultValue = null) {
      try {
        if (!this.isStorageAvailable()) {
          return defaultValue;
        }
  
        const serializedValue = localStorage.getItem(key);
        if (serializedValue === null) {
          return defaultValue;
        }
  
        let decryptedValue = serializedValue;
  
        // Decrypt if encrypted
        if (this.isEncrypted(serializedValue)) {
          decryptedValue = this.decrypt(serializedValue);
        }
  
        // Decompress if compressed
        if (this.options.compress && this.isCompressed(decryptedValue)) {
          decryptedValue = this.decompress(decryptedValue);
        }
  
        const storageItem = JSON.parse(decryptedValue);
  
        // Check expiration
        if (storageItem.expires && Date.now() > storageItem.expires) {
          this.remove(key);
          return defaultValue;
        }
  
        return storageItem.value;
      } catch (error) {
        console.error('localStorage get error:', error);
        return defaultValue;
      }
    }
  
    /**
     * Remove item from localStorage
     * @param {string} key - Storage key
     * @returns {boolean} Success status
     */
    remove(key) {
      try {
        if (!this.isStorageAvailable()) {
          return false;
        }
  
        localStorage.removeItem(key);
        this.removeMetadata(key);
        return true;
      } catch (error) {
        console.error('localStorage remove error:', error);
        return false;
      }
    }
  
    /**
     * Clear all localStorage items
     * @param {boolean} includeMetadata - Include metadata cleanup (default: true)
     * @returns {boolean} Success status
     */
    clear(includeMetadata = true) {
      try {
        if (!this.isStorageAvailable()) {
          return false;
        }
  
        localStorage.clear();
        
        if (includeMetadata) {
          this.clearMetadata();
        }
        
        return true;
      } catch (error) {
        console.error('localStorage clear error:', error);
        return false;
      }
    }
  
    /**
     * Get all keys in localStorage
     * @returns {Array} Array of keys
     */
    keys() {
      try {
        if (!this.isStorageAvailable()) {
          return [];
        }
  
        return Object.keys(localStorage).filter(key => key !== this.storageKey);
      } catch (error) {
        console.error('localStorage keys error:', error);
        return [];
      }
    }
  
    /**
     * Get storage size in bytes
     * @returns {number} Total size in bytes
     */
    getSize() {
      try {
        if (!this.isStorageAvailable()) {
          return 0;
        }
  
        let totalSize = 0;
        for (const key of this.keys()) {
          const value = localStorage.getItem(key);
          totalSize += new Blob([key, value]).size;
        }
        
        return totalSize;
      } catch (error) {
        console.error('localStorage size calculation error:', error);
        return 0;
      }
    }
  
    /**
     * Check if storage is available
     * @returns {boolean} Storage availability
     */
    isStorageAvailable() {
      try {
        const test = '__localStorage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch (error) {
        return false;
      }
    }
  
    /**
     * Cleanup expired items
     * @returns {number} Number of items removed
     */
    cleanupExpired() {
      let removedCount = 0;
      
      for (const key of this.keys()) {
        const value = this.get(key);
        if (value === null) {
          this.remove(key);
          removedCount++;
        }
      }
      
      return removedCount;
    }
  
    /**
     * Simple encryption (AES-like)
     * @param {string} text - Text to encrypt
     * @returns {string} Encrypted text
     */
    encrypt(text) {
      // Simple XOR encryption for demo purposes
      // In production, use a proper encryption library like crypto-js
      let result = '';
      for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ this.options.encryptionKey.charCodeAt(i % this.options.encryptionKey.length));
      }
      return btoa(result);
    }
  
    /**
     * Simple decryption
     * @param {string} encryptedText - Text to decrypt
     * @returns {string} Decrypted text
     */
    decrypt(encryptedText) {
      const decoded = atob(encryptedText);
      let result = '';
      for (let i = 0; i < decoded.length; i++) {
        result += String.fromCharCode(decoded.charCodeAt(i) ^ this.options.encryptionKey.charCodeAt(i % this.options.encryptionKey.length));
      }
      return result;
    }
  
    /**
     * Simple compression (base64)
     * @param {string} text - Text to compress
     * @returns {string} Compressed text
     */
    compress(text) {
      return btoa(text);
    }
  
    /**
     * Simple decompression
     * @param {string} compressedText - Text to decompress
     * @returns {string} Decompressed text
     */
    decompress(compressedText) {
      return atob(compressedText);
    }
  
    /**
     * Check if text is encrypted
     * @param {string} text - Text to check
     * @returns {boolean} Is encrypted
     */
    isEncrypted(text) {
      try {
        atob(text);
        return true;
      } catch {
        return false;
      }
    }
  
    /**
     * Check if text is compressed
     * @param {string} text - Text to check
     * @returns {boolean} Is compressed
     */
    isCompressed(text) {
      try {
        JSON.parse(atob(text));
        return true;
      } catch {
        return false;
      }
    }
  
    /**
     * Check storage size before adding item
     * @param {string} key - Storage key
     * @param {string} value - Value to store
     * @returns {boolean} Can store
     */
    checkStorageSize(key, value) {
      const currentSize = this.getSize();
      const newItemSize = new Blob([key, value]).size;
      const maxSizeBytes = this.options.maxSize * 1024 * 1024;
      
      return (currentSize + newItemSize) <= maxSizeBytes;
    }
  
    /**
     * Update metadata
     * @param {string} key - Storage key
     * @param {Object} item - Storage item
     */
    updateMetadata(key, item) {
      const metadata = this.getMetadata();
      metadata[key] = {
        timestamp: item.timestamp,
        expires: item.expires,
        encrypted: item.encrypted
      };
      this.setMetadata(metadata);
    }
  
    /**
     * Remove metadata
     * @param {string} key - Storage key
     */
    removeMetadata(key) {
      const metadata = this.getMetadata();
      delete metadata[key];
      this.setMetadata(metadata);
    }
  
    /**
     * Get metadata
     * @returns {Object} Metadata object
     */
    getMetadata() {
      try {
        const metadata = localStorage.getItem(this.storageKey);
        return metadata ? JSON.parse(metadata) : {};
      } catch {
        return {};
      }
    }
  
    /**
     * Set metadata
     * @param {Object} metadata - Metadata object
     */
    setMetadata(metadata) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(metadata));
      } catch (error) {
        console.error('Metadata update error:', error);
      }
    }
  
    /**
     * Clear metadata
     */
    clearMetadata() {
      try {
        localStorage.removeItem(this.storageKey);
      } catch (error) {
        console.error('Metadata clear error:', error);
      }
    }
  }
  
  // Example usage:
  // const storage = new LocalStorage({
  //   encrypt: true,
  //   encryptionKey: 'my-secret-key',
  //   compress: true,
  //   maxSize: 5,
  //   autoCleanup: true
  // });
  // 
  // // Set item with expiration
  // storage.set('user', { id: 1, name: 'John' }, { expires: 3600000 }); // 1 hour
  // 
  // // Get item
  // const user = storage.get('user', {});
  // 
  // // Set encrypted item
  // storage.set('secret', 'sensitive-data', { encrypt: true });
  // 
  // // Get all keys
  // const keys = storage.keys();
  // 
  // // Get storage size
  // const size = storage.getSize();
  // 
  // // Cleanup expired items
  // const removed = storage.cleanupExpired();
  
  module.exports = LocalStorage;