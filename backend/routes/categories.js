import express from 'express';
import { CategoriesService } from '../services/categoriesService.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Middleware de validación para categorías
const validateCategory = [
  body('name').isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('color').isLength({ min: 1 }).withMessage('El color es requerido'),
  body('icon').optional().isLength({ min: 1 }).withMessage('El icono debe tener al menos 1 carácter'),
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

// GET /api/categories - Obtener todas las categorías
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await CategoriesService.getCategories(req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/categories/with-stats - Obtener categorías con estadísticas
router.get('/with-stats', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mes y año son requeridos'
      });
    }

    const result = await CategoriesService.getCategoriesWithStats(
      req.user.id,
      parseInt(month),
      parseInt(year)
    );

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo categorías con estadísticas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/categories - Crear nueva categoría
router.post('/', authenticateToken, validateCategory, async (req, res) => {
  try {
    const result = await CategoriesService.createCategory(req.body);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando categoría:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/categories/:id - Actualizar categoría
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await CategoriesService.updateCategory(id, updates);

    res.json(result);
  } catch (error) {
    console.error('Error actualizando categoría:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/categories/:id - Eliminar categoría
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CategoriesService.deleteCategory(id);

    res.json(result);
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/categories/:id/stats - Obtener estadísticas de categoría
router.get('/:id/stats', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await CategoriesService.getCategoryStats(id, req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estadísticas de categoría:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/categories/:id/expenses - Obtener gastos de una categoría
router.get('/:id/expenses', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const filters = {
      month: req.query.month ? parseInt(req.query.month) : null,
      year: req.query.year ? parseInt(req.query.year) : null,
      card_id: req.query.card_id
    };

    const result = await CategoriesService.getCategoryExpenses(id, req.user.id, filters);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo gastos de categoría:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 