// ==========================================
// 🛡️ PROTECTED ROUTE COMPONENT - ROUTE GUARDS
// ==========================================

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import type { UserRole, Permission } from '../types';

// ==========================================
// 🏷️ COMPONENT INTERFACES
// ==========================================

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: UserRole[];
  permissions?: Permission[];
  redirectTo?: string;
  fallback?: React.ReactNode;
  onUnauthorized?: () => void;
  showLoading?: boolean;
}

export interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface PermissionGuardProps {
  children: React.ReactNode;
  requiredPermissions: Permission[];
  requireAll?: boolean; // If true, user must have ALL permissions; if false, ANY permission
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export interface GuestOnlyProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

// ==========================================
// 🛡️ MAIN PROTECTED ROUTE COMPONENT
// ==========================================

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  roles,
  permissions,
  redirectTo = '/auth/login',
  fallback,
  onUnauthorized,
  showLoading = true,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, error } = useAuth({
    requireAuth,
    roles,
    permissions,
    redirectTo,
    onAuthError: onUnauthorized ? (error) => onUnauthorized() : undefined,
  });

  const [isChecking, setIsChecking] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuthorization = () => {
      // Wait for auth to initialize
      if (isLoading) {
        setIsChecking(true);
        return;
      }

      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        setIsAuthorized(false);
        setIsChecking(false);
        
        // Redirect with return URL
        const returnUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?returnUrl=${returnUrl}`);
        return;
      }

      // If auth not required, allow access
      if (!requireAuth) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }

      // Check role requirements
      if (roles && roles.length > 0 && user) {
        const hasRequiredRole = roles.includes(user.role);
        if (!hasRequiredRole) {
          setIsAuthorized(false);
          setIsChecking(false);
          onUnauthorized?.();
          return;
        }
      }

      // Check permission requirements
      if (permissions && permissions.length > 0 && user) {
        const hasRequiredPermissions = permissions.every(permission => 
          user.permissions.includes(permission)
        );
        if (!hasRequiredPermissions) {
          setIsAuthorized(false);
          setIsChecking(false);
          onUnauthorized?.();
          return;
        }
      }

      // All checks passed
      setIsAuthorized(true);
      setIsChecking(false);
    };

    checkAuthorization();
  }, [isLoading, isAuthenticated, user, requireAuth, roles, permissions, pathname, router, redirectTo, onUnauthorized]);

  // Show loading state
  if (isChecking && showLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return fallback || <UnauthorizedAccess />;
  }

  // Show error state
  if (error) {
    return <ErrorDisplay error={error} />;
  }

  // Render protected content
  return <>{children}</>;
};

// ==========================================
// 🎭 ROLE GUARD COMPONENT
// ==========================================

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  fallback,
  redirectTo,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !allowedRoles.includes(user.role)) {
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, redirectTo, router]);

  // Still loading
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return fallback || <UnauthorizedAccess />;
  }

  // Wrong role
  if (!allowedRoles.includes(user.role)) {
    return fallback || <InsufficientPermissions requiredRoles={allowedRoles} userRole={user.role} />;
  }

  return <>{children}</>;
};

// ==========================================
// 🔐 PERMISSION GUARD COMPONENT
// ==========================================

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  requiredPermissions,
  requireAll = true,
  fallback,
  redirectTo,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  const hasPermissions = React.useMemo(() => {
    if (!user || !user.permissions) return false;

    if (requireAll) {
      return requiredPermissions.every(permission => user.permissions.includes(permission));
    } else {
      return requiredPermissions.some(permission => user.permissions.includes(permission));
    }
  }, [user, requiredPermissions, requireAll]);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user && !hasPermissions) {
      if (redirectTo) {
        router.push(redirectTo);
      }
    }
  }, [isLoading, isAuthenticated, user, hasPermissions, redirectTo, router]);

  // Still loading
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Not authenticated
  if (!isAuthenticated || !user) {
    return fallback || <UnauthorizedAccess />;
  }

  // Insufficient permissions
  if (!hasPermissions) {
    return fallback || <InsufficientPermissions 
      requiredPermissions={requiredPermissions} 
      userPermissions={user.permissions} 
    />;
  }

  return <>{children}</>;
};

// ==========================================
// 👤 GUEST ONLY COMPONENT (for login/register pages)
// ==========================================

export const GuestOnly: React.FC<GuestOnlyProps> = ({
  children,
  redirectTo = '/dashboard',
  fallback,
}) => {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectTo);
    }
  }, [isLoading, isAuthenticated, redirectTo, router]);

  // Still loading
  if (isLoading) {
    return fallback || <LoadingSpinner />;
  }

  // Already authenticated
  if (isAuthenticated) {
    return fallback || <div>Redirecting...</div>;
  }

  return <>{children}</>;
};

// ==========================================
// 🎨 UI COMPONENTS
// ==========================================

const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

const UnauthorizedAccess: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 mx-auto mb-4 text-red-500">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Access Denied
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        You don't have permission to access this page. Please log in with appropriate credentials.
      </p>
      <button
        onClick={() => window.location.href = '/auth/login'}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Go to Login
      </button>
    </div>
  </div>
);

const InsufficientPermissions: React.FC<{
  requiredRoles?: UserRole[];
  userRole?: UserRole;
  requiredPermissions?: Permission[];
  userPermissions?: Permission[];
}> = ({ requiredRoles, userRole, requiredPermissions, userPermissions }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 mx-auto mb-4 text-orange-500">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Insufficient Permissions
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        You don't have the required permissions to access this resource.
      </p>
      {requiredRoles && (
        <div className="text-sm text-gray-500 mb-2">
          Required role(s): {requiredRoles.join(', ')}
        </div>
      )}
      {userRole && (
        <div className="text-sm text-gray-500 mb-4">
          Your role: {userRole}
        </div>
      )}
      {requiredPermissions && (
        <div className="text-sm text-gray-500 mb-2">
          Required permissions: {requiredPermissions.join(', ')}
        </div>
      )}
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Go Back
      </button>
    </div>
  </div>
);

const ErrorDisplay: React.FC<{ error: any }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="w-16 h-16 mx-auto mb-4 text-red-500">
        <svg fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Authentication Error
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {error.message || 'An error occurred while checking your authentication.'}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Retry
      </button>
    </div>
  </div>
);

// ==========================================
// 🔧 UTILITY HOOKS
// ==========================================

export const useRouteGuard = (
  requireAuth: boolean = true,
  roles?: UserRole[],
  permissions?: Permission[]
) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  
  const isAuthorized = React.useMemo(() => {
    if (isLoading) return null; // Still checking
    
    if (requireAuth && !isAuthenticated) return false;
    
    if (roles && roles.length > 0 && user && !roles.includes(user.role)) {
      return false;
    }
    
    if (permissions && permissions.length > 0 && user) {
      const hasPermissions = permissions.every(permission => 
        user.permissions.includes(permission)
      );
      if (!hasPermissions) return false;
    }
    
    return true;
  }, [isLoading, isAuthenticated, user, requireAuth, roles, permissions]);
  
  return {
    isAuthorized,
    isLoading,
    user,
    isAuthenticated,
  };
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export default ProtectedRoute;