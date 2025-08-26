// ==========================================
// 🛡️ PROTECTED ROUTE COMPONENT
// ==========================================

'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore, useAuthPermissions } from '../store/authStore';
import type { UserRole, Permission } from '../types';

// ==========================================
// 🎯 PROTECTED ROUTE INTERFACE
// ==========================================

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  fallback?: ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  loading?: ReactNode;
  unauthorized?: ReactNode;
}

// ==========================================
// 🎨 DEFAULT COMPONENTS
// ==========================================

const DefaultLoadingComponent: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center space-y-4"
    >
      <div className="relative">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto"></div>
        <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-400 rounded-full animate-ping mx-auto"></div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TestSeries</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">Verifying access...</p>
    </motion.div>
  </div>
);

const DefaultUnauthorizedComponent: React.FC<{
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  userRole?: UserRole;
}> = ({ requiredRole, requiredPermissions, userRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="text-center space-y-6 p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-md rounded-xl shadow-xl border border-red-200 dark:border-red-700 max-w-md mx-4"
    >
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900">
        <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          You don't have permission to access this page.
        </p>
        
        {requiredRole && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <span className="font-medium">Required role:</span> {requiredRole}
              {userRole && (
                <>
                  <br />
                  <span className="font-medium">Your role:</span> {userRole}
                </>
              )}
            </p>
          </div>
        )}
        
        {requiredPermissions && requiredPermissions.length > 0 && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-md p-3 mb-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              <span className="font-medium">Missing permissions:</span>
            </p>
            <ul className="text-xs text-red-600 dark:text-red-300 mt-1 list-disc list-inside">
              {requiredPermissions.map((permission, index) => (
                <li key={index}>{permission}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        <button
          onClick={() => window.history.back()}
          className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="w-full px-4 py-2 border border-gray-300 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </motion.div>
  </div>
);

// ==========================================
// 🛡️ MAIN PROTECTED ROUTE COMPONENT
// ==========================================

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = [],
  fallback,
  redirectTo,
  requireAuth = true,
  allowedRoles = [],
  loading,
  unauthorized,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitialized, isLoading, isAuthenticated, user } = useAuthStore();
  const {
    hasRole,
    hasPermission,
    canAccess,
    isMinimumRole,
  } = useAuthPermissions();

  // ==========================================
  // 🔄 ROUTE PROTECTION LOGIC
  // ==========================================

  useEffect(() => {
    // Don't redirect during initialization or loading
    if (!isInitialized || isLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      const loginUrl = redirectTo || `/login?returnUrl=${returnUrl}`;
      router.push(loginUrl);
      return;
    }

    // If user is authenticated but access checks fail, handle in render
  }, [
    isInitialized,
    isLoading,
    isAuthenticated,
    requireAuth,
    pathname,
    redirectTo,
    router,
  ]);

  // ==========================================
  // 🎯 ACCESS CONTROL CHECKS
  // ==========================================

  const checkAccess = (): { hasAccess: boolean; reason?: string } => {
    // If auth is not required, allow access
    if (!requireAuth) {
      return { hasAccess: true };
    }

    // If not authenticated, deny access
    if (!isAuthenticated || !user) {
      return { hasAccess: false, reason: 'not_authenticated' };
    }

    // Check specific role requirement
    if (requiredRole) {
      if (!hasRole(requiredRole) && !isMinimumRole(requiredRole)) {
        return { hasAccess: false, reason: 'insufficient_role' };
      }
    }

    // Check allowed roles
    if (allowedRoles.length > 0 && !allowedRoles.some(role => hasRole(role))) {
      return { hasAccess: false, reason: 'role_not_allowed' };
    }

    // Check permission requirements
    if (requiredPermissions.length > 0 && !requiredPermissions.every(permission => hasPermission(permission))) {
      return { hasAccess: false, reason: 'insufficient_permissions' };
    }

    return { hasAccess: true };
  };

  // ==========================================
  // 📱 RENDER LOGIC
  // ==========================================

  // Show loading during initialization
  if (!isInitialized || isLoading) {
    return loading || <DefaultLoadingComponent />;
  }

  // Perform access control check
  const { hasAccess, reason } = checkAccess();

  // If access is denied, show appropriate fallback
  if (!hasAccess) {
    // If a custom fallback is provided, use it
    if (fallback) {
      return <>{fallback}</>;
    }

    // If unauthorized component is provided, use it
    if (unauthorized) {
      return <>{unauthorized}</>;
    }

    // Use default unauthorized component
    return (
      <DefaultUnauthorizedComponent
        requiredRole={requiredRole}
        requiredPermissions={requiredPermissions}
        userRole={user?.role}
      />
    );
  }

  // Access granted, render children
  return <>{children}</>;
};

// ==========================================
// 🎯 ROLE-SPECIFIC ROUTE COMPONENTS
// ==========================================

export const AdminRoute: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute
    requiredRole="admin"
    fallback={fallback}
  >
    {children}
  </ProtectedRoute>
);

export const SuperAdminRoute: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute
    requiredRole="superadmin"
    fallback={fallback}
  >
    {children}
  </ProtectedRoute>
);

export const UserRoute: React.FC<{
  children: ReactNode;
  fallback?: ReactNode;
}> = ({ children, fallback }) => (
  <ProtectedRoute
    requireAuth={true}
    fallback={fallback}
  >
    {children}
  </ProtectedRoute>
);

export const PublicRoute: React.FC<{
  children: ReactNode;
}> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);

// ==========================================
// 🎯 HIGHER-ORDER COMPONENT
// ==========================================

export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  const WrappedComponent = (props: T) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );

  WrappedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// ==========================================
// 📤 EXPORTS
// ==========================================

export default ProtectedRoute;

export type {
  ProtectedRouteProps,
}; 