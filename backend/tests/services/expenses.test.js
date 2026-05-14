import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabase, mockLogger, builder, resetMocks } from '../setup.js';
import { directExpenseBelongsToPeriod } from '../../services/expenses/helpers.js';

vi.mock('../../config/database.js', () => ({
  supabase: mockSupabase,
  default: mockSupabase,
}));

vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
}));

let ExpensesService;
let getExpenses;
let getPaymentStatus;
let markAsPaid;

beforeEach(async () => {
  resetMocks();
  ExpensesService = (await import('../../services/expensesService.js')).default;
  getExpenses = (await import('../../services/expensesService.js')).getExpenses;
  getPaymentStatus = (await import('../../services/expenses/installments.js')).getPaymentStatus;
  markAsPaid = (await import('../../services/expenses/core.js')).markAsPaid;
});

describe('directExpenseBelongsToPeriod', () => {
  it('should include expense in period when purchase_date is within range for debit cards', () => {
    const expense = {
      purchase_date: '2024-06-15',
      available_cards: { type: 'Débito' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(true);
  });

  it('should exclude expense when purchase_date is before period', () => {
    const expense = {
      purchase_date: '2024-05-31',
      available_cards: { type: 'Débito' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(false);
  });

  it('should exclude expense when purchase_date is after period', () => {
    const expense = {
      purchase_date: '2024-07-01',
      available_cards: { type: 'Débito' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(false);
  });

  it('should use first_installment_date for credit cards when present', () => {
    const expense = {
      purchase_date: '2024-05-15',
      first_installment_date: '2024-06-10',
      available_cards: { type: 'Crédito' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(true);
  });

  it('should fall back to purchase_date for credit cards without first_installment_date', () => {
    const expense = {
      purchase_date: '2024-06-15',
      available_cards: { type: 'Crédito' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(true);
  });

  it('should handle transfer type same as debit', () => {
    const expense = {
      purchase_date: '2024-06-20',
      available_cards: { type: 'Transferencia' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(true);
  });

  it('should return false for null purchase_date', () => {
    const expense = {
      purchase_date: null,
      available_cards: { type: 'Débito' },
    };
    const result = directExpenseBelongsToPeriod(expense, '2024-06-01', '2024-07-01');
    expect(result).toBe(false);
  });
});

describe('getExpenses', () => {
  it('should return empty array when no expenses found', async () => {
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getExpenses('user-1');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  it('should throw error on database error', async () => {
    builder.order.mockResolvedValue({ data: null, error: new Error('Database error') });

    await expect(getExpenses('user-1')).rejects.toThrow('Database error');
  });

  it('should apply card_id filter when provided', async () => {
    builder.order.mockResolvedValue({ data: [{ id: '1', description: 'Test', amount: 100 }], error: null });

    const result = await getExpenses('user-1', { card_id: 'card-1' });
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  it('should apply month and year filters correctly', async () => {
    builder.order.mockResolvedValue({ data: [], error: null });

    await getExpenses('user-1', { month: '6', year: '2024' });
    expect(builder.gte).toHaveBeenCalledWith('purchase_date', '2024-06-01');
  });

  it('should ignore invalid month values', async () => {
    builder.order.mockResolvedValue({ data: [], error: null });

    const result = await getExpenses('user-1', { month: '13', year: '2024' });
    expect(result.success).toBe(true);
  });
});

describe('getPaymentStatus', () => {
  it('should return payment statuses', async () => {
    builder.order.mockResolvedValue({
      data: [
        { id: 1, code: 'pendiente', label: 'Pendiente' },
        { id: 2, code: 'pagada', label: 'Pagada' },
      ],
      error: null,
    });

    const result = await getPaymentStatus();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  it('should throw error on database error', async () => {
    builder.order.mockResolvedValue({ data: null, error: new Error('DB error') });

    await expect(getPaymentStatus()).rejects.toThrow('DB error');
  });
});

describe('markAsPaid', () => {
  it('should throw error when expense not found', async () => {
    builder.single.mockResolvedValue({ data: null, error: new Error('Gasto no encontrado') });

    await expect(markAsPaid('nonexistent-id', 2)).rejects.toThrow('Gasto no encontrado');
  });

  it('should update payment status successfully', async () => {
    builder.single
      .mockResolvedValueOnce({ data: { id: 'exp-1' }, error: null })
      .mockResolvedValueOnce({ data: { id: 'exp-1', payment_status_id: 2 }, error: null });

    const result = await markAsPaid('exp-1', 2);
    expect(result.success).toBe(true);
    expect(result.data.payment_status_id).toBe(2);
  });
});
