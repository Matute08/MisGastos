-- ============================================
-- Script para obtener la definición de la vista
-- expenses_with_installments
-- ============================================
-- 
-- Ejecuta este script primero para ver cómo está definida
-- la vista actualmente, luego copia la definición y úsala
-- en el script de corrección.
-- ============================================

-- Obtener la definición completa de la vista
SELECT pg_get_viewdef('public.expenses_with_installments', true) AS view_definition;

-- También puedes ver información adicional sobre la vista
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'expenses_with_installments';

-- Verificar si la vista tiene SECURITY DEFINER
SELECT 
    n.nspname AS schema_name,
    c.relname AS view_name,
    CASE 
        WHEN c.relkind = 'v' THEN 'VIEW'
        ELSE 'OTHER'
    END AS object_type,
    -- Verificar propiedades de seguridad
    (SELECT string_agg(option_name || '=' || option_value, ', ')
     FROM pg_options_to_table(c.reloptions)
    ) AS view_options
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
AND c.relname = 'expenses_with_installments';



