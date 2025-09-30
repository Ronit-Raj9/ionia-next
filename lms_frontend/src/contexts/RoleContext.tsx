"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getUserDisplayName } from '@/lib/userUtils';

export type UserRole = 'teacher' | 'student' | 'admin';

export interface RoleUser {
  role: UserRole;
  mockUserId: string; // Legacy field - for backward compatibility
  userId?: string; // New user ID
  name: string; // Full name (Required)
  email: string; // Email (Required)
  displayName?: string; // Optional display name
  classId: string;
  schoolId?: string;
  profileImage?: string;
  phoneNumber?: string;
  status?: 'active' | 'inactive' | 'suspended';
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

// Generate default display names (fallback only)
const getDefaultName = (role: UserRole, id: string): string => {
  switch (role) {
    case 'teacher':
      return 'Teacher';
    case 'admin':
      return 'Administrator';
    case 'student':
      return 'Student';
    default:
      return 'User';
  }
};

// Generate default email (fallback only)
const getDefaultEmail = (role: UserRole, id: string): string => {
  const sanitizedId = id.replace(/[^a-z0-9]/gi, '').toLowerCase();
  switch (role) {
    case 'teacher':
      return `${sanitizedId}@teacher.school.edu`;
    case 'admin':
      return `${sanitizedId}@admin.school.edu`;
    case 'student':
      return `${sanitizedId}@student.school.edu`;
    default:
      return `${sanitizedId}@school.edu`;
  }
};

// Generate unique user ID - NO HARDCODED DEFAULTS
const generateMockUserId = (role: UserRole, customId?: string): string => {
  if (customId) return customId;
  
  // Generate unique ID with timestamp
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  
  switch (role) {
    case 'teacher':
      return `teacher_${timestamp}_${random}`;
    case 'admin':
      return `admin_${timestamp}_${random}`;
    case 'student':
      return `student_${timestamp}_${random}`;
    default:
      return `${role}_${timestamp}_${random}`;
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
            parsed.schoolId = userInfo.schoolId;
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
    
    // Check if there's additional user info in localStorage
    let additionalInfo: any = {};
    if (typeof window !== 'undefined') {
      try {
        const storedUserInfo = localStorage.getItem('ionia_user_info');
        if (storedUserInfo) {
          additionalInfo = JSON.parse(storedUserInfo);
        }
      } catch (error) {
        console.error('Error reading user info from localStorage:', error);
      }
    }
    
    // Create user with required name and email fields
    // Use stored info if available, otherwise use defaults
    const newUser: RoleUser = {
      role,
      mockUserId: generatedMockUserId,
      userId: additionalInfo.userId || generatedMockUserId,
      name: additionalInfo.name || getDefaultName(role, generatedMockUserId),
      email: additionalInfo.email || getDefaultEmail(role, generatedMockUserId),
      displayName: additionalInfo.name || getDefaultName(role, generatedMockUserId),
      classId: additionalInfo.classId || 'unassigned', // Must be assigned to real class
      schoolId: additionalInfo.schoolId,
      profileImage: additionalInfo.profileImage,
      phoneNumber: additionalInfo.phoneNumber,
      status: additionalInfo.status || 'active',
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


export default RoleContext;
