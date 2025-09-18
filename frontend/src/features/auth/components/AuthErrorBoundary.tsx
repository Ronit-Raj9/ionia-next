// ==========================================
// 🛡️ AUTH ERROR BOUNDARY COMPONENT
// ==========================================

'use client';

import React, { Component, ReactNode } from 'react';
import { useAuthStore } from '../store/authStore';
import { authLogger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    authLogger.error('Auth Error Boundary caught an error', { error: error.message, errorInfo }, 'ERROR_BOUNDARY');
    
    // Check if this is a refresh failure
    if (error.message?.includes('refresh') || error.message?.includes('401')) {
      // Let the global error handler deal with it
      return;
    }
  }

  render() {
    if (this.state.hasError) {
      // Check if this is an auth-related error
      if (this.state.error?.message?.includes('auth') || 
          this.state.error?.message?.includes('401') ||
          this.state.error?.message?.includes('refresh')) {
        return <AuthErrorFallback onRetry={() => this.setState({ hasError: false, error: null })} />;
      }

      // For other errors, show the fallback or default error UI
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">An unexpected error occurred. Please try refreshing the page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Auth-specific error fallback component
const AuthErrorFallback: React.FC<{ onRetry: () => void }> = ({ onRetry }) => {
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout('error');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <svg className="h-8 w-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Session Expired</h2>
        <p className="text-gray-600 mb-4">Your session has expired. Please log in again to continue.</p>
        <div className="space-y-3">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
          >
            Go to Login
          </button>
          <button
            onClick={onRetry}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthErrorBoundary;
