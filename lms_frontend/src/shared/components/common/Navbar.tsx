"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Menu, 
  X, 
  Settings,
  BarChart3,
  Brain,
  Upload,
  GraduationCap
} from 'lucide-react';

export default function Navbar() {
  const { user, clearRole, isLoading } = useRole();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    clearRole();
    router.push('/');
    setIsMenuOpen(false);
  };

  const teacherNavigation = [
    { name: 'Dashboard', href: '/teacher', icon: GraduationCap },
    { name: 'Create Assignment', href: '/teacher#create', icon: Upload },
  ];

  const studentNavigation = [
    { name: 'Assignments', href: '/student', icon: BookOpen },
    { name: 'Progress', href: '/student#progress', icon: BarChart3 },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Analytics', href: '/admin#analytics', icon: Brain },
    { name: 'System', href: '/admin#system', icon: Settings },
  ];

  const getNavigation = () => {
    if (!user) return [];
    
    switch (user.role) {
      case 'teacher':
        return teacherNavigation;
      case 'student':
        return studentNavigation;
      case 'admin':
        return adminNavigation;
      default:
        return [];
    }
  };

  const currentNavigation = getNavigation();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">EduFlow AI</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && currentNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{user.name || user.displayName}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full capitalize">
                    {user.role}
                  </span>
                  {user.email && (
                    <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className="p-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Select Role
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {user && currentNavigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200 py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              ))}
              
              {isLoading ? (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading...</span>
                  </div>
                </div>
              ) : user ? (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="text-sm text-gray-600 px-2">
                    Welcome, <span className="font-medium text-gray-900">{user.name || user.displayName}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full capitalize">
                      {user.role}
                    </span>
                    {user.email && (
                      <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200 py-2 w-full text-left"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <Link
                    href="/"
                    className="block bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-center"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Select Role
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
