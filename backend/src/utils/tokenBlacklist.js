import { ApiError } from "./ApiError.js";

/**
 * Token Blacklist Manager
 * In production, this should use Redis for distributed systems
 * For now, using in-memory storage with automatic cleanup
 */
class TokenBlacklist {
  constructor() {
    this.blacklistedTokens = new Map();
    this.refreshTokens = new Map(); // Track active refresh tokens
    
    // Clean up expired tokens every 5 minutes (more frequent)
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, 5 * 60 * 1000);
    
    // Additional memory cleanup every 30 minutes
    setInterval(() => {
      this.performMemoryCleanup();
    }, 30 * 60 * 1000);
  }

  /**
   * Add token to blacklist
   * @param {string} token - JWT token to blacklist
   * @param {number} expiresAt - Token expiration timestamp
   */
  addToBlacklist(token, expiresAt) {
    if (!token) return;
    
    this.blacklistedTokens.set(token, {
      blacklistedAt: Date.now(),
      expiresAt: expiresAt * 1000 // Convert to milliseconds
    });
    
    console.log(`🚫 Token blacklisted: ${token.substring(0, 20)}...`);
  }

  /**
   * Check if token is blacklisted
   * @param {string} token - JWT token to check
   * @returns {boolean} - True if blacklisted
   */
  isBlacklisted(token) {
    if (!token) return false;
    
    const entry = this.blacklistedTokens.get(token);
    if (!entry) return false;
    
    // If token has expired naturally, remove from blacklist
    if (Date.now() > entry.expiresAt) {
      this.blacklistedTokens.delete(token);
      return false;
    }
    
    return true;
  }

  /**
   * Store active refresh token
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token
   * @param {number} expiresAt - Token expiration timestamp
   */
  storeRefreshToken(userId, refreshToken, expiresAt) {
    if (!this.refreshTokens.has(userId)) {
      this.refreshTokens.set(userId, new Set());
    }
    
    this.refreshTokens.get(userId).add({
      token: refreshToken,
      expiresAt: expiresAt * 1000,
      createdAt: Date.now()
    });
    
    console.log(`💾 Refresh token stored for user: ${userId}`);
  }

  /**
   * Invalidate refresh token
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to invalidate
   */
  invalidateRefreshToken(userId, refreshToken) {
    const userTokens = this.refreshTokens.get(userId);
    if (!userTokens) return;
    
    // Remove the specific token
    const updatedTokens = new Set();
    for (const tokenData of userTokens) {
      if (tokenData.token !== refreshToken) {
        updatedTokens.add(tokenData);
      }
    }
    
    this.refreshTokens.set(userId, updatedTokens);
    console.log(`🗑️ Refresh token invalidated for user: ${userId}`);
  }

  /**
   * Invalidate all refresh tokens for a user
   * @param {string} userId - User ID
   */
  invalidateAllRefreshTokens(userId) {
    this.refreshTokens.delete(userId);
    console.log(`🗑️ All refresh tokens invalidated for user: ${userId}`);
  }

  /**
   * Check if refresh token is valid
   * @param {string} userId - User ID
   * @param {string} refreshToken - Refresh token to validate
   * @returns {boolean} - True if valid
   */
  isRefreshTokenValid(userId, refreshToken) {
    const userTokens = this.refreshTokens.get(userId);
    if (!userTokens) return false;
    
    for (const tokenData of userTokens) {
      if (tokenData.token === refreshToken) {
        // Check if token has expired
        if (Date.now() > tokenData.expiresAt) {
          this.invalidateRefreshToken(userId, refreshToken);
          return false;
        }
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clean up expired tokens from memory
   */
  cleanupExpiredTokens() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean blacklisted access tokens
    for (const [token, data] of this.blacklistedTokens.entries()) {
      if (now > data.expiresAt) {
        this.blacklistedTokens.delete(token);
        cleanedCount++;
      }
    }
    
    // Clean expired refresh tokens
    for (const [userId, tokens] of this.refreshTokens.entries()) {
      const validTokens = new Set();
      for (const tokenData of tokens) {
        if (now <= tokenData.expiresAt) {
          validTokens.add(tokenData);
        } else {
          cleanedCount++;
        }
      }
      
      if (validTokens.size === 0) {
        this.refreshTokens.delete(userId);
      } else {
        this.refreshTokens.set(userId, validTokens);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired tokens`);
    }
  }

  /**
   * Perform additional memory cleanup
   * Removes old entries and optimizes memory usage
   */
  performMemoryCleanup() {
    const now = Date.now();
    let cleanedCount = 0;
    
    // Clean up very old blacklisted tokens (older than 24 hours)
    for (const [token, expiry] of this.blacklistedTokens.entries()) {
      if (now > expiry + (24 * 60 * 60 * 1000)) { // 24 hours after expiry
        this.blacklistedTokens.delete(token);
        cleanedCount++;
      }
    }
    
    // Clean up empty user entries
    for (const [userId, tokens] of this.refreshTokens.entries()) {
      if (tokens.size === 0) {
        this.refreshTokens.delete(userId);
        cleanedCount++;
      }
    }
    
    // PRODUCTION FIX: Limit memory usage for single instance
    const maxBlacklistedTokens = 2000; // Reduced for single instance
    const maxRefreshTokensPerUser = 20; // Reduced for single instance
    
    if (this.blacklistedTokens.size > maxBlacklistedTokens) {
      const entries = Array.from(this.blacklistedTokens.entries());
      // Keep only the most recent tokens
      entries.sort((a, b) => b[1].blacklistedAt - a[1].blacklistedAt);
      this.blacklistedTokens.clear();
      entries.slice(0, maxBlacklistedTokens).forEach(([token, data]) => {
        this.blacklistedTokens.set(token, data);
      });
      console.log(`🧹 Limited blacklisted tokens to ${maxBlacklistedTokens}`);
    }
    
    // Limit refresh tokens per user
    for (const [userId, tokens] of this.refreshTokens.entries()) {
      if (tokens.size > maxRefreshTokensPerUser) {
        const tokenArray = Array.from(tokens);
        tokenArray.sort((a, b) => b.createdAt - a.createdAt);
        const limitedTokens = new Set(tokenArray.slice(0, maxRefreshTokensPerUser));
        this.refreshTokens.set(userId, limitedTokens);
        console.log(`🧹 Limited refresh tokens for user ${userId} to ${maxRefreshTokensPerUser}`);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Memory cleanup: Removed ${cleanedCount} old entries`);
    }
  }

  /**
   * Get statistics about blacklisted tokens
   * @returns {object} - Statistics
   */
  getStats() {
    return {
      blacklistedTokens: this.blacklistedTokens.size,
      activeRefreshTokens: Array.from(this.refreshTokens.values())
        .reduce((total, tokens) => total + tokens.size, 0),
      usersWithTokens: this.refreshTokens.size
    };
  }
}

// Create singleton instance
const tokenBlacklist = new TokenBlacklist();

export { tokenBlacklist }; 