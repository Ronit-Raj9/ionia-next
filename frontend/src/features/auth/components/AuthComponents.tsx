// ==========================================
// 🎨 AUTH COMPONENT LAYER - UI COMPONENTS
// ==========================================

'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore, useSessionStatus } from '../store/authStore';
import { authAPI } from '../api/authApi';
import type { UserRole, User } from '../types';

// ==========================================
// 👨‍💼 AUTH STATUS DISPLAY COMPONENT
// ==========================================

interface AuthStatusProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({
  showDetails = false,
  compact = false,
  className = '',
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const { isExpiring, formattedRemainingTime } = useSessionStatus();

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={`text-red-500 ${className}`}>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          Not Authenticated
        </span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`text-green-500 ${className}`}>
        <span className="flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          {user?.username || 'Authenticated'}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center text-green-500">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
        <span>Authenticated as <strong>{user?.username}</strong> ({user?.role})</span>
      </div>
      {showDetails && (
        <div className="pl-4 text-sm text-gray-600 dark:text-gray-400 border-l-2 border-gray-200 dark:border-gray-700">
          <p>Email: {user?.email}</p>
          <p>Token expires in: {formattedExpiry}</p>
          <p>Session expires in: {formattedRemainingTime}</p>
          <p>
            {shouldRefresh ? (
              <span className="text-yellow-500">Token should be refreshed.</span>
            ) : (
              <span className="text-green-500">Token is valid.</span>
            )}
          </p>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ⚠️ SESSION EXPIRATION WARNING COMPONENT
// ==========================================

interface SessionWarningProps {
  threshold?: number;
  onExtend?: () => void;
  onLogout?: () => void;
}

export const SessionWarning: React.FC<SessionWarningProps> = ({
  threshold = 5 * 60 * 1000, // 5 minutes
  onExtend,
  onLogout,
}) => {
  const { isExpiring, remainingTime, extendSession, endSession } = useSessionStatus();

  const handleExtend = () => {
    extendSession();
    if (onExtend) onExtend();
  };

  const handleLogout = () => {
    endSession();
    if (onLogout) onLogout();
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${parseInt(seconds) < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <AnimatePresence>
      {isExpiring && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-0 left-0 right-0 z-50 p-4 bg-yellow-100 dark:bg-yellow-900 border-b-2 border-yellow-400 dark:border-yellow-600"
        >
          <div className="container mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                 <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Your session is about to expire in {formatTime(remainingTime)}.
                </p>
              </div>
            </div>
            <div className="flex space-x-4">
              <motion.button
                onClick={handleExtend}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
              >
                Extend Session
              </motion.button>
              <motion.button
                onClick={handleLogout}
                whileHover={{ scale: 1.05 }}
                className="px-4 py-2 text-sm font-medium text-gray-900 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Logout
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 🏷️ ROLE BADGE COMPONENT
// ==========================================

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const getRoleConfig = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return {
          color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
          icon: '🛡️',
          label: 'Admin',
        };
      case 'superadmin':
        return {
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
          icon: '👑',
          label: 'Super Admin',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: '👤',
          label: 'User',
        };
    }
  };

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-base';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getRoleConfig(role);
  const sizeClasses = getSizeClasses(size);

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.color} ${sizeClasses} ${className}`}
    >
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
};

// ==========================================
// 👤 USER PROFILE DROPDOWN COMPONENT
// ==========================================

interface UserProfileDropdownProps {
  onProfileClick?: () => void;
  onSettingsClick?: () => void;
  onLogoutClick?: () => void;
  showRole?: boolean;
  className?: string;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  showRole = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuthStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const isSuperAdmin = user?.role === 'superadmin';

  const handleLogout = async () => {
    await logout();
    if (onLogoutClick) onLogoutClick();
    setIsOpen(false);
  };

  if (!user) return null;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 text-left w-full p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
          {user.avatar ? (
            <img src={user.avatar} alt={user.fullName} className="w-8 h-8 rounded-full" />
          ) : (
            <span className="text-white font-medium">
              {user.fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {user.fullName}
          </p>
          {showRole && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user.role}
            </p>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 z-50"
          >
            <div className="p-4 border-b dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-white font-medium">
                      {user.fullName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                  <RoleBadge role={user.role} size="sm" className="mt-1" />
                </div>
              </div>
            </div>

            <div className="py-2">
              <button
                onClick={() => {
                  if (onProfileClick) onProfileClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Your Profile
              </button>

              <button
                onClick={() => {
                  if (onSettingsClick) onSettingsClick();
                  setIsOpen(false);
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>

              {(isAdmin || isSuperAdmin) && (
                <button
                  onClick={() => {
                    window.location.href = '/admin';
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Admin Panel
                </button>
              )}
            </div>

            <div className="border-t dark:border-gray-700 py-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
              >
                <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// ==========================================
// 🚪 PERMISSION GATE COMPONENT
// ==========================================

interface PermissionGateProps {
  children: React.ReactNode;
  roles?: UserRole[];
  permissions?: string[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
  showFallback?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  roles,
  permissions,
  fallback,
  requireAll = false,
  showFallback = false,
}) => {
  const { user } = useAuthStore();

  // Check if user has required roles
  const hasRequiredRoles = () => {
    if (!roles || roles.length === 0) return true;
    if (!user?.role) return false;

    if (requireAll) {
      // User must have all roles (not practical but for completeness)
      return roles.includes(user.role);
    } else {
      // User must have at least one role
      return roles.includes(user.role);
    }
  };

  // Check if user has required permissions
  const hasRequiredPermissions = () => {
    if (!permissions || permissions.length === 0) return true;
    if (!user?.permissions) return false;

    if (requireAll) {
      // User must have all permissions
      return permissions.every(permission => user.permissions.includes(permission as any));
    } else {
      // User must have at least one permission
      return permissions.some(permission => user.permissions.includes(permission as any));
    }
  };

  const hasAccess = hasRequiredRoles() && hasRequiredPermissions();

  if (!hasAccess) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

// ==========================================
// 🔄 TOKEN REFRESH BUTTON
// ==========================================

export const TokenRefreshButton: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { performProactiveRefresh } = useAuthStore();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await performProactiveRefresh();
    } catch (error) {
      console.error('Token refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [performProactiveRefresh]);

  const { isSessionExpiring } = useSessionStatus();
  if (!isSessionExpiring) return null;

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 disabled:opacity-50 ${className}`}
    >
      {isRefreshing ? (
        <>
          <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Refreshing...
        </>
      ) : (
        <>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Token
        </>
      )}
    </button>
  );
};

