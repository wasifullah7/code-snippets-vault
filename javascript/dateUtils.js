/**
 * Date utility functions for date manipulation and formatting
 */

/**
 * Format date to string
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string (default: 'YYYY-MM-DD')
 * @returns {string} Formatted date string
 */
const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return '';
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string|number} date - Date to compare
 * @param {Date|string|number} baseDate - Base date (default: now)
 * @returns {string} Relative time string
 */
const getRelativeTime = (date, baseDate = new Date()) => {
  if (!date) return '';
  
  const dateObj = new Date(date);
  const baseObj = new Date(baseDate);
  
  if (isNaN(dateObj.getTime()) || isNaN(baseObj.getTime())) return '';
  
  const diffMs = dateObj.getTime() - baseObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  const isFuture = diffMs > 0;
  const prefix = isFuture ? 'in ' : '';
  const suffix = isFuture ? '' : ' ago';
  
  if (Math.abs(diffYears) >= 1) {
    return `${prefix}${Math.abs(diffYears)} year${Math.abs(diffYears) === 1 ? '' : 's'}${suffix}`;
  } else if (Math.abs(diffMonths) >= 1) {
    return `${prefix}${Math.abs(diffMonths)} month${Math.abs(diffMonths) === 1 ? '' : 's'}${suffix}`;
  } else if (Math.abs(diffWeeks) >= 1) {
    return `${prefix}${Math.abs(diffWeeks)} week${Math.abs(diffWeeks) === 1 ? '' : 's'}${suffix}`;
  } else if (Math.abs(diffDays) >= 1) {
    return `${prefix}${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}${suffix}`;
  } else if (Math.abs(diffHours) >= 1) {
    return `${prefix}${Math.abs(diffHours)} hour${Math.abs(diffHours) === 1 ? '' : 's'}${suffix}`;
  } else if (Math.abs(diffMinutes) >= 1) {
    return `${prefix}${Math.abs(diffMinutes)} minute${Math.abs(diffMinutes) === 1 ? '' : 's'}${suffix}`;
  } else {
    return 'just now';
  }
};

/**
 * Add time to date
 * @param {Date|string|number} date - Base date
 * @param {number} amount - Amount to add
 * @param {string} unit - Unit ('years', 'months', 'days', 'hours', 'minutes', 'seconds')
 * @returns {Date} New date
 */
const addTime = (date, amount, unit) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const newDate = new Date(dateObj);
  
  switch (unit) {
    case 'years':
      newDate.setFullYear(newDate.getFullYear() + amount);
      break;
    case 'months':
      newDate.setMonth(newDate.getMonth() + amount);
      break;
    case 'days':
      newDate.setDate(newDate.getDate() + amount);
      break;
    case 'hours':
      newDate.setHours(newDate.getHours() + amount);
      break;
    case 'minutes':
      newDate.setMinutes(newDate.getMinutes() + amount);
      break;
    case 'seconds':
      newDate.setSeconds(newDate.getSeconds() + amount);
      break;
    default:
      return dateObj;
  }
  
  return newDate;
};

/**
 * Subtract time from date
 * @param {Date|string|number} date - Base date
 * @param {number} amount - Amount to subtract
 * @param {string} unit - Unit ('years', 'months', 'days', 'hours', 'minutes', 'seconds')
 * @returns {Date} New date
 */
const subtractTime = (date, amount, unit) => {
  return addTime(date, -amount, unit);
};

/**
 * Get time difference between two dates
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @param {string} unit - Unit to return ('ms', 'seconds', 'minutes', 'hours', 'days')
 * @returns {number} Time difference
 */
const getTimeDifference = (date1, date2, unit = 'ms') => {
  if (!date1 || !date2) return 0;
  
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);
  
  if (isNaN(dateObj1.getTime()) || isNaN(dateObj2.getTime())) return 0;
  
  const diffMs = Math.abs(dateObj1.getTime() - dateObj2.getTime());
  
  switch (unit) {
    case 'seconds':
      return Math.floor(diffMs / 1000);
    case 'minutes':
      return Math.floor(diffMs / (1000 * 60));
    case 'hours':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'days':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'ms':
    default:
      return diffMs;
  }
};

/**
 * Check if date is today
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is today
 */
const isToday = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const today = new Date();
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj.toDateString() === today.toDateString();
};

/**
 * Check if date is yesterday
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is yesterday
 */
const isYesterday = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj.toDateString() === yesterday.toDateString();
};

/**
 * Check if date is tomorrow
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is tomorrow
 */
const isTomorrow = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj.toDateString() === tomorrow.toDateString();
};

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in the past
 */
const isPast = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj.getTime() < now.getTime();
};

/**
 * Check if date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} True if date is in the future
 */
const isFuture = (date) => {
  if (!date) return false;
  
  const dateObj = new Date(date);
  const now = new Date();
  
  if (isNaN(dateObj.getTime())) return false;
  
  return dateObj.getTime() > now.getTime();
};

/**
 * Get start of day
 * @param {Date|string|number} date - Date to get start of day for
 * @returns {Date} Start of day
 */
const getStartOfDay = (date) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const startOfDay = new Date(dateObj);
  startOfDay.setHours(0, 0, 0, 0);
  
  return startOfDay;
};

/**
 * Get end of day
 * @param {Date|string|number} date - Date to get end of day for
 * @returns {Date} End of day
 */
const getEndOfDay = (date) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const endOfDay = new Date(dateObj);
  endOfDay.setHours(23, 59, 59, 999);
  
  return endOfDay;
};

/**
 * Get start of week
 * @param {Date|string|number} date - Date to get start of week for
 * @param {number} startDay - Start day of week (0 = Sunday, 1 = Monday)
 * @returns {Date} Start of week
 */
const getStartOfWeek = (date, startDay = 0) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const startOfWeek = new Date(dateObj);
  const day = startOfWeek.getDay();
  const diff = day - startDay;
  
  startOfWeek.setDate(startOfWeek.getDate() - diff);
  startOfWeek.setHours(0, 0, 0, 0);
  
  return startOfWeek;
};

/**
 * Get end of week
 * @param {Date|string|number} date - Date to get end of week for
 * @param {number} startDay - Start day of week (0 = Sunday, 1 = Monday)
 * @returns {Date} End of week
 */
const getEndOfWeek = (date, startDay = 0) => {
  if (!date) return new Date();
  
  const startOfWeek = getStartOfWeek(date, startDay);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return endOfWeek;
};

/**
 * Get start of month
 * @param {Date|string|number} date - Date to get start of month for
 * @returns {Date} Start of month
 */
const getStartOfMonth = (date) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const startOfMonth = new Date(dateObj);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  
  return startOfMonth;
};

/**
 * Get end of month
 * @param {Date|string|number} date - Date to get end of month for
 * @returns {Date} End of month
 */
const getEndOfMonth = (date) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const endOfMonth = new Date(dateObj);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  
  return endOfMonth;
};

/**
 * Get start of year
 * @param {Date|string|number} date - Date to get start of year for
 * @returns {Date} Start of year
 */
const getStartOfYear = (date) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const startOfYear = new Date(dateObj);
  startOfYear.setMonth(0, 1);
  startOfYear.setHours(0, 0, 0, 0);
  
  return startOfYear;
};

/**
 * Get end of year
 * @param {Date|string|number} date - Date to get end of year for
 * @returns {Date} End of year
 */
const getEndOfYear = (date) => {
  if (!date) return new Date();
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return new Date();
  
  const endOfYear = new Date(dateObj);
  endOfYear.setMonth(11, 31);
  endOfYear.setHours(23, 59, 59, 999);
  
  return endOfYear;
};

/**
 * Check if date is between two dates
 * @param {Date|string|number} date - Date to check
 * @param {Date|string|number} startDate - Start date
 * @param {Date|string|number} endDate - End date
 * @param {boolean} inclusive - Include start and end dates
 * @returns {boolean} True if date is between start and end
 */
const isBetween = (date, startDate, endDate, inclusive = true) => {
  if (!date || !startDate || !endDate) return false;
  
  const dateObj = new Date(date);
  const startObj = new Date(startDate);
  const endObj = new Date(endDate);
  
  if (isNaN(dateObj.getTime()) || isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
    return false;
  }
  
  if (inclusive) {
    return dateObj.getTime() >= startObj.getTime() && dateObj.getTime() <= endObj.getTime();
  } else {
    return dateObj.getTime() > startObj.getTime() && dateObj.getTime() < endObj.getTime();
  }
};

/**
 * Get age from date
 * @param {Date|string|number} birthDate - Birth date
 * @param {Date|string|number} currentDate - Current date (default: now)
 * @returns {number} Age in years
 */
const getAge = (birthDate, currentDate = new Date()) => {
  if (!birthDate) return 0;
  
  const birthObj = new Date(birthDate);
  const currentObj = new Date(currentDate);
  
  if (isNaN(birthObj.getTime()) || isNaN(currentObj.getTime())) return 0;
  
  let age = currentObj.getFullYear() - birthObj.getFullYear();
  const monthDiff = currentObj.getMonth() - birthObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && currentObj.getDate() < birthObj.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Check if year is leap year
 * @param {number} year - Year to check
 * @returns {boolean} True if year is leap year
 */
const isLeapYear = (year) => {
  if (typeof year !== 'number') return false;
  
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
};

/**
 * Get days in month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {number} Number of days in month
 */
const getDaysInMonth = (year, month) => {
  if (typeof year !== 'number' || typeof month !== 'number') return 0;
  if (month < 1 || month > 12) return 0;
  
  return new Date(year, month, 0).getDate();
};

/**
 * Get week number
 * @param {Date|string|number} date - Date to get week number for
 * @returns {number} Week number
 */
const getWeekNumber = (date) => {
  if (!date) return 0;
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 0;
  
  const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
  const pastDaysOfYear = (dateObj - startOfYear) / 86400000;
  
  return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
};

/**
 * Format duration
 * @param {number} milliseconds - Duration in milliseconds
 * @param {string} format - Format string (default: 'HH:mm:ss')
 * @returns {string} Formatted duration
 */
const formatDuration = (milliseconds, format = 'HH:mm:ss') => {
  if (typeof milliseconds !== 'number' || isNaN(milliseconds)) return '';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return format
    .replace('HH', String(hours).padStart(2, '0'))
    .replace('mm', String(minutes).padStart(2, '0'))
    .replace('ss', String(seconds).padStart(2, '0'));
};

/**
 * Parse duration string
 * @param {string} duration - Duration string (e.g., '1h 30m', '90m', '5400s')
 * @returns {number} Duration in milliseconds
 */
const parseDuration = (duration) => {
  if (!duration || typeof duration !== 'string') return 0;
  
  const regex = /(\d+)\s*(h|m|s|hours?|minutes?|seconds?)/gi;
  let totalMs = 0;
  let match;
  
  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    switch (unit) {
      case 'h':
      case 'hour':
      case 'hours':
        totalMs += value * 60 * 60 * 1000;
        break;
      case 'm':
      case 'minute':
      case 'minutes':
        totalMs += value * 60 * 1000;
        break;
      case 's':
      case 'second':
      case 'seconds':
        totalMs += value * 1000;
        break;
    }
  }
  
  return totalMs;
};

module.exports = {
  formatDate,
  getRelativeTime,
  addTime,
  subtractTime,
  getTimeDifference,
  isToday,
  isYesterday,
  isTomorrow,
  isPast,
  isFuture,
  getStartOfDay,
  getEndOfDay,
  getStartOfWeek,
  getEndOfWeek,
  getStartOfMonth,
  getEndOfMonth,
  getStartOfYear,
  getEndOfYear,
  isBetween,
  getAge,
  isLeapYear,
  getDaysInMonth,
  getWeekNumber,
  formatDuration,
  parseDuration
};