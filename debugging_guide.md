# Guía de Debugging - Problemas con Creación de Gastos

## 🔍 Pasos para Identificar el Problema

### 1. Verificar la Consola del Navegador

Abre las herramientas de desarrollador (F12) y ve a la pestaña **Console**. Busca estos mensajes:

```
ExpenseModal: Iniciando creación de gasto
ExpenseModal: Datos del gasto a crear: {...}
ExpensesView: Guardando gasto: {...}
ExpensesView: Creando nuevo gasto
Creando gasto con datos: {...}
Supabase: Creando gasto con datos: {...}
Supabase: Respuesta de creación: {...}
```

### 2. Verificar Errores Comunes

#### Error 1: "Usuario no autenticado"
**Síntoma**: Mensaje en consola: "Usuario no autenticado"
**Solución**: Verificar que el usuario esté logueado correctamente

#### Error 2: "RLS policy violation"
**Síntoma**: Error de Supabase relacionado con políticas RLS
**Solución**: Verificar que las políticas RLS estén configuradas correctamente

#### Error 3: "Foreign key constraint"
**Síntoma**: Error de clave foránea
**Solución**: Verificar que card_id y category_id existan en la base de datos

#### Error 4: "Trigger error"
**Síntoma**: Error en la función create_installments_for_expense
**Solución**: Verificar que el trigger esté funcionando correctamente

### 3. Verificar la Base de Datos

Ejecuta este script en Supabase SQL Editor:

```sql
-- Verificar que las tablas existen
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('expenses', 'installments', 'cards', 'categories');

-- Verificar que las funciones existen
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%installment%';

-- Verificar que los triggers existen
SELECT trigger_name FROM information_schema.triggers 
WHERE trigger_schema = 'public' 
  AND event_object_table = 'expenses';
```

### 4. Probar Creación Manual

Ejecuta este script para probar la creación manual:

```sql
-- Reemplazar 'TU_USER_ID' con tu ID de usuario real
INSERT INTO expenses (
  user_id, 
  card_id, 
  category_id, 
  description, 
  amount, 
  purchase_date, 
  installments_count, 
  is_paid
) VALUES (
  'TU_USER_ID',
  (SELECT id FROM cards WHERE user_id = 'TU_USER_ID' LIMIT 1),
  (SELECT id FROM categories WHERE user_id = 'TU_USER_ID' LIMIT 1),
  'Test manual',
  10000,
  '2024-05-15',
  3,
  false
);
```

### 5. Verificar Variables de Entorno

Asegúrate de que estas variables estén configuradas en tu archivo `.env`:

```env
VITE_SUPABASE_URL=tu_url_de_supabase
VITE_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
```

### 6. Verificar Autenticación

En la consola del navegador, ejecuta:

```javascript
// Verificar si el usuario está autenticado
console.log('Usuario actual:', await supabase.auth.getUser())

// Verificar la sesión
console.log('Sesión actual:', await supabase.auth.getSession())
```

### 7. Verificar Datos del Formulario

En el ExpenseModal, verifica que todos los campos requeridos estén completos:

```javascript
// En la consola del navegador
console.log('Datos del formulario:', form.value)
```

### 8. Probar con Datos Mínimos

Intenta crear un gasto con datos mínimos:

```javascript
const testData = {
  description: 'Test',
  amount: 1000,
  card_id: 'uuid-de-tu-tarjeta',
  category_id: 'uuid-de-tu-categoria',
  purchase_date: '2024-05-15',
  installments_count: 1,
  is_paid: false
}
```

## 🛠️ Soluciones Comunes

### Problema 1: No se crean las cuotas automáticamente

**Causa**: El trigger no está funcionando
**Solución**: Ejecutar el script `fix_installments_logic.sql`

### Problema 2: Error de permisos

**Causa**: Políticas RLS mal configuradas
**Solución**: Verificar que las políticas permitan INSERT en expenses

### Problema 3: Error de validación

**Causa**: Datos del formulario inválidos
**Solución**: Verificar que todos los campos requeridos estén completos

### Problema 4: Error de red

**Causa**: Problemas de conectividad con Supabase
**Solución**: Verificar la conexión a internet y las credenciales de Supabase

## 📋 Checklist de Verificación

- [ ] Usuario autenticado correctamente
- [ ] Variables de entorno configuradas
- [ ] Tablas creadas en la base de datos
- [ ] Funciones y triggers instalados
- [ ] Políticas RLS configuradas
- [ ] Datos del formulario válidos
- [ ] Conexión a Supabase funcionando

## 🚨 Si Nada Funciona

1. **Revisar logs de Supabase**: Ve a Supabase Dashboard → Logs
2. **Verificar permisos**: Asegúrate de que tu usuario tenga permisos para INSERT
3. **Probar en modo incógnito**: Para descartar problemas de caché
4. **Revisar versiones**: Asegúrate de que todas las dependencias estén actualizadas

## 📞 Información para Debugging

Cuando reportes el problema, incluye:

1. **Mensajes de error** de la consola
2. **Datos del formulario** que intentaste enviar
3. **Resultado del script de prueba** de la base de datos
4. **Versión de Vue** y otras dependencias
5. **Configuración de Supabase** (sin credenciales sensibles) 