import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth } from '@/lib/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const isAuthReady = ref(false)
  const isInitializing = ref(true)

  
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => userProfile.value?.role_nombre === 'admin')
  const isModerator = computed(() => userProfile.value?.role_nombre === 'moderator')
  const isUser = computed(() => userProfile.value?.role_nombre === 'user')
  const hasModeratorAccess = computed(() => isAdmin.value || isModerator.value)
  
  // Inicializar el store con validación mejorada
  const init = async () => {
    loading.value = true
    isAuthReady.value = false
    isInitializing.value = true
    
    try {
      // Verificar si hay un token almacenado
      const token = localStorage.getItem('token')
      if (!token) {
        console.log('No hay token almacenado')
        user.value = null
        userProfile.value = null
        return
      }
      
      console.log('Token encontrado, intentando restaurar sesión...')
      
      // Validar el token antes de intentar obtener el perfil
      const isValid = await auth.validateToken()
      if (!isValid) {
        console.log('Token inválido, limpiando sesión')
        user.value = null
        userProfile.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiresAt')
        return
      }
      
      // Intentar obtener el perfil del usuario
      try {
        const currentUser = await auth.getUser()
        if (currentUser) {
          user.value = currentUser
          await loadUserProfile()
          console.log('Sesión restaurada exitosamente')
          
          // Configurar renovación automática
          setupAutoRefresh()
        } else {
          throw new Error('No se pudo obtener el usuario')
        }
      } catch (profileError) {
        console.log('Error obteniendo perfil, limpiando sesión:', profileError.message)
        user.value = null
        userProfile.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiresAt')
      }
    } catch (err) {
      console.error('Error al inicializar autenticación:', err)
      user.value = null
      userProfile.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiresAt')
    } finally {
      loading.value = false
      isAuthReady.value = true
      isInitializing.value = false
    }
  }

  // Configurar renovación automática de token
  const setupAutoRefresh = () => {
    // Verificar cada 10 minutos si el token necesita renovación
    setInterval(async () => {
      if (user.value && auth.isTokenExpiringSoon()) {
        console.log('Renovando token automáticamente...')
        try {
          const refreshed = await auth.refreshToken()
          if (refreshed) {
            console.log('Token renovado exitosamente')
            // Actualizar el usuario si es necesario
            const currentUser = await auth.getUser()
            if (currentUser) {
              user.value = currentUser
              await loadUserProfile()
            }
          } else {
            console.log('No se pudo renovar el token')
          }
        } catch (error) {
          console.error('Error al renovar token automáticamente:', error)
        }
      }
    }, 10 * 60 * 1000) // 10 minutos
  }

  // Cargar perfil del usuario
  const loadUserProfile = async () => {
    if (!user.value) {
      userProfile.value = null
      return
    }
    try {
      // Crear perfil básico usando datos del backend
      userProfile.value = {
        id: user.value.id,
        email: user.value.email,
        nombre_perfil: user.value.nombre_perfil || user.value.email,
        role_nombre: user.value.role_nombre || 'user',
        role_descripcion: user.value.role_descripcion || 'Usuario regular'
      }
    } catch (err) {
      console.error('Error al cargar perfil del usuario:', err)
      userProfile.value = null
    }
  }

  // Crear perfil de usuario si no existe (simplificado)
  const createUserProfile = async (nombre = null) => {
    if (!user.value) return
    try {
      const nombrePerfil = nombre || user.value.email?.split('@')[0] || 'Usuario'
      userProfile.value = {
        id: user.value.id,
        email: user.value.email,
        nombre_perfil: nombrePerfil,
        role_nombre: 'user',
        role_descripcion: 'Usuario regular'
      }
    } catch (err) {
      console.error('Error al crear perfil:', err)
      userProfile.value = null
    }
  }

  // Registro
  const signUp = async (email, password, nombre = null) => {
    loading.value = true
    error.value = null
    try {
      const response = await auth.signUp(email, password, nombre)
      if (!response.success) {
        error.value = response.error || 'Error en el registro'
        return { success: false, error: response.error || 'Error en el registro' }
      }
      
      // Establecer el usuario en el store
      user.value = response.user
      await loadUserProfile()
      
      // Configurar renovación automática
      setupAutoRefresh()
      
      return { success: true, data: response }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Inicio de sesión
  const signIn = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const response = await auth.signIn(email, password)
      if (!response.success) {
        error.value = response.error || 'Error al iniciar sesión'
        return { success: false, error: response.error || 'Error al iniciar sesión' }
      }
      
      // Establecer el usuario en el store
      user.value = response.user
      await loadUserProfile()
      
      // Configurar renovación automática
      setupAutoRefresh()
      
      return { success: true, data: response }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Cerrar sesión
  const signOut = async () => {
    loading.value = true
    error.value = null
    
    try {
      await auth.signOut()
      
      user.value = null
      userProfile.value = null
      
      // Limpiar credenciales guardadas al cerrar sesión
      localStorage.removeItem('rememberedCredentials')
      
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar perfil del usuario (simplificado)
  const updateProfile = async (updates) => {
    if (!user.value) return { success: false, error: 'Usuario no autenticado' }
    
    try {
      // Actualizar el perfil en el store
      userProfile.value = {
        ...userProfile.value,
        ...updates
      }

      return { success: true, data: userProfile.value }
    } catch (err) {
      console.error('Error al actualizar perfil:', err)
      return { success: false, error: err.message }
    }
  }

  // Cambiar rol de usuario (solo admins) - simplificado
  const changeUserRole = async (userId, newRole) => {
    if (!isAdmin.value) {
      return { success: false, error: 'No tienes permisos para cambiar roles' }
    }

    try {
      // Por ahora, solo retornar éxito
      return { success: true, data: { user_id: userId, new_role: newRole } }
    } catch (err) {
      console.error('Error al cambiar rol:', err)
      return { success: false, error: err.message }
    }
  }

  // Obtener perfil completo del usuario actual (simplificado)
  const getCurrentUserProfile = async () => {
    if (!user.value) return null

    try {
      return userProfile.value
    } catch (err) {
      console.error('Error al obtener perfil:', err)
      return null
    }
  }

  // Escuchar cambios de autenticación
  const setupAuthListener = () => {
    auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        user.value = session?.user || null
        if (session?.user) {
          await loadUserProfile()
        }
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        userProfile.value = null
      }
    })
  }

  // Limpiar error
  const clearError = () => {
    error.value = null
  }

  return {
    user,
    userProfile,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isModerator,
    isUser,
    hasModeratorAccess,
    isAuthReady,
    isInitializing,
    init,
    signUp,
    signIn,
    signOut,
    updateProfile,
    changeUserRole,
    getCurrentUserProfile,
    setupAuthListener,
    clearError,
    loadUserProfile,
    setupAutoRefresh
  }
}) 