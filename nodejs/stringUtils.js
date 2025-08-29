/**
 * String utilities for Node.js
 */

/**
 * Capitalize first letter
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
const capitalize = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

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

/**
 * Count words in string
 * @param {string} str - String to count words
 * @returns {number} Word count
 */
const wordCount = (str) => {
  return str.trim().split(/\s+/).length;
};

/**
 * Generate random string
 * @param {number} length - Length of string
 * @returns {string} Random string
 */
const randomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Mask sensitive data
 * @param {string} str - String to mask
 * @param {number} start - Start position
 * @param {number} end - End position
 * @param {string} mask - Mask character
 * @returns {string} Masked string
 */
const maskString = (str, start = 2, end = 2, mask = '*') => {
  if (str.length <= start + end) return str;
  const visibleStart = str.slice(0, start);
  const visibleEnd = str.slice(-end);
  const masked = mask.repeat(str.length - start - end);
  return visibleStart + masked + visibleEnd;
};

module.exports = {
  capitalize,
  toCamelCase,
  toKebabCase,
  toSnakeCase,
  slugify,
  wordCount,
  randomString,
  maskString
};
