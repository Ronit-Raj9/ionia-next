import { Router } from "express";
import {
    createTest,
    getTests,
    getTestById,
    updateTest,
    deleteTest,
    getTestForAttempt
} from "../controllers/test.controller.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";

const router = Router();

// === PUBLIC MOCK TEST ROUTES (No auth required) ===

// GET /api/v1/tests/mock/:examType - Get mock tests by exam type without authentication
router.route("/mock/:examType").get(
    (req, res, next) => {
        // Set default query parameters for mock tests
        req.query.testCategory = "Platform";
        req.query.platformTestType = "mock";
        req.query.examType = req.params.examType;
        req.query.status = "published"; // Only published tests
        req.query.limit = "100"; // Higher limit to get all mock tests
        
        // Create a fake user with user role so status filter works properly
        req.user = { role: "user" };
        
        next();
    },
    getTests
);

// GET /api/v1/tests/mock/:examType/:id - Get a specific mock test by ID without authentication
router.route("/mock/:examType/:id").get(
    (req, res, next) => {
        // Create a fake user with user role so access control works properly
        req.user = { role: "user" };
        next();
    },
    getTestById
);

// GET /api/v1/tests/mock/:examType/:id/attempt - Get a mock test prepared for attempting without authentication
router.route("/mock/:examType/:id/attempt").get(
    (req, res, next) => {
        // Create a fake user with user role so access control works properly
        req.user = { role: "user" };
        next();
    },
    getTestForAttempt
);

// === AUTHENTICATED ROUTES (JWT Required) ===

// GET /api/v1/tests/all - Get all tests without pagination (admin only)
router.route("/all").get(
    verifyJWT,
    verifyRole(["admin", "superadmin"]),
    (req, res, next) => {
        req.query.fetchAll = "true"; // Force fetchAll parameter
        req.query.limit = "1000"; // Set a high limit as fallback
        next();
    },
    getTests
);

// GET /api/v1/tests/:id/attempt - Get a test prepared for attempting (without answers)
router.route("/:id/attempt").get(
    verifyJWT, // Require authentication for attempts
    getTestForAttempt
);

// GET /api/v1/tests/:id - Get a single test by ID
router.route("/:id").get(
    // Make JWT verification required, not optional
    verifyJWT, 
    getTestById
);

// GET /api/v1/tests - Get list of tests (filtered)
router.route("/").get(
    // Make JWT verification required, not optional
    verifyJWT, 
    getTests
);

// === Admin/Superadmin Routes ===

// POST /api/v1/tests - Create a new test
router.route("/").post(
    verifyJWT, 
    verifyRole(["admin", "superadmin"]), // Only admins/superadmins can create Platform/PYQ tests
    // Note: UserCustom tests might need a separate route or logic check inside createTest
    createTest
);

// PATCH /api/v1/tests/:id - Update an existing test
router.route("/:id").patch(
    verifyJWT, 
    verifyRole(["admin", "superadmin"]), // Only admins/superadmins can update tests
    updateTest
);

// PUT /api/v1/tests/:id - Also handle PUT method for updating tests
router.route("/:id").put(
    verifyJWT, 
    verifyRole(["admin", "superadmin"]), // Only admins/superadmins can update tests
    updateTest
);

// DELETE /api/v1/tests/:id - Delete a test
router.route("/:id").delete(
    verifyJWT, 
    verifyRole(["superadmin"]), // Example: Maybe only superadmins can delete
    // Or: verifyRole(["admin", "superadmin"]), // If admins can also delete
    deleteTest
);

export default router; 