/**
 * Custom hook for data fetching with loading and error states
 * @param {string} url - The URL to fetch data from
 * @param {Object} options - Fetch options
 * @param {number} [options.retries=3] - Number of retry attempts
 * @param {number} [options.retryDelay=1000] - Delay between retries in ms
 * @returns {Object} Object containing data, loading, error, and refetch function
 */
import { useState, useEffect, useCallback } from 'react';

const useFetch = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;

  const fetchData = useCallback(async (retryAttempt = 0) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      setData(result);
      setRetryCount(0);
    } catch (err) {
      setError(err.message);
      
      if (retryAttempt < retries) {
        setTimeout(() => {
          setRetryCount(retryAttempt + 1);
          fetchData(retryAttempt + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [url, retries, retryDelay, fetchOptions]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch, retryCount };
};

export default useFetch;