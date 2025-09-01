<template>
  <div class="biometric-auth">
    <div v-if="showBiometricPrompt" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="text-center">
          <div class="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          
          <h3 class="text-lg font-semibold text-gray-900 mb-2">
            {{ biometricType === 'face' ? 'Face ID' : 'Touch ID' }}
          </h3>
          
          <p class="text-sm text-gray-600 mb-4">
            {{ biometricType === 'face' ? 'Coloca tu rostro frente al sensor' : 'Coloca tu dedo en el sensor' }}
          </p>
          
          <div class="flex space-x-3">
            <button @click="authenticate" class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors duration-200" :disabled="isAuthenticating">
              <span v-if="isAuthenticating">Autenticando...</span>
              <span v-else>Autenticar</span>
            </button>
            
            <button @click="cancelBiometric" class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 transition-colors duration-200">
              Cancelar
            </button>
          </div>
          
          <button @click="usePassword" class="mt-3 text-sm text-blue-600 hover:text-blue-800 underline">
            Usar contraseña
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { 
  authenticateWithFaceIDSimple,
  authenticateWithFaceIDMultipleAttempts,
  checkFaceIDSupportSimple
} from '../services/faceIdSimple'

const authStore = useAuthStore()
const showBiometricPrompt = ref(false)
const isAuthenticating = ref(false)
const biometricType = ref('face')
const isSupported = ref(false)

const emit = defineEmits(['authenticated', 'cancelled', 'usePassword'])

onMounted(async () => {
  await checkBiometricSupport()
})

const checkBiometricSupport = async () => {
  try {
    // Verificar soporte de Face ID
    const support = await checkFaceIDSupportSimple()
    
    if (support.supported) {
      isSupported.value = true
      biometricType.value = 'face'
      console.log('Face ID disponible:', support.reason)
    } else {
      console.log('Face ID no disponible:', support.reason)
      isSupported.value = false
    }
  } catch (error) {
    console.error('Error verificando soporte de Face ID:', error)
    isSupported.value = false
  }
}

const showBiometric = () => {
  if (isSupported.value) {
    showBiometricPrompt.value = true
  } else {
    emit('usePassword')
  }
}

const authenticate = async () => {
  if (!isSupported.value) {
    emit('usePassword')
    return
  }

  isAuthenticating.value = true

  try {
    console.log('Iniciando autenticación Face ID simple...')
    
    // Intentar primero con la configuración simple
    let result = await authenticateWithFaceIDSimple()
    
    // Si falla, intentar con múltiples configuraciones
    if (!result.success && result.code !== 'CANCELLED') {
      console.log('Intentando con múltiples configuraciones...')
      result = await authenticateWithFaceIDMultipleAttempts()
    }
    
    if (result.success && result.credential) {
      console.log('Autenticación Face ID exitosa')
      showBiometricPrompt.value = false
      emit('authenticated', result.credential)
      localStorage.setItem('biometricEnabled', 'true')
    } else {
      console.error('Error en autenticación Face ID:', result.error)
      
      // Manejar diferentes tipos de errores
      if (result.code === 'CANCELLED') {
        emit('cancelled')
      } else {
        emit('usePassword')
      }
    }
  } catch (error) {
    console.error('Error en autenticación Face ID:', error)
    emit('usePassword')
  } finally {
    isAuthenticating.value = false
  }
}

const cancelBiometric = () => {
  showBiometricPrompt.value = false
  emit('cancelled')
}

const usePassword = () => {
  showBiometricPrompt.value = false
  emit('usePassword')
}

defineExpose({
  showBiometric,
  isSupported
})
</script>
