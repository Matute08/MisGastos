-- Script para crear tabla de tokens revocados (Refresh Token Rotation)
-- Ejecutar este script en el SQL Editor de Supabase

-- Crear tabla para almacenar tokens revocados
CREATE TABLE IF NOT EXISTS revoked_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Crear índice para mejorar el rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token_hash ON revoked_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_expires_at ON revoked_tokens(expires_at);

-- Crear función para limpiar tokens expirados automáticamente
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM revoked_tokens
  WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Comentarios para documentar la tabla
COMMENT ON TABLE revoked_tokens IS 'Almacena tokens JWT revocados para implementar Refresh Token Rotation';
COMMENT ON COLUMN revoked_tokens.token_hash IS 'Hash SHA256 del token JWT revocado (no almacenamos el token completo por seguridad)';
COMMENT ON COLUMN revoked_tokens.expires_at IS 'Fecha de expiración del token (se usa para limpieza automática)';
COMMENT ON COLUMN revoked_tokens.created_at IS 'Fecha en que el token fue revocado';

-- Opcional: Crear trigger o cron job para limpiar tokens expirados periódicamente
-- (Supabase tiene pg_cron disponible, pero requiere configuración adicional)
-- Por ahora, la limpieza se puede hacer manualmente o desde el backend



