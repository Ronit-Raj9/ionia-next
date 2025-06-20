// src/app/layout.tsx
"use client";
import '@/styles/globals.css'; // Your global styles

import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/features/dashboard/components/Sidebar';
import { FiMenu } from 'react-icons/fi';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import Link from 'next/link';

import { useProtectedRoute } from '@/features/auth/hooks/useAuth';
import DashboardLoading from './loading';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isChecking, isAuthorized, user } = useProtectedRoute({ requireAuth: true });
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Close sidebar on mobile by default
  useEffect(() => {
    if (!isInitialized) {
      setIsSidebarOpen(!isMobile);
      setIsInitialized(true);
    }
  }, [isMobile, isInitialized]);

  // Handle sidebar toggle
  const toggleSidebar = useCallback(() => {
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

  if (isChecking) {
    return <DashboardLoading />;
  }

  if (!isAuthorized) {
    return null; // The hook redirects, so we render nothing.
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
          <Sidebar username={user?.fullName || user?.username || "User"} />
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
