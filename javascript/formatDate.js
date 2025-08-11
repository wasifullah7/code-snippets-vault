/**
 * Advanced date formatting utility with multiple format options
 * @param {Date|string|number} date - Date to format
 * @param {string} format - Format string or predefined format
 * @param {string} locale - Locale for internationalization (default: 'en-US')
 * @returns {string} Formatted date string
 */
function formatDate(date, format = 'default', locale = 'en-US') {
    const d = new Date(date);
    
    // Validate date
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date provided');
    }
  
    // Predefined formats
    const formats = {
      default: () => d.toLocaleDateString(locale),
      short: () => d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' }),
      long: () => d.toLocaleDateString(locale, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: () => d.toLocaleTimeString(locale),
      datetime: () => d.toLocaleString(locale),
      iso: () => d.toISOString(),
      timestamp: () => d.getTime(),
      relative: () => getRelativeTime(d),
      custom: () => formatCustom(d, format, locale)
    };
  
    // Get relative time (e.g., "2 hours ago", "yesterday")
    function getRelativeTime(date) {
      const now = new Date();
      const diff = now - date;
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
  
      if (days > 7) {
        return date.toLocaleDateString(locale);
      } else if (days > 1) {
        return `${days} days ago`;
      } else if (days === 1) {
        return 'yesterday';
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
      } else if (minutes > 0) {
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
      } else {
        return 'just now';
      }
    }
  
    // Custom format parsing
    function formatCustom(date, format, locale) {
      return format
        .replace('YYYY', date.getFullYear())
        .replace('MM', String(date.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(date.getDate()).padStart(2, '0'))
        .replace('HH', String(date.getHours()).padStart(2, '0'))
        .replace('mm', String(date.getMinutes()).padStart(2, '0'))
        .replace('ss', String(date.getSeconds()).padStart(2, '0'));
    }
  
    const formatter = formats[format] || formats.default;
    return formatter();
  }
  
  // Example usage:
  // console.log(formatDate(new Date(), 'long')); // "Monday, January 1, 2024"
  // console.log(formatDate(new Date(), 'relative')); // "just now"
  // console.log(formatDate('2024-01-01', 'custom', 'YYYY-MM-DD')); // "2024-01-01"
  // console.log(formatDate(Date.now(), 'time')); // "2:30:45 PM"
  
  module.exports = formatDate;