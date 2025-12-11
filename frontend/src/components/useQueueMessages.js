import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing WebSocket connection to queue messages
 * @param {string} queueName - Name of the queue to monitor
 * @param {string} backendUrl - Backend WebSocket URL
 * @returns {Object} - { messages, isConnected, error, clearMessages }
 */
export const useQueueMessages = (queueName, backendUrl = 'ws://localhost:8000') => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

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
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setMessages((prev) => {
            // Add timestamp for display
            const newMessage = {
              ...data.message,
              receivedAt: new Date().toISOString(),
              queue: data.queue
            };
            // Keep last 100 messages to prevent memory issues
            return [newMessage, ...prev].slice(0, 100);
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
  }, [queueName, backendUrl]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    messages,
    isConnected,
    error,
    clearMessages
  };
};
