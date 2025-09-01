// Implementación directa de Face ID sin WebAuthn
// Esta implementación intenta usar Face ID directamente sin pasar por el modal de Passkeys

/**
 * Verificar si estamos en iOS Safari
 */
export const isIOSSafari = () => {
  const userAgent = navigator.userAgent
  return /iPad|iPhone|iPod/.test(userAgent) && /Safari/.test(userAgent) && !/Chrome/.test(userAgent)
}

/**
 * Verificar si WebAuthn está disponible
 */
export const isWebAuthnAvailable = () => {
  return window.PublicKeyCredential !== undefined
}

/**
 * Verificar si hay autenticador de plataforma disponible
 */
export const isPlatformAuthenticatorAvailable = async () => {
  try {
    if (!isWebAuthnAvailable()) {
      return false
    }
    
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (error) {
    console.error('Error verificando autenticador de plataforma:', error)
    return false
  }
}

/**
 * Autenticación Face ID directa
 * Esta función intenta usar Face ID directamente sin el modal de Passkeys
 */
export const authenticateWithFaceID = async () => {
  try {
    // Verificar que estamos en iOS Safari
    if (!isIOSSafari()) {
      throw new Error('Esta función solo funciona en iOS Safari')
    }

    // Verificar disponibilidad de WebAuthn
    if (!isWebAuthnAvailable()) {
      throw new Error('WebAuthn no está disponible')
    }

    // Verificar autenticador de plataforma
    const available = await isPlatformAuthenticatorAvailable()
    if (!available) {
      throw new Error('Autenticador de plataforma no disponible')
    }

    // Crear challenge
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Configuración específica para Face ID directo
    const options = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      // Configuración específica para evitar el modal de Passkeys
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged'
      },
      // No especificar credenciales para forzar Face ID
      allowCredentials: [],
      // Configuración adicional para iOS
      extensions: {
        'appid': window.location.origin
      }
    }

    console.log('Iniciando autenticación Face ID con opciones:', options)

    // Intentar autenticación
    const credential = await navigator.credentials.get({
      publicKey: options
    })

    if (!credential) {
      throw new Error('No se pudo obtener la credencial')
    }

    console.log('Autenticación Face ID exitosa:', credential)

    return {
      success: true,
      credential: credential,
      credentialId: credential.id
    }

  } catch (error) {
    console.error('Error en autenticación Face ID:', error)
    
    // Manejar errores específicos
    if (error.name === 'NotAllowedError') {
      return {
        success: false,
        error: 'Autenticación cancelada por el usuario',
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
    } else if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Autenticación abortada',
        code: 'ABORTED'
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
 * Función alternativa que intenta diferentes configuraciones
 */
export const authenticateWithFaceIDAlternative = async () => {
  const configurations = [
    // Configuración 1: Sin credenciales específicas
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: []
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
      },
      allowCredentials: []
    },
    // Configuración 3: Con residentKey discouraged
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged'
      },
      allowCredentials: []
    }
  ]

  for (let i = 0; i < configurations.length; i++) {
    try {
      console.log(`Intentando configuración ${i + 1}:`, configurations[i])
      
      // Generar nuevo challenge para cada intento
      crypto.getRandomValues(configurations[i].challenge)
      
      const credential = await navigator.credentials.get({
        publicKey: configurations[i]
      })

      if (credential) {
        console.log(`Autenticación exitosa con configuración ${i + 1}:`, credential)
        return {
          success: true,
          credential: credential,
          credentialId: credential.id,
          configuration: i + 1
        }
      }
    } catch (error) {
      console.log(`Configuración ${i + 1} falló:`, error.message)
      if (i === configurations.length - 1) {
        // Si es la última configuración, devolver el error
        throw error
      }
    }
  }

  throw new Error('Todas las configuraciones fallaron')
}

/**
 * Verificar si el dispositivo soporta Face ID
 */
export const checkFaceIDSupport = async () => {
  try {
    if (!isIOSSafari()) {
      return {
        supported: false,
        reason: 'No es iOS Safari'
      }
    }

    if (!isWebAuthnAvailable()) {
      return {
        supported: false,
        reason: 'WebAuthn no disponible'
      }
    }

    const available = await isPlatformAuthenticatorAvailable()
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
