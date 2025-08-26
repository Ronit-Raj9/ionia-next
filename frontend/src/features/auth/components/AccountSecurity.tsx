// frontend/src/features/auth/components/AccountSecurity.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

interface AccountSecurityProps {
  className?: string;
}

export const AccountSecurity: React.FC<AccountSecurityProps> = ({
  className = ''
}) => {
  const { user } = useAuthStore();
  const [providers, setProviders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadAuthProviders();
  }, []);

  const loadAuthProviders = async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getAuthProviders();
      setProviders(response.providers);
    } catch (error) {
      console.error('Failed to load auth providers:', error);
      setError('Failed to load authentication providers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!user?.hasPassword) {
      setError('You must set a password before unlinking your Google account');
      return;
    }

    if (!confirm('Are you sure you want to unlink your Google account? You will need to use your password to log in.')) {
      return;
    }

    setIsUnlinking(true);
    setError(null);
    setSuccess(null);

    try {
      await authAPI.unlinkGoogleAccount();
      setSuccess('Google account unlinked successfully');
      await loadAuthProviders(); // Refresh the list
    } catch (error) {
      console.error('Failed to unlink Google account:', error);
      setError(error instanceof Error ? error.message : 'Failed to unlink Google account');
    } finally {
      setIsUnlinking(false);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case 'email':
        return (
          <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
          </svg>
        );
      default:
        return (
          <div className="w-5 h-5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        );
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'google':
        return 'Google';
      case 'email':
        return 'Email & Password';
      default:
        return provider.charAt(0).toUpperCase() + provider.slice(1);
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Account Security
      </h3>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md"
          >
            {error}
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 rounded-md"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Authentication Methods
          </h4>
          
          <div className="space-y-3">
            {providers.map((provider) => (
              <motion.div
                key={provider}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getProviderIcon(provider)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {getProviderName(provider)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {provider === 'email' ? 'Password-based login' : 'OAuth login'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Active
                  </span>
                  
                  {provider === 'google' && (
                    <button
                      onClick={handleUnlinkGoogle}
                      disabled={isUnlinking || providers.length <= 1}
                      className={`
                        text-xs px-2 py-1 rounded border transition-colors duration-200
                        ${isUnlinking || providers.length <= 1
                          ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                          : 'text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-900/10'
                        }
                      `}
                    >
                      {isUnlinking ? 'Unlinking...' : 'Unlink'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {providers.length <= 1 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ You must have at least one authentication method. Add a password or link another account.
            </p>
          </div>
        )}

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Security Tips
          </h4>
          <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Use strong, unique passwords</li>
            <li>• Enable two-factor authentication when available</li>
            <li>• Keep your email address up to date</li>
            <li>• Review your login activity regularly</li>
          </ul>
        </div>
      </div>
    </motion.div>
  );
};

export default AccountSecurity;
