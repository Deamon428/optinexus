export const MAX_MONTHLY_BUDGET = 1500;

// Initialize with realistic mock baseline usage
let currentUsage = 412.00;

export const BudgetService = {
  /**
   * Retrieve current API budget metrics.
   */
  getBudgetStatus() {
    const remaining = Math.max(0, MAX_MONTHLY_BUDGET - currentUsage);
    const utilizationPct = Number(((currentUsage / MAX_MONTHLY_BUDGET) * 100).toFixed(2));
    const isExceeded = currentUsage >= MAX_MONTHLY_BUDGET;

    return {
      maxMonthlyBudget: MAX_MONTHLY_BUDGET,
      currentUsage: Number(currentUsage.toFixed(2)),
      remainingBudget: Number(remaining.toFixed(2)),
      currency: 'USD',
      utilizationPct,
      status: isExceeded ? 'BUDGET_EXCEEDED' : 'ACTIVE_UNDER_BUDGET',
      isSolverEnabled: !isExceeded,
      month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    };
  },

  /**
   * Record operational cost of a Gemini API optimization execution.
   */
  recordUsage(cost = 0.15) {
    currentUsage = Number((currentUsage + cost).toFixed(2));
    return this.getBudgetStatus();
  },

  /**
   * Setter for automated testing and threshold validation.
   */
  setUsage(amount) {
    currentUsage = Number(amount);
    return this.getBudgetStatus();
  },

  /**
   * Reset usage back to baseline.
   */
  resetUsage() {
    currentUsage = 412.00;
    return this.getBudgetStatus();
  }
};
