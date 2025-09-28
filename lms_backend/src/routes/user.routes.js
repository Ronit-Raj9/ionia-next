import express from 'express';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'User profile endpoint - to be implemented',
    data: { user: req.user }
  });
});

router.get('/all', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    success: true,
    message: 'Get all users endpoint - to be implemented'
  });
});

export default router;
