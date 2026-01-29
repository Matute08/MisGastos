import express from 'express';
import { AuthService } from '../services/authService.js';
import { validateLogin, validateRegister, authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /api/auth/register
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password, nombre_perfil } = req.body;

    const result = await AuthService.register({
      email,
      password,
      nombre_perfil
    });

    res.status(201).json(result);
  } catch (error) {
    logger.error('Error en registro:', { error: error.message, email: req.body?.email });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await AuthService.login(email, password);

    res.json(result);
  } catch (error) {
    logger.error('Error en login:', { error: error.message, email: req.body?.email });
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/auth/refresh - Renovar token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token requerido'
      });
    }

    const result = await AuthService.refreshToken(token);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    logger.error('Error renovando token:', { error: error.message });
    res.status(401).json({
      success: false,
      error: 'Token inválido o expirado'
    });
  }
});

// GET /api/auth/validate - Validar token
router.get('/validate', authenticateToken, async (req, res) => {
  try {
    // Si llegamos aquí, el token es válido
    res.json({
      success: true,
      message: 'Token válido'
    });
  } catch (error) {
    logger.error('Error validando token:', { error: error.message });
    res.status(401).json({
      success: false,
      error: 'Token inválido'
    });
  }
});

// GET /api/auth/profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const profile = await AuthService.getCurrentUserProfile(req.user.id);

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    logger.error('Error obteniendo perfil:', { error: error.message, userId: req.user.id });
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/auth/change-role (solo admin)
router.put('/change-role/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRoleName } = req.body;

    // Verificar que el usuario actual es admin
    const isAdmin = await AuthService.isAdmin(req.user.id);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Solo los administradores pueden cambiar roles'
      });
    }

    const result = await AuthService.changeUserRole(userId, newRoleName);

    res.json(result);
  } catch (error) {
    logger.error('Error cambiando rol:', { error: error.message, userId: req.params?.userId, newRoleName: req.body?.newRoleName, adminId: req.user?.id });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 