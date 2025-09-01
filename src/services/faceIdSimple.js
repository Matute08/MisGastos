// Implementación simple de Face ID que evita el modal de Passkeys
// Esta implementación usa una configuración mínima para forzar Face ID directo

/**
 * Verificar si estamos en iOS
 */
export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Verificar si WebAuthn está disponible
 */
export const hasWebAuthn = () => {
  return window.PublicKeyCredential !== undefined
}

/**
 * Verificar si hay autenticador de plataforma
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
 * Autenticación Face ID simple
 * Esta función usa la configuración más mínima posible para evitar el modal de Passkeys
 */
export const authenticateWithFaceIDSimple = async () => {
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

    // Configuración mínima para Face ID
    const options = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000
    }

    console.log('Solicitando Face ID con configuración mínima:', options)

    // Solicitar autenticación
    const credential = await navigator.credentials.get({
      publicKey: options
    })

    if (!credential) {
      throw new Error('No se pudo obtener la credencial')
    }

    console.log('Face ID exitoso:', credential)

    return {
      success: true,
      credential: credential,
      credentialId: credential.id
    }

  } catch (error) {
    console.error('Error en Face ID simple:', error)
    
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
 * Función que intenta diferentes configuraciones para evitar el modal de Passkeys
 */
export const authenticateWithFaceIDMultipleAttempts = async () => {
  const configs = [
    // Configuración 1: Mínima
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000
    },
    // Configuración 2: Con authenticatorSelection
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      }
    },
    // Configuración 3: Con allowCredentials vacío
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: []
    },
    // Configuración 4: Combinada
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required'
      },
      allowCredentials: []
    }
  ]

  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`Intentando configuración ${i + 1}:`, configs[i])
      
      // Generar nuevo challenge
      crypto.getRandomValues(configs[i].challenge)
      
      const credential = await navigator.credentials.get({
        publicKey: configs[i]
      })

      if (credential) {
        console.log(`Face ID exitoso con configuración ${i + 1}:`, credential)
        return {
          success: true,
          credential: credential,
          credentialId: credential.id,
          configUsed: i + 1
        }
      }
    } catch (error) {
      console.log(`Configuración ${i + 1} falló:`, error.message)
      if (i === configs.length - 1) {
        // Si es la última configuración, devolver el error
        throw error
      }
    }
  }

  throw new Error('Todas las configuraciones fallaron')
}

/**
 * Verificar soporte de Face ID
 */
export const checkFaceIDSupportSimple = async () => {
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
