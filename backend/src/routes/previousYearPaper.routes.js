import { Router } from "express";
import {
  addPreviousYearTest,
  getPreviousYearTests,
  getTestDetails,
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

export default router;
