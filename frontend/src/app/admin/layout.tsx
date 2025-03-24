"use client";

// admin/layout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  QuestionMarkCircleIcon, 
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: HomeIcon },
    { name: 'Questions', href: '/admin/questions', icon: QuestionMarkCircleIcon },
    { name: 'Tests', href: '/admin/tests', icon: ClipboardDocumentListIcon },
    { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
    { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <div className="w-64 bg-green-800 text-white flex-shrink-0 min-h-screen">
          <div className="h-full flex flex-col">
            <div className="flex items-center h-16 px-4 bg-green-900">
              <h1 className="text-xl font-bold">Admin Panel</h1>
            </div>
            <nav className="flex-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg 
                      transition-all duration-200 cursor-pointer select-none
                      ${isActive 
                        ? 'bg-green-700 text-white shadow-sm' 
                        : 'text-green-100 hover:bg-green-700/50 active:bg-green-700/70'
                      }`}
                  >
                    <item.icon 
                      className={`h-5 w-5 mr-3 transition-colors duration-200
                        ${isActive 
                          ? 'text-white' 
                          : 'text-green-200 group-hover:text-white'
                        }`} 
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-gray-50 min-h-screen">
          <div className="w-full h-full p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
