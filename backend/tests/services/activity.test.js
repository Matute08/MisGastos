import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabase, mockLogger, resetMocks } from '../setup.js';

vi.mock('../../config/database.js', () => ({
  supabase: mockSupabase,
  default: mockSupabase,
}));

vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
}));

let ActivityService;

beforeEach(async () => {
  resetMocks();
  ActivityService = (await import('../../services/activityService.js')).default;
});

function queryResult(data, error = null) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    gte: vi.fn(() => query),
    lt: vi.fn(() => query),
    then: (resolve) => resolve({ data, error }),
  };

  return query;
}

describe('ActivityService.getBalanceActivity', () => {
  it('keeps a negative accumulated opening balance signed for the selected month', async () => {
    mockSupabase.from
      .mockReturnValueOnce(queryResult([
        { amount: 100, affects_cash_balance: true, income_date: '2024-06-05' },
      ]))
      .mockReturnValueOnce(queryResult([
        {
          amount: 600,
          purchase_date: '2024-06-10',
          first_installment_date: null,
          payment_status_id: 2,
          available_cards: { type: 'Debito' },
          payment_status: { code: 'pagada' },
        },
      ]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]));

    const result = await ActivityService.getBalanceActivity('user-1', { month: 7, year: 2024 });

    expect(result.success).toBe(true);
    expect(result.data.summary.opening_balance).toBe(-500);
    expect(result.data.summary.net).toBe(-500);
    expect(result.data.movements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'opening_balance',
          amount: -500,
          balance_after: -500,
        }),
      ])
    );
  });

  it('keeps income, saving withdrawals and selected-period savings separated', async () => {
    const activeSavingsQuery = queryResult([]);

    mockSupabase.from
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([
        {
          id: 'income-1',
          description: 'Salary',
          amount: 300,
          income_date: '2024-07-01',
          created_at: '2024-07-01T10:00:00.000Z',
          affects_cash_balance: true,
          available_cards: null,
        },
      ]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([]))
      .mockReturnValueOnce(queryResult([
        {
          id: 'saving-1',
          type: 'pesos',
          entry_date: '2024-07-02',
          amount_ars: 50,
          status: 'retirado',
          direction: 'out',
          note: 'Retiro de ahorro',
          created_at: '2024-07-02T10:00:00.000Z',
          updated_at: '2024-07-02T10:00:00.000Z',
        },
      ]))
      .mockReturnValueOnce(activeSavingsQuery);

    const result = await ActivityService.getBalanceActivity('user-1', { month: 7, year: 2024 });

    expect(result.success).toBe(true);
    expect(result.data.summary.income).toBe(300);
    expect(result.data.summary.saving_withdrawals).toBe(50);
    expect(result.data.summary.cash_balance).toBe(350);
    expect(result.data.summary.savings_balance).toBe(0);
    expect(result.data.summary.net).toBe(350);
    expect(activeSavingsQuery.lt).toHaveBeenCalledWith('entry_date', '2024-08-01');
  });
});
