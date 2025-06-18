"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '../../lib/api/auth';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCookieWarning, setShowCookieWarning] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if cookies are enabled
    const checkCookies = () => {
      try {
        // Try to set a test cookie
        document.cookie = "testcookie=1; SameSite=None; Secure";
        const cookiesEnabled = document.cookie.indexOf("testcookie=") !== -1;
        
        // Check if user has given cookie consent
        const hasConsent = localStorage.getItem('cookieConsent') !== null;
        
        setShowCookieWarning(!cookiesEnabled || !hasConsent);
      } catch (e) {
        setShowCookieWarning(true);
      }
    };
    
    checkCookies();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Use the enhanced loginUser function from auth.ts
      const response = await loginUser(email, password);
      
      if (response.accessToken) {
        // Store token in localStorage only as a fallback
        localStorage.setItem('accessToken', response.accessToken);
        
        // Let the server set the cookies via Set-Cookie header
        // The API response will handle setting the cookies properly
        
        // Navigate to dashboard
        router.push('/dashboard');
      } else {
        throw new Error('Authentication failed. No access token received.');
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      
      if (err instanceof Error) {
        // Check for specific error types
        if (err.message.includes('cookies')) {
          setShowCookieWarning(true);
          setError("Please enable cookies in your browser and accept our cookie policy to login.");
        } else if (err.message.includes('network')) {
          setError("Network error. Please check your connection and try again.");
        } else {
          setError(err.message || "Login failed. Please check your credentials.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center mb-4">Welcome back</h2>
        {showCookieWarning && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded mb-4">
            Cookies are required for this application to function properly. Please enable cookies in your browser settings and accept our cookie policy.
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary p-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            className={`w-full bg-primary text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link href="/forgot-password" className="text-blue-500 hover:underline">
            Forgot Password?
          </Link>
        </div>
      </div>
    </>
  );
}
