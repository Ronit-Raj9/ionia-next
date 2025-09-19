/**
 * Admin Error Handling Utilities
 * Provides consistent error handling and user-friendly messages for admin operations
 */

export interface AdminError {
  message: string;
  code?: string;
  retry?: boolean;
  action?: string;
}

/**
 * Maps backend error messages to user-friendly messages
 */
export const getAdminErrorMessage = (error: any): AdminError => {
  const errorMessage = error?.message || error?.toString() || 'An unknown error occurred';
  
  // Network errors
  if (error?.code === 'NETWORK_ERROR' || errorMessage.includes('fetch')) {
    return {
      message: 'Network connection error. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      retry: true,
      action: 'Check your internet connection and try again.'
    };
  }

  // Authentication errors
  if (error?.status === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('Unauthorized')) {
    return {
      message: 'Your session has expired. Please log in again.',
      code: 'AUTH_ERROR',
      retry: false,
      action: 'Please log in again to continue.'
    };
  }

  // Permission errors
  if (error?.status === 403 || errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
    return {
      message: 'You do not have permission to perform this action.',
      code: 'PERMISSION_ERROR',
      retry: false,
      action: 'Contact your administrator for access.'
    };
  }

  // Validation errors
  if (error?.status === 400 || errorMessage.includes('validation') || errorMessage.includes('required')) {
    return {
      message: 'Please check your input and try again.',
      code: 'VALIDATION_ERROR',
      retry: false,
      action: 'Review the form data and correct any errors.'
    };
  }

  // Server errors
  if (error?.status >= 500 || errorMessage.includes('server error') || errorMessage.includes('Internal Server Error')) {
    return {
      message: 'Server error occurred. Our team has been notified.',
      code: 'SERVER_ERROR',
      retry: true,
      action: 'Please try again in a few minutes.'
    };
  }

  // Rate limiting
  if (error?.status === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      message: 'Too many requests. Please wait a moment before trying again.',
      code: 'RATE_LIMIT_ERROR',
      retry: true,
      action: 'Wait a few seconds and try again.'
    };
  }

  // Specific admin operation errors
  if (errorMessage.includes('question')) {
    return {
      message: 'Failed to process question. Please verify the question data.',
      code: 'QUESTION_ERROR',
      retry: true,
      action: 'Check question content and try again.'
    };
  }

  if (errorMessage.includes('test')) {
    return {
      message: 'Failed to process test. Please verify the test configuration.',
      code: 'TEST_ERROR',
      retry: true,
      action: 'Check test settings and try again.'
    };
  }

  if (errorMessage.includes('analytics')) {
    return {
      message: 'Failed to load analytics data. This might be a temporary issue.',
      code: 'ANALYTICS_ERROR',
      retry: true,
      action: 'Try refreshing the page or check back later.'
    };
  }

  // File upload errors
  if (errorMessage.includes('file') || errorMessage.includes('upload') || errorMessage.includes('image')) {
    return {
      message: 'File upload failed. Please check file size and format.',
      code: 'UPLOAD_ERROR',
      retry: true,
      action: 'Ensure file is under 10MB and in a supported format.'
    };
  }

  // Default error
  return {
    message: errorMessage.length > 100 ? 'An error occurred while processing your request.' : errorMessage,
    code: 'UNKNOWN_ERROR',
    retry: true,
    action: 'Please try again or contact support if the problem persists.'
  };
};

/**
 * Logs admin errors for debugging
 */
export const logAdminError = (operation: string, error: any, context?: any) => {
  console.group(`🚨 Admin Error: ${operation}`);
  console.error('Error:', error);
  if (context) {
    console.log('Context:', context);
  }
  console.log('Timestamp:', new Date().toISOString());
  console.groupEnd();
};

/**
 * Creates a standardized error state for the admin store
 */
export const createErrorState = (operation: string, error: any) => {
  const adminError = getAdminErrorMessage(error);
  logAdminError(operation, error);
  
  return {
    [operation]: adminError.message
  };
};

/**
 * Helper to determine if an error is recoverable
 */
export const isRecoverableError = (error: any): boolean => {
  const adminError = getAdminErrorMessage(error);
  return adminError.retry ?? false;
};

/**
 * Gets suggested action for an error
 */
export const getErrorAction = (error: any): string => {
  const adminError = getAdminErrorMessage(error);
  return adminError.action ?? 'Please try again.';
};