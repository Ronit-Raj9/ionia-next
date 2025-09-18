import crypto from 'crypto';
import { ApiError } from '../utils/ApiError.js';

/**
 * CSRF Protection Middleware
 * Implements double-submit cookie pattern for CSRF protection
 */

/**
 * Generate CSRF token
 * @returns {string} CSRF token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * CSRF Protection Middleware
 * Validates CSRF token using double-submit cookie pattern
 */
export const csrfProtection = (req, res, next) => {
  try {
    // Skip CSRF for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
      return next();
    }

    // CRITICAL SECURITY FIX: Remove CSRF bypass for auth endpoints
    // Login and register endpoints should be protected by CSRF in production
    // This prevents CSRF attacks on authentication flows

    // Get CSRF token from header and cookie
    const csrfToken = req.headers['x-csrf-token'];
    const csrfCookie = req.cookies['csrf-token'];

    // Enhanced validation with detailed error messages
    if (!csrfToken && !csrfCookie) {
      throw new ApiError(403, 'CSRF token required', [], 'CSRF_TOKEN_MISSING');
    }

    if (!csrfToken) {
      throw new ApiError(403, 'CSRF token missing in header', [], 'CSRF_HEADER_MISSING');
    }

    if (!csrfCookie) {
      throw new ApiError(403, 'CSRF token missing in cookie', [], 'CSRF_COOKIE_MISSING');
    }

    // Validate CSRF token using constant-time comparison
    if (!constantTimeCompare(csrfToken, csrfCookie)) {
      // Log security event for monitoring
      console.warn('🚨 CSRF token mismatch detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      });
      
      throw new ApiError(403, 'Invalid CSRF token', [], 'CSRF_TOKEN_MISMATCH');
    }

    // CSRF validation successful
    console.debug('✅ CSRF validation successful', {
      path: req.path,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    next();
  } catch (error) {
    // Ensure error is properly formatted
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle unexpected errors
    console.error('🚨 CSRF validation error:', error);
    throw new ApiError(500, 'CSRF validation failed', [], 'CSRF_VALIDATION_ERROR');
  }
};

/**
 * Set CSRF token cookie
 * @param {object} res - Express response object
 * @param {string} token - CSRF token
 */
export const setCSRFTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  res.cookie('csrf-token', token, {
    httpOnly: false, // Must be accessible to JavaScript for double-submit
    secure: isHttps,
    sameSite: isHttps ? 'strict' : 'lax',
    path: '/',
    maxAge: 5 * 60 * 1000, // 5 minutes - match access token
  });
};

/**
 * Constant-time string comparison to prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
export const constantTimeCompare = (a, b) => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

/**
 * Middleware to generate and set CSRF token for authenticated users
 */
export const generateCSRFForAuth = (req, res, next) => {
  // Only generate CSRF token for authenticated users
  if (req.user) {
    const csrfToken = generateCSRFToken();
    setCSRFTokenCookie(res, csrfToken);
    
    // Add CSRF token to response for frontend
    res.locals.csrfToken = csrfToken;
  }
  
  next();
};

/**
 * CSRF Test Endpoint for verification
 * This endpoint helps verify CSRF protection is working correctly
 */
export const csrfTestEndpoint = (req, res) => {
  try {
    // This endpoint requires CSRF protection
    res.json({
      success: true,
      message: 'CSRF protection is working correctly',
      data: {
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
        csrfValidated: true
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'CSRF test endpoint error',
      error: error.message
    });
  }
};
