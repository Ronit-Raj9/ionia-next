"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useRole } from '@/contexts/RoleContext';
import { 
  BookOpen, 
  User, 
  LogOut, 
  Menu, 
  X, 
  MessageCircle,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [isLogoutDropdownOpen, setIsLogoutDropdownOpen] = useState(false);
  const logoutDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (logoutDropdownRef.current && !logoutDropdownRef.current.contains(event.target as Node)) {
        setIsLogoutDropdownOpen(false);
      }
    };

    if (isLogoutDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isLogoutDropdownOpen]);

  const handleLogoutConfirm = () => {
    clearRole();
    router.push('/');
    setIsMenuOpen(false);
    setIsLogoutDropdownOpen(false);
    toast.success('Logged out successfully');
  };

  const handleLogoutCancel = () => {
    setIsLogoutDropdownOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-emerald-700">IONIA</span>
          </Link>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{user.name || user.displayName || 'User'}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full capitalize">
                    {user.role}
                  </span>
                  {user.schoolId && (
                    <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full">
                      {user.schoolId?.toString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href="/profile"
                    className="p-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                    title="Profile"
                  >
                    <User className="w-5 h-5" />
                  </Link>
                  
                  {/* Logout Dropdown */}
                  <div className="relative" ref={logoutDropdownRef}>
                    <button
                      onClick={() => setIsLogoutDropdownOpen(!isLogoutDropdownOpen)}
                      className="p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 flex items-center space-x-1"
                      title="Logout"
                    >
                      <LogOut className="w-5 h-5" />
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLogoutDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Logout Confirmation Dropdown */}
                    <AnimatePresence>
                      {isLogoutDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-3 z-50"
                        >
                          <div className="px-4 py-2">
                            <p className="text-sm font-medium text-gray-900 mb-1">Do you want to logout?</p>
                            <p className="text-xs text-gray-500">You'll need to sign in again to access your account.</p>
                          </div>
                          <div className="flex items-center space-x-2 px-4 pt-2 border-t border-gray-100">
                            <button
                              onClick={handleLogoutConfirm}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Logout</span>
                            </button>
                            <button
                              onClick={handleLogoutCancel}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-6 py-2 rounded-lg transition-all duration-200 shadow-md"
                >
                  Login
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          {user && (
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            <div className="space-y-4">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2 py-2">
                    <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm text-gray-600">Loading...</span>
                  </div>
                </div>
              ) : user ? (
                <div className="space-y-2">
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
                  
                  {/* Mobile Logout Confirmation */}
                  <div className="space-y-2">
                    <button
                      onClick={() => setIsLogoutDropdownOpen(!isLogoutDropdownOpen)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-red-600 transition-colors duration-200 py-2 w-full text-left"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>Logout</span>
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-200 ${isLogoutDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <AnimatePresence>
                      {isLogoutDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 mb-1">Do you want to logout?</p>
                            <p className="text-xs text-gray-500">You'll need to sign in again to access your account.</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={handleLogoutConfirm}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Logout</span>
                            </button>
                            <button
                              onClick={handleLogoutCancel}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white px-4 py-3 rounded-lg transition-all duration-200 text-center font-medium shadow-md"
                  >
                    Login
                  </Link>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs text-gray-700 text-center">
                      <strong>Need an account?</strong> Contact your school administrator
                    </p>
                  </div>
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
                    <MessageCircle className="w-5 h-5 mr-2 text-emerald-600" />
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
                        ? 'bg-white text-emerald-600 shadow-sm'
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
                          ? 'bg-white text-emerald-600 shadow-sm'
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
                        ? 'bg-white text-emerald-600 shadow-sm'
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
