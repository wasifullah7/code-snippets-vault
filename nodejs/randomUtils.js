const crypto = require('crypto');

/**
 * Generate random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
const randomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Generate cryptographically secure random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
const randomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Generate random ID
 * @param {number} length - ID length
 * @returns {string} Random ID
 */
const randomId = (length = 16) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Shuffle array
 * @param {Array} array - Array to shuffle
 * @returns {Array} Shuffled array
 */
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

/**
 * Pick random item from array
 * @param {Array} array - Array to pick from
 * @returns {*} Random item
 */
const randomItem = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

module.exports = {
  randomNumber,
  randomString,
  randomId,
  shuffleArray,
  randomItem
};
