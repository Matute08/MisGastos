// Servicio para autenticación biométrica nativa sin WebAuthn
// Esta implementación usa Face ID/Touch ID directamente

/**
 * Verificar si el dispositivo soporta autenticación biométrica nativa
 */
export const isNativeBiometricSupported = () => {
  // Verificar si estamos en iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  
  // Verificar si estamos en un navegador que soporte WebAuthn
  const hasWebAuthn = window.PublicKeyCredential !== undefined
  
  return isIOS && hasWebAuthn
}

/**
 * Verificar si hay autenticador biométrico disponible
 */
export const checkBiometricAvailability = async () => {
  try {
    if (!isNativeBiometricSupported()) {
      return false
    }

    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch (error) {
    console.error('Error verificando disponibilidad biométrica:', error)
    return false
  }
}

/**
 * Autenticación biométrica nativa usando Face ID/Touch ID
 * Esta función evita WebAuthn y usa directamente el autenticador de plataforma
 */
export const authenticateWithNativeBiometric = async () => {
  try {
    if (!isNativeBiometricSupported()) {
      throw new Error('Autenticación biométrica no soportada en este dispositivo')
    }

    // Verificar disponibilidad
    const available = await checkBiometricAvailability()
    if (!available) {
      throw new Error('Autenticador biométrico no disponible')
    }

    // Crear un challenge único
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Configuración específica para iOS Safari y Face ID
    const publicKeyCredentialRequestOptions = {
      challenge: challenge,
      rpId: window.location.hostname,
      userVerification: 'required',
      timeout: 60000,
      // Configuración específica para forzar Face ID en iOS
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'discouraged' // Evitar resident keys para forzar Face ID
      },
      // No especificar credenciales para permitir Face ID nativo
      allowCredentials: [],
      // Configuración adicional para iOS
      extensions: {
        // Forzar el uso del autenticador de plataforma
        'appid': window.location.origin
      }
    }

    console.log('Solicitando autenticación biométrica con configuración:', publicKeyCredentialRequestOptions)

    // Solicitar autenticación biométrica
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    })

    if (!assertion) {
      throw new Error('No se pudo obtener la credencial biométrica')
    }

    console.log('Autenticación biométrica exitosa:', assertion)

    return {
      success: true,
      assertion: assertion,
      credentialId: assertion.id
    }

  } catch (error) {
    console.error('Error en autenticación biométrica nativa:', error)
    
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
        error: 'Autenticación biométrica no soportada',
        code: 'NOT_SUPPORTED'
      }
    } else if (error.name === 'SecurityError') {
      return {
        success: false,
        error: 'Error de seguridad en la autenticación',
        code: 'SECURITY_ERROR'
      }
    } else {
      return {
        success: false,
        error: error.message || 'Error desconocido en autenticación biométrica',
        code: 'UNKNOWN_ERROR'
      }
    }
  }
}

/**
 * Detectar el tipo de autenticación biométrica disponible
 */
export const getBiometricType = () => {
  const userAgent = navigator.userAgent
  
  if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    return 'face' // Face ID por defecto en iOS
  } else if (userAgent.includes('Android')) {
    return 'fingerprint' // Huella dactilar en Android
  } else if (userAgent.includes('Windows')) {
    return 'windows-hello' // Windows Hello
  } else if (userAgent.includes('Mac')) {
    return 'touch-id' // Touch ID en macOS
  } else {
    return 'fingerprint' // Por defecto
  }
}

/**
 * Verificar si el usuario está en un dispositivo móvil
 */
export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

/**
 * Verificar si el usuario está en iOS
 */
export const isIOSDevice = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
}

/**
 * Verificar si el usuario está en Safari
 */
export const isSafari = () => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
}
