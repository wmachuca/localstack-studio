import { useEffect, useRef } from 'react';

/**
 * Custom hook for polling/auto-refresh functionality
 *
 * @param {Function} callback - Function to call on each interval
 * @param {number} interval - Interval in milliseconds (default: 10000 = 10s)
 * @param {boolean} enabled - Whether polling is enabled (default: true)
 *
 * @example
 * usePoll(() => fetchQueues(), 10000);  // Poll every 10 seconds
 * usePoll(() => fetchTables(), 5000, isConnected);  // Poll only when connected
 */
export const usePoll = (callback, interval = 10000, enabled = true) => {
  const savedCallback = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) return;

    const tick = () => {
      if (savedCallback.current) {
        savedCallback.current();
      }
    };

    const id = setInterval(tick, interval);
    return () => clearInterval(id);
  }, [interval, enabled]);
};
