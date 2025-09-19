'use client';

import { useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processOAuthCallback = async () => {
      try {
        console.log('🔄 Processing OAuth callback...');
        
        const authStatus = searchParams.get('auth');
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const returnUrl = searchParams.get('returnUrl') || '/dashboard';
        const error = searchParams.get('error');

        // Handle OAuth errors
        if (error) {
          console.error('❌ OAuth error:', error);
          let errorMessage = 'Authentication failed. Please try again.';
          
          switch (error) {
            case 'oauth_failed':
              errorMessage = 'Google authentication failed. Please try again.';
              break;
            case 'oauth_no_user':
              errorMessage = 'Unable to create user account. Please try again.';
              break;
            case 'oauth_processing_failed':
              errorMessage = 'Error processing authentication. Please try again.';
              break;
            default:
              errorMessage = decodeURIComponent(error);
          }
          
          router.push('/login?error=' + encodeURIComponent(errorMessage));
          return;
        }

        // Handle successful OAuth with tokens
        if (authStatus === 'success' && token && refresh) {
          console.log('✅ OAuth tokens received, setting cookies...');
          
          // Set cookies with proper options for development
          const accessTokenExpiry = new Date();
          accessTokenExpiry.setMinutes(accessTokenExpiry.getMinutes() + 15);
          
          const refreshTokenExpiry = new Date();
          refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

          // Set cookies that work across localhost ports
          document.cookie = `accessToken=${token}; path=/; expires=${accessTokenExpiry.toUTCString()}; SameSite=Lax`;
          document.cookie = `refreshToken=${refresh}; path=/; expires=${refreshTokenExpiry.toUTCString()}; SameSite=Lax`;
          
          console.log('🍪 Cookies set successfully');

          // Small delay to ensure cookies are set
          await new Promise(resolve => setTimeout(resolve, 100));

          // Initialize auth store
          const { initializeAuth } = useAuthStore.getState();
          console.log('🔄 Initializing auth store...');
          await initializeAuth();

          // Redirect to return URL
          console.log(`🎯 Redirecting to: ${returnUrl}`);
          router.replace(returnUrl);
          return;
        }

        // Handle OAuth success without tokens (fallback to cookie-based auth)
        if (authStatus === 'success') {
          console.log('✅ OAuth success, initializing auth...');
          
          // Small delay to ensure any backend cookies are set
          await new Promise(resolve => setTimeout(resolve, 200));
          
          const { initializeAuth } = useAuthStore.getState();
          await initializeAuth();
          
          router.replace(returnUrl);
          return;
        }

        // No valid OAuth parameters found
        console.log('⚠️ No valid OAuth parameters found, redirecting to login');
        router.push('/login');

      } catch (error) {
        console.error('❌ Error processing OAuth callback:', error);
        router.push('/login?error=oauth_processing_failed');
      }
    };

    processOAuthCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Completing Sign In</h2>
        <p className="text-gray-600">Please wait while we sign you in...</p>
      </div>
    </div>
  );
}
