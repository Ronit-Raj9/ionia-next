"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/db';

export type UserRole = 'superadmin' | 'admin' | 'teacher' | 'student';

// Use the standardized User interface from the new system
export interface RoleUser extends Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'password'> {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  password?: string; // Optional in frontend context
}

// Permission checker utilities
export const hasPermission = {
  canCreateSchools: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin';
  },
  canManageAllSchools: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin';
  },
  canCreateAdmins: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin' || user?.role === 'admin';
  },
  canCreateTeachers: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin' || user?.role === 'admin';
  },
  canCreateStudents: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin' || user?.role === 'admin';
  },
  canManageClasses: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin' || user?.role === 'admin' || user?.role === 'teacher';
  },
  canViewAllData: (user: RoleUser | null): boolean => {
    return user?.role === 'superadmin';
  },
  isScopedToSchool: (user: RoleUser | null): boolean => {
    return user?.role === 'admin' || user?.role === 'teacher';
  },
  canAccessSchool: (user: RoleUser | null, schoolId: string): boolean => {
    if (user?.role === 'superadmin') return true;
    if (!user?.schoolId) return false;
    return user.schoolId.toString() === schoolId;
  },
};

interface RoleContextType {
  user: RoleUser | null;
  setUser: (user: RoleUser) => void;
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

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<RoleUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from secure session on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Fetch session from secure HTTP-only cookie
        const response = await fetch('/api/auth/session', {
          credentials: 'include', // Important: Include cookies
        });
        
        const data = await response.json();
        
        if (data.success && data.user) {
          setUser(data.user);
          
          // Only store non-sensitive display data in localStorage for UI preferences
          const displayData = {
            name: data.user.name,
            role: data.user.role,
            email: data.user.email,
          };
          localStorage.setItem('ionia_display', JSON.stringify(displayData));
          } else {
          // No valid session, clear any stored data
          setUser(null);
          localStorage.removeItem('ionia_display');
        }
      } catch (error) {
        console.error('Failed to load session:', error);
        setUser(null);
        localStorage.removeItem('ionia_display');
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, []);

  const handleSetUser = (newUser: RoleUser) => {
    setUser(newUser);
    
    // Only store non-sensitive display data for UI
    const displayData = {
      name: newUser.name,
      role: newUser.role,
      email: newUser.email,
    };
    localStorage.setItem('ionia_display', JSON.stringify(displayData));
    
    // Actual authentication is handled by HTTP-only cookie
    // No sensitive data stored in localStorage
  };

  const clearRole = async () => {
    try {
      // Call logout API to clear session cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }
    
    // Clear local state and localStorage
    setUser(null);
    localStorage.removeItem('ionia_display');
    localStorage.removeItem('ionia_user'); // Clean up legacy data if exists
  };

  const value: RoleContextType = {
    user,
    setUser: handleSetUser,
    clearRole,
    isLoading,
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}