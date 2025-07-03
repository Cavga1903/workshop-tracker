const express = require('express');
const router = express.Router();
const supabase = require('../supabase/client');

// GET /api/summary - Returns total income, total expenses, and total profit
router.get('/', async (req, res) => {
  try {
    // Fetch all incomes
    const { data: incomes, error: incomeError } = await supabase
      .from('incomes')
      .select('payment, profit');
    if (incomeError) throw incomeError;

    // Fetch all expenses
    const { data: expenses, error: expenseError } = await supabase
      .from('expenses')
      .select('cost');
    if (expenseError) throw expenseError;

    // Calculate totals
    const totalIncome = incomes.reduce((sum, i) => sum + (i.payment || 0), 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + (e.cost || 0), 0);
    // If you want to use the profit field from incomes, sum it; otherwise, use income - expenses
    const totalProfit = incomes.reduce((sum, i) => sum + (i.profit || 0), 0) || (totalIncome - totalExpenses);

    res.json({
      totalIncome,
      totalExpenses,
      totalProfit
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 