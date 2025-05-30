'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { ClipLoader } from 'react-spinners';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('user' | 'admin' | 'superadmin')[];
  requireAll?: boolean;
  fallbackPath?: string;
  loadingComponent?: React.ReactNode;
  unauthorizedComponent?: React.ReactNode;
  minRole?: 'user' | 'admin' | 'superadmin';
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles,
  requireAll = false,
  fallbackPath = '/dashboard',
  loadingComponent,
  unauthorizedComponent,
  minRole,
}) => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hasRole, hasAnyRole } = useAuthStore();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuthorization = () => {
      // If not authenticated, redirect to login
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/login');
        return;
      }

      // If still loading or not authenticated, wait
      if (isLoading || !isAuthenticated || !user) {
        setIsAuthorized(null);
        return;
      }

      let authorized = false;

      // Check minimum role requirement
      if (minRole) {
        authorized = hasRole(minRole);
      }
      // Check if user has any of the allowed roles
      else if (requireAll) {
        // User must have all specified roles (useful for complex permissions)
        authorized = allowedRoles.every(role => hasRole(role));
      } else {
        // User must have at least one of the specified roles
        authorized = hasAnyRole(allowedRoles);
      }

      setIsAuthorized(authorized);

      // Redirect if not authorized
      if (!authorized) {
        router.push(fallbackPath);
      }
    };

    checkAuthorization();
  }, [user, isAuthenticated, isLoading, allowedRoles, requireAll, minRole, hasRole, hasAnyRole, router, fallbackPath]);

  // Show loading state
  if (isLoading || isAuthorized === null) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClipLoader color="#10B981" size={40} />
          <p className="mt-4 text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized state
  if (!isAuthorized) {
    return unauthorizedComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L4.732 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access this page.</p>
          <button
            onClick={() => router.push(fallbackPath)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Render children if authorized
  return <>{children}</>;
};

export default RoleGuard; 