import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Test } from "../models/test.model.js";
import { AttemptedTest } from "../models/attemptedTest.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; // Import JWT for token verification

// Controller to submit test answers and save the attempted test
const submitTest = asyncHandler(async (req, res) => {
  try {
    // Extract token from cookies
    const token = req.cookies.accessToken;
    if (!token) {
      throw new ApiError(401, "Unauthorized - No authentication token provided.");
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Unauthorized - Invalid or expired token.");
    }

    const userId = decoded._id;

    // Extract fields from request body
    const { 
      testId,
      language,
      startTime,
      endTime,
      totalTimeTaken,
      answers,
      metadata,
      questionStates,
      navigationHistory,
      environment 
    } = req.body;

    console.log("Received test submission:", {
      userId,
      testId,
      hasAnswers: Array.isArray(answers) && answers.length > 0,
      answerCount: Array.isArray(answers) ? answers.length : 0,
      hasMetadata: !!metadata,
      hasQuestionStates: !!questionStates
    });

    // Validate required fields
    if (!testId) {
      throw new ApiError(400, "testId is required");
    }
    if (!answers || !Array.isArray(answers)) {
      throw new ApiError(400, "answers array is required");
    }

    // Get the test details
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      throw new ApiError(404, "Test definition not found");
    }

    // Process the answers to ensure they have all required fields
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const questionMap = new Map(test.questions.map(q => [q._id.toString(), q]));

    const processedAnswers = answers.map(answer => {
      const question = questionMap.get(answer.questionId?.toString());
      if (!question) {
        console.warn(`Question ID ${answer.questionId} not found in test ${testId}`);
        return null;
      }
      if (answer.answerOptionIndex !== undefined && answer.answerOptionIndex !== null) {
        if (question.correctOptions?.includes(answer.answerOptionIndex)) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      }
      return {
        questionId: answer.questionId,
        answerOptionIndex: answer.answerOptionIndex !== undefined ? answer.answerOptionIndex : null,
        timeSpent: answer.timeSpent || 0
      };
    }).filter(a => a !== null);
    
    console.log("Processed answers count:", processedAnswers.length);
    console.log("Calculated results:", { correctAnswers, wrongAnswers });

    // Create a new attempted test document
    const attemptedTest = new AttemptedTest({
      userId,
      testId,
      language: language || 'English',
      startTime: startTime || Date.now() - (totalTimeTaken || 0),
      endTime: endTime || Date.now(),
      totalTimeTaken: totalTimeTaken || 0,
      answers: processedAnswers,
      
      // Ensure metadata is properly formatted
      metadata: {
        totalQuestions: test.questionCount,
        answeredQuestions: (metadata?.answeredQuestions && Array.isArray(metadata.answeredQuestions)) 
                          ? metadata.answeredQuestions 
                          : [],
        visitedQuestions: (metadata?.visitedQuestions && Array.isArray(metadata.visitedQuestions)) 
                         ? metadata.visitedQuestions 
                         : [],
        markedForReview: (metadata?.markedForReview && Array.isArray(metadata.markedForReview)) 
                        ? metadata.markedForReview 
                        : [],
        selectedLanguage: metadata?.selectedLanguage || language || 'English'
      },
      
      // Ensure question states are properly formatted
      questionStates: {
        notVisited: (questionStates?.notVisited && Array.isArray(questionStates.notVisited)) 
                   ? questionStates.notVisited 
                   : [],
        notAnswered: (questionStates?.notAnswered && Array.isArray(questionStates.notAnswered)) 
                    ? questionStates.notAnswered 
                    : [],
        answered: (questionStates?.answered && Array.isArray(questionStates.answered)) 
                ? questionStates.answered 
                : processedAnswers.map(a => a.questionId), // Fallback
        markedForReview: (questionStates?.markedForReview && Array.isArray(questionStates.markedForReview)) 
                        ? questionStates.markedForReview 
                        : [],
        markedAndAnswered: (questionStates?.markedAndAnswered && Array.isArray(questionStates.markedAndAnswered)) 
                          ? questionStates.markedAndAnswered 
                          : [],
      },
      
      // Navigation history
      navigationHistory: Array.isArray(navigationHistory) ? navigationHistory : [],
      
      // Environment data
      environment: environment || {
        device: {
          userAgent: '',
          screenResolution: '',
          deviceType: 'desktop'
        },
        session: {
          tabSwitches: 0,
          disconnections: [],
          browserRefreshes: 0
        }
      },
      
      // Pre-computed totals
      totalCorrectAnswers: correctAnswers,
      totalWrongAnswers: wrongAnswers,
      totalUnattempted: test.questionCount - correctAnswers - wrongAnswers,
      score: (correctAnswers * (test.markingScheme?.correct ?? 1)) + (wrongAnswers * (test.markingScheme?.incorrect ?? 0)),
      totalVisitedQuestions: (metadata?.visitedQuestions && Array.isArray(metadata.visitedQuestions)) 
                            ? metadata.visitedQuestions.length 
                            : 0
    });

    console.log("Saving attempted test to database");
    await attemptedTest.save();
    console.log("Test successfully saved with ID:", attemptedTest._id);

    let analysisUrlPath = `/results/${attemptedTest._id}`;

    res.status(201).json(
      new ApiResponse(201, {
        attemptId: attemptedTest._id,
        analysisUrl: analysisUrlPath,
      }, "Test submitted successfully")
    );
  } catch (error) {
    console.error("Error in submitTest:", error);
    throw new ApiError(error.statusCode || 500, error.message || 'Error submitting test');
  }
});

// Get detailed test analysis with question-wise breakdown
const getDetailedTestAnalysis = asyncHandler(async (req, res) => {
  try {
    const token = req.cookies.accessToken;
    if (!token) {
      throw new ApiError(401, "Unauthorized - No authentication token provided.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch (err) {
      throw new ApiError(401, "Unauthorized - Invalid or expired token.");
    }

    const userId = decoded._id;
    const { attemptId } = req.params;

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Valid Attempt ID is required.");
    }
    
    console.log("Fetching analysis for attempt:", { userId, attemptId });

    const attemptedTest = await AttemptedTest.findOne({ _id: attemptId, userId });

    if (!attemptedTest) {
      throw new ApiError(404, "Attempted test not found for this user.");
    }
    
    console.log("Found attempted test:", {
      id: attemptedTest._id,
      answerCount: attemptedTest.answers.length,
      correctAnswers: attemptedTest.totalCorrectAnswers,
      wrongAnswers: attemptedTest.totalWrongAnswers
    });

    const test = await Test.findById(attemptedTest.testId).populate('questions');
    if (!test) {
      throw new ApiError(404, "Original test definition not found for this attempt");
    }

    const questionMap = new Map(test.questions.map(q => [q._id.toString(), q]));

    let correctCount = 0;
    let wrongCount = 0;
    const answersWithCorrectness = attemptedTest.answers.map(answer => {
      const question = questionMap.get(answer.questionId?.toString());
      let isCorrect = false;
      if (question && answer.answerOptionIndex !== undefined && answer.answerOptionIndex !== null) {
        if (question.correctOptions?.includes(answer.answerOptionIndex)) {
          isCorrect = true;
          correctCount++;
        } else {
          wrongCount++;
        }
      }
      return {
        questionId: answer.questionId,
        selectedOption: answer.answerOptionIndex,
        timeSpent: answer.timeSpent || 0,
        isCorrect: isCorrect,
        correctAnswer: question?.correctOptions
      };
    });

    const detailedAnalysis = {
      testInfo: {
        testId: test._id,
        attemptId: attemptedTest._id,
        testTitle: test.title,
        testCategory: test.testCategory,
        language: attemptedTest.language || 'English',
        duration: attemptedTest.totalTimeTaken || 0,
        startTime: attemptedTest.startTime,
        endTime: attemptedTest.endTime
      },
      answers: answersWithCorrectness,
      metadata: {
        ...(attemptedTest.metadata || {}),
        questions: test.questions.map(q => ({
          id: q._id,
          subject: q.subject || 'General',
          topic: q.topic || 'General',
          difficulty: q.difficulty || 'Medium',
          correctOption: q.correctOptions?.join(', ') || 'N/A'
        }))
      },
      performance: {
        totalQuestions: test.questionCount,
        totalCorrectAnswers: correctCount,
        totalWrongAnswers: wrongCount,
        totalUnattempted: test.questionCount - correctCount - wrongCount,
        score: attemptedTest.score,
        percentage: attemptedTest.score / test.totalMarks * 100,
        totalVisitedQuestions: attemptedTest.totalVisitedQuestions || 
                              (attemptedTest.metadata?.visitedQuestions?.length || 0),
      },
      subjectWise: (() => {
        const subjects = {};
        test.questions.forEach(q => {
          if (!q.subject) return;
          if (!subjects[q.subject]) {
            subjects[q.subject] = {
              total: 0,
              attempted: 0,
              correct: 0,
              timeSpent: 0
            };
          }
          const answer = attemptedTest.answers.find(
            a => a.questionId.toString() === q._id.toString()
          );
          subjects[q.subject].total++;
          if (answer && answer.answerOptionIndex !== null) {
            subjects[q.subject].attempted++;
            subjects[q.subject].timeSpent += answer.timeSpent || 0;
            if (answer.isCorrect) {
              subjects[q.subject].correct++;
            }
          }
        });
        return subjects;
      })(),
      questionStates: attemptedTest.questionStates || {},
      navigationHistory: attemptedTest.navigationHistory || [],
      environment: attemptedTest.environment || {}
    };
    
    console.log("Sending analysis response with:", {
      testInfo: detailedAnalysis.testInfo,
      answerCount: detailedAnalysis.answers.length,
      performance: detailedAnalysis.performance,
      subjectCount: Object.keys(detailedAnalysis.subjectWise).length
    });

    res.status(200).json(
      new ApiResponse(200, detailedAnalysis, "Detailed test analysis fetched successfully")
    );
  } catch (error) {
    console.error("Analysis Error:", error);
    throw new ApiError(500, "Error fetching detailed test analysis", error.message);
  }
});

// Get time-based analytics
const getTimeAnalytics = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const userId = req.user._id;

  try {
    const attemptedTest = await AttemptedTest.findOne({ userId, testId });
    if (!attemptedTest) {
      throw new ApiError(404, "Attempt not found");
    }

    const timeAnalysis = {
      overall: {
        totalDuration: attemptedTest.endTime - attemptedTest.startTime,
        averageTimePerQuestion: attemptedTest.timeAnalytics?.averageTimePerQuestion || 0,
        timeDistribution: attemptedTest.timeAnalytics?.questionTimeDistribution || {}
      },
      performance: {
        peakPerformancePeriods: attemptedTest.timeAnalytics?.peakPerformancePeriods || [],
        fatiguePeriods: attemptedTest.timeAnalytics?.fatiguePeriods || []
      },
      questionWise: Object.entries(attemptedTest.responses).map(([questionId, data]) => ({
        questionId,
        timeSpent: data.timeSpent,
        visits: data.visits,
        firstVisit: data.firstVisitTime,
        lastVisit: data.lastVisitTime
      }))
    };

    res.status(200).json(
      new ApiResponse(200, timeAnalysis, "Time analytics fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching time analytics", error.message);
  }
});

// Get error pattern analysis
const getErrorAnalysis = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const userId = req.user._id;

  try {
    const attemptedTest = await AttemptedTest.findOne({ userId, testId });
    if (!attemptedTest) {
      throw new ApiError(404, "Attempt not found");
    }

    const errorAnalysis = {
      commonMistakes: attemptedTest.errorAnalytics?.commonMistakes || [],
      patterns: attemptedTest.errorAnalytics?.errorPatterns || {},
      subjectWise: Object.entries(attemptedTest.subjectAnalytics || {}).reduce((acc, [subject, data]) => {
        acc[subject] = {
          accuracy: data.accuracy,
          weakTopics: data.weakTopics,
          improvementAreas: data.improvementAreas
        };
        return acc;
      }, {})
    };

    res.status(200).json(
      new ApiResponse(200, errorAnalysis, "Error analysis fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching error analysis", error.message);
  }
});

// Get question navigation patterns
const getNavigationPatterns = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const userId = req.user._id;
  
  try {
    const attemptedTest = await AttemptedTest.findOne({ userId, testId });
    if (!attemptedTest) {
      throw new ApiError(404, "Attempt not found");
    }

    const strategyMetrics = attemptedTest.strategyMetrics || { questionSequencing: { backtracking: 0, subjectSwitching: 0, optimalChoices: 0 } };

    const navigationAnalysis = {
      sequence: attemptedTest.navigationHistory || [],
      patterns: {
        backtracking: strategyMetrics.questionSequencing.backtracking,
        subjectSwitching: strategyMetrics.questionSequencing.subjectSwitching,
        optimalChoices: strategyMetrics.questionSequencing.optimalChoices
      },
      sectionTransitions: attemptedTest.behavioralAnalytics?.sectionTransitions || [],
      revisitPatterns: attemptedTest.behavioralAnalytics?.revisitPatterns || []
    };

    res.status(200).json(
      new ApiResponse(200, navigationAnalysis, "Navigation patterns fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching navigation patterns", error.message);
  }
});

// Get difficulty level analysis
const getDifficultyAnalysis = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const userId = req.user._id;
  
  try {
    const attemptedTest = await AttemptedTest.findOne({ userId, testId });
    if (!attemptedTest) {
      throw new ApiError(404, "Attempt not found");
    }

    const difficultyMetrics = attemptedTest.difficultyMetrics || { perceivedDifficulty: {}, difficultyDistribution: {} };

    const difficultyAnalysis = {
      perceived: difficultyMetrics.perceivedDifficulty,
      distribution: difficultyMetrics.difficultyDistribution,
      performance: Object.entries(attemptedTest.responses).reduce((acc, [questionId, data]) => {
        const difficulty = difficultyMetrics.perceivedDifficulty[questionId];
        if (difficulty) {
          acc[questionId] = {
            timeSpentRatio: difficulty.timeSpentRatio,
            changesRatio: difficulty.changesRatio,
            hesitationRatio: difficulty.hesitationRatio,
            response: data.selectedOption
          };
        }
        return acc;
      }, {})
    };

    res.status(200).json(
      new ApiResponse(200, difficultyAnalysis, "Difficulty analysis fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching difficulty analysis", error.message);
  }
});

// Get user interaction metrics
const getInteractionMetrics = asyncHandler(async (req, res) => {
  const { testId } = req.query;
  const userId = req.user._id;

  try {
    const attemptedTest = await AttemptedTest.findOne({ userId, testId });
    if (!attemptedTest) {
      throw new ApiError(404, "Attempt not found");
    }

    const interactionMetrics = attemptedTest.interactionMetrics || {};
    const interactionAnalysis = {
      mouse: interactionMetrics.mouseMovements || [],
      keyboard: interactionMetrics.keyboardUsage || [],
      scroll: interactionMetrics.scrollPatterns || [],
      environment: attemptedTest.environment || {},
      sessionMetrics: {
        tabSwitches: attemptedTest.environment?.session?.tabSwitches || 0,
        disconnections: attemptedTest.environment?.session?.disconnections || [],
        browserRefreshes: attemptedTest.environment?.session?.browserRefreshes || 0
      }
    };

    res.status(200).json(
      new ApiResponse(200, interactionAnalysis, "Interaction metrics fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching interaction metrics", error.message);
  }
});

// Get performance trends across multiple attempts
const getPerformanceTrends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { testId } = req.query;

  try {
    const attempts = await AttemptedTest.find({ 
      userId,
      ...(testId && { testId })
    }).sort({ attemptNumber: 1 });

    if (!attempts.length) {
      throw new ApiError(404, "No attempts found");
    }

    const trends = attempts.map(attempt => ({
      attemptNumber: attempt.attemptNumber,
      testId: attempt.testId,
      timeAnalytics: attempt.timeAnalytics,
      progressionMetrics: attempt.progressionMetrics || {},
      strategyMetrics: attempt.strategyMetrics || {},
      completionMetrics: attempt.completionMetrics || {},
      timestamp: attempt.startTime
    }));

    res.status(200).json(
      new ApiResponse(200, trends, "Performance trends fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching performance trends", error.message);
  }
});

// Get subject-wise analysis
const getSubjectAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const attempts = await AttemptedTest.find({ userId });

    const subjectAnalysis = attempts.reduce((acc, attempt) => {
      Object.entries(attempt.subjectAnalytics || {}).forEach(([subject, data]) => {
        if (!acc[subject]) {
          acc[subject] = {
            totalAttempts: 0,
            averageAccuracy: 0,
            averageTimePerQuestion: 0,
            weakTopics: new Set(),
            strongTopics: new Set()
          };
        }

        acc[subject].totalAttempts++;
        acc[subject].averageAccuracy += data.accuracy;
        acc[subject].averageTimePerQuestion += data.averageTimePerQuestion;
        data.weakTopics.forEach(topic => acc[subject].weakTopics.add(topic));
        data.strongTopics.forEach(topic => acc[subject].strongTopics.add(topic));
      });
      return acc;
    }, {});

    Object.values(subjectAnalysis).forEach(subject => {
      subject.averageAccuracy /= subject.totalAttempts;
      subject.averageTimePerQuestion /= subject.totalAttempts;
      subject.weakTopics = Array.from(subject.weakTopics);
      subject.strongTopics = Array.from(subject.strongTopics);
    });

    res.status(200).json(
      new ApiResponse(200, subjectAnalysis, "Subject analysis fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching subject analysis", error.message);
  }
});

// Get behavioral insights
const getBehavioralInsights = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { testId } = req.query;

  try {
    const attempt = await AttemptedTest.findOne({ userId, testId });
    if (!attempt) {
      throw new ApiError(404, "Attempt not found");
    }

    const insights = {
      behavioralPatterns: attempt.behavioralAnalytics || {},
      timeManagement: attempt.timeAnalytics || {},
      strategyEffectiveness: attempt.strategyMetrics || {},
      difficultyHandling: attempt.difficultyMetrics || {},
      interactionPatterns: attempt.interactionMetrics || {}
    };

    res.status(200).json(
      new ApiResponse(200, insights, "Behavioral insights fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching behavioral insights", error.message);
  }
});

// Delete test attempt
const deleteTestAttempt = asyncHandler(async (req, res) => {
  const { testId } = req.params;
  const userId = req.user._id;

  try {
    const deletedAttempt = await AttemptedTest.findOneAndDelete({ userId, testId });
    if (!deletedAttempt) {
      throw new ApiError(404, "Test attempt not found");
    }

    res.status(200).json(
      new ApiResponse(200, deletedAttempt, "Test attempt deleted successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error deleting test attempt", error.message);
  }
});

export {
  submitTest,
  getDetailedTestAnalysis,
  getTimeAnalytics,
  getErrorAnalysis,
  getNavigationPatterns,
  getDifficultyAnalysis,
  getInteractionMetrics,
  getPerformanceTrends,
  getSubjectAnalysis,
  getBehavioralInsights,
  deleteTestAttempt
};
