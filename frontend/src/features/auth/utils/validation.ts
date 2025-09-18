// ==========================================
// 🔍 COMPREHENSIVE AUTH VALIDATION UTILITIES
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface PasswordStrength {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  suggestions: string[];
  isValid: boolean;
}

export interface EmailValidation {
  isValid: boolean;
  isDisposable: boolean;
  domain: string;
  suggestions?: string[];
}

/**
 * Email validation with domain checking
 */
export function validateEmail(email: string): EmailValidation {
  const result: EmailValidation = {
    isValid: false,
    isDisposable: false,
    domain: ''
  };

  if (!email || typeof email !== 'string') {
    return result;
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return result;
  }

  const [localPart, domain] = email.toLowerCase().split('@');
  
  // Check for valid local part
  if (localPart.length === 0 || localPart.length > 64) {
    return result;
  }

  // Check for valid domain
  if (domain.length === 0 || domain.length > 253) {
    return result;
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    return result;
  }

  // Check for leading/trailing dots
  if (localPart.startsWith('.') || localPart.endsWith('.') || 
      domain.startsWith('.') || domain.endsWith('.')) {
    return result;
  }

  result.isValid = true;
  result.domain = domain;

  // Check for disposable email domains (basic list)
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
    'mailinator.com', 'temp-mail.org', 'throwaway.email'
  ];
  
  result.isDisposable = disposableDomains.includes(domain);

  // Provide suggestions for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const suggestions: string[] = [];
  
  commonDomains.forEach(commonDomain => {
    if (domain.includes(commonDomain.split('.')[0]) && domain !== commonDomain) {
      suggestions.push(email.replace(domain, commonDomain));
    }
  });

  if (suggestions.length > 0) {
    result.suggestions = suggestions;
  }

  return result;
}

/**
 * Comprehensive password strength validation
 */
export function validatePasswordStrength(password: string): PasswordStrength {
  const suggestions: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      score: 0,
      level: 'weak',
      suggestions: ['Password is required'],
      isValid: false
    };
  }

  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    suggestions.push('Use at least 8 characters');
  }

  if (password.length >= 12) {
    score += 1;
  }

  // Character variety checks
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include numbers');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password)) {
    score += 1;
  } else {
    suggestions.push('Include special characters');
  }

  // Additional checks
  if (password.length >= 16) {
    score += 1;
  }

  // Check for common patterns
  const commonPatterns = [
    /123456/, /password/i, /qwerty/i, /abc123/i,
    /admin/i, /user/i, /test/i, /demo/i
  ];

  if (commonPatterns.some(pattern => pattern.test(password))) {
    score = Math.max(0, score - 2);
    suggestions.push('Avoid common passwords');
  }

  // Check for repeated characters
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    suggestions.push('Avoid repeated characters');
  }

  // Determine strength level
  let level: PasswordStrength['level'];
  if (score < 3) {
    level = 'weak';
  } else if (score < 5) {
    level = 'fair';
  } else if (score < 7) {
    level = 'good';
  } else {
    level = 'strong';
  }

  return {
    score,
    level,
    suggestions,
    isValid: score >= 4 && password.length >= 8
  };
}

/**
 * Username validation
 */
export function validateUsername(username: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!username || typeof username !== 'string') {
    errors.push('Username is required');
    return { isValid: false, errors, warnings };
  }

  // Length check
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  }

  if (username.length > 30) {
    errors.push('Username must be no more than 30 characters long');
  }

  // Character check
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }

  // Start/end check
  if (username.startsWith('-') || username.endsWith('-') ||
      username.startsWith('_') || username.endsWith('_')) {
    errors.push('Username cannot start or end with underscores or hyphens');
  }

  // Reserved usernames
  const reservedUsernames = [
    'admin', 'administrator', 'root', 'user', 'guest', 'test',
    'api', 'www', 'mail', 'ftp', 'support', 'help', 'about',
    'contact', 'privacy', 'terms', 'legal', 'blog', 'news'
  ];

  if (reservedUsernames.includes(username.toLowerCase())) {
    errors.push('This username is reserved');
  }

  // Warnings
  if (username.length < 5) {
    warnings.push('Consider using a longer username for better security');
  }

  if (!/[a-zA-Z]/.test(username)) {
    warnings.push('Consider including letters in your username');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Full name validation
 */
export function validateFullName(fullName: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!fullName || typeof fullName !== 'string') {
    errors.push('Full name is required');
    return { isValid: false, errors, warnings };
  }

  const trimmed = fullName.trim();

  // Length check
  if (trimmed.length < 2) {
    errors.push('Full name must be at least 2 characters long');
  }

  if (trimmed.length > 100) {
    errors.push('Full name must be no more than 100 characters long');
  }

  // Character check
  if (!/^[a-zA-Z\s\-'\.]+$/.test(trimmed)) {
    errors.push('Full name can only contain letters, spaces, hyphens, apostrophes, and periods');
  }

  // Multiple words check
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);
  if (words.length < 2) {
    warnings.push('Consider using both first and last name');
  }

  // Check for excessive spaces
  if (trimmed !== trimmed.replace(/\s+/g, ' ')) {
    warnings.push('Remove extra spaces');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Form validation for registration
 */
export function validateRegistrationForm(data: {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate each field
  const fullNameValidation = validateFullName(data.fullName);
  const emailValidation = validateEmail(data.email);
  const usernameValidation = validateUsername(data.username);
  const passwordValidation = validatePasswordStrength(data.password);

  // Collect errors
  errors.push(...fullNameValidation.errors);
  errors.push(...usernameValidation.errors);
  errors.push(...passwordValidation.errors);

  if (!emailValidation.isValid) {
    errors.push('Please enter a valid email address');
  }

  if (emailValidation.isDisposable) {
    warnings.push('Disposable email addresses are not recommended');
  }

  if (data.password !== data.confirmPassword) {
    errors.push('Passwords do not match');
  }

  if (!data.acceptTerms) {
    errors.push('You must accept the terms and conditions');
  }

  // Collect warnings
  warnings.push(...fullNameValidation.warnings || []);
  warnings.push(...usernameValidation.warnings || []);
  if (emailValidation.suggestions) {
    warnings.push(`Did you mean: ${emailValidation.suggestions.join(', ')}?`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Form validation for login
 */
export function validateLoginForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: string[] = [];

  const emailValidation = validateEmail(data.email);

  if (!emailValidation.isValid) {
    errors.push('Please enter a valid email address');
  }

  if (!data.password || data.password.length === 0) {
    errors.push('Password is required');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Real-time validation hook
 */
export function useRealTimeValidation() {
  const validateField = (field: string, value: string) => {
    switch (field) {
      case 'email':
        return validateEmail(value);
      case 'password':
        return validatePasswordStrength(value);
      case 'username':
        return validateUsername(value);
      case 'fullName':
        return validateFullName(value);
      default:
        return { isValid: true, errors: [] };
    }
  };

  return { validateField };
}
