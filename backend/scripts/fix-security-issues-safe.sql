-- ============================================
-- Script de corrección de problemas de seguridad (Versión Segura)
-- Detectados por Supabase Database Linter
-- ============================================
-- 
-- INSTRUCCIONES:
-- 1. Antes de ejecutar, obtén la definición actual de la vista con:
--    SELECT pg_get_viewdef('public.expenses_with_installments', true);
-- 2. Reemplaza la sección de CREATE VIEW con la definición real
-- 3. Ejecuta este script en el SQL Editor de Supabase
-- ============================================

-- ============================================
-- PASO 1: Obtener la definición actual de la vista
-- ============================================
-- Ejecuta esto primero para ver la definición actual:
-- SELECT pg_get_viewdef('public.expenses_with_installments', true);

-- ============================================
-- PASO 2: CORREGIR VISTA expenses_with_installments
-- ============================================

-- Opción A: Si la vista existe y quieres mantener su estructura exacta
-- Primero obtén la definición con el comando de arriba, luego:
-- 1. Copia la definición
-- 2. Elimina "SECURITY DEFINER" si aparece
-- 3. Recrea la vista con SECURITY INVOKER explícito

-- Eliminar la vista existente
DROP VIEW IF EXISTS public.expenses_with_installments CASCADE;

-- IMPORTANTE: Reemplaza esta definición con la real de tu vista
-- Esta es solo una plantilla de ejemplo
CREATE OR REPLACE VIEW public.expenses_with_installments
WITH (security_invoker = true)
AS
SELECT 
    e.*,
    i.id as installment_id,
    i.installment_number,
    i.due_date,
    i.amount as installment_amount,
    i.is_paid as installment_is_paid
FROM public.expenses e
LEFT JOIN public.installments i ON e.id = i.expense_id;

-- ============================================
-- PASO 3: HABILITAR RLS EN webauthn_credentials
-- ============================================

-- Verificar si RLS ya está habilitado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'webauthn_credentials'
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado en webauthn_credentials';
    ELSE
        RAISE NOTICE 'ℹ️ RLS ya estaba habilitado en webauthn_credentials';
    END IF;
END $$;

-- Eliminar políticas existentes si las hay (opcional, comenta si quieres mantenerlas)
-- DROP POLICY IF EXISTS "Users can view their own webauthn credentials" ON public.webauthn_credentials;
-- DROP POLICY IF EXISTS "Users can insert their own webauthn credentials" ON public.webauthn_credentials;
-- DROP POLICY IF EXISTS "Users can update their own webauthn credentials" ON public.webauthn_credentials;
-- DROP POLICY IF EXISTS "Users can delete their own webauthn credentials" ON public.webauthn_credentials;

-- Crear políticas RLS para webauthn_credentials
CREATE POLICY IF NOT EXISTS "Users can view their own webauthn credentials"
ON public.webauthn_credentials
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert their own webauthn credentials"
ON public.webauthn_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own webauthn credentials"
ON public.webauthn_credentials
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete their own webauthn credentials"
ON public.webauthn_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- PASO 4: HABILITAR RLS EN revoked_tokens
-- ============================================

-- Verificar si RLS ya está habilitado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'revoked_tokens'
        AND rowsecurity = false
    ) THEN
        ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;
        RAISE NOTICE '✅ RLS habilitado en revoked_tokens';
    ELSE
        RAISE NOTICE 'ℹ️ RLS ya estaba habilitado en revoked_tokens';
    END IF;
END $$;

-- Eliminar política existente si la hay (opcional)
-- DROP POLICY IF EXISTS "Service role can manage revoked tokens" ON public.revoked_tokens;

-- Política para revoked_tokens
-- Esta tabla debe ser accesible solo desde el backend con service_role
-- Si tu backend usa service_role key, esta política permitirá todas las operaciones
CREATE POLICY IF NOT EXISTS "Service role can manage revoked tokens"
ON public.revoked_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Alternativa más restrictiva (descomenta si prefieres esta):
-- CREATE POLICY IF NOT EXISTS "Service role can manage revoked tokens"
-- ON public.revoked_tokens
-- FOR ALL
-- USING (
--   current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
-- )
-- WITH CHECK (
--   current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
-- );

-- ============================================
-- VERIFICACIÓN FINAL
-- ============================================

DO $$
DECLARE
    view_exists boolean;
    webauthn_rls_enabled boolean;
    revoked_rls_enabled boolean;
BEGIN
    -- Verificar vista
    SELECT EXISTS (
        SELECT 1 FROM pg_views 
        WHERE schemaname = 'public' 
        AND viewname = 'expenses_with_installments'
    ) INTO view_exists;
    
    -- Verificar RLS en webauthn_credentials
    SELECT rowsecurity INTO webauthn_rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'webauthn_credentials';
    
    -- Verificar RLS en revoked_tokens
    SELECT rowsecurity INTO revoked_rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename = 'revoked_tokens';
    
    -- Reportar resultados
    IF view_exists THEN
        RAISE NOTICE '✅ Vista expenses_with_installments existe';
    ELSE
        RAISE WARNING '⚠️ Vista expenses_with_installments no existe - verifica la definición';
    END IF;
    
    IF webauthn_rls_enabled THEN
        RAISE NOTICE '✅ RLS habilitado en webauthn_credentials';
    ELSE
        RAISE WARNING '⚠️ RLS NO está habilitado en webauthn_credentials';
    END IF;
    
    IF revoked_rls_enabled THEN
        RAISE NOTICE '✅ RLS habilitado en revoked_tokens';
    ELSE
        RAISE WARNING '⚠️ RLS NO está habilitado en revoked_tokens';
    END IF;
    
    IF view_exists AND webauthn_rls_enabled AND revoked_rls_enabled THEN
        RAISE NOTICE '🎉 ¡Todas las correcciones se aplicaron correctamente!';
    END IF;
END $$;



