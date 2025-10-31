"use client";

import React, { useState } from 'react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Shield,
  Mail,
  Phone,
  Building2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const { user, clearRole } = useRole();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [loading, setLoading] = useState(false);

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordForm),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Password changed successfully! Please login again with your new password.');
        
        // Reset form
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        // Logout user to force re-login with new password
        setTimeout(async () => {
          await clearRole();
          router.push('/login');
        }, 2000);
      } else {
        toast.error(data.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: 'None', color: 'gray', percentage: 0 };

    let score = 0;
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 15;
    if (/[A-Z]/.test(password)) score += 20;
    if (/[a-z]/.test(password)) score += 20;
    if (/[0-9]/.test(password)) score += 20;
    if (/[@#$%&*]/.test(password)) score += 20;

    if (score < 40) return { strength: 'Weak', color: 'red', percentage: score };
    if (score < 70) return { strength: 'Fair', color: 'yellow', percentage: score };
    if (score < 90) return { strength: 'Good', color: 'blue', percentage: score };
    return { strength: 'Strong', color: 'green', percentage: score };
  };

  const passwordStrength = getPasswordStrength(passwordForm.newPassword);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Not Logged In</h1>
          <p className="text-gray-600 mb-4">You need to be logged in to view your profile.</p>
          <button
            onClick={() => router.push('/login')}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>

          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.name || user.displayName}</h1>
              <p className="text-gray-600 flex items-center space-x-2">
                <span className="capitalize px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {user.role}
                </span>
                <span className="text-sm">{user.email}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'info'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="w-5 h-5" />
              <span>Account Information</span>
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === 'password'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Lock className="w-5 h-5" />
              <span>Change Password</span>
            </button>
          </nav>
        </div>

        {/* Account Information Tab */}
        {activeTab === 'info' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Account Information</h2>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    Full Name
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.name || user.displayName || 'Not set'}
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4 mr-2 text-gray-500" />
                    Email Address
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                    {user.email || 'Not set'}
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <Shield className="w-4 h-4 mr-2 text-gray-500" />
                    Role
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <span className="capitalize px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                      {user.role}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4 mr-2 text-gray-500" />
                    User ID
                  </label>
                  <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm">
                    {user.userId || 'Not set'}
                  </div>
                </div>

                {user.phoneNumber && (
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      Phone Number
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {user.phoneNumber}
                    </div>
                  </div>
                )}

                {user.schoolId && (
                  <div>
                    <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                      <Building2 className="w-4 h-4 mr-2 text-gray-500" />
                      School ID
                    </label>
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 font-mono text-sm">
                      {user.schoolId?.toString()}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-emerald-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-emerald-700">
                    <p className="font-medium mb-1">Account Details</p>
                    <p>To update your email or name, please contact your administrator.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Tab */}
        {activeTab === 'password' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Change Password</h2>

            <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
              {/* Current Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showNewPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {passwordForm.newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Password Strength:</span>
                      <span className={`text-xs font-medium text-${passwordStrength.color}-600`}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 bg-${passwordStrength.color}-500`}
                        style={{ width: `${passwordStrength.percentage}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                <div className="mt-3 space-y-1">
                  <p className="text-xs font-medium text-gray-600 mb-2">Password must contain:</p>
                  <div className="space-y-1">
                    <div className="flex items-center text-xs">
                      {passwordForm.newPassword.length >= 8 ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                      )}
                      <span className={passwordForm.newPassword.length >= 8 ? 'text-green-700' : 'text-gray-600'}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {/[A-Z]/.test(passwordForm.newPassword) ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                      )}
                      <span className={/[A-Z]/.test(passwordForm.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {/[a-z]/.test(passwordForm.newPassword) ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                      )}
                      <span className={/[a-z]/.test(passwordForm.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {/[0-9]/.test(passwordForm.newPassword) ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                      )}
                      <span className={/[0-9]/.test(passwordForm.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                        One number
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      {/[@#$%&*]/.test(passwordForm.newPassword) ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2" />
                      )}
                      <span className={/[@#$%&*]/.test(passwordForm.newPassword) ? 'text-green-700' : 'text-gray-600'}>
                        One special character (@#$%&*)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>

                {/* Password Match Indicator */}
                {passwordForm.confirmPassword && (
                  <div className="mt-2">
                    {passwordForm.newPassword === passwordForm.confirmPassword ? (
                      <div className="flex items-center text-xs text-green-600">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Passwords match
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-red-600">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Passwords do not match
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium mb-1">Important:</p>
                    <p>After changing your password, you will be logged out and need to login again with your new password.</p>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={loading || passwordForm.newPassword !== passwordForm.confirmPassword}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg transition-all duration-200 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Change Password</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Form
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

