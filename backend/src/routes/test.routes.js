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

// === Public Routes (Potentially) ===
// Maybe allow fetching published tests publicly, or apply verifyJWT later
// GET /api/v1/tests - Get list of tests (filtered)
router.route("/").get(
    // Make JWT verification required, not optional
    verifyJWT, 
    getTests
);

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

// GET /api/v1/tests/:id - Get a single test by ID
router.route("/:id").get(
    // Make JWT verification required, not optional
    verifyJWT, 
    getTestById
);

// GET /api/v1/tests/:id/attempt - Get a test prepared for attempting (without answers)
router.route("/:id/attempt").get(
    verifyJWT, // Require authentication for attempts
    getTestForAttempt
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