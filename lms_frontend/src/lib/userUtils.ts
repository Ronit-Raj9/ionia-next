/**
 * Utility functions for user data handling
 * Helps with the transition from mock/demo data to real user data
 */

import { User } from './db';

/**
 * Get display name for a user
 * Priority: name > displayName > formatted studentId
 */
export function getUserDisplayName(user: Partial<User> | null | undefined): string {
  if (!user) return 'Unknown User';
  
  // First priority: name field
  if (user.name && user.name.trim().length > 0) {
    return user.name;
  }
  
  // Second priority: displayName
  if (user.displayName && user.displayName.trim().length > 0) {
    return user.displayName;
  }
  
  // Third priority: email (extract name part)
  if (user.email && user.email.includes('@')) {
    const emailName = user.email.split('@')[0];
    return formatNameFromString(emailName);
  }
  
  // Fallback: format userId
  if (user.userId) {
    return formatNameFromMockId(user.userId);
  }
  
  return 'Unknown User';
}

/**
 * Get user initials for avatar display
 */
export function getUserInitials(user: Partial<User> | null | undefined): string {
  const displayName = getUserDisplayName(user);
  
  const parts = displayName.split(' ').filter(p => p.length > 0);
  
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return 'U';
}

/**
 * Format a readable name from studentId
 * Examples:
 *   teacher_demo_1 -> "Demo Teacher"
 *   student_ronitk964_gmail_com -> "Ronitk Kumar"
 *   admin_school_1 -> "School Admin"
 */
export function formatNameFromMockId(studentId: string): string {
  if (!studentId) return 'User';
  
  // Remove common prefixes and email parts
  let cleaned = studentId
    .replace(/^(teacher|student|admin)_/i, '')
    .replace(/_gmail_com|_yahoo_com|_email_com|_hotmail_com/gi, '')
    .replace(/\d{3,}/g, '') // Remove long number sequences
    .replace(/_/g, ' ')
    .trim();

  // Capitalize first letter of each word
  cleaned = cleaned
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  // If result is too short or empty, add role prefix
  if (cleaned.length < 3) {
    const roleMatch = studentId.match(/^(teacher|student|admin)/i);
    if (roleMatch) {
      const role = roleMatch[0].charAt(0).toUpperCase() + roleMatch[0].slice(1);
      cleaned = cleaned.length > 0 ? `${role} ${cleaned}` : role;
    }
  }

  return cleaned || 'User';
}

/**
 * Format name from any string (email prefix, username, etc.)
 */
export function formatNameFromString(str: string): string {
  if (!str) return 'User';
  
  let cleaned = str
    .replace(/[._-]/g, ' ')
    .replace(/\d{3,}/g, '') // Remove long numbers
    .trim();

  // Capitalize
  cleaned = cleaned
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return cleaned || 'User';
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const roleMap: Record<string, string> = {
    'teacher': 'Teacher',
    'student': 'Student',
    'admin': 'Administrator'
  };
  
  return roleMap[role.toLowerCase()] || role;
}

/**
 * Get user identifier (for backend APIs)
 * Priority: userId > studentId
 */
export function getUserId(user: Partial<User> | null | undefined): string | null {
  if (!user) return null;
  return user.userId || null;
}

/**
 * Check if user data is demo/mock data
 */
export function isLegacyUser(user: Partial<User>): boolean {
  return false; // All users now use the new system
}

/**
 * Get user email with fallback
 */
export function getUserEmail(user: Partial<User> | null | undefined): string {
  if (!user) return 'no-email@example.com';
  
  if (user.email && user.email.includes('@')) {
    return user.email;
  }
  
  // Generate fallback email from userId
  if (user.userId) {
    const sanitized = user.userId.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return `${sanitized}@school.edu`;
  }
  
  return 'no-email@example.com';
}
