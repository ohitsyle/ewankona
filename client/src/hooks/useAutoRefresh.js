// src/admin/hooks/useAutoRefresh.js
// Custom hook for auto-refreshing data at specified intervals

import { useEffect, useRef, useCallback } from 'react';

/**
 * Auto-refresh hook that calls a callback function at regular intervals
 * 
 * @param {Function} callback - Function to call on each refresh
 * @param {number} interval - Refresh interval in milliseconds (default: 5000ms)
 * @param {boolean} enabled - Whether auto-refresh is enabled (default: true)
 * 
 * @example
 * const loadData = async () => {
 *   const data = await fetchData();
 *   setData(data);
 * };
 * 
 * // Refresh every 5 seconds, pause when modal is open
 * useAutoRefresh(loadData, 5000, !isModalOpen);
 */
export function useAutoRefresh(callback, interval = 2000, enabled = true) {
  const savedCallback = useRef();
  const intervalId = useRef();

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval
  useEffect(() => {
    if (!enabled) {
      console.log('⏸️  Auto-refresh paused');
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
      return;
    }

    console.log(`🔄 Auto-refresh enabled (interval: ${interval}ms)`);

    const tick = () => {
      if (savedCallback.current) {
        console.log('🔄 Auto-refreshing...');
        savedCallback.current();
      }
    };

    // Set up interval
    intervalId.current = setInterval(tick, interval);

    // Clean up on unmount or when dependencies change
    return () => {
      console.log('🛑 Auto-refresh stopped');
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [interval, enabled]);

  // Return control functions
  return useCallback(() => {
    if (intervalId.current) {
      clearInterval(intervalId.current);
    }
  }, []);
}

export default useAutoRefresh;