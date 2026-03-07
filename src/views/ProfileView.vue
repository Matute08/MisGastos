<template>
  <div class="space-y-6 max-w-2xl mx-auto">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Mi Perfil</h1>
      <p class="text-slate-500">Administra tu información personal</p>
    </div>

    <!-- Avatar & Name -->
    <div class="card text-center py-8">
      <div class="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold mx-auto mb-4">
        {{ userInitials }}
      </div>
      <h2 class="text-xl font-bold text-slate-900">{{ authStore.userProfile?.nombre_perfil || 'Usuario' }}</h2>
      <p class="text-sm text-slate-500 mt-1">{{ userEmail }}</p>
      <span class="inline-flex items-center mt-3 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-200">
        {{ userRoleDisplay }}
      </span>
    </div>

    <!-- Edit Profile Form -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Información Personal</h3>
        <p class="card-subtitle">Actualiza tu nombre de perfil</p>
      </div>

      <form @submit.prevent="handleUpdateProfile" class="space-y-4">
        <div>
          <label for="profile-name" class="block text-sm font-semibold text-slate-700 mb-1.5">
            Nombre
          </label>
          <div class="relative">
            <UserIcon class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="profile-name"
              v-model="form.nombre"
              type="text"
              class="input-field !pl-10"
              placeholder="Tu nombre"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Email
          </label>
          <div class="relative">
            <Mail class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              :value="userEmail"
              type="email"
              disabled
              class="input-field !pl-10 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
          <p class="text-xs text-slate-400 mt-1">El email no se puede modificar</p>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Rol
          </label>
          <div class="relative">
            <Shield class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              :value="userRoleDisplay"
              type="text"
              disabled
              class="input-field !pl-10 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div>
          <label class="block text-sm font-semibold text-slate-700 mb-1.5">
            Miembro desde
          </label>
          <div class="relative">
            <Calendar class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              :value="memberSince"
              type="text"
              disabled
              class="input-field !pl-10 bg-slate-50 text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>

        <div v-if="successMsg" class="bg-success-50 border border-success-100 rounded-xl p-3">
          <p class="text-sm text-success-700">{{ successMsg }}</p>
        </div>
        <div v-if="errorMsg" class="bg-danger-50 border border-danger-100 rounded-xl p-3">
          <p class="text-sm text-danger-700">{{ errorMsg }}</p>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="saving || !hasChanges"
            class="btn-primary inline-flex items-center justify-center min-w-[140px]"
          >
            <div v-if="saving" class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
            <span>{{ saving ? 'Guardando...' : 'Guardar Cambios' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- Danger Zone -->
    <div class="card border-danger-200">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Cerrar Sesión</h3>
          <p class="text-xs text-slate-500 mt-0.5">Salir de tu cuenta en este dispositivo</p>
        </div>
        <button @click="handleSignOut" class="btn-danger !py-2 !px-4 text-sm">
          <LogOut class="h-4 w-4 mr-1.5 inline-block" />
          Salir
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { User as UserIcon, Mail, Shield, Calendar, LogOut } from 'lucide-vue-next'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import Swal from 'sweetalert2'

const router = useRouter()
const authStore = useAuthStore()

const saving = ref(false)
const successMsg = ref('')
const errorMsg = ref('')

const form = ref({
  nombre: authStore.userProfile?.nombre_perfil || ''
})

watch(() => authStore.userProfile?.nombre_perfil, (val) => {
  if (val && !form.value.nombre) form.value.nombre = val
}, { immediate: true })

const userEmail = computed(() =>
  authStore.user?.email || authStore.userProfile?.email || ''
)

const userInitials = computed(() => {
  const name = authStore.userProfile?.nombre_perfil || 'U'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

const userRoleDisplay = computed(() => {
  const role = authStore.userProfile?.role_nombre
  if (role === 'admin') return 'Administrador'
  if (role === 'moderator') return 'Moderador'
  return 'Usuario'
})

const memberSince = computed(() => {
  const date = authStore.userProfile?.creado || authStore.user?.creado || authStore.user?.created_at
  if (!date) return 'No disponible'
  try {
    return format(parseISO(date), "d 'de' MMMM 'de' yyyy", { locale: es })
  } catch {
    return 'No disponible'
  }
})

const hasChanges = computed(() => {
  const current = authStore.userProfile?.nombre_perfil || ''
  return form.value.nombre.trim() !== current && form.value.nombre.trim().length >= 2
})

const handleUpdateProfile = async () => {
  if (!hasChanges.value) return
  saving.value = true
  successMsg.value = ''
  errorMsg.value = ''

  const result = await authStore.updateProfile({
    nombre_perfil: form.value.nombre.trim()
  })

  saving.value = false

  if (result.success) {
    successMsg.value = 'Perfil actualizado correctamente'
    setTimeout(() => { successMsg.value = '' }, 3000)
  } else {
    errorMsg.value = result.error || 'Error al actualizar perfil'
  }
}

const handleSignOut = async () => {
  const confirm = await Swal.fire({
    title: '¿Cerrar sesión?',
    text: 'Se cerrará tu sesión en este dispositivo',
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#E11D48',
    cancelButtonColor: '#64748B',
    confirmButtonText: 'Sí, cerrar sesión',
    cancelButtonText: 'Cancelar'
  })

  if (confirm.isConfirmed) {
    const { success } = await authStore.signOut()
    if (success) {
      router.push('/login')
      window.location.reload()
    }
  }
}
</script>
