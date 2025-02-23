import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { PreviousTest } from "../models/previousYearPaper.model.js";
import { AttemptedTest } from "../models/attemptedTest.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"; // Import JWT for token verification

// Controller to submit test answers and save the attempted test
const submitTest = asyncHandler(async (req, res) => {
  try {
    // Extract token from cookies
    const token = req.cookies.accessToken; // Ensure frontend sends credentials: "include"
    console.log("Token in Backend coming from frontend:", token);
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

    const userId = decoded._id; // Extract userId from decoded token

    const { paperId, answers, metadata } = req.body;
    console.log("metadata:", metadata);

    // Validate required fields
    if (!paperId || !answers || !metadata) {
      throw new ApiError(400, "All fields (paperId, answers, metadata) are required.");
    }

    // Get the test details and its questions
    const test = await PreviousTest.findById(paperId).populate('questions');
    if (!test) {
      throw new ApiError(404, "Test not found");
    }

    // Calculate total time taken for the test from answers
    const totalTimeTaken = answers.reduce((total, answer) => total + (answer.timeSpent || 0), 0);

    // Validate metadata
    if (!metadata.selectedLanguage) {
      throw new ApiError(400, "Selected language is required in metadata.");
    }

    // Find the last attempt number for this user and test
    const lastAttempt = await AttemptedTest.findOne({ userId, testId: paperId })
      .sort({ attemptNumber: -1 })
      .select('attemptNumber');

    // If no previous attempt exists or the value is invalid, default to 0
    const lastAttemptNumber = lastAttempt && !isNaN(lastAttempt.attemptNumber)
      ? Number(lastAttempt.attemptNumber)
      : 0;
    const newAttemptNumber = lastAttemptNumber + 1;
    console.log("New attempt number:", newAttemptNumber);

    // Create a new attempted test document with the computed attemptNumber
    const attemptedTest = new AttemptedTest({
      userId, // Now extracted from token
      testId: paperId,
      attemptNumber: newAttemptNumber,
      answers,
      metadata: {
        totalQuestions: test.questions.length,
        ...metadata,
      },
      totalTimeTaken,
    });

    // Save the attempted test to the database
    await attemptedTest.save();

    console.log("attempedted Test", attemptedTest);

    // Send success response
    res.status(201).json(new ApiResponse(201, attemptedTest, "Test submitted successfully"));
  } catch (error) {
    console.error("Error in submitTest:", error);
    throw new ApiError(500, 'Error submitting test', error.message);
  }
});

const getTestAnalysis = asyncHandler(async (req, res) => {
  const { paperId } = req.query; // Now coming from the URL parameter
  const userId = req.user._id;    // Get user ID from auth middleware

  console.log("Fetching test analysis for user:", userId, "and paper:", paperId);

  try {
    if (!paperId) {
      throw new ApiError(400, "Paper ID is required.");
    }

    // Fetch all attempted tests for the authenticated user and the specified test
    const attemptedTests = await AttemptedTest.find({ userId, testId: paperId })
      .populate("answers.questionId")
      .sort({ attemptNumber: -1 }); // Latest attempt first

    if (!attemptedTests || attemptedTests.length === 0) {
      throw new ApiError(404, "No attempted tests found for this user and test.");
    }

    // Map each attempt to its analysis data, including the attemptNumber
    const analyses = attemptedTests.map((test) => {
      const correctAnswers = test.answers.filter((answer) => {
        if (answer.questionId && answer.questionId.correctOption !== undefined) {
          return answer.answerOptionIndex === answer.questionId.correctOption;
        }
        return false;
      }).length;
    
      const wrongAnswers = test.answers.length - correctAnswers;
      const visitedQuestions = test.metadata && Array.isArray(test.metadata.visitedQuestions)
        ? test.metadata.visitedQuestions.length
        : 0;
    
      return {
        attemptNumber: test.attemptNumber, // Include attemptNumber
        testId: test.testId || test._id,    // Depending on your schema, you can also include userId if needed
        totalCorrectAnswers: correctAnswers,
        totalWrongAnswers: wrongAnswers,
        totalVisitedQuestions: visitedQuestions,
        totalTimeTaken: test.totalTimeTaken,
        totalQuestions: test.metadata && test.metadata.totalQuestions !== undefined
          ? test.metadata.totalQuestions
          : 0,
        createdAt: test.createdAt, // You can add more fields if needed
      };
    });
    
    res.status(200).json(new ApiResponse(200, analyses, "Test analysis fetched successfully"));
  } catch (error) {
    throw new ApiError(500, "Error fetching test analysis", error.message);
  }
});

// Controller to update the results of a user's test attempt
const updateTestResults = asyncHandler(async (req, res) => {
  const { attemptedTestId, answers, metadata } = req.body;

  try {
    // Find the attempted test by ID
    const attemptedTest = await AttemptedTest.findById(attemptedTestId);
    if (!attemptedTest) {
      throw new ApiError(404, 'Attempted test not found');
    }

    // Update answers, metadata, and totalTimeTaken
    attemptedTest.answers = answers;
    attemptedTest.metadata = metadata;
    attemptedTest.totalTimeTaken = answers.reduce((total, answer) => total + answer.timeSpent, 0);

    // Save the updated attempted test data
    await attemptedTest.save();

    res.status(200).json(new ApiResponse(200, attemptedTest, "Test results updated successfully"));
  } catch (error) {
    throw new ApiError(500, 'Error updating test results', error.message);
  }
});

// Controller to delete an attempted test
const deleteTestResults = asyncHandler(async (req, res) => {
  const { attemptedTestId } = req.params;

  try {
    // Find and delete the attempted test by ID
    const deletedTest = await AttemptedTest.findByIdAndDelete(attemptedTestId);
    if (!deletedTest) {
      throw new ApiError(404, 'Attempted test not found');
    }

    res.status(200).json(new ApiResponse(200, deletedTest, "Test results deleted successfully"));
  } catch (error) {
    throw new ApiError(500, 'Error deleting test results', error.message);
  }
});

export {
  submitTest,
  getTestAnalysis,
  updateTestResults,
  deleteTestResults
};
