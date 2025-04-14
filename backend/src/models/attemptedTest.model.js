import mongoose, { Schema } from "mongoose";

// Schema for individual answers
const AnswerSchema = new Schema({
  questionId: {
    type: Schema.Types.ObjectId,
    ref: "Question",
    required: true
  },
  answerOptionIndex: {
    type: Number,
    default: null
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  // To avoid recalculating
  isCorrect: {
    type: Boolean,
    default: false
  }
}, { _id: false });

// Navigation event schema
const NavigationEventSchema = new Schema({
  timestamp: {
    type: Date,
    required: true
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: "Question"
  },
  action: {
    type: String,
    enum: ["visit", "leave", "mark", "unmark", "answer", "clear"]
  },
  timeSpent: Number
}, { _id: false });

// Environment schema
const EnvironmentSchema = new Schema({
  device: {
    userAgent: String,
    screenResolution: String,
    deviceType: {
      type: String,
      enum: ["desktop", "tablet", "mobile"],
      default: "desktop"
    }
  },
  session: {
    tabSwitches: {
      type: Number,
      default: 0
    },
    disconnections: [{
      startTime: Date,
      endTime: Date,
      duration: Number
    }],
    browserRefreshes: {
      type: Number,
      default: 0
    }
  }
}, { _id: false });

const attemptedTestSchema = new Schema({
  // Core Test Information
  userId: {  
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  testId: {  
    type: Schema.Types.ObjectId,
    ref: 'PreviousTest',
    required: true,
    index: true,
  },
  attemptNumber: {
    type: Number,
    required: true,
    default: 1
  },
  language: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },

  // Metadata to store additional test information
  metadata: {
    totalQuestions: Number,
    answeredQuestions: [Schema.Types.ObjectId],
    visitedQuestions: [Schema.Types.ObjectId],
    markedForReview: [Schema.Types.ObjectId],
    selectedLanguage: String
  },

  // Answers array to store user answers
  answers: {
    type: [AnswerSchema],
    default: []
  },

  // Question States
  questionStates: {
    notVisited: [Schema.Types.ObjectId],
    notAnswered: [Schema.Types.ObjectId],
    answered: [Schema.Types.ObjectId],
    markedForReview: [Schema.Types.ObjectId],
    markedAndAnswered: [Schema.Types.ObjectId]
  },

  // Responses
  responses: {
    type: Map,
    of: {
      selectedOption: { type: Number, default: null },
      isMarked: { type: Boolean, default: false },
      timeSpent: { type: Number, required: true },
      visits: { type: Number, default: 0 },
      firstVisitTime: { type: Number, required: true },
      lastVisitTime: { type: Number, required: true },
    },
  },

  // Question Analytics
  questionAnalytics: {
    type: Map,
    of: {
      changeHistory: [{
        timestamp: Number,
        fromOption: Number,
        toOption: Number,
      }],
      hesitationTime: Number,
      revisionCount: Number,
      timeBeforeMarking: Number,
    },
  },

  // Subject Analytics
  subjectAnalytics: {
    type: Map,
    of: {
      accuracy: Number,
      averageTimePerQuestion: Number,
      questionsAttempted: Number,
      scoreObtained: Number,
      weakTopics: [String],
      strongTopics: [String],
      improvementAreas: [{
        topic: String,
        accuracy: Number,
        averageTime: Number,
      }],
    },
  },

  // Time Analytics
  timeAnalytics: {
    totalTimeSpent: Number,
    averageTimePerQuestion: Number,
    questionTimeDistribution: {
      lessThan30Sec: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      between30To60Sec: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      between1To2Min: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      moreThan2Min: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    },
    peakPerformancePeriods: [{
      startTime: Date,
      endTime: Date,
      questionsAnswered: Number,
      correctAnswers: Number,
    }],
    fatiguePeriods: [{
      startTime: Date,
      endTime: Date,
      increasedTimePerQuestion: Number,
      wrongAnswers: Number,
    }],
  },

  // Error Analytics
  errorAnalytics: {
    commonMistakes: [{
      pattern: String,
      count: Number,
      questionIds: [Schema.Types.ObjectId]
    }],
    errorPatterns: {
      type: Map,
      of: Number
    },
  },

  // Behavioral Analytics
  behavioralAnalytics: {
    sectionTransitions: [{
      from: String,
      to: String,
      count: Number
    }],
    revisitPatterns: [{
      questionId: Schema.Types.ObjectId,
      visitCount: Number,
      changesMade: Number
    }],
    confidenceMetrics: {
      quickAnswers: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      longDeliberations: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      multipleRevisions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    },
  },

  // Navigation History
  navigationHistory: {
    type: [NavigationEventSchema],
    default: []
  },

  // Environment Data
  environment: {
    type: EnvironmentSchema,
    default: () => ({})
  },

  totalCorrectAnswers: {  
    type: Number,
    default: 0,
  },
  totalWrongAnswers: {  
    type: Number,
    default: 0,
  },
  totalUnattempted: {  
    type: Number,
    default: 0,
  },
  totalVisitedQuestions: {  
    type: Number,
    default: 0,
  },
  score: {  
    type: Number,
    default: 0,
  },
  totalTimeTaken: {  
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Pre-save hook to properly set the attempt number
attemptedTestSchema.pre('save', async function(next) {
  try {
    if (this.isNew) {
      const lastAttempt = await mongoose.model('AttemptedTest')
        .findOne({ 
          userId: this.userId, 
          testId: this.testId 
        })
        .sort({ attemptNumber: -1 })
        .select('attemptNumber');
      
      if (lastAttempt && typeof lastAttempt.attemptNumber === 'number') {
        this.attemptNumber = lastAttempt.attemptNumber + 1;
      } else {
        this.attemptNumber = 1;
      }
      
      console.log(`Setting attempt number to ${this.attemptNumber}`);
    }
    next();
  } catch (err) {
    console.error("Error in pre-save hook:", err);
    next(err);
  }
});

// Post-save hook to calculate and update totals after saving an attempt
attemptedTestSchema.post('save', async function () {
  try {
    const attemptedTest = this;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    
    const visitedQuestions = attemptedTest.metadata && 
                             attemptedTest.metadata.visitedQuestions ? 
                             attemptedTest.metadata.visitedQuestions.length : 0;
    
    if (attemptedTest.answers && Array.isArray(attemptedTest.answers)) {
      for (const answer of attemptedTest.answers) {
        if (!answer.questionId) continue;
        
        try {
          const question = await mongoose.model('Question').findById(answer.questionId);
          if (question) {
            if (answer.answerOptionIndex === question.correctOption) {
              correctAnswers++;
            } else if (answer.answerOptionIndex !== null) {
              wrongAnswers++;
            }
          }
        } catch (questionError) {
          console.error(`Error processing question ${answer.questionId}:`, questionError);
        }
      }
    }
    
    try {
      await attemptedTest.constructor.updateOne(
        { _id: attemptedTest._id },
        {
          totalCorrectAnswers: correctAnswers,
          totalWrongAnswers: wrongAnswers,
          totalVisitedQuestions: visitedQuestions,
        }
      );
      console.log(`Updated test metrics: correct=${correctAnswers}, wrong=${wrongAnswers}, visited=${visitedQuestions}`);
    } catch (updateError) {
      console.error("Error updating test metrics:", updateError);
    }
  } catch (err) {
    console.error("Error in post-save hook for AttemptedTest:", err);
  }
});

// Indexes for performance
attemptedTestSchema.index({ userId: 1, testId: 1 });
attemptedTestSchema.index({ startTime: -1 });

// Methods
attemptedTestSchema.methods.calculateResults = function() {
  // Calculate scores and other metrics
  // This would be called before saving or automatically in a pre-save hook
};

export const AttemptedTest = mongoose.model('AttemptedTest', attemptedTestSchema);
