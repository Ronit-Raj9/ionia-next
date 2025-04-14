import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Test } from "../models/test.model.js";
import { Question } from "../models/question.model.js";
import { AttemptedTest } from "../models/attemptedTest.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// Create a simple request cache to prevent duplicate logs and processing
const requestCache = new Map();
const CACHE_TTL = 5000; // 5 seconds cache TTL

// Helper to create a cache key from request parameters
const createCacheKey = (userId, attemptId, paperId) => {
  return `${userId}-${attemptId || ''}-${paperId || ''}`;
};

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
      
      // Log detailed question and answer data for debugging
      console.log(`Processing question ${answer.questionId}:`, {
        questionId: answer.questionId,
        answerOption: answer.answerOptionIndex,
        correctOptions: question.correctOptions,
        type: typeof question.correctOptions
      });
      
      // Determine if the answer is correct
      let isCorrect = false;
      
      // Only process if the user actually answered the question
      if (answer.answerOptionIndex !== undefined && answer.answerOptionIndex !== null) {
        // Ensure correctOptions is always an array to prevent type errors
        const correctOpts = Array.isArray(question.correctOptions) 
          ? question.correctOptions 
          : (question.correctOptions ? [question.correctOptions] : []);
        
        // Check if the answer is included in correct options
        isCorrect = correctOpts.includes(answer.answerOptionIndex);
        
        // Log the correctness check
        console.log(`Correctness check for question ${answer.questionId}:`, {
          userAnswer: answer.answerOptionIndex,
          correctOptions: correctOpts,
          isCorrect: isCorrect
        });
        
        // Update counters
        if (isCorrect) {
          correctAnswers++;
        } else {
          wrongAnswers++;
        }
      }
      
      return {
        questionId: answer.questionId,
        answerOptionIndex: answer.answerOptionIndex !== undefined ? answer.answerOptionIndex : null,
        timeSpent: answer.timeSpent || 0,
        isCorrect: isCorrect // Store the correctness result directly in the answer
      };
    }).filter(a => a !== null);
    
    // Log final counts
    console.log("Final answer counts:", {
      correctAnswers,
      wrongAnswers,
      totalAnswers: processedAnswers.length,
      unattempted: test.questionCount - processedAnswers.length
    });

    // CRITICAL FIX: Check if the counts make sense
    const attemptedCount = answers.filter(a => 
      a.answerOptionIndex !== undefined && a.answerOptionIndex !== null
    ).length;
    
    // Ensure wrong answers are correctly calculated as attempted - correct
    if (wrongAnswers !== attemptedCount - correctAnswers) {
      console.log("Fixing incorrect wrong answer calculation");
      wrongAnswers = attemptedCount - correctAnswers;
    }
    
    console.log("Fixed submission counts:", {
      attempted: attemptedCount,
      correct: correctAnswers,
      wrong: wrongAnswers,
      unattempted: test.questionCount - attemptedCount
    });

    // Prepare navigation history with proper structure
    const formattedNavigationHistory = Array.isArray(navigationHistory) 
      ? navigationHistory.map(event => ({
          timestamp: new Date(event.timestamp || Date.now()),
          questionId: event.questionId,
          action: event.action || "visit",
          timeSpent: event.timeSpent || 0
        }))
      : [];

    // Prepare environment data
    const formattedEnvironment = {
      device: {
        userAgent: environment?.device?.userAgent || '',
        screenResolution: environment?.device?.screenResolution || '',
        deviceType: environment?.device?.deviceType || 'desktop'
      },
      session: {
        tabSwitches: environment?.session?.tabSwitches || 0,
        disconnections: Array.isArray(environment?.session?.disconnections) 
          ? environment.session.disconnections.map(d => ({
              startTime: new Date(d.startTime || Date.now()),
              endTime: new Date(d.endTime || Date.now()),
              duration: d.duration || 0
            }))
          : [],
        browserRefreshes: environment?.session?.browserRefreshes || 0
      }
    };

    // Create a new attempted test document
    const attemptedTest = new AttemptedTest({
      userId,
      testId,
      language: language || 'English',
      startTime: startTime ? new Date(startTime) : new Date(Date.now() - (totalTimeTaken || 0)),
      endTime: endTime ? new Date(endTime) : new Date(),
      totalTimeTaken: totalTimeTaken || 0,
      answers: processedAnswers,
      
      // Pre-computed totals for quick access
      totalCorrectAnswers: correctAnswers,
      totalWrongAnswers: wrongAnswers,
      totalUnattempted: test.questionCount - attemptedCount,
      totalVisitedQuestions: metadata?.visitedQuestions?.length || 0,
      score: (correctAnswers * (test.markingScheme?.correct || 5)) + 
             (wrongAnswers * (test.markingScheme?.incorrect || 0)) +
             ((test.questionCount - attemptedCount) * (test.markingScheme?.unattempted || 0)),
      
      // Metadata
      metadata: {
        totalQuestions: test.questionCount,
        answeredQuestions: Array.isArray(metadata?.answeredQuestions) 
          ? metadata.answeredQuestions 
          : processedAnswers.map(a => a.questionId),
        visitedQuestions: Array.isArray(metadata?.visitedQuestions) 
          ? metadata.visitedQuestions 
          : [],
        markedForReview: Array.isArray(metadata?.markedForReview) 
          ? metadata.markedForReview 
          : [],
        selectedLanguage: metadata?.selectedLanguage || language || 'English'
      },
      
      // Question states
      questionStates: {
        notVisited: Array.isArray(questionStates?.notVisited) ? questionStates.notVisited : [],
        notAnswered: Array.isArray(questionStates?.notAnswered) ? questionStates.notAnswered : [],
        answered: Array.isArray(questionStates?.answered) 
          ? questionStates.answered 
          : processedAnswers.map(a => a.questionId),
        markedForReview: Array.isArray(questionStates?.markedForReview) ? questionStates.markedForReview : [],
        markedAndAnswered: Array.isArray(questionStates?.markedAndAnswered) ? questionStates.markedAndAnswered : []
      },
      
      // Navigation history with proper structure
      navigationHistory: formattedNavigationHistory,
      
      // Environment data with proper structure
      environment: formattedEnvironment
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
    // Get attemptId from query params or path params
    const attemptId = req.params.attemptId || req.query.attemptId;
    const paperId = req.query.paperId;
    
    // Check if we have paperId or attemptId
    if ((!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) && 
        (!paperId || !mongoose.Types.ObjectId.isValid(paperId))) {
      throw new ApiError(400, "Valid Attempt ID or Paper ID is required.");
    }
    
    // Create a cache key for this request
    const cacheKey = createCacheKey(userId, attemptId, paperId);
    
    // Check if we have a cached response
    if (requestCache.has(cacheKey)) {
      console.log("Using cached analysis response for:", { userId, attemptId, paperId });
      return res.status(200).json(requestCache.get(cacheKey));
    }
    
    console.log("Fetching analysis for:", { userId, attemptId, paperId });

    let attemptedTest;
    
    // If attemptId is provided, find by that first
    if (attemptId) {
      attemptedTest = await AttemptedTest.findOne({ _id: attemptId, userId });
    } 
    
    // If no attempt found or no attemptId provided, try finding by paperId (most recent attempt)
    if (!attemptedTest && paperId) {
      attemptedTest = await AttemptedTest.findOne({ 
        userId, 
        testId: paperId 
      }).sort({ createdAt: -1 }); // Most recent attempt
    }

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

    // Create a map for quick question lookup
    const questionMap = new Map(test.questions.map(q => [q._id.toString(), q]));

    // CRITICAL FIX: Recalculate correct answers directly from questions and answers
    // This ensures we're not relying on potentially outdated stored values
    let recalculatedCorrect = 0;
    let recalculatedWrong = 0;
    
    // Process answers and revalidate correctness
    const answersWithDetails = attemptedTest.answers.map(answer => {
      const question = questionMap.get(answer.questionId?.toString());
      
      // Skip if question not found
      if (!question) {
        return {
          questionId: answer.questionId,
          selectedOption: answer.answerOptionIndex,
          timeSpent: answer.timeSpent || 0,
          isCorrect: false,
          correctAnswer: []
        };
      }
      
      // Ensure correctOptions is an array
      const correctOpts = Array.isArray(question.correctOptions) ? question.correctOptions : [];
      
      // Recalculate if the answer is correct
      const isCorrect = 
        answer.answerOptionIndex !== undefined && 
        answer.answerOptionIndex !== null && 
        correctOpts.includes(answer.answerOptionIndex);
      
      // Update counters
      if (isCorrect) {
        recalculatedCorrect++;
      } else if (answer.answerOptionIndex !== undefined && answer.answerOptionIndex !== null) {
        recalculatedWrong++;
      }
      
      return {
        questionId: answer.questionId,
        selectedOption: answer.answerOptionIndex,
        timeSpent: answer.timeSpent || 0,
        isCorrect: isCorrect,
        correctAnswer: correctOpts
      };
    });
    
    // Log the recalculation results
    console.log("Recalculated answer counts:", {
      correct: recalculatedCorrect,
      wrong: recalculatedWrong,
      unattempted: test.questionCount - recalculatedCorrect - recalculatedWrong,
      stored: {
        correct: attemptedTest.totalCorrectAnswers,
        wrong: attemptedTest.totalWrongAnswers
      }
    });

    // CRITICAL FIX: Check if the counts make sense
    const attemptedCount = attemptedTest.answers.filter(a => 
      a.answerOptionIndex !== undefined && a.answerOptionIndex !== null
    ).length;
    
    // If wrong answers + correct answers exceeds the attempted count, something is wrong
    if (recalculatedWrong + recalculatedCorrect > attemptedCount) {
      console.log("Fixing incorrect wrong answer calculation");
      recalculatedWrong = attemptedCount - recalculatedCorrect;
    }
    
    console.log("Fixed answer counts:", {
      attempted: attemptedCount,
      correct: recalculatedCorrect,
      wrong: recalculatedWrong,
      unattempted: test.questionCount - attemptedCount
    });

    // Get all attempts for this test by this user
    const allAttempts = await AttemptedTest.find({
      userId,
      testId: attemptedTest.testId
    }).sort({ createdAt: -1 }).select('_id createdAt score');
    
    // Format attempts for the frontend
    const formattedAttempts = allAttempts.map((attempt, index) => ({
      id: attempt._id.toString(),
      number: allAttempts.length - index, // Reverse order: newest attempt gets highest number
      score: attempt.score,
      date: attempt.createdAt
    }));
    
    console.log(`Found ${formattedAttempts.length} attempts for this test`);

    // Calculate time metrics if not already present
    const totalTimeSpent = attemptedTest.totalTimeTaken || 
                          (attemptedTest.endTime && attemptedTest.startTime ? 
                          (new Date(attemptedTest.endTime) - new Date(attemptedTest.startTime)) / 1000 : 0);
    
    const averageTimePerQuestion = totalTimeSpent && attemptedTest.answers.length ? 
                                 totalTimeSpent / attemptedTest.answers.length : 0;
    
    console.log("Calculated time metrics:", {
      totalTimeSpent,
      averageTimePerQuestion,
      fromAnswers: attemptedTest.answers.reduce((sum, a) => sum + (a.timeSpent || 0), 0)
    });
    console.log("Marking Scheme:", test.markingScheme);
    // Build detailed analysis using the updated schema structure
    const detailedAnalysis = {
      testInfo: {
        testId: test._id,
        attemptId: attemptedTest._id,
        testTitle: test.title,
        testCategory: test.testCategory,
        language: attemptedTest.language || 'English',
        duration: attemptedTest.totalTimeTaken || 0,
        startTime: attemptedTest.startTime,
        endTime: attemptedTest.endTime,
        markingScheme: test.markingScheme || {
          correct: 5,  // Default values if not set in the test
          incorrect: 0,
          unattempted: 0
        }
      },
      attempts: formattedAttempts,
      answers: answersWithDetails,
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
        // Use recalculated values instead of stored values
        totalCorrectAnswers: recalculatedCorrect,
        totalWrongAnswers: recalculatedWrong,
        totalUnattempted: test.questionCount - recalculatedCorrect - recalculatedWrong,
        // Recalculate score to ensure it's correct
        score: (() => {
          const markingScheme = test.markingScheme || { correct: 5, incorrect: 0, unattempted: 0 };
          return (recalculatedCorrect * (markingScheme.correct || 5)) +
                 (recalculatedWrong * (markingScheme.incorrect || 0)) +
                 ((test.questionCount - recalculatedCorrect - recalculatedWrong) * (markingScheme.unattempted || 0));
        })(),
        percentage: test.totalMarks > 0 ? 
                  ((recalculatedCorrect * (test.markingScheme?.correct || 5)) / test.totalMarks) * 100 : 
                  ((recalculatedCorrect / (test.questionCount || 1)) * 100),
        totalVisitedQuestions: attemptedTest.totalVisitedQuestions,
        totalTimeTaken: totalTimeSpent,
        // Add these for convenience in the frontend
        correctAnswers: recalculatedCorrect,
        wrongAnswers: recalculatedWrong,
        unattempted: test.questionCount - recalculatedCorrect - recalculatedWrong
      },
      timeAnalytics: {
        totalTimeSpent: totalTimeSpent,
        averageTimePerQuestion: averageTimePerQuestion,
        questionTimeDistribution: attemptedTest.timeAnalytics?.questionTimeDistribution || {
          lessThan30Sec: [],
          between30To60Sec: [],
          between1To2Min: [],
          moreThan2Min: []
        }
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

    const response = new ApiResponse(200, detailedAnalysis, "Detailed test analysis fetched successfully");
    
    // Cache the response
    requestCache.set(cacheKey, response);
    
    // Set a timeout to clear the cache entry
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, CACHE_TTL);

    res.status(200).json(response);
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

    console.log("Backend timeAnalytics:", {
      totalDuration: attemptedTest.totalTimeTaken,
      averageTimePerQuestion: attemptedTest.timeAnalytics?.averageTimePerQuestion,
      sampleAnswers: attemptedTest.answers.slice(0, 2).map(a => ({ 
        timeSpent: a.timeSpent, 
        questionId: a.questionId 
      }))
    });

    // Structure the response based on new schema
    const timeAnalysis = {
      overall: {
        totalDuration: attemptedTest.totalTimeTaken,
        averageTimePerQuestion: attemptedTest.timeAnalytics?.averageTimePerQuestion || 0,
        timeDistribution: Object.fromEntries(attemptedTest.timeAnalytics?.questionTimeDistribution || new Map())
      },
      performance: {
        peakPerformancePeriods: attemptedTest.timeAnalytics?.peakPerformancePeriods || [],
        fatiguePeriods: attemptedTest.timeAnalytics?.fatiguePeriods || []
      },
      questionWise: attemptedTest.answers.map(answer => ({
        questionId: answer.questionId,
        timeSpent: answer.timeSpent,
        visits: attemptedTest.navigationHistory.filter(
          nav => nav.questionId.toString() === answer.questionId.toString() && nav.action === 'visit'
        ).length,
        firstVisit: attemptedTest.navigationHistory.find(
          nav => nav.questionId.toString() === answer.questionId.toString() && nav.action === 'visit'
        )?.timestamp || null,
        lastVisit: [...attemptedTest.navigationHistory]
          .reverse()
          .find(nav => nav.questionId.toString() === answer.questionId.toString() && nav.action === 'visit')
          ?.timestamp || null
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

    // Use new schema structure
    const errorAnalysis = {
      commonMistakes: attemptedTest.errorAnalytics?.commonMistakes || [],
      patterns: Object.fromEntries(attemptedTest.errorAnalytics?.errorPatterns || new Map()),
      subjectWise: Object.fromEntries(
        Array.from(attemptedTest.subjectAnalytics || new Map()).map(([subject, data]) => [
          subject,
          {
            accuracy: data.accuracy,
            weakTopics: data.weakTopics,
            improvementAreas: data.improvementAreas
          }
        ])
      )
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

    const navigationAnalysis = {
      sequence: attemptedTest.navigationHistory.map(nav => ({
        timestamp: nav.timestamp,
        questionId: nav.questionId,
        action: nav.action,
        timeSpent: nav.timeSpent
      })),
      patterns: {
        backtracking: attemptedTest.strategyMetrics?.questionSequencing?.backtracking || 0,
        subjectSwitching: attemptedTest.strategyMetrics?.questionSequencing?.subjectSwitching || 0,
        optimalChoices: attemptedTest.strategyMetrics?.questionSequencing?.optimalChoices || 0
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

    // Use Map structure from new schema
    const difficultyAnalysis = {
      perceived: Object.fromEntries(attemptedTest.difficultyMetrics?.perceivedDifficulty || new Map()),
      distribution: attemptedTest.difficultyMetrics?.difficultyDistribution || {
        easy: 0,
        medium: 0,
        hard: 0
      },
      performance: attemptedTest.answers.reduce((acc, answer) => {
        const difficulty = Object.fromEntries(attemptedTest.difficultyMetrics?.perceivedDifficulty || new Map())[answer.questionId];
        if (difficulty) {
          acc[answer.questionId] = {
            timeSpentRatio: difficulty.timeSpentRatio,
            changesRatio: difficulty.changesRatio,
            hesitationRatio: difficulty.hesitationRatio,
            response: answer.answerOptionIndex,
            isCorrect: answer.isCorrect
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

    const interactionAnalysis = {
      mouse: attemptedTest.interactionMetrics?.mouseMovements || [],
      keyboard: attemptedTest.interactionMetrics?.keyboardUsage || [],
      scroll: attemptedTest.interactionMetrics?.scrollPatterns || [],
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

// Additional improved controllers

// Get performance trends across multiple attempts
const getPerformanceTrends = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { testId } = req.query;

  try {
    const attempts = await AttemptedTest.find({ 
      userId,
      ...(testId && { testId })
    }).sort({ startTime: 1 });

    if (!attempts.length) {
      throw new ApiError(404, "No attempts found");
    }

    const trends = attempts.map(attempt => ({
      attemptId: attempt._id,
      testId: attempt.testId,
      attemptNumber: attempt.attemptNumber,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      score: attempt.score,
      totalCorrectAnswers: attempt.totalCorrectAnswers,
      totalWrongAnswers: attempt.totalWrongAnswers,
      totalUnattempted: attempt.totalUnattempted,
      timeAnalytics: {
        averageTimePerQuestion: attempt.timeAnalytics?.averageTimePerQuestion,
        peakPerformancePeriods: attempt.timeAnalytics?.peakPerformancePeriods?.length
      },
      strategyMetrics: attempt.strategyMetrics || {}
    }));

    res.status(200).json(
      new ApiResponse(200, trends, "Performance trends fetched successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error fetching performance trends", error.message);
  }
});

// Get subject-wise analysis with Map support
const getSubjectAnalysis = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const attempts = await AttemptedTest.find({ userId });

    const subjectAnalysis = attempts.reduce((acc, attempt) => {
      // Convert Map to entries, then process
      Array.from(attempt.subjectAnalytics || new Map()).forEach(([subject, data]) => {
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
        acc[subject].averageAccuracy += data.accuracy || 0;
        acc[subject].averageTimePerQuestion += data.averageTimePerQuestion || 0;
        
        (data.weakTopics || []).forEach(topic => acc[subject].weakTopics.add(topic));
        (data.strongTopics || []).forEach(topic => acc[subject].strongTopics.add(topic));
      });
      return acc;
    }, {});

    // Convert Sets to Arrays in the result
    Object.values(subjectAnalysis).forEach(subject => {
      if (subject.totalAttempts > 0) {
        subject.averageAccuracy /= subject.totalAttempts;
        subject.averageTimePerQuestion /= subject.totalAttempts;
      }
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

// Delete test attempt
const deleteTestAttempt = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user._id;

  try {
    if (!mongoose.Types.ObjectId.isValid(attemptId)) {
      throw new ApiError(400, "Invalid attempt ID format");
    }

    const deletedAttempt = await AttemptedTest.findOneAndDelete({ 
      _id: attemptId,
      userId 
    });
    
    if (!deletedAttempt) {
      throw new ApiError(404, "Test attempt not found");
    }

    res.status(200).json(
      new ApiResponse(200, { deletedId: attemptId }, "Test attempt deleted successfully")
    );
  } catch (error) {
    throw new ApiError(500, "Error deleting test attempt", error.message);
  }
});

// Get solutions and explanations for a specific test attempt
const getSolutions = asyncHandler(async (req, res) => {
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

    // Find the attempted test
    const attemptedTest = await AttemptedTest.findOne({ 
      _id: attemptId, 
      userId 
    });

    if (!attemptedTest) {
      throw new ApiError(404, "Attempted test not found for this user.");
    }

    // Get the original test with populated questions to access solutions
    const test = await Test.findById(attemptedTest.testId).populate({
      path: 'questions',
      select: '_id content options correctOptions explanation subject topic difficulty'
    });

    if (!test) {
      throw new ApiError(404, "Original test definition not found for this attempt");
    }

    // Create a map for quick question lookup
    const questionMap = new Map(test.questions.map(q => [q._id.toString(), q]));

    // Prepare solutions with user's answers and correct options
    const solutions = attemptedTest.answers.map(answer => {
      const question = questionMap.get(answer.questionId?.toString());
      
      if (!question) {
        return null;
      }

      return {
        questionId: answer.questionId,
        content: question.content,
        options: question.options,
        userSelected: answer.answerOptionIndex,
        correctOptions: question.correctOptions,
        isCorrect: answer.isCorrect,
        explanation: question.explanation || "No explanation provided.",
        subject: question.subject || "General",
        topic: question.topic || "General",
        difficulty: question.difficulty || "Medium",
      };
    }).filter(solution => solution !== null);

    // Return the solutions
    res.status(200).json(
      new ApiResponse(200, {
        attemptId: attemptedTest._id,
        testId: attemptedTest.testId,
        testTitle: test.title || "Test",
        solutions: solutions
      }, "Solutions fetched successfully")
    );
  } catch (error) {
    console.error("Error in getSolutions:", error);
    throw new ApiError(error.statusCode || 500, error.message || 'Error fetching solutions');
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
  deleteTestAttempt,
  getSolutions
};