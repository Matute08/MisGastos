import express from 'express';
import { ActivityService } from '../services/activityService.js';
import { authenticateToken } from '../middleware/auth.js';
import { queryValidators, handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

router.get('/balance',
  authenticateToken,
  queryValidators.month,
  queryValidators.year,
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await ActivityService.getBalanceActivity(req.user.id, {
        month: req.query.month,
        year: req.query.year,
      });
      res.json(result);
    } catch (error) {
      const status = error.statusCode || 500;
      res.status(status).json({ success: false, error: error.message });
    }
  }
);

export default router;
