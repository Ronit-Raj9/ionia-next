import { Router } from "express";
import {
  createScheduledTest,
  getUpcomingTests,
  updateScheduledTest,
  deleteScheduledTest
} from "../controllers/scheduledTest.controller.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";

const router = Router();

// Admin routes (require admin role)
router.route("/create").post(verifyJWT, verifyRole("admin"), createScheduledTest);
router.route("/update/:id").patch(verifyJWT, verifyRole("admin"), updateScheduledTest);
router.route("/delete/:id").delete(verifyJWT, verifyRole("admin"), deleteScheduledTest);

// User routes (any authenticated user)
router.route("/upcoming").get(verifyJWT, getUpcomingTests);

export default router; 