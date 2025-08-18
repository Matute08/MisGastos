import express from 'express';
import { AvailableCardsService } from '../services/availableCardsService.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware de validación para tarjetas disponibles
const validateAvailableCard = [
  body('name').isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('type').isIn(['Crédito', 'Débito']).withMessage('El tipo debe ser Crédito o Débito'),
  body('bank').isLength({ min: 1 }).withMessage('El banco es requerido'),
  body('payment_day').optional().isInt({ min: 1, max: 31 }).withMessage('El día de pago debe estar entre 1 y 31'),
  body('credit_limit').optional().isFloat({ min: 0 }).withMessage('El límite de crédito debe ser mayor o igual a 0'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Datos de entrada inválidos',
        details: errors.array()
      });
    }
    next();
  }
];

// GET /api/available-cards - Obtener todas las tarjetas disponibles (público)
router.get('/', async (req, res) => {
  try {
    const result = await AvailableCardsService.getAllAvailableCards();
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo tarjetas disponibles:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/available-cards - Crear nueva tarjeta disponible (solo admin)
router.post('/', authenticateToken, requireAdmin, validateAvailableCard, async (req, res) => {
  try {
    const result = await AvailableCardsService.createAvailableCard(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando tarjeta disponible:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/available-cards/:id - Actualizar tarjeta disponible (solo admin)
router.put('/:id', authenticateToken, requireAdmin, validateAvailableCard, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AvailableCardsService.updateAvailableCard(id, req.body);
    res.json(result);
  } catch (error) {
    console.error('Error actualizando tarjeta disponible:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/available-cards/:id - Eliminar tarjeta disponible (solo admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AvailableCardsService.deleteAvailableCard(id);
    res.json(result);
  } catch (error) {
    console.error('Error eliminando tarjeta disponible:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/available-cards/:id - Obtener tarjeta disponible por ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await AvailableCardsService.getAvailableCardById(id);
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo tarjeta disponible:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
