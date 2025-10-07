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
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import ChatInterface from '@/components/ChatInterface';
import ClassChat from '@/components/ClassChat';
import ClassManager from '@/components/ClassManager';
import { getUserDisplayName } from '@/lib/userUtils';

export default function Navbar() {
  const { user, clearRole, isLoading, setRole } = useRole();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isGeneralOpen, setIsGeneralOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'class' | 'manage'>('class');
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    schoolId: '',
  });

  const handleLogout = () => {
    clearRole();
    router.push('/');
    setIsMenuOpen(false);
  };

  const handleRoleSelect = (role: UserRole, mockUserId?: string) => {
    console.log('Role selected:', { role, mockUserId });
    try {
      if (role === 'student') {
        // For students, we still need the student ID selection
        setRole(role, mockUserId);
        setShowRoleSelection(false);
        redirectToRolePage(role);
      } else {
        // For teacher and admin, show the form
        setSelectedRole(role);
        setShowRoleSelection(false);
        setShowUserForm(true);
      }
    } catch (error) {
      console.error('Error in handleRoleSelect:', error);
      toast.error('Failed to select role. Please try again.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { userForm, selectedRole });
    
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.schoolId.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    // Basic school ID validation
    if (userForm.schoolId.length < 3) {
      toast.error('School ID must be at least 3 characters long');
      return;
    }

    if (!selectedRole) {
      console.error('No role selected');
      toast.error('Please select a role first');
      return;
    }

    // Generate mock user ID based on role
    let mockUserId: string;
    if (selectedRole === 'teacher') {
      mockUserId = 'teacher1';
    } else if (selectedRole === 'admin') {
      mockUserId = 'admin1';
    } else {
      // For students, generate a unique ID based on email
      mockUserId = `student_${userForm.email.replace(/[^a-zA-Z0-9]/g, '_')}`;
    }
    
    // Set role with user info
    setRole(selectedRole, mockUserId);
    
    // Store additional user info in localStorage
    localStorage.setItem('ionia_user_info', JSON.stringify({
      name: userForm.name,
      email: userForm.email,
      schoolId: userForm.schoolId,
      role: selectedRole,
      mockUserId: mockUserId,
    }));
    
    // Reset form and redirect
    setShowUserForm(false);
    setUserForm({ name: '', email: '', schoolId: '' });
    setSelectedRole(null);
    redirectToRolePage(selectedRole);
  };

  const handleFormCancel = () => {
    setShowUserForm(false);
    setUserForm({ name: '', email: '', schoolId: '' });
    setSelectedRole(null);
    setShowRoleSelection(true);
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
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Ionia</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {user && currentNavigation.map((item) => (
              item.onClick ? (
                <button
                  key={item.name}
                  onClick={item.onClick}
                  className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </button>
              ) : (
                <Link
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-1 text-gray-600 hover:text-emerald-600 transition-colors duration-200"
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
                <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm text-gray-600">Loading...</span>
              </div>
            ) : user ? (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Welcome, <span className="font-medium text-gray-900">{getUserDisplayName(user)}</span>
                  <span className="ml-2 px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-full capitalize">
                    {user.role}
                  </span>
                  {user.schoolId && (
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                      {user.schoolId}
                    </span>
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
                <button
                  onClick={() => setShowRoleSelection(true)}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  Select Role
                </button>
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
                item.onClick ? (
                  <button
                    key={item.name}
                    onClick={() => {
                      item.onClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200 py-2 w-full text-left"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center space-x-2 text-gray-600 hover:text-emerald-600 transition-colors duration-200 py-2"
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
                  <button
                    onClick={() => {
                      setShowRoleSelection(true);
                      setIsMenuOpen(false);
                    }}
                    className="block w-full bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 text-center"
                  >
                    Select Role
                  </button>
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
                      userId={user.mockUserId || ''}
                      userName={user.name || user.displayName || 'User'}
                      role={user.role as 'teacher' | 'student' | 'admin'}
                      classId={selectedClassId || user.classId}
                      isEmbedded={true}
                    />
                  )}
                  {user && activeTab === 'manage' && user.role === 'teacher' && (
                    <ClassManager
                      userId={user.mockUserId || ''}
                      userName={user.name || user.displayName || 'User'}
                      role={user.role}
                      schoolId={user.schoolId || ''}
                      onClassSelected={(classId) => {
                        setSelectedClassId(classId);
                        setActiveTab('class');
                      }}
                    />
                  )}
                  {user && activeTab === 'personal' && (
                    <ChatInterface
                      teacherId={user.mockUserId || ''}
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

      {/* Role Selection Modal */}
      {showRoleSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Choose Your Role
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Select how you'd like to experience Ionia
            </p>
            
            <div className="space-y-4">
              {/* Teacher Option */}
              <button
                onClick={() => handleRoleSelect('teacher')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200 flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Teacher</h3>
                  <p className="text-sm text-gray-600">Upload assignments and track student progress</p>
                </div>
              </button>

              {/* Student Option */}
              <button
                onClick={() => {
                  setSelectedRole('student');
                  setShowRoleSelection(false);
                  setShowUserForm(true);
                }}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Student</h3>
                  <p className="text-sm text-gray-600">Receive personalized assignments and submit answers</p>
                </div>
              </button>

              {/* Admin Option */}
              <button
                onClick={() => handleRoleSelect('admin')}
                className="w-full p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all duration-200 flex items-center space-x-4"
              >
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Admin</h3>
                  <p className="text-sm text-gray-600">View class analytics and manage system</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowRoleSelection(false)}
              className="w-full mt-6 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}

      {/* User Information Form Modal */}
      {showUserForm && selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            className="bg-white rounded-2xl p-8 max-w-md w-full mx-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              {selectedRole === 'teacher' ? 'Teacher Information' : 
               selectedRole === 'admin' ? 'Admin Information' : 'Student Information'}
            </h2>
            <p className="text-gray-600 mb-8 text-center">
              Please provide your details to continue
            </p>
            
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* School ID Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School ID *
                </label>
                <input
                  type="text"
                  value={userForm.schoolId}
                  onChange={(e) => setUserForm({ ...userForm, schoolId: e.target.value })}
                  placeholder="Enter your school ID (e.g., CBSE001, ICSE123, KENDRIYA001)"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This helps us organize users by school for better management
                </p>
              </div>

              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  placeholder="Enter your email address"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  type="submit"
                  className={`flex-1 py-3 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${
                    selectedRole === 'teacher' ? 'bg-emerald-500 hover:bg-emerald-600' :
                    selectedRole === 'student' ? 'bg-blue-500 hover:bg-blue-600' :
                    'bg-purple-500 hover:bg-purple-600'
                  }`}
                >
                  Continue as {selectedRole === 'teacher' ? 'Teacher' : 
                              selectedRole === 'admin' ? 'Admin' : 'Student'}
                </button>
                
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Back
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </nav>
  );
}
