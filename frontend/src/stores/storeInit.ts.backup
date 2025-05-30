// Store initialization and cross-store communication
import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';
import { useCacheStore } from './cacheStore';

// Initialize stores on app startup
export const initializeStores = () => {
  // Set up any cross-store subscriptions or initial state here
  
  // Subscribe to auth changes to clear sensitive data on logout
  useAuthStore.subscribe(
    (state) => state.isAuthenticated,
    (isAuthenticated, prevIsAuthenticated) => {
      if (prevIsAuthenticated && !isAuthenticated) {
        // User logged out, clear sensitive caches
        useCacheStore.getState().clearAll();
      }
    }
  );

  // Set up error handling
  const originalConsoleError = console.error;
  console.error = (...args) => {
    // Capture any uncaught errors and show notifications
    const error = args[0];
    if (typeof error === 'string' && error.includes('Error')) {
      useUIStore.getState().addNotification({
        type: 'error',
        title: 'Application Error',
        message: 'An unexpected error occurred. Please try again.',
        duration: 5000,
      });
    }
    originalConsoleError(...args);
  };
};

// Cleanup function for when the app unmounts
export const cleanupStores = () => {
  // Clear any timers, subscriptions, etc.
  console.log('Cleaning up stores...');
}; 