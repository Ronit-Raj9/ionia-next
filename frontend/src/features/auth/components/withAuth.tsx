// ==========================================
// 🛡️ HIGHER-ORDER COMPONENT FOR AUTH PROTECTION
// ==========================================

'use client';

import React, { ComponentType, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import type { UserRole, Permission } from '../types';

interface AuthOptions {
  requireAuth?: boolean;
  requiredRole?: UserRole | UserRole[];
  requiredPermissions?: Permission | Permission[];
  redirectTo?: string;
  fallback?: React.ComponentType;
}

interface WithAuthProps {
  [key: string]: any;
}

/**
 * Higher-order component for protecting routes with authentication and authorization
 */
export function withAuth<P extends WithAuthProps>(
  WrappedComponent: ComponentType<P>,
  options: AuthOptions = {}
) {
  const {
    requireAuth = true,
    requiredRole,
    requiredPermissions,
    redirectTo,
    fallback: FallbackComponent
  } = options;

  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const pathname = usePathname();
    const { 
      isInitialized, 
      isAuthenticated, 
      user, 
      hasRole, 
      hasPermission 
    } = useAuthStore();

    useEffect(() => {
      if (!isInitialized) return;

      // Check authentication requirement
      if (requireAuth && !isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname);
        const loginUrl = redirectTo || `/login?returnUrl=${returnUrl}`;
        router.push(loginUrl);
        return;
      }

      // Check role requirement
      if (requiredRole && (!user || !hasRole(requiredRole))) {
        if (FallbackComponent) {
          return;
        }
        router.push('/unauthorized');
        return;
      }

      // Check permission requirement
      if (requiredPermissions && (!user || !hasPermission(requiredPermissions))) {
        if (FallbackComponent) {
          return;
        }
        router.push('/unauthorized');
        return;
      }
    }, [
      isInitialized, 
      isAuthenticated, 
      user, 
      hasRole, 
      hasPermission, 
      pathname, 
      router
    ]);

    // Show loading during initialization
    if (!isInitialized) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      );
    }

    // Show fallback for unauthorized access
    if (requireAuth && !isAuthenticated) {
      return null; // Will redirect in useEffect
    }

    if (requiredRole && (!user || !hasRole(requiredRole))) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    if (requiredPermissions && (!user || !hasPermission(requiredPermissions))) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <WrappedComponent {...props} />;
  };
}

/**
 * Hook for checking authentication and authorization
 */
export function useAuthGuard(options: AuthOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    isInitialized, 
    isAuthenticated, 
    user, 
    hasRole, 
    hasPermission 
  } = useAuthStore();

  const {
    requireAuth = true,
    requiredRole,
    requiredPermissions,
    redirectTo
  } = options;

  useEffect(() => {
    if (!isInitialized) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      const returnUrl = encodeURIComponent(pathname);
      const loginUrl = redirectTo || `/login?returnUrl=${returnUrl}`;
      router.push(loginUrl);
      return;
    }

    // Check role requirement
    if (requiredRole && (!user || !hasRole(requiredRole))) {
      router.push('/unauthorized');
      return;
    }

    // Check permission requirement
    if (requiredPermissions && (!user || !hasPermission(requiredPermissions))) {
      router.push('/unauthorized');
      return;
    }
  }, [
    isInitialized, 
    isAuthenticated, 
    user, 
    hasRole, 
    hasPermission, 
    pathname, 
    router
  ]);

  return {
    isInitialized,
    isAuthenticated,
    user,
    hasRole,
    hasPermission,
    isAuthorized: !requireAuth || (isAuthenticated && 
      (!requiredRole || hasRole(requiredRole)) && 
      (!requiredPermissions || hasPermission(requiredPermissions)))
  };
}
