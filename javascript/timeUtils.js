/**
 * Advanced time utilities for modern JavaScript
 * Comprehensive time and date manipulation, formatting, and calculation utilities
 */

/**
 * Format date with customizable options
 * @param {Date|string|number} date - Date to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted date string
 */
function formatDate(date, options = {}) {
  const {
    format = 'YYYY-MM-DD',
    locale = 'en-US',
    timezone = 'local'
  } = options;

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    throw new Error('Invalid date');
  }

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  const seconds = String(dateObj.getSeconds()).padStart(2, '0');
  const milliseconds = String(dateObj.getMilliseconds()).padStart(3, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('SSS', milliseconds);
}

/**
 * Get relative time (e.g., "2 hours ago", "in 3 days")
 * @param {Date|string|number} date - Date to get relative time for
 * @param {Object} options - Options for relative time
 * @returns {string} Relative time string
 */
function getRelativeTime(date, options = {}) {
  const {
    baseDate = new Date(),
    includeSeconds = false,
    futureSuffix = 'from now',
    pastSuffix = 'ago'
  } = options;

  const dateObj = new Date(date);
  const baseDateObj = new Date(baseDate);
  
  const diffMs = dateObj.getTime() - baseDateObj.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isFuture = diffMs > 0;
  const suffix = isFuture ? futureSuffix : pastSuffix;

  if (diffYears > 0) {
    return `${diffYears} year${diffYears > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffWeeks > 0) {
    return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ${suffix}`;
  }
  if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ${suffix}`;
  }
  if (includeSeconds && diffSeconds > 0) {
    return `${diffSeconds} second${diffSeconds > 1 ? 's' : ''} ${suffix}`;
  }
  
  return 'just now';
}

/**
 * Add time to a date
 * @param {Date|string|number} date - Base date
 * @param {Object} amount - Amount to add
 * @returns {Date} New date
 */
function addTime(date, amount = {}) {
  const dateObj = new Date(date);
  
  if (amount.years) dateObj.setFullYear(dateObj.getFullYear() + amount.years);
  if (amount.months) dateObj.setMonth(dateObj.getMonth() + amount.months);
  if (amount.weeks) dateObj.setDate(dateObj.getDate() + (amount.weeks * 7));
  if (amount.days) dateObj.setDate(dateObj.getDate() + amount.days);
  if (amount.hours) dateObj.setHours(dateObj.getHours() + amount.hours);
  if (amount.minutes) dateObj.setMinutes(dateObj.getMinutes() + amount.minutes);
  if (amount.seconds) dateObj.setSeconds(dateObj.getSeconds() + amount.seconds);
  if (amount.milliseconds) dateObj.setMilliseconds(dateObj.getMilliseconds() + amount.milliseconds);
  
  return dateObj;
}

/**
 * Subtract time from a date
 * @param {Date|string|number} date - Base date
 * @param {Object} amount - Amount to subtract
 * @returns {Date} New date
 */
function subtractTime(date, amount = {}) {
  const negativeAmount = {};
  Object.keys(amount).forEach(key => {
    negativeAmount[key] = -amount[key];
  });
  return addTime(date, negativeAmount);
}

/**
 * Get difference between two dates
 * @param {Date|string|number} date1 - First date
 * @param {Date|string|number} date2 - Second date
 * @param {string} unit - Unit of measurement
 * @returns {number} Difference in specified unit
 */
function getTimeDifference(date1, date2, unit = 'milliseconds') {
  const dateObj1 = new Date(date1);
  const dateObj2 = new Date(date2);
  const diffMs = Math.abs(dateObj2.getTime() - dateObj1.getTime());
  
  const units = {
    milliseconds: 1,
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000
  };
  
  return diffMs / units[unit];
}

/**
 * Check if date is today
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is today
 */
function isToday(date) {
  const dateObj = new Date(date);
  const today = new Date();
  
  return dateObj.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is yesterday
 */
function isYesterday(date) {
  const dateObj = new Date(date);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return dateObj.toDateString() === yesterday.toDateString();
}

/**
 * Check if date is tomorrow
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is tomorrow
 */
function isTomorrow(date) {
  const dateObj = new Date(date);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return dateObj.toDateString() === tomorrow.toDateString();
}

/**
 * Check if date is in the past
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is in the past
 */
function isPast(date) {
  const dateObj = new Date(date);
  const now = new Date();
  
  return dateObj.getTime() < now.getTime();
}

/**
 * Check if date is in the future
 * @param {Date|string|number} date - Date to check
 * @returns {boolean} Whether date is in the future
 */
function isFuture(date) {
  const dateObj = new Date(date);
  const now = new Date();
  
  return dateObj.getTime() > now.getTime();
}

/**
 * Get start of day (00:00:00)
 * @param {Date|string|number} date - Date to get start of day for
 * @returns {Date} Start of day
 */
function startOfDay(date) {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  return dateObj;
}

/**
 * Get end of day (23:59:59.999)
 * @param {Date|string|number} date - Date to get end of day for
 * @returns {Date} End of day
 */
function endOfDay(date) {
  const dateObj = new Date(date);
  dateObj.setHours(23, 59, 59, 999);
  return dateObj;
}

/**
 * Get start of week (Monday)
 * @param {Date|string|number} date - Date to get start of week for
 * @returns {Date} Start of week
 */
function startOfWeek(date) {
  const dateObj = new Date(date);
  const day = dateObj.getDay();
  const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // Monday is 1
  dateObj.setDate(diff);
  return startOfDay(dateObj);
}

/**
 * Get end of week (Sunday)
 * @param {Date|string|number} date - Date to get end of week for
 * @returns {Date} End of week
 */
function endOfWeek(date) {
  const dateObj = new Date(date);
  const day = dateObj.getDay();
  const diff = dateObj.getDate() - day + (day === 0 ? 0 : 7); // Sunday is 0
  dateObj.setDate(diff);
  return endOfDay(dateObj);
}

/**
 * Get start of month
 * @param {Date|string|number} date - Date to get start of month for
 * @returns {Date} Start of month
 */
function startOfMonth(date) {
  const dateObj = new Date(date);
  dateObj.setDate(1);
  return startOfDay(dateObj);
}

/**
 * Get end of month
 * @param {Date|string|number} date - Date to get end of month for
 * @returns {Date} End of month
 */
function endOfMonth(date) {
  const dateObj = new Date(date);
  dateObj.setMonth(dateObj.getMonth() + 1, 0);
  return endOfDay(dateObj);
}

/**
 * Get start of year
 * @param {Date|string|number} date - Date to get start of year for
 * @returns {Date} Start of year
 */
function startOfYear(date) {
  const dateObj = new Date(date);
  dateObj.setMonth(0, 1);
  return startOfDay(dateObj);
}

/**
 * Get end of year
 * @param {Date|string|number} date - Date to get end of year for
 * @returns {Date} End of year
 */
function endOfYear(date) {
  const dateObj = new Date(date);
  dateObj.setMonth(11, 31);
  return endOfDay(dateObj);
}

/**
 * Check if date is between two dates (inclusive)
 * @param {Date|string|number} date - Date to check
 * @param {Date|string|number} start - Start date
 * @param {Date|string|number} end - End date
 * @returns {boolean} Whether date is between start and end
 */
function isBetween(date, start, end) {
  const dateObj = new Date(date);
  const startObj = new Date(start);
  const endObj = new Date(end);
  
  return dateObj.getTime() >= startObj.getTime() && dateObj.getTime() <= endObj.getTime();
}

/**
 * Get age from birth date
 * @param {Date|string|number} birthDate - Birth date
 * @param {Date|string|number} referenceDate - Reference date (defaults to now)
 * @returns {number} Age in years
 */
function getAge(birthDate, referenceDate = new Date()) {
  const birth = new Date(birthDate);
  const reference = new Date(referenceDate);
  
  let age = reference.getFullYear() - birth.getFullYear();
  const monthDiff = reference.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && reference.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Check if year is leap year
 * @param {number} year - Year to check
 * @returns {boolean} Whether year is leap year
 */
function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

/**
 * Get days in month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {number} Number of days in month
 */
function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

/**
 * Get week number of year
 * @param {Date|string|number} date - Date to get week number for
 * @returns {number} Week number (1-53)
 */
function getWeekNumber(date) {
  const dateObj = new Date(date);
  const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
  const days = Math.floor((dateObj - startOfYear) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return weekNumber;
}

/**
 * Format duration in milliseconds to human readable string
 * @param {number} milliseconds - Duration in milliseconds
 * @param {Object} options - Formatting options
 * @returns {string} Formatted duration
 */
function formatDuration(milliseconds, options = {}) {
  const {
    includeSeconds = true,
    includeMilliseconds = false,
    shortFormat = false
  } = options;

  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  const remainingHours = hours % 24;
  const remainingMinutes = minutes % 60;
  const remainingSeconds = seconds % 60;
  const remainingMilliseconds = milliseconds % 1000;

  const parts = [];

  if (days > 0) {
    parts.push(`${days}${shortFormat ? 'd' : ' day' + (days > 1 ? 's' : '')}`);
  }
  if (remainingHours > 0) {
    parts.push(`${remainingHours}${shortFormat ? 'h' : ' hour' + (remainingHours > 1 ? 's' : '')}`);
  }
  if (remainingMinutes > 0) {
    parts.push(`${remainingMinutes}${shortFormat ? 'm' : ' minute' + (remainingMinutes > 1 ? 's' : '')}`);
  }
  if (includeSeconds && remainingSeconds > 0) {
    parts.push(`${remainingSeconds}${shortFormat ? 's' : ' second' + (remainingSeconds > 1 ? 's' : '')}`);
  }
  if (includeMilliseconds && remainingMilliseconds > 0) {
    parts.push(`${remainingMilliseconds}${shortFormat ? 'ms' : ' millisecond' + (remainingMilliseconds > 1 ? 's' : '')}`);
  }

  return parts.join(' ') || '0 seconds';
}

/**
 * Parse duration string to milliseconds
 * @param {string} duration - Duration string (e.g., "2h 30m 15s")
 * @returns {number} Duration in milliseconds
 */
function parseDuration(duration) {
  const units = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000
  };

  const regex = /(\d+)\s*([mshdw])/g;
  let totalMs = 0;
  let match;

  while ((match = regex.exec(duration)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2];
    totalMs += value * units[unit];
  }

  return totalMs;
}

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
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isBetween,
  getAge,
  isLeapYear,
  getDaysInMonth,
  getWeekNumber,
  formatDuration,
  parseDuration
};
