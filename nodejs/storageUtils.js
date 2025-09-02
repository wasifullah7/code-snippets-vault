/**
 * Storage utilities for Node.js
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * File storage utility class
 */
class FileStorage {
  constructor(baseDir = './storage') {
    this.baseDir = baseDir;
    this.init();
  }

  /**
   * Initialize storage directory
   */
  async init() {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create storage directory:', error);
    }
  }

  /**
   * Store data in file
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   * @param {Object} options - Storage options
   * @returns {Promise<boolean>} Success status
   */
  async set(key, data, options = {}) {
    try {
      const { ttl, encrypt = false } = options;
      const filePath = path.join(this.baseDir, `${key}.json`);
      
      let dataToStore = data;
      
      if (encrypt) {
        dataToStore = this.encrypt(JSON.stringify(data));
      }

      const storageData = {
        data: dataToStore,
        timestamp: Date.now(),
        ttl: ttl || null,
        encrypted: encrypt
      };

      await fs.writeFile(filePath, JSON.stringify(storageData, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to store data:', error);
      return false;
    }
  }

  /**
   * Get data from file
   * @param {string} key - Storage key
   * @returns {Promise<*>} Stored data or null
   */
  async get(key) {
    try {
      const filePath = path.join(this.baseDir, `${key}.json`);
      const fileContent = await fs.readFile(filePath, 'utf8');
      const storageData = JSON.parse(fileContent);

      // Check TTL
      if (storageData.ttl && Date.now() > storageData.timestamp + storageData.ttl) {
        await this.delete(key);
        return null;
      }

      let data = storageData.data;
      
      if (storageData.encrypted) {
        data = JSON.parse(this.decrypt(data));
      }

      return data;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return null; // File doesn't exist
      }
      console.error('Failed to get data:', error);
      return null;
    }
  }

  /**
   * Delete file
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      const filePath = path.join(this.baseDir, `${key}.json`);
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return true; // File already doesn't exist
      }
      console.error('Failed to delete data:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Whether key exists
   */
  async has(key) {
    try {
      const filePath = path.join(this.baseDir, `${key}.json`);
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get all keys
   * @returns {Promise<Array>} Array of keys
   */
  async keys() {
    try {
      const files = await fs.readdir(this.baseDir);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      console.error('Failed to get keys:', error);
      return [];
    }
  }

  /**
   * Clear all files
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      const files = await fs.readdir(this.baseDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      
      for (const file of jsonFiles) {
        await fs.unlink(path.join(this.baseDir, file));
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  }

  /**
   * Get storage size
   * @returns {Promise<number>} Storage size in bytes
   */
  async size() {
    try {
      const files = await fs.readdir(this.baseDir);
      let totalSize = 0;
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.baseDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Failed to get storage size:', error);
      return 0;
    }
  }

  /**
   * Simple encryption (for demo purposes - use proper encryption in production)
   * @param {string} text - Text to encrypt
   * @returns {string} Encrypted text
   */
  encrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  }

  /**
   * Simple decryption (for demo purposes - use proper decryption in production)
   * @param {string} text - Text to decrypt
   * @returns {string} Decrypted text
   */
  decrypt(text) {
    const algorithm = 'aes-256-cbc';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = textParts.join(':');
    
    const decipher = crypto.createDecipher(algorithm, key);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}

/**
 * Memory storage utility class
 */
class MemoryStorage {
  constructor() {
    this.storage = new Map();
  }

  /**
   * Set data in memory
   * @param {string} key - Storage key
   * @param {*} data - Data to store
   * @param {Object} options - Storage options
   * @returns {boolean} Success status
   */
  set(key, data, options = {}) {
    try {
      const { ttl } = options;
      
      const storageData = {
        data,
        timestamp: Date.now(),
        ttl: ttl || null
      };

      this.storage.set(key, storageData);
      return true;
    } catch (error) {
      console.error('Failed to store data in memory:', error);
      return false;
    }
  }

  /**
   * Get data from memory
   * @param {string} key - Storage key
   * @returns {*} Stored data or null
   */
  get(key) {
    try {
      const storageData = this.storage.get(key);
      
      if (!storageData) return null;

      // Check TTL
      if (storageData.ttl && Date.now() > storageData.timestamp + storageData.ttl) {
        this.delete(key);
        return null;
      }

      return storageData.data;
    } catch (error) {
      console.error('Failed to get data from memory:', error);
      return null;
    }
  }

  /**
   * Delete data from memory
   * @param {string} key - Storage key
   * @returns {boolean} Success status
   */
  delete(key) {
    return this.storage.delete(key);
  }

  /**
   * Check if key exists
   * @param {string} key - Storage key
   * @returns {boolean} Whether key exists
   */
  has(key) {
    return this.storage.has(key);
  }

  /**
   * Get all keys
   * @returns {Array} Array of keys
   */
  keys() {
    return Array.from(this.storage.keys());
  }

  /**
   * Clear all data
   */
  clear() {
    this.storage.clear();
  }

  /**
   * Get storage size
   * @returns {number} Number of stored items
   */
  size() {
    return this.storage.size;
  }
}

/**
 * Cache utility with TTL support
 */
class Cache {
  constructor() {
    this.cache = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  /**
   * Set cache item
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds
   */
  set(key, value, ttl = 300000) { // Default 5 minutes
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Get cache item
   * @param {string} key - Cache key
   * @returns {*} Cached value or null
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;

    if (Date.now() > item.timestamp + item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * Delete cache item
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Cleanup expired items
   */
  cleanup() {
    const now = Date.now();
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.timestamp + item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Destroy cache and cleanup interval
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.cache.clear();
  }
}

module.exports = {
  FileStorage,
  MemoryStorage,
  Cache
};
