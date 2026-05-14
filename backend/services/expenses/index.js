import { getExpenses, createExpense, updateExpense, deleteExpense, markAsPaid } from './core.js';
import { createInstallmentsForExpense, getInstallments, getExpenseInstallmentsSummary, getUpcomingInstallments, getPaymentStatus, getPaymentStatusByCode, createInstallments, updateInstallmentStatus, updateExpenseStatusBasedOnInstallments, markInstallmentAsPaid, getAllPaymentStatuses } from './installments.js';
import { createScheduledExpense, updateScheduledExpense, cancelScheduledExpense, getScheduledExpenses } from './scheduled.js';
import { getMonthlyExpensesWithInstallments, getExpensesSummaryByType, getCreditCardsSummary } from './summary.js';
import { getMonthlyTotalWithInstallments } from './balance.js';

export { getExpenses, createExpense, updateExpense, deleteExpense, markAsPaid };
export { createInstallmentsForExpense, getInstallments, getExpenseInstallmentsSummary, getUpcomingInstallments, getPaymentStatus, getPaymentStatusByCode, createInstallments, updateInstallmentStatus, updateExpenseStatusBasedOnInstallments, markInstallmentAsPaid, getAllPaymentStatuses };
export { createScheduledExpense, updateScheduledExpense, cancelScheduledExpense, getScheduledExpenses };
export { getMonthlyExpensesWithInstallments, getExpensesSummaryByType, getCreditCardsSummary };
export { getMonthlyTotalWithInstallments };

const ExpensesService = {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  markAsPaid,
  getInstallments,
  getExpenseInstallmentsSummary,
  getUpcomingInstallments,
  getPaymentStatus,
  getPaymentStatusByCode,
  createInstallments,
  updateInstallmentStatus,
  markInstallmentAsPaid,
  getAllPaymentStatuses,
  createScheduledExpense,
  updateScheduledExpense,
  cancelScheduledExpense,
  getScheduledExpenses,
  getMonthlyExpensesWithInstallments,
  getExpensesSummaryByType,
  getCreditCardsSummary,
  getMonthlyTotalWithInstallments,
};

export default ExpensesService;
