import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Question } from "../models/question.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { v2 as cloudinary } from 'cloudinary';
import { ApiResponse } from "../utils/ApiResponse.js";
import fs from "fs";
import path from "path";

// Helper function to delete image from cloudinary
const deleteFromCloudinary = async (publicId) => {
    if (!publicId) return;
    try {
        await cloudinary.uploader.destroy(publicId);
    } catch (error) {
        console.error("Error deleting image from Cloudinary:", error);
    }
};

// Helper function to handle image upload
const handleImageUpload = async (file) => {
    if (!file) return null;
    
    try {
        // Get file path from multer
        const filePath = file.path;
        
        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error("File does not exist at path:", filePath);
            return null;
        }
        
        // Upload file to cloudinary
        const result = await uploadOnCloudinary(filePath);
        
        // Note: The uploaded file is deleted by uploadOnCloudinary function
        // so we don't need to delete it here again
        
        // Return cloudinary result
        return result ? {
            url: result.url,
            publicId: result.public_id
        } : null;
    } catch (error) {
        console.error("Error in handleImageUpload:", error);
        // Try to clean up the file if it exists
        try {
            if (file.path && fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
            }
        } catch (cleanupError) {
            console.error("Error cleaning up file:", cleanupError);
        }
        return null;
    }
};

// Helper function to clean up old images
const cleanupOldImages = async (images) => {
    if (!images) return;
    
    try {
        if (Array.isArray(images)) {
            // Handle array of images - filter out null values before processing
            const validImages = images.filter(img => img && img.publicId);
            if (validImages.length > 0) {
                await Promise.all(validImages.map(img => deleteFromCloudinary(img.publicId)));
            }
        } else if (images.publicId) {
            // Handle single image
            await deleteFromCloudinary(images.publicId);
        }
    } catch (error) {
        console.error("Error during image cleanup:", error);
        // Don't throw error to allow continued processing
    }
};

// Helper function to track changes
const trackChanges = (oldQuestion, newData) => {
    const changes = [];
    
    // Track question content changes
    if (newData.questionText !== undefined && newData.questionText !== oldQuestion.question.text) {
        changes.push('Question text updated');
    }
    if (newData.questionImage) {
        changes.push('Question image updated');
    }
    if (newData.solutionText !== undefined && newData.solutionText !== oldQuestion.solution.text) {
        changes.push('Solution text updated');
    }
    if (newData.marks !== undefined && newData.marks !== oldQuestion.marks) {
        changes.push(`Marks changed from ${oldQuestion.marks} to ${newData.marks}`);
    }
    if (newData.difficulty !== undefined && newData.difficulty !== oldQuestion.difficulty) {
        changes.push(`Difficulty changed from ${oldQuestion.difficulty} to ${newData.difficulty}`);
    }
    if (newData.options) {
        changes.push('Options modified');
    }
    if (newData.correctOptions) {
        changes.push('Correct options modified');
    }

    // Track image changes
    if (newData.solutionImage) changes.push('Solution image updated');
    if (newData.optionImages) changes.push('Option images updated');

    return changes.join(', ');
};

const uploadQuestion = asyncHandler(async (req, res) => {
    // Add validation for new required fields
    const requiredFields = [
        'questionType', 'subject', 'chapter', 'examType', 
        'difficulty', 'marks', 'language', 'languageLevel',
        'class', 'questionCategory', 'questionSource' // Added new required fields
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Initialize image variables at the top (outside try block)
    let questionImage = {
        url: "",
        publicId: ""
    };
    let solutionImage = {
        url: "",
        publicId: ""
    };
    let optionImages = [];
    let optionImagesObj = {};
    let questionData = null;

    try {
        // Handle image uploads only if files are present
        if (req.files?.questionImage) {
            const uploadedImage = await handleImageUpload(req.files.questionImage[0]);
            if (uploadedImage) {
                questionImage = uploadedImage;
            }
        }

        if (req.files?.solutionImage) {
            const uploadedImage = await handleImageUpload(req.files.solutionImage[0]);
            if (uploadedImage) {
                solutionImage = uploadedImage;
            }
        }

        // Parse options and correctOptions if they are strings
        let options = [];
        let correctOptions = [];
        
        if (req.body.options) {
            try {
                // If options is sent as a string, parse it
                options = typeof req.body.options === 'string' 
                    ? JSON.parse(req.body.options) 
                    : req.body.options;
            } catch (error) {
                throw new ApiError(400, "Invalid options format. Must be a valid JSON array");
            }
        }

        if (req.body.correctOptions) {
            try {
                // If correctOptions is sent as a string, parse it
                correctOptions = typeof req.body.correctOptions === 'string'
                    ? JSON.parse(req.body.correctOptions)
                    : req.body.correctOptions;
            } catch (error) {
                throw new ApiError(400, "Invalid correctOptions format. Must be a valid JSON array");
            }
        }

        // Validate options array for non-numerical questions
        if (req.body.questionType !== 'numerical') {
            if (!Array.isArray(options) || options.length !== 4) {
                throw new ApiError(400, "Options must be an array with exactly 4 items");
            }
            if (!Array.isArray(correctOptions) || correctOptions.length === 0) {
                throw new ApiError(400, "CorrectOptions must be a non-empty array");
            }
        }

        // Handle image uploads
        if (req.files?.optionImages) {
            optionImages = await Promise.all(
                req.files.optionImages.map(file => handleImageUpload(file))
            );
        }

        // Prepare question data with default empty image objects
        questionData = {
            author: req.user._id,
            question: {
                text: req.body.questionText || "",
                image: questionImage // This will be empty object if no image
            },
            questionType: req.body.questionType,
            subject: req.body.subject,
            chapter: req.body.chapter,
            examType: req.body.examType,
            class: req.body.class,
            difficulty: req.body.difficulty,
            marks: req.body.marks,
            negativeMarks: req.body.negativeMarks || 0,
            sectionPhysics: req.body.sectionPhysics,
            sectionChemistry: req.body.sectionChemistry,
            sectionMathematics: req.body.sectionMathematics,
            solution: {
                text: req.body.solutionText || "",
                image: solutionImage // This will be empty object if no image
            },
            language: req.body.language,
            languageLevel: req.body.languageLevel,
            questionCategory: req.body.questionCategory || 'theoretical',
            questionSource: req.body.questionSource || 'custom',
            section: req.body.section,
            commonMistakes: req.body.commonMistakes ? JSON.parse(req.body.commonMistakes) : [],
            prerequisites: req.body.prerequisites ? JSON.parse(req.body.prerequisites) : [],
            conceptualDifficulty: parseInt(req.body.conceptualDifficulty) || 5,
            year: req.body.year || "not applicable"
        };

        // Add validation for PYQ questions
        if (questionData.questionSource === 'pyq' && questionData.year === "not applicable") {
            throw new ApiError(400, "Year must be specified for previous year questions");
        }

        // Add validation for section based on subject
        if (['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology'].includes(questionData.subject?.toLowerCase()) && !questionData.section) {
            throw new ApiError(400, `Section is required for ${questionData.subject} subject`);
        }

        // Handle numerical question specific data
        if (req.body.questionType === 'numerical') {
            questionData.numericalAnswer = {
                exactValue: parseFloat(req.body.exactValue),
                range: {
                    min: parseFloat(req.body.rangeMin),
                    max: parseFloat(req.body.rangeMax)
                },
                unit: req.body.unit || ""
            };
        } else {
            // Process individual option images
            optionImagesObj = {};
            for (let i = 0; i < 4; i++) {
                const fieldName = `option${i}Image`;
                if (req.files && req.files[fieldName] && req.files[fieldName][0]) {
                    const uploadedImage = await handleImageUpload(req.files[fieldName][0]);
                    if (uploadedImage) {
                        optionImagesObj[i] = uploadedImage;
                    }
                }
            }

            // For non-numerical questions, add options with images
            questionData.options = options.map((option, index) => ({
                text: option,
                image: optionImagesObj[index] || { url: "", publicId: "" }
            }));
            questionData.correctOptions = correctOptions;
        }

        // Process individual hint fields
        let hintsData = [];
        for (let i = 0; i < 3; i++) {
            const textFieldName = `hint${i}Text`;
            const imageFieldName = `hint${i}Image`;
            
            const hintText = req.body[textFieldName] || "";
            let hintImage = { url: "", publicId: "" };
            
            if (req.files && req.files[imageFieldName] && req.files[imageFieldName][0]) {
                const uploadedImage = await handleImageUpload(req.files[imageFieldName][0]);
                if (uploadedImage) {
                    hintImage = uploadedImage;
                }
            }
            
            // Only add hint if text or image is provided
            if (hintText || hintImage.url) {
                hintsData.push({
                    text: hintText,
                    image: hintImage
                });
            }
        }

        // Add hints to questionData if any exist
        if (hintsData.length > 0) {
            questionData.hints = hintsData;
        }

        // Validate that at least text or image is provided
        if (!questionData.question.text.trim() && !questionData.question.image.url) {
            throw new ApiError(400, "Question must have either text or image content");
        }

        // Add tags if provided
        if (req.body.tags) {
            try {
                questionData.tags = typeof req.body.tags === 'string' 
                    ? JSON.parse(req.body.tags) 
                    : req.body.tags;
            } catch (error) {
                throw new ApiError(400, "Invalid tags format. Must be a valid JSON array");
            }
        }

        const newQuestion = await Question.create(questionData);
        return res.status(201).json(
            new ApiResponse(201, newQuestion, "Question created successfully")
        );

    } catch (error) {
        // Keep track of cleanup attempts
        const cleanupErrors = [];
        
        // Cleanup only if images were actually uploaded
        try {
            if (questionImage?.publicId) {
                await cleanupOldImages(questionImage);
            }
        } catch (cleanupError) {
            cleanupErrors.push(`Failed to cleanup question image: ${cleanupError.message}`);
        }
        
        try {
            if (solutionImage?.publicId) {
                await cleanupOldImages(solutionImage);
            }
        } catch (cleanupError) {
            cleanupErrors.push(`Failed to cleanup solution image: ${cleanupError.message}`);
        }
        
        // Cleanup option images
        try {
            if (optionImagesObj) {
                for (const key in optionImagesObj) {
                    if (optionImagesObj[key]?.publicId) {
                        await cleanupOldImages(optionImagesObj[key]);
                    }
                }
            }
        } catch (cleanupError) {
            cleanupErrors.push(`Failed to cleanup option images: ${cleanupError.message}`);
        }
        
        // Cleanup hint images from hintsData if available
        try {
            if (questionData?.hints) {
                for (const hint of questionData.hints) {
                    if (hint.image?.publicId) {
                        await cleanupOldImages(hint.image);
                    }
                }
            }
        } catch (cleanupError) {
            cleanupErrors.push(`Failed to cleanup hint images: ${cleanupError.message}`);
        }
        
        // Log any cleanup errors for debugging
        if (cleanupErrors.length > 0) {
            console.error("Cleanup errors during question upload:", cleanupErrors);
        }
        console.log("Question data:", questionData);
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(500, `Error creating question: ${error.message}`);
    }
});

const getQuestions = asyncHandler(async (req, res) => {
    // === DEBUG LOGGING START ===
    console.log(`\n--- DEBUG: GET /questions Request ---`);
    console.log(`User making request:`, req.user?.email, `(Role: ${req.user?.role})`);
    console.log(`Query parameters:`, req.query);
    // === DEBUG LOGGING END ===
    
    const {
        examType,
        subject,
        difficulty,
        chapter,
        language,
        questionType,
        verified,
        isActive,
        class: classValue,
        questionCategory,
        questionSource,
        section,
        year,
        page = 1,
        limit = 30,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    // Parse page and limit to integers
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build filter object - only add isActive if explicitly provided
    const filter = {};
    
    if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
    }
    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (chapter) filter.chapter = chapter;
    if (language) filter.language = language;
    if (questionType) filter.questionType = questionType;
    if (verified !== undefined) filter.isVerified = verified === 'true';
    if (classValue) filter.class = classValue;
    if (questionCategory) filter.questionCategory = questionCategory;
    if (questionSource) filter.questionSource = questionSource;
    if (section) filter.section = section;
    if (year && year !== 'not applicable') filter.year = year;

    try {
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // First get total count
        const totalQuestions = await Question.countDocuments(filter);

        // Then get paginated questions with populated author field
        const questions = await Question.find(filter)
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate('author', 'username email')
            .lean();
        
        // === DEBUG LOGGING START ===
        console.log(`Found ${totalQuestions} total questions matching filter.`);
        console.log(`Returning ${questions.length} questions for page ${pageNum}.`);
        console.log(`--- DEBUG: End GET /questions Request ---\n`);
        // === DEBUG LOGGING END ===

        return res.status(200).json(
            new ApiResponse(200, {
                questions,
                totalQuestions,
                currentPage: pageNum,
                totalPages: Math.ceil(totalQuestions / limitNum)
            }, "Questions retrieved successfully")
        );
    } catch (error) {
        console.error("❌ Error in getQuestions:", error); // Log the specific error
        throw new ApiError(500, `Error fetching questions: ${error.message}`);
    }
});

const getQuestionById = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id)
        .populate('author', 'name email')
        .populate('verifiedBy', 'name email')
        .populate('lastModifiedBy', 'name email');

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    return res.status(200).json(
        new ApiResponse(200, question, "Question retrieved successfully")
    );
});

const updateQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    try {
        const questionData = JSON.parse(req.body.data);
        
        // Validate PYQ requirements
        if (questionData.questionSource === 'pyq' && questionData.year === 'not applicable') {
            throw new ApiError(400, "Year must be specified for previous year questions");
        }

        // Validate section requirement
        if (['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology'].includes(questionData.subject?.toLowerCase()) && !questionData.section) {
            throw new ApiError(400, `Section is required for ${questionData.subject} subject`);
        }

        // Ensure questionCategory is consistent with questionType
        if (questionData.questionType === 'numerical') {
            questionData.questionCategory = 'numerical';
        }

        // Create a snapshot of the original question
        const originalQuestion = question.toObject();
        let imageChanges = false;

        // Handle question image update
        if (req.files?.questionImage) {
            const newImage = await handleImageUpload(req.files.questionImage[0]);
            if (newImage) {
                // Clean up old image if it exists
                if (question.question.image?.publicId) {
                    await cleanupOldImages({
                        publicId: question.question.image.publicId
                    });
                }
                questionData.question.image = {
                    url: newImage.url,
                    publicId: newImage.publicId
                };
                imageChanges = true;
            }
        }

        // Handle solution image update
        if (req.files?.solutionImage) {
            const newImage = await handleImageUpload(req.files.solutionImage[0]);
            if (newImage) {
                await cleanupOldImages(question.solution.image);
                questionData.solution.image = newImage;
                imageChanges = true;
            }
        }

        // Handle option images update
        if (req.files?.optionImages) {
            const optionImageIndexes = req.body.optionImageIndexes
                ? Array.isArray(req.body.optionImageIndexes) 
                    ? req.body.optionImageIndexes 
                    : [req.body.optionImageIndexes]
                : [];
            
            const optionImages = Array.isArray(req.files.optionImages) 
                ? req.files.optionImages 
                : [req.files.optionImages];

            for (let i = 0; i < optionImages.length; i++) {
                const index = parseInt(optionImageIndexes[i]);
                const newImage = await handleImageUpload(optionImages[i]);
                
                if (newImage && questionData.options[index]) {
                    // Clean up old image if it exists
                    if (question.options[index]?.image?.publicId) {
                        await cleanupOldImages(question.options[index].image);
                    }
                    questionData.options[index].image = newImage;
                    imageChanges = true;
                }
            }
        }

        // Handle hint images update
        if (req.files?.hintImages) {
            const hintImageIndexes = req.body.hintImageIndexes
                ? Array.isArray(req.body.hintImageIndexes)
                    ? req.body.hintImageIndexes
                    : [req.body.hintImageIndexes]
                : [];
            
            const hintImages = Array.isArray(req.files.hintImages)
                ? req.files.hintImages
                : [req.files.hintImages];

            for (let i = 0; i < hintImages.length; i++) {
                const index = parseInt(hintImageIndexes[i]);
                const newImage = await handleImageUpload(hintImages[i]);
                
                if (newImage && questionData.hints[index]) {
                    // Clean up old image if it exists
                    if (question.hints[index]?.image?.publicId) {
                        await cleanupOldImages(question.hints[index].image);
                    }
                    questionData.hints[index].image = newImage;
                    imageChanges = true;
                }
            }
        }

        // Validate that question still has either text or image
        if (!questionData.question.text?.trim() && !questionData.question.image?.url) {
            throw new ApiError(400, "Question must have either text or image content");
        }

        // Update all fields from questionData
        Object.keys(questionData).forEach(key => {
            if (questionData[key] !== undefined) {
                question[key] = questionData[key];
            }
        });

        // Track changes
        const changes = trackChanges(originalQuestion, questionData);

        // Update metadata and revision history only if there are actual changes
        if (changes || imageChanges) {
            question.lastModifiedBy = req.user._id;
            question.revisionHistory.push({
                version: question.revisionHistory.length + 1,
                modifiedBy: req.user._id,
                changes: changes || 'Image updates only',
                timestamp: new Date()
            });
        }
        console.log("Question data after update:", questionData);
        const updatedQuestion = await question.save();
        return res.status(200).json(
            new ApiResponse(200, updatedQuestion, "Question updated successfully")
        );

    } catch (error) {
        throw new ApiError(500, "Error updating question: " + error.message);
    }
});

const deleteQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    try {
        // Delete all associated images
        await cleanupOldImages(question.question.image);
        await cleanupOldImages(question.solution.image);
        await cleanupOldImages(question.options.map(opt => opt.image));

        await Question.findByIdAndDelete(req.params.id);

        return res.status(200).json(
            new ApiResponse(200, null, "Question and associated images deleted successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error deleting question: " + error.message);
    }
});

const verifyQuestion = asyncHandler(async (req, res) => {
    const question = await Question.findById(req.params.id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    if (!question.isComplete()) {
        throw new ApiError(400, "Question is incomplete and cannot be verified");
    }

    question.isVerified = true;
    question.verifiedBy = req.user._id;
    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, "Question verified successfully")
    );
});

// Add feedback to a question
const addFeedback = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { type, description } = req.body;

    if (!['error', 'clarity', 'difficulty', 'other'].includes(type)) {
        throw new ApiError(400, "Invalid feedback type");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    // Handle image upload if present
    let imageData = { url: "", publicId: "" };
    if (req.files?.image) {
        const uploadedImage = await handleImageUpload(req.files.image[0]);
        if (uploadedImage) {
            imageData = uploadedImage;
        }
    }

    question.feedback.studentReports.push({
        type,
        description: {
            text: description?.text || "",
            image: imageData
        },
        reportedBy: req.user._id,
        timestamp: {
            created: new Date(),
            lastModified: new Date()
        },
        status: 'pending'
    });

    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, "Feedback added successfully")
    );
});

// Add teacher note to a question
const addTeacherNote = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;

    if (!note?.text?.trim() && !req.files?.image) {
        throw new ApiError(400, "Note must have either text or image content");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    // Handle image upload if present
    let imageData = { url: "", publicId: "" };
    if (req.files?.image) {
        const uploadedImage = await handleImageUpload(req.files.image[0]);
        if (uploadedImage) {
            imageData = uploadedImage;
        }
    }

    question.feedback.teacherNotes.push({
        note: {
            text: note?.text || "",
            image: imageData
        },
        addedBy: req.user._id,
        timestamp: {
            created: new Date(),
            lastModified: new Date()
        }
    });

    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, "Teacher note added successfully")
    );
});

// Update question statistics after attempt
const updateQuestionStats = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isCorrect, timeTaken } = req.body;

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    await question.updateStatistics(isCorrect, timeTaken);

    return res.status(200).json(
        new ApiResponse(200, question, "Statistics updated successfully")
    );
});

// Get similar questions
const getSimilarQuestions = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const similarQuestions = await Question.findSimilarQuestions(id);
    if (!similarQuestions) {
        throw new ApiError(404, "No similar questions found");
    }

    return res.status(200).json(
        new ApiResponse(200, similarQuestions, "Similar questions retrieved successfully")
    );
});

// Bulk upload questions
const bulkUploadQuestions = asyncHandler(async (req, res) => {
    if (!req.body.questions || !Array.isArray(req.body.questions)) {
        throw new ApiError(400, "Invalid questions data");
    }

    const questions = req.body.questions.map(q => ({
        ...q,
        author: req.user._id
    }));

    const savedQuestions = await Question.insertMany(questions, { 
        validateBeforeSave: true 
    });

    return res.status(201).json(
        new ApiResponse(201, savedQuestions, "Questions uploaded successfully")
    );
});

// Get questions by filters (advanced)
const getQuestionsByFilters = asyncHandler(async (req, res) => {
    const {
        examType,
        subject,
        difficulty,
        tags,
        isVerified,
        language,
        class: classValue,
        dateRange,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const filter = {};
    const dateFilter = {};

    if (examType) filter.examType = examType;
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
    if (language) filter.language = language;
    if (classValue) filter.class = classValue;
    
    if (dateRange) {
        const [start, end] = dateRange.split(',');
        if (start && end) {
            dateFilter.createdAt = {
                $gte: new Date(start),
                $lte: new Date(end)
            };
        }
    }

    const questions = await Question.aggregate([
        { $match: { ...filter, ...dateFilter } },
        { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
        {
            $facet: {
                metadata: [
                    { $count: "total" },
                    {
                        $addFields: {
                            page: parseInt(page),
                            totalPages: {
                                $ceil: {
                                    $divide: ["$total", parseInt(limit)]
                                }
                            }
                        }
                    }
                ],
                data: [
                    { $skip: (parseInt(page) - 1) * parseInt(limit) },
                    { $limit: parseInt(limit) }
                ]
            }
        }
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            questions: questions[0].data,
            metadata: questions[0].metadata[0]
        }, "Questions retrieved successfully")
    );
});

const getQuestionsBySubject = asyncHandler(async (req, res) => {
    const { subject } = req.params;
    const { difficulty, chapter, class: classValue, page = 1, limit = 10 } = req.query;

    const filter = { subject };
    if (difficulty) filter.difficulty = difficulty;
    if (chapter) filter.chapter = chapter;
    if (classValue) filter.class = classValue;

    const questions = await Question.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name')
        .populate('verifiedBy', 'name');

    const total = await Question.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

const getQuestionsByExamType = asyncHandler(async (req, res) => {
    const { examType } = req.params;
    const { subject, difficulty, class: classValue, page = 1, limit = 10 } = req.query;

    const filter = { examType };
    if (subject) filter.subject = subject;
    if (difficulty) filter.difficulty = difficulty;
    if (classValue) filter.class = classValue;

    const questions = await Question.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name')
        .populate('verifiedBy', 'name');

    const total = await Question.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Handle feedback status updates
const updateFeedbackStatus = asyncHandler(async (req, res) => {
    const { id, reportId } = req.params;
    const { status } = req.body;

    if (!['pending', 'reviewed', 'resolved'].includes(status)) {
        throw new ApiError(400, "Invalid feedback status");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    const report = question.feedback.studentReports.id(reportId);
    if (!report) {
        throw new ApiError(404, "Feedback report not found");
    }

    report.status = status;
    report.timestamp.lastModified = new Date();
    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, "Feedback status updated successfully")
    );
});

// Get question revision history
const getQuestionRevisionHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await Question.findById(id)
        .select('revisionHistory')
        .populate('revisionHistory.modifiedBy', 'name email');

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    return res.status(200).json(
        new ApiResponse(200, question.revisionHistory, "Revision history retrieved successfully")
    );
});

// Get question statistics
const getQuestionStatistics = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await Question.findById(id)
        .select('statistics');

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    const stats = {
        ...question.statistics.toObject(),
        totalAttempts: question.totalAttempts,
        successPercentage: question.successPercentage
    };

    return res.status(200).json(
        new ApiResponse(200, stats, "Question statistics retrieved successfully")
    );
});

// Check if a numerical answer is correct
const checkNumericalAnswer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { submittedAnswer } = req.body;

    if (typeof submittedAnswer !== 'number') {
        throw new ApiError(400, "Submitted answer must be a number");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    if (question.questionType !== 'numerical') {
        throw new ApiError(400, "This endpoint is only for numerical questions");
    }

    const isCorrect = question.validateNumericalAnswer(submittedAnswer);

    return res.status(200).json(
        new ApiResponse(200, { isCorrect }, "Answer checked successfully")
    );
});

// Duplicate a question (useful for creating variants)
const duplicateQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const originalQuestion = await Question.findById(id);
    if (!originalQuestion) {
        throw new ApiError(404, "Question not found");
    }

    const questionData = originalQuestion.toObject();
    
    // Remove fields that should be unique/reset for the new question
    delete questionData._id;
    delete questionData.isVerified;
    delete questionData.verifiedBy;
    delete questionData.statistics;
    delete questionData.feedback;
    delete questionData.revisionHistory;
    delete questionData.createdAt;
    delete questionData.updatedAt;

    // Set the new author
    questionData.author = req.user._id;

    const newQuestion = await Question.create(questionData);

    return res.status(201).json(
        new ApiResponse(201, newQuestion, "Question duplicated successfully")
    );
});

// New method to check if a question is eligible for publishing
const checkPublishEligibility = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    const isEligible = question.isEligibleForPublishing();
    const reasons = [];

    if (!question.isVerified) reasons.push("Question is not verified");
    if (!question.solution.text.trim() && !question.solution.image.url) reasons.push("Solution is missing");
    if (!(question.marks > 0)) reasons.push("Marks should be greater than 0");

    return res.status(200).json(
        new ApiResponse(200, {
            isEligible,
            reasons: isEligible ? [] : reasons
        }, "Eligibility check completed")
    );
});

// New method to get questions by prerequisites
const getQuestionsByPrerequisites = asyncHandler(async (req, res) => {
    const { prerequisites } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (!prerequisites) {
        throw new ApiError(400, "Prerequisites are required");
    }

    const prereqArray = prerequisites.split(',').map(p => p.trim());
    
    const questions = await Question.find({
        prerequisites: { $in: prereqArray }
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'name')
    .select('-correctOptions -solution'); // Hide answers

    const total = await Question.countDocuments({
        prerequisites: { $in: prereqArray }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// New method to get questions by conceptual difficulty range
const getQuestionsByConceptualDifficulty = asyncHandler(async (req, res) => {
    const { min = 1, max = 10 } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const questions = await Question.find({
        conceptualDifficulty: {
            $gte: parseInt(min),
            $lte: parseInt(max)
        }
    })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('author', 'name');

    const total = await Question.countDocuments({
        conceptualDifficulty: {
            $gte: parseInt(min),
            $lte: parseInt(max)
        }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Add this to handle bulk image cleanup for bulk delete operations
const bulkDeleteQuestions = asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        throw new ApiError(400, "Invalid question IDs");
    }

    try {
        const questions = await Question.find({ _id: { $in: ids } });
        
        // Delete all associated images
        await Promise.all(questions.flatMap(question => [
            cleanupOldImages(question.question.image),
            cleanupOldImages(question.solution.image),
            ...question.options.map(opt => cleanupOldImages(opt.image))
        ]));

        await Question.deleteMany({ _id: { $in: ids } });

        return res.status(200).json(
            new ApiResponse(200, null, `Successfully deleted ${ids.length} questions`)
        );
    } catch (error) {
        throw new ApiError(500, "Error in bulk delete: " + error.message);
    }
});

// Get questions by tag
const getQuestionsByTag = asyncHandler(async (req, res) => {
    const { tag } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const questions = await Question.find({ tags: tag })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name')
        .select('-correctOptions'); // Hide answers for security

    const total = await Question.countDocuments({ tags: tag });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Update question hints
const updateQuestionHints = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { hints } = req.body;

    if (!Array.isArray(hints) || hints.length > 3) {
        throw new ApiError(400, "Invalid hints format or too many hints (max 3)");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    // Handle hint images if present
    const updatedHints = await Promise.all(hints.map(async hint => {
        if (hint.image) {
            const newImage = await handleImageUpload(hint.image);
            return {
                text: hint.text,
                image: newImage || {}
            };
        }
        return hint;
    }));

    question.hints = updatedHints;
    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, "Hints updated successfully")
    );
});

// Get questions by language level
const getQuestionsByLanguageLevel = asyncHandler(async (req, res) => {
    const { level } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!['basic', 'intermediate', 'advanced'].includes(level)) {
        throw new ApiError(400, "Invalid language level");
    }

    const questions = await Question.find({ languageLevel: level })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name');

    const total = await Question.countDocuments({ languageLevel: level });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Get questions by year
const getQuestionsByYear = asyncHandler(async (req, res) => {
    const { year } = req.params;
    const { examType, page = 1, limit = 10 } = req.query;

    const filter = { year };
    if (examType) filter.examType = examType;

    const questions = await Question.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name');

    const total = await Question.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Get questions with common mistakes
const getQuestionsWithCommonMistakes = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;

    const questions = await Question.find({
        'commonMistakes.0': { $exists: true } // At least one common mistake exists
    })
        .skip((page - 1) * limit)
        .limit(limit)
        .select('question commonMistakes statistics')
        .populate('author', 'name');

    const total = await Question.countDocuments({
        'commonMistakes.0': { $exists: true }
    });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions with common mistakes retrieved successfully")
    );
});

// Update common mistakes
const updateCommonMistakes = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { commonMistakes } = req.body;

    if (!Array.isArray(commonMistakes)) {
        throw new ApiError(400, "Common mistakes must be an array");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    question.commonMistakes = commonMistakes;
    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, "Common mistakes updated successfully")
    );
});

// Add a new controller to get detailed change history
const getDetailedChangeHistory = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const question = await Question.findById(id)
        .select('revisionHistory')
        .populate('revisionHistory.modifiedBy', 'name email')
        .populate('lastModifiedBy', 'name email');

    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    const history = {
        revisions: question.revisionHistory,
        lastModified: {
            by: question.lastModifiedBy,
            at: question.updatedAt
        },
        totalRevisions: question.revisionHistory.length
    };

    return res.status(200).json(
        new ApiResponse(200, history, "Change history retrieved successfully")
    );
});

// Add a new controller to revert to a previous version
const revertToVersion = asyncHandler(async (req, res) => {
    const { id, version } = req.params;

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    const targetVersion = question.revisionHistory.find(rev => rev.version === parseInt(version));
    if (!targetVersion) {
        throw new ApiError(404, "Version not found");
    }

    // Add reversion record to history
    question.revisionHistory.push({
        version: question.revisionHistory.length + 1,
        modifiedBy: req.user._id,
        changes: `Reverted to version ${version}`,
        timestamp: new Date()
    });

    question.lastModifiedBy = req.user._id;
    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, `Successfully reverted to version ${version}`)
    );
});

const toggleQuestionStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    question.isActive = isActive;
    question.lastModifiedBy = req.user._id;
    
    // Add to revision history
    question.revisionHistory.push({
        version: question.revisionHistory.length + 1,
        modifiedBy: req.user._id,
        changes: `Question ${isActive ? 'activated' : 'deactivated'}`,
        timestamp: new Date()
    });

    await question.save();

    return res.status(200).json(
        new ApiResponse(200, question, `Question ${isActive ? 'activated' : 'deactivated'} successfully`)
    );
});

// Add this new controller for permanent deletion
const permanentlyDeleteQuestion = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { confirmDelete } = req.body;

    if (!confirmDelete) {
        throw new ApiError(400, "Confirmation required for permanent deletion");
    }

    const question = await Question.findById(id);
    if (!question) {
        throw new ApiError(404, "Question not found");
    }

    try {
        // Delete all associated images from cloudinary
        await cleanupOldImages(question.question.image);
        await cleanupOldImages(question.solution.image);
        await cleanupOldImages(question.options.map(opt => opt.image));
        
        // If there are hint images, clean those up too
        if (question.hints?.length) {
            await Promise.all(question.hints.map(hint => 
                cleanupOldImages(hint.image)
            ));
        }

        // Permanently delete the question from database
        await Question.findByIdAndDelete(id);

        return res.status(200).json(
            new ApiResponse(
                200, 
                null, 
                "Question and all associated content permanently deleted"
            )
        );
    } catch (error) {
        throw new ApiError(
            500, 
            "Error permanently deleting question: " + error.message
        );
    }
});

// Get questions by class
const getQuestionsByClass = asyncHandler(async (req, res) => {
    const { classValue } = req.params;
    const { subject, examType, difficulty, page = 1, limit = 10 } = req.query;

    const filter = { class: classValue };
    if (subject) filter.subject = subject;
    if (examType) filter.examType = examType;
    if (difficulty) filter.difficulty = difficulty;

    const questions = await Question.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name')
        .populate('verifiedBy', 'name');

    const total = await Question.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Add this method to update the findByDifficultyAndExam usage with class filter
const getQuestionsByDifficultyAndExam = asyncHandler(async (req, res) => {
    const { difficulty, examType } = req.params;
    const { class: classValue, page = 1, limit = 10 } = req.query;

    try {
        let query = { difficulty, examType };
        if (classValue) query.class = classValue;

        const questions = await Question.find(query)
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit))
            .populate('author', 'name');

        const total = await Question.countDocuments(query);

        return res.status(200).json(
            new ApiResponse(200, {
                questions,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit))
            }, "Questions retrieved successfully")
        );
    } catch (error) {
        throw new ApiError(500, "Error fetching questions: " + error.message);
    }
});

// Add new controller for getting questions by section
const getQuestionsBySection = asyncHandler(async (req, res) => {
    const { subject, section } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const questions = await Question.find({ 
        subject, 
        section,
        isActive: true 
    })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name');

    const total = await Question.countDocuments({ subject, section, isActive: true });

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

// Add new controller for getting questions by source
const getQuestionsBySource = asyncHandler(async (req, res) => {
    const { source } = req.params;
    const { year, examType, page = 1, limit = 10 } = req.query;

    const filter = { questionSource: source };
    if (year) filter.year = year;
    if (examType) filter.examType = examType;

    const questions = await Question.find(filter)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('author', 'name');

    const total = await Question.countDocuments(filter);

    return res.status(200).json(
        new ApiResponse(200, {
            questions,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit)
        }, "Questions retrieved successfully")
    );
});

export {
    uploadQuestion,
    getQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
    verifyQuestion,
    addFeedback,
    addTeacherNote,
    updateQuestionStats,
    getSimilarQuestions,
    bulkUploadQuestions,
    getQuestionsByFilters,
    getQuestionsBySubject,
    getQuestionsByExamType,
    updateFeedbackStatus,
    getQuestionRevisionHistory,
    getQuestionStatistics,
    checkNumericalAnswer,
    duplicateQuestion,
    checkPublishEligibility,
    getQuestionsByPrerequisites,
    getQuestionsByConceptualDifficulty,
    bulkDeleteQuestions,
    getQuestionsByTag,
    updateQuestionHints,
    getQuestionsByLanguageLevel,
    getQuestionsByYear,
    getQuestionsWithCommonMistakes,
    updateCommonMistakes,
    getDetailedChangeHistory,
    revertToVersion,
    toggleQuestionStatus,
    permanentlyDeleteQuestion,
    getQuestionsByClass,
    getQuestionsByDifficultyAndExam,
    getQuestionsBySection,
    getQuestionsBySource
};

