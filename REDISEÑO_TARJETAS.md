# Rediseño del Sistema de Tarjetas - MisGastos

## Resumen del Cambio

Se ha rediseñado completamente el sistema de tarjetas para implementar un modelo donde:

1. **Los administradores** son los únicos que pueden crear y gestionar tarjetas disponibles
2. **Los usuarios** pueden vincular/desvincular tarjetas disponibles a su cuenta
3. **Se mantiene la compatibilidad** con el sistema existente

## Arquitectura del Nuevo Sistema

### Base de Datos

#### Tabla: `available_cards`
- **Propósito**: Almacena todas las tarjetas disponibles que los administradores crean
- **Campos**:
  - `id`: UUID único
  - `name`: Nombre de la tarjeta
  - `type`: Tipo (Crédito/Débito)
  - `bank`: Banco emisor
  - `payment_day`: Día de pago (solo crédito)
  - `credit_limit`: Límite de crédito (solo crédito)
  - `created_at`, `updated_at`: Timestamps

#### Tabla: `user_cards`
- **Propósito**: Relación entre usuarios y tarjetas disponibles vinculadas
- **Campos**:
  - `id`: UUID único
  - `user_id`: ID del usuario
  - `available_card_id`: ID de la tarjeta disponible
  - `created_at`: Cuando se vinculó

### Backend

#### Nuevos Servicios
- `AvailableCardsService`: Gestiona tarjetas disponibles (solo admin)
- `UserCardsService`: Gestiona tarjetas vinculadas por usuario

#### Nuevas Rutas
- `/api/available-cards`: CRUD de tarjetas disponibles (solo admin)
- `/api/user-cards`: Gestión de tarjetas vinculadas por usuario

#### Middleware de Seguridad
- `requireAdmin`: Verifica que el usuario sea administrador
- RLS policies en Supabase para seguridad adicional

### Frontend

#### Nuevos Stores
- `useAvailableCardsStore`: Estado de tarjetas disponibles
- `useUserCardsStore`: Estado de tarjetas vinculadas por usuario

#### Nuevas Vistas
- `AdminCardsView.vue`: Gestión de tarjetas disponibles (solo admin)
- `CardsView.vue`: Rediseñada para vincular/desvincular tarjetas

#### Nuevos Componentes
- `AvailableCardModal.vue`: Modal para crear/editar tarjetas disponibles

## Instalación y Configuración

### 1. Ejecutar Script SQL
```sql
-- Ejecutar en Supabase SQL Editor
-- Ver archivo: scripts/create-new-tables.sql
```

### 2. Verificar Rutas en el Backend
El servidor ya incluye las nuevas rutas:
- `/api/available-cards`
- `/api/user-cards`

### 3. Verificar Stores en el Frontend
Los nuevos stores ya están creados y disponibles.

## Flujo de Usuario

### Para Administradores
1. **Crear Tarjetas Disponibles**:
   - Ir a la vista de administración de tarjetas
   - Crear nuevas tarjetas con nombre, tipo, banco, etc.
   - Solo los administradores pueden crear/editar/eliminar

2. **Gestionar Tarjetas Existentes**:
   - Editar información de tarjetas
   - Eliminar tarjetas que ya no estén disponibles

### Para Usuarios
1. **Vincular Tarjetas**:
   - Ver lista de tarjetas disponibles
   - Seleccionar tarjetas para vincular a su cuenta
   - Las tarjetas vinculadas aparecen en "Mis Tarjetas"

2. **Desvincular Tarjetas**:
   - Desde "Mis Tarjetas" pueden desvincular tarjetas
   - Esto no elimina la tarjeta disponible, solo la desvincula del usuario

3. **Usar Tarjetas**:
   - Las tarjetas vinculadas están disponibles para registrar gastos
   - Mantienen toda la información (límite, día de pago, etc.)

## Ventajas del Nuevo Sistema

### Seguridad
- Solo administradores pueden crear tarjetas
- Usuarios no pueden modificar información de tarjetas
- RLS policies en base de datos

### Consistencia
- Todas las tarjetas tienen la misma información
- No hay duplicados de tarjetas similares
- Información centralizada y mantenible

### Escalabilidad
- Fácil agregar nuevas tarjetas para todos los usuarios
- Gestión centralizada de información bancaria
- Posibilidad de agregar más campos en el futuro

### Experiencia de Usuario
- Proceso simple de vinculación
- Vista clara de tarjetas disponibles
- Fácil gestión de tarjetas propias

## Migración de Datos Existentes

### Opción 1: Migración Automática
```sql
-- Migrar tarjetas existentes a available_cards
INSERT INTO available_cards (name, type, bank, created_at)
SELECT DISTINCT name, type, bank, created_at 
FROM cards 
WHERE NOT EXISTS (
    SELECT 1 FROM available_cards ac 
    WHERE ac.name = cards.name 
    AND ac.type = cards.type 
    AND ac.bank = cards.bank
);

-- Migrar relaciones usuario-tarjeta
INSERT INTO user_cards (user_id, available_card_id, created_at)
SELECT c.user_id, ac.id, c.created_at
FROM cards c
JOIN available_cards ac ON c.name = ac.name AND c.type = ac.type AND c.bank = ac.bank;
```

### Opción 2: Migración Manual
1. Crear tarjetas disponibles manualmente
2. Vincular usuarios a las tarjetas correspondientes
3. Eliminar tabla `cards` antigua cuando sea seguro

## Mantenimiento

### Tareas Administrativas
- Revisar y actualizar información de tarjetas
- Agregar nuevas tarjetas cuando sea necesario
- Eliminar tarjetas obsoletas

### Monitoreo
- Verificar que las políticas RLS funcionen correctamente
- Monitorear uso de tarjetas por usuario
- Revisar logs de creación/edición de tarjetas

## Consideraciones Futuras

### Posibles Mejoras
- Historial de cambios en tarjetas disponibles
- Notificaciones cuando se actualicen tarjetas
- Estadísticas de uso por tarjeta
- Integración con APIs bancarias para información actualizada

### Compatibilidad
- El sistema mantiene compatibilidad con gastos existentes
- Las referencias a tarjetas se mantienen a través de `user_cards`
- No se requieren cambios en el sistema de gastos

## Soporte

Para dudas o problemas con el nuevo sistema:
1. Revisar logs del backend
2. Verificar políticas RLS en Supabase
3. Comprobar permisos de usuario
4. Revisar consola del navegador para errores del frontend
