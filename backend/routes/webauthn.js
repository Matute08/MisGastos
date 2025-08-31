import express from 'express';
import { supabase } from '../config/database.js';
import crypto from 'crypto';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

const router = express.Router();

// Configuración WebAuthn
const rpName = 'MisGastos';
const rpID = 'mis-gastos-phi.vercel.app';
const rpOrigin = 'https://mis-gastos-phi.vercel.app';

// Almacenar challenges temporalmente (en producción usar Redis)
const challenges = new Map();

// Generar challenge para registro
router.post('/generate-registration-options', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'userId y email son requeridos'
      });
    }

    // Generar opciones de registro usando la librería
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId.toString(),
      userName: email,
      userDisplayName: email,
      attestationType: 'direct',
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
      },
    });

    // Guardar challenge temporalmente
    challenges.set(userId, {
      challenge: options.challenge,
      options: options,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      options: options
    });

  } catch (error) {
    console.error('Error generando opciones de registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar registro de credencial
router.post('/verify-registration', async (req, res) => {
  try {
    const { userId, credential } = req.body;

    if (!userId || !credential) {
      return res.status(400).json({
        success: false,
        error: 'userId y credential son requeridos'
      });
    }

    // Obtener challenge guardado
    const stored = challenges.get(userId);
    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'Challenge no encontrado o expirado'
      });
    }

    // Verificar que el challenge no haya expirado (5 minutos)
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      challenges.delete(userId);
      return res.status(400).json({
        success: false,
        error: 'Challenge expirado'
      });
    }

    // Verificar la credencial usando la librería
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: stored.challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        error: 'Verificación de credencial fallida'
      });
    }

    // Guardar credencial en la base de datos
    const { error } = await supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: verification.registrationInfo.credentialID,
        public_key: verification.registrationInfo.credentialPublicKey,
        sign_count: verification.registrationInfo.counter
      });

    if (error) {
      console.error('Error guardando credencial:', error);
      return res.status(500).json({
        success: false,
        error: 'Error guardando credencial'
      });
    }

    // Limpiar challenge
    challenges.delete(userId);

    res.json({
      success: true,
      message: 'Credencial registrada exitosamente'
    });

  } catch (error) {
    console.error('Error verificando registro:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Generar challenge para autenticación
router.post('/generate-authentication-options', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId es requerido'
      });
    }

    // Obtener credenciales del usuario
    const { data: credentials, error } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', userId);

    if (error || !credentials.length) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron credenciales biométricas'
      });
    }

    // Generar opciones de autenticación usando la librería
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(cred => ({
        id: Buffer.from(cred.credential_id, 'base64'),
        type: 'public-key'
      })),
      userVerification: 'required',
    });

    // Guardar challenge
    challenges.set(userId, {
      challenge: options.challenge,
      options: options,
      timestamp: Date.now()
    });

    res.json({
      success: true,
      options: options
    });

  } catch (error) {
    console.error('Error generando opciones de autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Verificar autenticación
router.post('/verify-authentication', async (req, res) => {
  try {
    const { userId, credential } = req.body;

    if (!userId || !credential) {
      return res.status(400).json({
        success: false,
        error: 'userId y credential son requeridos'
      });
    }

    // Obtener challenge
    const stored = challenges.get(userId);
    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'Challenge no encontrado o expirado'
      });
    }

    // Verificar expiración
    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      challenges.delete(userId);
      return res.status(400).json({
        success: false,
        error: 'Challenge expirado'
      });
    }

    // Obtener credencial de la base de datos
    const { data: storedCredential, error: fetchError } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_id', credential.id)
      .single();

    if (fetchError || !storedCredential) {
      return res.status(400).json({
        success: false,
        error: 'Credencial no encontrada'
      });
    }

    // Verificar la credencial usando la librería
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: stored.challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: storedCredential.public_key,
        credentialID: storedCredential.credential_id,
        counter: storedCredential.sign_count,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({
        success: false,
        error: 'Verificación de autenticación fallida'
      });
    }

    // Actualizar sign count
    const { error } = await supabase
      .from('webauthn_credentials')
      .update({ sign_count: verification.authenticationInfo.newCounter })
      .eq('user_id', userId)
      .eq('credential_id', credential.id);

    if (error) {
      console.error('Error actualizando sign count:', error);
    }

    // Limpiar challenge
    challenges.delete(userId);

    // Generar token JWT
    const token = generateJWT(userId);

    res.json({
      success: true,
      token: token,
      message: 'Autenticación exitosa'
    });

  } catch (error) {
    console.error('Error verificando autenticación:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Función para generar JWT (usar la misma que en auth.js)
const generateJWT = (userId) => {
  const jwt = require('jsonwebtoken');
  const secret = process.env.JWT_SECRET || 'tu-secreto-jwt';
  
  return jwt.sign(
    { userId: userId },
    secret,
    { expiresIn: '24h' }
  );
};

// Verificar si el usuario tiene credenciales biométricas
router.get('/check-credentials/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId es requerido'
      });
    }

    // Verificar si existen credenciales para el usuario
    const { data: credentials, error } = await supabase
      .from('webauthn_credentials')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error verificando credenciales:', error);
      return res.status(500).json({
        success: false,
        error: 'Error interno del servidor'
      });
    }

    res.json({
      success: true,
      hasCredentials: credentials && credentials.length > 0
    });

  } catch (error) {
    console.error('Error verificando credenciales:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
