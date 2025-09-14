import { useState, useCallback, useEffect } from 'react';

/**
 * Custom React hook for clipboard operations
 * @param {Object} options - Configuration options
 * @param {number} options.timeout - Success message timeout (default: 2000)
 * @param {boolean} options.resetAfterTimeout - Reset state after timeout (default: true)
 * @returns {Object} Clipboard state and functions
 */
export default function useClipboard(options = {}) {
  const {
    timeout = 2000,
    resetAfterTimeout = true
  } = options;

  const [copiedText, setCopiedText] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState(null);
  const [isSupported, setIsSupported] = useState(false);

  // Check clipboard API support
  useEffect(() => {
    setIsSupported(
      'navigator' in window &&
      'clipboard' in navigator &&
      'writeText' in navigator.clipboard
    );
  }, []);

  // Reset state after timeout
  useEffect(() => {
    if (isCopied && resetAfterTimeout) {
      const timer = setTimeout(() => {
        setIsCopied(false);
        setCopiedText('');
      }, timeout);

      return () => clearTimeout(timer);
    }
  }, [isCopied, resetAfterTimeout, timeout]);

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  const copy = useCallback(async (text) => {
    if (!isSupported) {
      setError('Clipboard API not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setIsCopied(true);
      setError(null);
      return true;
    } catch (err) {
      setError(err.message);
      setIsCopied(false);
      return false;
    }
  }, [isSupported]);

  /**
   * Read text from clipboard
   * @returns {Promise<string|null>} Clipboard text or null
   */
  const read = useCallback(async () => {
    if (!isSupported) {
      setError('Clipboard API not supported');
      return null;
    }

    try {
      const text = await navigator.clipboard.readText();
      setError(null);
      return text;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [isSupported]);

  /**
   * Copy text with fallback for older browsers
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  const copyWithFallback = useCallback(async (text) => {
    // Try modern clipboard API first
    if (isSupported) {
      const success = await copy(text);
      if (success) return true;
    }

    // Fallback to document.execCommand
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        setCopiedText(text);
        setIsCopied(true);
        setError(null);
        return true;
      } else {
        setError('Failed to copy text');
        return false;
      }
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, [isSupported, copy]);

  /**
   * Copy object as JSON to clipboard
   * @param {Object} obj - Object to copy
   * @param {number} space - JSON spacing (default: 2)
   * @returns {Promise<boolean>} Success status
   */
  const copyObject = useCallback(async (obj, space = 2) => {
    try {
      const jsonString = JSON.stringify(obj, null, space);
      return await copy(jsonString);
    } catch (err) {
      setError('Failed to stringify object');
      return false;
    }
  }, [copy]);

  /**
   * Copy URL to clipboard
   * @param {string} url - URL to copy
   * @returns {Promise<boolean>} Success status
   */
  const copyUrl = useCallback(async (url) => {
    try {
      const urlObj = new URL(url);
      return await copy(urlObj.toString());
    } catch (err) {
      setError('Invalid URL');
      return false;
    }
  }, [copy]);

  /**
   * Copy current page URL to clipboard
   * @returns {Promise<boolean>} Success status
   */
  const copyCurrentUrl = useCallback(async () => {
    return await copy(window.location.href);
  }, [copy]);

  /**
   * Reset clipboard state
   */
  const reset = useCallback(() => {
    setIsCopied(false);
    setCopiedText('');
    setError(null);
  }, []);

  /**
   * Check if clipboard has specific text
   * @param {string} text - Text to check
   * @returns {Promise<boolean>} Match status
   */
  const hasText = useCallback(async (text) => {
    const clipboardText = await read();
    return clipboardText === text;
  }, [read]);

  /**
   * Copy text and show toast notification
   * @param {string} text - Text to copy
   * @param {string} message - Success message
   * @returns {Promise<boolean>} Success status
   */
  const copyWithNotification = useCallback(async (text, message = 'Copied to clipboard!') => {
    const success = await copy(text);
    
    if (success && 'Notification' in window && Notification.permission === 'granted') {
      new Notification('Clipboard', {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    return success;
  }, [copy]);

  /**
   * Get clipboard state summary
   * @returns {Object} State summary
   */
  const getState = useCallback(() => {
    return {
      isCopied,
      copiedText,
      error,
      isSupported,
      hasError: !!error
    };
  }, [isCopied, copiedText, error, isSupported]);

  return {
    // State
    isCopied,
    copiedText,
    error,
    isSupported,
    hasError: !!error,
    
    // Actions
    copy,
    read,
    copyWithFallback,
    copyObject,
    copyUrl,
    copyCurrentUrl,
    copyWithNotification,
    hasText,
    reset,
    
    // Utilities
    getState
  };
}

/**
 * Hook for copying specific values
 * @param {*} value - Value to copy
 * @param {Object} options - Options
 * @returns {Object} Copy state and function
 */
export function useCopyValue(value, options = {}) {
  const clipboard = useClipboard(options);
  
  const copyValue = useCallback(async () => {
    const textValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
    return await clipboard.copy(textValue);
  }, [value, clipboard]);
  
  return {
    ...clipboard,
    copyValue
  };
}

/**
 * Hook for copying with custom formatter
 * @param {Function} formatter - Value formatter function
 * @param {Object} options - Options
 * @returns {Object} Clipboard state and functions
 */
export function useCopyWithFormatter(formatter, options = {}) {
  const clipboard = useClipboard(options);
  
  const copyFormatted = useCallback(async (value) => {
    const formattedValue = formatter(value);
    return await clipboard.copy(formattedValue);
  }, [formatter, clipboard]);
  
  return {
    ...clipboard,
    copyFormatted
  };
}