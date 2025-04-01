"use client";

// admin/layout.tsx
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { Sidebar } from "@/components/admin/Sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-8 bg-gray-50">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
