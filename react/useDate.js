import { useState, useCallback } from 'react';

/**
 * React hook for date operations
 * @param {Date} initialDate - Initial date
 * @returns {Object} Date state and functions
 */
const useDate = (initialDate = new Date()) => {
  const [date, setDate] = useState(initialDate);

  const formatDate = useCallback(() => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  }, [date]);

  const getRelativeTime = useCallback(() => {
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
  }, [date]);

  const isToday = useCallback(() => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }, [date]);

  const addDays = useCallback((days) => {
    setDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    });
  }, []);

  const setToToday = useCallback(() => {
    setDate(new Date());
  }, []);

  const setToYesterday = useCallback(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setDate(yesterday);
  }, []);

  const setToTomorrow = useCallback(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow);
  }, []);

  return {
    date,
    setDate,
    formatDate: formatDate(),
    getRelativeTime: getRelativeTime(),
    isToday: isToday(),
    addDays,
    setToToday,
    setToYesterday,
    setToTomorrow
  };
};

export default useDate;
