import { createContext, useContext } from 'react';

/**
 * Application Context
 * Provides global configuration and shared state across the application
 */
const AppContext = createContext({
  backendUrl: 'http://localhost:8000',
  wsUrl: 'ws://localhost:8000'
});

/**
 * App Provider Component
 * Wraps the application to provide global context
 */
export const AppProvider = ({ children }) => {
  // Get backend URL from environment or use default
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Convert HTTP URL to WebSocket URL
  const wsUrl = backendUrl
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');

  const value = {
    backendUrl,
    wsUrl
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom hook to use App Context
 * Usage: const { backendUrl, wsUrl } = useApp();
 */
export const useApp = () => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }

  return context;
};
