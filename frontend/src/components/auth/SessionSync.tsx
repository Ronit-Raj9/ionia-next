'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore, startTokenMonitoring, stopTokenMonitoring, startTabSynchronization, trackUserActivity } from '@/stores/authStore';

const SessionSync: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const cleanupFunctions = useRef<(() => void)[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Start token monitoring and activity tracking
    if (isAuthenticated) {
      startTokenMonitoring();
      
      // Start tab synchronization
      const tabSyncCleanup = startTabSynchronization();
      if (tabSyncCleanup) {
        cleanupFunctions.current.push(tabSyncCleanup);
      }

      // Start activity tracking
      const activityCleanup = trackUserActivity();
      if (activityCleanup) {
        cleanupFunctions.current.push(activityCleanup);
      }
    } else {
      // Stop monitoring if not authenticated
      stopTokenMonitoring();
    }

    // Cleanup on unmount or auth change
    return () => {
      stopTokenMonitoring();
      cleanupFunctions.current.forEach(cleanup => cleanup());
      cleanupFunctions.current = [];
    };
  }, [isAuthenticated]);

  // This component doesn't render anything
  return null;
};

export default SessionSync; 