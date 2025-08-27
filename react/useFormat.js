import { useMemo } from 'react';

/**
 * React hook for formatting utilities
 * @returns {Object} Formatting functions
 */
const useFormat = () => {
  const formatNumber = useMemo(() => (num) => num.toLocaleString(), []);
  
  const formatCurrency = useMemo(() => (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }, []);
  
  const formatFileSize = useMemo(() => (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);
  
  const formatPhone = useMemo(() => (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return match ? `(${match[1]}) ${match[2]}-${match[3]}` : phone;
  }, []);
  
  const truncateText = useMemo(() => (text, length = 50) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
  }, []);

  return {
    formatNumber,
    formatCurrency,
    formatFileSize,
    formatPhone,
    truncateText
  };
};

export default useFormat;
