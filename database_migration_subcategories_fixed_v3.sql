-- Script SQL corregido para agregar subcategorías (Versión 3)
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_name ON subcategories(name);

-- 3. Agregar columna subcategory_id a la tabla expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- 4. Crear trigger para updated_at en subcategories
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subcategories_updated_at 
    BEFORE UPDATE ON subcategories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Crear nueva vista con subcategorías (usando nombre temporal)
CREATE OR REPLACE VIEW expenses_with_installments_new AS
SELECT 
    e.id,
    e.user_id,
    e.card_id,
    e.category_id,
    e.subcategory_id,
    e.description,
    e.amount,
    e.purchase_date,
    e.installments_count,
    e.created_at,
    e.updated_at,
    c.name AS card_name,
    c.type AS card_type,
    c.bank AS card_bank,
    cat.name AS category_name,
    cat.color AS category_color,
    sub.name AS subcategory_name,
    sub.color AS subcategory_color,
    COALESCE(count(i.id), (0)::bigint) AS total_installments,
    COALESCE(count(
        CASE
            WHEN ((ps.code)::text = 'Paid'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS paid_installments,
    COALESCE(count(
        CASE
            WHEN ((ps.code)::text = 'Pending'::text) THEN 1
            ELSE NULL::integer
        END), (0)::bigint) AS pending_installments,
    COALESCE(sum(
        CASE
            WHEN ((ps.code)::text = 'Pending'::text) THEN i.amount
            ELSE (0)::numeric
        END), (0)::numeric) AS pending_amount
FROM (((((expenses e
    LEFT JOIN cards c ON (e.card_id = c.id))
    LEFT JOIN categories cat ON (e.category_id = cat.id))
    LEFT JOIN subcategories sub ON (e.subcategory_id = sub.id))
    LEFT JOIN installments i ON (e.id = i.expense_id))
    LEFT JOIN payment_status ps ON (i.payment_status_id = ps.id))
GROUP BY e.id, c.name, c.type, c.bank, cat.name, cat.color, sub.name, sub.color;

-- 6. Eliminar la vista antigua y renombrar la nueva
DROP VIEW IF EXISTS expenses_with_installments;
ALTER VIEW expenses_with_installments_new RENAME TO expenses_with_installments;

-- 7. Configurar RLS (Row Level Security) para subcategories
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Política para permitir a todos ver subcategorías
CREATE POLICY "Allow all to view subcategories" ON subcategories
    FOR SELECT USING (true);

-- Política para permitir crear subcategorías (se manejará desde el backend)
CREATE POLICY "Allow authenticated users to create subcategories" ON subcategories
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Política para permitir actualizar subcategorías (se manejará desde el backend)
CREATE POLICY "Allow authenticated users to update subcategories" ON subcategories
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Política para permitir eliminar subcategorías (se manejará desde el backend)
CREATE POLICY "Allow authenticated users to delete subcategories" ON subcategories
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 8. Crear función para obtener categorías con sus subcategorías
CREATE OR REPLACE FUNCTION get_categories_with_subcategories()
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR,
    category_color VARCHAR,
    subcategory_id UUID,
    subcategory_name VARCHAR,
    subcategory_color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        s.id as subcategory_id,
        s.name as subcategory_name,
        s.color as subcategory_color
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    ORDER BY c.name, s.name;
END;
$$ LANGUAGE plpgsql;

-- 9. Crear función para obtener subcategorías por categoría
CREATE OR REPLACE FUNCTION get_subcategories_by_category(category_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.color,
        s.created_at,
        s.updated_at
    FROM subcategories s
    WHERE s.category_id = category_uuid
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear función para obtener una subcategoría por ID
CREATE OR REPLACE FUNCTION get_subcategory_by_id(subcategory_uuid UUID)
RETURNS TABLE (
    id UUID,
    category_id UUID,
    name VARCHAR,
    color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.category_id,
        s.name,
        s.color,
        s.created_at,
        s.updated_at
    FROM subcategories s
    WHERE s.id = subcategory_uuid;
END;
$$ LANGUAGE plpgsql;

-- Mensaje de confirmación
SELECT 'Migración de subcategorías completada exitosamente' as status; 