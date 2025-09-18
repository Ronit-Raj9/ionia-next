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
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Skip CSRF for public endpoints that don't modify state
  const publicEndpoints = ['/api/v1/users/register', '/api/v1/users/login'];
  if (publicEndpoints.includes(req.path)) {
    return next();
  }

  // Get CSRF token from header
  const csrfToken = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies['csrf-token'];

  if (!csrfToken || !csrfCookie) {
    throw new ApiError(403, 'CSRF token required');
  }

  // Validate CSRF token using constant-time comparison
  if (!constantTimeCompare(csrfToken, csrfCookie)) {
    throw new ApiError(403, 'Invalid CSRF token');
  }

  next();
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
    maxAge: 5 * 60 * 1000, // 5 minutes (same as access token)
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
