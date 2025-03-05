import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { Question } from "../models/question.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadQuestion = asyncHandler( async (req, res) => {
    const {
        question,
        options,
        correctOption,
        examType,
        subject,
        sectionPhysics,
        sectionChemistry,
        sectionMathematics,
        difficulty,
        year,
        languageLevel,
        solutionMode
        } = req.body;
    
        // Create new question instance
    const newQuestion = new Question({
        question,
        options,
        correctOption,
        examType,
        subject,
        sectionPhysics,
        sectionChemistry,
        sectionMathematics,
        difficulty,
        year,
        languageLevel,
        solutionMode
    });

    // Save question to the database
    const savedQuestion = await newQuestion.save();
    res.status(201).json({ message: 'Question saved successfully', data: savedQuestion });

})

const getQuestions = asyncHandler(async (req, res) => {
    try {
        // Extract query parameters from the request
        const { testType, subject } = req.query;

        // Build the filter object
        const filter = {};

        if (testType) {
            filter.examType = testType; // Filter by testType (examType in your schema)
        }

        if (subject) {
            filter.subject = subject; // Filter by subject
        }

        // Retrieve questions based on the filter
        const questions = await Question.find(filter);

        // Send the response with the filtered questions
        res.status(200).json({
            message: "Questions retrieved successfully",
            data: questions
        });
    } catch (error) {
        throw new ApiError(500, 'Error retrieving questions', error.message);
    }
});

const getQuestionById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log("req.params", req.params);

    // Find the question by ID
    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    res.status(200).json({
        message: "Question retrieved successfully",
        data: question,
    });
});


const updateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params; // Extract question ID from URL params
    const updateData = req.body; // Get the updated data from request body

    // Check if the question exists
    const existingQuestion = await Question.findById(id);
    if (!existingQuestion) {
        throw new ApiError(404, "Question not found");
    }

    // Merge the existing question data with the new updates
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
            existingQuestion[key] = updateData[key]; // Update only provided fields
        }
    });

    // Save the updated question
    await existingQuestion.save();

    res.status(200).json({
        message: "Question updated successfully",
        data: existingQuestion,
    });
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Find and delete the question
    const deletedQuestion = await Question.findByIdAndDelete(id);

    if (!deletedQuestion) {
        throw new ApiError(404, "Question not found");
    }

    res.status(200).json({
        message: "Question deleted successfully",
        data: deletedQuestion,
    });
});


export {
    uploadQuestion,
    getQuestions,
    updateQuestion,
    getQuestionById,
    deleteQuestion
}


