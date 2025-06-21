'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

/**
 * This component handles the initialization of the auth state when the app loads.
 * It ensures that the user's session is validated from storage.
 */
const SessionSync: React.FC = () => {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) {
      initializeAuth();
      }
  }, [initializeAuth, isInitialized]);

  // This component does not render anything.
  return null;
};

export default SessionSync; 