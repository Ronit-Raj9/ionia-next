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
import { ApiResponse } from "../utils/ApiResponse.js";

const router = Router();

/**
 * Only admin can upload a question:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" (verifyRole("admin"))
 */
router.route("/upload")
    .post(
        verifyJWT, 
        verifyRole(["admin", "superadmin"]),
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
 * Admin/Superadmin can get questions for management:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" or "superadmin"
 */
router.route("/")
    .get(verifyJWT, verifyRole(["admin", "superadmin"]), getQuestions);

router.route("/:id")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionById)
    .patch(
        verifyJWT, 
        verifyRole(["admin", "superadmin"]),
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
    .delete(verifyJWT, verifyRole(["admin", "superadmin"]), deleteQuestion);

router.route("/bulk-upload")
    .post(verifyJWT, verifyRole(["admin", "superadmin"]), bulkUploadQuestions);

router.route("/verify/:id")
    .patch(verifyJWT, verifyRole(["admin", "superadmin"]), verifyQuestion);

router.route("/:id/feedback")
    .post(
        verifyJWT,
        upload.single('image'),
        addFeedback
    );

router.route("/:id/teacher-note")
    .post(
        verifyJWT,
        verifyRole(["admin", "superadmin"]),
        upload.single('image'),
        addTeacherNote
    );

router.route("/advanced-search")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByFilters);

router.route("/by-subject/:subject")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsBySubject);

router.route("/by-exam/:examType")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByExamType);

router.route("/similar/:id")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getSimilarQuestions);

router.route("/stats/:id")
    .patch(verifyJWT, verifyRole(["admin", "user", "superadmin"]), updateQuestionStats);

router.route("/:id/feedback/:reportId/status")
    .patch(verifyJWT, verifyRole(["admin", "superadmin"]), updateFeedbackStatus);

router.route("/:id/history")
    .get(verifyJWT, verifyRole(["admin", "superadmin"]), getQuestionRevisionHistory);

router.route("/:id/statistics")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionStatistics);

router.route("/:id/check-numerical")
    .post(verifyJWT, verifyRole(["admin", "user", "superadmin"]), checkNumericalAnswer);

router.route("/:id/duplicate")
    .post(verifyJWT, verifyRole(["admin", "superadmin"]), duplicateQuestion);

router.route("/:id/publish-check")
    .get(verifyJWT, verifyRole(["admin", "superadmin"]), checkPublishEligibility);

router.route("/by-prerequisites")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByPrerequisites);

router.route("/by-difficulty-level")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByConceptualDifficulty);

router.route("/bulk-delete")
    .post(verifyJWT, verifyRole(["admin", "superadmin"]), bulkDeleteQuestions);

router.route("/by-tag/:tag")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByTag);

router.route("/:id/hints")
    .patch(verifyJWT, verifyRole(["admin", "superadmin"]), updateQuestionHints);

router.route("/by-language-level/:level")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByLanguageLevel);

router.route("/by-year/:year")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByYear);

router.route("/with-common-mistakes")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsWithCommonMistakes);

router.route("/:id/common-mistakes")
    .patch(verifyJWT, verifyRole(["admin", "superadmin"]), updateCommonMistakes);

router.route("/:id/change-history")
    .get(verifyJWT, verifyRole(["admin", "superadmin"]), getDetailedChangeHistory);

router.route("/:id/revert/:version")
    .post(verifyJWT, verifyRole(["admin", "superadmin"]), revertToVersion);

router.route("/:id/toggle-status")
    .patch(verifyJWT, verifyRole(["admin", "superadmin"]), toggleQuestionStatus);

router.route("/:id/permanent-delete")
    .delete(
        verifyJWT, 
        verifyRole(["admin", "superadmin"]),
        permanentlyDeleteQuestion
    );

router.route("/by-class/:classValue")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByClass);

router.route("/by-difficulty-exam/:difficulty/:examType")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsByDifficultyAndExam);

router.route("/by-section/:subject/:section")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsBySection);

router.route("/by-source/:source")
    .get(verifyJWT, verifyRole(["admin", "user", "superadmin"]), getQuestionsBySource);

export default router;
