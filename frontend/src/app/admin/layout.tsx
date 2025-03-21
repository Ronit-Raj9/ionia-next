// admin/layout.tsx
import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-box mt-10 other-container flex">
      {/* Sidebar */}
      <nav style={{ background: "linear-gradient(to bottom,rgb(15, 100, 46),rgb(217, 221, 189))" }} className="admin-box1 other-container mygreen w-64 bg-green-700 text-white h-screen p-4">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <ul>
          <li>
            <Link href="/admin/questions" className="block py-2 px-4 hover:bg-green-600 rounded">
              Manage Questions
            </Link>
          </li>
          <li>
            <Link href="/admin/tests" className="block py-2 px-4 hover:bg-green-600 rounded">
              Manage Tests
            </Link>
          </li>
          {/* Additional links */}
          <li>
            <Link href="/admin/tests/create" className="block py-2 px-4 hover:bg-green-600 rounded">
              Create Test Series
            </Link>
          </li>
        </ul>
      </nav>

      {/* Main Content Area */}
      <div className="admin-box2 mygray flex-1 p-6 bg-gray-100 min-h-screen">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h1 className="mytxtdim text-3xl font-semibold text-primary">Test Series Management</h1>
        </div>

        {/* Render children (pages content like the tests list, test creation form, etc.) */}
        {children}
      </div>
    </div>
  );
}
