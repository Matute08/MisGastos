// Implementación que intenta bypasear el modal de Passkeys
// Esta implementación usa configuraciones específicas para evitar el modal

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
 * Autenticación Face ID que intenta bypasear el modal de Passkeys
 * Esta función usa configuraciones específicas para evitar el modal
 */
export const authenticateWithFaceIDBypass = async () => {
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

    // Configuración específica para bypasear el modal de Passkeys
    const options = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      // Configuración específica para evitar el modal
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged'
      },
      // No especificar credenciales para forzar Face ID
      allowCredentials: [],
      // Configuración adicional para iOS
      extensions: {
        'appid': window.location.origin,
        'credProps': true
      }
    }

    console.log('Solicitando Face ID con configuración de bypass:', options)

    // Solicitar autenticación
    const credential = await navigator.credentials.get({
      publicKey: options
    })

    if (!credential) {
      throw new Error('No se pudo obtener la credencial')
    }

    console.log('Face ID exitoso con configuración de bypass:', credential)

    return {
      success: true,
      credential: credential,
      credentialId: credential.id
    }

  } catch (error) {
    console.error('Error en Face ID bypass:', error)
    
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
 * Función que intenta diferentes configuraciones para bypasear el modal
 */
export const authenticateWithFaceIDMultipleBypass = async () => {
  const configs = [
    // Configuración 1: Con extensions específicas
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
      allowCredentials: [],
      extensions: {
        'appid': window.location.origin,
        'credProps': true
      }
    },
    // Configuración 2: Sin extensions
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
    },
    // Configuración 3: Con residentKey required
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'required'
      },
      allowCredentials: []
    },
    // Configuración 4: Con residentKey preferred
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred'
      },
      allowCredentials: []
    },
    // Configuración 5: Sin authenticatorSelection
    {
      challenge: new Uint8Array(32),
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      allowCredentials: []
    }
  ]

  for (let i = 0; i < configs.length; i++) {
    try {
      console.log(`Intentando configuración de bypass ${i + 1}:`, configs[i])
      
      // Generar nuevo challenge
      crypto.getRandomValues(configs[i].challenge)
      
      const credential = await navigator.credentials.get({
        publicKey: configs[i]
      })

      if (credential) {
        console.log(`Face ID exitoso con configuración de bypass ${i + 1}:`, credential)
        return {
          success: true,
          credential: credential,
          credentialId: credential.id,
          configUsed: i + 1
        }
      }
    } catch (error) {
      console.log(`Configuración de bypass ${i + 1} falló:`, error.message)
      if (i === configs.length - 1) {
        // Si es la última configuración, devolver el error
        throw error
      }
    }
  }

  throw new Error('Todas las configuraciones de bypass fallaron')
}

/**
 * Verificar soporte de Face ID
 */
export const checkFaceIDSupportBypass = async () => {
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
