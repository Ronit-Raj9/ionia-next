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
      required: [true, "Password is required"],
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
    }
  },
  {
    timestamps: true,
  }
);

// Hash password before save
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12); // Increased salt rounds for better security
  next();
});

// Verify password
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// Generate access token with enhanced security
userSchema.methods.generateAccessToken = function (additionalPayload = {}) {
  const jti = uuidv4(); // Unique token ID
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = 15 * 60; // 15 minutes in seconds
  
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
    process.env.REFRESH_TOKEN_SECRET,
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

// Invalidate specific token by JTI
userSchema.methods.invalidateToken = function(jti) {
  this.activeTokens = this.activeTokens.filter(token => token.jti !== jti);
  return this.save();
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

// Clean up expired tokens
userSchema.methods.cleanupExpiredTokens = function() {
  const now = new Date();
  this.activeTokens = this.activeTokens.filter(token => token.expiresAt > now);
  return this.save();
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
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
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
userSchema.index({ 'activeTokens.expiresAt': 1 });

export const User = mongoose.model("User", userSchema);
