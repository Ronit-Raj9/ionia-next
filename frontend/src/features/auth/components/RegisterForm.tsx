"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser } from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import { useFormValidation } from '../store/validationStore';
import type { RegisterData } from '../types';
import { toast } from 'react-hot-toast';
import { authLogger } from '../utils/logger';

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error, clearError, checkUsername } = useAuthStore();
  
  // Use validation store
  const {
    values: formData,
    validation,
    setValue,
    setTouched,
    reset,
    isValid: isFormValid,
    isDirty,
    isTouched
  } = useFormValidation('registration', 'registration');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  // Username validation effect
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setIsUsernameAvailable(null);
      setUsernameMessage('');
      setUsernameError('');
      return;
    }

    const validateUsername = async () => {
      setIsCheckingUsername(true);
      setUsernameError('');
      setUsernameMessage('');
      
      try {
        const result = await checkUsername(formData.username);
        setIsUsernameAvailable(result.available);
        setUsernameMessage(result.message);
      } catch (error: any) {
        setIsUsernameAvailable(false);
        setUsernameError(error.message || 'Error checking username');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(validateUsername, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, checkUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    setValue(name, fieldValue);
  };

  const handleRegister = async () => {
    try {
      const result = await register(formData as RegisterData);
      if (result.success) {
        toast.success('Registration successful! Please log in.');
        router.push('/login');
      } else {
        toast.error(result.error?.message || 'Registration failed.');
      }
    } catch (err: any) {
      toast.error('Registration failed. Please try again.');
      authLogger.error('Registration failed', { error: err.message }, 'AUTH');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (!isFormValid) {
      toast.error("Please fix the validation errors before submitting");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }    
    await handleRegister();
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute left-[-150px] top-[-100px] w-[450px] h-[450px] bg-blue-200 opacity-20 rounded-full blur-3xl"
          animate={{ 
            x: [0, 40, 0],
            y: [0, -30, 0],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute right-[-100px] bottom-[-200px] w-[550px] h-[550px] bg-purple-200 opacity-15 rounded-full blur-3xl"
          animate={{ 
            x: [0, -50, 0],
            y: [0, 40, 0],
            scale: [1, 1.3, 1]
          }}
          transition={{ 
            duration: 28,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="absolute top-1/3 right-1/4 w-[250px] h-[250px] bg-gradient-to-br from-cyan-300 to-teal-300 opacity-12 rounded-full blur-2xl"
          animate={{ 
            rotate: [0, -360],
            scale: [1, 1.4, 1]
          }}
          transition={{ 
            duration: 35,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ 
          duration: 0.7,
          ease: "easeOut",
          type: "spring",
          stiffness: 80
        }}
        className="relative max-w-md w-full space-y-6 bg-white/85 dark:bg-gray-800/85 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 rounded-2xl shadow-2xl shadow-black/10 p-8 md:p-10"
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center space-y-4"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20"
          >
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </motion.div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create your account
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Join thousands of learners today
            </p>
          </div>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500 dark:text-gray-400">Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        <motion.form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="error"
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl shadow-sm"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.3, type: "spring", stiffness: 300 }}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {error.message?.includes('🌐') || error.message?.includes('network') || error.message?.includes('connect') ? (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : error.message?.includes('email') || error.message?.includes('exists') ? (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    ) : error.message?.includes('⏱️') || error.message?.includes('attempts') ? (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : error.message?.includes('CSRF') || error.message?.includes('csrf') ? (
                      <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-5">{error.message}</p>
                    {(error.message?.includes('🌐') || error.message?.includes('network') || error.message?.includes('connect')) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Make sure the backend server is running on port 8000
                      </p>
                    )}
                    {(error.message?.includes('CSRF') || error.message?.includes('csrf')) && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        Please refresh the page and try again
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-5">
            {/* Full Name */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="group"
            >
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-3.5 border border-gray-300 dark:border-gray-600 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                  placeholder="Enter your full name"
                  value={formData.fullName || ''}
                  onChange={handleChange}
                  onBlur={() => setTouched('fullName')}
                />
              </div>
            </motion.div>
            {/* Username */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="group"
            >
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineUser className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className={`block w-full pl-10 pr-12 py-3.5 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 ${
                    formData.username && isUsernameAvailable === true
                      ? 'border-green-400 focus:border-green-500 focus:ring-green-500/20 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40'
                      : formData.username && isUsernameAvailable === false
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40'
                      : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                  } placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white`}
                  placeholder="Choose a unique username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  onBlur={() => setTouched('username')}
                />
                
                {/* Username validation indicator */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUsername && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full"
                    />
                  )}
                  {!isCheckingUsername && formData.username && isUsernameAvailable === true && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 text-green-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                  )}
                  {!isCheckingUsername && formData.username && isUsernameAvailable === false && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 text-red-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </motion.svg>
                  )}
                </div>
                
                {/* Username validation message */}
                <AnimatePresence>
                  {formData.username && (usernameMessage || usernameError) && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`mt-2 text-sm flex items-center space-x-1 ${
                        isUsernameAvailable === true 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      <span>{usernameError || usernameMessage}</span>
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            {/* Email */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="group"
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineMail className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`block w-full pl-10 pr-3 py-3.5 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    validation.errors.length > 0 && isTouched
                      ? 'border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="Enter your email address"
                  value={formData.email || ''}
                  onChange={handleChange}
                  onBlur={() => setTouched('email')}
                />
                {validation.errors.length > 0 && isTouched && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors[0]}</p>
                )}
              </div>
            </motion.div>

            {/* Password */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="group"
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`block w-full pl-10 pr-12 py-3.5 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    validation.errors.length > 0 && isTouched
                      ? 'border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="Create a strong password"
                  value={formData.password || ''}
                  onChange={handleChange}
                  onBlur={() => setTouched('password')}
                />
                {validation.errors.length > 0 && isTouched && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors[0]}</p>
                )}
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowPassword(prev=>!prev)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                </motion.button>
              </div>
            </motion.div>

            {/* Confirm Password */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="group"
            >
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Confirm password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <HiOutlineLockClosed className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-200" />
                </div>
                <input
                  id="confirm-password"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`block w-full pl-10 pr-12 py-3.5 border placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    validation.errors.length > 0 && isTouched
                      ? 'border-red-500 dark:border-red-400 focus:ring-red-500/20 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500/20 focus:border-blue-500'
                  }`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword || ''}
                  onChange={handleChange}
                  onBlur={() => setTouched('confirmPassword')}
                />
                {validation.errors.length > 0 && isTouched && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors[0]}</p>
                )}
                <motion.button 
                  type="button" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowConfirmPassword(prev=>!prev)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  {showConfirmPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
                </motion.button>
              </div>
            </motion.div>
            {/* Accept Terms */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="flex items-start space-x-3"
            >
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms || false}
                onChange={handleChange}
                onBlur={() => setTouched('acceptTerms')}
                className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 border-gray-300 rounded transition-colors ${
                  validation.errors.length > 0 && isTouched
                    ? 'border-red-500 focus:ring-red-500'
                    : ''
                }`}
              />
              {validation.errors.length > 0 && isTouched && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{validation.errors[0]}</p>
              )}
              <label htmlFor="acceptTerms" className="text-sm text-gray-600 dark:text-gray-400 leading-5">
                I agree to the{' '}
                <Link href="/terms" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300">
                  Privacy Policy
                </Link>
              </label>
            </motion.div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <motion.button
              type="submit"
              disabled={isLoading || !isFormValid}
              whileHover={(!isLoading && isFormValid) ? { scale: 1.02 } : {}}
              whileTap={(!isLoading && isFormValid) ? { scale: 0.98 } : {}}
              className={`group relative w-full flex justify-center items-center py-3.5 px-6 border-0 text-sm font-semibold rounded-xl text-white transition-all duration-300 ${
                (isLoading || !isFormValid)
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 shadow-lg hover:shadow-xl'
              }`}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
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
                  <span>Creating account...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Create account</span>
                </div>
              )}
            </motion.button>
          </motion.div>
          
        </motion.form>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Your data is protected with end-to-end encryption</span>
          </div>

        </motion.div>
      </motion.div>
    </div>
  );
}
