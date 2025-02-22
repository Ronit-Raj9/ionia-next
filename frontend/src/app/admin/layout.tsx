// app/admin/layout.tsx

import Link from "next/link";
import React from "react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      {/* Sidebar */}
      <nav className="w-64 bg-gray-800 text-white h-screen p-4">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <ul className="space-y-2">
          <li>
            <Link href="/admin/questions" className="block py-2 px-4 hover:bg-gray-600 rounded">
              Manage Questions
            </Link>
          </li>
          <li>
            <Link href="/admin/tests" className="block py-2 px-4 hover:bg-gray-600 rounded">
              Manage Tests
            </Link>
          </li>
          <li>
            <Link href="/admin/tests/create" className="block py-2 px-4 hover:bg-gray-600 rounded">
              Create Test Series
            </Link>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">
        {/* Header */}
        <header className="mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-semibold text-primary">Test Series Management</h1>
          <div>
            {/* Log Out Button (optional functionality can be added) */}
            <button className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 transition-colors">
              Log Out
            </button>
          </div>
        </header>

        {/* Render children (admin-specific pages like the tests list, creation form, etc.) */}
        {children}
      </div>
    </div>
  );
}
