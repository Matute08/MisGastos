-- Script para agregar funcionalidad de subcategorías
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

-- 4. Agregar columna subcategory_id a la tabla expenses_with_installments
ALTER TABLE expenses_with_installments ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crear trigger para subcategorías
CREATE TRIGGER update_subcategories_updated_at 
    BEFORE UPDATE ON subcategories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Crear vista para obtener categorías con sus subcategorías
CREATE OR REPLACE VIEW categories_with_subcategories AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    c.created_at as category_created_at,
    c.updated_at as category_updated_at,
    s.id as subcategory_id,
    s.name as subcategory_name,
    s.color as subcategory_color,
    s.created_at as subcategory_created_at,
    s.updated_at as subcategory_updated_at
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
ORDER BY c.name, s.name;

-- 8. Crear RLS (Row Level Security) para subcategorías
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver subcategorías
CREATE POLICY "Subcategories are viewable by everyone" ON subcategories
    FOR SELECT USING (true);

-- Política para que solo admins puedan crear subcategorías
CREATE POLICY "Subcategories are insertable by admins" ON subcategories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_perfil up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.nombre = 'admin'
        )
    );

-- Política para que solo admins puedan actualizar subcategorías
CREATE POLICY "Subcategories are updatable by admins" ON subcategories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios_perfil up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.nombre = 'admin'
        )
    );

-- Política para que solo admins puedan eliminar subcategorías
CREATE POLICY "Subcategories are deletable by admins" ON subcategories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios_perfil up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.nombre = 'admin'
        )
    );

-- 9. Insertar algunas subcategorías de ejemplo para categorías existentes
-- Primero, vamos a crear algunas subcategorías para categorías que probablemente existan
-- (Esto es opcional, puedes ejecutarlo después de crear las categorías)

-- Ejemplo para categoría "Compras" (asumiendo que existe con id específico)
-- INSERT INTO subcategories (category_id, name, color) VALUES 
-- ('ID_DE_CATEGORIA_COMPRAS', 'Ropa', '#EF4444'),
-- ('ID_DE_CATEGORIA_COMPRAS', 'Joyas', '#F59E0B'),
-- ('ID_DE_CATEGORIA_COMPRAS', 'Salud', '#10B981'),
-- ('ID_DE_CATEGORIA_COMPRAS', 'Casa y Jardín', '#3B82F6'),
-- ('ID_DE_CATEGORIA_COMPRAS', 'Mascotas', '#8B5CF6'),
-- ('ID_DE_CATEGORIA_COMPRAS', 'Regalos', '#EC4899');

-- Ejemplo para categoría "Transporte" (asumiendo que existe)
-- INSERT INTO subcategories (category_id, name, color) VALUES 
-- ('ID_DE_CATEGORIA_TRANSPORTE', 'Combustible', '#EF4444'),
-- ('ID_DE_CATEGORIA_TRANSPORTE', 'Transporte Público', '#10B981'),
-- ('ID_DE_CATEGORIA_TRANSPORTE', 'Taxi/Uber', '#F59E0B'),
-- ('ID_DE_CATEGORIA_TRANSPORTE', 'Mantenimiento', '#3B82F6');

-- Ejemplo para categoría "Entretenimiento" (asumiendo que existe)
-- INSERT INTO subcategories (category_id, name, color) VALUES 
-- ('ID_DE_CATEGORIA_ENTRETENIMIENTO', 'Cine', '#EF4444'),
-- ('ID_DE_CATEGORIA_ENTRETENIMIENTO', 'Restaurantes', '#10B981'),
-- ('ID_DE_CATEGORIA_ENTRETENIMIENTO', 'Eventos', '#F59E0B'),
-- ('ID_DE_CATEGORIA_ENTRETENIMIENTO', 'Streaming', '#3B82F6'),
-- ('ID_DE_CATEGORIA_ENTRETENIMIENTO', 'Juegos', '#8B5CF6');

-- 10. Crear función para obtener categorías con subcategorías
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

-- 11. Crear función para obtener subcategorías de una categoría específica
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