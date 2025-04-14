import { Router } from "express";
import { 
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
} from "../controllers/attemptedTest.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Submit test attempt with complete analytics
router.route("/submit").post(verifyJWT, submitTest);

// Get detailed analysis for a specific test attempt
router.route("/analysis").get(verifyJWT, getDetailedTestAnalysis);

// Get time-based analytics
router.route("/time-analytics").get(verifyJWT, getTimeAnalytics);

// Get error pattern analysis
router.route("/error-analysis").get(verifyJWT, getErrorAnalysis);

// Get navigation patterns
router.route("/navigation-patterns").get(verifyJWT, getNavigationPatterns);

// Get difficulty analysis
router.route("/difficulty-analysis").get(verifyJWT, getDifficultyAnalysis);

// Get interaction metrics
router.route("/interaction-metrics").get(verifyJWT, getInteractionMetrics);

// Get performance trends across multiple attempts
router.route("/performance-trends").get(verifyJWT, getPerformanceTrends);

// Get subject-wise analysis
router.route("/subject-analysis").get(verifyJWT, getSubjectAnalysis);

// Delete test attempt
router.route("/delete/:testId").delete(verifyJWT, deleteTestAttempt);

// Get solutions for a specific test attempt
router.route("/solutions/:attemptId").get(verifyJWT, getSolutions);

export default router;
