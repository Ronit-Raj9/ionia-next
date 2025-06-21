"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, usePermissions } from "@/features/auth/hooks/useAuth";
import { UserProfileDropdown } from "@/features/auth/components";
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isInitialized, isAuthenticated, user } = useAuth();
  const { hasAnyRole } = usePermissions();
  const requiredRoles: ('admin' | 'superadmin')[] = ['admin', 'superadmin'];

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push('/login');
    }
  }, [isInitialized, isAuthenticated, router]);

  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      if (!hasAnyRole(requiredRoles)) {
        router.push('/dashboard'); // Redirect to a safe page
      }
    }
  }, [isInitialized, isAuthenticated, user, hasAnyRole, router]);

  // While checking auth, show a loader
  if (!isInitialized || !isAuthenticated || !user || !hasAnyRole(requiredRoles)) {
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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/admin">
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <nav className="hidden md:flex space-x-4">
                <Link href="/admin/users" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Users</Link>
                <Link href="/admin/tests" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Tests</Link>
                <Link href="/admin/questions" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Questions</Link>
                <Link href="/admin/analytics" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">Analytics</Link>
              </nav>
              <div className="border-l border-gray-200 pl-4">
                <UserProfileDropdown />
              </div>
               <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100">
                  Back to App
                </Link>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
