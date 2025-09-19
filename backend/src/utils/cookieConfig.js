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
  
  // In development, don't set domain so cookies work across localhost ports
  const domain = isProduction ? process.env.COOKIE_DOMAIN : undefined;
  
  return {
    httpOnly: true,                    // Prevent XSS attacks
    secure: isHttps,                   // Use environment variable
    sameSite: isHttps ? 'strict' : 'lax', // Use strict for better CSRF protection
    path: '/',                         // Available on all paths
    maxAge: 5 * 60 * 1000,            // 5 minutes
    domain: domain, // Don't set domain in development for localhost cross-port access
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
  
  // In development, don't set domain so cookies work across localhost ports
  const domain = isProduction ? process.env.COOKIE_DOMAIN : undefined;
  
  return {
    httpOnly: true,                    // Prevent XSS attacks
    secure: isHttps,                   // Use environment variable
    sameSite: isHttps ? 'strict' : 'lax', // Use strict for better CSRF protection
    path: '/',                         // Available on all paths for refresh
    maxAge: maxAge,                    // Dynamic lifetime based on rememberMe
    domain: domain, // Don't set domain in development for localhost cross-port access
  };
};

/**
 * Get cookie options for clearing tokens (logout)
 * @returns {object} Cookie options for clearing tokens
 */
export const getClearCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  // In development, don't set domain so cookies work across localhost ports
  const domain = isProduction ? process.env.COOKIE_DOMAIN : undefined;
  
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',
    maxAge: 0,                         // Expire immediately
    domain: domain,
  };
};

/**
 * Get cookie options for clearing refresh tokens specifically
 * @returns {object} Cookie options for clearing refresh tokens
 */
export const getClearRefreshCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  // In development, don't set domain so cookies work across localhost ports
  const domain = isProduction ? process.env.COOKIE_DOMAIN : undefined;
  
  return {
    httpOnly: true,
    secure: isHttps,
    sameSite: isHttps ? 'none' : 'lax',
    path: '/',                         // Match the set path
    maxAge: 0,                         // Expire immediately
    domain: domain,
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
  const isHttps = process.env.HTTPS_ENABLED === 'true';
  
  console.log('🍪 Cookie Configuration:');
  console.log(`   Environment: ${isProduction ? 'Production' : 'Development'}`);
  console.log(`   HTTPS Enabled: ${isHttps}`);
  console.log(`   Secure: ${isHttps}`);
  console.log(`   SameSite: ${isHttps ? 'strict' : 'lax'}`);
  console.log(`   Domain: ${isProduction ? (process.env.COOKIE_DOMAIN || '.ionia.sbs') : 'localhost'}`);
  console.log(`   Access Token TTL: 5 minutes`);
  console.log(`   Refresh Token TTL: 7 days`);
}; 