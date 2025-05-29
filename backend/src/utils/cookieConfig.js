/**
 * Centralized Cookie Configuration
 * Ensures consistent and secure cookie settings across all auth endpoints
 */

/**
 * Get secure cookie options for access tokens
 * @returns {object} Cookie options for access tokens
 */
export const getAccessTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,                    // Prevent XSS attacks
    secure: isProduction,              // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // CSRF protection
    path: '/',                         // Available on all paths
    maxAge: 15 * 60 * 1000,           // 15 minutes
    domain: isProduction ? '.ionia.sbs' : undefined, // Domain for production
  };
};

/**
 * Get secure cookie options for refresh tokens
 * @returns {object} Cookie options for refresh tokens
 */
export const getRefreshTokenCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,                    // Prevent XSS attacks
    secure: isProduction,              // HTTPS only in production
    sameSite: isProduction ? 'none' : 'lax', // CSRF protection
    path: '/api/v1/users/refresh-token', // Only available on refresh endpoint
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
    domain: isProduction ? '.ionia.sbs' : undefined, // Domain for production
  };
};

/**
 * Get cookie options for clearing tokens (logout)
 * @returns {object} Cookie options for clearing tokens
 */
export const getClearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: 0,                         // Expire immediately
    domain: isProduction ? '.ionia.sbs' : undefined,
  };
};

/**
 * Get cookie options for clearing refresh tokens specifically
 * @returns {object} Cookie options for clearing refresh tokens
 */
export const getClearRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/v1/users/refresh-token',
    maxAge: 0,                         // Expire immediately
    domain: isProduction ? '.ionia.sbs' : undefined,
  };
};

/**
 * Validate cookie configuration
 * @returns {boolean} True if configuration is valid
 */
export const validateCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, ensure we have proper domain configuration
    if (!process.env.COOKIE_DOMAIN) {
      console.warn('⚠️ COOKIE_DOMAIN not set in production environment');
    }
    
    // Ensure HTTPS is being used
    if (!process.env.HTTPS_ENABLED) {
      console.warn('⚠️ HTTPS should be enabled in production for secure cookies');
    }
  }
  
  return true;
};

/**
 * Log cookie configuration for debugging
 */
export const logCookieConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log('🍪 Cookie Configuration:');
  console.log(`   Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`   Secure: ${isProduction}`);
  console.log(`   SameSite: ${isProduction ? 'none' : 'lax'}`);
  console.log(`   Domain: ${isProduction ? '.ionia.sbs' : 'localhost'}`);
  console.log(`   Access Token TTL: 15 minutes`);
  console.log(`   Refresh Token TTL: 7 days`);
}; 