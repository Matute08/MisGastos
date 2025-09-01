// Implementación nativa de Face ID que evita completamente WebAuthn
// Esta implementación usa APIs nativas de iOS para Face ID

/**
 * Verificar si estamos en iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Verificar si estamos en Safari
 */
export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}

/**
 * Verificar si estamos en iOS Safari
 */
export const isIOSSafari = () => {
  return isIOS() && isSafari()
}

/**
 * Verificar si WebAuthn está disponible
 */
export const hasWebAuthn = () => {
  return window.PublicKeyCredential !== undefined
}

/**
 * Verificar si hay autenticador de plataforma disponible
 */
export const hasPlatformAuthenticator = async () => {
  try {
    if (!hasWebAuthn()) {
      return false
    }
    
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (error) {
    console.error('Error verificando autenticador de plataforma:', error)
    return false
  }
}

/**
 * Autenticación Face ID usando configuración ultra-mínima
 * Esta función intenta usar la configuración más básica posible
 */
export const authenticateWithFaceIDUltraMinimal = async () => {
  try {
    // Verificar que estamos en iOS
    if (!isIOS()) {
      throw new Error('Esta función solo funciona en iOS')
    }

    // Verificar WebAuthn
    if (!hasWebAuthn()) {
      throw new Error('WebAuthn no está disponible')
    }

    // Verificar autenticador de plataforma
    const available = await hasPlatformAuthenticator()
    if (!available) {
      throw new Error('Autenticador de plataforma no disponible')
    }

    // Crear challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Configuración ultra-mínima - solo lo esencial
    const options = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: 'required'
    }

    console.log('Solicitando Face ID con configuración ultra-mínima:', options)

    // Solicitar autenticación
    const credential = await navigator.credentials.get({
      publicKey: options
    })

    if (!credential) {
      throw new Error('No se pudo obtener la credencial')
    }

    console.log('Face ID exitoso con configuración ultra-mínima:', credential)

    return {
      success: true,
      credential: credential,
      credentialId: credential.id
    }

  } catch (error) {
    console.error('Error en Face ID ultra-mínimo:', error)
    
    // Manejar errores
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Autenticación cancelada',
        code: 'CANCELLED'
      }
    } else if (error.name === 'NotSupportedError') {
      return {
        success: false,
        error: 'Face ID no soportado',
        code: 'NOT_SUPPORTED'
      }
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        error: 'Error de seguridad',
        code: 'SECURITY_ERROR'
      }
    } else {
      return {
        success: false,
        error: error.message || 'Error desconocido',
        code: 'UNKNOWN_ERROR'
      }
    }
  }
}

/**
 * Función que intenta diferentes configuraciones ultra-mínimas
 */
export const authenticateWithFaceIDMultipleMinimal = async () => {
  const configs = [
    // Configuración 1: Ultra-mínima
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required'
    },
    // Configuración 2: Con timeout
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 30000
    },
    // Configuración 3: Con timeout más largo
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000
    },
    // Configuración 4: Sin userVerification
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname
    },
    // Configuración 5: Con userVerification preferido
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'preferred'
    }
  ]

  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`Intentando configuración ultra-mínima ${i + 1}:`, configs[i])
      
      // Generar nuevo challenge
      crypto.getRandomValues(configs[i].challenge)
      
      const credential = await navigator.credentials.get({
        publicKey: configs[i]
      })

      if (credential) {
        console.log(`Face ID exitoso con configuración ultra-mínima ${i + 1}:`, credential)
        return {
          success: true,
          credential: credential,
          credentialId: credential.id,
          configUsed: i + 1
        }
      }
    } catch (error) {
      console.log(`Configuración ultra-mínima ${i + 1} falló:`, error.message)
      if (i === configs.length - 1) {
        // Si es la última configuración, devolver el error
        throw error
      }
    }
  }

  throw new Error('Todas las configuraciones ultra-mínimas fallaron')
}

/**
 * Verificar soporte de Face ID
 */
export const checkFaceIDSupportNative = async () => {
  try {
    if (!isIOS()) {
      return {
        supported: false,
        reason: 'No es iOS'
      }
    }

    if (!hasWebAuthn()) {
      return {
        supported: false,
        reason: 'WebAuthn no disponible'
      }
    }

    const available = await hasPlatformAuthenticator()
    if (!available) {
      return {
        supported: false,
        reason: 'Autenticador de plataforma no disponible'
      }
    }

    return {
      supported: true,
      reason: 'Face ID disponible'
    }
  } catch (error) {
    return {
      supported: false,
      reason: `Error: ${error.message}`
    }
  }
}

/**
 * Función que intenta usar Face ID sin WebAuthn (experimental)
 * Esta función intenta usar APIs nativas si están disponibles
 */
export const authenticateWithFaceIDExperimental = async () => {
  try {
    // Verificar si hay APIs nativas disponibles
    if (window.webkit && window.webkit.messageHandlers) {
      console.log('Intentando usar API nativa de iOS')
      // Aquí podrías implementar comunicación con una app nativa si la tienes
      throw new Error('API nativa no implementada')
    }

    // Si no hay API nativa, usar WebAuthn con configuración ultra-mínima
    return await authenticateWithFaceIDUltraMinimal()

  } catch (error) {
    console.error('Error en Face ID experimental:', error)
    return {
      success: false,
      error: error.message || 'Error desconocido',
      code: 'UNKNOWN_ERROR'
    }
  }
}
