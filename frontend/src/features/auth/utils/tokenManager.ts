// ==========================================
// 🔑 CENTRALIZED TOKEN MANAGER
// ==========================================

import { authAPI } from '../api/authApi';
import { authLogger } from './logger';

export interface TokenExpiry {
  access_expires_at: number;
  refresh_expires_at: number;
}

export interface TokenManagerConfig {
  refreshBufferSeconds: number;
  maxRetries: number;
  retryDelay: number;
  circuitBreakerThreshold: number;
  circuitBreakerResetTime: number;
}

const DEFAULT_CONFIG: TokenManagerConfig = {
  refreshBufferSeconds: 30,
  maxRetries: 3,
  retryDelay: 1000,
  circuitBreakerThreshold: 5,
  circuitBreakerResetTime: 5 * 60 * 1000, // 5 minutes
};

export class TokenManager {
  private refreshInterval: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private lastRefreshAttempt = 0;
  private lastSuccessfulRefresh = 0;
  private config: TokenManagerConfig;
  private onTokenExpired?: () => void;
  private onTokenRefreshed?: (expiry: TokenExpiry) => void;

  constructor(config: Partial<TokenManagerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Set callback for when tokens expire
   */
  setOnTokenExpired(callback: () => void): void {
    this.onTokenExpired = callback;
  }

  /**
   * Set callback for when tokens are refreshed
   */
  setOnTokenRefreshed(callback: (expiry: TokenExpiry) => void): void {
    this.onTokenRefreshed = callback;
  }

  /**
   * Start background token refresh
   */
  startBackgroundRefresh(expiry?: TokenExpiry): void {
    this.stopBackgroundRefresh();
    
    if (!expiry) {
      authLogger.warn('Cannot start background refresh without token expiry', {}, 'TOKEN');
      return;
    }

    const refreshTime = (expiry.access_expires_at * 1000) - (this.config.refreshBufferSeconds * 1000);
    const now = Date.now();
    
    if (refreshTime <= now) {
      // Token is already expired or expiring soon, refresh immediately
      this.refreshTokens();
      return;
    }

    const delay = refreshTime - now;
    
    authLogger.info('Scheduling token refresh', { 
      delay: Math.round(delay / 1000),
      expiresAt: new Date(expiry.access_expires_at).toISOString()
    }, 'TOKEN');

    this.refreshInterval = setTimeout(() => {
      this.refreshTokens();
    }, delay);
  }

  /**
   * Stop background token refresh
   */
  stopBackgroundRefresh(): void {
    if (this.refreshInterval) {
      clearTimeout(this.refreshInterval);
      this.refreshInterval = null;
      authLogger.debug('Background token refresh stopped', {}, 'TOKEN');
    }
  }

  /**
   * Refresh tokens
   */
  async refreshTokens(): Promise<void> {
    const now = Date.now();
    
    // Cooldown: prevent rapid successive refreshes (minimum 30 seconds between refreshes)
    const timeSinceLastRefresh = now - this.lastSuccessfulRefresh;
    if (timeSinceLastRefresh < 30000) { // 30 seconds cooldown
      authLogger.warn('Token refresh cooldown active, skipping refresh', { 
        timeSinceLastRefresh: Math.round(timeSinceLastRefresh / 1000)
      }, 'TOKEN');
      return;
    }
    
    // Circuit breaker: if too many failures, stop trying
    if (this.retryCount >= this.config.circuitBreakerThreshold) {
      const timeSinceLastAttempt = now - this.lastRefreshAttempt;
      if (timeSinceLastAttempt < this.config.circuitBreakerResetTime) {
        authLogger.warn('Circuit breaker active, skipping refresh', { 
          retryCount: this.retryCount,
          timeSinceLastAttempt: timeSinceLastAttempt / 1000
        }, 'TOKEN');
        return;
      } else {
        // Reset circuit breaker
        this.retryCount = 0;
        this.lastRefreshAttempt = 0;
      }
    }

    try {
      authLogger.tokenRefresh(true, { retryCount: this.retryCount });
      
      const response = await authAPI.refreshToken();
      
      if (response.tokenExpiry) {
        // Reset retry count on success
        this.retryCount = 0;
        this.lastRefreshAttempt = 0;
        this.lastSuccessfulRefresh = now;
        
        // Schedule next refresh
        this.startBackgroundRefresh(response.tokenExpiry);
        
        // Notify callback
        if (this.onTokenRefreshed) {
          this.onTokenRefreshed(response.tokenExpiry);
        }
        
        authLogger.info('Token refresh successful', { 
          expiresAt: new Date(response.tokenExpiry.access_expires_at * 1000).toISOString()
        }, 'TOKEN');
      }
      
    } catch (error: any) {
      this.retryCount++;
      this.lastRefreshAttempt = now;
      
      authLogger.tokenRefresh(false, { 
        error: error.message, 
        retryCount: this.retryCount 
      });
      
      // If refresh fails completely, notify callback
      if (this.retryCount >= this.config.maxRetries && this.onTokenExpired) {
        authLogger.error('Token refresh failed permanently', { 
          retryCount: this.retryCount 
        }, 'TOKEN');
        this.onTokenExpired();
      } else if (this.retryCount < this.config.maxRetries) {
        // Schedule retry
        setTimeout(() => {
          this.refreshTokens();
        }, this.config.retryDelay * this.retryCount);
      }
    }
  }

  /**
   * Schedule proactive refresh based on token expiry
   */
  scheduleProactiveRefresh(expiry?: TokenExpiry): void {
    if (expiry) {
      this.startBackgroundRefresh(expiry);
    }
  }

  /**
   * Check if tokens are expiring soon
   */
  isTokenExpiringSoon(expiry?: TokenExpiry): boolean {
    if (!expiry) return false;
    
    const now = Date.now();
    const timeUntilExpiry = expiry.access_expires_at - now;
    
    return timeUntilExpiry <= (this.config.refreshBufferSeconds * 1000);
  }

  /**
   * Get time until token expires
   */
  getTimeUntilExpiry(expiry?: TokenExpiry): number {
    if (!expiry) return 0;
    
    const now = Date.now();
    return Math.max(0, expiry.access_expires_at - now);
  }

  /**
   * Reset retry count (useful after successful login)
   */
  resetRetryCount(): void {
    this.retryCount = 0;
    this.lastRefreshAttempt = 0;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopBackgroundRefresh();
    this.onTokenExpired = undefined;
    this.onTokenRefreshed = undefined;
  }
}

// Singleton instance
export const tokenManager = new TokenManager();
