/**
 * Advanced string manipulation utilities for modern JavaScript
 * Collection of commonly needed string operations with performance optimizations
 */

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
  
  // Example usage:
  // console.log(toTitleCase('hello world')); // "Hello World"
  // console.log(slugify('Hello World!')); // "hello-world"
  // console.log(truncate('This is a long string', 10)); // "This is..."
  // console.log(randomString(10)); // "aB3xK9mN2p"
  // console.log(isPalindrome('A man a plan a canal Panama')); // true
  // console.log(wordFrequency('hello world hello')); // { hello: 2, world: 1 }
  // console.log(extractNumbers('abc123def456')); // "123456"
  // console.log(maskString('1234567890')); // "12******90"
  // console.log(toCamelCase('hello world')); // "helloWorld"
  // console.log(toKebabCase('helloWorld')); // "hello-world"
  
  module.exports = {
    toTitleCase,
    slugify,
    truncate,
    randomString,
    isPalindrome,
    wordFrequency,
    extractNumbers,
    maskString,
    toCamelCase,
    toKebabCase
  };