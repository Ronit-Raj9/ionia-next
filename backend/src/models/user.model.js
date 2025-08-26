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

    // 🔥 GOOGLE OAUTH FIELDS
    googleId: {
      type: String,
      sparse: true, // Allows multiple null values but unique for non-null
      index: true,
    },
    googleProfile: {
      id: String,
      displayName: String,
      emails: [{
        value: String,
        verified: Boolean
      }],
      photos: [{
        value: String
      }],
      provider: {
        type: String,
        default: 'google'
      }
    },
    
    // 🔥 AUTHENTICATION PROVIDER TRACKING
    authProviders: [{
      provider: {
        type: String,
        enum: ['email', 'google'],
        required: true
      },
      linkedAt: {
        type: Date,
        default: Date.now
      },
      isActive: {
        type: Boolean,
        default: true
      }
    }],
    
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
    
    // 🔥 AUDIT LOGGING
    lastLoginMethod: {
      type: String,
      enum: ['email', 'google'],
      default: null
    },
    
    // 🔥 PREFERRED AUTH METHOD (optional)
    preferredAuthMethod: {
      type: String,
      enum: ['email', 'google'],
      default: null
    }
  },
  {
    timestamps: true,
  }
);

// 🔥 CUSTOM VALIDATION: Ensure at least one auth method
userSchema.pre('save', async function(next) {
  // Skip validation for password updates
  if (this.isModified('password') && !this.isNew) {
    return next();
  }
  
  // For new users or when removing auth methods, ensure at least one exists
  if (this.isNew || this.isModified('password') || this.isModified('googleId')) {
    if (!this.canAuthenticate()) {
      return next(new Error('User must have at least one authentication method (password or Google OAuth)'));
    }
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

// 🔥 GOOGLE OAUTH METHODS
userSchema.methods.linkGoogleAccount = function(googleProfile) {
  this.googleId = googleProfile.id;
  this.googleProfile = {
    id: googleProfile.id,
    displayName: googleProfile.displayName,
    emails: googleProfile.emails,
    photos: googleProfile.photos,
    provider: 'google'
  };
  
  // Add Google to auth providers if not already present
  const hasGoogleProvider = this.authProviders.some(provider => provider.provider === 'google');
  if (!hasGoogleProvider) {
    this.authProviders.push({
      provider: 'google',
      linkedAt: new Date(),
      isActive: true
    });
  }
  
  // Auto-verify email if Google email is verified
  if (googleProfile.emails && googleProfile.emails[0] && googleProfile.emails[0].verified) {
    this.isEmailVerified = true;
  }
  
  return this.save();
};

userSchema.methods.unlinkGoogleAccount = function() {
  // Use the hasPassword method for consistency
  if (!this.hasPassword()) {
    throw new Error('Cannot unlink Google account: No password set. Please set a password first.');
  }
  
  this.googleId = null;
  this.googleProfile = null;
  
  // Remove Google from auth providers
  this.authProviders = this.authProviders.filter(provider => provider.provider !== 'google');
  
  return this.save();
};

userSchema.methods.hasAuthProvider = function(provider) {
  return this.authProviders.some(p => p.provider === provider && p.isActive);
};

userSchema.methods.getAuthProviders = function() {
  return this.authProviders.filter(p => p.isActive).map(p => p.provider);
};

// Check if user can authenticate (has at least one auth method)
userSchema.methods.canAuthenticate = function() {
  const hasPassword = this.password && this.password.trim() !== '';
  const hasGoogle = this.googleId && this.googleId.trim() !== '';
  return hasPassword || hasGoogle;
};

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

// 🔥 STATIC METHODS FOR GOOGLE OAUTH
userSchema.statics.findOrCreateGoogleUser = async function(googleProfile) {
  try {
    // First, try to find by Google ID
    let user = await this.findOne({ googleId: googleProfile.id });
    
    if (user) {
      // Update Google profile data
      user.googleProfile = {
        id: googleProfile.id,
        displayName: googleProfile.displayName,
        emails: googleProfile.emails,
        photos: googleProfile.photos,
        provider: 'google'
      };
      user.lastLoginMethod = 'google';
      user.lastLoginAt = new Date();
      await user.save();
      return user;
    }
    
    // If not found by Google ID, try to find by email
    const email = googleProfile.emails[0]?.value;
    if (email) {
      user = await this.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Link Google account to existing user
        await user.linkGoogleAccount(googleProfile);
        user.lastLoginMethod = 'google';
        user.lastLoginAt = new Date();
        await user.save();
        return user;
      }
    }
    
    // Create new user with Google OAuth
    const username = await this.generateUniqueUsername(googleProfile.displayName);
    
    user = new this({
      email: email,
      fullName: googleProfile.displayName,
      username: username,
      avatar: googleProfile.photos[0]?.value,
      isEmailVerified: googleProfile.emails[0]?.verified || false,
      lastLoginMethod: 'google',
      lastLoginAt: new Date()
    });
    
    await user.linkGoogleAccount(googleProfile);
    return user;
    
  } catch (error) {
    throw new Error(`Failed to find or create Google user: ${error.message}`);
  }
};

userSchema.statics.generateUniqueUsername = async function(baseName) {
  let username = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 15);
  
  let counter = 1;
  let finalUsername = username;
  
  while (await this.findOne({ username: finalUsername })) {
    finalUsername = `${username}${counter}`;
    counter++;
    
    if (counter > 100) {
      // Fallback to timestamp-based username
      finalUsername = `user${Date.now()}`;
      break;
    }
  }
  
  return finalUsername;
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
userSchema.index({ 'activeTokens.expiresAt': 1 });
userSchema.index({ googleId: 1 }); // Index for Google OAuth lookups

export const User = mongoose.model("User", userSchema);