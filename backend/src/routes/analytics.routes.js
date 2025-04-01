import express from 'express';
import { verifyJWT, verifyRole } from "../middlewares/auth.middleware.js";
import { getAdminAnalytics } from '../controllers/analytics.controller.js';

const router = express.Router();

// Admin analytics endpoint
router.get(
  '/v1/admin/analytics',
  verifyJWT,
  verifyRole(['admin', 'superadmin']),
  getAdminAnalytics
);

export default router; 