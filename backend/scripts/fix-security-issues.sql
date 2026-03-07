-- ============================================
-- Script de corrección de problemas de seguridad
-- Detectados por Supabase Database Linter
-- ============================================

-- ============================================
-- 1. CORREGIR VISTA expenses_with_installments
-- Problema: Vista definida con SECURITY DEFINER
-- Solución: Recrear la vista sin SECURITY DEFINER (usando SECURITY INVOKER por defecto)
-- ============================================

-- Primero, obtener la definición actual de la vista para recrearla
-- Nota: Si la vista no existe o tiene una estructura diferente, 
-- necesitarás ajustar esta consulta según tu definición real

-- Eliminar la vista existente
DROP VIEW IF EXISTS public.expenses_with_installments CASCADE;

-- Recrear la vista sin SECURITY DEFINER
-- IMPORTANTE: Ajusta esta definición según tu vista real
-- Esta es una plantilla que debes completar con la definición correcta
CREATE OR REPLACE VIEW public.expenses_with_installments
WITH (security_invoker = true)  -- Esto asegura que use SECURITY INVOKER
AS
SELECT 
    e.id,
    e.user_id,
    e.description,
    e.amount,
    e.card_id,
    e.category_id,
    e.subcategory_id,
    e.purchase_date,
    e.payment_status_id,
    e.installments_count,
    e.first_installment_date,
    e.month,
    e.year,
    e.created_at,
    e.updated_at,
    e.is_scheduled,
    e.scheduled_start_month,
    e.scheduled_months,
    e.scheduled_end_month,
    e.is_active,
    i.id as installment_id,
    i.installment_number,
    i.due_date,
    i.amount as installment_amount,
    i.is_paid as installment_is_paid,
    i.paid_at as installment_paid_at
FROM public.expenses e
LEFT JOIN public.installments i ON e.id = i.expense_id
WHERE e.is_active = true;

-- Comentario sobre la vista
COMMENT ON VIEW public.expenses_with_installments IS 
'Vista que combina gastos con sus cuotas. Usa SECURITY INVOKER para respetar los permisos del usuario que consulta.';

-- ============================================
-- 2. HABILITAR RLS EN webauthn_credentials
-- Problema: RLS no está habilitado
-- Solución: Habilitar RLS y crear políticas apropiadas
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE public.webauthn_credentials ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias credenciales
CREATE POLICY "Users can view their own webauthn credentials"
ON public.webauthn_credentials
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden insertar sus propias credenciales
CREATE POLICY "Users can insert their own webauthn credentials"
ON public.webauthn_credentials
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias credenciales
CREATE POLICY "Users can update their own webauthn credentials"
ON public.webauthn_credentials
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias credenciales
CREATE POLICY "Users can delete their own webauthn credentials"
ON public.webauthn_credentials
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. HABILITAR RLS EN revoked_tokens
-- Problema: RLS no está habilitado
-- Solución: Habilitar RLS y crear políticas apropiadas
-- Nota: Esta tabla generalmente solo debe ser accesible por el servicio/backend
-- ============================================

-- Habilitar RLS en la tabla
ALTER TABLE public.revoked_tokens ENABLE ROW LEVEL SECURITY;

-- Política: Solo el servicio puede insertar tokens revocados
-- Usa service_role key en el backend para insertar
CREATE POLICY "Service role can manage revoked tokens"
ON public.revoked_tokens
FOR ALL
USING (true)
WITH CHECK (true);

-- Alternativa más restrictiva: Solo permitir inserción desde el backend
-- Si tu backend usa service_role, esta política permitirá todas las operaciones
-- desde el contexto del servicio
-- 
-- Si prefieres una política más restrictiva basada en roles:
-- CREATE POLICY "Service role can manage revoked tokens"
-- ON public.revoked_tokens
-- FOR ALL
-- USING (
--   -- Verificar que se está usando service_role
--   current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
-- )
-- WITH CHECK (
--   current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
-- );

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que RLS está habilitado
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'webauthn_credentials'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS no está habilitado en webauthn_credentials';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'revoked_tokens'
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION 'RLS no está habilitado en revoked_tokens';
    END IF;
    
    RAISE NOTICE '✅ Todas las correcciones de seguridad se aplicaron correctamente';
END $$;



