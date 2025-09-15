// ==========================================
// 🔍 USERNAME VALIDATION HOOK
// ==========================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

interface UsernameValidationState {
  isChecking: boolean;
  isAvailable: boolean | null;
  message: string;
  error: string | null;
}

export const useUsernameValidation = (username: string, debounceMs = 500) => {
  const { checkUsername } = useAuthStore();
  const [state, setState] = useState<UsernameValidationState>({
    isChecking: false,
    isAvailable: null,
    message: '',
    error: null,
  });

  const validateUsername = useCallback(async (usernameToCheck: string) => {
    if (!usernameToCheck || usernameToCheck.length < 3) {
      setState({
        isChecking: false,
        isAvailable: null,
        message: usernameToCheck.length > 0 ? 'Username must be at least 3 characters' : '',
        error: null,
      });
      return;
    }

    // Basic format validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(usernameToCheck)) {
      setState({
        isChecking: false,
        isAvailable: false,
        message: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        error: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isChecking: true, error: null }));

    try {
      const result = await checkUsername(usernameToCheck);
      setState({
        isChecking: false,
        isAvailable: result.available,
        message: result.message,
        error: null,
      });
    } catch (error: any) {
      setState({
        isChecking: false,
        isAvailable: false,
        message: '',
        error: error.message || 'Error checking username availability',
      });
    }
  }, [checkUsername]);

  // Debounced validation
  useEffect(() => {
    if (!username) {
      setState({
        isChecking: false,
        isAvailable: null,
        message: '',
        error: null,
      });
      return;
    }

    const timeoutId = setTimeout(() => {
      validateUsername(username);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [username, debounceMs, validateUsername]);

  const reset = useCallback(() => {
    setState({
      isChecking: false,
      isAvailable: null,
      message: '',
      error: null,
    });
  }, []);

  return {
    ...state,
    reset,
    validate: validateUsername,
  };
};

export default useUsernameValidation;
