"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/features/auth/store/authStore";
import Link from 'next/link';
import ErrorBoundary from '@/shared/components/ErrorBoundary';
import { Sidebar } from '@/features/admin/components/Sidebar';

// Simple User Dropdown Component
const SimpleUserDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    }
  };

  if (!user) return null;

  const displayName = user.username || user.fullName || user.email || 'User';
  const displayRole = user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-left p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          <span className="text-white font-medium text-sm">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{displayRole}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4 border-b">
              <p className="font-medium text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                {displayRole}
              </span>
            </div>
            <div className="py-2">
              <button
                onClick={() => {
                  router.push('/dashboard/profile');
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        </>
      )}
    </div>
  );
};

// Function to get page title based on pathname
const getPageTitle = (pathname: string): string => {
  if (pathname === '/admin') return 'Dashboard';
  if (pathname.startsWith('/admin/questions')) return 'Questions';
  if (pathname.startsWith('/admin/tests')) return 'Tests';
  if (pathname.startsWith('/admin/analytics')) return 'Analytics';
  if (pathname.startsWith('/admin/users')) return 'Users';
  if (pathname.startsWith('/admin/settings')) return 'Settings';
  return 'Admin Panel';
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isInitialized, isAuthenticated, user, hasRole } = useAuthStore();
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      const requiredRoles: ('admin' | 'superadmin')[] = ['admin', 'superadmin'];
      const hasRequiredRole = hasRole(requiredRoles);
      if (!hasRequiredRole) {
        router.push('/dashboard');
      }
    }
  }, [isInitialized, isAuthenticated, user, router]); // Remove hasRole dependency

  // While checking auth, show a loader
  if (!isInitialized || !isAuthenticated || !user) {
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

  // Check role access
  const requiredRoles: ('admin' | 'superadmin')[] = ['admin', 'superadmin'];
  if (!hasRole(requiredRoles)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f9fafb' }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You don't have permission to access the admin panel.</p>
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-800 underline">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <Sidebar isMinimized={isSidebarMinimized} onToggle={toggleSidebar} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-4">
                {/* Sidebar Toggle Button */}
                <button
                  onClick={toggleSidebar}
                  className="p-3 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 group shadow-sm bg-white"
                  title={isSidebarMinimized ? "Expand sidebar" : "Minimize sidebar"}
                  style={{ minWidth: '44px', minHeight: '44px' }}
                >
                  <span className="sr-only">Toggle sidebar</span>
                  <div className="relative flex items-center justify-center">
                    {isSidebarMinimized ? (
                      <svg 
                        className="h-6 w-6 transform transition-transform duration-200 group-hover:scale-110" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth="2.5" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                      </svg>
                    ) : (
                      <svg 
                        className="h-6 w-6 transform transition-transform duration-200 group-hover:scale-110" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        strokeWidth="2.5" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                      </svg>
                    )}
                  </div>
                </button>
                
                <h1 className="text-xl font-semibold text-gray-900">{getPageTitle(pathname)}</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <SimpleUserDropdown />
                </div>
                <div className="border-l border-gray-200 pl-4">
                  <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                    Back to App
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
