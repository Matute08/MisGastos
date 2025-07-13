# Ejemplos de Uso del Sistema de Roles en Frontend

Este documento muestra cómo usar el sistema de roles profesional en Vue 3 + Supabase.

## 📋 Configuración Inicial

### 1. Ejecutar Script SQL
```sql
-- Ejecutar en Supabase SQL Editor
-- Contenido del archivo sistema_roles_profesional.sql
```

### 2. Configurar Store de Autenticación
El store ya está configurado en `src/stores/auth.js` con todas las funciones necesarias.

## 🔧 Ejemplos de Uso

### 1. Verificar Roles en Componentes

```vue
<template>
  <div>
    <!-- Mostrar contenido solo para admins -->
    <div v-if="authStore.isAdmin" class="admin-panel">
      <h2>Panel de Administración</h2>
      <button @click="createCategory">Crear Categoría</button>
      <button @click="manageUsers">Gestionar Usuarios</button>
    </div>

    <!-- Mostrar contenido para moderadores y admins -->
    <div v-if="authStore.hasModeratorAccess" class="moderator-panel">
      <h2>Panel de Moderación</h2>
      <button @click="moderateContent">Moderar Contenido</button>
    </div>

    <!-- Mostrar contenido para todos los usuarios -->
    <div class="user-panel">
      <h2>Panel de Usuario</h2>
      <p>Bienvenido, {{ authStore.userProfile?.nombre_perfil || 'Usuario' }}</p>
    </div>

    <!-- Mostrar información del rol -->
    <div class="role-info">
      <span class="role-badge" :class="roleBadgeClass">
        {{ roleDisplayName }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

// Computed properties para mostrar información del rol
const roleDisplayName = computed(() => {
  const roleMap = {
    'admin': 'Administrador',
    'moderator': 'Moderador',
    'user': 'Usuario'
  }
  return roleMap[authStore.userProfile?.role_nombre] || 'Usuario'
})

const roleBadgeClass = computed(() => {
  const classMap = {
    'admin': 'bg-red-100 text-red-800',
    'moderator': 'bg-yellow-100 text-yellow-800',
    'user': 'bg-blue-100 text-blue-800'
  }
  return classMap[authStore.userProfile?.role_nombre] || 'bg-gray-100 text-gray-800'
})

// Funciones de ejemplo
const createCategory = () => {
  if (!authStore.isAdmin) {
    alert('No tienes permisos para crear categorías')
    return
  }
  // Lógica para crear categoría
}

const manageUsers = () => {
  if (!authStore.isAdmin) {
    alert('No tienes permisos para gestionar usuarios')
    return
  }
  // Lógica para gestionar usuarios
}

const moderateContent = () => {
  if (!authStore.hasModeratorAccess) {
    alert('No tienes permisos de moderación')
    return
  }
  // Lógica para moderar contenido
}
</script>
```

### 2. Guardia de Rutas con Roles

```javascript
// src/router/guards.js
import { useAuthStore } from '@/stores/auth'

export function requireAuth(to, from, next) {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    next('/login')
  } else {
    next()
  }
}

export function requireAdmin(to, from, next) {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    next('/login')
  } else if (!authStore.isAdmin) {
    next('/unauthorized')
  } else {
    next()
  }
}

export function requireModerator(to, from, next) {
  const authStore = useAuthStore()
  
  if (!authStore.isAuthenticated) {
    next('/login')
  } else if (!authStore.hasModeratorAccess) {
    next('/unauthorized')
  } else {
    next()
  }
}
```

### 3. Directiva Personalizada para Roles

```javascript
// src/directives/role.js
import { useAuthStore } from '@/stores/auth'

export const roleDirective = {
  mounted(el, binding) {
    const authStore = useAuthStore()
    const requiredRole = binding.value
    
    const hasPermission = () => {
      switch (requiredRole) {
        case 'admin':
          return authStore.isAdmin
        case 'moderator':
          return authStore.hasModeratorAccess
        case 'user':
          return authStore.isAuthenticated
        default:
          return false
      }
    }
    
    if (!hasPermission()) {
      el.style.display = 'none'
    }
  }
}

// Uso en componentes:
// <button v-role="'admin'">Solo para admins</button>
// <div v-role="'moderator'">Solo para moderadores</div>
```

### 4. Composable para Gestión de Roles

```javascript
// src/composables/useRoles.js
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

export function useRoles() {
  const authStore = useAuthStore()
  
  const can = (action) => {
    const permissions = {
      'create:categories': authStore.isAdmin,
      'edit:categories': authStore.isAdmin,
      'delete:categories': authStore.isAdmin,
      'manage:users': authStore.isAdmin,
      'moderate:content': authStore.hasModeratorAccess,
      'view:reports': authStore.hasModeratorAccess,
      'create:expenses': authStore.isAuthenticated,
      'view:own:expenses': authStore.isAuthenticated
    }
    
    return permissions[action] || false
  }
  
  const roleName = computed(() => {
    const roleMap = {
      'admin': 'Administrador',
      'moderator': 'Moderador',
      'user': 'Usuario'
    }
    return roleMap[authStore.userProfile?.role_nombre] || 'Usuario'
  })
  
  const roleDescription = computed(() => {
    return authStore.userProfile?.role_descripcion || ''
  })
  
  return {
    can,
    roleName,
    roleDescription,
    isAdmin: authStore.isAdmin,
    isModerator: authStore.isModerator,
    isUser: authStore.isUser,
    hasModeratorAccess: authStore.hasModeratorAccess
  }
}
```

### 5. Ejemplo de Gestión de Usuarios (Solo Admins)

```vue
<template>
  <div v-if="authStore.isAdmin" class="user-management">
    <h2>Gestión de Usuarios</h2>
    
    <div class="users-list">
      <div v-for="user in users" :key="user.id" class="user-card">
        <div class="user-info">
          <h3>{{ user.email }}</h3>
          <p>Rol actual: {{ user.role_nombre }}</p>
        </div>
        
        <div class="user-actions">
          <select v-model="user.newRole" @change="changeUserRole(user.id, user.newRole)">
            <option value="user">Usuario</option>
            <option value="moderator">Moderador</option>
            <option value="admin">Administrador</option>
          </select>
          
          <button @click="changeUserRole(user.id, user.newRole)">
            Cambiar Rol
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const authStore = useAuthStore()
const users = ref([])
const loading = ref(false)

// Cargar usuarios
const loadUsers = async () => {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('usuarios_completos')
      .select('*')
      .order('auth_created_at', { ascending: false })
    
    if (error) throw error
    
    users.value = data.map(user => ({
      ...user,
      newRole: user.role_nombre
    }))
  } catch (error) {
    console.error('Error al cargar usuarios:', error)
  } finally {
    loading.value = false
  }
}

// Cambiar rol de usuario
const changeUserRole = async (userId, newRole) => {
  try {
    const { success, error } = await authStore.changeUserRole(userId, newRole)
    
    if (success) {
      alert('Rol cambiado correctamente')
      await loadUsers() // Recargar lista
    } else {
      alert(`Error: ${error}`)
    }
  } catch (error) {
    console.error('Error al cambiar rol:', error)
    alert('Error al cambiar el rol')
  }
}

onMounted(() => {
  if (authStore.isAdmin) {
    loadUsers()
  }
})
</script>
```

### 6. Ejemplo de Consulta de Perfil

```javascript
// Obtener perfil completo del usuario actual
const getCurrentUserProfile = async () => {
  const authStore = useAuthStore()
  
  try {
    const profile = await authStore.getCurrentUserProfile()
    console.log('Perfil del usuario:', profile)
    
    if (profile) {
      console.log('Email:', profile.email)
      console.log('Nombre:', profile.nombre_perfil)
      console.log('Rol:', profile.role_nombre)
      console.log('Descripción del rol:', profile.role_descripcion)
    }
  } catch (error) {
    console.error('Error al obtener perfil:', error)
  }
}

// Actualizar perfil del usuario
const updateUserProfile = async () => {
  const authStore = useAuthStore()
  
  try {
    const { success, error } = await authStore.updateProfile({
      nombre: 'Nuevo Nombre'
    })
    
    if (success) {
      console.log('Perfil actualizado correctamente')
    } else {
      console.error('Error al actualizar perfil:', error)
    }
  } catch (error) {
    console.error('Error al actualizar perfil:', error)
  }
}
```

### 7. Ejemplo de Navegación Condicional

```vue
<template>
  <nav class="navigation">
    <!-- Enlaces para todos los usuarios -->
    <router-link to="/dashboard">Dashboard</router-link>
    <router-link to="/expenses">Gastos</router-link>
    
    <!-- Enlaces solo para moderadores y admins -->
    <router-link v-if="authStore.hasModeratorAccess" to="/moderation">
      Moderación
    </router-link>
    
    <!-- Enlaces solo para admins -->
    <router-link v-if="authStore.isAdmin" to="/admin">
      Administración
    </router-link>
    <router-link v-if="authStore.isAdmin" to="/users">
      Usuarios
    </router-link>
    
    <!-- Información del usuario -->
    <div class="user-info">
      <span>{{ authStore.userProfile?.nombre_perfil || 'Usuario' }}</span>
      <span class="role-badge">{{ roleDisplayName }}</span>
    </div>
  </nav>
</template>
```

## 🔒 Buenas Prácticas de Seguridad

### 1. Validación en Frontend y Backend
```javascript
// Siempre validar en el frontend
if (!authStore.isAdmin) {
  return { success: false, error: 'No tienes permisos' }
}

// Pero también confiar en las políticas RLS del backend
// Las políticas RLS son la última línea de defensa
```

### 2. Uso de Composable para Permisos
```javascript
// src/composables/usePermissions.js
export function usePermissions() {
  const { can } = useRoles()
  
  const checkPermission = (permission) => {
    return can(permission)
  }
  
  const requirePermission = (permission) => {
    if (!can(permission)) {
      throw new Error('Permisos insuficientes')
    }
  }
  
  return {
    checkPermission,
    requirePermission
  }
}
```

### 3. Manejo de Errores de Permisos
```javascript
// Interceptor para errores de permisos
const handlePermissionError = (error) => {
  if (error.message.includes('permisos') || error.message.includes('permission')) {
    // Redirigir a página de acceso denegado
    router.push('/unauthorized')
    return
  }
  throw error
}
```

## 📊 Monitoreo y Logs

```javascript
// Logging de acciones administrativas
const logAdminAction = (action, details) => {
  if (authStore.isAdmin) {
    console.log(`[ADMIN ACTION] ${action}:`, {
      admin: authStore.userProfile?.email,
      action,
      details,
      timestamp: new Date().toISOString()
    })
  }
}

// Uso
logAdminAction('change_user_role', { userId, oldRole, newRole })
```

Este sistema proporciona una base sólida y profesional para manejar roles en tu aplicación Vue 3 + Supabase. 