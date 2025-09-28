import DOMPurify from 'isomorphic-dompurify';

// Input Sanitization Middleware
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query && typeof req.query === 'object') {
      req.query = sanitizeObject(req.query);
    }
    
    // Sanitize params
    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeObject(req.params);
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

// Recursive object sanitization
const sanitizeObject = (obj) => {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj.trim());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }
  
  return obj;
};

// Request Size Validation
export const validateRequestSize = (maxSize) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0');
    const maxSizeBytes = parseSize(maxSize);
    
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        error: 'Request entity too large',
        message: `Request size exceeds maximum allowed size of ${maxSize}`
      });
    }
    
    next();
  };
};

// Content Type Validation
export const validateContentType = (allowedTypes) => {
  return (req, res, next) => {
    const contentType = req.get('content-type') || '';
    
    // Skip validation for GET requests and requests without body
    if (req.method === 'GET' || req.method === 'DELETE' || !contentType) {
      return next();
    }
    
    // Check if content type is allowed
    const isAllowed = allowedTypes.some(type => {
      if (type.includes('*')) {
        const pattern = type.replace('*', '.*');
        return new RegExp(pattern).test(contentType);
      }
      return contentType.includes(type);
    });
    
    if (!isAllowed) {
      return res.status(415).json({
        success: false,
        error: 'Unsupported Media Type',
        message: `Content type '${contentType}' is not supported. Allowed types: ${allowedTypes.join(', ')}`
      });
    }
    
    next();
  };
};

// Parse size string to bytes
const parseSize = (size) => {
  const units = {
    'b': 1,
    'kb': 1024,
    'mb': 1024 * 1024,
    'gb': 1024 * 1024 * 1024
  };
  
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*(b|kb|mb|gb)?$/);
  if (!match) {
    throw new Error(`Invalid size format: ${size}`);
  }
  
  const value = parseFloat(match[1]);
  const unit = match[2] || 'b';
  
  return Math.floor(value * units[unit]);
};

// Email Validation
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Password Validation
export const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return {
    isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers,
    errors: [
      ...(password.length < minLength ? ['Password must be at least 8 characters long'] : []),
      ...(!hasUpperCase ? ['Password must contain at least one uppercase letter'] : []),
      ...(!hasLowerCase ? ['Password must contain at least one lowercase letter'] : []),
      ...(!hasNumbers ? ['Password must contain at least one number'] : []),
      ...(!hasSpecialChar ? ['Password must contain at least one special character'] : [])
    ]
  };
};

// Username Validation
export const validateUsername = (username) => {
  const minLength = 3;
  const maxLength = 30;
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  
  return {
    isValid: username.length >= minLength && username.length <= maxLength && usernameRegex.test(username),
    errors: [
      ...(username.length < minLength ? ['Username must be at least 3 characters long'] : []),
      ...(username.length > maxLength ? ['Username cannot exceed 30 characters'] : []),
      ...(!usernameRegex.test(username) ? ['Username can only contain letters, numbers, and underscores'] : [])
    ]
  };
};

// Request validation middleware
export const validateRequest = (req, res, next) => {
  const errors = [];
  
  // Check for validation errors from express-validator
  if (req.validationErrors) {
    errors.push(...req.validationErrors);
  }
  
  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors
    });
  }
  
  next();
};