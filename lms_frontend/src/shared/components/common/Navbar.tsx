"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRole, UserRole } from '@/contexts/RoleContext';
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
  GraduationCap,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import ClassChat from '@/components/ClassChat';
import ClassManager from '@/components/ClassManager';

export default function Navbar() {
  const { user, clearRole, isLoading } = useRole();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'class' | 'manage'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  const handleLogout = () => {
    clearRole();
    router.push('/');
    setIsMenuOpen(false);
  };


  const redirectToRolePage = (role: UserRole) => {
    switch (role) {
      case 'teacher':
        router.push('/teacher');
        break;
      case 'student':
        router.push('/student');
        break;
      case 'admin':
        router.push('/admin');
        break;
      default:
        router.push('/dashboard');
    }
  };

  const teacherNavigation = [
    { name: 'Dashboard', href: '/teacher', icon: GraduationCap },
    { name: 'Create Assignment', href: '/teacher#create', icon: Upload },
    { name: 'General', href: '#', icon: MessageCircle, onClick: () => setIsGeneralOpen(true) },
  ];

  const studentNavigation = [
    { name: 'Assignments', href: '/student', icon: BookOpen },
    { name: 'Progress', href: '/student#progress', icon: BarChart3 },
    { name: 'General', href: '#', icon: MessageCircle, onClick: () => setIsGeneralOpen(true) },
  ];

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: BarChart3 },
    { name: 'Analytics', href: '/admin#analytics', icon: Brain },
    { name: 'System', href: '/admin#system', icon: Settings },
    { name: 'General', href: '#', icon: MessageCircle, onClick: () => setIsGeneralOpen(true) },
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
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">IONIA</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && currentNavigation.map((item) => (
              item.onClick ? (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              )
            ))}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{user.name || user.displayName || 'User'}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full capitalize">
                    {user.role}
                  </span>
                  {user.schoolId && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {user.schoolId?.toString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
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
                  href="/register"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg transition-all duration-200"
                >
                  Register
                </Link>
                <Link
                  href="/login"
                  className="bg-white hover:bg-gray-50 text-blue-600 border border-blue-600 px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 text-gray-600 hover:text-blue-600 transition-colors duration-200"
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
                item.onClick ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      item.onClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 py-2 w-full text-left"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 py-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              ))}
              
              {isLoading ? (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading...</span>
                  </div>
                </div>
              ) : user ? (
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="text-sm text-gray-600 px-2">
                    Welcome, <span className="font-medium text-gray-900">{user.name || user.displayName}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full capitalize">
                      {user.role}
                    </span>
                    {user.email && (
                      <div className="text-xs text-gray-500 mt-1">{user.email}</div>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 py-2"
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
                    href="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-center"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full bg-white hover:bg-gray-50 text-blue-600 border border-emerald-600 px-4 py-2 rounded-lg transition-colors duration-200 text-center"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* General Chat Modal */}
      {isGeneralOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Background overlay */}
            <div 
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              onClick={() => setIsGeneralOpen(false)}
            ></div>

            {/* Modal panel */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full" style={{ overflow: activeTab === 'manage' ? 'visible' : 'hidden' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-blue-600" />
                    General Chat
                  </h3>
                  <button
                    onClick={() => setIsGeneralOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setActiveTab('class')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'class'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Class Chat
                  </button>
                  {user?.role === 'teacher' && (
                    <button
                      onClick={() => setActiveTab('manage')}
                      className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'manage'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Manage Classes
                    </button>
                  )}
                  <button
                    onClick={() => setActiveTab('personal')}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === 'personal'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Personal Notes
                  </button>
                </div>
                
                {/* Chat Interface Content */}
                <div className={`h-96 border border-gray-200 rounded-lg ${activeTab === 'manage' ? 'overflow-visible' : 'overflow-auto'}`}>
                  {user && activeTab === 'class' && (
                    <ClassChat
                      userId={user.userId || ''}
                      userName={user.name || user.displayName || 'User'}
                      role={user.role as 'teacher' | 'student' | 'admin'}
                      classId={selectedClassId || user.classId}
                      isEmbedded={true}
                    />
                  )}
                  {user && activeTab === 'manage' && user.role === 'teacher' && (
                    <ClassManager
                      userId={user.userId || ''}
                      userName={user.name || user.displayName || 'User'}
                      role={user.role}
                      schoolId={user.schoolId?.toString() || ''}
                      onClassSelected={(classId) => {
                        setSelectedClassId(classId);
                        setActiveTab('class');
                      }}
                    />
                  )}
                  {user && activeTab === 'personal' && (
                    <ChatInterface
                      teacherId={user.userId || ''}
                      classId={user.classId || ''}
                      role={user.role || ''}
                      isEmbedded={true}
                      onAssignmentCreated={() => {
                        console.log('Assignment created from General chat');
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
}
