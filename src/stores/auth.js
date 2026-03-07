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
  const isAdmin = computed(() => {
    return userProfile.value?.role_nombre === 'admin' || user.value?.role === 'admin'
  })
  const isModerator = computed(() => {
    return userProfile.value?.role_nombre === 'moderator' || user.value?.role === 'moderator'
  })
  const isUser = computed(() => {
    return userProfile.value?.role_nombre === 'user' || user.value?.role === 'user'
  })
  const hasModeratorAccess = computed(() => isAdmin.value || isModerator.value)
  
  const CACHED_USER_KEY = 'cachedUser'

  const persistUser = (userData) => {
    if (userData) {
      sessionStorage.setItem(CACHED_USER_KEY, JSON.stringify(userData))
    } else {
      sessionStorage.removeItem(CACHED_USER_KEY)
    }
  }

  const getCachedUser = () => {
    try {
      const raw = sessionStorage.getItem(CACHED_USER_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  }

  const init = async () => {
    loading.value = true
    isAuthReady.value = false
    isInitializing.value = true
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        user.value = null
        userProfile.value = null
        persistUser(null)
        return
      }

      const cached = getCachedUser()
      if (cached?.id) {
        user.value = cached
        await loadUserProfile()
      }
      
      const isValid = await auth.validateToken()
      if (!isValid) {
        user.value = null
        userProfile.value = null
        persistUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('tokenExpiresAt')
        return
      }
      
      try {
        const currentUser = await auth.getUser()
        if (currentUser) {
          user.value = currentUser
          persistUser(currentUser)
          await loadUserProfile()
          setupAutoRefresh()
        } else {
          if (!cached?.id) {
            throw new Error('No se pudo obtener el usuario')
          }
          setupAutoRefresh()
        }
      } catch (profileError) {
        if (!cached?.id) {
          user.value = null
          userProfile.value = null
          persistUser(null)
          localStorage.removeItem('token')
          localStorage.removeItem('tokenExpiresAt')
        }
      }
    } catch (err) {
      console.error('Error al inicializar autenticación:', err)
      user.value = null
      userProfile.value = null
      persistUser(null)
      localStorage.removeItem('token')
      localStorage.removeItem('tokenExpiresAt')
    } finally {
      loading.value = false
      isAuthReady.value = true
      isInitializing.value = false
    }
  }

  const setupAutoRefresh = () => {
    setInterval(async () => {
      if (user.value && auth.isTokenExpiringSoon()) {
        try {
          const refreshed = await auth.refreshToken()
          if (refreshed) {
            const currentUser = await auth.getUser()
            if (currentUser) {
              user.value = currentUser
              await loadUserProfile()
            }
          }
        } catch (error) {
          console.error('Error al renovar token automáticamente:', error)
        }
      }
    }, 10 * 60 * 1000)
  }

  const loadUserProfile = async () => {
    if (!user.value) {
      userProfile.value = null
      return
    }
    try {
      userProfile.value = {
        id: user.value.id,
        email: user.value.email,
        nombre_perfil: user.value.nombre_perfil || user.value.email,
        creado: user.value.creado,
        role_nombre: user.value.role || user.value.role_nombre || 'user',
        role_descripcion: user.value.role_descripcion || 'Usuario regular'
      }
    } catch (err) {
      console.error('Error al cargar perfil del usuario:', err)
      userProfile.value = null
    }
  }

  const createUserProfile = async (nombre = null) => {
    if (!user.value) return
    try {
      const nombrePerfil = nombre || user.value.email?.split('@')[0] || 'Usuario'
      userProfile.value = {
        id: user.value.id,
        email: user.value.email,
        nombre_perfil: nombrePerfil,
        role_nombre: user.value.role || 'user',
        role_descripcion: 'Usuario regular'
      }
    } catch (err) {
      console.error('Error al crear perfil:', err)
      userProfile.value = null
    }
  }

  const signUp = async (email, password, nombre = null) => {
    loading.value = true
    error.value = null
    try {
      const response = await auth.signUp(email, password, nombre)
      if (!response.success) {
        error.value = response.error || 'Error en el registro'
        return { success: false, error: response.error || 'Error en el registro' }
      }
      
      user.value = response.user
      persistUser(response.user)
      await loadUserProfile()
      setupAutoRefresh()
      
      return { success: true, data: response }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      const response = await auth.signIn(email, password)
      if (!response.success) {
        error.value = response.error || 'Error al iniciar sesión'
        return { success: false, error: response.error || 'Error al iniciar sesión' }
      }
      
      user.value = response.user
      persistUser(response.user)
      await loadUserProfile()
      setupAutoRefresh()
      
      return { success: true, data: response }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    loading.value = true
    error.value = null
    
    try {
      await auth.signOut()
      
      user.value = null
      userProfile.value = null
      persistUser(null)
      localStorage.removeItem('rememberedCredentials')
      
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const updateProfile = async (updates) => {
    if (!user.value) return { success: false, error: 'Usuario no autenticado' }
    
    try {
      const response = await auth.updateProfile(updates)
      if (response.success) {
        if (updates.nombre_perfil) {
          user.value = { ...user.value, nombre_perfil: updates.nombre_perfil }
          persistUser(user.value)
        }
        await loadUserProfile()
        return { success: true, data: response.data }
      }
      return { success: false, error: response.error || 'Error al actualizar perfil' }
    } catch (err) {
      console.error('Error al actualizar perfil:', err)
      return { success: false, error: err.message }
    }
  }

  const changeUserRole = async (userId, newRole) => {
    if (!isAdmin.value) {
      return { success: false, error: 'No tienes permisos para cambiar roles' }
    }

    try {
      return { success: true, data: { user_id: userId, new_role: newRole } }
    } catch (err) {
      console.error('Error al cambiar rol:', err)
      return { success: false, error: err.message }
    }
  }

  const getCurrentUserProfile = async () => {
    if (!user.value) return null

    try {
      return userProfile.value
    } catch (err) {
      console.error('Error al obtener perfil:', err)
      return null
    }
  }

  const setupAuthListener = () => {
    auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        if (user.value?.id) return
        try {
          const currentUser = await auth.getUser()
          if (currentUser) {
            user.value = currentUser
            await loadUserProfile()
          }
        } catch {
          // Silently ignore – init() already handles the initial load
        }
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        userProfile.value = null
      }
    })
  }

  const clearError = () => {
    error.value = null
  }

  const setToken = (token) => {
    localStorage.setItem('token', token)
    // También puedes agregar lógica adicional aquí si es necesario
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
    setupAutoRefresh,
    setToken
  }
}) 