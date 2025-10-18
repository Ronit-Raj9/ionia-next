"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/lib/db';

export type UserRole = 'teacher' | 'student' | 'admin';

// Use the standardized User interface from the new system
export interface RoleUser extends Omit<User, '_id' | 'createdAt' | 'updatedAt'> {
  _id?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

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

  // Load user from localStorage on mount
  useEffect(() => {
    const loadStoredUser = async () => {
      try {
        const storedUser = localStorage.getItem('ionia_user');
        
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as RoleUser;
          
          // Validate the user data using new system requirements
          // For teachers and admins, schoolId is required; for students, classId is required
          const isValidUser = parsedUser.role && parsedUser.userId && parsedUser.name && parsedUser.email && 
            ((parsedUser.role === 'student' && parsedUser.classId) || 
             ((parsedUser.role === 'teacher' || parsedUser.role === 'admin') && parsedUser.schoolId));
          
          if (isValidUser) {
            setUser(parsedUser);
          } else {
            // Invalid user data, clear it
            console.warn('Invalid user data in localStorage:', parsedUser);
            localStorage.removeItem('ionia_user');
          }
        }
      } catch (error) {
        console.error('Failed to load stored user:', error);
        // Clear invalid data
        localStorage.removeItem('ionia_user');
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredUser();
  }, []);

  const handleSetUser = (newUser: RoleUser) => {
    setUser(newUser);
    // Store in localStorage
    localStorage.setItem('ionia_user', JSON.stringify(newUser));
  };

  const clearRole = () => {
    setUser(null);
    localStorage.removeItem('ionia_user');
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