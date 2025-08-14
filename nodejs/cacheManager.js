/**
 * Advanced caching manager for Node.js applications
 * @param {Object} options - Configuration options
 * @param {string} options.strategy - Caching strategy (default: 'lru')
 * @param {number} options.maxSize - Maximum cache size (default: 1000)
 * @param {number} options.ttl - Time to live in milliseconds (default: 300000 - 5 minutes)
 * @param {Object} options.store - Storage implementation (default: MemoryStore)
 * @param {boolean} options.enableStats - Enable cache statistics (default: true)
 * @param {Function} options.serializer - Custom serializer function
 * @param {Function} options.deserializer - Custom deserializer function
 * @returns {CacheManager} Cache manager instance
 */
const crypto = require('crypto');

class CacheManager {
  constructor(options = {}) {
    this.options = {
      strategy: options.strategy || 'lru',
      maxSize: options.maxSize || 1000,
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutes
      store: options.store || new MemoryStore(),
      enableStats: options.enableStats !== false,
      serializer: options.serializer || JSON.stringify,
      deserializer: options.deserializer || JSON.parse,
      ...options
    };

    this.store = this.options.store;
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      clears: 0
    };
  }

  /**
   * Generate cache key
   * @param {string} key - Cache key
   * @returns {string} Generated key
   */
  generateKey(key) {
    if (typeof key === 'string') {
      return crypto.createHash('md5').update(key).digest('hex');
    }
    return crypto.createHash('md5').update(JSON.stringify(key)).digest('hex');
  }

  /**
   * Set cache value
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {Object} options - Cache options
   * @param {number} options.ttl - Time to live in milliseconds
   * @param {boolean} options.serialize - Whether to serialize value
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, options = {}) {
    try {
      const cacheKey = this.generateKey(key);
      const ttl = options.ttl || this.options.ttl;
      const serialize = options.serialize !== false;
      
      const cacheValue = {
        value: serialize ? this.options.serializer(value) : value,
        timestamp: Date.now(),
        ttl: ttl,
        expires: Date.now() + ttl
      };

      const success = await this.store.set(cacheKey, cacheValue, ttl);
      
      if (success && this.options.enableStats) {
        this.stats.sets++;
      }
      
      return success;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Get cache value
   * @param {string} key - Cache key
   * @param {Object} options - Cache options
   * @param {boolean} options.deserialize - Whether to deserialize value
   * @returns {Promise<*>} Cached value or null
   */
  async get(key, options = {}) {
    try {
      const cacheKey = this.generateKey(key);
      const deserialize = options.deserialize !== false;
      
      const cached = await this.store.get(cacheKey);
      
      if (!cached) {
        if (this.options.enableStats) {
          this.stats.misses++;
        }
        return null;
      }

      // Check if expired
      if (cached.expires && Date.now() > cached.expires) {
        await this.delete(key);
        if (this.options.enableStats) {
          this.stats.misses++;
        }
        return null;
      }

      if (this.options.enableStats) {
        this.stats.hits++;
      }

      return deserialize ? this.options.deserializer(cached.value) : cached.value;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Delete cache value
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async delete(key) {
    try {
      const cacheKey = this.generateKey(key);
      const success = await this.store.delete(cacheKey);
      
      if (success && this.options.enableStats) {
        this.stats.deletes++;
      }
      
      return success;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Check if key exists
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Whether key exists
   */
  async has(key) {
    try {
      const cacheKey = this.generateKey(key);
      const cached = await this.store.get(cacheKey);
      
      if (!cached) return false;
      
      // Check if expired
      if (cached.expires && Date.now() > cached.expires) {
        await this.delete(key);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Cache has error:', error);
      return false;
    }
  }

  /**
   * Get cache value with fallback
   * @param {string} key - Cache key
   * @param {Function} fallback - Fallback function
   * @param {Object} options - Cache options
   * @returns {Promise<*>} Cached or fallback value
   */
  async getOrSet(key, fallback, options = {}) {
    let value = await this.get(key, options);
    
    if (value === null) {
      value = await fallback();
      await this.set(key, value, options);
    }
    
    return value;
  }

  /**
   * Clear all cache
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      const success = await this.store.clear();
      
      if (success && this.options.enableStats) {
        this.stats.clears++;
      }
      
      return success;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache statistics
   */
  getStats() {
    if (!this.options.enableStats) {
      return { enabled: false };
    }

    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      total,
      enabled: true
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    if (this.options.enableStats) {
      this.stats = {
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        clears: 0
      };
    }
  }

  /**
   * Get cache size
   * @returns {Promise<number>} Cache size
   */
  async size() {
    return await this.store.size();
  }

  /**
   * Get cache keys
   * @returns {Promise<Array>} Cache keys
   */
  async keys() {
    return await this.store.keys();
  }

  /**
   * Clean expired entries
   * @returns {Promise<number>} Number of cleaned entries
   */
  async clean() {
    try {
      const keys = await this.store.keys();
      let cleaned = 0;

      for (const key of keys) {
        const cached = await this.store.get(key);
        if (cached && cached.expires && Date.now() > cached.expires) {
          await this.store.delete(key);
          cleaned++;
        }
      }

      return cleaned;
    } catch (error) {
      console.error('Cache clean error:', error);
      return 0;
    }
  }
}

/**
 * In-memory storage implementation
 */
class MemoryStore {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    
    if (item.expires && Date.now() > item.expires) {
      this.store.delete(key);
      return null;
    }
    
    return item;
  }

  async set(key, value, ttl) {
    this.store.set(key, {
      ...value,
      expires: Date.now() + ttl
    });
    return true;
  }

  async delete(key) {
    return this.store.delete(key);
  }

  async clear() {
    this.store.clear();
    return true;
  }

  async size() {
    return this.store.size;
  }

  async keys() {
    return Array.from(this.store.keys());
  }
}

/**
 * Redis storage implementation
 */
class RedisStore {
  constructor(redisClient) {
    this.redis = redisClient;
  }

  async get(key) {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key, value, ttl) {
    await this.redis.setex(key, Math.ceil(ttl / 1000), JSON.stringify(value));
    return true;
  }

  async delete(key) {
    const result = await this.redis.del(key);
    return result > 0;
  }

  async clear() {
    await this.redis.flushdb();
    return true;
  }

  async size() {
    return await this.redis.dbsize();
  }

  async keys() {
    return await this.redis.keys('*');
  }
}

/**
 * File system storage implementation
 */
class FileStore {
  constructor(directory = './cache') {
    this.directory = directory;
    this.fs = require('fs').promises;
    this.path = require('path');
  }

  async get(key) {
    try {
      const filePath = this.path.join(this.directory, `${key}.json`);
      const data = await this.fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return null;
    }
  }

  async set(key, value, ttl) {
    try {
      const filePath = this.path.join(this.directory, `${key}.json`);
      await this.fs.mkdir(this.directory, { recursive: true });
      await this.fs.writeFile(filePath, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('File store set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      const filePath = this.path.join(this.directory, `${key}.json`);
      await this.fs.unlink(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  async clear() {
    try {
      const files = await this.fs.readdir(this.directory);
      for (const file of files) {
        if (file.endsWith('.json')) {
          await this.fs.unlink(this.path.join(this.directory, file));
        }
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async size() {
    try {
      const files = await this.fs.readdir(this.directory);
      return files.filter(file => file.endsWith('.json')).length;
    } catch (error) {
      return 0;
    }
  }

  async keys() {
    try {
      const files = await this.fs.readdir(this.directory);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => file.replace('.json', ''));
    } catch (error) {
      return [];
    }
  }
}

// Example usage:
// const cache = new CacheManager({
//   strategy: 'lru',
//   maxSize: 1000,
//   ttl: 5 * 60 * 1000, // 5 minutes
//   enableStats: true
// });
// 
// // Set cache value
// await cache.set('user:123', { id: 123, name: 'John' });
// 
// // Get cache value
// const user = await cache.get('user:123');
// 
// // Get or set with fallback
// const data = await cache.getOrSet('api:data', async () => {
//   return await fetchDataFromAPI();
// });
// 
// // Check if exists
// const exists = await cache.has('user:123');
// 
// // Delete cache
// await cache.delete('user:123');
// 
// // Get statistics
// const stats = cache.getStats();
// console.log('Hit rate:', stats.hitRate + '%');

module.exports = {
  CacheManager,
  MemoryStore,
  RedisStore,
  FileStore
};
