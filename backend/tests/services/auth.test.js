import { vi, describe, it, expect, beforeEach } from 'vitest';
import { mockSupabase, mockLogger, builder, resetMocks } from '../setup.js';

vi.mock('../../config/database.js', () => ({
  supabase: mockSupabase,
  default: mockSupabase,
}));

vi.mock('../../utils/logger.js', () => ({
  default: mockLogger,
}));

const { AuthService } = await import('../../services/authService.js');

beforeEach(() => {
  resetMocks();
});

describe('AuthService.hashToken', () => {
  it('should produce a SHA256 hash of 64 hex characters', () => {
    const hash = AuthService.hashToken('test-token-123');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should produce deterministic output for same input', () => {
    const hash1 = AuthService.hashToken('my-token');
    const hash2 = AuthService.hashToken('my-token');
    expect(hash1).toBe(hash2);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = AuthService.hashToken('token-a');
    const hash2 = AuthService.hashToken('token-b');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty string', () => {
    const hash = AuthService.hashToken('');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('AuthService.getTokenExpiration', () => {
  it('should return null for invalid token string', () => {
    const result = AuthService.getTokenExpiration('not-a-jwt');
    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = AuthService.getTokenExpiration('');
    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = AuthService.getTokenExpiration(null);
    expect(result).toBeNull();
  });
});

function makeTestJwt(exp = Math.floor(Date.now() / 1000) + 3600) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ exp })).toString('base64url');
  return `${header}.${payload}.test-signature`;
}

describe('AuthService.revokeToken', () => {
  const validJwt = makeTestJwt();

  it('should return false when supabase insert fails with non-23505 error', async () => {
    builder._thenData = { data: null, error: { message: 'Insert error', code: 'UNIQUE' } };

    const result = await AuthService.revokeToken(validJwt);
    expect(result).toBe(false);
  });

  it('should return true when insert has 23505 (duplicate) error', async () => {
    builder._thenData = { data: null, error: { message: 'Duplicate', code: '23505' } };

    const result = await AuthService.revokeToken(validJwt);
    expect(result).toBe(true);
  });

  it('should return true when token is revoked successfully', async () => {
    builder._thenData = { data: { id: '1' }, error: null };

    const result = await AuthService.revokeToken(validJwt);
    expect(result).toBe(true);
  });
});

describe('AuthService.isTokenRevoked', () => {
  it('should return true when token is found in revoked_tokens', async () => {
    builder.single.mockResolvedValue({ data: { id: '1', token_hash: 'abc123' }, error: null });

    const result = await AuthService.isTokenRevoked('revoked-token');
    expect(result).toBe(true);
  });

  it('should return false when token is not found (PGRST116)', async () => {
    builder.single.mockResolvedValue({ data: null, error: { message: 'No rows found', code: 'PGRST116' } });

    const result = await AuthService.isTokenRevoked('valid-token');
    expect(result).toBe(false);
  });

  it('should return false on unexpected error', async () => {
    builder.single.mockResolvedValue({ data: null, error: { message: 'Connection error', code: 'NETWORK' } });

    const result = await AuthService.isTokenRevoked('some-token');
    expect(result).toBe(false);
  });
});

describe('AuthService.cleanupExpiredTokens', () => {
  it('should return 0 on error', async () => {
    builder._thenData = { data: null, error: { message: 'Delete failed', code: 'ERR' } };

    const result = await AuthService.cleanupExpiredTokens();
    expect(result).toBe(0);
  });

  it('should return count of deleted tokens', async () => {
    builder._thenData = { data: [{ id: '1' }, { id: '2' }], error: null };

    const result = await AuthService.cleanupExpiredTokens();
    expect(result).toBe(2);
  });

  it('should return 0 when no tokens deleted', async () => {
    builder._thenData = { data: [], error: null };

    const result = await AuthService.cleanupExpiredTokens();
    expect(result).toBe(0);
  });
});

describe('AuthService.validateToken', () => {
  it('should return false when token is revoked', async () => {
    builder.single.mockResolvedValue({ data: { id: '1' }, error: null });

    const result = await AuthService.validateToken('revoked-token');
    expect(result).toBe(false);
  });

  it('should return false when token verification fails', async () => {
    builder.single.mockResolvedValueOnce({ data: null, error: { message: 'Not found', code: 'PGRST116' } })
      .mockResolvedValueOnce({ data: { id: '1' }, error: null });

    const result = await AuthService.validateToken('invalid-token');
    expect(result).toBe(false);
  });
});

describe('AuthService.register validation flow', () => {
  it('should throw error when supabase signUp fails', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: null },
      error: { message: 'Email already registered' },
    });

    await expect(AuthService.register({
      email: 'existing@test.com',
      password: 'password123',
    })).rejects.toThrow('Email already registered');
  });

  it('should throw error when role lookup fails', async () => {
    mockSupabase.auth.signUp.mockResolvedValue({
      data: { user: { id: 'new-user-id' } },
      error: null,
    });

    builder.single.mockResolvedValue({ data: null, error: { message: 'Role not found', code: 'PGRST116' } });

    await expect(AuthService.register({
      email: 'test@test.com',
      password: 'password123',
    })).rejects.toThrow('No se pudo obtener el rol por defecto');
  });
});
