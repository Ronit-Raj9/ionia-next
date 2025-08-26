// Type definitions for User and related interfaces

import { User } from '@/lib/hooks/useUserManagement';

// Extend the User interface to include analytics
declare module '@/lib/hooks/useUserManagement' {
  interface User {
    analytics?: {
      totalTests: number;
      testsThisWeek: number;
      averageScore: number;
      accuracy: number;
    };
  }
} 