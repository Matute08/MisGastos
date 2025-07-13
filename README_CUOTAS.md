# Sistema de Cuotas Mensuales - Control de Gastos

## 🚀 Funcionalidades Implementadas

### ✅ Gestión Completa de Cuotas
- **Creación automática**: Al registrar un gasto con tarjeta de crédito en cuotas, el sistema genera automáticamente todas las cuotas mensuales
- **Cálculo inteligente**: Las fechas de vencimiento se calculan basándose en el día de cierre de la tarjeta
- **Estado individual**: Cada cuota puede marcarse como "Pagada" o "Pendiente" independientemente

### ✅ Vista Mensual Integrada
- **Gastos + Cuotas**: Al seleccionar un mes, ves tanto los gastos directos como todas las cuotas que vencen ese mes
- **Totales combinados**: El sistema calcula automáticamente el total incluyendo gastos directos + cuotas del mes
- **Filtros avanzados**: Filtra por tarjeta, categoría, estado de pago, etc.

### ✅ Edición Flexible
- **Modificar cuotas**: Cambia el número de cuotas y el sistema recalcula automáticamente
- **Actualización en tiempo real**: Las cuotas se actualizan inmediatamente al editar un gasto
- **Preservación de datos**: Mantiene el historial de pagos cuando es posible

## 📊 Estructura de Base de Datos

### Tablas Principales
```sql
-- Gastos principales
expenses (
  id, user_id, card_id, category_id, description, amount,
  purchase_date, installments_count, is_paid, month, year
)

-- Cuotas individuales
installments (
  id, expense_id, installment_number, amount, due_date, is_paid
)
```

### Vistas Optimizadas
```sql
-- Vista para gastos con información de cuotas
expenses_with_installments

-- Vista para cuotas por mes
monthly_installments

-- Función para obtener gastos + cuotas por mes
get_monthly_expenses_with_installments(user_id, month, year)
```

## 🛠️ Instalación y Configuración

### 1. Ejecutar Scripts SQL
```bash
# Script principal de base de datos
psql -d your_database -f database.sql

# Script de mejoras para cuotas
psql -d your_database -f installments_enhancements.sql
```

### 2. Configurar Variables de Entorno
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Instalar Dependencias
```bash
npm install
```

### 4. Ejecutar la Aplicación
```bash
npm run dev
```

## 📱 Uso de la Aplicación

### Registrar un Gasto en Cuotas
1. Ve a la sección "Gastos"
2. Haz clic en "Nuevo Gasto"
3. Completa la información del gasto
4. Selecciona "En cuotas" como tipo de pago
5. Especifica el número de cuotas
6. El sistema automáticamente:
   - Crea el gasto principal
   - Genera todas las cuotas
   - Calcula las fechas de vencimiento

### Ver Gastos por Mes
1. En la sección "Gastos"
2. Selecciona un mes y año específicos
3. El sistema muestra:
   - Gastos directos del mes
   - Todas las cuotas que vencen ese mes
   - Totales combinados

### Marcar Cuotas como Pagadas
1. En la vista mensual, busca la cuota
2. Haz clic en el botón de estado
3. La cuota cambia a "Pagada"
4. Los totales se actualizan automáticamente

### Editar un Gasto con Cuotas
1. Haz clic en el botón "Editar"
2. Modifica el número de cuotas si es necesario
3. Guarda los cambios
4. El sistema recalcula automáticamente todas las cuotas

## 🔧 Componentes Principales

### ExpenseModal.vue
- Formulario para crear/editar gastos
- Cálculo automático de fechas de cuotas
- Validaciones de tarjeta de crédito
- Información en tiempo real de cuotas

### InstallmentsList.vue
- Lista de cuotas de un gasto
- Checkbox para marcar como pagada
- Barra de progreso de pagos
- Resumen de cuotas pagadas/pendientes

### ExpensesView.vue
- Vista principal de gastos
- Filtros por mes/año
- Tabla con gastos y cuotas
- Totales combinados

## 📈 Funciones del Store

### useExpensesStore
```javascript
// Cargar gastos con cuotas por mes
loadMonthlyExpensesWithInstallments(month, year)

// Cargar totales mensuales
loadMonthlyTotals(month, year)

// Marcar cuota como pagada
markInstallmentAsPaid(installmentId, isPaid)

// Obtener resumen de cuotas
getExpenseInstallmentsSummary(expenseId)
```

## 🎯 Casos de Uso

### Ejemplo 1: Compra de $60,000 en 6 cuotas
- **Compra**: 15 de mayo 2024
- **Tarjeta**: Cierre día 15
- **Resultado**: 6 cuotas de $10,000 desde junio hasta noviembre

### Ejemplo 2: Vista de julio 2024
- **Gastos directos**: $25,000
- **Cuotas que vencen**: $15,000
- **Total**: $40,000

### Ejemplo 3: Editar cuotas
- **Original**: 6 cuotas de $20,000
- **Editado**: 12 cuotas de $10,000
- **Resultado**: Sistema recalcula automáticamente

## 🔒 Seguridad

### Row Level Security (RLS)
- Usuarios solo ven sus propios gastos y cuotas
- Políticas de acceso por usuario
- Validaciones en frontend y backend

### Validaciones
- Número de cuotas entre 1 y 24
- Solo tarjetas de crédito permiten cuotas
- Fechas de vencimiento válidas

## 🚀 Próximas Mejoras

- [ ] Notificaciones de cuotas próximas a vencer
- [ ] Exportar reportes de cuotas
- [ ] Gráficos de progreso de pagos
- [ ] Integración con calendario
- [ ] Recordatorios automáticos

## 📞 Soporte

Para dudas o problemas:
1. Revisa la documentación en `ejemplos_uso_cuotas.md`
2. Verifica los logs de la consola
3. Consulta los scripts SQL para entender la estructura

---

**¡El sistema de cuotas está completamente funcional y listo para usar!** 🎉 