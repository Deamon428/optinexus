import { Router } from 'express';
import { BudgetService } from '../services/budgetService.js';

const router = Router();

// GET /api/v1/budget - Retrieve live API budget status and utilization
router.get('/', (req, res) => {
  const budget = BudgetService.getBudgetStatus();
  return res.status(200).json({
    success: true,
    data: budget
  });
});

export default router;
