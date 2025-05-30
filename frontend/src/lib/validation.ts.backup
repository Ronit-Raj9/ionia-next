import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

// Input validation schemas
export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'email' | 'url' | 'length' | 'pattern' | 'custom' | 'sanitize';
  message: string;
  value?: any;
  customValidator?: (value: any) => boolean;
  sanitizer?: (value: string) => string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string[] };
  sanitizedData: { [key: string]: any };
}

// Common validation patterns
export const VALIDATION_PATTERNS = {
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,15}$/,
  URL_SAFE: /^[a-zA-Z0-9\-_\.]+$/,
  HTML_TAG: /<[^>]*>/g,
  SCRIPT_TAG: /<script[\s\S]*?<\/script>/gi,
  SQL_INJECTION: /(union|select|insert|update|delete|drop|create|alter|exec|execute)/i,
  XSS_PATTERNS: /[<>\"\'`]/g
};

// Sanitization functions
export const SANITIZERS = {
  // Remove HTML tags and dangerous characters
  html: (input: string): string => {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
  },

  // Allow basic HTML formatting
  richText: (input: string): string => {
    if (typeof input !== 'string') return '';
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li'],
      ALLOWED_ATTR: []
    });
  },

  // Sanitize for URL use
  url: (input: string): string => {
    if (typeof input !== 'string') return '';
    return validator.escape(input.toLowerCase().trim());
  },

  // Sanitize alphanumeric only
  alphanumeric: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.replace(/[^a-zA-Z0-9]/g, '');
  },

  // Sanitize for database storage
  dbSafe: (input: string): string => {
    if (typeof input !== 'string') return '';
    return validator.escape(input.trim());
  },

  // Remove potential XSS patterns
  xss: (input: string): string => {
    if (typeof input !== 'string') return '';
    return input.replace(VALIDATION_PATTERNS.XSS_PATTERNS, '');
  }
};

// Validation functions
export const VALIDATORS = {
  required: (value: any): boolean => {
    return value !== null && value !== undefined && value !== '';
  },

  email: (value: string): boolean => {
    return validator.isEmail(value);
  },

  url: (value: string): boolean => {
    return validator.isURL(value, { require_protocol: true });
  },

  length: (value: string, min: number, max: number): boolean => {
    return validator.isLength(value, { min, max });
  },

  password: (value: string): boolean => {
    return VALIDATION_PATTERNS.PASSWORD.test(value);
  },

  username: (value: string): boolean => {
    return VALIDATION_PATTERNS.USERNAME.test(value);
  },

  phone: (value: string): boolean => {
    return VALIDATION_PATTERNS.PHONE.test(value);
  },

  noHtml: (value: string): boolean => {
    return !VALIDATION_PATTERNS.HTML_TAG.test(value);
  },

  noScript: (value: string): boolean => {
    return !VALIDATION_PATTERNS.SCRIPT_TAG.test(value);
  },

  noSqlInjection: (value: string): boolean => {
    return !VALIDATION_PATTERNS.SQL_INJECTION.test(value);
  }
};

// Main validation function
export function validateInput(data: any, schema: ValidationSchema): ValidationResult {
  const errors: { [key: string]: string[] } = {};
  const sanitizedData: { [key: string]: any } = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];
    const fieldErrors: string[] = [];
    let sanitizedValue = value;

    for (const rule of rules) {
      switch (rule.type) {
        case 'required':
          if (!VALIDATORS.required(value)) {
            fieldErrors.push(rule.message);
          }
          break;

        case 'email':
          if (value && !VALIDATORS.email(value)) {
            fieldErrors.push(rule.message);
          }
          break;

        case 'url':
          if (value && !VALIDATORS.url(value)) {
            fieldErrors.push(rule.message);
          }
          break;

        case 'length':
          if (value && !VALIDATORS.length(value, rule.value.min, rule.value.max)) {
            fieldErrors.push(rule.message);
          }
          break;

        case 'pattern':
          if (value && !rule.value.test(value)) {
            fieldErrors.push(rule.message);
          }
          break;

        case 'custom':
          if (value && rule.customValidator && !rule.customValidator(value)) {
            fieldErrors.push(rule.message);
          }
          break;

        case 'sanitize':
          if (value && rule.sanitizer) {
            sanitizedValue = rule.sanitizer(value);
          }
          break;
      }
    }

    if (fieldErrors.length > 0) {
      errors[field] = fieldErrors;
    }

    sanitizedData[field] = sanitizedValue;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData
  };
}

// Predefined validation schemas
export const VALIDATION_SCHEMAS = {
  // User registration
  userRegistration: {
    fullName: [
      { type: 'required', message: 'Full name is required' },
      { type: 'length', value: { min: 2, max: 50 }, message: 'Name must be 2-50 characters' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.html }
    ],
    username: [
      { type: 'required', message: 'Username is required' },
      { type: 'pattern', value: VALIDATION_PATTERNS.USERNAME, message: 'Username must be 3-20 characters, alphanumeric and underscore only' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.alphanumeric }
    ],
    email: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email address' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.dbSafe }
    ],
    password: [
      { type: 'required', message: 'Password is required' },
      { type: 'pattern', value: VALIDATION_PATTERNS.PASSWORD, message: 'Password must be at least 8 characters with uppercase, lowercase, number and special character' }
    ]
  },

  // User login
  userLogin: {
    email: [
      { type: 'required', message: 'Email is required' },
      { type: 'email', message: 'Please enter a valid email address' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.dbSafe }
    ],
    password: [
      { type: 'required', message: 'Password is required' }
    ]
  },

  // Question creation
  questionCreation: {
    questionText: [
      { type: 'required', message: 'Question text is required' },
      { type: 'length', value: { min: 10, max: 2000 }, message: 'Question must be 10-2000 characters' },
      { type: 'custom', message: 'Question contains potentially harmful content', customValidator: (value) => VALIDATORS.noScript(value) },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.richText }
    ],
    subject: [
      { type: 'required', message: 'Subject is required' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.alphanumeric }
    ],
    difficulty: [
      { type: 'required', message: 'Difficulty is required' },
      { type: 'custom', message: 'Invalid difficulty level', customValidator: (value) => ['easy', 'medium', 'hard'].includes(value) }
    ],
    solution: [
      { type: 'length', value: { min: 0, max: 5000 }, message: 'Solution must be less than 5000 characters' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.richText }
    ]
  },

  // Profile update
  profileUpdate: {
    fullName: [
      { type: 'length', value: { min: 2, max: 50 }, message: 'Name must be 2-50 characters' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.html }
    ],
    bio: [
      { type: 'length', value: { min: 0, max: 500 }, message: 'Bio must be less than 500 characters' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.richText }
    ],
    phone: [
      { type: 'pattern', value: VALIDATION_PATTERNS.PHONE, message: 'Please enter a valid phone number' },
      { type: 'sanitize', message: '', sanitizer: SANITIZERS.alphanumeric }
    ]
  }
};

// File validation
export interface FileValidationOptions {
  maxSize: number; // in bytes
  allowedTypes: string[];
  allowedExtensions: string[];
}

export function validateFile(file: File, options: FileValidationOptions): ValidationResult {
  const errors: { [key: string]: string[] } = {};

  // Check file size
  if (file.size > options.maxSize) {
    errors.size = [`File size must be less than ${options.maxSize / 1024 / 1024}MB`];
  }

  // Check file type
  if (!options.allowedTypes.includes(file.type)) {
    errors.type = [`File type ${file.type} is not allowed`];
  }

  // Check file extension
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (!extension || !options.allowedExtensions.includes(extension)) {
    errors.extension = [`File extension .${extension} is not allowed`];
  }

  // Check for potential malicious files
  const dangerousExtensions = ['exe', 'bat', 'cmd', 'scr', 'pif', 'js', 'vbs', 'php'];
  if (extension && dangerousExtensions.includes(extension)) {
    errors.security = ['This file type is potentially dangerous and not allowed'];
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitizedData: { file }
  };
}

// Sanitize object recursively
export function sanitizeObject(obj: any, sanitizer: (value: string) => string = SANITIZERS.html): any {
  if (typeof obj === 'string') {
    return sanitizer(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item, sanitizer));
  }
  
  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value, sanitizer);
    }
    return sanitized;
  }
  
  return obj;
}

// Rate limiting validation
export function validateRateLimit(identifier: string, maxRequests: number, windowMs: number): boolean {
  const key = `rate_limit_${identifier}`;
  const now = Date.now();
  
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(key);
    if (stored) {
      const data = JSON.parse(stored);
      if (now - data.timestamp < windowMs) {
        if (data.count >= maxRequests) {
          return false;
        }
        data.count++;
        localStorage.setItem(key, JSON.stringify(data));
      } else {
        localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
      }
    } else {
      localStorage.setItem(key, JSON.stringify({ count: 1, timestamp: now }));
    }
  }
  
  return true;
}

// Export utility function for React hooks
export function useInputValidation(schema: ValidationSchema) {
  return (data: any) => validateInput(data, schema);
} 