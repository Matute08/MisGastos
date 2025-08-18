-- Script para crear las nuevas tablas del sistema de tarjetas disponibles
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de tarjetas disponibles (solo admin puede crear/editar)
CREATE TABLE IF NOT EXISTS available_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Crédito', 'Débito')),
    bank VARCHAR(255) NOT NULL,
    payment_day INTEGER CHECK (payment_day >= 1 AND payment_day <= 31),
    credit_limit DECIMAL(15,2) CHECK (credit_limit >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear tabla de tarjetas vinculadas por usuario
CREATE TABLE IF NOT EXISTS user_cards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    available_card_id UUID NOT NULL REFERENCES available_cards(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, available_card_id) -- Evitar duplicados
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_available_cards_type ON available_cards(type);
CREATE INDEX IF NOT EXISTS idx_available_cards_bank ON available_cards(bank);
CREATE INDEX IF NOT EXISTS idx_user_cards_user_id ON user_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_cards_available_card_id ON user_cards(available_card_id);

-- 4. Crear RLS (Row Level Security) policies
ALTER TABLE available_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;

-- Policy para available_cards: todos pueden leer, solo admin puede crear/editar/eliminar
CREATE POLICY "available_cards_read_policy" ON available_cards
    FOR SELECT USING (true);

CREATE POLICY "available_cards_admin_policy" ON available_cards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Policy para user_cards: usuarios solo pueden ver/modificar sus propias tarjetas
CREATE POLICY "user_cards_user_policy" ON user_cards
    FOR ALL USING (user_id = auth.uid());

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crear trigger para actualizar updated_at en available_cards
CREATE TRIGGER update_available_cards_updated_at 
    BEFORE UPDATE ON available_cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Insertar algunas tarjetas de ejemplo (opcional)
INSERT INTO available_cards (name, type, bank, payment_day, credit_limit) VALUES
('Visa Santander', 'Crédito', 'Santander', 15, 150000.00),
('Mastercard Galicia', 'Crédito', 'Galicia', 20, 200000.00),
('Débito Pampa', 'Débito', 'Banco Pampa', NULL, NULL),
('Débito Nación', 'Débito', 'Banco Nación', NULL, NULL),
('Mercado Pago Crédito', 'Crédito', 'Mercado Pago', 25, 100000.00),
('Débito Transferencia', 'Débito', 'Todos', NULL, NULL)
ON CONFLICT DO NOTHING;

-- 8. Comentarios sobre el uso
COMMENT ON TABLE available_cards IS 'Tarjetas disponibles que los administradores pueden crear para que los usuarios las vinculen';
COMMENT ON TABLE user_cards IS 'Relación entre usuarios y tarjetas disponibles que han vinculado';
COMMENT ON COLUMN available_cards.payment_day IS 'Día del mes para el pago (solo tarjetas de crédito)';
COMMENT ON COLUMN available_cards.credit_limit IS 'Límite de crédito (solo tarjetas de crédito)';
