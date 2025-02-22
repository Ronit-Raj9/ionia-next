import { Router } from "express";
import { uploadQuestion, getQuestions } from "../controllers/question.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * Only admin can upload a question:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" (verifyRole("admin"))
 */
router
  .route("/upload")
  .post(verifyJWT, verifyRole("admin"), uploadQuestion);

/**
 * Both admin and user can get questions:
 *  - Must be authenticated (verifyJWT)
 *  - Must have role = "admin" or "user" (verifyRole("admin", "user"))
 */
router
  .route("/get")
  .get(verifyJWT, verifyRole("admin", "user"), getQuestions);

export default router;
