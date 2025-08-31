import { apiClient } from '../lib/api.js'

// Verificar si el dispositivo soporta WebAuthn
export const isWebAuthnSupported = () => {
  return window.PublicKeyCredential !== undefined
}

// Verificar si hay autenticador biométrico disponible
export const isBiometricSupported = async () => {
  if (!isWebAuthnSupported()) {
    return false
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch (error) {
    console.error('Error verificando soporte biométrico:', error)
    return false
  }
}

// Registrar credencial biométrica
export const registerBiometricCredential = async (userId, email) => {
  try {
    // 1. Obtener opciones de registro del servidor
    const { success, options } = await apiClient.post('/webauthn/generate-registration-options', {
      userId,
      email
    })

    if (!success) {
      throw new Error('Error obteniendo opciones de registro')
    }

    // 2. Crear credencial en el navegador
    const credential = await navigator.credentials.create({
      publicKey: options
    })

    // 3. Verificar credencial en el servidor
    const verification = await apiClient.post('/webauthn/verify-registration', {
      userId,
      credential: {
        id: credential.id,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(new Uint8Array(credential.response.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(credential.response.clientDataJSON))
        },
        type: credential.type
      }
    })

    return verification
  } catch (error) {
    console.error('Error registrando credencial biométrica:', error)
    throw error
  }
}

// Autenticar con credencial biométrica
export const authenticateWithBiometric = async (userId) => {
  try {
    // 1. Obtener opciones de autenticación del servidor
    const { success, options } = await apiClient.post('/webauthn/generate-authentication-options', {
      userId
    })

    if (!success) {
      throw new Error('Error obteniendo opciones de autenticación')
    }

    // 2. Obtener credencial del navegador
    const assertion = await navigator.credentials.get({
      publicKey: options
    })

    // 3. Verificar assertion en el servidor
    const verification = await apiClient.post('/webauthn/verify-authentication', {
      userId,
      credential: {
        id: assertion.id,
        rawId: Array.from(new Uint8Array(assertion.rawId)),
        response: {
          authenticatorData: Array.from(new Uint8Array(assertion.response.authenticatorData)),
          clientDataJSON: Array.from(new Uint8Array(assertion.response.clientDataJSON)),
          signature: Array.from(new Uint8Array(assertion.response.signature))
        },
        type: assertion.type
      }
    })

    return verification
  } catch (error) {
    console.error('Error autenticando con biométrico:', error)
    throw error
  }
}

// Detectar tipo de autenticación disponible
export const getBiometricType = () => {
  const userAgent = window.navigator.userAgent
  
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

// Verificar si el usuario tiene credenciales biométricas registradas
export const hasBiometricCredentials = async (userId) => {
  try {
    const response = await apiClient.get(`/webauthn/check-credentials/${userId}`)
    return response.success && response.hasCredentials
  } catch (error) {
    console.error('Error verificando credenciales biométricas:', error)
    return false
  }
}
