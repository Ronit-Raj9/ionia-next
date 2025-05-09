import mongoose from "mongoose";
import { Test } from "../models/test.model.js";
import { Question } from "../models/question.model.js"; // Needed for calculating marks on update
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// --- Create Test --- 
const createTest = asyncHandler(async (req, res) => {
    console.log("Attempting to create test with body:", req.body);
    // 1. Extract data from request body
    const {
        title,
        description,
        tags,
        testCategory, // PYQ, Platform, UserCustom
        status = 'draft', // Default status
        instructions,
        solutionsVisibility,
        attemptsAllowed,
        questions, // Array of Question ObjectIds
        duration,
        markingScheme,
        subject,
        examType,
        class: className, // Renamed to avoid keyword conflict
        difficulty,
        // PYQ specific
        year,
        month,
        day,
        session,
        // Platform specific
        platformTestType,
        isPremium,
        syllabus,
        // UserCustom specific (usually set automatically)
        // isPublic, 
        // generationCriteria
    } = req.body;

    // 2. Get creator ID from authenticated user
    const createdBy = req.user?._id;
    if (!createdBy) {
        throw new ApiError(401, "User must be logged in to create a test");
    }

    // 3. Basic Validation (Mongoose schema handles more complex validation)
    if (!title || !testCategory || !questions || !duration || !subject || !examType || !className) {
        throw new ApiError(400, "Missing required fields (title, category, questions, duration, subject, examType, class)");
    }
    if (!Array.isArray(questions) || questions.length === 0) {
        throw new ApiError(400, "Test must contain at least one question");
    }

    // Validate type-specific required fields
    if (testCategory === 'PYQ' && !year) {
        throw new ApiError(400, "Year is required for PYQ tests");
    }
    if (testCategory === 'Platform' && !platformTestType) {
        throw new ApiError(400, "Platform Test Type is required for Platform tests");
    }

    // 4. Create Test Instance
    // Note: questionCount and totalMarks will be calculated by pre-save hook
    const test = new Test({
        title,
        description,
        tags,
        testCategory,
        status,
        instructions,
        solutionsVisibility,
        attemptsAllowed,
        questions,
        // questionCount - handled by hook
        duration,
        // totalMarks - handled by hook
        markingScheme,
        subject,
        examType,
        class: className,
        difficulty,
        createdBy,
        // PYQ fields
        year: testCategory === 'PYQ' ? year : undefined,
        month: testCategory === 'PYQ' ? month : undefined,
        day: testCategory === 'PYQ' ? day : undefined,
        session: testCategory === 'PYQ' ? session : undefined,
        // Platform fields
        platformTestType: testCategory === 'Platform' ? platformTestType : undefined,
        isPremium: testCategory === 'Platform' ? isPremium : undefined,
        syllabus: testCategory === 'Platform' ? syllabus : undefined,
        // UserCustom fields (can be added if needed, but often minimal for creation)
        // isPublic: testCategory === 'UserCustom' ? isPublic : undefined, 
        // generationCriteria: testCategory === 'UserCustom' ? generationCriteria : undefined,
    });

    // 5. Save Test (Hooks will run)
    const savedTest = await test.save();

    if (!savedTest) {
        throw new ApiError(500, "Failed to create the test");
    }

    console.log("Test created successfully:", savedTest._id);
    // 6. Return Response
    return res.status(201).json(
        new ApiResponse(201, savedTest, "Test created successfully")
    );
});

// --- Get Tests (Paginated & Filtered) --- 
const getTests = asyncHandler(async (req, res) => {
    console.log("Fetching tests with query:", req.query);
    const {
        page = 1,
        limit = 100, // Increased from 30 to 100 to fetch more tests
        sortBy = 'createdAt',
        sortOrder = 'desc',
        testCategory,
        status,
        subject,
        examType,
        class: className,
        difficulty,
        platformTestType,
        year, // For PYQ
        isPremium, // For Platform
        createdBy, // User ID
        tag, // Filter by a single tag
        fetchAll = "false" // New parameter to fetch all tests without pagination
        // Add more filters as needed
    } = req.query;

    // Build the aggregation pipeline
    const pipeline = [];

    // Match stage based on filters
    const matchStage = {};
    if (testCategory) matchStage.testCategory = testCategory;
    
    // For non-admin users, only show published tests
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    
    // If status is explicitly provided in the query and user is admin, use it
    if (status && isAdmin) {
        matchStage.status = status;
    } else if (isAdmin && !status) {
        // Admin can see all statuses if not specified
    } else {
        // Non-admin users or users without roles can only see published tests
        matchStage.status = 'published';
    }
    
    // Apply other filters only if they're provided
    if (subject) matchStage.subject = subject;
    if (examType) matchStage.examType = examType;
    if (className) matchStage.class = className;
    if (difficulty) matchStage.difficulty = difficulty;
    if (platformTestType && testCategory === 'Platform') matchStage.platformTestType = platformTestType;
    if (year && testCategory === 'PYQ') matchStage.year = parseInt(year, 10);
    if (isPremium !== undefined && testCategory === 'Platform') matchStage.isPremium = (isPremium === 'true');
    if (createdBy) matchStage.createdBy = new mongoose.Types.ObjectId(createdBy);
    if (tag) matchStage.tags = { $in: [tag] }; // Simple tag filter

    // Only add match stage if there are actual filters
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    // Sort stage
    const sortStage = {};
    sortStage[sortBy] = sortOrder === 'asc' ? 1 : -1;
    pipeline.push({ $sort: sortStage });

    // Create aggregate object
    const aggregate = Test.aggregate(pipeline);

    // Check if we should fetch all tests without pagination
    if (fetchAll === "true") {
        // Execute the aggregate without pagination
        const allTests = await aggregate.exec();
        
        console.log(`Retrieved ${allTests.length} tests (no pagination)`);
        return res.status(200).json(
            new ApiResponse(200, {
                docs: allTests,
                totalDocs: allTests.length,
                limit: allTests.length,
                page: 1,
                totalPages: 1,
                pagingCounter: 1,
                hasPrevPage: false,
                hasNextPage: false,
                prevPage: null,
                nextPage: null
            }, "All tests retrieved successfully")
        );
    }

    // Execute pagination with a higher limit
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    // Ensure we're using a large enough limit to get all tests
    const options = {
        page: pageNum,
        limit: limitNum, // Using the larger limit value
        allowDiskUse: true // Add this to handle large datasets
    };

    try {
        const result = await Test.aggregatePaginate(aggregate, options);
        // console.log("Pagination result:", result);

        if (!result) {
            throw new ApiError(500, "Failed to retrieve tests");
        }

        console.log(`Retrieved ${result.docs.length} tests out of ${result.totalDocs} total.`);
        
        // If we're missing tests, log a warning
        if (result.totalDocs < 31) {
            console.warn(`WARNING: Database has 31 tests but only ${result.totalDocs} counted. Check database consistency or aggregation pipeline.`);
        }
        
        return res.status(200).json(
            new ApiResponse(200, result, "Tests retrieved successfully")
        );
    } catch (error) {
        console.error("Error during test retrieval:", error);
        throw new ApiError(500, `Failed to retrieve tests: ${error.message}`);
    }
});

// --- Get Single Test By ID --- 
const getTestById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching test by ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Test ID format");
    }

    // Find test and populate creator info and revision history users
    const test = await Test.findById(id)
        .populate('createdBy', 'username email')
        .populate('lastModifiedBy', 'username email')
        .populate('revisionHistory.modifiedBy', 'username email');

    if (!test) {
        throw new ApiError(404, "Test not found");
    }

    // Add debugging information about the revision history population
    console.log(`Test ID: ${id} - Revision history length: ${test.revisionHistory?.length || 0}`);
    if (test.revisionHistory && test.revisionHistory.length > 0) {
        console.log(`First revision modifiedBy: ${JSON.stringify(test.revisionHistory[0].modifiedBy)}`);
        
        // If any revisions have unpopulated modifiedBy fields that are ObjectIds, populate them directly
        const unpopulatedRevisions = test.revisionHistory.filter(
            rev => rev.modifiedBy && typeof rev.modifiedBy === 'object' && !rev.modifiedBy.username
        );
        
        if (unpopulatedRevisions.length > 0) {
            console.log(`Found ${unpopulatedRevisions.length} revisions with unpopulated modifiedBy fields`);
        }
    }

    // Check user role for access control
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    console.log(`User role check: isAdmin=${isAdmin}, user role=${req.user?.role}, test status=${test.status}`);
    
    // Only apply status check for non-admin users
    if (!isAdmin && test.status !== 'published') {
        console.log(`Access denied: non-admin user trying to access ${test.status} test`);
        throw new ApiError(403, "You do not have permission to view this test");
    }

    console.log(`Found test: ${test.title} - Access granted`);
    return res.status(200).json(
        new ApiResponse(200, test, "Test retrieved successfully")
    );
});

// --- Update Test --- 
const updateTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    console.log(`Attempting to update test ID: ${id} with data:`, updateData);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Test ID format");
    }

    if (Object.keys(updateData).length === 0) {
        throw new ApiError(400, "No update data provided");
    }

    // Add specific debug logging for status updates
    if (updateData.status) {
        console.log(`Status update detected: Changing to '${updateData.status}'`);
        // Validate status against allowed values
        const validStatuses = ['draft', 'published', 'archived'];
        if (!validStatuses.includes(updateData.status)) {
            throw new ApiError(400, `Invalid status value: ${updateData.status}. Must be one of: ${validStatuses.join(', ')}`);
        }
    }

    // Fields that shouldn't be directly updated this way
    delete updateData.createdBy;
    delete updateData.testCategory; // Category shouldn't change
    delete updateData.revisionHistory; // Handled separately
    delete updateData.totalMarks; // Recalculated if questions change
    delete updateData.questionCount; // Recalculated if questions change

    let updatedTest;
    let requiresRecalculation = false;

    // Recalculate counts/marks if questions array is part of the update
    if (updateData.questions && Array.isArray(updateData.questions)) {
        requiresRecalculation = true;
        console.log("Questions array included in update, recalculating marks/count...");
        const questionList = updateData.questions;
        updateData.questionCount = questionList.length;

        if (questionList.length > 0) {
            const validQuestionIds = questionList.filter(qid => mongoose.Types.ObjectId.isValid(qid));
            if (validQuestionIds.length !== questionList.length) {
                throw new ApiError(400, "Update contains invalid question IDs");
            }
            const questionsData = await Question.find({ '_id': { $in: validQuestionIds } }).select('marks');
            updateData.totalMarks = questionsData.reduce((sum, q) => sum + (q.marks || 0), 0);
            console.log(`Recalculated total marks: ${updateData.totalMarks}`);
        } else {
            updateData.totalMarks = 0;
        }
    }

    // Prepare revision history entry
    const changesDescription = updateData.changesDescription || "Test details updated"; // Expect frontend to send a summary or create a diff
    
    // Remove it so it doesn't get saved to the test object
    delete updateData.changesDescription;
    
    // Ensure we have a valid user ID for the modifier
    if (!req.user || !req.user._id) {
        throw new ApiError(401, "User authentication required to update test");
    }

    const historyEntry = {
        modifiedBy: req.user._id,
        changesDescription: changesDescription,
        timestamp: new Date()
    };

    // Find current test to log before/after for status changes
    if (updateData.status) {
        const currentTest = await Test.findById(id);
        if (currentTest) {
            console.log(`Current status: '${currentTest.status}', Updating to: '${updateData.status}'`);
        }
    }

    // Find and update
    updatedTest = await Test.findByIdAndUpdate(
        id,
        {
            $set: {
                ...updateData,
                lastModifiedBy: req.user._id // Set the last modifier
            },
            $push: { revisionHistory: historyEntry } // Add revision log
        },
        {
            new: true, // Return the modified document
            runValidators: true // Ensure schema validations run
        }
    );

    if (!updatedTest) {
        throw new ApiError(404, "Test not found or failed to update");
    }

    // Additional logging for status updates to verify changes
    if (updateData.status) {
        console.log(`Status update result - New status: '${updatedTest.status}'`);
    }

    console.log(`Test ID: ${id} updated successfully.`);
    return res.status(200).json(
        new ApiResponse(200, updatedTest, "Test updated successfully")
    );
});

// --- Delete Test --- 
const deleteTest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`Attempting to delete test ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Test ID format");
    }

    const deletedTest = await Test.findByIdAndDelete(id);

    if (!deletedTest) {
        throw new ApiError(404, "Test not found or already deleted");
    }

    // TODO: Consider cleanup tasks? 
    // - Delete associated AttemptedTest records? (Or keep for history?)
    // - Remove test reference from user profiles/schedules?

    console.log(`Test ID: ${id} deleted successfully.`);
    return res.status(200).json(
        new ApiResponse(200, { deletedId: id }, "Test deleted successfully")
        // Or return 204 No Content: return res.status(204).send();
    );
});

// --- Get Test For Attempt --- 
const getTestForAttempt = asyncHandler(async (req, res) => {
    const { id } = req.params;
    console.log(`Fetching test for attempt: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Test ID format");
    }

    // Find test with detailed logging
    const test = await Test.findById(id);
    
    if (!test) {
        console.log(`Test not found with ID: ${id}`);
        throw new ApiError(404, "Test not found");
    }

    console.log(`Found test: "${test.title}" with ${test.questions?.length || 0} question IDs`);
    
    // Check if test is published
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'superadmin';
    if (!isAdmin && test.status !== 'published') {
        console.log(`Attempt rejected: Test status is ${test.status}, not published`);
        throw new ApiError(403, "This test is not available for attempt");
    }
    
    // Check if we have questions
    if (!test.questions || !Array.isArray(test.questions) || test.questions.length === 0) {
        console.log(`Test has no questions. Questions array:`, test.questions);
        throw new ApiError(500, "Test has no questions");
    }

    try {
        console.log("Looking up questions with the following IDs:", test.questions);
        
        // Fetch questions from the Question model with all required fields
        const questions = await Question.find({ 
            '_id': { $in: test.questions.map(qId => new mongoose.Types.ObjectId(qId.toString())) } 
        }).select('_id question options subject difficulty examType');
        
        console.log(`Found ${questions.length} questions from Question model out of ${test.questions.length} IDs`);
        
        if (questions.length === 0) {
            console.log("No questions found in the database matching the IDs in the test");
            throw new ApiError(500, "Failed to load test questions");
        }

        // Log one raw question to debug its structure
        if (questions.length > 0) {
            console.log("First raw question from database:", JSON.stringify(questions[0], null, 2));
        }

        // Format questions with careful property checking and error handling
        const formattedQuestions = questions.map((q, index) => {
            try {
                // Handle the complex structure of question and options with defensive programming
                const formattedQuestion = {
                    _id: q._id.toString(),
                    question: {
                        text: q.question && typeof q.question === 'object' && q.question.text 
                            ? q.question.text 
                            : "Question text unavailable",
                        image: q.question && typeof q.question === 'object' && q.question.image 
                            ? q.question.image 
                            : null
                    },
                    options: Array.isArray(q.options) 
                        ? q.options.map(option => ({
                            text: option && typeof option === 'object' && option.text 
                                ? option.text 
                                : "Option text unavailable",
                            image: option && typeof option === 'object' && option.image 
                                ? option.image 
                                : null
                        }))
                        : [], // Empty array as fallback
                    subject: q.subject || test.subject || "",
                    examType: q.examType || test.examType || "",
                    difficulty: q.difficulty || test.difficulty || "",
                    // Add frontend-specific fields
                    userAnswer: undefined,
                    isMarked: false,
                    timeTaken: 0,
                    isVisited: false
                };
                
                return formattedQuestion;
            } catch (err) {
                console.error(`Error formatting question ${index}:`, err);
                // Return a placeholder question instead of failing
                return {
                    _id: q._id ? q._id.toString() : `error-question-${index}`,
                    question: {
                        text: "Error: Could not format question properly",
                        image: null
                    },
                    options: [],
                    subject: test.subject || "",
                    examType: test.examType || "",
                    difficulty: test.difficulty || "",
                    userAnswer: undefined,
                    isMarked: false,
                    timeTaken: 0,
                    isVisited: false
                };
            }
        });

        // Log the first formatted question
        if (formattedQuestions.length > 0) {
            console.log("First formatted question:", JSON.stringify(formattedQuestions[0], null, 2));
        }

        // Prepare the sanitized test object with metadata
        const sanitizedTest = {
            _id: test._id,
            title: test.title,
            description: test.description || "",
            subject: test.subject,
            examType: test.examType,
            difficulty: test.difficulty,
            duration: test.duration,
            totalQuestions: formattedQuestions.length,
            time: test.duration,
            markingScheme: test.markingScheme || {
                correct: 1,
                incorrect: 0,
                unattempted: 0
            },
            year: test.year,
            platformTestType: test.platformTestType,
            session: test.session || "",
            questions: formattedQuestions
        };

        // Log summary of response data
        console.log("=== TEST API RESPONSE SUMMARY ===");
        console.log(`Test ID: ${sanitizedTest._id}`);
        console.log(`Title: ${sanitizedTest.title}`);
        console.log(`Total Questions: ${sanitizedTest.totalQuestions}`);
        console.log(`Successfully formatted ${formattedQuestions.length} questions`);
        console.log("=== END TEST API RESPONSE SUMMARY ===");

        return res.status(200).json(
            new ApiResponse(200, sanitizedTest, "Test retrieved successfully for attempt")
        );
    } catch (error) {
        console.error("Error processing test questions:", error);
        throw new ApiError(500, `Failed to process test questions: ${error.message}`);
    }
});

export {
    createTest,
    getTests,
    getTestById,
    updateTest,
    deleteTest,
    getTestForAttempt
}; 