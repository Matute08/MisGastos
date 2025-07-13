# Ejemplos de Uso - Sistema de Cuotas Mensuales

## 1. Registrar un gasto en cuotas

### Ejemplo: Compra de $60,000 en 6 cuotas desde mayo

```javascript
// Datos del gasto
const expenseData = {
  description: "Notebook Dell Inspiron",
  amount: 60000,
  card_id: "uuid-de-tarjeta-credito",
  category_id: "uuid-categoria-tecnologia",
  purchase_date: "2024-05-15",
  installments_count: 6,
  is_paid: false
}

// El sistema automáticamente:
// 1. Crea el gasto principal
// 2. Genera 6 cuotas de $10,000 cada una
// 3. Calcula las fechas de vencimiento basándose en el día de cierre de la tarjeta
```

### Resultado esperado:
- **Gasto principal**: $60,000 (mayo 2024)
- **Cuota 1**: $10,000 - vence junio 2024
- **Cuota 2**: $10,000 - vence julio 2024
- **Cuota 3**: $10,000 - vence agosto 2024
- **Cuota 4**: $10,000 - vence septiembre 2024
- **Cuota 5**: $10,000 - vence octubre 2024
- **Cuota 6**: $10,000 - vence noviembre 2024

## 2. Consultar gastos y cuotas por mes

### Ejemplo: Ver todos los gastos de julio 2024

```javascript
// Filtrar por mes y año
const filters = {
  month: 7,  // Julio
  year: 2024
}

// El sistema devuelve:
// 1. Gastos directos realizados en julio
// 2. Todas las cuotas que vencen en julio (de compras anteriores)
```

### Resultado esperado para julio 2024:
- **Gastos directos**: $25,000 (compras realizadas en julio)
- **Cuotas que vencen**: $15,000 (cuotas de compras anteriores)
- **Total combinado**: $40,000

## 3. Marcar cuotas como pagadas

### Ejemplo: Marcar cuota como pagada

```javascript
// Marcar cuota específica como pagada
await expensesStore.markInstallmentAsPaid(installmentId, true)

// El sistema:
// 1. Actualiza el estado de la cuota
// 2. Recalcula los totales del mes
// 3. Actualiza el progreso del gasto principal
```

## 4. Editar un gasto con cuotas

### Ejemplo: Cambiar de 6 a 12 cuotas

```javascript
// Editar el gasto
const updatedExpense = {
  ...expenseData,
  installments_count: 12  // Cambiar de 6 a 12 cuotas
}

// El sistema automáticamente:
// 1. Elimina las cuotas existentes
// 2. Crea 12 nuevas cuotas de $5,000 cada una
// 3. Recalcula las fechas de vencimiento
```

## 5. Consultas SQL útiles

### Obtener todas las cuotas de un gasto
```sql
SELECT * FROM installments 
WHERE expense_id = 'uuid-del-gasto' 
ORDER BY due_date ASC;
```

### Obtener cuotas que vencen en un mes específico
```sql
SELECT * FROM monthly_installments 
WHERE user_id = 'uuid-usuario' 
  AND installment_month = 7 
  AND installment_year = 2024;
```

### Obtener resumen de cuotas por gasto
```sql
SELECT * FROM get_expense_installments_summary('uuid-del-gasto');
```

### Obtener totales mensuales con cuotas
```sql
SELECT * FROM get_monthly_total_with_installments('uuid-usuario', 7, 2024);
```

## 6. Flujo completo de uso

### Paso 1: Configurar tarjeta de crédito
```sql
INSERT INTO cards (user_id, name, type, bank, closing_day) 
VALUES ('uuid-usuario', 'Visa Banco Galicia', 'Crédito', 'Banco Galicia', 15);
```

### Paso 2: Registrar gasto en cuotas
```javascript
// Frontend: Usar ExpenseModal
const expenseData = {
  description: "iPhone 15 Pro",
  amount: 1200000,
  card_id: "uuid-tarjeta",
  category_id: "uuid-categoria",
  purchase_date: "2024-05-20",
  installments_count: 12,
  is_paid: false
}

await expensesStore.createExpense(expenseData)
```

### Paso 3: Ver gastos del mes
```javascript
// Filtrar por mes específico
expensesStore.updateFilters({ month: 7, year: 2024 })
await expensesStore.loadMonthlyExpensesWithInstallments(7, 2024)
```

### Paso 4: Marcar cuotas como pagadas
```javascript
// En la interfaz, hacer clic en el checkbox de la cuota
await expensesStore.markInstallmentAsPaid(installmentId, true)
```

## 7. Casos de uso especiales

### Caso 1: Compra después del día de cierre
- **Compra**: 20 de mayo
- **Día de cierre**: 15 de mayo
- **Resultado**: Primera cuota vence en junio (mes siguiente)

### Caso 2: Compra antes del día de cierre
- **Compra**: 10 de mayo
- **Día de cierre**: 15 de mayo
- **Resultado**: Primera cuota vence en mayo (mismo mes)

### Caso 3: Editar número de cuotas
- **Original**: 6 cuotas de $20,000
- **Editado**: 12 cuotas de $10,000
- **Resultado**: Sistema recalcula automáticamente

## 8. Beneficios del sistema

1. **Visibilidad completa**: Ve todos los gastos y cuotas de cada mes
2. **Control de pagos**: Marca cuotas individuales como pagadas
3. **Cálculo automático**: Totales incluyen gastos directos + cuotas
4. **Flexibilidad**: Edita gastos y las cuotas se actualizan automáticamente
5. **Organización**: Distingue entre gastos directos y cuotas en la interfaz

## 9. Consideraciones técnicas

### Base de datos
- Triggers automáticos para crear cuotas
- Vistas optimizadas para consultas
- Índices para rendimiento
- Funciones para cálculos complejos

### Frontend
- Componentes reutilizables
- Estado reactivo con Pinia
- Filtros dinámicos
- Interfaz intuitiva

### Seguridad
- Row Level Security (RLS)
- Validaciones en frontend y backend
- Políticas de acceso por usuario 