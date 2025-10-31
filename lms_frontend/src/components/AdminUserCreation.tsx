"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  Users,
  GraduationCap,
  Shield,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  UsersRound,
} from 'lucide-react';
import toast from 'react-hot-toast';
import BulkStudentCreation from './BulkStudentCreation';

interface AdminUserCreationProps {
  adminUserId: string;
  adminRole: string;
  schoolId: string;
}

interface GeneratedCredentials {
  userId: string;
  password: string;
  email: string;
  name: string;
  role: string;
}

export default function AdminUserCreation({
  adminUserId,
  adminRole,
  schoolId,
}: AdminUserCreationProps) {
  const [activeTab, setActiveTab] = useState<'teacher' | 'student' | 'bulk-students' | 'admin'>('teacher');
  const [loading, setLoading] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [generatedCredentials, setGeneratedCredentials] = useState<GeneratedCredentials | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch users for this school
  useEffect(() => {
    fetchUsers();
  }, [activeTab, schoolId]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await fetch(
        `/api/users/create?role=${adminRole}&schoolId=${schoolId}&targetRole=${activeTab}`
      );
      const data = await response.json();

      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorUserId: adminUserId,
          creatorRole: adminRole,
          creatorSchoolId: schoolId,
          targetRole: activeTab,
          targetSchoolId: schoolId,
          name: formData.name,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} created successfully!`);
        
        setGeneratedCredentials({
          userId: data.data.credentials.userId,
          password: data.data.credentials.password,
          email: data.data.credentials.email,
          name: formData.name,
          role: activeTab,
        });
        setShowCredentials(true);

        // Reset form
        setFormData({
          name: '',
          email: '',
          phoneNumber: '',
        });

        // Refresh users list
        fetchUsers();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'teacher':
        return <GraduationCap className="w-5 h-5" />;
      case 'student':
        return <Users className="w-5 h-5" />;
      case 'admin':
        return <Shield className="w-5 h-5" />;
      default:
        return <UserPlus className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('teacher')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'teacher'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Create Teacher</span>
          </button>
          <button
            onClick={() => setActiveTab('student')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'student'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Create Student</span>
          </button>
          <button
            onClick={() => setActiveTab('bulk-students')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'bulk-students'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <UsersRound className="w-4 h-4" />
            <span>Bulk Students</span>
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
              activeTab === 'admin'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Create Admin</span>
          </button>
        </nav>
      </div>

      {/* Bulk Students Tab */}
      {activeTab === 'bulk-students' ? (
        <BulkStudentCreation
          adminUserId={adminUserId}
          adminRole={adminRole}
          schoolId={schoolId}
          onComplete={fetchUsers}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Creation Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-6">
            {getRoleIcon(activeTab)}
            <h2 className="text-xl font-semibold text-gray-900">
              Create New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="+91 9876543210"
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> A unique User ID and password will be automatically generated for this user.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </>
              )}
            </button>
          </form>
        </div>

        {/* Users List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s in School
            </h2>
            <span className="text-sm text-gray-500">
              {users.length} {activeTab}
              {users.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loadingUsers ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {users.map((user) => (
                <div
                  key={user._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1 font-mono">{user.userId}</p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created: {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              {getRoleIcon(activeTab)}
              <p className="text-gray-500 mt-4">
                No {activeTab}s created yet.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Create your first {activeTab} using the form on the left.
              </p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Credentials Modal */}
      {showCredentials && generatedCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {generatedCredentials.role.charAt(0).toUpperCase() + generatedCredentials.role.slice(1)} Created!
                  </h3>
                  <p className="text-sm text-gray-600">Save these credentials</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCredentials(false);
                  setGeneratedCredentials(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> This is the only time you'll see the password.
                  Make sure to save it securely before closing this dialog.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedCredentials.userId}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedCredentials.userId)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedCredentials.password}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(generatedCredentials.password)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="text"
                  readOnly
                  value={generatedCredentials.email}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  readOnly
                  value={generatedCredentials.name}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
              </div>
            </div>

            <button
              onClick={() => {
                setShowCredentials(false);
                setGeneratedCredentials(null);
              }}
              className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              I've Saved the Credentials
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

