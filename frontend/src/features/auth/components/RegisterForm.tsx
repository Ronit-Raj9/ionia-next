"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser } from 'react-icons/hi';
import { useAuthStore } from '../store/authStore';
import { toast } from 'react-hot-toast';
import { GoogleLoginButton } from './GoogleLoginButton';

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
  });
  const router = useRouter();
  
  const { register, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, [clearError]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRegister = async (userData: typeof formData) => {
    try {
      const result = await register(userData);
      if (result.success) {
        toast.success('Registration successful! Please log in.');
        router.push('/login');
      } else {
        toast.error(result.error?.message || 'Registration failed.');
      }
    } catch (err) {
      toast.error('Registration failed. Please try again.');
      console.error('Registration failed:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }    
    await handleRegister(formData);
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
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/login"
              className="font-medium text-emerald-600 hover:text-emerald-500"
            >
              sign in to your account
            </Link>
          </p>
        </motion.div>

        <motion.form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          {error && (
            <motion.div
              className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              {error.message}
            </motion.div>
          )}

          <div className="space-y-4">
            {/* Full Name */}
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-3 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>
            {/* Username */}
            <div className="relative">
              <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="username"
                name="username"
                type="text"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-3 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
            {/* Email */}
            <div className="relative">
              <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-3 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            {/* Password */}
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(prev=>!prev)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
              </button>
            </div>
            {/* Confirm Password */}
            <div className="relative">
              <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                className="block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white/60 dark:bg-gray-700/60 backdrop-blur placeholder-gray-500 dark:placeholder-gray-400 pl-10 pr-10 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(prev=>!prev)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirmPassword ? <HiOutlineEyeOff className="h-5 w-5" /> : <HiOutlineEye className="h-5 w-5" />}
              </button>
            </div>
            {/* Accept Terms */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="acceptTerms"
                name="acceptTerms"
                checked={formData.acceptTerms}
                onChange={handleChange}
                className="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 text-sm text-gray-600 dark:text-gray-400">
                I accept the <Link href="/terms" className="underline text-emerald-600 hover:text-emerald-500">Terms of Service</Link> and <Link href="/privacy" className="underline text-emerald-600 hover:text-emerald-500">Privacy Policy</Link>
              </label>
            </div>
          </div>
          
          <div>
            <button
              type="submit"
              disabled={isLoading || !formData.acceptTerms}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white transition-all duration-200 ${
                isLoading || !formData.acceptTerms
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
                  <svg
                    className="h-5 w-5 text-emerald-500 group-hover:text-emerald-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
              )}
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
          
          {/* Divider */}
          <div className="flex items-center space-x-2 mt-2">
            <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
            <span className="text-xs text-gray-500 dark:text-gray-400">or continue with</span>
            <span className="h-px flex-1 bg-gray-300 dark:bg-gray-600"></span>
          </div>

          <div className="flex justify-center">
            <GoogleLoginButton
              onError={(error) => toast.error(error)}
              disabled={isLoading}
              className="w-full"
            />
          </div>
        </motion.form>

        <div className="mt-6">
          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            By signing up, you agree to our{' '}
            <Link href="/terms" className="font-medium text-emerald-600 hover:text-emerald-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="font-medium text-emerald-600 hover:text-emerald-500">
              Privacy Policy
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
