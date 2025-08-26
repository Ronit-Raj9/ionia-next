// src/app/layout.tsx
"use client";
import '@/styles/globals.css'; // Your global styles

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/features/dashboard/components/Sidebar';
import { FiMenu } from 'react-icons/fi';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { useAuthStore } from '@/features/auth/store/authStore';
import Link from 'next/link';
import { ClipLoader } from 'react-spinners';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Get auth state from store
  const user = useAuthStore(state => state.user);
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isLoading = useAuthStore(state => state.isLoading);
  const isInitialized = useAuthStore(state => state.isInitialized);
  const userRole = useAuthStore(state => state.userRole);

  // Authentication check and redirect
  useEffect(() => {
    if (isInitialized && !isLoading) {
      if (!isAuthenticated || !user) {
        console.log('User not authenticated, redirecting to login');
        router.push('/login');
        return;
      }
    }
  }, [isAuthenticated, user, isLoading, isInitialized, router]);

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Show loading while checking authentication
  if (isLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipLoader size={50} color="#10b981" />
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipLoader size={50} color="#10b981" />
          <p className="mt-4 text-gray-600">Redirecting to login...</p>
        </div>
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
          <Sidebar />
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
