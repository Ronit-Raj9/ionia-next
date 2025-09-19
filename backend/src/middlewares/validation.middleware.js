import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';
import { ApiError } from '../utils/ApiError.js';
import { Logger } from './error.middleware.js';

// XSS protection and input sanitization
export const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    if (typeof obj === 'string') {
      // Remove potential XSS and HTML tags, but preserve newlines
      let sanitized = DOMPurify.sanitize(obj, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [],
        KEEP_CONTENT: true
      });
      
      // Remove potential SQL injection patterns
      sanitized = sanitized.replace(/['"`;\\]/g, '');
      
      // Remove script tags and javascript: protocols
      sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      sanitized = sanitized.replace(/javascript:/gi, '');
      sanitized = sanitized.replace(/on\w+\s*=/gi, '');
      
      return sanitized.trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    } else if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          // Sanitize both key and value
          const sanitizedKey = sanitizeObject(key);
          sanitized[sanitizedKey] = sanitizeObject(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }

  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }

  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }

  Logger.debug('Input sanitization completed', {
    requestId: req.requestId,
    bodyKeys: req.body ? Object.keys(req.body) : [],
    queryKeys: req.query ? Object.keys(req.query) : [],
    paramKeys: req.params ? Object.keys(req.params) : []
  });

  next();
};

// Request size validation
export const validateRequestSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = req.get('content-length');
    
    if (contentLength) {
      const sizeInBytes = parseInt(contentLength);
      const maxSizeInBytes = parseSize(maxSize);
      
      if (sizeInBytes > maxSizeInBytes) {
        Logger.warn('Request size limit exceeded', {
          requestId: req.requestId,
          contentLength: sizeInBytes,
          maxAllowed: maxSizeInBytes,
          url: req.originalUrl
        });
        
        throw new ApiError(413, `Request size too large. Maximum allowed: ${maxSize}`);
      }
    }
    
    next();
  };
};

// Helper function to parse size strings
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return value * units[unit];
};

// Content type validation
export const validateContentType = (allowedTypes = ['application/json']) => {
  return (req, res, next) => {
    const contentType = req.get('content-type');
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      if (!contentType) {
        throw new ApiError(400, 'Content-Type header is required');
      }
      
      const isAllowed = allowedTypes.some(type => 
        contentType.toLowerCase().includes(type.toLowerCase())
      );
      
      if (!isAllowed) {
        Logger.warn('Invalid content type', {
          requestId: req.requestId,
          contentType,
          allowedTypes,
          url: req.originalUrl
        });
        
        throw new ApiError(415, `Unsupported content type. Allowed types: ${allowedTypes.join(', ')}`);
      }
    }
    
    next();
  };
};

// Validation result checker
export const checkValidationResult = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    
    Logger.warn('Validation failed', {
      requestId: req.requestId,
      errors: formattedErrors,
      url: req.originalUrl
    });
    
    throw new ApiError(400, 'Validation failed', formattedErrors);
  }
  
  next();
};

// Common validation rules
export const ValidationRules = {
  // User validation rules
  user: {
    register: [
      body('username')
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username can only contain letters, numbers, and underscores'),
      
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
      
      body('fullName')
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters')
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Full name can only contain letters and spaces')
    ],
    
    login: [
      body('email')
        .isEmail()
        .withMessage('Please provide a valid email address')
        .normalizeEmail(),
      
      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ],
    
    updateProfile: [
      body('fullName')
        .optional()
        .isLength({ min: 2, max: 50 })
        .withMessage('Full name must be between 2 and 50 characters'),
      
      body('username')
        .optional()
        .isLength({ min: 3, max: 20 })
        .withMessage('Username must be between 3 and 20 characters')
    ]
  },

  // Question validation rules
  question: {
    create: [
      body('questionText')
        .notEmpty()
        .withMessage('Question text is required')
        .isLength({ max: 2000 })
        .withMessage('Question text cannot exceed 2000 characters'),
      
      body('options')
        .isArray({ min: 2, max: 6 })
        .withMessage('Question must have between 2 and 6 options'),
      
      body('options.*')
        .notEmpty()
        .withMessage('Option text cannot be empty')
        .isLength({ max: 500 })
        .withMessage('Option text cannot exceed 500 characters'),
      
      body('correctAnswer')
        .isInt({ min: 0 })
        .withMessage('Correct answer must be a valid option index'),
      
      body('subject')
        .notEmpty()
        .withMessage('Subject is required')
        .isLength({ max: 50 })
        .withMessage('Subject cannot exceed 50 characters'),
      
      body('difficulty')
        .isIn(['easy', 'medium', 'hard'])
        .withMessage('Difficulty must be easy, medium, or hard')
    ]
  },

  // Test validation rules
  test: {
    create: [
      body('title')
        .notEmpty()
        .withMessage('Test title is required')
        .isLength({ max: 100 })
        .withMessage('Test title cannot exceed 100 characters'),
      
      body('description')
        .optional()
        .isLength({ max: 500 })
        .withMessage('Description cannot exceed 500 characters'),
      
      body('duration')
        .isInt({ min: 1, max: 300 })
        .withMessage('Duration must be between 1 and 300 minutes'),
      
      body('questions')
        .isArray({ min: 1, max: 100 })
        .withMessage('Test must have between 1 and 100 questions')
    ]
  },

  // Generic validation rules
  id: [
    param('id')
      .isMongoId()
      .withMessage('Invalid ID format')
  ],

  pagination: [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ]
};

// File upload validation
export const validateFileUpload = (options = {}) => {
  const {
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'],
    maxFileSize = 5 * 1024 * 1024, // 5MB
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      throw new ApiError(400, 'File upload is required');
    }

    if (req.file) {
      // Check file size
      if (req.file.size > maxFileSize) {
        throw new ApiError(400, `File size too large. Maximum allowed: ${Math.round(maxFileSize / 1024 / 1024)}MB`);
      }

      // Check MIME type
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        throw new ApiError(400, `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`);
      }

      // Additional security checks
      const filename = req.file.originalname.toLowerCase();
      const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
      
      if (dangerousExtensions.some(ext => filename.endsWith(ext))) {
        throw new ApiError(400, 'File type not allowed for security reasons');
      }

      Logger.info('File upload validated', {
        requestId: req.requestId,
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    }

    next();
  };
};

// Rate limiting validation
export const validateRateLimit = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, []);
    }
    
    const userRequests = requests.get(key);
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= max) {
      Logger.warn('Rate limit exceeded', {
        requestId: req.requestId,
        ip: key,
        requestCount: validRequests.length,
        limit: max,
        windowMs
      });
      
      throw new ApiError(429, 'Too many requests. Please try again later.');
    }
    
    validRequests.push(now);
    requests.set(key, validRequests);
    
    next();
  };
};

export default {
  sanitizeInput,
  validateRequestSize,
  validateContentType,
  checkValidationResult,
  ValidationRules,
  validateFileUpload,
  validateRateLimit
}; 