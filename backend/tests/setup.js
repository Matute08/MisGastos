import { vi } from 'vitest';

class MockBuilder {
  constructor() {
    this.select = vi.fn(() => this);
    this.insert = vi.fn(() => this);
    this.update = vi.fn(() => this);
    this.delete = vi.fn(() => this);
    this.eq = vi.fn(() => this);
    this.gte = vi.fn(() => this);
    this.lt = vi.fn(() => this);
    this.in = vi.fn(() => this);
    this.ilike = vi.fn(() => this);

    this.single = vi.fn().mockResolvedValue({ data: null, error: null });
    this.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    this.order = vi.fn().mockResolvedValue({ data: [], error: null });
    this.limit = vi.fn().mockResolvedValue({ data: [], error: null });
  }

  then(resolve) {
    resolve(this._thenData || { data: null, error: null });
  }
}

let builder = new MockBuilder();

const mockFrom = vi.fn(() => builder);

const mockSupabase = {
  from: mockFrom,
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    admin: {
      getUserById: vi.fn(),
    },
  },
  rpc: vi.fn(),
};

const mockLogger = {
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  debug: vi.fn(),
};

export function resetMocks() {
  builder = new MockBuilder();
  mockFrom.mockClear();
  mockSupabase.auth.signUp.mockClear();
  mockSupabase.auth.signInWithPassword.mockClear();
  mockSupabase.auth.admin.getUserById.mockClear();
  mockSupabase.rpc.mockClear();
  mockLogger.info.mockClear();
  mockLogger.warn.mockClear();
  mockLogger.error.mockClear();
  mockLogger.debug.mockClear();
}

export { mockSupabase, mockLogger, builder };
