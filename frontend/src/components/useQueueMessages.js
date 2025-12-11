import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connection to queue messages
 * @param {string} queueName - Name of the queue to monitor
 * @param {string} backendUrl - Backend WebSocket URL
 * @param {string} sortOrder - Sort order: 'oldest-first' or 'newest-first'
 * @returns {Object} - { messages, isConnected, error, clearMessages }
 */
export const useQueueMessages = (queueName, backendUrl = 'ws://localhost:8000', sortOrder = 'oldest-first') => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const loadingTimeoutRef = useRef(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const connect = useCallback(() => {
    if (!queueName || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(`${backendUrl}/ws/messages/${queueName}`);

      ws.onopen = () => {
        console.log(`WebSocket connected to queue: ${queueName}`);
        setIsConnected(true);
        setIsLoading(true);
        setError(null);

        // Stop loading after 3 seconds even if no messages arrive
        // (queue might be empty)
        loadingTimeoutRef.current = setTimeout(() => {
          setIsLoading(false);
        }, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // IMPORTANT: Only accept messages from the currently selected queue
          // This prevents race conditions when switching between queues
          if (data.queue !== queueName) {
            console.log(`Ignoring message from ${data.queue}, current queue is ${queueName}`);
            return;
          }

          // Stop loading indicator when first message arrives
          if (loadingTimeoutRef.current) {
            clearTimeout(loadingTimeoutRef.current);
            loadingTimeoutRef.current = null;
          }
          setIsLoading(false);

          setMessages((prev) => {
            const newMessage = {
              ...data.message,
              receivedAt: new Date().toISOString(),
              queue: data.queue
            };

            // Deduplicate by messageId - only keep unique messages
            const messageMap = new Map();

            // First, add all existing messages to the map
            prev.forEach(msg => {
              messageMap.set(msg.messageId, msg);
            });

            // Add or update the new message
            // If it already exists, update it with the latest data
            messageMap.set(newMessage.messageId, newMessage);

            // Convert back to array, sorted by SentTimestamp
            return Array.from(messageMap.values())
              .sort((a, b) => {
                // Get SentTimestamp from message attributes (Unix timestamp in milliseconds)
                const timeA = parseInt(a.attributes?.SentTimestamp || '0');
                const timeB = parseInt(b.attributes?.SentTimestamp || '0');

                // Sort based on sortOrder parameter
                if (sortOrder === 'newest-first') {
                  return timeB - timeA; // Descending order (newest first)
                } else {
                  return timeA - timeB; // Ascending order (oldest first)
                }
              })
              .slice(0, 100); // Keep last 100 unique messages
          });
        } catch (err) {
          console.error('Error parsing message:', err);
        }
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('WebSocket connection error');
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log(`WebSocket disconnected from queue: ${queueName}`);
        setIsConnected(false);

        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Error creating WebSocket:', err);
      setError('Failed to create WebSocket connection');
    }
  }, [queueName, backendUrl, sortOrder]);

  useEffect(() => {
    // Clear messages when queue changes
    setMessages([]);
    setError(null);
    setIsLoading(false);

    // Close any existing WebSocket connection before creating a new one
    if (wsRef.current) {
      console.log('Closing previous WebSocket connection');
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Clear any pending loading timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, queueName]);

  return {
    messages,
    isConnected,
    isLoading,
    error,
    clearMessages
  };
};
