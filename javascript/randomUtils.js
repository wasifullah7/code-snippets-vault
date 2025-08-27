/**
 * Generate random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
const randomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/**
 * Generate random string
 * @param {number} length - String length
 * @returns {string} Random string
 */
const randomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({length}, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
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
const randomItem = (array) => array[Math.floor(Math.random() * array.length)];

module.exports = { randomNumber, randomString, shuffleArray, randomItem };
