// src/app/layout.tsx
"use client";
import '@/styles/globals.css'; // Your global styles

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/hooks/hooks';
import { RootState } from '@/redux/store';
import Sidebar from '@/components/dashboard/Sidebar';
import { FiMenu, FiX, FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useRouter, usePathname } from 'next/navigation';
import { getCurrentUser } from '@/redux/slices/authSlice';
import { ClipLoader } from 'react-spinners';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('Dashboard layout rendering');
  const dispatch = useAppDispatch();
  const router = useRouter();
  const pathname = usePathname();
  
  const { user, isAuthenticated, loading: authLoading, error: authError } = useAppSelector((state: RootState) => state.auth);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  console.log('Dashboard layout state:', { 
    user, 
    isAuthenticated, 
    authLoading, 
    isSidebarOpen, 
    isMobile,
    pathname 
  });

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated && !authLoading) {
      router.push('/auth/login');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  // Close sidebar on mobile by default
  useEffect(() => {
    if (!isInitialized) {
      console.log('Initializing sidebar state based on screen size');
      setIsSidebarOpen(!isMobile);
      setIsInitialized(true);
    }
  }, [isMobile, isInitialized]);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
    console.log('Toggling sidebar');
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Handle keyboard events for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSidebarOpen && isMobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSidebarOpen, isMobile]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (isMobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobile, isSidebarOpen]);

  // Handle retry authentication
  const handleRetry = useCallback(async () => {
    try {
      setIsRetrying(true);
      setLayoutError(null);
      await dispatch(getCurrentUser()).unwrap();
      console.log('Authentication retry successful');
    } catch (err) {
      console.error('Authentication retry failed:', err);
      setLayoutError('Authentication retry failed. Please try again later.');
    } finally {
      setIsRetrying(false);
    }
  }, [dispatch]);

  // Memoize the username to prevent unnecessary re-renders
  const username = useMemo(() => {
    // Check if user is in the expected IUser format with username property
    if (user && 'username' in user) {
      return user.username;
    }
    
    // Check for nested data structure
    if (user && typeof user === 'object' && 'data' in user) {
      const userData = user as { data?: { username?: string } };
      return userData.data?.username || 'Guest';
    }
    
    return 'Guest';
  }, [user]);

  // Show loading state during initial authentication
  if (authLoading && !isAuthenticated && !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <ClipLoader size={40} color="#10b981" />
        <h2 className="mt-4 text-lg font-semibold text-gray-700">Verifying your session...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Header */}
      <header className="hidden md:flex bg-white shadow-sm py-4 px-6 justify-between items-center">
        <Link href="/" className="text-xl font-bold text-emerald-600">
          Ionia
        </Link>
        <Link href="/" className="text-gray-600 hover:text-emerald-600">
          Back to Home
        </Link>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 transform transition-transform duration-300 ease-in-out
          fixed md:sticky top-0 left-0 z-30 h-screen w-64
          bg-white shadow-md overflow-y-auto
        `}>
          <Sidebar username={username} />
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 relative min-h-screen overflow-hidden">
          {/* Mobile Header */}
          {isMobile && !isSidebarOpen && (
            <header className="sticky top-0 z-20 bg-white shadow-sm py-4 px-6 flex justify-between items-center md:hidden">
              <Link href="/" className="text-xl font-bold text-emerald-600">
                Ionia
              </Link>
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md hover:bg-gray-100"
              >
                <FiMenu size={24} />
              </button>
            </header>
          )}

          {children}

          {/* Mobile Overlay */}
          {isSidebarOpen && isMobile && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
        </main>
      </div>
    </div>
  );
}
