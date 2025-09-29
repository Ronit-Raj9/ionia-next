"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'teacher' | 'student' | 'admin';

export interface RoleUser {
  role: UserRole;
  mockUserId: string;
  displayName: string;
  classId: string;
  name?: string;
  email?: string;
}

interface RoleContextType {
  user: RoleUser | null;
  setRole: (role: UserRole, mockUserId?: string) => void;
  clearRole: () => void;
  isLoading: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

// Default class ID - can be configured via environment variable
const DEFAULT_CLASS_ID = process.env.NEXT_PUBLIC_DEFAULT_CLASS_ID || 'demo-class-1';

// Generate display names
const getDisplayName = (role: UserRole, mockUserId: string): string => {
  switch (role) {
    case 'teacher':
      return 'Demo Teacher';
    case 'admin':
      return 'Demo Admin';
    case 'student':
      const studentNumber = mockUserId.replace('student', '');
      return `Student ${studentNumber}`;
    default:
      return 'Demo User';
  }
};

// Generate mock user ID
const generateMockUserId = (role: UserRole, customId?: string): string => {
  if (customId) return customId;
  
  switch (role) {
    case 'teacher':
      return 'teacher1';
    case 'admin':
      return 'admin1';
    case 'student':
      // Default to student1, but this should be selected by user
      return 'student1';
    default:
      return `${role}1`;
  }
};

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RoleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load role from localStorage on mount
  useEffect(() => {
    const loadStoredRole = () => {
      try {
        const storedRole = localStorage.getItem('ionia_role');
        const storedUserInfo = localStorage.getItem('ionia_user_info');
        
        if (storedRole) {
          const parsed = JSON.parse(storedRole) as RoleUser;
          
          // Merge with additional user info if available
          if (storedUserInfo) {
            const userInfo = JSON.parse(storedUserInfo);
            parsed.name = userInfo.name;
            parsed.email = userInfo.email;
            // Update display name with actual name if available
            if (userInfo.name) {
              parsed.displayName = userInfo.name;
            }
          }
          
          setUser(parsed);
        }
      } catch (error) {
        console.error('Failed to load stored role:', error);
        localStorage.removeItem('ionia_role');
        localStorage.removeItem('ionia_user_info');
      } finally {
        setIsLoading(false);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      loadStoredRole();
    } else {
      setIsLoading(false);
    }
  }, []);

  const setRole = (role: UserRole, mockUserId?: string) => {
    const generatedMockUserId = generateMockUserId(role, mockUserId);
    const newUser: RoleUser = {
      role,
      mockUserId: generatedMockUserId,
      displayName: getDisplayName(role, generatedMockUserId),
      classId: DEFAULT_CLASS_ID,
    };

    setUser(newUser);
    
    // Store in localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('ionia_role', JSON.stringify(newUser));
    }
  };

  const clearRole = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ionia_role');
      localStorage.removeItem('ionia_user_info');
    }
  };

  const value = {
    user,
    setRole,
    clearRole,
    isLoading,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

// Helper hook to check if user has specific role
export const useRoleCheck = (requiredRole: UserRole | UserRole[]) => {
  const { user } = useRole();
  
  if (!user) return false;
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.role);
  }
  
  return user.role === requiredRole;
};

// Helper hook to get all available student IDs (1-20)
export const useStudentIds = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    id: `student${i + 1}`,
    name: `Student ${i + 1}`,
  }));
};

export default RoleContext;
