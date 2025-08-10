/**
 * Custom React hook for data fetching with advanced features
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options and configuration
 * @param {Object} options.method - HTTP method (default: 'GET')
 * @param {Object} options.headers - Request headers
 * @param {Object} options.body - Request body
 * @param {boolean} options.enabled - Whether to execute the request (default: true)
 * @param {number} options.retryCount - Number of retry attempts (default: 3)
 * @param {number} options.retryDelay - Delay between retries in ms (default: 1000)
 * @returns {Object} { data, loading, error, refetch, abort }
 */
import { useState, useEffect, useCallback, useRef } from 'react';

function useFetch(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body = null,
    enabled = true,
    retryCount = 3,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  
  const abortControllerRef = useRef(null);

  const fetchData = useCallback(async (retryAttempt = 0) => {
    if (!url || !enabled) return;

    try {
      setLoading(true);
      setError(null);
      
      // Create abort controller for this request
      abortControllerRef.current = new AbortController();
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: body ? JSON.stringify(body) : null,
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      setRetryAttempts(0);
      
    } catch (err) {
      if (err.name === 'AbortError') {
        return; // Request was aborted
      }
      
      setError(err.message);
      
      // Retry logic
      if (retryAttempt < retryCount) {
        setTimeout(() => {
          setRetryAttempts(retryAttempt + 1);
          fetchData(retryAttempt + 1);
        }, retryDelay);
      }
    } finally {
      setLoading(false);
    }
  }, [url, method, headers, body, enabled, retryCount, retryDelay]);

  const refetch = useCallback(() => {
    setRetryAttempts(0);
    fetchData(0);
  }, [fetchData]);

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  useEffect(() => {
    fetchData(0);
    
    // Cleanup function to abort request on unmount
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData]);

  return { data, loading, error, refetch, abort, retryAttempts };
}

// Example usage:
// function UserProfile({ userId }) {
//   const { data, loading, error, refetch } = useFetch(
//     `/api/users/${userId}`,
//     { 
//       retryCount: 3,
//       retryDelay: 2000 
//     }
//   );
//   
//   if (loading) return <div>Loading...</div>;
//   if (error) return <div>Error: {error}</div>;
//   
//   return (
//     <div>
//       <h1>{data.name}</h1>
//       <button onClick={refetch}>Refresh</button>
//     </div>
//   );
// }

export default useFetch;