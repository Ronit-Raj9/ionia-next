"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { AuthErrorHandler } from '../utils/errorHandler';
import { authLogger } from '../utils/logger';
import { InputWithIcon } from './InputWithIcon';
import { PasswordInput } from './PasswordInput';

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginForm() {
  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isInitialized, isLoading } = useAuthStore();
  const hasRedirected = useRef(false);

  // Check cookie support on mount
  useEffect(() => {
    try {
      document.cookie = 'test_cookie=1; SameSite=Lax';
      const supported = document.cookie.indexOf('test_cookie=1') !== -1;
      document.cookie = 'test_cookie=1; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
      
      if (!supported) {
        setErrors({ general: 'Cookies are required for login. Please enable cookies in your browser.' });
      }
    } catch {
      setErrors({ general: 'Cookies are required for login. Please enable cookies in your browser.' });
    }
  }, []);

  // Clear errors when inputs change
  useEffect(() => {
    if (errors.email && form.email) {
      setErrors(prev => ({ ...prev, email: undefined }));
    }
    if (errors.password && form.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
    if (errors.general && (form.email || form.password)) {
      setErrors(prev => ({ ...prev, general: undefined }));
    }
  }, [form.email, form.password, errors]);

  // Handle authentication errors from URL parameters
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      authLogger.error('Auth error received from URL', { error }, 'AUTH');
      setErrors({ general: decodeURIComponent(error) });
      // Clean URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && isInitialized && !hasRedirected.current) {
      hasRedirected.current = true;
      const returnUrl = searchParams.get('returnUrl') || '/dashboard';
      authLogger.info('Already authenticated, redirecting', { returnUrl }, 'AUTH');
      router.replace(returnUrl);
    }
  }, [isAuthenticated, isInitialized, router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setForm(prev => ({
      ...prev,
      [name]: fieldValue,
    }));

    // Clear field-specific error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare credentials
      const credentials = {
        email: form.email.trim(),
        password: form.password,
        rememberMe: form.rememberMe,
      };

      authLogger.authFlow('login attempt started', { email: credentials.email });
      
      // Use the store login function directly
      const result = await login(credentials);
      
      if (result.success) {
        // Handle successful login - redirect
        const returnUrl = searchParams.get('returnUrl') || '/dashboard';
        authLogger.authFlow('login successful', { returnUrl });
        router.push(returnUrl);
      } else {
        setErrors({ general: result.error?.message || 'Login failed. Please check your credentials.' });
      }
      
    } catch (err: any) {
      authLogger.error('Login error occurred', { error: err.message }, 'AUTH');
      
      // Handle cookie-specific errors
      if (err.message.includes('cookie')) {
        setErrors({ general: 'Please enable cookies in your browser and accept our cookie policy to login.' });
        return;
      }
      
      // Use centralized error handler for other errors
      const authError = AuthErrorHandler.handleAuthError(err, { 
        action: 'login', 
        credentials: { email: form.email.trim() } 
      });
      
      setErrors({ general: AuthErrorHandler.getUserFriendlyMessage(authError) });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-md bg-white border border-gray-100 rounded-2xl shadow-lg p-6 sm:p-8"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-6"
          >
            <svg className="w-8 h-8 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </motion.div>
          
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            Sign in to continue your journey
          </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500">Don't have an account?</span>
            <Link
              href="/register"
              className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors duration-300"
            >
              Sign up
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            role="alert"
          >
            <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium">{errors.general}</p>
                {(errors.general.includes('🌐') || errors.general.includes('network') || errors.general.includes('connect')) && (
                  <p className="mt-1 text-xs text-red-600">
                    Make sure the backend server is running on port 8000
                  </p>
                )}
                {(errors.general.includes('CSRF') || errors.general.includes('csrf')) && (
                  <p className="mt-1 text-xs text-red-600">
                    Please refresh the page and try again
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <InputWithIcon
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="Enter your email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            autoComplete="email"
            disabled={isSubmitting || isLoading}
            required
          />

          <PasswordInput
            id="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            autoComplete="current-password"
            disabled={isSubmitting || isLoading}
            required
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                name="rememberMe"
                checked={form.rememberMe}
                onChange={handleChange}
                className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                disabled={isSubmitting || isLoading}
              />
              Remember me
            </label>
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-300"
            >
              Forgot password?
            </Link>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting || isLoading}
            whileHover={!isSubmitting && !isLoading ? { scale: 1.02 } : {}}
            whileTap={!isSubmitting && !isLoading ? { scale: 0.98 } : {}}
            className="w-full inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-emerald-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting || isLoading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing in...
              </>
            ) : (
              <>
                Sign in
              </>
            )}
          </motion.button>
        </form>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="text-center mt-8"
        >
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <span>Secured with industry-standard encryption</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}