// src/app/layout.tsx
"use client";
import '@/styles/globals.css'; // Your global styles

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/features/dashboard/components/Sidebar';
import { FiMenu } from 'react-icons/fi';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const router = useRouter();
  const { user, isAuthenticated, isInitialized } = useAuth();

  useEffect(() => {
    setIsSidebarOpen(!isMobile);
  }, [isMobile]);

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // Show a loader while checking for authentication
  if (!isInitialized || !isAuthenticated) {
     return (
       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '4px solid #f3f4f6',
          borderTop: '4px solid #10b981',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
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
          <Sidebar username={user?.fullName || 'Guest'} />
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
