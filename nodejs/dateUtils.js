/**
 * Date utilities for Node.js
 */

/**
 * Format date to readable string
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {Date} date - Date to compare
 * @returns {string} Relative time string
 */
const getRelativeTime = (date) => {
  const now = new Date();
  const diff = now - date;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
};

/**
 * Check if date is today
 * @param {Date} date - Date to check
 * @returns {boolean} True if today
 */
const isToday = (date) => {
  const today = new Date();
  return date.toDateString() === today.toDateString();
};

/**
 * Add days to date
 * @param {Date} date - Base date
 * @param {number} days - Days to add
 * @returns {Date} New date
 */
const addDays = (date, days) => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
};

/**
 * Get start of month
 * @param {Date} date - Date to get month start
 * @returns {Date} Start of month
 */
const getMonthStart = (date) => {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get end of month
 * @param {Date} date - Date to get month end
 * @returns {Date} End of month
 */
const getMonthEnd = (date) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1, 0);
  d.setHours(23, 59, 59, 999);
  return d;
};

/**
 * Check if date is in past
 * @param {Date} date - Date to check
 * @returns {boolean} True if in past
 */
const isPast = (date) => {
  return date < new Date();
};

/**
 * Check if date is in future
 * @param {Date} date - Date to check
 * @returns {boolean} True if in future
 */
const isFuture = (date) => {
  return date > new Date();
};

/**
 * Get age from birth date
 * @param {Date} birthDate - Birth date
 * @returns {number} Age in years
 */
const getAge = (birthDate) => {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

module.exports = {
  formatDate,
  getRelativeTime,
  isToday,
  addDays,
  getMonthStart,
  getMonthEnd,
  isPast,
  isFuture,
  getAge
};
