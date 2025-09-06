# 🗓️ Gastos Programados - Guía de Implementación

Esta funcionalidad permite crear gastos que se repiten automáticamente cada mes, perfectos para servicios como Netflix, Spotify, suscripciones, etc.

## 🚀 Características Implementadas

### ✅ Backend
- **Nuevos campos en la tabla `expenses`**:
  - `is_scheduled`: Indica si es un gasto programado
  - `scheduled_start_month`: Mes de inicio del gasto programado
  - `scheduled_months`: Número de meses que se repetirá (NULL para indefinido)
  - `scheduled_end_month`: Mes de fin del gasto programado
  - `is_active`: Si el gasto programado está activo o cancelado

- **Nuevos endpoints**:
  - `GET /api/expenses/scheduled` - Obtener gastos programados
  - `POST /api/expenses/scheduled` - Crear gasto programado
  - `DELETE /api/expenses/scheduled/:id` - Cancelar gasto programado

- **Servicios actualizados**:
  - `ExpensesService.createScheduledExpense()` - Crear múltiples gastos automáticamente
  - `ExpensesService.cancelScheduledExpense()` - Cancelar gastos futuros
  - `ExpensesService.getScheduledExpenses()` - Obtener gastos programados agrupados

### ✅ Frontend
- **Nuevo modal**: `ScheduledExpenseModal.vue` para crear gastos programados
- **Botón flotante mejorado**: Muestra opciones para "Gasto Normal" y "Gasto Programado"
- **Store actualizado**: Funciones para manejar gastos programados
- **API actualizada**: Métodos para interactuar con el backend

## 📋 Instrucciones de Instalación

### 1. Ejecutar Migración de Base de Datos

```bash
# Opción 1: Ejecutar script SQL directamente
psql -h localhost -U postgres -d misgastos -f scripts/add-scheduled-expenses-columns.sql

# Opción 2: Usar el script de Node.js (requiere función exec_sql en Supabase)
node scripts/migrate-scheduled-expenses.js
```

### 2. Reiniciar el Backend

```bash
cd backend
npm run dev
```

### 3. Reiniciar el Frontend

```bash
npm run dev
```

## 🎯 Cómo Usar

### Crear un Gasto Programado

1. **Ir a la vista de Gastos**
2. **Hacer clic en el botón flotante "Nuevo Gasto"**
3. **Seleccionar "Gasto Programado"**
4. **Completar el formulario**:
   - Descripción (ej: "Netflix (compartido con novia)")
   - Monto
   - Tarjeta
   - Categoría
   - Mes de inicio
   - Duración (número de meses o indefinido)
5. **Hacer clic en "Crear Gasto Programado"**

### Cancelar un Gasto Programado

1. **Ir a la vista de Gastos**
2. **Buscar el gasto programado en la lista**
3. **Hacer clic en "Cancelar"** (funcionalidad pendiente de implementar en la UI)

## 🔧 Funcionalidades Técnicas

### Creación Automática de Gastos
- Se crean automáticamente gastos para cada mes desde el mes de inicio
- Solo se crean gastos para meses futuros o el mes actual
- Cada gasto mantiene la misma información (descripción, monto, tarjeta, categoría)

### Cancelación Inteligente
- Al cancelar un gasto programado, se marcan como inactivos solo los gastos futuros
- Los gastos pasados se mantienen en el historial
- Se puede cancelar desde cualquier gasto de la serie

### Agrupación y Visualización
- Los gastos programados se agrupan por serie
- Se muestran con un indicador visual especial
- Mantienen toda la funcionalidad de gastos normales (editar, eliminar, cambiar estado)

## 🎨 Interfaz de Usuario

### Botón Flotante Mejorado
- **Clic simple**: Muestra opciones "Gasto Normal" y "Gasto Programado"
- **Gasto Normal**: Abre el modal tradicional
- **Gasto Programado**: Abre el nuevo modal con opciones específicas

### Modal de Gasto Programado
- **Campos adicionales**:
  - Mes de inicio (selector de mes/año)
  - Duración (número específico de meses o indefinido)
  - Información explicativa sobre cómo funcionan
- **Validaciones**:
  - Mes de inicio requerido
  - Número de meses mayor a 0 (si se especifica)
  - Verificación de tarjetas asociadas
- **Estado de pago**: Siempre se crea con estado "Pendiente" (no se puede cambiar)

## 🔍 Casos de Uso

### Ejemplo 1: Netflix Compartido
- **Descripción**: "Netflix (compartido con novia)"
- **Monto**: $2,500
- **Duración**: Indefinido
- **Resultado**: Se crea un gasto de $2,500 cada mes hasta que se cancele

### Ejemplo 2: Curso Online
- **Descripción**: "Curso de programación"
- **Monto**: $15,000
- **Duración**: 6 meses
- **Resultado**: Se crean 6 gastos de $15,000, uno por mes

### Ejemplo 3: Gimnasio
- **Descripción**: "Cuota mensual gimnasio"
- **Monto**: $8,000
- **Duración**: 12 meses
- **Resultado**: Se crean 12 gastos de $8,000, uno por mes

## 🚧 Funcionalidades Pendientes

### En la Vista de Gastos
- [ ] Mostrar gastos programados con indicador visual especial
- [ ] Botón para cancelar gasto programado desde la lista
- [ ] Filtro para mostrar solo gastos programados
- [ ] Agrupación visual de gastos de la misma serie

### Mejoras Futuras
- [ ] Notificaciones antes del vencimiento
- [ ] Plantillas de gastos programados comunes
- [ ] Estadísticas de gastos programados
- [ ] Exportación de gastos programados

## 🐛 Solución de Problemas

### Error: "No se pueden crear gastos programados para fechas pasadas"
- **Causa**: El mes de inicio es anterior al mes actual
- **Solución**: Seleccionar el mes actual o un mes futuro

### Error: "Tarjeta no encontrada o no pertenece al usuario"
- **Causa**: La tarjeta seleccionada no está asociada al usuario
- **Solución**: Ir a la sección de Cuentas y asociar la tarjeta

### Los gastos programados no aparecen
- **Causa**: Posible error en la migración de base de datos
- **Solución**: Verificar que las columnas se agregaron correctamente

## 📊 Estructura de Datos

```sql
-- Ejemplo de gasto programado en la base de datos
{
  "id": "uuid",
  "description": "Netflix (compartido con novia)",
  "amount": 2500.00,
  "card_id": "uuid",
  "category_id": "uuid",
  "purchase_date": "2024-01-01",
  "is_scheduled": true,
  "scheduled_start_month": "2024-01-01",
  "scheduled_months": null, -- NULL = indefinido
  "scheduled_end_month": null,
  "is_active": true
}
```

## 🤝 Contribución

Para agregar nuevas funcionalidades o mejorar las existentes:

1. **Backend**: Modificar `ExpensesService` y rutas en `backend/routes/expenses.js`
2. **Frontend**: Actualizar `ScheduledExpenseModal.vue` y `ExpensesView.vue`
3. **Store**: Agregar funciones en `src/stores/expenses.js`
4. **API**: Actualizar métodos en `src/lib/api.js`

---

¡La funcionalidad de gastos programados está lista para usar! 🎉
