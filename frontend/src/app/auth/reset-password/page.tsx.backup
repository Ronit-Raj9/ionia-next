"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { API } from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";

const ResetPassword = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    // Get token from URL query parameter
    const tokenParam = searchParams?.get("token");
    console.log("Token from URL:", tokenParam);
    
    if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Reset token is missing. Please request a new password reset link.");
    }
  }, [searchParams]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Form validation
    if (!password) {
      setError("Please enter a new password");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (!token) {
      setError("Reset token is missing. Please request a new password reset link.");
      return;
    }
    
    try {
      setIsLoading(true);
      setError("");
      
      console.log("Sending reset password request with token:", token);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });
      
      if (!response.ok) {
        // Try to get error message from response
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Reset password response:", data);
      
      setMessage("Password has been reset successfully!");
      
      // Clear form
      setPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login");
      }, 3000);
      
    } catch (error: any) {
      console.error("Reset password error:", error);
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-emerald-100 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-6"
      >
        <Link href="/" className="inline-block">
          <span className="text-4xl font-bold text-emerald-600">Ionia</span>
        </Link>
      </motion.div>

      <motion.div 
        className="max-w-md w-full"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Reset Password</h2>
              <p className="mt-2 text-sm text-gray-600">
                Create a new password for your account
              </p>
            </div>
            
            {message && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-md bg-emerald-50 border border-emerald-200"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-emerald-800">{message}</p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">Redirecting to login page...</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-md bg-red-50 border border-red-200"
              >
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {!message && (
              <form onSubmit={handleResetPassword}>
                <div className="mb-6">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out"
                      placeholder="Enter new password"
                      required
                      minLength={8}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Password must be at least 8 characters long</p>
                </div>
                
                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 transition duration-150 ease-in-out"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <button
                    type="submit"
                    disabled={isLoading || !token}
                    className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isLoading || !token ? "bg-emerald-400" : "bg-emerald-600 hover:bg-emerald-700"
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200`}
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Resetting...
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
                
                <div className="text-center text-sm">
                  <p className="text-gray-600">
                    Remember your password?{" "}
                    <Link href="/auth/login" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-200">
                      Back to Login
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </div>
          
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              If your token has expired,{" "}
              <Link href="/auth/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-500">
                request a new reset link
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword; 