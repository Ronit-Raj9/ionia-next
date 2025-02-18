import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { PreviousTest } from "../models/previousYearPaper.model.js";
import { Question } from "../models/question.model.js";
import { AttemptedTest } from "../models/attemptedTest.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Controller to submit test answers and save the attempted test
const submitTest = asyncHandler(async (req, res) => {
  const { userId, paperId, answers, metadata } = req.body;
  // console.log(req.body);

  try {
    // Get the total number of questions in the test

    const test = await PreviousTest.findById(paperId).populate('questions');
    if (!test) {
      throw new ApiError(404, "Test not found");
    }

    // Calculate total time taken for the test from answers
    const totalTimeTaken = answers.reduce((total, answer) => total + answer.timeSpent, 0);
    console.log("Save fn ke andar")
    // Create a new attempted test document
    const attemptedTest = new AttemptedTest({
      userId,
      testId: paperId,
      answers,
      metadata: {
        totalQuestions: test.questions.length,
        ...metadata,
      },
      totalTimeTaken,
    });
 
    // Save the attempted test to the database
    console.log("saving test started");
    await attemptedTest.save();
    console.log("Attempted test database me save ho gya h: ",attemptedTest);
    // Send success response
    res.status(201).json(new ApiResponse("Test submitted successfully", attemptedTest));
  } catch (error) {
    throw new ApiError(500, 'Error submitting test', error.message);
  }
});

// Controller to get the analysis of a test attempt
const getTestAnalysis = asyncHandler(async (req, res) => {
  const { attemptedTestId } = req.params;
  console.log("getTestAnalysis ke andar");

  try {
    // Fetch the attempted test
    const attemptedTest = await AttemptedTest.findById(attemptedTestId).populate('answers.questionId');
    if (!attemptedTest) {
      throw new ApiError(404, 'Attempted test not found');
    }

    // Calculate analysis data
    const correctAnswers = attemptedTest.answers.filter(answer =>
      answer.answerOptionIndex === answer.questionId.correctOption
    ).length;

    const wrongAnswers = attemptedTest.answers.length - correctAnswers;
    const visitedQuestions = attemptedTest.metadata.visitedQuestions.length;

    const marksObtained = correctAnswers; // Marks Obtained
    const questionsAttempted = visitedQuestions; // Questions Attempted
    const accuracy = (correctAnswers / attemptedTest.metadata.totalQuestions) * 100; // Accuracy
    const timeSpent = attemptedTest.totalTimeTaken; // Time Spent

    // Prepare the response data in the format required by frontend
    const analysis = {
      marksObtained,
      questionsAttempted,
      accuracy: accuracy.toFixed(2), // Format to 2 decimal places
      timeSpent: (timeSpent / 60).toFixed(2), // Convert seconds to minutes and format
      totalQuestions: attemptedTest.metadata.totalQuestions, // Optional, in case frontend needs it
    };

    // Send the analysis data
    res.status(200).json(new ApiResponse('Test analysis fetched successfully', analysis));
  } catch (error) {
    throw new ApiError(500, 'Error fetching analysis', error.message);
  }
});


const getAllAnalysis = asyncHandler(async (req, res) => {
  try {
    console.log("getAllAnalysis ke andar");

    let attemptedTests;
    try {
      // Wrap the database query in a try-catch to handle errors specifically for the query
      attemptedTests = await AttemptedTest.find({}).populate('answers.questionId');
    } catch (err) {
      throw new ApiError(500, 'Error fetching attempted tests', err.message);
    }

    if (!attemptedTests || attemptedTests.length === 0) {
      throw new ApiError(404, 'No attempted tests found');
    }

    console.log("Attempted tests: ", attemptedTests);

    // Map each attempted test to its analysis data
    const analyses = attemptedTests.map((test) => {
      // Calculate the number of correct answers. Guard against missing question data.
      const correctAnswers = test.answers.filter((answer) => {
        if (answer.questionId && answer.questionId.correctOption !== undefined) {
          return answer.answerOptionIndex === answer.questionId.correctOption;
        }
        return false;
      }).length;

      // Calculate the number of wrong answers.
      const wrongAnswers = test.answers.length - correctAnswers;

      // Calculate the number of visited questions.
      const visitedQuestions =
        test.metadata && Array.isArray(test.metadata.visitedQuestions)
          ? test.metadata.visitedQuestions.length
          : 0;

      return {
        testId: test._id,
        totalCorrectAnswers: correctAnswers,
        totalWrongAnswers: wrongAnswers,
        totalVisitedQuestions: visitedQuestions,
        totalTimeTaken: test.totalTimeTaken,
        totalQuestions:
          test.metadata && test.metadata.totalQuestions !== undefined
            ? test.metadata.totalQuestions
            : 0,
      };
    });

    // Send the analysis data for all tests
    res.status(200).json(new ApiResponse('All test analyses fetched successfully', analyses));
  } catch (error) {
    throw new ApiError(500, 'Error fetching all analyses', error.message);
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

    // Update answers and metadata
    attemptedTest.answers = answers;
    attemptedTest.metadata = metadata;
    attemptedTest.totalTimeTaken = answers.reduce((total, answer) => total + answer.timeSpent, 0);

    // Save the updated attempted test data
    await attemptedTest.save();

    // Send success response with updated data
    res.status(200).json(new ApiResponse('Test results updated successfully', attemptedTest));
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

    // Return success response
    res.status(200).json(new ApiResponse('Test results deleted successfully', deletedTest));
  } catch (error) {
    throw new ApiError(500, 'Error deleting test results', error.message);
  }
});

export {
  submitTest,
  getTestAnalysis,
  updateTestResults,
  deleteTestResults,
  getAllAnalysis
};
