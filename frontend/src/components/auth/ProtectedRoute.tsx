"use client";

import { useEffect, ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/redux/store';
import { checkAuth } from '@/redux/slices/authSlice';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles = ['user', 'admin'] }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, user, loading } = useSelector((state: RootState) => state.auth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const verifyAuth = async () => {
      try {
        // Only check auth if we have a token and aren't already authenticated
        if (!isAuthenticated && localStorage.getItem('accessToken')) {
          await dispatch(checkAuth()).unwrap();
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        // Only redirect if component is still mounted
        if (mounted) {
          localStorage.setItem('redirectTo', window.location.pathname);
          router.replace('/auth/login');
        }
      } finally {
        if (mounted) {
          setIsChecking(false);
        }
      }
    };

    verifyAuth();

    return () => {
      mounted = false;
    };
  }, [dispatch, isAuthenticated, router]);

  // Show loading state only during initial check
  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-lg font-medium">Verifying authentication...</span>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated || !user) {
    // Save the current path for redirect after login
    localStorage.setItem('redirectTo', window.location.pathname);
    router.replace('/auth/login');
    return null;
  }

  // Check role-based access
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
          <p className="text-red-600">
            You do not have permission to access this page. Please contact an administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute; 