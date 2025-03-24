import mongoose, { Schema } from "mongoose";

const attemptedTestSchema = new Schema({
  // Core Test Information
  userId: {  
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testId: {  
    type: Schema.Types.ObjectId,
    ref: 'PreviousTest',
    required: true,
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
    type: Number,
    required: true,
  },
  endTime: {
    type: Number,
    required: true,
  },

  // Metadata to store additional test information
  metadata: {
    type: Object,
    default: {}
  },

  // Answers array to store user answers
  answers: {
    type: Array,
    required: true,
  },

  // Question States
  questionStates: {
    notVisited: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    notAnswered: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    answered: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    markedForReview: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    markedAndAnswered: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
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
      startTime: Number,
      endTime: Number,
      questionsAnswered: Number,
      correctAnswers: Number,
    }],
    fatiguePeriods: [{
      startTime: Number,
      endTime: Number,
      increasedTimePerQuestion: Number,
      wrongAnswers: Number,
    }],
  },

  // Error Analytics
  errorAnalytics: {
    commonMistakes: [{
      questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
      selectedOption: Number,
      correctOption: Number,
      conceptTested: String,
      timeSpentBeforeError: Number,
    }],
    errorPatterns: {
      conceptualErrors: [String],
      calculationErrors: [String],
      timeManagementErrors: [String],
      carelessMistakes: [String],
    },
  },

  // Behavioral Analytics
  behavioralAnalytics: {
    revisitPatterns: [{
      questionId: { type: Schema.Types.ObjectId, ref: 'Question' },
      visitCount: Number,
      timeBetweenVisits: [Number],
      finalOutcome: {
        type: String,
        enum: ['correct', 'incorrect', 'unattempted'],
      },
    }],
    sectionTransitions: [{
      fromSubject: String,
      toSubject: String,
      timestamp: Number,
      timeSpentInPrevSection: Number,
    }],
    confidenceMetrics: {
      quickAnswers: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      longDeliberations: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
      multipleRevisions: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    },
  },

  // Navigation History
  navigationHistory: [{
    timestamp: Number,
    fromQuestion: { type: Schema.Types.ObjectId, ref: 'Question' },
    toQuestion: { type: Schema.Types.ObjectId, ref: 'Question' },
    action: {
      type: String,
      enum: ['click', 'next', 'prev', 'mark', 'unmark', 'answer'],
    },
  }],

  // Environment Data
  environment: {
    device: {
      userAgent: String,
      screenResolution: String,
      deviceType: {
        type: String,
        enum: ['mobile', 'tablet', 'desktop'],
      },
    },
    session: {
      tabSwitches: Number,
      disconnections: [{
        startTime: Number,
        endTime: Number,
      }],
      browserRefreshes: Number,
    },
  },

  totalCorrectAnswers: {  
    type: Number,
    default: 0,
  },
  totalWrongAnswers: {  
    type: Number,
    default: 0,
  },
  totalVisitedQuestions: {  
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

export const AttemptedTest = mongoose.model('AttemptedTest', attemptedTestSchema);
