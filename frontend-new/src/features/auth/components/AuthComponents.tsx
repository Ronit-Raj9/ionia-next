// ==========================================
// 🎨 AUTH COMPONENT LAYER - UI COMPONENTS
// ==========================================

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useSession, useTokenManager } from '../hooks/useAuth';
import type { UserRole, User } from '../stores/authStore';

// ==========================================
// 🔒 PROTECTED ROUTE COMPONENT
// ==========================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  roles?: UserRole[];
  redirectTo?: string;
  fallback?: React.ReactNode;
  requireEmailVerification?: boolean;
  showUnauthorizedMessage?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  roles,
  redirectTo = '/auth/login',
  fallback,
  requireEmailVerification = false,
  showUnauthorizedMessage = true,
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    user, 
    error 
  } = useAuth({
    requireAuth,
    roles,
    redirectTo,
    onAuthError: (error) => {
      console.warn('Auth error in protected route:', error);
    }
  });

  // Show loading state
  if (isLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center space-y-4"
        >
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
        </motion.div>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please log in to access this page.
          </p>
          <motion.a
            href={redirectTo}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign In
          </motion.a>
        </motion.div>
      </div>
    );
  }

  // Check email verification
  if (requireEmailVerification && user && !user.isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-6"
        >
          <div className="w-16 h-16 mx-auto mb-4 text-yellow-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Email Verification Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please verify your email address to access this page.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => {
              // Implement resend verification email
              console.log('Resend verification email');
            }}
          >
            Resend Verification Email
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Check role authorization
  if (roles && user && !roles.includes(user.role)) {
    if (!showUnauthorizedMessage) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Required role: {roles.join(' or ')} | Your role: {user.role}
          </p>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 text-red-500">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Authentication Error
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error.message}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retry
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // Render children if all checks pass
  return <>{children}</>;
};

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
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isExpiring, formattedRemainingTime } = useSession();
  const { formattedExpiry, shouldRefresh } = useTokenManager();

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
        <span className="font-medium">Authenticated as {user?.username}</span>
      </div>
      
      {showDetails && (
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <div>Role: <span className="font-medium">{user?.role}</span></div>
          <div>Email: <span className="font-medium">{user?.email}</span></div>
          <div>Session: <span className={isExpiring ? 'text-yellow-500' : 'text-green-500'}>{formattedRemainingTime}</span></div>
          <div>Token: <span className={shouldRefresh ? 'text-yellow-500' : 'text-green-500'}>{formattedExpiry}</span></div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// ⚠️ SESSION EXPIRY WARNING COMPONENT
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
  const [isVisible, setIsVisible] = useState(false);
  const { isExpiring, remainingTime, extendSession, endSession } = useSession({
    warningThreshold: threshold,
    onSessionExpiring: () => setIsVisible(true),
    onSessionExpired: () => {
      setIsVisible(false);
      endSession();
    },
  });

  const handleExtend = () => {
    extendSession();
    setIsVisible(false);
    onExtend?.();
  };

  const handleLogout = () => {
    setIsVisible(false);
    endSession();
    onLogout?.();
  };

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <AnimatePresence>
      {isVisible && isExpiring && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 right-4 z-50 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 shadow-lg max-w-sm"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Session Expiring Soon
              </h3>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-300">
                Your session will expire in {formatTime(remainingTime)}
              </p>
              <div className="mt-3 flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExtend}
                  className="text-sm bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-md hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors"
                >
                  Extend Session
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-800 dark:hover:text-yellow-200"
                >
                  Logout Now
                </motion.button>
              </div>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={() => setIsVisible(false)}
                className="text-yellow-400 hover:text-yellow-500"
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ==========================================
// 🎯 ROLE BADGE COMPONENT
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
      case 'superadmin':
        return {
          color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
          icon: '👑',
          label: 'Super Admin',
        };
      case 'admin':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
          icon: '🛡️',
          label: 'Admin',
        };
      case 'moderator':
        return {
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
          icon: '⚖️',
          label: 'Moderator',
        };
      case 'user':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          icon: '👤',
          label: 'User',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
          icon: '❓',
          label: role,
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

  return (
    <span className={`inline-flex items-center ${getSizeClasses(size)} ${config.color} rounded-full font-medium ${className}`}>
      {showIcon && <span className="mr-1">{config.icon}</span>}
      {config.label}
    </span>
  );
};

// ==========================================
// 👥 USER PROFILE DROPDOWN COMPONENT
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
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    onLogoutClick?.();
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <span className="text-white text-sm font-medium">
            {user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}
          </span>
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {user.fullName || user.username}
          </div>
          {showRole && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {user.role}
            </div>
          )}
        </div>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50"
          >
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.fullName || user.username}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onProfileClick?.();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                👤 Profile
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  onSettingsClick?.();
                }}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                ⚙️ Settings
              </button>
              
              <div className="border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  🚪 Sign Out
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
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
// 🔐 PERMISSION GATE COMPONENT
// ==========================================

interface PermissionGateProps {
  children: React.ReactNode;
  roles?: UserRole[];
  fallback?: React.ReactNode;
  requireAll?: boolean;
  showFallback?: boolean;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  roles,
  fallback,
  requireAll = false,
  showFallback = false,
}) => {
  const { user } = useAuth();

  if (!user) {
    return showFallback ? (fallback || null) : null;
  }

  if (!roles || roles.length === 0) {
    return <>{children}</>;
  }

  const hasPermission = requireAll
    ? roles.every(role => user.role === role)
    : roles.includes(user.role);

  if (!hasPermission) {
    return showFallback ? (fallback || null) : null;
  }

  return <>{children}</>;
};

// ==========================================
// 📤 EXPORTS
// ==========================================

export {
  ProtectedRoute as default,
  AuthStatus,
  SessionWarning,
  RoleBadge,
  UserProfileDropdown,
  PermissionGate,
};