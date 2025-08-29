import { useState, useCallback } from 'react';

/**
 * React hook for string operations
 * @param {string} initialString - Initial string
 * @returns {Object} String state and functions
 */
const useString = (initialString = '') => {
  const [string, setString] = useState(initialString);

  const capitalize = useCallback(() => {
    setString(prev => prev.charAt(0).toUpperCase() + prev.slice(1));
  }, []);

  const toUpperCase = useCallback(() => {
    setString(prev => prev.toUpperCase());
  }, []);

  const toLowerCase = useCallback(() => {
    setString(prev => prev.toLowerCase());
  }, []);

  const reverse = useCallback(() => {
    setString(prev => prev.split('').reverse().join(''));
  }, []);

  const clear = useCallback(() => {
    setString('');
  }, []);

  const trim = useCallback(() => {
    setString(prev => prev.trim());
  }, []);

  const replace = useCallback((search, replace) => {
    setString(prev => prev.replace(search, replace));
  }, []);

  const replaceAll = useCallback((search, replace) => {
    setString(prev => prev.replaceAll(search, replace));
  }, []);

  const wordCount = useCallback(() => {
    return string.trim().split(/\s+/).length;
  }, [string]);

  const charCount = useCallback(() => {
    return string.length;
  }, [string]);

  return {
    string,
    setString,
    capitalize,
    toUpperCase,
    toLowerCase,
    reverse,
    clear,
    trim,
    replace,
    replaceAll,
    wordCount: wordCount(),
    charCount: charCount()
  };
};

export default useString;
