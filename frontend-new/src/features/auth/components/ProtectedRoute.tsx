"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore'; 
import { ClipLoader } from 'react-spinners';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
  requireEmailVerification?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  redirectTo = '/auth/login',
  loadingComponent,
  requireEmailVerification = false,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      // If still loading authentication state, wait
      if (isLoading) {
        setIsChecking(true);
        return;
      }

      // If not authenticated, redirect to login with return URL
      if (!isAuthenticated) {
        const returnUrl = encodeURIComponent(pathname);
        router.push(`${redirectTo}?returnUrl=${returnUrl}`);
        return;
      }

      // If email verification is required and user email is not verified
      if (requireEmailVerification && user && !user.isEmailVerified) {
        router.push('/auth/verify-email');
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, isLoading, user, router, redirectTo, pathname, requireEmailVerification]);

  // Show loading state while checking authentication
  if (isLoading || isChecking) {
    return loadingComponent || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <ClipLoader color="#10B981" size={40} />
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // If we reach here, user is authenticated and can access the route
  return <>{children}</>;
};

export default ProtectedRoute; 