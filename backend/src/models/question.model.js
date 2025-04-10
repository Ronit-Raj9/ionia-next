import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const questionSchema = new mongoose.Schema(
    {
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        lastModifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        revisionHistory: [{
            version: Number,
            modifiedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            changes: String,
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        tags: [{
            type: String,
            trim: true
        }],
        isVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        question: {
            text: { 
                type: String,
                required: [
                    function() {
                        // Require text if no image is provided
                        return !this.question?.image?.url;
                    },
                    'Question must have either text or image content'
                ],
                default: "",
                trim: true
            },
            image: {
                url: { 
                    type: String, 
                    default: "", 
                    trim: true,
                    required: [
                        function() {
                            // Require image if no text is provided
                            return !this.question?.text?.trim();
                        },
                        'Question must have either text or image content'
                    ]
                },
                publicId: { 
                    type: String, 
                    default: "", 
                    trim: true 
                }
            }
        },
        questionType: {
            type: String,
            required: true,
            enum: {
                values: ['single', 'multiple', 'numerical'],
                message: '{VALUE} is not a valid question type'
            }
        },

        options: {
            type: [{
                text: { 
                    type: String,
                    default: "",
                    trim: true
                },
                image: {
                    url: { type: String, default: "", trim: true },
                    publicId: { type: String, default: "", trim: true }
                }
            }],
            validate: {
                validator: function(v) {
                    if (this.questionType === 'numerical') return true;
                    if (v.length !== 4) return false;
                    return v.every(option => 
                        option.text.trim() !== "" || option.image.url !== ""
                    );
                },
                message: props => {
                    if (props.value.length !== 4) {
                        return 'MCQ questions must have exactly 4 options';
                    }
                    return 'Each option must have either text or image content';
                }
            },
            required: [function() { return this.questionType !== 'numerical'; }, 'Options are required for MCQ questions']
        },
        correctOptions: [{
            type: Number,
            validate: {
                validator: function(v) {
                    if (this.questionType === 'numerical') return true;
                    if (this.questionType === 'single') return this.correctOptions.length === 1;
                    if (this.questionType === 'multiple') return this.correctOptions.length > 0;
                    return true;
                },
                message: props => {
                    if (props.value.length === 0) return 'At least one correct option is required';
                    return 'Single choice questions can only have one correct answer';
                }
            }
        }],
        numericalAnswer: {
            exactValue: {
                type: Number,
                required: [
                    function() { return this.questionType === 'numerical'; },
                    'Exact value is required for numerical questions'
                ]
            },
            range: {
                min: { 
                    type: Number,
                    required: [
                        function() { return this.questionType === 'numerical'; },
                        'Minimum range is required for numerical questions'
                    ]
                },
                max: { 
                    type: Number,
                    required: [
                        function() { return this.questionType === 'numerical'; },
                        'Maximum range is required for numerical questions'
                    ]
                }
            },
            unit: { 
                type: String, 
                trim: true 
            }
        },
        commonMistakes: [{
            description: String,
            explanation: String
        }],
        statistics: {
            timesAttempted: {
                type: Number,
                default: 0,
                min: 0
            },
            successRate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100
            },
            averageTimeTaken: {
                type: Number,
                default: 0,
                min: 0
            }
        },
        examType: { 
            type: String, 
            required: true,
            enum: {
                values: ['jee_main', 'jee_adv', 'cuet', 'neet', 'cbse_11', 'cbse_12', 'none'],
                message: '{VALUE} is not a valid exam type'
            }
        },
        class: {
            type: String,
            required: true,
            enum: {
                values: ['class_9', 'class_10', 'class_11', 'class_12', 'none'],
                message: '{VALUE} is not a valid class'
            }
        },
        subject: { 
            type: String, 
            required: true,
            trim: true,
            enum: {
                values: [
                    'general_test',
                    'english',
                    'biology',
                    'physics',
                    'chemistry',
                    'mathematics',
                    'social_science',
                    'computer_science',
                    'information_practice',
                    'history',
                    'civics',
                    'geography',
                    'general_knowledge'
                ],
                message: '{VALUE} is not a valid subject'
            }
        },
        chapter: {
            type: String,
            required: [true, 'Chapter name is required'],
            trim: true
        },
        questionCategory: {
            type: String,
            required: true,
            enum: {
                values: ['theoretical', 'numerical'],
                message: '{VALUE} is not a valid question category'
            },
            default: 'theoretical'
        },
        questionSource: {
            type: String,
            required: true,
            enum: {
                values: ['custom', 'india_book', 'foreign_book', 'pyq'],
                message: '{VALUE} is not a valid question source'
            },
            default: 'custom'
        },
        section: { 
            type: String,
            trim: true,
            required: [function() { 
                return ['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology', 
                        'social_science', 'computer_science', 'information_practice'].includes(this.subject?.toLowerCase());
            }, 'Section is required for this subject'],
            validate: {
                validator: function(value) {
                    if (!this.subject) return true;
                    const subject = this.subject.toLowerCase();
                    const validSections = {
                        physics: ['mechanics', 'electromagnetism', 'thermodynamics', 'optics', 'modern_physics', 'none'],
                        chemistry: ['organic', 'inorganic', 'physical', 'analytical', 'none'],
                        mathematics: ['algebra', 'calculus', 'geometry', 'statistics', 'trigonometry', 'none'],
                        general_test: ['gk', 'current_affairs', 'general_science', 'mathematical_reasoning', 'logical_reasoning', 'none'],
                        english: ['reading_comprehension', 'vocabulary', 'grammar', 'writing', 'none'],
                        biology: ['botany', 'zoology', 'human_physiology', 'ecology', 'genetics', 'none'],
                        social_science: ['history', 'civics', 'geography', 'economics', 'none'],
                        computer_science: ['programming', 'data_structures', 'algorithms', 'databases', 'none'],
                        information_practice: ['programming', 'databases', 'web_development', 'none']
                    };
                    return validSections[subject]?.includes(value) || false;
                },
                message: 'Section {VALUE} is not valid for the selected subject'
            }
        },
        difficulty: {
            type: String,
            required: true,
            enum: {
                values: ['easy', 'medium', 'hard'],
                message: '{VALUE} is not a valid difficulty level'
            },
            default: 'medium'
        },
        prerequisites: [{
            type: String,
            trim: true
        }],
        conceptualDifficulty: {
            type: Number,
            min: 1,
            max: 10,
            default: 5
        },
        year: { 
            type: String, 
            default: "not applicable",
            trim: true,
            validate: {
                validator: function(v) {
                    if (this.questionSource === 'pyq') {
                        return /^\d{4}$/.test(v); // Must be a 4-digit year for PYQs
                    }
                    return true;
                },
                message: 'Year must be specified in YYYY format for previous year questions'
            }
        },
        languageLevel: { 
            type: String, 
            required: true,
            enum: {
                values: ['basic', 'intermediate', 'advanced'],
                message: '{VALUE} is not a valid language level'
            }
        },
        language: {
            type: String,
            enum: {
                values: ['english', 'hindi'],
                message: '{VALUE} is not a supported language'
            },
            required: true
        },
        solution: {
            text: { 
                type: String,
                default: "",
                trim: true
            },
            image: {
                url: { type: String, default: "", trim: true },
                publicId: { type: String, default: "", trim: true }
            }
        },
        hints: [{
            text: { type: String, trim: true },
            image: {
                url: { type: String, trim: true },
                publicId: { type: String, trim: true }
            }
        }],        
        relatedTopics: [{
            type: String,
            trim: true
        }],
        marks: {
            type: Number,
            required: true,
            default: 1,
            min: [0, 'Marks cannot be negative']
        },
        negativeMarks: {
            type: Number,
            default: 0,
            max: [0, 'Negative marks should not be positive']
        },
        expectedTime: {
            type: Number,  // in seconds
            default: 120,  // 2 minutes default
            min: [0, 'Expected time cannot be negative']
        },
        isActive: {
            type: Boolean,
            default: true,  // Questions are active by default
            required: true
        },

        feedback: {
            studentReports: [{
                type: {
                    type: String,
                    enum: ['error', 'clarity', 'difficulty', 'other']
                },
                description: {
                    text: { 
                        type: String,
                        trim: true,
                        validate: {
                            validator: function(v) {
                                // Require either text or image
                                return v?.trim() || this.description?.image?.url;
                            },
                            message: 'Student report must have either text or image content'
                        }
                    },
                    image: {
                        url: { type: String, default: "", trim: true },
                        publicId: { type: String, default: "", trim: true }
                    }
                },
                reportedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                timestamp: {
                    created: { type: Date, default: Date.now },
                    lastModified: { type: Date, default: Date.now }
                },
                status: {
                    type: String,
                    enum: ['pending', 'reviewed', 'resolved'],
                    default: 'pending'
                }
            }],
            teacherNotes: [{
                note: {
                    text: { 
                        type: String,
                        trim: true,
                        validate: {
                            validator: function(v) {
                                // Require either text or image
                                return v?.trim() || this.note?.image?.url;
                            },
                            message: 'Teacher note must have either text or image content'
                        }
                    },
                    image: {
                        url: { type: String, default: "", trim: true },
                        publicId: { type: String, default: "", trim: true }
                    }
                },
                addedBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'User'
                },
                timestamp: {
                    created: { type: Date, default: Date.now },
                    lastModified: { type: Date, default: Date.now }
                }
            }]
        },
        quizUsage: [{
            quizId: mongoose.Schema.Types.ObjectId,
            usedAt: Date
        }]
    },
    { 
        timestamps: true 
    }
);

// Indexes for better query performance
questionSchema.index({ subject: 1, chapter: 1 });
questionSchema.index({ examType: 1 });
questionSchema.index({ class: 1 });
questionSchema.index({ tags: 1 });
questionSchema.index({ 'question.text': 'text' }); // Text index for search
questionSchema.index({ subject: 1, difficulty: 1 });
questionSchema.index({ examType: 1, difficulty: 1 });
questionSchema.index({ subject: 1, chapter: 1, difficulty: 1 });
questionSchema.index({ subject: 1, class: 1 });
questionSchema.index({ examType: 1, class: 1 });
questionSchema.index({ difficulty: 1, class: 1 });
questionSchema.index({ subject: 1, chapter: 1, class: 1, difficulty: 1 });
questionSchema.index({ questionCategory: 1 });
questionSchema.index({ subject: 1, questionCategory: 1 });
questionSchema.index({ isActive: 1 });
questionSchema.index({ createdAt: -1 }); // For sorting by creation date
questionSchema.index({ isActive: 1, createdAt: -1 }); // For filtering active questions and sorting

// Pre-save middleware for version control and validation
questionSchema.pre('save', function(next) {
    // Existing numerical range validation
    if (this.numericalAnswer.range.min && this.numericalAnswer.range.max) {
        if (this.numericalAnswer.range.min >= this.numericalAnswer.range.max) {
            return next(new Error('Minimum range must be less than maximum range'));
        }
    }

    // Update revision history on content change
    if (this.isModified('question') || 
        this.isModified('options') || 
        this.isModified('solution')) {
        
        const revision = {
            version: (this.revisionHistory.length || 0) + 1,
            modifiedBy: this.lastModifiedBy,
            changes: 'Content updated',
            timestamp: new Date()
        };
        this.revisionHistory.push(revision);
    }

    // Validate marks and negative marks relationship
    if (Math.abs(this.negativeMarks) > this.marks) {
        return next(new Error('Negative marks cannot be greater than positive marks'));
    }

    // Ensure questionCategory is consistent with questionType
    if (this.questionType === 'numerical' && this.questionCategory !== 'numerical') {
        this.questionCategory = 'numerical'; // Auto-correct for consistency
    }

    // Ensure section is filled based on subject
    if (['physics', 'chemistry', 'mathematics', 'general_test', 'english', 'biology'].includes(this.subject?.toLowerCase()) && !this.section) {
        return next(new Error(`Section is required for ${this.subject} subject`));
    }

    next();
});

// Pre-validate middleware
questionSchema.pre('validate', function(next) {
    // Ensure hints array doesn't exceed 3 items
    if (this.hints && this.hints.length > 3) {
        return next(new Error('Maximum 3 hints allowed per question'));
    }

    // Validate that solution exists for verified questions
    if (this.isVerified && 
        (!this.solution.text.trim() && !this.solution.image.url)) {
        return next(new Error('Verified questions must have a solution'));
    }

    // Question content validation - at least one of text or image must be present
    if (!this.question.text?.trim() && !this.question.image?.url?.trim()) {
        return next(new Error('Question must have either text or image content'));
    }

    // Validate numerical answer if question type is numerical
    if (this.questionType === 'numerical') {
        // Check if exact value exists
        if (this.numericalAnswer?.exactValue === undefined) {
            return next(new Error('Numerical questions require an exact value'));
        }

        // Check range values
        if (this.numericalAnswer?.range?.min === undefined || 
            this.numericalAnswer?.range?.max === undefined) {
            return next(new Error('Numerical questions require both min and max range'));
        }

        // Validate range values
        if (this.numericalAnswer.range.min >= this.numericalAnswer.range.max) {
            return next(new Error('Maximum range must be greater than minimum range'));
        }

        // Validate exact value falls within range
        if (this.numericalAnswer.exactValue < this.numericalAnswer.range.min || 
            this.numericalAnswer.exactValue > this.numericalAnswer.range.max) {
            return next(new Error('Exact value must fall within the specified range'));
        }
    }

    // In pre-validate middleware
    if (this.feedback?.studentReports?.length > 50) {
        return next(new Error('Maximum 50 student reports allowed per question'));
    }
    if (this.feedback?.teacherNotes?.length > 20) {
        return next(new Error('Maximum 20 teacher notes allowed per question'));
    }

    next();
});

// Post-save middleware
questionSchema.post('save', function(doc, next) {
    // Log significant changes
    if (doc.isVerified) {
        console.log(`Question ${doc._id} has been verified by ${doc.verifiedBy}`);
    }
    if (doc.isModified('statistics')) {
        console.log(`Statistics updated for question ${doc._id}`);
    }
    next();
});

// Pre-update middleware
questionSchema.pre('findOneAndUpdate', function(next) {
    // Update lastModifiedBy and timestamps
    this.set({ lastModifiedBy: this._update.lastModifiedBy });
    this.set({ updatedAt: new Date() });
    next();
});

// Post-find middleware
questionSchema.post('find', function(docs) {
    // You could add logging or monitoring here
    if (docs.length > 100) {
        console.log(`Large question fetch: ${docs.length} documents`);
    }
});

// Error handling middleware
questionSchema.post('save', function(error, doc, next) {
    if (error.name === 'ValidationError') {
        console.error(`Validation Error for question ${doc._id}:`, error.message);
    }
    next(error);
});

// Virtual fields
questionSchema.virtual('totalAttempts').get(function() {
    return this.statistics.timesAttempted || 0;
});

questionSchema.virtual('successPercentage').get(function() {
    return this.statistics.successRate || 0;
});

// Instance methods
questionSchema.methods = {
    isComplete() {
        const hasQuestion = this.question.text.trim() !== "" || this.question.image.url !== "";
        const hasSolution = this.solution.text.trim() !== "" || this.solution.image.url !== "";
        const hasValidOptions = this.questionType === 'numerical' ? 
            this.numericalAnswer.exactValue !== undefined : 
            this.options.length === 4 && this.correctOptions.length > 0;
        
        return hasQuestion && hasSolution && hasValidOptions;
    },

    validateNumericalAnswer(submittedAnswer) {
        if (this.questionType !== 'numerical') {
            throw new Error('This method is only for numerical questions');
        }

        if (this.numericalAnswer.range.min != null && 
            this.numericalAnswer.range.max != null) {
            return submittedAnswer >= this.numericalAnswer.range.min && 
                   submittedAnswer <= this.numericalAnswer.range.max;
        }

        return Math.abs(submittedAnswer - this.numericalAnswer.exactValue) < Number.EPSILON;
    },

    updateStatistics(isCorrect, timeTaken) {
        if (typeof isCorrect !== 'boolean' || typeof timeTaken !== 'number' || timeTaken < 0) {
            throw new Error('Invalid statistics update parameters');
        }

        const currentAttempts = this.statistics.timesAttempted || 0;
        const currentSuccessRate = this.statistics.successRate || 0;
        const currentAvgTime = this.statistics.averageTimeTaken || 0;

        this.statistics.timesAttempted = currentAttempts + 1;
        this.statistics.successRate = (currentSuccessRate * currentAttempts + (isCorrect ? 100 : 0)) / (currentAttempts + 1);
        this.statistics.averageTimeTaken = (currentAvgTime * currentAttempts + timeTaken) / (currentAttempts + 1);

        return this.save();
    },

    isEligibleForPublishing() {
        return this.isVerified && 
               (this.solution.text.trim() !== "" || this.solution.image.url !== "") && 
               this.marks > 0;
    },

    validateQuestionContent() {
        const hasText = Boolean(this.question.text?.trim());
        const hasImage = Boolean(this.question.image?.url?.trim());
        
        if (!hasText && !hasImage) {
            throw new Error('Question must have either text or image content');
        }
        
        return true;
    },

    addFeedback(type, userId, content) {
        if (type === 'report') {
            this.feedback.studentReports.push({
                type: content.type,
                description: {
                    text: content.text,
                    image: content.image
                },
                reportedBy: userId,
                status: 'pending'
            });
        } else if (type === 'note') {
            this.feedback.teacherNotes.push({
                note: {
                    text: content.text,
                    image: content.image
                },
                addedBy: userId
            });
        }
        return this.save();
    },

    updateFeedbackStatus(reportId, newStatus, moderatorId) {
        const report = this.feedback.studentReports.id(reportId);
        if (!report) {
            throw new Error('Report not found');
        }
        report.status = newStatus;
        report.timestamp.lastModified = new Date();
        report.moderatedBy = moderatorId;
        return this.save();
    },

    async recordQuizUsage(quizId) {
        if (!this.quizUsage) {
            this.quizUsage = [];
        }
        this.quizUsage.push({
            quizId: quizId,
            usedAt: new Date()
        });
        return this.save();
    }
};

// Static methods
questionSchema.statics = {
    findByDifficultyAndExam(difficulty, examType, classValue) {
        const query = { 
            difficulty: difficulty,
            examType: examType 
        };
        
        if (classValue) {
            query.class = classValue;
        }
        
        return this.find(query);
    },

    findSimilarQuestions(questionId) {
        return this.findById(questionId)
            .then(question => {
                if (!question) {
                    throw new Error('Question not found');
                }
                return this.find({
                    _id: { $ne: questionId },
                    subject: question.subject,
                    chapter: question.chapter,
                    difficulty: question.difficulty,
                    class: question.class
                }).limit(5);
            })
            .catch(error => {
                console.error('Error finding similar questions:', error);
                throw error;
            });
    },

    findActiveQuestions() {
        return this.find({ isActive: true });
    }
};

// Add pagination plugin
questionSchema.plugin(mongooseAggregatePaginate);

// Export the model
export const Question = mongoose.model("Question", questionSchema);
