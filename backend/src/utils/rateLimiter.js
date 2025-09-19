import { ApiError } from "./ApiError.js";

/**
 * Rate Limiter for Authentication Endpoints
 * Prevents brute force attacks and abuse
 */
class RateLimiter {
  constructor() {
    this.attempts = new Map(); // Store login attempts by IP/user
    this.blockedIPs = new Map(); // Store temporarily blocked IPs
    
    // Clean up old attempts every 10 minutes
    setInterval(() => {
      this.cleanupOldAttempts();
    }, 10 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param {string} identifier - IP address or user identifier
   * @param {string} type - Type of request ('login', 'register', 'forgot-password')
   * @param {string} accountIdentifier - Optional account identifier (email) for account-based limiting
   * @returns {object} - { allowed: boolean, retryAfter?: number }
   */
  checkRateLimit(identifier, type = 'login', accountIdentifier = null) {
    // DEVELOPMENT MODE: Disable rate limiting
    if (process.env.NODE_ENV === 'development') {
      return { allowed: true };
    }
    
    const now = Date.now();
    const limits = this.getLimitsForType(type);
    
    // Check if IP is temporarily blocked
    const blockInfo = this.blockedIPs.get(identifier);
    if (blockInfo && now < blockInfo.blockedUntil) {
      const retryAfter = Math.ceil((blockInfo.blockedUntil - now) / 1000);
      return { 
        allowed: false, 
        retryAfter,
        reason: `Too many failed attempts. Try again in ${retryAfter} seconds.`
      };
    }

    // Check account-based rate limiting if account identifier provided
    if (accountIdentifier) {
      const accountBlockInfo = this.blockedIPs.get(`account:${accountIdentifier}`);
      if (accountBlockInfo && now < accountBlockInfo.blockedUntil) {
        const retryAfter = Math.ceil((accountBlockInfo.blockedUntil - now) / 1000);
        return { 
          allowed: false, 
          retryAfter,
          reason: `Account temporarily locked due to failed attempts. Try again in ${retryAfter} seconds.`
        };
      }
    }

    // Get current attempts for this identifier
    const userAttempts = this.attempts.get(identifier) || [];
    
    // Filter out old attempts (outside the time window)
    const recentAttempts = userAttempts.filter(
      attempt => now - attempt.timestamp < limits.windowMs
    );

    // Check if limit exceeded
    if (recentAttempts.length >= limits.maxAttempts) {
      // Block the IP temporarily
      this.blockIP(identifier, limits.blockDurationMs);
      
      const retryAfter = Math.ceil(limits.blockDurationMs / 1000);
      return { 
        allowed: false, 
        retryAfter,
        reason: `Rate limit exceeded. Try again in ${retryAfter} seconds.`
      };
    }

    return { allowed: true };
  }

  /**
   * Record a failed attempt
   * @param {string} identifier - IP address or user identifier
   * @param {string} type - Type of request
   */
  recordFailedAttempt(identifier, type = 'login') {
    const now = Date.now();
    const userAttempts = this.attempts.get(identifier) || [];
    
    userAttempts.push({
      timestamp: now,
      type,
      success: false
    });
    
    this.attempts.set(identifier, userAttempts);
    
    console.log(`🚨 Failed ${type} attempt recorded for ${identifier}`);
  }

  /**
   * Record a successful attempt (clears failed attempts)
   * @param {string} identifier - IP address or user identifier
   * @param {string} type - Type of request
   */
  recordSuccessfulAttempt(identifier, type = 'login') {
    // Clear failed attempts on successful login
    this.attempts.delete(identifier);
    this.blockedIPs.delete(identifier);
    
    console.log(`✅ Successful ${type} attempt for ${identifier} - cleared failed attempts`);
  }

  /**
   * Block an IP address temporarily
   * @param {string} identifier - IP address to block
   * @param {number} durationMs - Block duration in milliseconds
   */
  blockIP(identifier, durationMs) {
    const blockedUntil = Date.now() + durationMs;
    this.blockedIPs.set(identifier, {
      blockedAt: Date.now(),
      blockedUntil,
      reason: 'Rate limit exceeded'
    });
    
    console.log(`🔒 IP ${identifier} blocked until ${new Date(blockedUntil).toISOString()}`);
  }

  /**
   * Get rate limits for different request types
   * @param {string} type - Request type
   * @returns {object} - Rate limit configuration
   */
  getLimitsForType(type) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const limits = {
      login: {
        maxAttempts: isProduction ? 30 : 15,             // 5 attempts in production, 15 in dev
        windowMs: 15 * 60 * 1000, // in 15 minutes
        blockDurationMs: isProduction ? 30 * 60 * 1000 : 20 * 60 * 1000 // 30 min in prod, 20 min in dev
      },
      register: {
        maxAttempts: isProduction ? 15 : 15,            // 3 attempts in production, 15 in dev
        windowMs: 60 * 60 * 1000, // in 1 hour
        blockDurationMs: isProduction ? 60 * 60 * 1000 : 30 * 60 * 1000 // 1 hour in prod, 30 min in dev
      },
      'forgot-password': {
        maxAttempts: isProduction ? 15 : 15,            // 3 attempts in production, 15 in dev
        windowMs: 60 * 60 * 1000, // in 1 hour
        blockDurationMs: isProduction ? 60 * 60 * 1000 : 30 * 60 * 1000 // 1 hour in prod, 30 min in dev
      },
      'refresh-token': {
        maxAttempts: isProduction ? 15 : 15,           // 5 attempts in production, 15 in dev
        windowMs: 5 * 60 * 1000,  // in 5 minutes
        blockDurationMs: isProduction ? 15 * 60 * 1000 : 10 * 60 * 1000 // 15 min in prod, 10 min in dev
      }
    };

    return limits[type] || limits.login;
  }

  /**
   * Clean up old attempts and expired blocks
   */
  cleanupOldAttempts() {
    const now = Date.now();
    let cleanedAttempts = 0;
    let cleanedBlocks = 0;

    // Clean up old attempts
    for (const [identifier, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(
        attempt => now - attempt.timestamp < 60 * 60 * 1000 // Keep attempts for 1 hour
      );
      
      if (recentAttempts.length === 0) {
        this.attempts.delete(identifier);
        cleanedAttempts++;
      } else {
        this.attempts.set(identifier, recentAttempts);
      }
    }

    // Clean up expired blocks
    for (const [identifier, blockInfo] of this.blockedIPs.entries()) {
      if (now >= blockInfo.blockedUntil) {
        this.blockedIPs.delete(identifier);
        cleanedBlocks++;
      }
    }

    // Limit memory usage - keep only last 1000 identifiers
    if (this.attempts.size > 1000) {
      const entries = Array.from(this.attempts.entries());
      entries.sort((a, b) => {
        const aLastAttempt = a[1][a[1].length - 1]?.timestamp || 0;
        const bLastAttempt = b[1][b[1].length - 1]?.timestamp || 0;
        return bLastAttempt - aLastAttempt;
      });
      this.attempts.clear();
      entries.slice(0, 1000).forEach(([key, value]) => {
        this.attempts.set(key, value);
      });
      console.log(`🧹 Rate limiter: Limited attempts to 1000 identifiers`);
    }
    
    // Limit blocked IPs to 500
    if (this.blockedIPs.size > 500) {
      const entries = Array.from(this.blockedIPs.entries());
      entries.sort((a, b) => b[1].blockedUntil - a[1].blockedUntil);
      this.blockedIPs.clear();
      entries.slice(0, 500).forEach(([key, value]) => {
        this.blockedIPs.set(key, value);
      });
      console.log(`🧹 Rate limiter: Limited blocked IPs to 500`);
    }

    if (cleanedAttempts > 0 || cleanedBlocks > 0) {
      console.log(`🧹 Rate limiter cleanup: ${cleanedAttempts} attempts, ${cleanedBlocks} blocks`);
    }
  }

  /**
   * Get current statistics
   * @returns {object} - Rate limiter statistics
   */
  getStats() {
    return {
      activeAttempts: this.attempts.size,
      blockedIPs: this.blockedIPs.size,
      totalFailedAttempts: Array.from(this.attempts.values())
        .reduce((total, attempts) => total + attempts.length, 0)
    };
  }

  /**
   * Manually unblock an IP (for admin use)
   * @param {string} identifier - IP address to unblock
   */
  unblockIP(identifier) {
    this.blockedIPs.delete(identifier);
    this.attempts.delete(identifier);
    console.log(`🔓 IP ${identifier} manually unblocked`);
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Express middleware for rate limiting
 * @param {string} type - Type of request to rate limit
 * @returns {Function} - Express middleware function
 */
export const createRateLimitMiddleware = (type = 'login') => {
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const result = rateLimiter.checkRateLimit(identifier, type);
    const limits = rateLimiter.getLimitsForType(type);
    
    // Get current attempts for this identifier
    const userAttempts = rateLimiter.attempts.get(identifier) || [];
    const now = Date.now();
    const recentAttempts = userAttempts.filter(
      attempt => now - attempt.timestamp < limits.windowMs
    );
    
    // Always set informative headers
    res.set({
      'X-RateLimit-Limit': limits.maxAttempts,
      'X-RateLimit-Window': limits.windowMs,
      'X-RateLimit-Remaining': Math.max(0, limits.maxAttempts - recentAttempts.length),
      'X-RateLimit-Reset': new Date(Date.now() + limits.windowMs).toISOString()
    });
    
    if (!result.allowed) {
      // Set additional headers for blocked requests
      res.set({
        'Retry-After': result.retryAfter,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': new Date(Date.now() + (result.retryAfter * 1000)).toISOString()
      });
      
      throw new ApiError(429, result.reason);
    }
    
    // Attach rate limiter to request for use in controllers
    req.rateLimiter = rateLimiter;
    req.rateLimiterIdentifier = identifier;
    
    next();
  };
};

export { rateLimiter }; 