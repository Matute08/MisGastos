<template>
  <div class="max-w-4xl mx-auto p-6">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-gray-900">Perfil de Usuario</h1>
      <p class="text-gray-600 mt-2">Gestiona tu información personal y configuración</p>
    </div>

    <!-- Loading -->
    <div v-if="authStore.loading" class="flex justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
      <div class="flex">
        <AlertCircle class="h-5 w-5 text-red-400" />
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Perfil del Usuario -->
    <div v-else-if="authStore.userProfile" class="space-y-6">
      <!-- Información Básica -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <p class="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">{{ authStore.userProfile.email }}</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <div class="flex items-center space-x-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="roleBadgeClass">
                {{ roleDisplayName }}
              </span>
              <span class="text-sm text-gray-500">{{ authStore.userProfile.role_descripcion }}</span>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input 
              v-model="editingProfile.nombre_perfil"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tu nombre"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Registro</label>
            <p class="text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
              {{ formatDate(authStore.userProfile.auth_created_at) }}
            </p>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="mt-6 flex space-x-3">
          <button
            @click="saveProfile"
            :disabled="saving"
            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="saving" class="h-4 w-4 inline mr-2 animate-spin" />
            {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
          </button>
          
          <button
            @click="resetForm"
            class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>

      <!-- Información del Rol -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Información del Rol</h2>
        
        <div class="space-y-4">
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-medium text-gray-900">Permisos de Administrador</h3>
              <p class="text-sm text-gray-600">Acceso completo al sistema</p>
            </div>
            <div class="flex items-center">
              <CheckCircle v-if="authStore.isAdmin" class="h-5 w-5 text-green-500" />
              <XCircle v-else class="h-5 w-5 text-red-500" />
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-medium text-gray-900">Permisos de Moderador</h3>
              <p class="text-sm text-gray-600">Acceso intermedio al sistema</p>
            </div>
            <div class="flex items-center">
              <CheckCircle v-if="authStore.hasModeratorAccess" class="h-5 w-5 text-green-500" />
              <XCircle v-else class="h-5 w-5 text-red-500" />
            </div>
          </div>
          
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 class="font-medium text-gray-900">Permisos de Usuario</h3>
              <p class="text-sm text-gray-600">Acceso básico al sistema</p>
            </div>
            <div class="flex items-center">
              <CheckCircle class="h-5 w-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <!-- Panel de Administración (Solo para Admins) -->
      <div v-if="authStore.isAdmin" class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Panel de Administración</h2>
        
        <div class="space-y-4">
          <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 class="font-medium text-blue-900 mb-2">Gestión de Usuarios</h3>
            <p class="text-sm text-blue-700 mb-3">
              Como administrador, puedes gestionar los roles de otros usuarios.
            </p>
            <button
              @click="showUserManagement = true"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Gestionar Usuarios
            </button>
          </div>
          
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 class="font-medium text-green-900 mb-2">Estadísticas del Sistema</h3>
            <p class="text-sm text-green-700">
              Acceso a estadísticas y reportes del sistema.
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Estado Vacío -->
    <div v-else class="text-center py-12">
      <User class="mx-auto h-12 w-12 text-gray-400" />
      <h3 class="mt-4 text-lg font-medium text-gray-900">No se pudo cargar el perfil</h3>
      <p class="mt-2 text-gray-600">Intenta recargar la página</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import {
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-vue-next'

const authStore = useAuthStore()
const error = ref(null)
const saving = ref(false)
const showUserManagement = ref(false)

// Formulario de edición
const editingProfile = ref({
  nombre_perfil: ''
})

// Computed properties
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

// Inicializar formulario
const initForm = () => {
  if (authStore.userProfile) {
    editingProfile.value = {
      nombre_perfil: authStore.userProfile.nombre_perfil || ''
    }
  }
}

// Guardar perfil
const saveProfile = async () => {
  saving.value = true
  error.value = null
  
  try {
    const { success, error: updateError } = await authStore.updateProfile({
      nombre: editingProfile.value.nombre_perfil
    })
    
    if (success) {
      // El store se actualiza automáticamente
      console.log('Perfil actualizado correctamente')
    } else {
      error.value = updateError
    }
  } catch (err) {
    error.value = 'Error al actualizar el perfil'
    console.error('Error al actualizar perfil:', err)
  } finally {
    saving.value = false
  }
}

// Resetear formulario
const resetForm = () => {
  initForm()
  error.value = null
}

// Formatear fecha
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Inicializar cuando el componente se monta
onMounted(() => {
  if (authStore.userProfile) {
    initForm()
  }
})

// Observar cambios en el perfil
watch(() => authStore.userProfile, () => {
  if (authStore.userProfile) {
    initForm()
  }
})
</script> 