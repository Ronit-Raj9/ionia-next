"use client";

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff } from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import { GoogleLoginButton } from './GoogleLoginButton';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isInitialized } = useAuthStore();
  const hasRedirected = useRef(false);

  // Check cookie support on mount (only once)
  useEffect(() => {
    try {
      document.cookie = 'test_cookie=1; SameSite=Lax';
      const supported = document.cookie.indexOf('test_cookie=1') !== -1;
      document.cookie = 'test_cookie=1; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
      
      if (!supported) {
        setError('Cookies are required for login. Please enable cookies in your browser.');
      }
    } catch {
      setError('Cookies are required for login. Please enable cookies in your browser.');
    }
  }, []);

  // Clear errors when inputs change
  useEffect(() => {
    if (error && (email || password)) {
      setError('');
    }
  }, [email, password, error]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && isInitialized && !hasRedirected.current) {
      hasRedirected.current = true;
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      console.log('🔄 Already authenticated, redirecting to:', returnUrl);
      router.replace(returnUrl);
    }
  }, [isAuthenticated, isInitialized, router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isLoading) return;
    
    setError('');
    setIsLoading(true);

    try {
      // Check cookie support before attempting login
      try {
        document.cookie = 'test_cookie=1; SameSite=Lax';
        const supported = document.cookie.indexOf('test_cookie=1') !== -1;
        document.cookie = 'test_cookie=1; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
        
        if (!supported) {
          throw new Error('Cookies are required for authentication. Please enable cookies in your browser and try again.');
        }
      } catch {
        throw new Error('Cookies are required for authentication. Please enable cookies in your browser and try again.');
      }

      // Prepare credentials
      const credentials = {
        email: email.trim(),
        password,
        rememberMe,
      };

      console.log('🔐 Attempting login with cookie-based auth...');
      
      // Use the store login function directly
      const result = await login(credentials);
      
      if (result.success) {
        // Handle successful login - redirect
        const returnUrl = searchParams.get('returnUrl') || '/dashboard';
        console.log('✅ Login successful, redirecting to:', returnUrl);
        router.push(returnUrl);
      } else {
        setError(result.error?.message || 'Login failed. Please check your credentials.');
      }
      
    } catch (err: any) {
      console.error('❌ Login error:', err);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (err.message.includes('cookie')) {
        errorMessage = 'Please enable cookies in your browser and accept our cookie policy to login.';
      } else if (err.message.includes('network') || err.message.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (err.status === 401) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (err.status === 429) {
        errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute left-[-100px] top-[-150px] w-[300px] h-[300px] bg-emerald-300 opacity-30 rounded-full blur-3xl"></div>
        <div className="absolute right-[-120px] bottom-[-150px] w-[400px] h-[400px] bg-pink-300 opacity-20 rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative max-w-md w-full space-y-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-xl shadow-2xl p-10"
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/register"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              create a new account
            </Link>
          </p>
        </motion.div>

        {/* Login Form */}
        <motion.form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>{error}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="appearance-none relative block w-full pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:z-10 sm:text-sm transition-colors"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <HiOutlineEyeOff className="h-5 w-5" />
                ) : (
                  <HiOutlineEye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Forgot your password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                isLoading || !email || !password
                  ? 'bg-emerald-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              {isLoading ? (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="animate-spin h-5 w-5 text-emerald-300"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </span>
              ) : (
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <HiOutlineLockClosed className="h-5 w-5 text-emerald-500 group-hover:text-emerald-400" />
                </span>
              )}
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center space-x-2">
            <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
            <span className="text-xs text-gray-500 dark:text-gray-400">or continue with</span>
            <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
          </div>

          {/* Google Login */}
          <div className="flex justify-center">
            <GoogleLoginButton
              returnUrl={searchParams.get('returnUrl') || undefined}
              onError={(error) => setError(error)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </motion.form>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center text-xs text-gray-500 dark:text-gray-400"
        >
          🍪 This app uses secure cookies for authentication
        </motion.div>
      </motion.div>
    </div>
  );
}
