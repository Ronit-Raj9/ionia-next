import mongoose, { Schema } from "mongoose";

const attemptedTestSchema = new Schema({
  userId: {  // Reference to the User who took the test
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  testId: {  // Reference to the test
    type: Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
  },
  attemptNumber: {  // Auto-incremented attempt number for this user & test
    type: Number,
    required: true,
  },
  answers: [
    {
      questionId: {  // Reference to the question
        type: Schema.Types.ObjectId,
        ref: 'Question',
        required: true,
      },
      answerOptionIndex: {  // The index of the selected answer
        type: Number,
        required: true,
      },
      timeSpent: {  // Time spent on this question in milliseconds
        type: Number,
        default: 0,
        required: true,
      },
    }
  ],
  metadata: {
    totalQuestions: {  // Total number of questions in the test
      type: Number,
      required: true,
    },
    answeredQuestions: [
      {  // List of answered question IDs
        type: Schema.Types.ObjectId,
        ref: 'Question',
        default: []
      }
    ],
    visitedQuestions: [
      {  // List of visited question IDs
        type: Schema.Types.ObjectId,
        ref: 'Question',
        default: []
      }
    ],
    markedForReview: [
      {  // List of marked-for-review question IDs
        type: Schema.Types.ObjectId,
        ref: 'Question',
        default: []
      }
    ],
    selectedLanguage: {  // Language selected for the test
      type: String,
      required: true,
    },
  },
  totalCorrectAnswers: {  // Total number of correct answers
    type: Number,
    default: 0,
  },
  totalWrongAnswers: {  // Total number of wrong answers
    type: Number,
    default: 0,
  },
  totalVisitedQuestions: {  // Total number of visited questions
    type: Number,
    default: 0,
  },
  totalTimeTaken: {  // Total time taken to complete the test in milliseconds
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

// Pre-save hook to assign an attempt number before saving
attemptedTestSchema.pre('save', async function (next) {
  if (this.isNew) {
    try {
      const lastAttempt = await mongoose.model('AttemptedTest')
        .findOne({ userId: this.userId, testId: this.testId })
        .sort({ attemptNumber: -1 })
        .select('attemptNumber');
      // Safely convert the value to a number; default to 0 if invalid
      const lastAttemptNumber = lastAttempt && !isNaN(Number(lastAttempt.attemptNumber))
        ? Number(lastAttempt.attemptNumber)
        : 0;
      this.attemptNumber = lastAttemptNumber + 1;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Post-save hook to calculate and update totals after saving an attempt
attemptedTestSchema.post('save', async function () {
  try {
    const attemptedTest = this;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const visitedQuestions = attemptedTest.metadata.visitedQuestions
      ? attemptedTest.metadata.visitedQuestions.length
      : 0;
    
    // Loop through answers to calculate totals
    for (const answer of attemptedTest.answers) {
      const question = await mongoose.model('Question').findById(answer.questionId);
      if (question) {
        if (answer.answerOptionIndex === question.correctOption) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      }
    }
    
    // Update the totals without triggering another save
    await attemptedTest.constructor.updateOne(
      { _id: attemptedTest._id },
      {
        totalCorrectAnswers: correctAnswers,
        totalWrongAnswers: wrongAnswers,
        totalVisitedQuestions: visitedQuestions,
      }
    );
  } catch (err) {
    console.error("Error in post-save hook for AttemptedTest:", err);
  }
});

export const AttemptedTest = mongoose.model('AttemptedTest', attemptedTestSchema);
