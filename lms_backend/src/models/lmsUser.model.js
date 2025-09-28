import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { LMS_ROLES } from '../constants.js';

const lmsUserSchema = new mongoose.Schema({
  // Basic Information
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters']
  },
  
  // Profile Information
  avatar: {
    type: String, // Cloudinary URL
    default: null
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  
  // LMS-specific fields
  role: {
    type: String,
    enum: Object.values(LMS_ROLES),
    default: LMS_ROLES.STUDENT
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true // Allows null values but ensures uniqueness when present
  },
  grade: {
    type: String,
    enum: ['9', '10', '11', '12', 'college'],
    default: null
  },
  subjects: [{
    type: String,
    enum: ['physics', 'chemistry', 'mathematics', 'biology', 'english', 'computer_science']
  }],
  
  // Authentication & Security
  refreshToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    default: null
  },
  emailVerificationExpires: {
    type: Date,
    default: null
  },
  
  // Activity Tracking
  lastLoginAt: {
    type: Date,
    default: null
  },
  lastLoginIP: {
    type: String,
    default: null
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    default: null
  },
  
  // LMS Progress Tracking
  totalQuestionsAttempted: {
    type: Number,
    default: 0
  },
  totalQuestionsCorrect: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0
  },
  learningStreak: {
    type: Number,
    default: 0
  },
  lastLearningDate: {
    type: Date,
    default: null
  },
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      reminders: {
        type: Boolean,
        default: true
      }
    },
    learningGoals: {
      dailyQuestions: {
        type: Number,
        default: 10,
        min: 1,
        max: 100
      },
      focusSubjects: [{
        type: String,
        enum: ['physics', 'chemistry', 'mathematics', 'biology', 'english', 'computer_science']
      }]
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
lmsUserSchema.index({ email: 1 });
lmsUserSchema.index({ username: 1 });
lmsUserSchema.index({ role: 1 });
lmsUserSchema.index({ isActive: 1 });
lmsUserSchema.index({ lastActivity: -1 });

// Virtual for accuracy percentage
lmsUserSchema.virtual('accuracyPercentage').get(function() {
  if (this.totalQuestionsAttempted === 0) return 0;
  return Math.round((this.totalQuestionsCorrect / this.totalQuestionsAttempted) * 100);
});

// Pre-save middleware to hash password
lmsUserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
lmsUserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate student ID
lmsUserSchema.methods.generateStudentId = function() {
  if (this.role === LMS_ROLES.STUDENT && !this.studentId) {
    const year = new Date().getFullYear().toString().slice(-2);
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.studentId = `LMS${year}${random}`;
  }
  return this.studentId;
};

// Method to update learning streak
lmsUserSchema.methods.updateLearningStreak = function() {
  const today = new Date();
  const lastLearning = this.lastLearningDate;
  
  if (!lastLearning) {
    this.learningStreak = 1;
  } else {
    const daysDiff = Math.floor((today - lastLearning) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.learningStreak += 1;
    } else if (daysDiff > 1) {
      this.learningStreak = 1;
    }
    // If daysDiff === 0, streak remains the same
  }
  
  this.lastLearningDate = today;
  return this.learningStreak;
};

// Static method to find active users
lmsUserSchema.statics.findActiveUsers = function() {
  return this.find({ isActive: true, isBlocked: false });
};

// Static method to find users by role
lmsUserSchema.statics.findByRole = function(role) {
  return this.find({ role, isActive: true, isBlocked: false });
};

export const LMSUser = mongoose.model('LMSUser', lmsUserSchema);
