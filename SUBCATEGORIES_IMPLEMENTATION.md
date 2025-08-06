# Implementación de Subcategorías

Esta guía te ayudará a implementar la funcionalidad de subcategorías en tu aplicación MisGastos.

## 📋 Resumen de Cambios

La funcionalidad de subcategorías permite:
- Crear subcategorías dentro de cada categoría
- Seleccionar tanto categoría como subcategoría al crear gastos
- Administrar subcategorías (solo para administradores)
- Visualizar subcategorías en la vista de categorías

## 🗄️ Base de Datos

### 1. Ejecutar el Script SQL

Ejecuta el script `database_migration_subcategories.sql` en el SQL Editor de Supabase:

```sql
-- Script para agregar funcionalidad de subcategorías
-- Ejecutar en Supabase SQL Editor

-- 1. Crear tabla de subcategorías
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Agregar índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_name ON subcategories(name);

-- 3. Agregar columna subcategory_id a la tabla expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- 4. Agregar columna subcategory_id a la tabla expenses_with_installments
ALTER TABLE expenses_with_installments ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- 5. Crear función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Crear trigger para subcategorías
CREATE TRIGGER update_subcategories_updated_at 
    BEFORE UPDATE ON subcategories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Crear vista para obtener categorías con sus subcategorías
CREATE OR REPLACE VIEW categories_with_subcategories AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.color as category_color,
    c.created_at as category_created_at,
    c.updated_at as category_updated_at,
    s.id as subcategory_id,
    s.name as subcategory_name,
    s.color as subcategory_color,
    s.created_at as subcategory_created_at,
    s.updated_at as subcategory_updated_at
FROM categories c
LEFT JOIN subcategories s ON c.id = s.category_id
ORDER BY c.name, s.name;

-- 8. Crear RLS (Row Level Security) para subcategorías
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;

-- Política para que todos puedan ver subcategorías
CREATE POLICY "Subcategories are viewable by everyone" ON subcategories
    FOR SELECT USING (true);

-- Política para que solo admins puedan crear subcategorías
CREATE POLICY "Subcategories are insertable by admins" ON subcategories
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM usuarios_perfil up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.nombre = 'admin'
        )
    );

-- Política para que solo admins puedan actualizar subcategorías
CREATE POLICY "Subcategories are updatable by admins" ON subcategories
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM usuarios_perfil up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.nombre = 'admin'
        )
    );

-- Política para que solo admins puedan eliminar subcategorías
CREATE POLICY "Subcategories are deletable by admins" ON subcategories
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM usuarios_perfil up
            JOIN roles r ON up.role_id = r.id
            WHERE up.id = auth.uid() AND r.nombre = 'admin'
        )
    );

-- 9. Crear función para obtener categorías con subcategorías
CREATE OR REPLACE FUNCTION get_categories_with_subcategories()
RETURNS TABLE (
    category_id UUID,
    category_name VARCHAR,
    category_color VARCHAR,
    subcategory_id UUID,
    subcategory_name VARCHAR,
    subcategory_color VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id as category_id,
        c.name as category_name,
        c.color as category_color,
        s.id as subcategory_id,
        s.name as subcategory_name,
        s.color as subcategory_color
    FROM categories c
    LEFT JOIN subcategories s ON c.id = s.category_id
    ORDER BY c.name, s.name;
END;
$$ LANGUAGE plpgsql;

-- 10. Crear función para obtener subcategorías de una categoría específica
CREATE OR REPLACE FUNCTION get_subcategories_by_category(category_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.name,
        s.color,
        s.created_at,
        s.updated_at
    FROM subcategories s
    WHERE s.category_id = category_uuid
    ORDER BY s.name;
END;
$$ LANGUAGE plpgsql;
```

### 2. Insertar Subcategorías de Ejemplo (Opcional)

Ejecuta el script `scripts/insert-sample-subcategories.js` para insertar subcategorías de ejemplo:

```bash
cd backend
node ../scripts/insert-sample-subcategories.js
```

## 🔧 Backend

### 1. Nuevos Archivos Creados

- `backend/services/subcategoriesService.js` - Servicio para manejar subcategorías
- `backend/routes/subcategories.js` - Rutas para la API de subcategorías

### 2. Archivos Modificados

- `backend/server.js` - Agregadas rutas de subcategorías
- `backend/services/expensesService.js` - Actualizado para incluir subcategorías en gastos

### 3. Verificar Cambios

Asegúrate de que los siguientes cambios estén aplicados:

#### En `backend/server.js`:
```javascript
import subcategoriesRoutes from './routes/subcategories.js';

// En las rutas:
app.use('/api/subcategories', subcategoriesRoutes);
```

#### En `backend/services/expensesService.js`:
- Agregado `subcategories(name, color)` en las consultas SELECT
- Agregado `subcategory_id` en los datos de inserción

## 🎨 Frontend

### 1. Nuevos Archivos Creados

- `src/stores/subcategories.js` - Store de Pinia para subcategorías
- `src/components/SubcategoryModal.vue` - Modal para crear/editar subcategorías

### 2. Archivos Modificados

- `src/lib/api.js` - Agregadas funciones para subcategorías
- `src/views/CategoriesView.vue` - Actualizada para mostrar subcategorías
- `src/components/ExpenseModal.vue` - Agregado campo de subcategoría

### 3. Verificar Cambios

#### En `src/lib/api.js`:
```javascript
export const subcategories = {
  async getSubcategories() { /* ... */ },
  async getSubcategoriesByCategory(categoryId) { /* ... */ },
  async getCategoriesWithSubcategories() { /* ... */ },
  async createSubcategory(subcategoryData) { /* ... */ },
  async updateSubcategory(id, updates) { /* ... */ },
  async deleteSubcategory(id) { /* ... */ },
  async getSubcategoryById(id) { /* ... */ }
};
```

#### En `src/views/CategoriesView.vue`:
- Importado `useSubcategoriesStore`
- Agregada sección de subcategorías en cada categoría
- Agregados botones para crear/editar/eliminar subcategorías

#### En `src/components/ExpenseModal.vue`:
- Agregado campo `subcategory_id` en el formulario
- Agregado selector de subcategorías que se actualiza según la categoría seleccionada

## 🚀 Cómo Usar

### Para Administradores:

1. **Crear Subcategorías:**
   - Ve a la sección "Categorías"
   - Haz clic en "Agregar" junto a una categoría
   - Completa el formulario con nombre y color
   - Guarda la subcategoría

2. **Editar Subcategorías:**
   - Haz clic en el menú de tres puntos junto a una subcategoría
   - Selecciona "Editar"
   - Modifica los datos y guarda

3. **Eliminar Subcategorías:**
   - Haz clic en el menú de tres puntos junto a una subcategoría
   - Selecciona "Eliminar"
   - Confirma la eliminación

### Para Todos los Usuarios:

1. **Crear Gastos con Subcategorías:**
   - Al crear un nuevo gasto, selecciona una categoría
   - Aparecerá un campo adicional para seleccionar subcategoría (opcional)
   - Completa el resto del formulario y guarda

2. **Ver Subcategorías:**
   - En la vista de categorías, verás las subcategorías listadas bajo cada categoría
   - Los usuarios no administradores solo pueden ver las subcategorías

## 🔍 Estructura de Datos

### Tabla `subcategories`:
```sql
CREATE TABLE subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    color VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### Campos Agregados:
- `expenses.subcategory_id` - Referencia a la subcategoría
- `expenses_with_installments.subcategory_id` - Referencia a la subcategoría

## 🛡️ Seguridad

- Solo los administradores pueden crear, editar y eliminar subcategorías
- Todos los usuarios pueden ver subcategorías
- Las subcategorías se eliminan en cascada cuando se elimina la categoría padre
- Se aplican las mismas políticas RLS que las categorías

## 🧪 Pruebas

1. **Probar Creación de Subcategorías:**
   - Inicia sesión como administrador
   - Ve a Categorías
   - Crea una nueva subcategoría

2. **Probar Creación de Gastos:**
   - Crea un nuevo gasto
   - Selecciona una categoría
   - Verifica que aparezcan las subcategorías correspondientes
   - Selecciona una subcategoría y guarda

3. **Probar Permisos:**
   - Inicia sesión como usuario normal
   - Verifica que no puedas crear/editar subcategorías
   - Verifica que puedas ver las subcategorías existentes

## 🐛 Solución de Problemas

### Error: "Subcategorías no se cargan"
- Verifica que el script SQL se ejecutó correctamente
- Revisa la consola del navegador para errores de API
- Verifica que las rutas de subcategorías estén registradas en el servidor

### Error: "No puedo crear subcategorías"
- Verifica que el usuario tenga rol de administrador
- Revisa las políticas RLS en Supabase
- Verifica que el token de autenticación sea válido

### Error: "Las subcategorías no aparecen en el formulario de gastos"
- Verifica que el store de subcategorías se cargue correctamente
- Revisa que la función `getSubcategoriesForCategory` esté implementada
- Verifica que la categoría seleccionada tenga subcategorías

## 📝 Notas Adicionales

- Las subcategorías son opcionales al crear gastos
- Si se elimina una subcategoría, los gastos que la usaban mantendrán la referencia pero no mostrarán la subcategoría
- Los colores de las subcategorías son independientes de los colores de las categorías
- Se pueden crear múltiples subcategorías con el mismo nombre en diferentes categorías 