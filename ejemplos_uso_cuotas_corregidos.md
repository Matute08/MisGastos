# Ejemplos Corregidos - Sistema de Cuotas Mensuales

## 🎯 Reglas Correctas de Tarjetas de Crédito

### Regla 1: Compra ANTES del día de cierre
- **Fecha de compra**: 15 de mayo
- **Día de cierre**: 24 de mayo
- **Resultado**: Primera cuota en **junio** (próximo mes)

### Regla 2: Compra DESPUÉS del día de cierre
- **Fecha de compra**: 25 de mayo
- **Día de cierre**: 24 de mayo
- **Resultado**: Primera cuota en **julio** (dos meses después)

## 📊 Ejemplos Prácticos

### Ejemplo 1: Compra ANTES del día de cierre

```sql
-- Configuración de tarjeta
INSERT INTO cards (user_id, name, type, bank, closing_day) 
VALUES ('uuid-usuario', 'Visa Banco Galicia', 'Crédito', 'Banco Galicia', 24);

-- Gasto en cuotas
INSERT INTO expenses (user_id, card_id, description, amount, purchase_date, installments_count) 
VALUES ('uuid-usuario', 'uuid-tarjeta', 'iPhone 15 Pro', 1200000, '2024-05-15', 6);
```

**Resultado esperado:**
- **Compra**: 15 de mayo 2024 (ANTES del día 24)
- **Cuota 1**: 15 de junio 2024
- **Cuota 2**: 15 de julio 2024
- **Cuota 3**: 15 de agosto 2024
- **Cuota 4**: 15 de septiembre 2024
- **Cuota 5**: 15 de octubre 2024
- **Cuota 6**: 15 de noviembre 2024

### Ejemplo 2: Compra DESPUÉS del día de cierre

```sql
-- Misma tarjeta, compra posterior al cierre
INSERT INTO expenses (user_id, card_id, description, amount, purchase_date, installments_count) 
VALUES ('uuid-usuario', 'uuid-tarjeta', 'MacBook Pro', 2400000, '2024-05-25', 6);
```

**Resultado esperado:**
- **Compra**: 25 de mayo 2024 (DESPUÉS del día 24)
- **Cuota 1**: 25 de julio 2024 (dos meses después)
- **Cuota 2**: 25 de agosto 2024
- **Cuota 3**: 25 de septiembre 2024
- **Cuota 4**: 25 de octubre 2024
- **Cuota 5**: 25 de noviembre 2024
- **Cuota 6**: 25 de diciembre 2024

## 🔍 Consultas de Verificación

### Verificar cuotas existentes
```sql
SELECT * FROM check_installments_summary();
```

### Probar lógica con diferentes fechas
```sql
-- Compra antes del cierre
SELECT * FROM test_installment_logic('2024-05-15', 24, 6);

-- Compra después del cierre
SELECT * FROM test_installment_logic('2024-05-25', 24, 6);
```

### Ver cuotas que vencen en un mes específico
```sql
-- Todas las cuotas que vencen en julio 2024
SELECT * FROM monthly_installments 
WHERE user_id = 'uuid-usuario' 
  AND installment_month = 7 
  AND installment_year = 2024;
```

## 📱 Uso en la Aplicación

### 1. Registrar gasto en cuotas
1. Ve a "Gastos" → "Nuevo Gasto"
2. Completa la información del gasto
3. Selecciona "En cuotas" como tipo de pago
4. Especifica el número de cuotas
5. El sistema automáticamente calcula las fechas correctas

### 2. Ver gastos por mes
1. En la sección "Gastos"
2. Selecciona un mes específico (ej: julio 2024)
3. El sistema muestra:
   - Gastos directos de julio
   - **TODAS las cuotas que vencen en julio** (incluyendo cuotas de compras de mayo/junio)

### 3. Ejemplo de vista mensual
**Julio 2024:**
- **Gastos directos**: $50,000 (compras realizadas en julio)
- **Cuotas que vencen**: 
  - $200,000 (cuota de iPhone comprado en mayo)
  - $400,000 (cuota de MacBook comprado en mayo)
- **Total combinado**: $650,000

## 🛠️ Scripts de Corrección

### 1. Aplicar correcciones a la base de datos
```bash
# Ejecutar en Supabase SQL Editor
psql -d your_database -f fix_installments_logic.sql
```

### 2. Recalcular cuotas existentes (OPCIONAL)
```sql
-- Solo si tienes datos existentes que necesitan corrección
SELECT recalculate_all_installments();
```

### 3. Verificar el estado
```sql
-- Verificar que las cuotas se calcularon correctamente
SELECT * FROM check_installments_summary();
```

## 🎯 Casos de Uso Específicos

### Caso 1: Tarjeta con cierre día 15
- **Compra 10 de mayo**: Primera cuota 10 de junio ✅
- **Compra 20 de mayo**: Primera cuota 20 de julio ✅

### Caso 2: Tarjeta con cierre día 30
- **Compra 25 de mayo**: Primera cuota 25 de junio ✅
- **Compra 31 de mayo**: Primera cuota 31 de julio ✅

### Caso 3: Sin día de cierre definido
- **Cualquier compra**: Primera cuota en el próximo mes ✅

## 🔧 Funciones SQL Útiles

### Obtener gastos y cuotas por mes
```sql
SELECT * FROM get_monthly_expenses_with_installments('uuid-usuario', 7, 2024);
```

### Obtener totales mensuales
```sql
SELECT * FROM get_monthly_total_with_installments('uuid-usuario', 7, 2024);
```

### Resumen de cuotas por gasto
```sql
SELECT * FROM get_expense_installments_summary('uuid-gasto');
```

## ✅ Verificación de Funcionamiento

### Paso 1: Crear tarjeta de prueba
```sql
INSERT INTO cards (user_id, name, type, bank, closing_day) 
VALUES ('uuid-usuario', 'Tarjeta Test', 'Crédito', 'Banco Test', 24);
```

### Paso 2: Crear gastos de prueba
```sql
-- Compra antes del cierre
INSERT INTO expenses (user_id, card_id, description, amount, purchase_date, installments_count) 
VALUES ('uuid-usuario', 'uuid-tarjeta', 'Test Antes', 60000, '2024-05-15', 6);

-- Compra después del cierre
INSERT INTO expenses (user_id, card_id, description, amount, purchase_date, installments_count) 
VALUES ('uuid-usuario', 'uuid-tarjeta', 'Test Después', 60000, '2024-05-25', 6);
```

### Paso 3: Verificar resultados
```sql
-- Verificar cuotas generadas
SELECT * FROM installments WHERE expense_id IN (
  SELECT id FROM expenses WHERE description LIKE 'Test%'
) ORDER BY expense_id, installment_number;
```

## 🚀 Beneficios de la Corrección

1. **Lógica correcta**: Ahora respeta las reglas reales de tarjetas de crédito
2. **Visibilidad completa**: Ve todas las cuotas que vencen en cada mes
3. **Cálculos precisos**: Los totales mensuales incluyen cuotas correctamente
4. **Flexibilidad**: Edita gastos y las cuotas se recalculan automáticamente

---

**¡La lógica de cuotas ahora funciona correctamente según las reglas de las tarjetas de crédito!** 🎉 