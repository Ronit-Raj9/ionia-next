import { Router } from "express";
import {
  addPreviousYearTest,
  getPreviousYearTests,
  getTestDetails,
  deleteTest,
} from "../controllers/previousYearPaper.controller.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Only admin can add a new previous year test:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" (verifyRole("admin"))
 */
router
  .route("/add")
  .post(verifyJWT, verifyRole("admin"), addPreviousYearTest);

/**
 * Everyone (no authentication required) can:
 *  - View list of previous year tests
 *  - View details of a particular test
 */
router.route("/get").get(getPreviousYearTests);
router.route("/get/:id").get(getTestDetails);

/**
 * Only admin can delete a test:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" (verifyRole("admin"))
 */
router
  .route("/delete/:id")
  .delete(verifyJWT, verifyRole("admin"), deleteTest);

export default router;
