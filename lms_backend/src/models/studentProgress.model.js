import mongoose from 'mongoose';
import { STUDENT_PROGRESS_STATUS } from '../constants.js';

const studentProgressSchema = new mongoose.Schema({
  // Basic Information
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LMSUser',
    required: true
  },
  chainId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuestionChain',
    required: true
  },
  
  // Progress Tracking
  currentQuestionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    default: null
  },
  currentQuestionOrder: {
    type: Number,
    default: 0
  },
  
  // Session Information
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  lastActivityTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date,
    default: null
  },
  
  // Progress Status
  status: {
    type: String,
    enum: Object.values(STUDENT_PROGRESS_STATUS),
    default: STUDENT_PROGRESS_STATUS.NOT_STARTED
  },
  completionPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Question Attempts
  questionAttempts: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    attemptNumber: {
      type: Number,
      default: 1
    },
    startTime: {
      type: Date,
      required: true
    },
    endTime: {
      type: Date,
      default: null
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    },
    answer: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    isCorrect: {
      type: Boolean,
      default: false
    },
    score: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(STUDENT_PROGRESS_STATUS),
      default: STUDENT_PROGRESS_STATUS.NOT_STARTED
    },
    hintsUsed: [{
      hintId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      usedAt: {
        type: Date,
        default: Date.now
      }
    }],
    feedback: {
      type: String,
      default: ''
    }
  }],
  
  // Navigation History
  navigationHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    fromQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    toQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    },
    action: {
      type: String,
      enum: ['next', 'previous', 'jump', 'skip', 'return'],
      required: true
    },
    timeSpent: {
      type: Number, // in seconds
      default: 0
    }
  }],
  
  // Performance Metrics
  totalQuestions: {
    type: Number,
    default: 0
  },
  questionsAttempted: {
    type: Number,
    default: 0
  },
  questionsCorrect: {
    type: Number,
    default: 0
  },
  questionsSkipped: {
    type: Number,
    default: 0
  },
  totalScore: {
    type: Number,
    default: 0
  },
  maxPossibleScore: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number, // in seconds
    default: 0
  },
  averageTimePerQuestion: {
    type: Number, // in seconds
    default: 0
  },
  
  // Learning Analytics
  learningPatterns: {
    preferredQuestionTypes: [{
      type: String,
      enum: ['theoretical', 'numerical', 'diagrammatic', 'critical_thinking']
    }],
    difficultyProgression: [{
      questionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question'
      },
      difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard']
      },
      performance: {
        type: String,
        enum: ['excellent', 'good', 'average', 'poor']
      }
    }],
    weakAreas: [{
      subject: String,
      topic: String,
      questionType: String,
      frequency: Number
    }],
    strongAreas: [{
      subject: String,
      topic: String,
      questionType: String,
      frequency: Number
    }]
  },
  
  // Behavioral Analytics
  behaviorAnalytics: {
    sessionDuration: {
      type: Number, // in minutes
      default: 0
    },
    idleTime: {
      type: Number, // in seconds
      default: 0
    },
    tabSwitches: {
      type: Number,
      default: 0
    },
    helpRequests: {
      type: Number,
      default: 0
    },
    hintUsage: {
      type: Number,
      default: 0
    },
    questionRevisits: {
      type: Number,
      default: 0
    },
    answerChanges: {
      type: Number,
      default: 0
    }
  },
  
  // Environment Information
  environment: {
    deviceType: {
      type: String,
      enum: ['desktop', 'tablet', 'mobile'],
      default: 'desktop'
    },
    browser: {
      type: String,
      default: ''
    },
    operatingSystem: {
      type: String,
      default: ''
    },
    screenResolution: {
      type: String,
      default: ''
    },
    networkType: {
      type: String,
      enum: ['wifi', 'cellular', 'ethernet', 'unknown'],
      default: 'unknown'
    }
  },
  
  // Recommendations
  recommendations: [{
    type: {
      type: String,
      enum: ['practice', 'review', 'skip', 'focus'],
      required: true
    },
    subject: String,
    topic: String,
    questionType: String,
    reason: String,
    priority: {
      type: String,
      enum: ['high', 'medium', 'low'],
      default: 'medium'
    },
    suggestedActions: [String]
  }],
  
  // Completion Information
  completedAt: {
    type: Date,
    default: null
  },
  completionReason: {
    type: String,
    enum: ['completed', 'timeout', 'abandoned', 'error'],
    default: null
  },
  
  // Feedback
  studentFeedback: {
    difficulty: {
      type: String,
      enum: ['too_easy', 'easy', 'just_right', 'hard', 'too_hard']
    },
    enjoyment: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    suggestions: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
studentProgressSchema.index({ studentId: 1, chainId: 1 });
studentProgressSchema.index({ sessionId: 1 });
studentProgressSchema.index({ status: 1 });
studentProgressSchema.index({ startTime: -1 });
studentProgressSchema.index({ 'questionAttempts.questionId': 1 });

// Virtual for accuracy percentage
studentProgressSchema.virtual('accuracyPercentage').get(function() {
  if (this.questionsAttempted === 0) return 0;
  return Math.round((this.questionsCorrect / this.questionsAttempted) * 100);
});

// Virtual for score percentage
studentProgressSchema.virtual('scorePercentage').get(function() {
  if (this.maxPossibleScore === 0) return 0;
  return Math.round((this.totalScore / this.maxPossibleScore) * 100);
});

// Virtual for session duration
studentProgressSchema.virtual('sessionDuration').get(function() {
  const endTime = this.endTime || new Date();
  return Math.round((endTime - this.startTime) / 1000 / 60); // in minutes
});

// Pre-save middleware to update metrics
studentProgressSchema.pre('save', function(next) {
  // Update completion percentage
  if (this.totalQuestions > 0) {
    this.completionPercentage = Math.round((this.questionsAttempted / this.totalQuestions) * 100);
  }
  
  // Update average time per question
  if (this.questionsAttempted > 0) {
    this.averageTimePerQuestion = Math.round(this.totalTimeSpent / this.questionsAttempted);
  }
  
  // Update behavior analytics
  this.behaviorAnalytics.sessionDuration = this.sessionDuration;
  
  next();
});

// Method to start question attempt
studentProgressSchema.methods.startQuestionAttempt = function(questionId, order) {
  const attempt = {
    questionId,
    order,
    startTime: new Date(),
    status: STUDENT_PROGRESS_STATUS.IN_PROGRESS
  };
  
  this.questionAttempts.push(attempt);
  this.currentQuestionId = questionId;
  this.currentQuestionOrder = order;
  this.status = STUDENT_PROGRESS_STATUS.IN_PROGRESS;
  
  return attempt;
};

// Method to complete question attempt
studentProgressSchema.methods.completeQuestionAttempt = function(questionId, answer, isCorrect, score) {
  const attempt = this.questionAttempts.find(a => 
    a.questionId.equals(questionId) && a.status === STUDENT_PROGRESS_STATUS.IN_PROGRESS
  );
  
  if (attempt) {
    attempt.endTime = new Date();
    attempt.timeSpent = Math.round((attempt.endTime - attempt.startTime) / 1000);
    attempt.answer = answer;
    attempt.isCorrect = isCorrect;
    attempt.score = score;
    attempt.status = STUDENT_PROGRESS_STATUS.COMPLETED;
    
    // Update overall metrics
    this.questionsAttempted += 1;
    if (isCorrect) this.questionsCorrect += 1;
    this.totalScore += score;
    this.totalTimeSpent += attempt.timeSpent;
    
    // Update learning patterns
    this.updateLearningPatterns(questionId, isCorrect, attempt.timeSpent);
  }
  
  return attempt;
};

// Method to skip question
studentProgressSchema.methods.skipQuestion = function(questionId) {
  const attempt = this.questionAttempts.find(a => 
    a.questionId.equals(questionId) && a.status === STUDENT_PROGRESS_STATUS.IN_PROGRESS
  );
  
  if (attempt) {
    attempt.endTime = new Date();
    attempt.timeSpent = Math.round((attempt.endTime - attempt.startTime) / 1000);
    attempt.status = STUDENT_PROGRESS_STATUS.SKIPPED;
    
    this.questionsSkipped += 1;
    this.totalTimeSpent += attempt.timeSpent;
  }
  
  return attempt;
};

// Method to update learning patterns
studentProgressSchema.methods.updateLearningPatterns = function(questionId, isCorrect, timeSpent) {
  // This would be implemented with more sophisticated logic
  // For now, just track basic patterns
  const performance = isCorrect ? 'good' : 'poor';
  
  this.learningPatterns.difficultyProgression.push({
    questionId,
    difficulty: 'medium', // This would be determined from the question
    performance
  });
};

// Method to add navigation event
studentProgressSchema.methods.addNavigationEvent = function(fromQuestion, toQuestion, action, timeSpent = 0) {
  const navigationEvent = {
    fromQuestion,
    toQuestion,
    action,
    timeSpent
  };
  
  this.navigationHistory.push(navigationEvent);
  this.lastActivityTime = new Date();
  
  return navigationEvent;
};

// Method to complete session
studentProgressSchema.methods.completeSession = function(reason = 'completed') {
  this.endTime = new Date();
  this.status = STUDENT_PROGRESS_STATUS.COMPLETED;
  this.completionReason = reason;
  this.completedAt = new Date();
  
  // Final calculations
  this.completionPercentage = 100;
  this.behaviorAnalytics.sessionDuration = this.sessionDuration;
  
  return this;
};

// Static method to find active sessions
studentProgressSchema.statics.findActiveSessions = function() {
  return this.find({ 
    status: STUDENT_PROGRESS_STATUS.IN_PROGRESS,
    endTime: null 
  });
};

// Static method to find student progress
studentProgressSchema.statics.findStudentProgress = function(studentId) {
  return this.find({ studentId }).sort({ startTime: -1 });
};

// Static method to find chain analytics
studentProgressSchema.statics.findChainAnalytics = function(chainId) {
  return this.aggregate([
    { $match: { chainId: mongoose.Types.ObjectId(chainId) } },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        averageScore: { $avg: '$totalScore' },
        averageTime: { $avg: '$totalTimeSpent' },
        completionRate: {
          $avg: {
            $cond: [{ $eq: ['$status', STUDENT_PROGRESS_STATUS.COMPLETED] }, 1, 0]
          }
        }
      }
    }
  ]);
};

export const StudentProgress = mongoose.model('StudentProgress', studentProgressSchema);
