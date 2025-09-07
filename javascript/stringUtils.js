/**
 * Advanced string manipulation utilities for modern JavaScript
 * Collection of commonly needed string operations with performance optimizations
 */

/**
 * Check if string is empty or whitespace
 * @param {string} str - String to check
 * @returns {boolean} True if string is empty or whitespace
 */
function isEmpty(str) {
  return !str || str.trim().length === 0;
}

/**
 * Check if string is palindrome
 * @param {string} str - String to check
 * @returns {boolean} True if string is palindrome
 */
function isPalindrome(str) {
  if (!str) return false;
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, '');
  return cleaned === cleaned.split('').reverse().join('');
}

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @param {Array} exceptions - Words to keep lowercase
 * @returns {string} Title cased string
 */
function toTitleCase(str, exceptions = ['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'up', 'yet']) {
    if (!str) return '';
    
    return str.toLowerCase().split(' ').map((word, index) => {
      if (index === 0 || !exceptions.includes(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word;
    }).join(' ');
  }
  
  /**
   * Generate slug from string
   * @param {string} str - String to slugify
   * @param {string} separator - Separator character (default: '-')
   * @returns {string} Slugified string
   */
  function slugify(str, separator = '-') {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, separator)
      .replace(/^-+|-+$/g, '');
  }
  
  /**
   * Truncate string with ellipsis
   * @param {string} str - String to truncate
   * @param {number} length - Maximum length
   * @param {string} suffix - Suffix to add (default: '...')
   * @param {boolean} preserveWords - Preserve word boundaries (default: true)
   * @returns {string} Truncated string
   */
  function truncate(str, length, suffix = '...', preserveWords = true) {
    if (!str || str.length <= length) return str;
    
    if (preserveWords) {
      const truncated = str.substring(0, length);
      const lastSpace = truncated.lastIndexOf(' ');
      return lastSpace > 0 ? truncated.substring(0, lastSpace) + suffix : truncated + suffix;
    }
    
    return str.substring(0, length) + suffix;
  }
  
  /**
   * Generate random string
   * @param {number} length - Length of string
   * @param {string} charset - Character set to use
   * @returns {string} Random string
   */
  function randomString(length = 8, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }
  
  /**
   * Check if string is palindrome
   * @param {string} str - String to check
   * @param {boolean} caseSensitive - Case sensitive check (default: false)
   * @returns {boolean} True if palindrome
   */
  function isPalindrome(str, caseSensitive = false) {
    if (!str) return true;
    
    const cleanStr = str.replace(/[^a-zA-Z0-9]/g, '');
    const processedStr = caseSensitive ? cleanStr : cleanStr.toLowerCase();
    
    return processedStr === processedStr.split('').reverse().join('');
  }
  
  /**
   * Count word frequency in string
   * @param {string} str - String to analyze
   * @param {boolean} caseSensitive - Case sensitive counting (default: false)
   * @returns {Object} Word frequency object
   */
  function wordFrequency(str, caseSensitive = false) {
    if (!str) return {};
    
    const words = str
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 0);
    
    const processedWords = caseSensitive ? words : words.map(word => word.toLowerCase());
    
    return processedWords.reduce((freq, word) => {
      freq[word] = (freq[word] || 0) + 1;
      return freq;
    }, {});
  }
  
  /**
   * Extract numbers from string
   * @param {string} str - String to extract numbers from
   * @param {boolean} asArray - Return as array (default: false)
   * @returns {Array|string} Extracted numbers
   */
  function extractNumbers(str, asArray = false) {
    if (!str) return asArray ? [] : '';
    
    const numbers = str.match(/\d+/g) || [];
    return asArray ? numbers.map(Number) : numbers.join('');
  }
  
  /**
   * Mask sensitive data in string
   * @param {string} str - String to mask
   * @param {string} maskChar - Character to use for masking (default: '*')
   * @param {number} visibleChars - Number of visible characters at start/end
   * @returns {string} Masked string
   */
  function maskString(str, maskChar = '*', visibleChars = 2) {
    if (!str || str.length <= visibleChars * 2) return str;
    
    const start = str.substring(0, visibleChars);
    const end = str.substring(str.length - visibleChars);
    const masked = maskChar.repeat(str.length - visibleChars * 2);
    
    return start + masked + end;
  }
  
  /**
   * Convert string to camelCase
   * @param {string} str - String to convert
   * @returns {string} Camel cased string
   */
  function toCamelCase(str) {
    if (!str) return '';
    
    return str
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase());
  }
  
  /**
   * Convert string to kebab-case
   * @param {string} str - String to convert
   * @returns {string} Kebab cased string
   */
  function toKebabCase(str) {
    if (!str) return '';
    
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

/**
 * String utility functions for common operations
 */

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * Convert to camelCase
 * @param {string} str - String to convert
 * @returns {string} camelCase string
 */
const toCamelCase = (str) => {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '');
};

/**
 * Convert to kebab-case
 * @param {string} str - String to convert
 * @returns {string} kebab-case string
 */
const toKebabCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * Convert to snake_case
 * @param {string} str - String to convert
 * @returns {string} snake_case string
 */
const toSnakeCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
};

/**
 * Reverse string
 * @param {string} str - String to reverse
 * @returns {string} Reversed string
 */
const reverse = (str) => str.split('').reverse().join('');

/**
 * Count words in string
 * @param {string} str - String to count words
 * @returns {number} Word count
 */
const wordCount = (str) => str.trim().split(/\s+/).length;

/**
 * Generate slug from string
 * @param {string} str - String to slugify
 * @returns {string} Slug string
 */
const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

module.exports = {
  capitalize,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  reverse,
  wordCount,
  slugify
};