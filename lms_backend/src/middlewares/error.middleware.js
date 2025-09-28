import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Enhanced Logger
export const Logger = {
  info: (message, meta = {}) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta);
  },
  error: (message, meta = {}) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, meta);
  },
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta);
  },
  debug: (message, meta = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, meta);
    }
  }
};

// Request ID Middleware
export const requestIdMiddleware = (req, res, next) => {
  req.requestId = req.headers['x-request-id'] || 
                  req.headers['x-correlation-id'] || 
                  `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.setHeader('X-Request-ID', req.requestId);
  next();
};

// Request Completion Logger
export const requestCompletionLogger = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress
    };
    
    if (res.statusCode >= 400) {
      Logger.error('Request completed with error', logData);
    } else {
      Logger.info('Request completed successfully', logData);
    }
  });
  
  next();
};

// Enhanced Auth Logging
export const enhancedAuthLogging = (req, res, next) => {
  if (req.path.includes('/auth/') || req.path.includes('/login') || req.path.includes('/register')) {
    const authData = {
      requestId: req.requestId,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    };
    
    Logger.info('Authentication request', authData);
  }
  
  next();
};

// Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  let error = err;
  
  // Log the error
  Logger.error('Error occurred', {
    requestId: req.requestId,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      query: req.query,
      params: req.params
    }
  });
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const message = Object.values(error.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message);
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    const message = `${field} already exists`;
    error = new ApiError(400, message);
  }
  
  // Mongoose cast error
  if (error.name === 'CastError') {
    const message = 'Invalid ID format';
    error = new ApiError(400, message);
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = new ApiError(401, message);
  }
  
  if (error.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = new ApiError(401, message);
  }
  
  // Default error
  if (!(error instanceof ApiError)) {
    error = new ApiError(500, 'Internal Server Error');
  }
  
  // Send error response
  res.status(error.statusCode).json(
    new ApiResponse(
      error.statusCode,
      null,
      error.message,
      {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method
      }
    )
  );
};

// 404 Handler
export const notFoundHandler = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`);
  next(error);
};
