import { v4 as uuidv4 } from 'uuid';

// Error categories for better organization
const ERROR_CATEGORIES = {
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  AUTHORIZATION: 'AUTHORIZATION',
  DATABASE: 'DATABASE',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE',
  RATE_LIMIT: 'RATE_LIMIT',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL: 'INTERNAL'
};

// Structured logger class
class Logger {
  static log(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
      environment: process.env.NODE_ENV || 'development'
    };

    if (process.env.NODE_ENV === 'production') {
      // In production, use structured JSON logging
      console.log(JSON.stringify(logEntry));
    } else {
      // In development, use readable format
      const emoji = {
        error: '❌',
        warn: '⚠️',
        info: 'ℹ️',
        debug: '🐛'
      }[level] || 'ℹ️';
      
      console.log(`${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`);
      if (Object.keys(meta).length > 0) {
        console.log('  Meta:', JSON.stringify(meta, null, 2));
      }
    }
  }

  static error(message, meta = {}) {
    this.log('error', message, meta);
  }

  static warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  static info(message, meta = {}) {
    this.log('info', message, meta);
  }

  static debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

// Request ID middleware - should be added before other middlewares
export const requestIdMiddleware = (req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  
  Logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress
  });
  
  next();
};

// Error categorization function
const categorizeError = (err) => {
  // MongoDB/Mongoose errors
  if (err.name === 'ValidationError') return ERROR_CATEGORIES.VALIDATION;
  if (err.name === 'CastError') return ERROR_CATEGORIES.VALIDATION;
  if (err.code === 11000) return ERROR_CATEGORIES.VALIDATION; // Duplicate key
  if (err.name === 'MongoError' || err.name === 'MongoServerError') return ERROR_CATEGORIES.DATABASE;
  
  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') return ERROR_CATEGORIES.AUTHENTICATION;
  
  // Custom API errors
  if (err.statusCode === 401) return ERROR_CATEGORIES.AUTHENTICATION;
  if (err.statusCode === 403) return ERROR_CATEGORIES.AUTHORIZATION;
  if (err.statusCode === 404) return ERROR_CATEGORIES.NOT_FOUND;
  if (err.statusCode === 429) return ERROR_CATEGORIES.RATE_LIMIT;
  
  // Cloudinary errors
  if (err.name === 'CloudinaryError') return ERROR_CATEGORIES.EXTERNAL_SERVICE;
  
  // Email service errors
  if (err.code && err.code.includes('SMTP')) return ERROR_CATEGORIES.EXTERNAL_SERVICE;
  
  return ERROR_CATEGORIES.INTERNAL;
};

// Enhanced error formatter
const formatError = (err, req) => {
  const category = categorizeError(err);
  const requestId = req.requestId;
  
  // Base error object
  const errorResponse = {
    success: false,
    error: {
      category,
      message: err.message || 'Internal Server Error',
      requestId,
      timestamp: new Date().toISOString()
    }
  };

  // Add different fields based on error category
  switch (category) {
    case ERROR_CATEGORIES.VALIDATION:
      errorResponse.error.type = 'ValidationError';
      if (err.name === 'ValidationError') {
        errorResponse.error.details = Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message,
          value: e.value
        }));
      } else if (err.code === 11000) {
        const field = Object.keys(err.keyPattern)[0];
        errorResponse.error.details = [{
          field,
          message: `${field} already exists`,
          value: err.keyValue[field]
        }];
      }
      break;
      
    case ERROR_CATEGORIES.AUTHENTICATION:
      errorResponse.error.type = 'AuthenticationError';
      errorResponse.error.action = 'Please login again';
      break;
      
    case ERROR_CATEGORIES.AUTHORIZATION:
      errorResponse.error.type = 'AuthorizationError';
      errorResponse.error.action = 'Insufficient permissions';
      break;
      
    case ERROR_CATEGORIES.RATE_LIMIT:
      errorResponse.error.type = 'RateLimitError';
      errorResponse.error.action = 'Please try again later';
      break;
      
    case ERROR_CATEGORIES.EXTERNAL_SERVICE:
      errorResponse.error.type = 'ExternalServiceError';
      errorResponse.error.action = 'Service temporarily unavailable';
      break;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = {
      ...errorResponse.error.details,
      originalError: {
        name: err.name,
        code: err.code,
        statusCode: err.statusCode
      }
    };
  }

  return errorResponse;
};

// Enhanced error handler
const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'unknown';
  const category = categorizeError(err);
  
  // Log the error with structured logging
  Logger.error('Request error occurred', {
    requestId,
    category,
    errorName: err.name,
    errorMessage: err.message,
    statusCode: err.statusCode,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    ip: req.ip || req.connection.remoteAddress,
    userId: req.user?._id,
    username: req.user?.username,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Determine status code
  let statusCode = err.statusCode || 500;
  
  // Override status codes for specific error types
  switch (category) {
    case ERROR_CATEGORIES.VALIDATION:
      statusCode = 400;
      break;
    case ERROR_CATEGORIES.AUTHENTICATION:
      statusCode = 401;
      break;
    case ERROR_CATEGORIES.AUTHORIZATION:
      statusCode = 403;
      break;
    case ERROR_CATEGORIES.NOT_FOUND:
      statusCode = 404;
      break;
    case ERROR_CATEGORIES.RATE_LIMIT:
      statusCode = 429;
      break;
    case ERROR_CATEGORIES.EXTERNAL_SERVICE:
      statusCode = 503;
      break;
  }

  // Format and send error response
  const errorResponse = formatError(err, req);
  res.status(statusCode).json(errorResponse);
};

// Request completion logging middleware
export const requestCompletionLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'info';
    
    Logger.log(level, 'Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?._id,
      username: req.user?.username
    });
  });
  
  next();
};

export { errorHandler, Logger, ERROR_CATEGORIES }; 