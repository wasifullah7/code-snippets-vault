/**
 * Advanced cryptography utilities for client-side encryption and hashing
 * @param {Object} options - Configuration options
 * @param {string} options.algorithm - Default encryption algorithm (default: 'AES-GCM')
 * @param {number} options.keyLength - Key length in bits (default: 256)
 * @param {string} options.encoding - Default encoding (default: 'base64')
 * @param {boolean} options.useWebCrypto - Use Web Crypto API (default: true)
 * @returns {Object} Cryptography utilities
 */
class CryptoUtils {
    constructor(options = {}) {
      this.options = {
        algorithm: options.algorithm || 'AES-GCM',
        keyLength: options.keyLength || 256,
        encoding: options.encoding || 'base64',
        useWebCrypto: options.useWebCrypto !== false,
        ...options
      };
  
      this.checkWebCryptoSupport();
    }
  
    /**
     * Check Web Crypto API support
     */
    checkWebCryptoSupport() {
      if (this.options.useWebCrypto && !window.crypto) {
        console.warn('Web Crypto API not supported, falling back to basic methods');
        this.options.useWebCrypto = false;
      }
    }
  
    /**
     * Generate random bytes
     * @param {number} length - Number of bytes to generate
     * @returns {Uint8Array} Random bytes
     */
    generateRandomBytes(length = 32) {
      if (this.options.useWebCrypto && window.crypto) {
        return window.crypto.getRandomValues(new Uint8Array(length));
      } else {
        // Fallback for older browsers
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          bytes[i] = Math.floor(Math.random() * 256);
        }
        return bytes;
      }
    }
  
    /**
     * Generate random string
     * @param {number} length - Length of string
     * @param {string} charset - Character set
     * @returns {string} Random string
     */
    generateRandomString(length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
      const bytes = this.generateRandomBytes(length);
      let result = '';
      
      for (let i = 0; i < length; i++) {
        result += charset[bytes[i] % charset.length];
      }
      
      return result;
    }
  
    /**
     * Generate encryption key
     * @param {string} password - Password to derive key from
     * @param {Uint8Array} salt - Salt for key derivation
     * @returns {Promise<CryptoKey>} Encryption key
     */
    async generateKey(password, salt = null) {
      if (!this.options.useWebCrypto || !window.crypto) {
        throw new Error('Web Crypto API not supported');
      }
  
      const textEncoder = new TextEncoder();
      const passwordBuffer = textEncoder.encode(password);
      
      if (!salt) {
        salt = this.generateRandomBytes(16);
      }
  
      const keyMaterial = await window.crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
  
      return window.crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: this.options.algorithm, length: this.options.keyLength },
        true,
        ['encrypt', 'decrypt']
      );
    }
  
    /**
     * Encrypt data
     * @param {string} data - Data to encrypt
     * @param {string} password - Encryption password
     * @param {Object} options - Encryption options
     * @returns {Promise<Object>} Encrypted data
     */
    async encrypt(data, password, options = {}) {
      if (this.options.useWebCrypto && window.crypto) {
        return this.encryptWithWebCrypto(data, password, options);
      } else {
        return this.encryptBasic(data, password, options);
      }
    }
  
    /**
     * Encrypt using Web Crypto API
     * @param {string} data - Data to encrypt
     * @param {string} password - Encryption password
     * @param {Object} options - Encryption options
     * @returns {Promise<Object>} Encrypted data
     */
    async encryptWithWebCrypto(data, password, options = {}) {
      const textEncoder = new TextEncoder();
      const dataBuffer = textEncoder.encode(data);
      
      const salt = this.generateRandomBytes(16);
      const iv = this.generateRandomBytes(12);
      
      const key = await this.generateKey(password, salt);
      
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: this.options.algorithm,
          iv: iv
        },
        key,
        dataBuffer
      );
  
      return {
        encrypted: this.arrayBufferToBase64(encryptedBuffer),
        salt: this.arrayBufferToBase64(salt),
        iv: this.arrayBufferToBase64(iv),
        algorithm: this.options.algorithm
      };
    }
  
    /**
     * Basic encryption (fallback)
     * @param {string} data - Data to encrypt
     * @param {string} password - Encryption password
     * @param {Object} options - Encryption options
     * @returns {Object} Encrypted data
     */
    encryptBasic(data, password, options = {}) {
      // Simple XOR encryption for fallback
      const key = this.simpleHash(password);
      let encrypted = '';
      
      for (let i = 0; i < data.length; i++) {
        encrypted += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      
      return {
        encrypted: btoa(encrypted),
        salt: btoa(this.generateRandomString(16)),
        iv: btoa(this.generateRandomString(12)),
        algorithm: 'XOR'
      };
    }
  
    /**
     * Decrypt data
     * @param {Object} encryptedData - Encrypted data object
     * @param {string} password - Decryption password
     * @returns {Promise<string>} Decrypted data
     */
    async decrypt(encryptedData, password) {
      if (encryptedData.algorithm === 'XOR') {
        return this.decryptBasic(encryptedData, password);
      } else if (this.options.useWebCrypto && window.crypto) {
        return this.decryptWithWebCrypto(encryptedData, password);
      } else {
        throw new Error('Unsupported encryption algorithm');
      }
    }
  
    /**
     * Decrypt using Web Crypto API
     * @param {Object} encryptedData - Encrypted data object
     * @param {string} password - Decryption password
     * @returns {Promise<string>} Decrypted data
     */
    async decryptWithWebCrypto(encryptedData, password) {
      const { encrypted, salt, iv, algorithm } = encryptedData;
      
      const encryptedBuffer = this.base64ToArrayBuffer(encrypted);
      const saltBuffer = this.base64ToArrayBuffer(salt);
      const ivBuffer = this.base64ToArrayBuffer(iv);
      
      const key = await this.generateKey(password, saltBuffer);
      
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: algorithm,
          iv: ivBuffer
        },
        key,
        encryptedBuffer
      );
  
      const textDecoder = new TextDecoder();
      return textDecoder.decode(decryptedBuffer);
    }
  
    /**
     * Basic decryption (fallback)
     * @param {Object} encryptedData - Encrypted data object
     * @param {string} password - Decryption password
     * @returns {string} Decrypted data
     */
    decryptBasic(encryptedData, password) {
      const key = this.simpleHash(password);
      const encrypted = atob(encryptedData.encrypted);
      let decrypted = '';
      
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      
      return decrypted;
    }
  
    /**
     * Hash data using SHA-256
     * @param {string} data - Data to hash
     * @returns {Promise<string>} Hashed data
     */
    async hash(data) {
      if (this.options.useWebCrypto && window.crypto) {
        const textEncoder = new TextEncoder();
        const dataBuffer = textEncoder.encode(data);
        
        const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
        return this.arrayBufferToBase64(hashBuffer);
      } else {
        return this.simpleHash(data);
      }
    }
  
    /**
     * Simple hash function (fallback)
     * @param {string} data - Data to hash
     * @returns {string} Hashed data
     */
    simpleHash(data) {
      let hash = 0;
      if (data.length === 0) return hash.toString();
      
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return Math.abs(hash).toString(36);
    }
  
    /**
     * Generate HMAC
     * @param {string} data - Data to sign
     * @param {string} key - HMAC key
     * @returns {Promise<string>} HMAC signature
     */
    async generateHMAC(data, key) {
      if (!this.options.useWebCrypto || !window.crypto) {
        throw new Error('Web Crypto API not supported for HMAC');
      }
  
      const textEncoder = new TextEncoder();
      const dataBuffer = textEncoder.encode(data);
      const keyBuffer = textEncoder.encode(key);
  
      const cryptoKey = await window.crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
  
      const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
      return this.arrayBufferToBase64(signature);
    }
  
    /**
     * Verify HMAC
     * @param {string} data - Original data
     * @param {string} signature - HMAC signature
     * @param {string} key - HMAC key
     * @returns {Promise<boolean>} Verification result
     */
    async verifyHMAC(data, signature, key) {
      if (!this.options.useWebCrypto || !window.crypto) {
        throw new Error('Web Crypto API not supported for HMAC verification');
      }
  
      const expectedSignature = await this.generateHMAC(data, key);
      return signature === expectedSignature;
    }
  
    /**
     * Convert ArrayBuffer to Base64
     * @param {ArrayBuffer} buffer - ArrayBuffer to convert
     * @returns {string} Base64 string
     */
    arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      
      return btoa(binary);
    }
  
    /**
     * Convert Base64 to ArrayBuffer
     * @param {string} base64 - Base64 string to convert
     * @returns {ArrayBuffer} ArrayBuffer
     */
    base64ToArrayBuffer(base64) {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      return bytes.buffer;
    }
  
    /**
     * Generate secure token
     * @param {number} length - Token length
     * @returns {string} Secure token
     */
    generateSecureToken(length = 32) {
      return this.generateRandomString(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_');
    }
  }
  
  // Example usage:
  // const crypto = new CryptoUtils({
  //   algorithm: 'AES-GCM',
  //   keyLength: 256,
  //   useWebCrypto: true
  // });
  // 
  // // Encrypt data
  // const encrypted = await crypto.encrypt('sensitive data', 'my-password');
  // console.log('Encrypted:', encrypted);
  // 
  // // Decrypt data
  // const decrypted = await crypto.decrypt(encrypted, 'my-password');
  // console.log('Decrypted:', decrypted);
  // 
  // // Hash data
  // const hash = await crypto.hash('data to hash');
  // console.log('Hash:', hash);
  // 
  // // Generate HMAC
  // const hmac = await crypto.generateHMAC('data', 'secret-key');
  // console.log('HMAC:', hmac);
  // 
  // // Generate secure token
  // const token = crypto.generateSecureToken(64);
  // console.log('Token:', token);
  
  module.exports = CryptoUtils;