-- Script para agregar columnas de gastos programados a la tabla expenses
-- Ejecutar este script en la base de datos PostgreSQL

-- Agregar columnas para gastos programados
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS scheduled_start_month DATE,
ADD COLUMN IF NOT EXISTS scheduled_months INTEGER,
ADD COLUMN IF NOT EXISTS scheduled_end_month DATE,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Crear índices para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_expenses_is_scheduled ON expenses(is_scheduled);
CREATE INDEX IF NOT EXISTS idx_expenses_scheduled_start_month ON expenses(scheduled_start_month);
CREATE INDEX IF NOT EXISTS idx_expenses_is_active ON expenses(is_active);

-- Crear índice compuesto para consultas de gastos programados activos
CREATE INDEX IF NOT EXISTS idx_expenses_scheduled_active ON expenses(is_scheduled, is_active, scheduled_start_month);

-- Comentarios para documentar las nuevas columnas
COMMENT ON COLUMN expenses.is_scheduled IS 'Indica si el gasto es parte de una serie programada';
COMMENT ON COLUMN expenses.scheduled_start_month IS 'Fecha de inicio del gasto programado (primer día del mes)';
COMMENT ON COLUMN expenses.scheduled_months IS 'Número de meses que se repetirá el gasto (NULL para indefinido)';
COMMENT ON COLUMN expenses.scheduled_end_month IS 'Fecha de fin del gasto programado (NULL si es indefinido)';
COMMENT ON COLUMN expenses.is_active IS 'Indica si el gasto programado está activo o cancelado';

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'expenses' 
AND column_name IN ('is_scheduled', 'scheduled_start_month', 'scheduled_months', 'scheduled_end_month', 'is_active')
ORDER BY column_name;
