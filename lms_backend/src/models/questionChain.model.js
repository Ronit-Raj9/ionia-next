import mongoose from 'mongoose';
import { QUESTION_CATEGORIES, QUESTION_CHAIN_STATUS } from '../constants.js';

const questionChainSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Chain name is required'],
    trim: true,
    maxlength: [200, 'Chain name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
    default: ''
  },
  
  // Chain Configuration
  category: {
    type: String,
    enum: Object.values(QUESTION_CATEGORIES),
    required: [true, 'Question category is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    enum: ['physics', 'chemistry', 'mathematics', 'biology', 'english', 'computer_science']
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'mixed'],
    default: 'mixed'
  },
  
  // Chain Structure
  questions: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    nextQuestions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question'
    }],
    conditions: {
      minScore: {
        type: Number,
        default: 0
      },
      maxAttempts: {
        type: Number,
        default: 3
      },
      timeLimit: {
        type: Number, // in seconds
        default: null
      }
    }
  }],
  
  // Chain Flow Configuration
  flowType: {
    type: String,
    enum: ['linear', 'adaptive', 'branching', 'custom'],
    default: 'adaptive'
  },
  branchingRules: [{
    fromQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    condition: {
      type: String,
      enum: ['correct', 'incorrect', 'timeout', 'skip'],
      required: true
    },
    toQuestion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true
    },
    order: {
      type: Number,
      required: true
    }
  }],
  
  // Chain Metadata
  estimatedDuration: {
    type: Number, // in minutes
    default: 30
  },
  totalQuestions: {
    type: Number,
    default: 0
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  
  // Status and Management
  status: {
    type: String,
    enum: Object.values(QUESTION_CHAIN_STATUS),
    default: QUESTION_CHAIN_STATUS.DRAFT
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    trim: true
  }],
  
  // Analytics
  analytics: {
    totalAttempts: {
      type: Number,
      default: 0
    },
    averageScore: {
      type: Number,
      default: 0
    },
    averageTime: {
      type: Number, // in minutes
      default: 0
    },
    completionRate: {
      type: Number,
      default: 0
    },
    difficultyDistribution: {
      easy: { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      hard: { type: Number, default: 0 }
    }
  },
  
  // Ownership and Permissions
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LMSUser',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LMSUser',
    default: null
  },
  
  // Access Control
  allowedRoles: [{
    type: String,
    enum: ['admin', 'student', 'instructor']
  }],
  allowedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LMSUser'
  }],
  
  // Scheduling
  availableFrom: {
    type: Date,
    default: null
  },
  availableUntil: {
    type: Date,
    default: null
  },
  
  // Version Control
  version: {
    type: Number,
    default: 1
  },
  revisionHistory: [{
    version: Number,
    timestamp: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LMSUser'
    },
    changesDescription: String,
    changes: mongoose.Schema.Types.Mixed
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
questionChainSchema.index({ category: 1, subject: 1 });
questionChainSchema.index({ status: 1, isPublic: 1 });
questionChainSchema.index({ createdBy: 1 });
questionChainSchema.index({ tags: 1 });
questionChainSchema.index({ 'questions.questionId': 1 });

// Virtual for active questions count
questionChainSchema.virtual('activeQuestionsCount').get(function() {
  return this.questions.filter(q => q.isRequired).length;
});

// Virtual for chain complexity
questionChainSchema.virtual('complexity').get(function() {
  const totalQuestions = this.questions.length;
  const branchingRules = this.branchingRules.length;
  
  if (totalQuestions <= 5 && branchingRules === 0) return 'simple';
  if (totalQuestions <= 10 && branchingRules <= 3) return 'moderate';
  return 'complex';
});

// Pre-save middleware to update totals
questionChainSchema.pre('save', function(next) {
  this.totalQuestions = this.questions.length;
  this.totalMarks = this.questions.reduce((sum, q) => sum + (q.marks || 1), 0);
  next();
});

// Method to add question to chain
questionChainSchema.methods.addQuestion = function(questionId, order, options = {}) {
  const question = {
    questionId,
    order,
    isRequired: options.isRequired !== false,
    prerequisites: options.prerequisites || [],
    nextQuestions: options.nextQuestions || [],
    conditions: {
      minScore: options.minScore || 0,
      maxAttempts: options.maxAttempts || 3,
      timeLimit: options.timeLimit || null
    }
  };
  
  this.questions.push(question);
  this.questions.sort((a, b) => a.order - b.order);
  
  return this;
};

// Method to remove question from chain
questionChainSchema.methods.removeQuestion = function(questionId) {
  this.questions = this.questions.filter(q => !q.questionId.equals(questionId));
  
  // Remove references from branching rules
  this.branchingRules = this.branchingRules.filter(rule => 
    !rule.fromQuestion.equals(questionId) && !rule.toQuestion.equals(questionId)
  );
  
  return this;
};

// Method to reorder questions
questionChainSchema.methods.reorderQuestions = function(questionOrders) {
  questionOrders.forEach(({ questionId, newOrder }) => {
    const question = this.questions.find(q => q.questionId.equals(questionId));
    if (question) {
      question.order = newOrder;
    }
  });
  
  this.questions.sort((a, b) => a.order - b.order);
  return this;
};

// Method to add branching rule
questionChainSchema.methods.addBranchingRule = function(fromQuestion, condition, toQuestion, order) {
  const rule = {
    fromQuestion,
    condition,
    toQuestion,
    order
  };
  
  this.branchingRules.push(rule);
  this.branchingRules.sort((a, b) => a.order - b.order);
  
  return this;
};

// Method to get next question based on current question and result
questionChainSchema.methods.getNextQuestion = function(currentQuestionId, result) {
  // Find branching rules for current question
  const applicableRules = this.branchingRules.filter(rule => 
    rule.fromQuestion.equals(currentQuestionId) && rule.condition === result
  );
  
  if (applicableRules.length > 0) {
    // Return the first applicable rule's target question
    return applicableRules[0].toQuestion;
  }
  
  // Default: return next question in sequence
  const currentQuestion = this.questions.find(q => q.questionId.equals(currentQuestionId));
  if (currentQuestion) {
    const nextQuestion = this.questions.find(q => q.order === currentQuestion.order + 1);
    return nextQuestion ? nextQuestion.questionId : null;
  }
  
  return null;
};

// Static method to find chains by category
questionChainSchema.statics.findByCategory = function(category) {
  return this.find({ category, status: QUESTION_CHAIN_STATUS.ACTIVE, isPublic: true });
};

// Static method to find chains by subject
questionChainSchema.statics.findBySubject = function(subject) {
  return this.find({ subject, status: QUESTION_CHAIN_STATUS.ACTIVE, isPublic: true });
};

// Static method to find public chains
questionChainSchema.statics.findPublicChains = function() {
  return this.find({ status: QUESTION_CHAIN_STATUS.ACTIVE, isPublic: true });
};

export const QuestionChain = mongoose.model('QuestionChain', questionChainSchema);
