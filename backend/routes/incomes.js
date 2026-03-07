import express from 'express';
import { IncomesService } from '../services/incomesService.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

const validateIncome = [
  body('description').isLength({ min: 1 }).withMessage('La descripción es requerida'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('income_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha inválida (formato: YYYY-MM-DD)'),
  body('is_recurring').optional().isBoolean().withMessage('is_recurring debe ser booleano'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, error: 'Datos inválidos', details: errors.array() });
    }
    next();
  }
];

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await IncomesService.getIncomes(req.user.id, req.query);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    const result = await IncomesService.getSummary(req.user.id, month, year);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authenticateToken, validateIncome, async (req, res) => {
  try {
    const incomeData = {
      user_id: req.user.id,
      description: req.body.description,
      amount: parseFloat(req.body.amount),
      income_date: req.body.income_date,
      is_recurring: req.body.is_recurring || false,
    };
    const result = await IncomesService.createIncome(incomeData);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const updates = {};
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.amount !== undefined) updates.amount = parseFloat(req.body.amount);
    const incomeDateValue = req.body.income_date || req.body.date;
    if (incomeDateValue !== undefined) updates.income_date = incomeDateValue;
    if (req.body.is_recurring !== undefined) updates.is_recurring = req.body.is_recurring;

    const result = await IncomesService.updateIncome(req.params.id, req.user.id, updates);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await IncomesService.deleteIncome(req.params.id, req.user.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
