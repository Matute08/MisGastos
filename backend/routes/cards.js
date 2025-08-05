import express from 'express';
import { CardsService } from '../services/cardsService.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware de validación para tarjetas
const validateCard = [
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

// GET /api/cards - Obtener tarjetas del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await CardsService.getCards(req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo tarjetas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/cards - Crear nueva tarjeta
router.post('/', authenticateToken, validateCard, async (req, res) => {
  try {
    const cardData = {
      ...req.body,
      user_id: req.user.id
    };

    const result = await CardsService.createCard(cardData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando tarjeta:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/cards/:id - Actualizar tarjeta
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await CardsService.updateCard(id, req.user.id, updates);

    res.json(result);
  } catch (error) {
    console.error('Error actualizando tarjeta:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/cards/:id - Eliminar tarjeta
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CardsService.deleteCard(id, req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error eliminando tarjeta:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/cards/:id/stats - Obtener estadísticas de tarjeta
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CardsService.getCardStats(id, req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estadísticas de tarjeta:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/cards/:id/expenses - Obtener gastos de una tarjeta
router.get('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      month: req.query.month ? parseInt(req.query.month) : null,
      year: req.query.year ? parseInt(req.query.year) : null,
      category_id: req.query.category_id
    };

    const result = await CardsService.getCardExpenses(id, req.user.id, filters);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo gastos de tarjeta:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 