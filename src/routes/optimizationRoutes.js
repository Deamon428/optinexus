import { Router } from 'express';
import { solveRouteOptimization, getSessionState, getOptimizationHistory } from '../controllers/optimizationController.js';
import { enforceApiBudget } from '../middleware/budgetCheck.js';

const router = Router();

// Execute constraint solving and route margin optimization via Gemini (budget-guarded)
router.post('/solve', enforceApiBudget, solveRouteOptimization);

// Multi-tenant session state retrieval
router.get('/session', getSessionState);

// Retrieve historic optimization missions and margin metrics
router.get('/history', getOptimizationHistory);

export default router;
