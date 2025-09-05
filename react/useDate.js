import { useState, useCallback, useEffect } from 'react';

/**
 * React hook for date operations
 * @param {Date|string|number} initialDate - Initial date
 * @param {Object} options - Hook options
 * @returns {Object} Date state and functions
 */
const useDate = (initialDate = new Date(), options = {}) => {
  const {
    format = 'YYYY-MM-DD',
    timezone = 'local',
    updateInterval = null
  } = options;

  const [date, setDate] = useState(() => {
    if (!initialDate) return new Date();
    const dateObj = new Date(initialDate);
    return isNaN(dateObj.getTime()) ? new Date() : dateObj;
  });

  // Format date to string
  const formatDate = useCallback((dateToFormat, formatString = format) => {
    if (!dateToFormat) return '';
    
    const dateObj = new Date(dateToFormat);
    if (isNaN(dateObj.getTime())) return '';
    
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const hours = String(dateObj.getHours()).padStart(2, '0');
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    
    return formatString
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  }, [format]);

  // Get relative time
  const getRelativeTime = useCallback((dateToCompare, baseDate = new Date()) => {
    if (!dateToCompare) return '';
    
    const dateObj = new Date(dateToCompare);
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
  }, []);

  // Add time to date
  const addTime = useCallback((amount, unit) => {
    const newDate = new Date(date);
    
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
        return;
    }
    
    setDate(newDate);
  }, [date]);

  // Subtract time from date
  const subtractTime = useCallback((amount, unit) => {
    addTime(-amount, unit);
  }, [addTime]);

  // Set specific date
  const setSpecificDate = useCallback((newDate) => {
    const dateObj = new Date(newDate);
    if (!isNaN(dateObj.getTime())) {
      setDate(dateObj);
    }
  }, []);

  // Set to today
  const setToToday = useCallback(() => {
    setDate(new Date());
  }, []);

  // Set to specific time
  const setTime = useCallback((hours, minutes, seconds = 0) => {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, seconds, 0);
    setDate(newDate);
  }, [date]);

  // Get time difference
  const getTimeDifference = useCallback((otherDate, unit = 'ms') => {
    if (!otherDate) return 0;
    
    const otherDateObj = new Date(otherDate);
    if (isNaN(otherDateObj.getTime())) return 0;
    
    const diffMs = Math.abs(date.getTime() - otherDateObj.getTime());
    
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
  }, [date]);

  // Check if date is today
  const isToday = useCallback(() => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, [date]);

  // Check if date is yesterday
  const isYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }, [date]);

  // Check if date is tomorrow
  const isTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  }, [date]);

  // Check if date is in the past
  const isPast = useCallback(() => {
    const now = new Date();
    return date.getTime() < now.getTime();
  }, [date]);

  // Check if date is in the future
  const isFuture = useCallback(() => {
    const now = new Date();
    return date.getTime() > now.getTime();
  }, [date]);

  // Get start of day
  const getStartOfDay = useCallback(() => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
  }, [date]);

  // Get end of day
  const getEndOfDay = useCallback(() => {
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
  }, [date]);

  // Get start of week
  const getStartOfWeek = useCallback((startDay = 0) => {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = day - startDay;
    
    startOfWeek.setDate(startOfWeek.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);
    
    return startOfWeek;
  }, [date]);

  // Get end of week
  const getEndOfWeek = useCallback((startDay = 0) => {
    const startOfWeek = getStartOfWeek(startDay);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);
    
    return endOfWeek;
  }, [date, getStartOfWeek]);

  // Get start of month
  const getStartOfMonth = useCallback(() => {
    const startOfMonth = new Date(date);
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    return startOfMonth;
  }, [date]);

  // Get end of month
  const getEndOfMonth = useCallback(() => {
    const endOfMonth = new Date(date);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    
    return endOfMonth;
  }, [date]);

  // Get start of year
  const getStartOfYear = useCallback(() => {
    const startOfYear = new Date(date);
    startOfYear.setMonth(0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    
    return startOfYear;
  }, [date]);

  // Get end of year
  const getEndOfYear = useCallback(() => {
    const endOfYear = new Date(date);
    endOfYear.setMonth(11, 31);
    endOfYear.setHours(23, 59, 59, 999);
    
    return endOfYear;
  }, [date]);

  // Check if date is between two dates
  const isBetween = useCallback((startDate, endDate, inclusive = true) => {
    if (!startDate || !endDate) return false;
    
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    
    if (isNaN(startObj.getTime()) || isNaN(endObj.getTime())) {
      return false;
    }
    
    if (inclusive) {
      return date.getTime() >= startObj.getTime() && date.getTime() <= endObj.getTime();
    } else {
      return date.getTime() > startObj.getTime() && date.getTime() < endObj.getTime();
    }
  }, [date]);

  // Get age from date
  const getAge = useCallback((currentDate = new Date()) => {
    const currentObj = new Date(currentDate);
    
    if (isNaN(currentObj.getTime())) return 0;
    
    let age = currentObj.getFullYear() - date.getFullYear();
    const monthDiff = currentObj.getMonth() - date.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && currentObj.getDate() < date.getDate())) {
      age--;
    }
    
    return age;
  }, [date]);

  // Check if year is leap year
  const isLeapYear = useCallback(() => {
    const year = date.getFullYear();
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  }, [date]);

  // Get days in month
  const getDaysInMonth = useCallback(() => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }, [date]);

  // Get week number
  const getWeekNumber = useCallback(() => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - startOfYear) / 86400000;
    
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }, [date]);

  // Format duration
  const formatDuration = useCallback((milliseconds, formatString = 'HH:mm:ss') => {
    if (typeof milliseconds !== 'number' || isNaN(milliseconds)) return '';
    
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return formatString
      .replace('HH', String(hours).padStart(2, '0'))
      .replace('mm', String(minutes).padStart(2, '0'))
      .replace('ss', String(seconds).padStart(2, '0'));
  }, []);

  // Parse duration string
  const parseDuration = useCallback((duration) => {
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
  }, []);

  // Get formatted date string
  const getFormattedDate = useCallback((formatString = format) => {
    return formatDate(date, formatString);
  }, [date, formatDate, format]);

  // Get relative time string
  const getRelativeTimeString = useCallback((baseDate = new Date()) => {
    return getRelativeTime(date, baseDate);
  }, [date, getRelativeTime]);

  // Auto-update date if updateInterval is set
  useEffect(() => {
    if (updateInterval && typeof updateInterval === 'number') {
      const interval = setInterval(() => {
        setDate(new Date());
      }, updateInterval);

      return () => clearInterval(interval);
    }
  }, [updateInterval]);

  return {
    // State
    date,
    
    // Date operations
    setDate: setSpecificDate,
    setToToday,
    setTime,
    addTime,
    subtractTime,
    
    // Date formatting
    formatDate,
    getFormattedDate,
    getRelativeTime,
    getRelativeTimeString,
    
    // Date utilities
    getTimeDifference,
    isToday,
    isYesterday,
    isTomorrow,
    isPast,
    isFuture,
    
    // Date ranges
    getStartOfDay,
    getEndOfDay,
    getStartOfWeek,
    getEndOfWeek,
    getStartOfMonth,
    getEndOfMonth,
    getStartOfYear,
    getEndOfYear,
    isBetween,
    
    // Date calculations
    getAge,
    isLeapYear,
    getDaysInMonth,
    getWeekNumber,
    
    // Duration utilities
    formatDuration,
    parseDuration
  };
};

export default useDate;