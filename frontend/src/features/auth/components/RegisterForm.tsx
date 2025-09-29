"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import type { RegisterData } from '../types';
import { toast } from 'react-hot-toast';
import { authLogger } from '../utils/logger';
import { InputWithIcon } from './InputWithIcon';
import { PasswordInput } from './PasswordInput';
import { 
  validateEmail, 
  validatePasswordStrength, 
  validateUsername, 
  validateFullName,
  validateRegistrationForm,
  type PasswordStrength 
} from '../utils/validation';

interface FormData {
  fullName: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

interface FieldValidation {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  touched: boolean;
}

export default function RegisterForm() {
  const router = useRouter();
  const { register, isLoading, error, clearError, checkUsername } = useAuthStore();
  
  // Form data state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });

  // Field validation states
  const [fieldValidations, setFieldValidations] = useState<Record<string, FieldValidation>>({
    fullName: { isValid: true, errors: [], touched: false },
    username: { isValid: true, errors: [], touched: false },
    email: { isValid: true, errors: [], touched: false },
    password: { isValid: true, errors: [], touched: false },
    confirmPassword: { isValid: true, errors: [], touched: false }
  });

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength | null>(null);
  
  // Username validation state
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isUsernameAvailable, setIsUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState('');

  useEffect(() => {
    clearError();
  }, [clearError]);

  // Real-time field validation
  const validateField = (fieldName: keyof FormData, value: any, touched = false) => {
    let validation: FieldValidation = { isValid: true, errors: [], touched };

    switch (fieldName) {
      case 'fullName':
        const fullNameResult = validateFullName(value);
        validation = {
          isValid: fullNameResult.isValid,
          errors: fullNameResult.errors,
          warnings: fullNameResult.warnings,
          touched
        };
        break;

      case 'email':
        const emailResult = validateEmail(value);
        validation = {
          isValid: emailResult.isValid,
          errors: emailResult.isValid ? [] : ['Please enter a valid email address'],
          warnings: emailResult.suggestions ? [`Did you mean: ${emailResult.suggestions.join(', ')}?`] : [],
          touched
        };
        break;

      case 'username':
        const usernameResult = validateUsername(value);
        validation = {
          isValid: usernameResult.isValid,
          errors: usernameResult.errors,
          warnings: usernameResult.warnings,
          touched
        };
        break;

      case 'password':
        const passwordResult = validatePasswordStrength(value);
        setPasswordStrength(passwordResult);
        validation = {
          isValid: passwordResult.isValid,
          errors: passwordResult.suggestions,
          touched
        };
        break;

      case 'confirmPassword':
        const passwordsMatch = value === formData.password;
        validation = {
          isValid: passwordsMatch,
          errors: passwordsMatch ? [] : ['Passwords do not match'],
          touched
        };
        break;
    }

    setFieldValidations(prev => ({
      ...prev,
      [fieldName]: validation
    }));

    return validation;
  };

  // Username availability check
  useEffect(() => {
    if (!formData.username || formData.username.length < 3) {
      setIsUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    // First check local validation
    const usernameValidation = validateUsername(formData.username);
    if (!usernameValidation.isValid) {
      setIsUsernameAvailable(false);
      setUsernameMessage(usernameValidation.errors[0]);
      return;
    }

    const checkUsernameAvailability = async () => {
      setIsCheckingUsername(true);
      setUsernameMessage('');
      
      try {
        const result = await checkUsername(formData.username);
        setIsUsernameAvailable(result.available);
        setUsernameMessage(result.message);
      } catch (error: any) {
        setIsUsernameAvailable(false);
        setUsernameMessage(error.message || 'Error checking username');
      } finally {
        setIsCheckingUsername(false);
      }
    };

    const timeoutId = setTimeout(checkUsernameAvailability, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.username, checkUsername]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    // Validate field in real-time (except for checkbox)
    if (type !== 'checkbox') {
      validateField(name as keyof FormData, fieldValue, fieldValidations[name]?.touched || false);
    }
  };

  const handleBlur = (fieldName: keyof FormData) => {
    validateField(fieldName, formData[fieldName], true);
  };

  const isFormValid = () => {
    // Check all field validations
    const allFieldsValid = Object.values(fieldValidations).every(field => field.isValid);
    
    // Check username availability
    const usernameValid = isUsernameAvailable === true;
    
    // Check terms acceptance
    const termsAccepted = formData.acceptTerms;
    
    // Check all required fields are filled
    const allFieldsFilled = formData.fullName && formData.username && formData.email && 
                           formData.password && formData.confirmPassword;

    return allFieldsValid && usernameValid && termsAccepted && allFieldsFilled;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    clearError();

    // Mark all fields as touched to show validation errors
    Object.keys(fieldValidations).forEach(fieldName => {
      validateField(fieldName as keyof FormData, formData[fieldName as keyof FormData], true);
    });

    // Validate entire form
    const formValidation = validateRegistrationForm(formData);
    
    if (!formValidation.isValid) {
      toast.error(formValidation.errors[0] || "Please fix the validation errors before submitting");
      return;
    }

    if (!isUsernameAvailable) {
      toast.error("Please choose an available username");
      return;
    }

    if (!formData.acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    try {
      const result = await register(formData as RegisterData);
      if (result.success) {
        toast.success('Registration successful! You can now log in with your credentials.');
        
        // Clear the form
        setFormData({
          fullName: '',
          username: '',
          email: '',
          password: '',
          confirmPassword: '',
          acceptTerms: false
        });
        
        // Reset validation states
        setFieldValidations({
          fullName: { isValid: true, errors: [], touched: false },
          username: { isValid: true, errors: [], touched: false },
          email: { isValid: true, errors: [], touched: false },
          password: { isValid: true, errors: [], touched: false },
          confirmPassword: { isValid: true, errors: [], touched: false }
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        toast.error(result.error?.message || 'Registration failed.');
      }
    } catch (err: any) {
      toast.error('Registration failed. Please try again.');
      authLogger.error('Registration failed', { error: err.message }, 'AUTH');
    }
  };

  // Get field error message
  const getFieldError = (fieldName: keyof FormData) => {
    const validation = fieldValidations[fieldName];
    if (!validation.touched || validation.isValid) return null;
    return validation.errors[0] || null;
  };

  // Get username validation state for styling
  const getUsernameValidationState = () => {
    if (isCheckingUsername) return 'checking';
    if (formData.username && isUsernameAvailable === true) return 'success';
    if (formData.username && (isUsernameAvailable === false || !fieldValidations.username.isValid)) return 'error';
    return 'default';
  };

  // Get username error message
  const getUsernameError = () => {
    if (!fieldValidations.username.touched) return null;
    if (!fieldValidations.username.isValid) return fieldValidations.username.errors[0];
    if (isUsernameAvailable === false) return usernameMessage;
    return null;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
        initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-md bg-white border border-gray-100 rounded-2xl shadow-lg p-6 sm:p-8"
        >
        {/* Header */}
        <div className="text-center mb-8">
          
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">
              Create your account
          </h1>
          <p className="text-sm text-gray-600 mb-6">
              Join thousands of learners today
            </p>
          
          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-gray-500">Already have an account?</span>
            <Link
              href="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors duration-300"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Error Message */}
            {error && (
              <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6"
            role="alert"
              >
                <div className="flex items-start space-x-3">
              <svg className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
              <div>
                <p className="text-sm font-medium">{error.message}</p>
                {error.message?.includes('🌐') && (
                  <p className="mt-1 text-xs text-red-600">
                        Make sure the backend server is running on port 8000
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name and Username Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputWithIcon
              id="fullName"
              name="fullName"
              type="text"
              label="Full Name"
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={handleChange}
              onBlur={() => handleBlur('fullName')}
              error={getFieldError('fullName')}
              required
              autoComplete="name"
            />
            
            <div className="relative">
              <InputWithIcon
                id="username"
                name="username"
                type="text"
                label="Username"
                placeholder="Choose a username"
                value={formData.username}
                onChange={handleChange}
                onBlur={() => handleBlur('username')}
                error={getUsernameError()}
                required
                autoComplete="username"
                className=""
              />
              
              {/* Username validation indicator */}
              {formData.username && (
                <div className="absolute right-0 top-0 w-14 h-12 flex items-center justify-center">
                  {isCheckingUsername && (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-gray-300 border-t-emerald-600 rounded-full"
                    />
                  )}
                  {getUsernameValidationState() === 'success' && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-emerald-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </motion.svg>
                  )}
                  {getUsernameValidationState() === 'error' && (
                    <motion.svg 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-4 h-4 text-red-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </motion.svg>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Email */}
          <InputWithIcon
            id="email"
            name="email"
            type="email"
            label="Email address"
            placeholder="Enter your email address"
            value={formData.email}
            onChange={handleChange}
            onBlur={() => handleBlur('email')}
            error={getFieldError('email')}
            required
            autoComplete="email"
          />

          {/* Password */}
          <div className="space-y-2">
            <PasswordInput
              id="password"
              name="password"
              label="Password"
              placeholder="Create a strong password"
              value={formData.password}
              onChange={handleChange}
              onBlur={() => handleBlur('password')}
              error={getFieldError('password')}
              required
              autoComplete="new-password"
            />
            
            {/* Password strength indicator */}
            {formData.password && passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-gray-600">Strength:</span>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 w-6 rounded-full ${
                          passwordStrength.score >= level
                            ? passwordStrength.level === 'weak'
                              ? 'bg-red-400'
                              : passwordStrength.level === 'fair'
                              ? 'bg-yellow-400'
                              : passwordStrength.level === 'good'
                              ? 'bg-blue-400'
                              : 'bg-green-400'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`capitalize font-medium ${
                    passwordStrength.level === 'weak' ? 'text-red-600' :
                    passwordStrength.level === 'fair' ? 'text-yellow-600' :
                    passwordStrength.level === 'good' ? 'text-blue-600' :
                    'text-green-600'
                  }`}>
                    {passwordStrength.level}
                  </span>
                </div>
                
                {/* Password requirements */}
                {!passwordStrength.isValid && (
                  <div className="mt-2 text-xs text-gray-600">
                    <div className="text-sm font-medium mb-1">Password must include:</div>
                    <ul className="space-y-1">
                      <li className={`flex items-center space-x-2 ${formData.password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-3 h-3 rounded-full ${formData.password.length >= 8 ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        <span>At least 8 characters</span>
                      </li>
                      <li className={`flex items-center space-x-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-3 h-3 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        <span>One uppercase letter</span>
                      </li>
                      <li className={`flex items-center space-x-2 ${/[a-z]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-3 h-3 rounded-full ${/[a-z]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        <span>One lowercase letter</span>
                      </li>
                      <li className={`flex items-center space-x-2 ${/\d/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-3 h-3 rounded-full ${/\d/.test(formData.password) ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        <span>One number</span>
                      </li>
                      <li className={`flex items-center space-x-2 ${/[@$!%*?&]/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}`}>
                        <span className={`w-3 h-3 rounded-full ${/[@$!%*?&]/.test(formData.password) ? 'bg-green-400' : 'bg-gray-300'}`}></span>
                        <span>One special character (@$!%*?&)</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            label="Confirm password"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            onBlur={() => handleBlur('confirmPassword')}
            error={getFieldError('confirmPassword')}
            required
            autoComplete="new-password"
          />

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="acceptTerms"
              name="acceptTerms"
              checked={formData.acceptTerms || false}
              onChange={handleChange}
              onBlur={() => setTouched('acceptTerms')}
              className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 border-gray-300 rounded transition-colors"
              required
            />
            <label htmlFor="acceptTerms" className="text-sm text-gray-600 leading-5">
              I agree to the{' '}
              <Link href="/terms" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-300">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors duration-300">
                Privacy Policy
              </Link>
            </label>
          </div>
          
          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isLoading || !isFormValid()}
            whileHover={(!isLoading && isFormValid()) ? { scale: 1.02, y: -2 } : {}}
            whileTap={(!isLoading && isFormValid()) ? { scale: 0.98 } : {}}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 h-12 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:ring-2 focus:ring-green-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
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
              </>
            ) : (
              <span>Create account</span>
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
            <span>Secured with industry-standard encryption</span>
          </div>
          </div>
      </motion.div>
    </div>
  );
}