// ==========================================
// 🛡️ CENTRALIZED AUTH ERROR HANDLER
// ==========================================

import { createAuthError, EnhancedAuthError } from './authUtils';

export interface ErrorContext {
  action?: string;
  credentials?: { email: string };
  userData?: { email: string };
  networkError?: boolean;
  locked?: boolean;
  rateLimited?: boolean;
  csrfError?: boolean;
  deactivated?: boolean;
  serverError?: boolean;
  refreshFailed?: boolean;
}

export class AuthErrorHandler {
  /**
   * Centralized error handling for authentication operations
   */
  static handleAuthError(error: any, context: ErrorContext = {}): EnhancedAuthError {
    const { action = 'unknown', credentials } = context;

    // Network errors
    if (error.status === 0 || error.isNetworkError || 
        error.name === 'TypeError' && error.message.includes('fetch') ||
        error.message?.includes('network') || error.message?.includes('fetch') || 
        error.message?.includes('connection') || error.message?.includes('Unable to connect')) {
      return createAuthError('network', 
        'Unable to connect to the server. Please check your internet connection and try again.', 
        { ...context, networkError: true }
      );
    }

    // Authentication errors
    if (error.status === 401) {
      return createAuthError('auth', 'Invalid email or password', 
        { ...context, credentials });
    }

    // Account locked
    if (error.status === 423 || context.locked) {
      return createAuthError('auth', 
        'Account is temporarily locked due to multiple failed login attempts. Please try again later.', 
        { ...context, locked: true }
      );
    }

    // Rate limiting
    if (error.status === 429 || context.rateLimited) {
      return createAuthError('auth', 
        'Too many login attempts. Please wait a few minutes before trying again.', 
        { ...context, rateLimited: true }
      );
    }

    // CSRF errors
    if (error.status === 403 && (error.message?.includes('CSRF') || error.message?.includes('csrf') || context.csrfError)) {
      return createAuthError('csrf', 
        'Security token expired. Please refresh the page and try again.', 
        { ...context, csrfError: true }
      );
    }

    // Account deactivated
    if (error.status === 403 && !context.csrfError && error.message?.includes('deactivated')) {
      return createAuthError('permission', 
        'Account has been deactivated. Please contact support.', 
        { ...context, deactivated: true }
      );
    }

    // Server errors
    if (error.status >= 500 || context.serverError) {
      return createAuthError('server', 
        'Server error. Please try again later or contact support if the problem persists.', 
        { ...context, serverError: true }
      );
    }

    // Refresh failures
    if (error.isRefreshFailed || context.refreshFailed) {
      return createAuthError('refresh_failed', 
        'Session expired. Please refresh the page and try again.', 
        { ...context, refreshFailed: true }
      );
    }

    // Generic auth error
    return createAuthError('auth', 
      error.message || `${action} failed. Please try again.`, 
      context
    );
  }

  /**
   * Get user-friendly error message for display
   */
  static getUserFriendlyMessage(error: EnhancedAuthError): string {
    return error.userFriendlyMessage || error.message;
  }

  /**
   * Get suggested action for error recovery
   */
  static getSuggestedAction(error: EnhancedAuthError): string | undefined {
    return error.suggestedAction;
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: EnhancedAuthError): boolean {
    return error.retryable;
  }

  /**
   * Get error icon based on error type
   */
  static getErrorIcon(error: EnhancedAuthError): string {
    switch (error.type) {
      case 'network':
        return '🌐';
      case 'auth':
        return '🔒';
      case 'csrf':
        return '🔄';
      case 'rate_limit':
        return '⏱️';
      case 'account_locked':
        return '⏳';
      case 'server':
        return '⚠️';
      case 'refresh_failed':
        return '🔄';
      default:
        return '❌';
    }
  }

  /**
   * Get error color class for UI
   */
  static getErrorColorClass(error: EnhancedAuthError): string {
    switch (error.type) {
      case 'network':
        return 'text-red-600 dark:text-red-400';
      case 'auth':
        return 'text-red-600 dark:text-red-400';
      case 'csrf':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'rate_limit':
        return 'text-orange-600 dark:text-orange-400';
      case 'account_locked':
        return 'text-orange-600 dark:text-orange-400';
      case 'server':
        return 'text-red-600 dark:text-red-400';
      case 'refresh_failed':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-red-600 dark:text-red-400';
    }
  }
}
