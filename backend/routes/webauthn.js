// routes/webauthn.js
import express from 'express';
import { supabase } from '../config/database.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server';

const router = express.Router();

/**
 * Configuración WebAuthn
 * Podés mover estos valores a variables de entorno si querés:
 *  - process.env.RP_NAME
 *  - process.env.RP_ID
 *  - process.env.RP_ORIGIN
 */
const rpName = process.env.RP_NAME || 'MisGastos';
const rpID = process.env.RP_ID || 'mis-gastos-phi.vercel.app';
const rpOrigin = process.env.RP_ORIGIN || 'https://mis-gastos-phi.vercel.app';

// Almacenar challenges temporalmente (en producción usar Redis o DB)
const challenges = new Map();

/**
 * Generar opciones de registro
 */
router.post('/generate-registration-options', async (req, res) => {
  try {
    const { userId, email } = req.body;

    if (!userId || !email) {
      return res.status(400).json({
        success: false,
        error: 'userId y email son requeridos'
      });
    }

    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: userId.toString(),
      userName: email,
      userDisplayName: email,
      attestationType: 'none', // Cambiado a 'none' para mejor compatibilidad con Face ID
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred', // Mejor compatibilidad con Face ID
      },
    });

    // Guardar challenge temporalmente
    challenges.set(userId, {
      challenge: options.challenge,
      options,
      timestamp: Date.now()
    });

    res.json({ success: true, options });
  } catch (error) {
    console.error('Error generando opciones de registro:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * Verificar registro de credencial
 */
router.post('/verify-registration', async (req, res) => {
  try {
    const { userId, credential } = req.body;

    if (!userId || !credential) {
      return res.status(400).json({
        success: false,
        error: 'userId y credential son requeridos'
      });
    }

    const stored = challenges.get(userId);
    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'Challenge no encontrado o expirado'
      });
    }

    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      challenges.delete(userId);
      return res.status(400).json({
        success: false,
        error: 'Challenge expirado'
      });
    }

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

    // Guardar credencial en la base
    // Nota: Supabase/PG suele manejar bytea como base64 al traer/insertar.
    // Si tu columna es BYTEA, esto va bien. Si es TEXT, convertí a base64 manual.
    const { error } = await supabase
      .from('webauthn_credentials')
      .insert({
        user_id: userId,
        credential_id: verification.registrationInfo.credentialID,     // Buffer
        public_key: verification.registrationInfo.credentialPublicKey, // Buffer
        sign_count: verification.registrationInfo.counter
      });

    if (error) {
      console.error('Error guardando credencial:', error);
      return res.status(500).json({
        success: false,
        error: 'Error guardando credencial'
      });
    }

    challenges.delete(userId);

    res.json({ success: true, message: 'Credencial registrada exitosamente' });
  } catch (error) {
    console.error('Error verificando registro:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * Generar opciones de autenticación
 */
router.post('/generate-authentication-options', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId es requerido'
      });
    }

    const { data: credentials, error } = await supabase
      .from('webauthn_credentials')
      .select('credential_id')
      .eq('user_id', userId);

    if (error || !credentials || !credentials.length) {
      return res.status(404).json({
        success: false,
        error: 'No se encontraron credenciales biométricas'
      });
    }

    // Supabase devuelve BYTEA como base64; convertimos a Buffer
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: credentials.map(cred => ({
        id: Buffer.isBuffer(cred.credential_id)
          ? cred.credential_id
          : Buffer.from(cred.credential_id, 'base64'),
        type: 'public-key'
      })),
      userVerification: 'required',
      // Configuración optimizada para Face ID
      timeout: 60000,
    });

    challenges.set(userId, {
      challenge: options.challenge,
      options,
      timestamp: Date.now()
    });

    res.json({ success: true, options });
  } catch (error) {
    console.error('Error generando opciones de autenticación:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * Verificar autenticación
 */
router.post('/verify-authentication', async (req, res) => {
  try {
    const { userId, credential } = req.body;

    if (!userId || !credential) {
      return res.status(400).json({
        success: false,
        error: 'userId y credential son requeridos'
      });
    }

    const stored = challenges.get(userId);
    if (!stored) {
      return res.status(400).json({
        success: false,
        error: 'Challenge no encontrado o expirado'
      });
    }

    if (Date.now() - stored.timestamp > 5 * 60 * 1000) {
      challenges.delete(userId);
      return res.status(400).json({
        success: false,
        error: 'Challenge expirado'
      });
    }

    // Buscar credencial del usuario
    const { data: storedCredential, error: fetchError } = await supabase
      .from('webauthn_credentials')
      .select('*')
      .eq('user_id', userId)
      .eq('credential_id', credential.id) // si guardaste como bytea, este eq puede no matchear; en ese caso compará aparte
      .single();

    if (fetchError || !storedCredential) {
      return res.status(400).json({
        success: false,
        error: 'Credencial no encontrada'
      });
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: stored.challenge,
      expectedOrigin: rpOrigin,
      expectedRPID: rpID,
      authenticator: {
        credentialPublicKey: Buffer.isBuffer(storedCredential.public_key)
          ? storedCredential.public_key
          : Buffer.from(storedCredential.public_key, 'base64'),
        credentialID: Buffer.isBuffer(storedCredential.credential_id)
          ? storedCredential.credential_id
          : Buffer.from(storedCredential.credential_id, 'base64'),
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
      .eq('credential_id', storedCredential.credential_id);

    if (error) {
      console.error('Error actualizando sign count:', error);
    }

    challenges.delete(userId);

    // Generar token JWT
    const token = generateJWT(userId);

    res.json({
      success: true,
      token,
      message: 'Autenticación exitosa'
    });
  } catch (error) {
    console.error('Error verificando autenticación:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

/**
 * Generar JWT (idéntico a tu auth.js)
 */
const generateJWT = (userId) => {
  const secret = process.env.JWT_SECRET || 'tu-secreto-jwt';
  return jwt.sign({ userId }, secret, { expiresIn: '24h' });
};

/**
 * Verificar si el usuario tiene credenciales biométricas
 */
router.get('/check-credentials/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId es requerido'
      });
    }

    const { data: credentials, error } = await supabase
      .from('webauthn_credentials')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('Error verificando credenciales:', error);
      return res.status(500).json({ success: false, error: 'Error interno del servidor' });
    }

    res.json({
      success: true,
      hasCredentials: credentials && credentials.length > 0
    });
  } catch (error) {
    console.error('Error verificando credenciales:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

export default router;
