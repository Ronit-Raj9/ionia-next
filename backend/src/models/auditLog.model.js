// backend/src/models/auditLog.model.js

import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    // 🔥 EVENT INFORMATION
    event: {
      type: String,
      required: true,
      enum: [
        // Authentication events
        'login_success',
        'login_failed',
        'logout',
        'register',
        'password_reset_request',
        'password_reset_success',
        'password_change',
        'email_verification_sent',
        'email_verification_success',
        'email_verification_failed',
        
        // Google OAuth events
        'google_oauth_login',
        'google_oauth_link',
        'google_oauth_unlink',
        
        // Security events
        'account_locked',
        'account_unlocked',
        'failed_attempts_reset',
        'suspicious_activity',
        
        // Admin events
        'admin_user_update',
        'admin_user_delete',
        'admin_role_change',
        
        // Session events
        'session_created',
        'session_expired',
        'session_revoked',
        
        // System events
        'rate_limit_exceeded',
        'token_blacklisted',
        'security_alert'
      ]
    },
    
    // 🔥 USER INFORMATION
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false // Some events might not have a user (failed logins)
    },
    
    // 🔥 REQUEST INFORMATION
    ipAddress: {
      type: String,
      required: true
    },
    
    userAgent: {
      type: String,
      required: false
    },
    
    requestId: {
      type: String,
      required: false
    },
    
    // 🔥 EVENT DETAILS
    details: {
      type: Schema.Types.Mixed,
      default: {}
    },
    
    // 🔥 AUTHENTICATION METHOD
    authMethod: {
      type: String,
      enum: ['email', 'google', 'admin', 'system'],
      required: false
    },
    
    // 🔥 SUCCESS/FAILURE STATUS
    success: {
      type: Boolean,
      required: true
    },
    
    // 🔥 ERROR INFORMATION (if applicable)
    error: {
      message: String,
      code: String,
      stack: String
    },
    
    // 🔥 LOCATION INFORMATION (if available)
    location: {
      country: String,
      city: String,
      region: String,
      timezone: String
    },
    
    // 🔥 METADATA
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    // Auto-expire logs after 1 year for performance
    expireAfterSeconds: 365 * 24 * 60 * 60
  }
);

// 🔥 INDEXES FOR PERFORMANCE
auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ ipAddress: 1, createdAt: -1 });
auditLogSchema.index({ success: 1, createdAt: -1 });
auditLogSchema.index({ authMethod: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

// 🔥 STATIC METHODS FOR LOGGING
auditLogSchema.statics.logEvent = async function(data) {
  try {
    const logEntry = new this({
      event: data.event,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      requestId: data.requestId,
      details: data.details || {},
      authMethod: data.authMethod,
      success: data.success,
      error: data.error,
      location: data.location,
      metadata: data.metadata || {}
    });
    
    await logEntry.save();
    return logEntry;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    // Don't throw - audit logging should not break the main flow
  }
};

// 🔥 STATIC METHODS FOR QUERYING
auditLogSchema.statics.getUserActivity = async function(userId, limit = 50) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

auditLogSchema.statics.getFailedLogins = async function(ipAddress, timeWindow = 15 * 60 * 1000) {
  const cutoffTime = new Date(Date.now() - timeWindow);
  return this.find({
    event: 'login_failed',
    ipAddress,
    createdAt: { $gte: cutoffTime }
  }).sort({ createdAt: -1 });
};

auditLogSchema.statics.getSecurityEvents = async function(timeWindow = 24 * 60 * 60 * 1000) {
  const cutoffTime = new Date(Date.now() - timeWindow);
  return this.find({
    event: { 
      $in: [
        'account_locked',
        'suspicious_activity',
        'rate_limit_exceeded',
        'security_alert'
      ]
    },
    createdAt: { $gte: cutoffTime }
  }).sort({ createdAt: -1 });
};

auditLogSchema.statics.getLoginStats = async function(timeWindow = 24 * 60 * 60 * 1000) {
  const cutoffTime = new Date(Date.now() - timeWindow);
  
  const stats = await this.aggregate([
    {
      $match: {
        event: { $in: ['login_success', 'login_failed', 'google_oauth_login'] },
        createdAt: { $gte: cutoffTime }
      }
    },
    {
      $group: {
        _id: '$event',
        count: { $sum: 1 }
      }
    }
  ]);
  
  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
