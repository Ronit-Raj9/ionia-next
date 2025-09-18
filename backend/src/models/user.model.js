// backend/src/models/user.model.js

import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    avatar: {
      type: String, // Cloudinary URL
    },
    coverImage: {
      type: String, // Cloudinary URL
    },
    password: {
      type: String,
      // Not required anymore - can be null for Google OAuth users
    },
    refreshToken: {
      type: String,
    },
    // Reset password fields
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
    // Role field with enhanced security
    role: {
      type: String,
      enum: ["admin", "user", "superadmin"],
      default: "user",
    },
    // Session tracking fields
    lastLoginAt: {
      type: Date,
    },
    lastLoginIP: {
      type: String,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
    },
    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    // Token tracking
    activeTokens: [{
      jti: String,
      type: {
        type: String,
        enum: ['access', 'refresh'],
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
      expiresAt: Date,
      ip: String,
      userAgent: String,
      revoked: {
        type: Boolean,
        default: false,
      },
      revokedAt: Date,
    }],
    
    // Email verification fields
    emailVerificationToken: {
      type: String,
      default: null
    },
    emailVerificationExpires: {
      type: Date,
      default: null
    },
    emailVerificationAttempts: {
      count: {
        type: Number,
        default: 0
      },
      lastAttempt: {
        type: Date,
        default: null
      },
      blocked: {
        type: Boolean,
        default: false
      },
      blockedUntil: {
        type: Date,
        default: null
      }
    },

    // Note: Google OAuth fields removed - using email/password only authentication
    
    // 🔥 ACCOUNT SECURITY FIELDS
    failedLoginAttempts: {
      count: {
        type: Number,
        default: 0
      },
      lastAttempt: {
        type: Date,
        default: null
      },
      lockedUntil: {
        type: Date,
        default: null
      }
    },
    
    // Note: Login method tracking removed - using email/password only authentication
  },
  {
    timestamps: true,
  }
);

// 🔥 CUSTOM VALIDATION: Ensure password is set for new users
userSchema.pre('save', async function(next) {
  // Skip validation for password updates
  if (this.isModified('password') && !this.isNew) {
    return next();
  }
  
  // For new users, ensure password is set (email/password only authentication)
  if (this.isNew && !this.password) {
    return next(new Error('Password is required for new users'));
  }
  
  next();
});

// Hash password before save (only if password is provided)
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12); // Increased salt rounds for better security
  next();
});

// Verify password
userSchema.methods.isPasswordCorrect = async function (password) {
  if (!this.password) return false; // No password set (Google OAuth user)
  return await bcrypt.compare(password, this.password);
};

// Note: Google OAuth methods removed - using email/password only authentication

// Check if user has a password set
userSchema.methods.hasPassword = function() {
  return this.password && this.password.trim() !== '';
};

// 🔥 ACCOUNT LOCKOUT METHODS
userSchema.methods.recordFailedLoginAttempt = function() {
  this.failedLoginAttempts.count += 1;
  this.failedLoginAttempts.lastAttempt = new Date();
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.failedLoginAttempts.count >= 5) {
    this.failedLoginAttempts.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  }
  
  return this.save();
};

userSchema.methods.resetFailedLoginAttempts = function() {
  this.failedLoginAttempts = {
    count: 0,
    lastAttempt: null,
    lockedUntil: null
  };
  return this.save();
};

userSchema.methods.isAccountLocked = function() {
  if (!this.failedLoginAttempts.lockedUntil) {
    return false;
  }
  
  // Check if lock period has expired
  if (this.failedLoginAttempts.lockedUntil < new Date()) {
    this.resetFailedLoginAttempts();
    return false;
  }
  
  return true;
};

// Note: Google OAuth static methods removed - using email/password only authentication

// Generate access token with enhanced security
userSchema.methods.generateAccessToken = function (additionalPayload = {}) {
  const jti = uuidv4(); // Unique token ID
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 5 * 60; // 5 minutes in seconds
  
  const payload = {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
    role: this.role,
    jti, // JWT ID for tracking
    iat: now,
    exp: now + expiresIn,
    ...additionalPayload,
  };

  const accessToken = jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    {
      algorithm: 'HS256', // Explicitly specify algorithm
    }
  );

  // Track the token
  this.activeTokens.push({
    jti,
    type: 'access',
    expiresAt: new Date((now + expiresIn) * 1000),
    ip: additionalPayload.ip,
    userAgent: additionalPayload.userAgent,
  });

  return accessToken;
};

// Generate refresh token with enhanced security
userSchema.methods.generateRefreshToken = function (additionalPayload = {}) {
  const jti = uuidv4(); // Unique token ID
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds
  
  const payload = {
    _id: this._id,
    jti, // JWT ID for tracking
    iat: now,
    exp: now + expiresIn,
    type: 'refresh',
  };

  const refreshToken = jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET,
    {
      algorithm: 'HS256', // Explicitly specify algorithm
    }
  );

  // Track the token
  this.activeTokens.push({
    jti,
    type: 'refresh',
    expiresAt: new Date((now + expiresIn) * 1000),
    ip: additionalPayload.ip,
    userAgent: additionalPayload.userAgent,
  });

  return refreshToken;
};

// Invalidate specific token by JTI (atomic operation)
userSchema.methods.invalidateToken = async function(jti) {
  const result = await this.updateOne({
    $pull: {
      activeTokens: { jti: jti }
    }
  });
  return result;
};

// Atomic refresh token rotation with reuse detection
userSchema.methods.rotateRefreshToken = async function(oldJti, newTokenData) {
  const session = await this.db.startSession();
  
  try {
    let result;
    await session.withTransaction(async () => {
      // Check if old token exists and is not revoked
      const oldToken = this.activeTokens.find(token => 
        token.jti === oldJti && token.type === 'refresh'
      );
      
      if (!oldToken) {
        throw new Error('Invalid or already revoked refresh token');
      }
      
      // Check for token reuse (security breach)
      if (oldToken.revoked) {
        // Token reuse detected - revoke all sessions for security
        await this.updateOne({
          $set: {
            'activeTokens.$[].revoked': true,
            'activeTokens.$[].revokedAt': new Date()
          }
        }, { session });
        
        throw new Error('Token reuse detected - all sessions revoked');
      }
      
      // Mark old token as revoked
      await this.updateOne({
        $set: {
          'activeTokens.$[elem].revoked': true,
          'activeTokens.$[elem].revokedAt': new Date()
        }
      }, {
        arrayFilters: [{ 'elem.jti': oldJti }],
        session
      });
      
      // Add new refresh token
      await this.updateOne({
        $push: {
          activeTokens: {
            jti: newTokenData.jti,
            type: 'refresh',
            createdAt: new Date(),
            expiresAt: newTokenData.expiresAt,
            ip: newTokenData.ip,
            userAgent: newTokenData.userAgent,
            revoked: false
          }
        }
      }, { session });
      
      result = { success: true };
    });
    
    return result;
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
};

// Invalidate all tokens of a specific type
userSchema.methods.invalidateTokensByType = function(type) {
  this.activeTokens = this.activeTokens.filter(token => token.type !== type);
  return this.save();
};

// Invalidate all tokens (logout from all devices)
userSchema.methods.invalidateAllTokens = function() {
  this.activeTokens = [];
  this.refreshToken = undefined;
  return this.save();
};

// Clean up expired tokens using atomic operations
userSchema.methods.cleanupExpiredTokens = async function() {
  const now = new Date();
  await this.updateOne({
    $pull: {
      activeTokens: { expiresAt: { $lt: now } }
    }
  });
  return this;
};

// Get active sessions count
userSchema.methods.getActiveSessionsCount = function() {
  const now = new Date();
  return this.activeTokens.filter(token => 
    token.type === 'refresh' && token.expiresAt > now
  ).length;
};

// Update last activity
userSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  return this.save({ validateBeforeSave: false });
};

// Static method to find user by refresh token
userSchema.statics.findByRefreshToken = async function(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET);
    const user = await this.findById(decoded._id);
    
    if (!user) return null;
    
    // Check if token exists in user's active tokens
    const tokenExists = user.activeTokens.some(token => 
      token.jti === decoded.jti && token.type === 'refresh'
    );
    
    return tokenExists ? user : null;
  } catch (error) {
    return null;
  }
};

// Email verification methods
userSchema.methods.generateEmailVerificationToken = function() {
  const token = uuidv4();
  this.emailVerificationToken = token;
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  // Reset verification attempts when generating new token
  this.emailVerificationAttempts = {
    count: 0,
    lastAttempt: null,
    blocked: false,
    blockedUntil: null
  };
  return token;
};

userSchema.methods.isEmailVerificationTokenValid = function(token) {
  if (!this.emailVerificationToken || !this.emailVerificationExpires) {
    return false;
  }
  
  return this.emailVerificationToken === token && 
         this.emailVerificationExpires > new Date();
};

userSchema.methods.clearEmailVerificationToken = function() {
  this.emailVerificationToken = null;
  this.emailVerificationExpires = null;
  return this.save();
};

userSchema.methods.incrementEmailVerificationAttempts = function() {
  if (!this.emailVerificationAttempts) {
    this.emailVerificationAttempts = {
      count: 0,
      lastAttempt: null,
      blocked: false,
      blockedUntil: null
    };
  }
  
  this.emailVerificationAttempts.count += 1;
  this.emailVerificationAttempts.lastAttempt = new Date();
  
  // Block after 5 failed attempts for 1 hour
  if (this.emailVerificationAttempts.count >= 5) {
    this.emailVerificationAttempts.blocked = true;
    this.emailVerificationAttempts.blockedUntil = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  }
  
  return this.save();
};

userSchema.methods.isEmailVerificationBlocked = function() {
  if (!this.emailVerificationAttempts || !this.emailVerificationAttempts.blocked) {
    return false;
  }
  
  // Check if block period has expired
  if (this.emailVerificationAttempts.blockedUntil && 
      this.emailVerificationAttempts.blockedUntil < new Date()) {
    this.emailVerificationAttempts.blocked = false;
    this.emailVerificationAttempts.blockedUntil = null;
    this.emailVerificationAttempts.count = 0;
    this.save();
    return false;
  }
  
  return this.emailVerificationAttempts.blocked;
};

userSchema.methods.resetEmailVerificationAttempts = function() {
  this.emailVerificationAttempts = {
    count: 0,
    lastAttempt: null,
    blocked: false,
    blockedUntil: null
  };
  return this.save();
};

// Performance indexes (removed duplicate email and username indexes)
// email and username already have unique: true which creates indexes automatically
userSchema.index({ role: 1 });
userSchema.index({ lastActivity: 1 });
userSchema.index({ 'activeTokens.jti': 1 });
userSchema.index({ 'activeTokens.expiresAt': 1 }, { expireAfterSeconds: 0 }); // TTL index for automatic cleanup
userSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 }); // TTL index for password reset tokens
userSchema.index({ emailVerificationExpires: 1 }, { expireAfterSeconds: 0 }); // TTL index for email verification tokens
// userSchema.index({ googleId: 1 }); // Index for Google OAuth lookups

export const User = mongoose.model("User", userSchema);