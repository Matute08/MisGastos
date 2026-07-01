import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';
import { directExpenseBelongsToPeriod } from './expenses/helpers.js';
import { getMonthlyTotalWithInstallments } from './expenses/balance.js';

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function datePart(value) {
  return String(value || '').slice(0, 10);
}

function timePart(value) {
  if (!value || !String(value).includes('T')) return null;
  return String(value).slice(11, 16);
}

function monthRange(month, year) {
  const safeMonth = Number(month);
  const safeYear = Number(year);
  const nextMonth = safeMonth === 12 ? 1 : safeMonth + 1;
  const nextYear = safeMonth === 12 ? safeYear + 1 : safeYear;
  return {
    startDate: `${safeYear}-${String(safeMonth).padStart(2, '0')}-01`,
    endDate: `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`,
  };
}

function previousMonth(month, year) {
  const safeMonth = Number(month);
  const safeYear = Number(year);
  return {
    month: safeMonth === 1 ? 12 : safeMonth - 1,
    year: safeMonth === 1 ? safeYear - 1 : safeYear,
  };
}

function normalizeMovement(movement) {
  const impact = movement.affects_balance === false ? 0 : toNumber(movement.amount);
  return {
    id: movement.id,
    source: movement.source,
    source_id: movement.source_id,
    date: movement.date,
    time: movement.time || null,
    title: movement.title,
    detail: movement.detail || '',
    account: movement.account || '',
    method: movement.method || '',
    status: movement.status || 'aprobado',
    direction: impact > 0 ? 'in' : impact < 0 ? 'out' : 'neutral',
    amount: impact,
    reference_amount: movement.reference_amount != null ? toNumber(movement.reference_amount) : Math.abs(impact),
    affects_balance: movement.affects_balance !== false,
  };
}

function sortMovementsAscending(a, b) {
  const aKey = `${a.date || ''}T${a.time || '00:00'}:${a.id || ''}`;
  const bKey = `${b.date || ''}T${b.time || '00:00'}:${b.id || ''}`;
  return aKey.localeCompare(bKey);
}

function sortMovementsDescending(a, b) {
  const aKey = `${a.date || ''}T${a.time || '00:00'}:${a.id || ''}`;
  const bKey = `${b.date || ''}T${b.time || '00:00'}:${b.id || ''}`;
  return bKey.localeCompare(aKey);
}

export class ActivityService {
  static async getBalanceActivity(userId, filters = {}) {
    const now = new Date();
    const month = Number(filters.month || now.getMonth() + 1);
    const year = Number(filters.year || now.getFullYear());

    if (!month || !year || month < 1 || month > 12 || Number.isNaN(month) || Number.isNaN(year)) {
      const error = new Error('Mes y anio invalidos');
      error.statusCode = 400;
      throw error;
    }

      const { startDate, endDate } = monthRange(month, year);
      const movements = [];

      try {
      const previous = previousMonth(month, year);
      const { data: previousIncomes, error: previousIncomesError } = await supabase
        .from('incomes')
        .select('amount, affects_cash_balance')
        .eq('user_id', userId)
        .eq('month', previous.month)
        .eq('year', previous.year);

      if (previousIncomesError) throw previousIncomesError;

      const previousIncomeTotal = (previousIncomes || [])
        .filter((income) => income.affects_cash_balance !== false)
        .reduce((sum, income) => sum + toNumber(income.amount), 0);
      const previousExpenseResult = await getMonthlyTotalWithInstallments(
        userId,
        previous.month,
        previous.year,
        {}
      );
      const previousExpenseTotal =
        previousExpenseResult?.data?.[0]?.total_balance_expenses ??
        previousExpenseResult?.data?.[0]?.total_expenses ??
        0;
      const previousBalance = Math.abs(previousIncomeTotal - toNumber(previousExpenseTotal));

      if (previousBalance !== 0) {
        movements.push(normalizeMovement({
          id: `opening-balance-${year}-${month}`,
          source: 'opening_balance',
          source_id: `${previous.year}-${previous.month}`,
          date: startDate,
          time: '00:00',
          title: 'Saldo anterior',
          detail: `Arrastre de ${String(previous.month).padStart(2, '0')}/${previous.year}`,
          account: 'Dinero disponible',
          method: 'Balance inicial',
          amount: previousBalance,
          status: 'calculado',
        }));
      }

      const { data: incomes, error: incomesError } = await supabase
        .from('incomes')
        .select(`
          id,
          description,
          amount,
          income_date,
          created_at,
          affects_cash_balance,
          available_cards:card_id(name, type, bank)
        `)
        .eq('user_id', userId)
        .gte('income_date', startDate)
        .lt('income_date', endDate);

      if (incomesError) throw incomesError;

      (incomes || []).forEach((income) => {
        const affectsBalance = income.affects_cash_balance !== false;
        movements.push(normalizeMovement({
          id: `income-${income.id}`,
          source: affectsBalance ? 'income' : 'card_credit',
          source_id: income.id,
          date: datePart(income.income_date),
          time: timePart(income.created_at),
          title: income.description || (affectsBalance ? 'Ingreso de dinero' : 'Credito en tarjeta'),
          detail: affectsBalance ? 'Ingreso disponible' : 'Acreditacion en tarjeta',
          account: income.available_cards?.name || 'Dinero disponible',
          method: affectsBalance ? 'Con transferencia' : 'Credito de cuenta',
          amount: affectsBalance ? toNumber(income.amount) : 0,
          reference_amount: toNumber(income.amount),
          affects_balance: affectsBalance,
        }));
      });

      const { data: directRaw, error: directError } = await supabase
        .from('expenses')
        .select(`
          id,
          description,
          amount,
          purchase_date,
          first_installment_date,
          updated_at,
          payment_status_id,
          available_cards(name, type, bank),
          categories(name),
          payment_status(code, label)
        `)
        .eq('user_id', userId)
        .eq('installments_count', 1);

      if (directError) throw directError;

      (directRaw || [])
        .filter((expense) => directExpenseBelongsToPeriod(expense, startDate, endDate))
        .filter((expense) => expense.payment_status?.code === 'pagada' || expense.payment_status_id === 2)
        .forEach((expense) => {
          const cardType = expense.available_cards?.type || 'Cuenta';
          const isCredit = cardType === 'Credito' || cardType === 'Crédito' || cardType === 'CrÃ©dito';
          movements.push(normalizeMovement({
            id: `expense-${expense.id}`,
            source: isCredit ? 'credit_payment' : 'expense',
            source_id: expense.id,
            date: datePart(expense.first_installment_date || expense.purchase_date),
            time: timePart(expense.updated_at),
            title: expense.description || 'Gasto',
            detail: expense.categories?.name || 'Gasto pagado',
            account: expense.available_cards?.name || 'Cuenta',
            method: cardType,
            amount: -toNumber(expense.amount),
            status: 'aprobado',
          }));
        });

      let installmentsDueQuery = supabase
        .from('installments')
        .select(`
          id,
          amount,
          due_date,
          updated_at,
          payment_status_id,
          expenses!inner(
            id,
            user_id,
            description,
            card_id,
            category_id,
            available_cards(name, type, bank),
            categories(name)
          ),
          payment_status(code, label)
        `)
        .eq('expenses.user_id', userId)
        .eq('payment_status_id', 2)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      const { data: installmentsDue, error: installmentsDueError } = await installmentsDueQuery;
      if (installmentsDueError) throw installmentsDueError;

      (installmentsDue || [])
        .filter((installment) => {
          if (!installment.updated_at) return true;
          const paidAt = datePart(installment.updated_at);
          return paidAt >= startDate && paidAt < endDate;
        })
        .forEach((installment) => {
          movements.push(normalizeMovement({
            id: `installment-${installment.id}`,
            source: 'card_payment',
            source_id: installment.id,
            date: datePart(installment.updated_at || installment.due_date),
            time: timePart(installment.updated_at),
            title: installment.expenses?.available_cards?.name || 'Pago de tarjeta',
            detail: installment.expenses?.description || 'Pago de cuota',
            account: installment.expenses?.available_cards?.bank || installment.expenses?.available_cards?.name || 'Tarjeta',
            method: 'Pago de tarjeta',
            amount: -toNumber(installment.amount),
            status: 'aprobado',
          }));
        });

      const { data: advancePaidInstallments, error: advancePaidError } = await supabase
        .from('installments')
        .select(`
          id,
          amount,
          due_date,
          updated_at,
          payment_status_id,
          expenses!inner(
            id,
            user_id,
            description,
            available_cards(name, type, bank),
            categories(name)
          ),
          payment_status(code, label)
        `)
        .eq('expenses.user_id', userId)
        .eq('payment_status_id', 2)
        .gte('updated_at', `${startDate}T00:00:00.000Z`)
        .lt('updated_at', `${endDate}T00:00:00.000Z`);

      if (advancePaidError) throw advancePaidError;

      (advancePaidInstallments || [])
        .filter((installment) => {
          const dueDay = datePart(installment.due_date);
          return !(dueDay >= startDate && dueDay < endDate);
        })
        .forEach((installment) => {
          movements.push(normalizeMovement({
            id: `advance-installment-${installment.id}`,
            source: 'card_payment_advance',
            source_id: installment.id,
            date: datePart(installment.updated_at),
            time: timePart(installment.updated_at),
            title: installment.expenses?.available_cards?.name || 'Pago anticipado',
            detail: installment.expenses?.description || 'Pago de cuota fuera del mes',
            account: installment.expenses?.available_cards?.bank || installment.expenses?.available_cards?.name || 'Tarjeta',
            method: 'Pago anticipado',
            amount: -toNumber(installment.amount),
            status: 'aprobado',
          }));
        });

      const { data: savings, error: savingsError } = await supabase
        .from('savings_records')
        .select('id, type, entry_date, amount_ars, dollars, exchange_rate, note, status, direction, created_at, updated_at')
        .eq('user_id', userId)
        .gte('entry_date', startDate)
        .lt('entry_date', endDate);

      if (savingsError) throw savingsError;

      (savings || []).forEach((saving) => {
        const direction = saving.direction || 'in';
        const status = saving.status || 'ahorrado';
        const amount = toNumber(saving.amount_ars);
        const isWithdrawal = direction === 'out' && status === 'retirado';
        const affectsBalance = direction === 'in' || isWithdrawal;

        movements.push(normalizeMovement({
          id: `saving-${saving.id}`,
          source: isWithdrawal ? 'saving_withdrawal' : direction === 'in' ? 'saving' : 'saving_usage',
          source_id: saving.id,
          date: datePart(saving.entry_date),
          time: timePart(saving.created_at || saving.updated_at),
          title: isWithdrawal ? 'Retiro de ahorro' : direction === 'in' ? 'Dinero reservado' : 'Uso de ahorro',
          detail: saving.note || (saving.type === 'dolares' ? 'Ahorro en USD' : 'Ahorro en pesos'),
          account: saving.type === 'dolares' ? 'Ahorro USD' : 'Ahorro ARS',
          method: isWithdrawal ? 'Vuelve a disponible' : direction === 'in' ? 'Reserva de dinero' : 'Movimiento interno',
          amount: affectsBalance ? (isWithdrawal ? Math.abs(amount) : -Math.abs(amount)) : 0,
          reference_amount: Math.abs(amount),
          affects_balance: affectsBalance,
          status: affectsBalance ? 'aprobado' : 'informativo',
        }));
      });

      const unique = Array.from(new Map(movements.map((movement) => [movement.id, movement])).values());
      const ascending = [...unique].sort(sortMovementsAscending);
      let runningBalance = 0;
      const withRunningBalance = ascending.map((movement) => {
        runningBalance += movement.amount;
        return { ...movement, balance_after: runningBalance };
      });

      const ordered = [...withRunningBalance].sort(sortMovementsDescending);
      const incomeTotal = unique
        .filter((movement) => movement.affects_balance && movement.amount > 0 && movement.source !== 'opening_balance')
        .reduce((sum, movement) => sum + movement.amount, 0);
      const expenseTotal = unique
        .filter((movement) => movement.affects_balance && movement.amount < 0 && movement.source !== 'opening_balance')
        .reduce((sum, movement) => sum + Math.abs(movement.amount), 0);
      const openingBalance = unique
        .filter((movement) => movement.source === 'opening_balance')
        .reduce((sum, movement) => sum + movement.amount, 0);

      return {
        success: true,
        data: {
          period: { month, year, startDate, endDate },
          summary: {
            opening_balance: openingBalance,
            income: incomeTotal,
            outcome: expenseTotal,
            net: openingBalance + incomeTotal - expenseTotal,
            movements_count: ordered.length,
          },
          movements: ordered,
        },
      };
    } catch (error) {
      logger.error('Error getting balance activity:', { error: error.message, userId, month, year });
      throw error;
    }
  }
}

export default ActivityService;
