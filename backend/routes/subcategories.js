import express from 'express';
import { SubcategoriesService } from '../services/subcategoriesService.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware de validación para subcategorías
const validateSubcategory = [
  body('name').isLength({ min: 1 }).withMessage('El nombre es requerido'),
  body('color').isLength({ min: 1 }).withMessage('El color es requerido'),
  body('category_id').isUUID().withMessage('El ID de categoría es requerido y debe ser un UUID válido'),
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

// GET /api/subcategories - Obtener todas las subcategorías
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await SubcategoriesService.getSubcategories();
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo subcategorías:', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/subcategories/category/:categoryId - Obtener subcategorías por categoría
router.get('/category/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const result = await SubcategoriesService.getSubcategoriesByCategory(categoryId);
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo subcategorías por categoría:', { error: error.message, categoryId });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/subcategories/with-categories - Obtener categorías con sus subcategorías
router.get('/with-categories', authenticateToken, async (req, res) => {
  try {
    const result = await SubcategoriesService.getCategoriesWithSubcategories();
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo categorías con subcategorías:', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/subcategories - Crear nueva subcategoría
router.post('/', authenticateToken, validateSubcategory, async (req, res) => {
  try {
    const result = await SubcategoriesService.createSubcategory(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Error creando subcategoría:', { error: error.message });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/subcategories/:id - Actualizar subcategoría
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const result = await SubcategoriesService.updateSubcategory(id, updates);
    res.json(result);
  } catch (error) {
    logger.error('Error actualizando subcategoría:', { error: error.message, subcategoryId: id });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/subcategories/:id - Eliminar subcategoría
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SubcategoriesService.deleteSubcategory(id);
    res.json(result);
  } catch (error) {
    logger.error('Error eliminando subcategoría:', { error: error.message, subcategoryId: id });
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/subcategories/:id - Obtener subcategoría por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await SubcategoriesService.getSubcategoryById(id);
    res.json(result);
  } catch (error) {
    logger.error('Error obteniendo subcategoría por ID:', { error: error.message, subcategoryId: id });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 