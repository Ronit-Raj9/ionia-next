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
        details,
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
          origin: req.get('Origin')
        }
      };

      await AuditLog.logEvent(logData);
      
      // Also log to console for immediate visibility
      if (success) {
        Logger.info(`Audit: ${event}`, {
          userId: user?._id,
          email: user?.email,
          ipAddress: logData.ipAddress,
          requestId: req.requestId
        });
      } else {
        Logger.warn(`Audit: ${event} failed`, {
          userId: user?._id,
          email: user?.email,
          ipAddress: logData.ipAddress,
          requestId: req.requestId,
          error: error?.message
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

  /**
   * Log Google OAuth events
   */
  static async logGoogleOAuthEvent(event, req, user = null, details = {}) {
    await this.logAuthEvent(event, req, user, {
      ...details,
      provider: 'google'
    }, true);
  }

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
    if (event.includes('google')) return 'google';
    if (details.authMethod) return details.authMethod;
    if (event.includes('admin')) return 'admin';
    if (event.includes('system')) return 'system';
    return 'email';
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
}

export { AuditLogger };
