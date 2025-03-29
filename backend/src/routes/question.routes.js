import { Router } from "express";
import { 
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
} from "../controllers/question.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Only admin can upload a question:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" (verifyRole("admin"))
 */
router.route("/upload")
    .post(
        verifyJWT, 
        verifyRole("admin"),
        upload.fields([
            { name: 'questionImage', maxCount: 4 },
            { name: 'solutionImage', maxCount: 4 },
            { name: 'optionImages', maxCount: 4 },
            { name: 'hintImages', maxCount: 4 },
            { name: 'hint0Image', maxCount: 4 },
            { name: 'hint1Image', maxCount: 4 },
            { name: 'hint2Image', maxCount: 4 },
            { name: 'hint3Image', maxCount: 4 },
            { name: 'option0Image', maxCount: 4 },
            { name: 'option1Image', maxCount: 4 },
            { name: 'option2Image', maxCount: 4 },
            { name: 'option3Image', maxCount: 4 }
        ]),
        uploadQuestion
    );

/**
 * Both admin and user can get questions:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" or "user" (verifyRole("admin", "user"))
 */
router.route("/")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestions);

router.route("/:id")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionById)
    .patch(
        verifyJWT, 
        verifyRole("admin"),
        upload.fields([
            { name: 'questionImage', maxCount: 4 },
            { name: 'solutionImage', maxCount: 4 },
            { name: 'optionImages', maxCount: 4 },
            { name: 'hintImages', maxCount: 4 },
            { name: 'hint0Image', maxCount: 4 },
            { name: 'hint1Image', maxCount: 4 },
            { name: 'hint2Image', maxCount: 4 },
            { name: 'hint3Image', maxCount: 4 },
            { name: 'option0Image', maxCount: 4 },
            { name: 'option1Image', maxCount: 4 },
            { name: 'option2Image', maxCount: 4 },
            { name: 'option3Image', maxCount: 4 }
        ]),
        updateQuestion
    )
    .delete(verifyJWT, verifyRole("admin"), deleteQuestion);

router.route("/bulk-upload")
    .post(verifyJWT, verifyRole("admin"), bulkUploadQuestions);

router.route("/verify/:id")
    .patch(verifyJWT, verifyRole("admin"), verifyQuestion);

router.route("/:id/feedback")
    .post(
        verifyJWT,
        upload.single('image'),
        addFeedback
    );

router.route("/:id/teacher-note")
    .post(
        verifyJWT,
        verifyRole("admin"),
        upload.single('image'),
        addTeacherNote
    );

router.route("/advanced-search")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByFilters);

router.route("/by-subject/:subject")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsBySubject);

router.route("/by-exam/:examType")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByExamType);

router.route("/similar/:id")
    .get(verifyJWT, verifyRole("admin", "user"), getSimilarQuestions);

router.route("/stats/:id")
    .patch(verifyJWT, verifyRole("admin", "user"), updateQuestionStats);

router.route("/:id/feedback/:reportId/status")
    .patch(verifyJWT, verifyRole("admin"), updateFeedbackStatus);

router.route("/:id/history")
    .get(verifyJWT, verifyRole("admin"), getQuestionRevisionHistory);

router.route("/:id/statistics")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionStatistics);

router.route("/:id/check-numerical")
    .post(verifyJWT, verifyRole("admin", "user"), checkNumericalAnswer);

router.route("/:id/duplicate")
    .post(verifyJWT, verifyRole("admin"), duplicateQuestion);

router.route("/:id/publish-check")
    .get(verifyJWT, verifyRole("admin"), checkPublishEligibility);

router.route("/by-prerequisites")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByPrerequisites);

router.route("/by-difficulty-level")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByConceptualDifficulty);

router.route("/bulk-delete")
    .post(verifyJWT, verifyRole("admin"), bulkDeleteQuestions);

router.route("/by-tag/:tag")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByTag);

router.route("/:id/hints")
    .patch(verifyJWT, verifyRole("admin"), updateQuestionHints);

router.route("/by-language-level/:level")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByLanguageLevel);

router.route("/by-year/:year")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByYear);

router.route("/with-common-mistakes")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsWithCommonMistakes);

router.route("/:id/common-mistakes")
    .patch(verifyJWT, verifyRole("admin"), updateCommonMistakes);

router.route("/:id/change-history")
    .get(verifyJWT, verifyRole("admin"), getDetailedChangeHistory);

router.route("/:id/revert/:version")
    .post(verifyJWT, verifyRole("admin"), revertToVersion);

router.route("/:id/toggle-status")
    .patch(verifyJWT, verifyRole("admin"), toggleQuestionStatus);

router.route("/:id/permanent-delete")
    .delete(
        verifyJWT, 
        verifyRole("admin"),
        permanentlyDeleteQuestion
    );

router.route("/by-class/:classValue")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByClass);

router.route("/by-difficulty-exam/:difficulty/:examType")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsByDifficultyAndExam);

router.route("/by-section/:subject/:section")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsBySection);

router.route("/by-source/:source")
    .get(verifyJWT, verifyRole("admin", "user"), getQuestionsBySource);

export default router;
