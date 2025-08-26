"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  HomeIcon, 
  QuestionMarkCircleIcon, 
  DocumentTextIcon, 
  ChartBarIcon, 
  Cog6ToothIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: HomeIcon },
  { name: 'Questions', href: '/admin/questions', icon: QuestionMarkCircleIcon },
  { name: 'Tests', href: '/admin/tests', icon: DocumentTextIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Users', href: '/admin/users', icon: UserGroupIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

interface SidebarProps {
  isMinimized: boolean;
  onToggle: () => void;
}

export function Sidebar({ isMinimized, onToggle }: SidebarProps) {
  const pathname = usePathname();

  return (
    <div className={`sticky top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ${
      isMinimized ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 bg-white">
        {!isMinimized && (
          <h1 className="text-xl font-semibold text-gray-800">Admin Panel</h1>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-gray-50 hover:bg-gray-200 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 group shadow-sm"
          title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
          style={{ minWidth: '40px', minHeight: '40px' }}
        >
          <div className="relative flex items-center justify-center">
            {isMinimized ? (
              <svg 
                className="h-5 w-5 text-gray-700 group-hover:text-gray-900 transform transition-transform duration-200 group-hover:scale-110" 
                fill="none" 
                viewBox="0 0 24 24" 
                strokeWidth="2.5" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12l-7.5 7.5M3 12h18" />
              </svg>
            ) : (
              <svg 
                className="h-5 w-5 text-gray-700 group-hover:text-gray-900 transform transition-transform duration-200 group-hover:scale-110" 
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
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 group relative ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isMinimized ? item.name : ''}
            >
              <item.icon
                className={`h-5 w-5 ${
                  isMinimized ? 'mx-auto' : 'mr-3'
                } ${
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                }`}
                aria-hidden="true"
              />
              {!isMinimized && (
                <span className="transition-opacity duration-200">
                  {item.name}
                </span>
              )}
              
              {/* Tooltip for minimized state */}
              {isMinimized && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
} 