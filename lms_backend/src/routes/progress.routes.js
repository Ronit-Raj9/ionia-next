import express from 'express';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Get student progress endpoint - to be implemented'
  });
});

router.post('/start', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Start learning session endpoint - to be implemented'
  });
});

router.post('/answer', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Submit answer endpoint - to be implemented'
  });
});

export default router;
