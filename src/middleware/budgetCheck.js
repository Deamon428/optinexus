import { BudgetService, MAX_MONTHLY_BUDGET } from '../services/budgetService.js';

export const enforceApiBudget = (req, res, next) => {
  const budget = BudgetService.getBudgetStatus();

  // Intercept request if usage reaches or exceeds the hard $1500 monthly limit
  if (budget.currentUsage >= MAX_MONTHLY_BUDGET) {
    return res.status(402).json({
      success: false,
      error: `CRITICAL: Max monthly API budget (${MAX_MONTHLY_BUDGET}) exceeded. Solver disabled.`,
      budget: {
        ...budget,
        status: 'BUDGET_EXCEEDED',
        isSolverEnabled: false
      }
    });
  }

  // Record operational API cost and proceed
  BudgetService.recordUsage(0.15);
  next();
};
