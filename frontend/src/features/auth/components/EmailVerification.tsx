"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiCheckCircle, HiXCircle } from 'react-icons/hi';
import { authAPI } from '../api/authApi';

export default function EmailVerification() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (tokenParam) {
      setToken(tokenParam);
      handleVerifyEmail(tokenParam);
    }
  }, [searchParams]);

  const handleVerifyEmail = async (verificationToken: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      await authAPI.verifyEmail(verificationToken);
      setIsVerified(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?message=Email verified successfully. Please log in.');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await authAPI.sendEmailVerification();
      // Show success message
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    }
  };

  if (isVerified) {
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
          className="relative max-w-md w-full space-y-8 bg-white/70 dark:bg-gray-800/60 backdrop-blur-md border border-white/30 dark:border-gray-700 rounded-xl shadow-2xl p-10 text-center"
        >
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center space-y-4"
          >
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900">
              <HiCheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Email Verified!
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your email has been successfully verified. You will be redirected to the login page shortly.
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

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
          className="text-center"
        >
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <HiOutlineMail className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Verify Your Email
          </h2>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Please check your email and click the verification link to complete your registration.
          </p>
        </motion.div>

        {isVerifying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="flex items-center justify-center space-x-2">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Verifying your email...
              </span>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-3 rounded-md"
          >
            <div className="flex items-center space-x-2">
              <HiXCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          <button
            onClick={() => router.push('/login')}
            className="w-full flex justify-center items-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
          >
            Back to Login
          </button>
          
          <button
            onClick={handleResendVerification}
            className="w-full text-sm text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors duration-200"
          >
            Didn't receive the email? Resend verification
          </button>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-md p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Check your spam folder if you don't see the verification email in your inbox.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
