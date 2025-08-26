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
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  return {
    httpOnly: true,                    // Prevent XSS attacks
    secure: isHttps,                   // Use environment variable
    sameSite: isHttps ? 'none' : 'lax', // Align with secure setting
    path: '/',                         // Available on all paths
    maxAge: 15 * 60 * 1000,           // 15 minutes
    domain: process.env.COOKIE_DOMAIN || undefined, // Use environment variable
  };
};

/**
 * Get secure cookie options for refresh tokens
 * @param {boolean} rememberMe - Whether to extend cookie lifetime
 * @returns {object} Cookie options for refresh tokens
 */
export const getRefreshTokenCookieOptions = (rememberMe = false) => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  // Set cookie lifetime based on rememberMe flag
  const maxAge = rememberMe 
    ? 30 * 24 * 60 * 60 * 1000  // 30 days for "remember me"
    : 7 * 24 * 60 * 60 * 1000;  // 7 days for normal sessions
  
  return {
    httpOnly: true,                    // Prevent XSS attacks
    secure: isHttps,                   // Use environment variable
    sameSite: isHttps ? 'none' : 'lax', // Align with secure setting
    path: '/',                         // Available on all paths for refresh
    maxAge: maxAge,                    // Dynamic lifetime based on rememberMe
    domain: process.env.COOKIE_DOMAIN || undefined, // Use environment variable
  };
};

/**
 * Get cookie options for clearing tokens (logout)
 * @returns {object} Cookie options for clearing tokens
 */
export const getClearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: 0,                         // Expire immediately
    domain: process.env.COOKIE_DOMAIN || undefined,
  };
};

/**
 * Get cookie options for clearing refresh tokens specifically
 * @returns {object} Cookie options for clearing refresh tokens
 */
export const getClearRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',                         // Match the set path
    maxAge: 0,                         // Expire immediately
    domain: process.env.COOKIE_DOMAIN || undefined,
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