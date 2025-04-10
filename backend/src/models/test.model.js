import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// Import Question model for the pre-save hook
import { Question } from './question.model.js'; // Adjust path if needed
// import { User } from './user.model.js'; // Import User if needed elsewhere

const testSchema = new mongoose.Schema(
    {
        // --- Core Information (Common to all) ---
        title: {
            type: String,
            required: [true, 'Test title is required'],
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true,
            default: ''
        },
        tags: [{
            type: String,
            trim: true,
            lowercase: true // Optional: enforce consistency
        }],
        testCategory: {
            type: String,
            required: true,
            enum: {
                values: ['PYQ', 'Platform', 'UserCustom'],
                message: 'Invalid test category: {VALUE}. Must be PYQ, Platform, or UserCustom.'
            },
            index: true
        },
        status: { // Controls visibility/availability to users
            type: String,
            enum: ['draft', 'published', 'archived'],
            default: 'draft',
            index: true
        },
        instructions: { // General instructions displayed before starting the test
            type: String,
            trim: true,
            default: ''
        },
        solutionsVisibility: {
            type: String,
            enum: ['immediate', 'after_submission', 'after_deadline', 'manual'],
            default: 'after_submission' // Default to showing after submission
        },
        attemptsAllowed: { // Max number of attempts (null means unlimited)
            type: Number,
            min: [1, 'Attempts allowed must be at least 1'],
            default: null // Null typically signifies unlimited attempts
        },

        // --- Content & Structure (Common to all) ---
        questions: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Question', // Ensure 'Question' matches your Question model name
            required: [true, 'At least one question is required for a test']
        }],
        questionCount: { // Added: Persisted count of questions
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        duration: { // Duration in minutes
            type: Number,
            required: [true, 'Test duration is required'],
            min: [1, 'Duration must be at least 1 minute']
        },
        totalMarks: { // Calculated via pre-save hook
            type: Number,
            required: true,
            default: 0,
            min: 0
        },
        markingScheme: { // Optional: Override individual question marks with a uniform scheme
            correct: { 
                type: Number,
                // required: true // Make optional, defaults can be derived if not set
            },
            incorrect: { 
                type: Number,
                // required: true,
                validate: { // Ensure incorrect marks are zero or negative
                    validator: function(v) { return v == null || v <= 0; },
                    message: 'Incorrect marks must be zero or negative.'
                }
            },
            unattempted: { 
                type: Number,
                default: 0, // Usually zero
                validate: { // Ensure unattempted marks are zero or negative
                    validator: function(v) { return v == null || v <= 0; },
                    message: 'Unattempted marks must be zero or negative.'
                }
            }
        },

        // --- Context & Classification (Common to all) ---
        subject: { // Main subject or 'Mixed'/'Full Syllabus' for multi-subject tests
            type: String,
            required: true,
            trim: true,
            index: true,
            // Define enum based on Question model subjects + 'Mixed', 'Full Syllabus'
            enum: {
                values: [
                    'general_test', 'english', 'biology', 'physics', 'chemistry', 
                    'mathematics', 'social_science', 'computer_science', 'information_practice', 
                    'history', 'civics', 'geography', 'general_knowledge', 
                    'Mixed', 'Full Syllabus' // Added types
                ],
                message: '{VALUE} is not a valid subject'
            }
        },
        examType: { // Align with Question model's examType enum
            type: String,
            required: true,
            index: true,
            // Define enum based on Question model
            enum: {
                values: ['jee_main', 'jee_adv', 'cuet', 'neet', 'cbse_11', 'cbse_12', 'none'],
                message: '{VALUE} is not a valid exam type'
            }
        },
        class: { // Align with Question model's class enum
            type: String,
            required: true,
            index: true,
            // Define enum based on Question model
            enum: {
                values: ['class_9', 'class_10', 'class_11', 'class_12', 'none'],
                message: '{VALUE} is not a valid class'
            }
        },
        difficulty: { // Overall estimated test difficulty
            type: String,
            enum: ['easy', 'medium', 'hard', 'mixed'], // 'mixed' if questions vary significantly
            default: 'medium'
        },

        // --- Ownership & Creation ---
        createdBy: { // User who created it
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // Ensure 'User' matches your User model name
            // Required for Platform/UserCustom, optional/null for PYQ added by system
            required: [function() { return this.testCategory === 'Platform' || this.testCategory === 'UserCustom'; }, 'Creator user ID is required for Platform/User tests']
        },
        // Optional: Track last modifier directly on the model
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User' 
        },

        // --- Revision History (NEW) ---
        revisionHistory: [{
            version: Number, // Optional sequence number
            timestamp: { type: Date, default: Date.now },
            modifiedBy: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User', // Reference to the User model
                required: true 
            },
            changesDescription: { // Summary of changes made in this revision
                type: String, 
                required: true, 
                trim: true 
            }
            // Optionally store previous values or a diff object for more detail
        }],

        // --- PYQ Specific Fields ---
        year: {
            type: Number,
            required: [function() { return this.testCategory === 'PYQ'; }, 'Year is required for PYQ tests'],
            validate: { // Optional: Basic year validation
                validator: function(v) { return !this.testCategory || this.testCategory !== 'PYQ' || (v != null && v >= 1900 && v <= new Date().getFullYear() + 1); },
                message: props => `${props.value} is not a valid year`
            }
        },
        month: { // Added: Month for PYQ
            type: Number,
            min: [1, 'Month must be between 1 and 12'],
            max: [12, 'Month must be between 1 and 12'],
            // Not strictly required, but should only be present for PYQ
            validate: {
                validator: function(v) { return v == null || this.testCategory === 'PYQ'; },
                message: 'Month can only be set for PYQ tests.'
            }
        },
        day: { // Added: Day for PYQ
            type: Number,
            min: [1, 'Day must be between 1 and 31'],
            max: [31, 'Day must be between 1 and 31'],
            // Not strictly required, but should only be present for PYQ
            validate: {
                validator: function(v) { return v == null || this.testCategory === 'PYQ'; },
                message: 'Day can only be set for PYQ tests.'
            }
        },
        session: { // e.g., 'Shift 1', 'Morning', 'April', etc. (Optional for PYQ)
            type: String,
            trim: true,
            required: false // Make explicitly optional
        },

        // --- Platform Test Specific Fields ---
        platformTestType: { // Differentiates platform tests more granularly
            type: String,
            // Required only if category is 'Platform'
            required: [function() { return this.testCategory === 'Platform'; }, 'Platform test type is required'],
            // Add all specific platform test types you envision
            enum: ['Mock', 'Practice', 'Chapter', 'FullSyllabus', 'TopicWise', 'Diagnostic', 'Sectional']
        },
        isPremium: { // Access control for platform tests
            type: Boolean,
            default: false
        },
        syllabus: { // Optional detailed description of topics covered for platform tests
            type: String,
            trim: true
        },

        // --- User Custom Test Specific Fields ---
        isPublic: { // Can other users see/use this user-generated test?
            type: Boolean,
            default: false // Usually false for user tests
        },
        generationCriteria: { // Store how the user generated it (optional, for info/recreation)
            type: mongoose.Schema.Types.Mixed // Store filters like { subjects: ['Physics'], chapters: ['Kinematics'], difficulty: 'medium', count: 20 }
        },

        // --- Test Analytics (Aggregated from user attempts - update via separate process) ---
        analytics: {
             averageScore: { type: Number, default: 0, min: 0 },
             averagePercentage: { type: Number, default: 0, min: 0, max: 100},
             completionRate: { type: Number, default: 0, min: 0, max: 100 }, // Percentage of users who submitted vs started
             timesAttempted: { type: Number, default: 0, min: 0 }
             // Consider adding median score, pass rate, etc. later
        },
    },
    {
        timestamps: true // Adds createdAt and updatedAt fields automatically
    }
);

// --- Indexes ---
// Compound indexes based on common query patterns for filtering/sorting
testSchema.index({ testCategory: 1, status: 1 });
testSchema.index({ subject: 1, examType: 1, class: 1, status: 1 }); // Common filter combo
testSchema.index({ createdBy: 1, testCategory: 1 }); // Find tests by creator
testSchema.index({ year: 1, testCategory: 1 }); // For querying PYQs by year
testSchema.index({ platformTestType: 1, testCategory: 1 }); // For platform tests
testSchema.index({ createdAt: -1 }); // For sorting by newest

// --- Virtuals ---
// Keep virtual for convenience, but primary source is the persisted field now
testSchema.virtual('virtualQuestionCount').get(function() {
    return this.questions ? this.questions.length : 0;
});

// --- Hooks ---
// Pre-save hook to calculate totalMarks based on included questions
// Make sure you import your Question model for this hook to work
// Uncommented the block and added Question import
// import { Question } from './question.model.js'; // Already added at top

testSchema.pre('save', async function(next) {
    // Calculate questionCount and totalMarks if questions array is modified or new doc
    if (this.isModified('questions') || this.isNew) {
        const questionList = this.questions || [];
        this.questionCount = questionList.length; // Set the persisted count

        if (questionList.length > 0) {
            try {
                const validQuestionIds = questionList.filter(id => mongoose.Types.ObjectId.isValid(id));
                if(validQuestionIds.length !== questionList.length) {
                     console.warn(`Test ${this._id || 'new test'} contains invalid question IDs.`);
                }

                if (validQuestionIds.length > 0) {
                    const questionsData = await Question.find({
                        '_id': { $in: validQuestionIds }
                    }).select('marks'); 
                    
                    this.totalMarks = questionsData.reduce((sum, q) => sum + (q.marks || 0), 0);
                    console.log(`Calculated total marks for test ${this._id || 'new test'}: ${this.totalMarks}`);
                } else {
                    this.totalMarks = 0;
                }
            } catch (error) {
                console.error(`Error calculating total marks for test ${this._id || 'new test'}:`, error);
                return next(new Error(`Failed to calculate total marks: ${error.message}`));
            }
        } else {
            this.totalMarks = 0;
        }
    }
    next();
});


// Pre-validate hook for complex cross-field validation
testSchema.pre('validate', function(next) {
    // Ensure platformTestType is set *only* if testCategory is 'Platform'
    if (this.testCategory !== 'Platform' && this.platformTestType != null) {
        return next(new Error(`platformTestType should only be set for Platform tests.`));
    }
    // Ensure year, month, day are set *only* if testCategory is 'PYQ' (or null)
    if (this.testCategory !== 'PYQ') {
        if (this.year != null) {
            return next(new Error(`year should only be set for PYQ tests.`));
        }
        if (this.month != null) {
            return next(new Error(`month should only be set for PYQ tests.`));
        }
        if (this.day != null) {
            return next(new Error(`day should only be set for PYQ tests.`));
        }
    }
    // Ensure generationCriteria is set *only* if testCategory is 'UserCustom' (optional field anyway)
    if (this.testCategory !== 'UserCustom' && this.generationCriteria != null) {
         this.generationCriteria = undefined; // Clear it if set incorrectly
    }

    // Add more complex validations here if needed
    next();
});

// --- Plugins ---
testSchema.plugin(mongooseAggregatePaginate); // For pagination needs

// --- Model Export ---
// Ensure the model name "Test" is consistent across your application
export const Test = mongoose.model("Test", testSchema); 