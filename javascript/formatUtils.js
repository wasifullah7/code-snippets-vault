/**
 * Formatting utility functions for numbers, dates, and text
 */

/**
 * Format number with thousand separators
 * @param {number} num - Number to format
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted number
 */
export const formatNumber = (num, locale = 'en-US') => {
  return new Intl.NumberFormat(locale).format(num);
};

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'USD')
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted currency
 */
export const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format percentage
 * @param {number} value - Value to format (0-1)
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted percentage
 */
export const formatPercentage = (value, decimals = 2) => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format file size in human readable format
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Number of decimals (default: 2)
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

/**
 * Format date with options
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Formatted date
 */
export const formatDate = (date, options = {}, locale = 'en-US') => {
  const dateObj = new Date(date);
  return new Intl.DateTimeFormat(locale, options).format(dateObj);
};

/**
 * Format relative time (e.g., "2 hours ago")
 * @param {Date|string|number} date - Date to format
 * @param {string} locale - Locale string (default: 'en-US')
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date, locale = 'en-US') => {
  const dateObj = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((now - dateObj) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  if (diffInSeconds < 60) return rtf.format(-diffInSeconds, 'second');
  if (diffInSeconds < 3600) return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  if (diffInSeconds < 86400) return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  if (diffInSeconds < 2592000) return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  if (diffInSeconds < 31536000) return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
  return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
};

/**
 * Format phone number
 * @param {string} phone - Phone number string
 * @param {string} format - Format pattern (default: 'US')
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phone, format = 'US') => {
  const cleaned = phone.replace(/\D/g, '');
  
  if (format === 'US') {
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
  }
  
  return phone; // Return original if can't format
};

/**
 * Format initials from name
 * @param {string} name - Full name
 * @param {number} maxInitials - Maximum number of initials (default: 2)
 * @returns {string} Formatted initials
 */
export const formatInitials = (name, maxInitials = 2) => {
  return name
    .split(' ')
    .slice(0, maxInitials)
    .map(word => word.charAt(0).toUpperCase())
    .join('');
};

/**
 * Format duration in milliseconds to readable format
 * @param {number} ms - Duration in milliseconds
 * @param {boolean} showMs - Show milliseconds (default: false)
 * @returns {string} Formatted duration
 */
export const formatDuration = (ms, showMs = false) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours % 24 > 0) parts.push(`${hours % 24}h`);
  if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
  if (seconds % 60 > 0 || parts.length === 0) {
    const secs = showMs ? (seconds % 60 + ms % 1000 / 1000).toFixed(1) : seconds % 60;
    parts.push(`${secs}s`);
  }
  
  return parts.join(' ');
};

/**
 * Format credit card number with spaces
 * @param {string} cardNumber - Credit card number
 * @returns {string} Formatted card number
 */
export const formatCreditCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  const groups = cleaned.match(/.{1,4}/g) || [];
  return groups.join(' ').slice(0, 19); // Max 16 digits + 3 spaces
};

/**
 * Format social security number
 * @param {string} ssn - Social security number
 * @returns {string} Formatted SSN
 */
export const formatSSN = (ssn) => {
  const cleaned = ssn.replace(/\D/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
  }
  return ssn;
};