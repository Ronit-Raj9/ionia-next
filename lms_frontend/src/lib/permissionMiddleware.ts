import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS, User } from '@/lib/db';
import { ObjectId } from 'mongodb';
import { validatePermission } from '@/lib/authUtils';

/**
 * Permission middleware for API routes
 * Validates user permissions before allowing access to resources
 */

export interface PermissionCheckOptions {
  requiredRole?: 'superadmin' | 'admin' | 'teacher' | 'student' | Array<'superadmin' | 'admin' | 'teacher' | 'student'>;
  requireSchoolMatch?: boolean;
  requireClassMatch?: boolean;
  action?: string;
  customValidation?: (user: User, params: any) => Promise<{ allowed: boolean; reason?: string }>;
}

/**
 * Extract user information from request parameters
 */
export async function getUserFromRequest(req: NextRequest): Promise<User | null> {
  try {
    // Try to get user info from query params or body
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const role = searchParams.get('role');

    if (!userId && !role) {
      return null;
    }

    // In a production system, you would verify this with a session token/JWT
    // For now, we trust the client-provided userId
    const { db } = await connectToDatabase();
    const usersCollection = db.collection<User>(COLLECTIONS.USERS);

    const user = await usersCollection.findOne({ userId: userId || undefined });
    return user;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}

/**
 * Check if user has required permissions
 */
export async function checkPermissions(
  user: User | null,
  options: PermissionCheckOptions,
  params?: any
): Promise<{ allowed: boolean; reason?: string }> {
  if (!user) {
    return { allowed: false, reason: 'User not authenticated' };
  }

  // Check if user account is active
  if (user.status === 'inactive' || user.status === 'suspended') {
    return { allowed: false, reason: `Account is ${user.status}` };
  }

  // Check required role
  if (options.requiredRole) {
    const allowedRoles = Array.isArray(options.requiredRole) 
      ? options.requiredRole 
      : [options.requiredRole];
    
    if (!allowedRoles.includes(user.role)) {
      return { 
        allowed: false, 
        reason: `This action requires ${allowedRoles.join(' or ')} role. You are ${user.role}.` 
      };
    }
  }

  // Check school scope
  if (options.requireSchoolMatch && params?.schoolId) {
    if (user.role === 'superadmin') {
      // Superadmin can access any school
      return { allowed: true };
    }

    if (!user.schoolId) {
      return { allowed: false, reason: 'User is not assigned to a school' };
    }

    const userSchoolId = user.schoolId.toString();
    const targetSchoolId = params.schoolId.toString();

    if (userSchoolId !== targetSchoolId) {
      return { 
        allowed: false, 
        reason: 'You do not have permission to access resources from another school' 
      };
    }
  }

  // Check class scope
  if (options.requireClassMatch && params?.classId) {
    if (user.role === 'superadmin' || user.role === 'admin') {
      // Superadmin and admin can access any class in their scope
      return { allowed: true };
    }

    if (user.role === 'teacher') {
      // Teachers can only access classes they created
      // This would need to be checked against the classes collection
      const { db } = await connectToDatabase();
      const classesCollection = db.collection(COLLECTIONS.CLASSES);
      
      const classData = await classesCollection.findOne({
        _id: new ObjectId(params.classId),
        teacherId: user.userId
      });

      if (!classData) {
        return { 
          allowed: false, 
          reason: 'You do not have permission to access this class' 
        };
      }
    }

    if (user.role === 'student') {
      // Students can only access classes they're enrolled in
      const { db } = await connectToDatabase();
      const classesCollection = db.collection(COLLECTIONS.CLASSES);
      
      const classData = await classesCollection.findOne({
        _id: new ObjectId(params.classId),
        studentIds: { $in: [user.userId] }
      });

      if (!classData) {
        return { 
          allowed: false, 
          reason: 'You are not enrolled in this class' 
        };
      }
    }
  }

  // Check action permission
  if (options.action) {
    const result = validatePermission(
      user.role,
      options.action,
      params?.schoolId,
      user.schoolId?.toString()
    );

    if (!result.allowed) {
      return result;
    }
  }

  // Custom validation
  if (options.customValidation) {
    const result = await options.customValidation(user, params);
    if (!result.allowed) {
      return result;
    }
  }

  return { allowed: true };
}

/**
 * Middleware wrapper for API routes
 * Usage:
 * 
 * export async function GET(req: NextRequest) {
 *   return withPermissions(req, {
 *     requiredRole: ['admin', 'teacher'],
 *     requireSchoolMatch: true
 *   }, async (user) => {
 *     // Your API logic here
 *     return NextResponse.json({ success: true });
 *   });
 * }
 */
export async function withPermissions(
  req: NextRequest,
  options: PermissionCheckOptions,
  handler: (user: User, params: any) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    // Get user from request
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }

    // Extract params from request
    const searchParams = req.nextUrl.searchParams;
    const params: any = {};
    searchParams.forEach((value, key) => {
      params[key] = value;
    });

    // Check permissions
    const permissionCheck = await checkPermissions(user, options, params);

    if (!permissionCheck.allowed) {
      return NextResponse.json({
        success: false,
        error: permissionCheck.reason || 'Permission denied'
      }, { status: 403 });
    }

    // Execute handler
    return await handler(user, params);

  } catch (error) {
    console.error('Permission middleware error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * Quick permission check functions for components
 */
export const can = {
  /**
   * Check if user can create schools
   */
  createSchools: (userRole: string): boolean => {
    return userRole === 'superadmin';
  },

  /**
   * Check if user can create admins
   */
  createAdmins: (userRole: string): boolean => {
    return userRole === 'superadmin' || userRole === 'admin';
  },

  /**
   * Check if user can create teachers
   */
  createTeachers: (userRole: string): boolean => {
    return userRole === 'superadmin' || userRole === 'admin';
  },

  /**
   * Check if user can create students
   */
  createStudents: (userRole: string): boolean => {
    return userRole === 'superadmin' || userRole === 'admin';
  },

  /**
   * Check if user can manage classes
   */
  manageClasses: (userRole: string): boolean => {
    return userRole === 'superadmin' || userRole === 'admin' || userRole === 'teacher';
  },

  /**
   * Check if user can view all schools
   */
  viewAllSchools: (userRole: string): boolean => {
    return userRole === 'superadmin';
  },

  /**
   * Check if user can access specific school
   */
  accessSchool: (userRole: string, userSchoolId: string | undefined, targetSchoolId: string): boolean => {
    if (userRole === 'superadmin') return true;
    if (!userSchoolId) return false;
    return userSchoolId === targetSchoolId;
  },

  /**
   * Check if user can access specific class
   */
  accessClass: async (
    userRole: string, 
    userId: string, 
    classId: string
  ): Promise<boolean> => {
    if (userRole === 'superadmin') return true;

    try {
      const { db } = await connectToDatabase();
      const classesCollection = db.collection(COLLECTIONS.CLASSES);

      if (userRole === 'admin') {
        // Admin can access any class in their school
        return true; // School check should be done separately
      }

      if (userRole === 'teacher') {
        // Teacher can access classes they created
        const classData = await classesCollection.findOne({
          _id: new ObjectId(classId),
          teacherId: userId
        });
        return !!classData;
      }

      if (userRole === 'student') {
        // Student can access classes they're enrolled in
        const classData = await classesCollection.findOne({
          _id: new ObjectId(classId),
          studentIds: { $in: [userId] }
        });
        return !!classData;
      }

      return false;
    } catch (error) {
      console.error('Error checking class access:', error);
      return false;
    }
  },

  /**
   * Check if user can grade submissions
   */
  gradeSubmissions: (userRole: string): boolean => {
    return userRole === 'superadmin' || userRole === 'admin' || userRole === 'teacher';
  },

  /**
   * Check if user can view analytics
   */
  viewAnalytics: (userRole: string): boolean => {
    return userRole === 'superadmin' || userRole === 'admin' || userRole === 'teacher';
  },
};

/**
 * Helper to format permission denied errors
 */
export function permissionDeniedResponse(reason?: string): NextResponse {
  return NextResponse.json({
    success: false,
    error: reason || 'You do not have permission to perform this action'
  }, { status: 403 });
}

/**
 * Helper to format unauthorized errors
 */
export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Authentication required'
  }, { status: 401 });
}

