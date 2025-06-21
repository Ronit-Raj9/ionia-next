// ==========================================
// 🎨 AUTH COMPONENT LAYER - UI COMPONENTS
// ==========================================

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth, useSession, useTokenManager } from '../hooks/useAuth';
import type { UserRole, User } from '../store/authStore';

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
  const { isExpiring, remainingTime, extendSession, endSession } = useSession({
    warningThreshold: threshold,
  });

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
        return 'px-2 py-0.5 text-xs';
      case 'lg':
        return 'px-3 py-1.5 text-base';
      default:
        return 'px-2.5 py-1 text-sm';
    }
  };

  const config = getRoleConfig(role);

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${config.color} ${getSizeClasses(size)} ${className}`}
    >
      {showIcon && <span className="mr-1.5">{config.icon}</span>}
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
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    if (onLogoutClick) onLogoutClick();
  };

  return (
    <div className={`relative ${className}`}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3"
        whileTap={{ scale: 0.95 }}
      >
        <img
          className="h-10 w-10 rounded-full"
          src={user.avatar || `https://ui-avatars.com/api/?name=${user.username}&background=random`}
          alt="User avatar"
        />
        <div className="text-left">
          <p className="font-semibold text-gray-800 dark:text-white">{user.fullName || user.username}</p>
          {showRole && <RoleBadge role={user.role} size="sm" showIcon={false} />}
        </div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10"
          >
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); if(onProfileClick) onProfileClick(); setIsOpen(false); }}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Your Profile
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); if(onSettingsClick) onSettingsClick(); setIsOpen(false); }}
              className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Settings
            </a>
            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); handleLogout(); setIsOpen(false); }}
              className="block px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900"
            >
              Logout
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ==========================================
// 🚪 PERMISSION GATE COMPONENT
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
    return showFallback ? <>{fallback}</> : null;
  }

  const userRoles = [user.role];
  const hasPermission = requireAll
    ? roles?.every(r => userRoles.includes(r))
    : roles?.some(r => userRoles.includes(r));

  if (roles && !hasPermission) {
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};