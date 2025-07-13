import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { auth, supabase } from '@/lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userProfile = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const isAuthReady = ref(false)

  
  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => userProfile.value?.role_nombre === 'admin')
  const isModerator = computed(() => userProfile.value?.role_nombre === 'moderator')
  const isUser = computed(() => userProfile.value?.role_nombre === 'user')
  const hasModeratorAccess = computed(() => isAdmin.value || isModerator.value)
  
  // Inicializar el store
  const init = async () => {
    console.log(userProfile)
    loading.value = true
    isAuthReady.value = false
    try {
      const currentUser = await auth.getUser()
      user.value = currentUser
      if (currentUser) {
        await loadUserProfile()
      }
    } catch (err) {
      console.error('Error al obtener usuario:', err)
    } finally {
      loading.value = false
      isAuthReady.value = true
    }
  }

  // Cargar perfil del usuario
  const loadUserProfile = async () => {
    if (!user.value) return
    try {
      // Consultar perfil extendido con join a roles
      const { data, error: profileError } = await supabase
        .from('usuarios_perfil')
        .select('*, roles(nombre, descripcion)')
        .eq('id', user.value.id)
        .single()

      if (profileError || !data) {
        // Si no existe perfil, crearlo automáticamente
        await createUserProfile()
      } else {
        userProfile.value = {
          id: data.id,
          email: user.value.email,
          nombre_perfil: data.nombre,
          role_nombre: data.roles?.nombre,
          role_descripcion: data.roles?.descripcion
        }
      }
    } catch (err) {
      console.error('Error al cargar perfil del usuario:', err)
      await createUserProfile()
    }
  }

  // Crear perfil de usuario si no existe
  const createUserProfile = async (nombre = null) => {
    if (!user.value) return
    try {
      // Buscar el role_id del rol 'user'
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('nombre', 'user')
        .single()
      if (roleError || !roleData) throw new Error('No se pudo obtener el role_id')

      const nombrePerfil = nombre || user.value.email?.split('@')[0] || 'Usuario'
      const { data, error } = await supabase
        .from('usuarios_perfil')
        .insert({
          id: user.value.id,
          nombre: nombrePerfil,
          role_id: roleData.id
        })
        .select('*, roles(nombre, descripcion)')
        .single()

      if (error) {
        console.error('Error al crear perfil:', error)
        userProfile.value = null
      } else {
        userProfile.value = {
          id: data.id,
          email: user.value.email,
          nombre_perfil: data.nombre,
          role_nombre: data.roles?.nombre,
          role_descripcion: data.roles?.descripcion
        }
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
    let infoMessage = null
    try {
      const { data, error: signUpError } = await auth.signUp(email, password)
      if (signUpError) {
        error.value = signUpError.message
        return { success: false, error: signUpError.message }
      }
      // Mensaje informativo para el usuario
      infoMessage = 'Se ha enviado un correo de validación a tu email. Por favor, revisa tu bandeja de entrada y sigue el enlace para activar tu cuenta.'
      return { success: true, data, message: infoMessage }
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
      const { data, error: signInError } = await auth.signIn(email, password)
      if (signInError) {
        error.value = signInError.message
        return { success: false, error: signInError.message }
      }
      user.value = data.user
      await loadUserProfile()
      // Si el perfil no existe, se crea automáticamente en loadUserProfile
      return { success: true, data }
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
      const { error: signOutError } = await auth.signOut()
      
      if (signOutError) {
        error.value = signOutError.message
        return { success: false, error: signOutError.message }
      }
      
      user.value = null
      userProfile.value = null
      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  // Actualizar perfil del usuario
  const updateProfile = async (updates) => {
    if (!user.value) return { success: false, error: 'Usuario no autenticado' }
    
    try {
      const { data, error } = await supabase
        .from('usuarios_perfil')
        .update(updates)
        .eq('id', user.value.id)
        .select(`
          *,
          roles!inner(nombre, descripcion)
        `)
        .single()

      if (error) {
        console.error('Error al actualizar perfil:', error)
        return { success: false, error: error.message }
      }

      // Actualizar el perfil en el store
      userProfile.value = {
        id: data.id,
        email: user.value.email,
        nombre_perfil: data.nombre,
        role_nombre: data.roles.nombre,
        role_descripcion: data.roles.descripcion
      }

      return { success: true, data }
    } catch (err) {
      console.error('Error al actualizar perfil:', err)
      return { success: false, error: err.message }
    }
  }

  // Cambiar rol de usuario (solo admins)
  const changeUserRole = async (userId, newRole) => {
    if (!isAdmin.value) {
      return { success: false, error: 'No tienes permisos para cambiar roles' }
    }

    try {
      const { data, error } = await supabase
        .rpc('change_user_role', {
          user_id: userId,
          new_role_nombre: newRole
        })

      if (error) {
        console.error('Error al cambiar rol:', error)
        return { success: false, error: error.message }
      }

      return { success: true, data }
    } catch (err) {
      console.error('Error al cambiar rol:', err)
      return { success: false, error: err.message }
    }
  }

  // Obtener perfil completo del usuario actual
  const getCurrentUserProfile = async () => {
    if (!user.value) return null

    try {
      const { data, error } = await supabase
        .rpc('get_current_user_profile')

      if (error) {
        console.error('Error al obtener perfil:', error)
        return null
      }

      return data[0] || null
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
    init,
    signUp,
    signIn,
    signOut,
    updateProfile,
    changeUserRole,
    getCurrentUserProfile,
    setupAuthListener,
    clearError,
    loadUserProfile
  }
}) 