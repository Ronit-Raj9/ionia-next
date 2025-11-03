import crypto from 'crypto';
import { ObjectId } from 'mongodb';

/**
 * Generate a unique user ID based on role
 * Format: ROLE-YYYYMMDD-RANDOM
 * Examples: 
 * - SUPERADMIN-20250101-A1B2C3
 * - ADMIN-20250101-D4E5F6
 * - TEACHER-20250101-G7H8I9
 * - STUDENT-20250101-J0K1L2
 */
export function generateUserId(role: 'superadmin' | 'admin' | 'teacher' | 'student'): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  
  const rolePrefix = role.toUpperCase();
  return `${rolePrefix}-${dateStr}-${random}`;
}

/**
 * Generate a secure random password
 * Format: 8 characters with mix of uppercase, lowercase, numbers, and special chars
 * Example: Xk9@mP2q
 */
export function generatePassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '@#$%&*';
  
  // Ensure at least one of each type
  let password = '';
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill remaining with random characters from all sets
  const allChars = uppercase + lowercase + numbers + special;
  for (let i = 4; i < 8; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash a password using crypto
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify a password against a hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

/**
 * Generate a school ID
 * Format: SCHOOL-CITY-YYYYMMDD-RANDOM
 * Example: SCHOOL-DELHI-20250101-A1B2
 */
export function generateSchoolId(city: string): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  const cityClean = city.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10);
  
  return `SCHOOL-${cityClean}-${dateStr}-${random}`;
}

/**
 * Generate a class joining code
 * Format: 6 uppercase alphanumeric characters
 * Example: ABC123
 */
export function generateClassCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluded similar looking chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Get default permissions based on role
 */
export function getDefaultPermissions(role: 'superadmin' | 'admin' | 'teacher' | 'student', schoolId?: ObjectId) {
  switch (role) {
    case 'superadmin':
      return {
        canCreateSchools: true,
        canManageAllSchools: true,
        canCreateAdmins: true,
        canCreateTeachers: true,
        canCreateStudents: true,
        canManageClasses: true,
        canViewAllData: true,
      };
    
    case 'admin':
      return {
        canCreateSchools: false,
        canManageAllSchools: false,
        canCreateAdmins: true,
        canCreateTeachers: true,
        canCreateStudents: true,
        canManageClasses: true,
        canViewAllData: false,
        scopedToSchool: schoolId,
      };
    
    case 'teacher':
      return {
        canCreateSchools: false,
        canManageAllSchools: false,
        canCreateAdmins: false,
        canCreateTeachers: false,
        canCreateStudents: false,
        canManageClasses: true,
        canViewAllData: false,
        scopedToSchool: schoolId,
      };
    
    case 'student':
      return {
        canCreateSchools: false,
        canManageAllSchools: false,
        canCreateAdmins: false,
        canCreateTeachers: false,
        canCreateStudents: false,
        canManageClasses: false,
        canViewAllData: false,
        scopedToSchool: schoolId,
      };
  }
}

/**
 * Validate if a user has permission to perform an action
 */
export function validatePermission(
  userRole: 'superadmin' | 'admin' | 'teacher' | 'student',
  action: string,
  targetSchoolId?: string,
  userSchoolId?: string
): { allowed: boolean; reason?: string } {
  // Superadmin can do everything
  if (userRole === 'superadmin') {
    return { allowed: true };
  }
  
  // Check school scope for admin and teacher
  if ((userRole === 'admin' || userRole === 'teacher') && targetSchoolId && userSchoolId) {
    if (targetSchoolId !== userSchoolId) {
      return { 
        allowed: false, 
        reason: 'You do not have permission to access resources from another school' 
      };
    }
  }
  
  // Role-specific action validation (superadmin already handled above)
  switch (action) {
    case 'createSchool':
      // Only superadmin can create schools (already handled above)
      return { allowed: false, reason: 'Only superadmins can create schools' };
    
    case 'createAdmin':
      return userRole === 'admin'
        ? { allowed: true }
        : { allowed: false, reason: 'Only superadmins and admins can create admin accounts' };
    
    case 'createTeacher':
      return userRole === 'admin'
        ? { allowed: true }
        : { allowed: false, reason: 'Only superadmins and admins can create teacher accounts' };
    
    case 'createStudent':
      return userRole === 'admin'
        ? { allowed: true }
        : { allowed: false, reason: 'Only superadmins and admins can create student accounts' };
    
    case 'manageClass':
      return userRole === 'admin' || userRole === 'teacher'
        ? { allowed: true }
        : { allowed: false, reason: 'You do not have permission to manage classes' };
    
    case 'viewAllSchools':
      // Only superadmin can view all schools (already handled above)
      return { allowed: false, reason: 'Only superadmins can view all schools' };
    
    default:
      return { allowed: false, reason: 'Unknown action' };
  }
}

