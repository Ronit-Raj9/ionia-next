// backend/src/utils/auditLogger.js

import { AuditLog } from '../models/auditLog.model.js';
import { Logger } from '../middlewares/error.middleware.js';

/**
 * 🔥 CENTRALIZED AUDIT LOGGING UTILITY
 * Handles all security and authentication event logging
 */
class AuditLogger {
  /**
   * Log authentication events
   */
  static async logAuthEvent(event, req, user = null, details = {}, success = true, error = null) {
    try {
      const logData = {
        event,
        userId: user?._id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        requestId: req.requestId,
        details: {
          ...details,
          // Add more context without changing functionality
          timestamp: new Date().toISOString(),
          referer: req.get('Referer'),
          origin: req.get('Origin'),
          acceptLanguage: req.get('Accept-Language'),
          acceptEncoding: req.get('Accept-Encoding'),
          contentType: req.get('Content-Type'),
          contentLength: req.get('Content-Length')
        },
        authMethod: this.getAuthMethod(event, details),
        success,
        error: error ? {
          message: error.message,
          code: error.code || error.status,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        } : null,
        metadata: {
          timestamp: new Date().toISOString(),
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer'),
          origin: req.get('Origin'),
          duration: req.startTime ? Date.now() - req.startTime : undefined
        }
      };

      await AuditLog.logEvent(logData);
      
      // Enhanced console logging with more context
      if (success) {
        Logger.info(`Audit: ${event}`, {
          userId: user?._id,
          email: user?.email,
          ipAddress: logData.ipAddress,
          requestId: req.requestId,
          duration: req.startTime ? `${Date.now() - req.startTime}ms` : undefined,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        });
      } else {
        Logger.warn(`Audit: ${event} failed`, {
          userId: user?._id,
          email: user?.email,
          ipAddress: logData.ipAddress,
          requestId: req.requestId,
          error: error?.message,
          duration: req.startTime ? `${Date.now() - req.startTime}ms` : undefined,
          userAgent: req.get('User-Agent'),
          referer: req.get('Referer')
        });
      }
    } catch (logError) {
      // Don't let audit logging break the main flow
      Logger.error('Audit logging failed', { error: logError.message });
    }
  }

  /**
   * Log login success
   */
  static async logLoginSuccess(req, user, authMethod = 'email') {
    await this.logAuthEvent('login_success', req, user, {
      authMethod,
      loginMethod: user.lastLoginMethod || authMethod
    }, true);
  }

  /**
   * Log login failure
   */
  static async logLoginFailure(req, email, reason, authMethod = 'email') {
    await this.logAuthEvent('login_failed', req, null, {
      attemptedEmail: email,
      reason,
      authMethod
    }, false, new Error(reason));
  }

  // Note: Google OAuth logging removed - using email/password only authentication

  /**
   * Log account security events
   */
  static async logSecurityEvent(event, req, user = null, details = {}) {
    await this.logAuthEvent(event, req, user, details, false);
  }

  /**
   * Log admin actions
   */
  static async logAdminAction(event, req, adminUser, targetUser = null, details = {}) {
    await this.logAuthEvent(event, req, adminUser, {
      ...details,
      targetUserId: targetUser?._id,
      targetEmail: targetUser?.email,
      adminRole: adminUser?.role
    }, true);
  }

  /**
   * Log password-related events
   */
  static async logPasswordEvent(event, req, user, details = {}) {
    await this.logAuthEvent(event, req, user, details, true);
  }

  /**
   * Log email verification events
   */
  static async logEmailVerificationEvent(event, req, user, details = {}) {
    await this.logAuthEvent(event, req, user, details, true);
  }

  /**
   * Log session events
   */
  static async logSessionEvent(event, req, user, details = {}) {
    await this.logAuthEvent(event, req, user, details, true);
  }

  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(req, details, user = null) {
    await this.logAuthEvent('suspicious_activity', req, user, details, false);
    
    // Additional alerting could be added here
    Logger.warn('Suspicious activity detected', {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      details,
      userId: user?._id
    });
  }

  /**
   * Log rate limiting events
   */
  static async logRateLimitExceeded(req, details) {
    await this.logAuthEvent('rate_limit_exceeded', req, null, details, false);
  }

  /**
   * Log token blacklisting
   */
  static async logTokenBlacklisted(req, user, tokenType, reason) {
    await this.logAuthEvent('token_blacklisted', req, user, {
      tokenType,
      reason
    }, true);
  }

  /**
   * Get authentication method from event and details
   */
  static getAuthMethod(event, details) {
    if (details.authMethod) return details.authMethod;
    if (event.includes('admin')) return 'admin';
    if (event.includes('system')) return 'system';
    return 'email'; // Only email authentication supported
  }

  /**
   * Get user activity for admin dashboard
   */
  static async getUserActivity(userId, limit = 50) {
    return AuditLog.getUserActivity(userId, limit);
  }

  /**
   * Get failed login attempts for an IP
   */
  static async getFailedLogins(ipAddress, timeWindow = 15 * 60 * 1000) {
    return AuditLog.getFailedLogins(ipAddress, timeWindow);
  }

  /**
   * Get security events for monitoring
   */
  static async getSecurityEvents(timeWindow = 24 * 60 * 60 * 1000) {
    return AuditLog.getSecurityEvents(timeWindow);
  }

  /**
   * Get login statistics
   */
  static async getLoginStats(timeWindow = 24 * 60 * 60 * 1000) {
    return AuditLog.getLoginStats(timeWindow);
  }

  /**
   * Clean up old audit logs (for maintenance)
   */
  static async cleanupOldLogs(daysToKeep = 365) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await AuditLog.deleteMany({
        createdAt: { $lt: cutoffDate }
      });
      
      Logger.info(`Cleaned up ${result.deletedCount} old audit logs`);
      return result.deletedCount;
    } catch (error) {
      Logger.error('Failed to cleanup old audit logs', { error: error.message });
      return 0;
    }
  }

  /**
   * Security event detection and analysis
   */
  static async analyzeLoginPatterns(req, user, success) {
    try {
      // Only analyze and log - don't block users
      const patterns = {
        ipChange: user.lastLoginIP && user.lastLoginIP !== req.ip,
        userAgentChange: user.lastUserAgent && user.lastUserAgent !== req.get('User-Agent'),
        rapidLogins: await this.checkRapidLogins(user._id),
        unusualHours: this.checkUnusualHours(),
        suspiciousLocation: await this.detectLocationChange(req.ip, user.lastLoginIP)
      };
      
      if (Object.values(patterns).some(Boolean)) {
        Logger.warn('Unusual login pattern detected', {
          userId: user._id,
          email: user.email,
          patterns,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString()
        });
        
        // Log as security event
        await this.logAuthEvent('suspicious_login_pattern', req, user, {
          patterns,
          riskLevel: this.calculateRiskLevel(patterns)
        }, false);
      }
    } catch (error) {
      Logger.error('Failed to analyze login patterns', { error: error.message });
    }
  }
  
  static async checkRapidLogins(userId) {
    try {
      const recentLogins = await AuditLog.find({
        userId,
        event: 'login_success',
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
      });
      
      return recentLogins.length > 3;
    } catch (error) {
      return false;
    }
  }
  
  static checkUnusualHours() {
    const hour = new Date().getHours();
    // Consider 11 PM to 5 AM as unusual hours
    return hour >= 23 || hour <= 5;
  }
  
  static async detectLocationChange(currentIP, lastIP) {
    // Placeholder for location detection
    // In production, you might use IP geolocation services
    if (!lastIP || !currentIP) return false;
    
    // Simple check - if IPs are completely different, might be location change
    // This is a basic implementation - you could enhance with actual geolocation
    return currentIP !== lastIP;
  }
  
  static calculateRiskLevel(patterns) {
    const riskFactors = Object.values(patterns).filter(Boolean).length;
    
    if (riskFactors >= 3) return 'high';
    if (riskFactors >= 2) return 'medium';
    if (riskFactors >= 1) return 'low';
    return 'none';
  }

  /**
   * Detect brute force attempts
   */
  static async detectBruteForce(ipAddress, timeWindow = 15 * 60 * 1000) {
    try {
      const recentFailures = await AuditLog.find({
        ipAddress,
        event: 'login_failed',
        createdAt: { $gte: new Date(Date.now() - timeWindow) }
      });

      if (recentFailures.length >= 10) {
        Logger.error('🚨 BRUTE FORCE DETECTED', {
          ipAddress,
          attempts: recentFailures.length,
          timeWindow: `${timeWindow / 1000}s`,
          timestamp: new Date().toISOString()
        });
        
        return {
          detected: true,
          attempts: recentFailures.length,
          timeWindow,
          riskLevel: 'critical'
        };
      }
      
      return { detected: false };
    } catch (error) {
      Logger.error('Failed to detect brute force', { error: error.message });
      return { detected: false };
    }
  }
}

export { AuditLogger };
