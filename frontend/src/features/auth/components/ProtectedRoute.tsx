// ==========================================
// 🛡️ SIMPLIFIED PROTECTED ROUTE
// ==========================================

'use client';

import React, { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import type { UserRole, Permission } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  redirectTo?: string;
  fallback?: ReactNode;
}

const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
);

const UnauthorizedPage = ({ requiredRole, userRole }: { requiredRole?: UserRole; userRole?: UserRole }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
        <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
      <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
      {requiredRole && (
        <p className="text-sm text-gray-500">
          Required: {requiredRole} | Your role: {userRole || 'none'}
        </p>
      )}
      <button
        onClick={() => window.history.back()}
        className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Go Back
      </button>
    </div>
  </div>
);

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  requiredRole,
  requiredPermissions = [],
  redirectTo,
  fallback,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, user, hasRole, hasPermission } = useAuthStore();

  useEffect(() => {
    if (!isInitialized) return;

    if (requireAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      const loginUrl = redirectTo || `/login?returnUrl=${returnUrl}`;
      router.push(loginUrl);
    }
  }, [isInitialized, isAuthenticated, requireAuth, pathname, redirectTo, router]);

  // Show loading during initialization
  if (!isInitialized) {
    return <LoadingSpinner />;
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Check role requirement
  if (requiredRole && (!user || !hasRole(requiredRole))) {
    if (fallback) return <>{fallback}</>;
    return <UnauthorizedPage requiredRole={requiredRole} userRole={user?.role} />;
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && !requiredPermissions.every(permission => hasPermission(permission))) {
    if (fallback) return <>{fallback}</>;
    return <UnauthorizedPage />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;