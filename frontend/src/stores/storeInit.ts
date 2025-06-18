// Store initialization and cross-store communication
import { useAuthStore } from './authStore';
import { useUIStore } from './uiStore';
import { useCacheStore } from './cacheStore';

// Define types for store states
interface AuthState {
  isAuthenticated: boolean;
}

interface CacheState {
  clear: () => void;
}

// Initialize stores on app startup
export const initializeStores = () => {
  // Set up any cross-store subscriptions or initial state here
  
  // Subscribe to auth changes to clear sensitive data on logout
  const unsubscribe = useAuthStore.subscribe(
    (state: AuthState) => {
      if (!state.isAuthenticated) {
        // User logged out, clear sensitive caches
        useCacheStore.getState().clear();
      }
    }
  );

  // Set up error handling
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
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

  // Return cleanup function
  return () => {
    unsubscribe();
  };
};

// Cleanup function for when the app unmounts
export const cleanupStores = () => {
  // Clear any timers, subscriptions, etc.
  console.log('Cleaning up stores...');
}; 