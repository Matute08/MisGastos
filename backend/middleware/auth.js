import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

// Middleware para verificar token JWT
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      error: 'Token de acceso requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ 
      error: 'Token inválido o expirado',
      code: 'TOKEN_INVALID'
    });
  }
};

// Middleware para verificar si el usuario es admin
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador',
      code: 'ADMIN_REQUIRED'
    });
  }
  next();
};

// Middleware para verificar si el usuario es moderador o admin
export const requireModerator = (req, res, next) => {
  if (!req.user || !['admin', 'moderator'].includes(req.user.role)) {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de moderador',
      code: 'MODERATOR_REQUIRED'
    });
  }
  next();
};

// Validaciones para autenticación
export const validateLogin = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }
    next();
  }
];

export const validateRegister = [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('nombre_perfil').isLength({ min: 2 }).withMessage('El nombre debe tener al menos 2 caracteres'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }
    next();
  }
]; 