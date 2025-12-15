import { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';

/**
 * Custom hook for making API calls with loading and error states
 *
 * @param {string} endpoint - API endpoint (e.g., '/queues' or '/dynamodb/tables')
 * @param {object} options - Fetch options (method, headers, body, etc.)
 * @param {boolean} immediate - Whether to fetch immediately on mount (default: true)
 * @returns {object} - { data, loading, error, refetch }
 *
 * @example
 * const { data, loading, error, refetch } = useApi('/queues');
 * const { data, loading, error, refetch } = useApi('/dynamodb/tables', {}, false);
 */
export const useApi = (endpoint, options = {}, immediate = true) => {
  const { backendUrl } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!endpoint) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [backendUrl, endpoint, options]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
  }, [fetchData, immediate]);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
};
