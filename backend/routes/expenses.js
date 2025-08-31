import express from 'express';
import { ExpensesService } from '../services/expensesService.js';
import { authenticateToken } from '../middleware/auth.js';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/database.js';

const router = express.Router();

// Middleware de validación para gastos
const validateExpense = [
  body('description').isLength({ min: 1 }).withMessage('La descripción es requerida'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('card_id').isUUID().withMessage('ID de tarjeta inválido'),
  body('category_id').isUUID().withMessage('ID de categoría inválido'),
  body('purchase_date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha de compra inválida (formato: YYYY-MM-DD)'),
  body('installments_count').optional().isInt({ min: 1 }).withMessage('El número de cuotas debe ser mayor a 0'),
  body('first_installment_date').optional().matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha de primera cuota inválida (formato: YYYY-MM-DD)'),
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

// GET /api/expenses - Obtener gastos del usuario
router.get('/', authenticateToken, async (req, res) => {
  try {
    const filters = {
      card_id: req.query.card_id || null,
      category_id: req.query.category_id || null,
      month: req.query.month ? parseInt(req.query.month) : null,
      year: req.query.year ? parseInt(req.query.year) : null
    };

    const result = await ExpensesService.getExpenses(req.user.id, filters);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo gastos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/monthly - Obtener gastos mensuales con cuotas
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const { month, year, card_id, category_id } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mes y año son requeridos'
      });
    }

    const filters = {
      card_id: card_id && card_id !== 'null' ? card_id : null,
      category_id: category_id && category_id !== 'null' ? category_id : null
    };

    const result = await ExpensesService.getMonthlyExpensesWithInstallments(
      req.user.id,
      parseInt(month),
      parseInt(year),
      filters
    );

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo gastos mensuales:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/monthly-total - Obtener total mensual
router.get('/monthly-total', authenticateToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mes y año son requeridos'
      });
    }

    const result = await ExpensesService.getMonthlyTotalWithInstallments(
      req.user.id,
      parseInt(month),
      parseInt(year)
    );

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo total mensual:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/expenses - Crear nuevo gasto
router.post('/', authenticateToken, validateExpense, async (req, res) => {
  try {
    
    const expenseData = {
      ...req.body,
      user_id: req.user.id
    };


    const result = await ExpensesService.createExpense(expenseData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando gasto:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/expenses/:id - Actualizar gasto
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verificar que el gasto pertenece al usuario
    const expenseResult = await ExpensesService.getExpenses(req.user.id, {});
    const userExpense = expenseResult.data.find(e => e.id === id);
    
    if (!userExpense) {
      return res.status(404).json({
        success: false,
        error: 'Gasto no encontrado o no autorizado'
      });
    }

    const result = await ExpensesService.updateExpense(id, updates);

    res.json(result);
  } catch (error) {
    console.error('Error actualizando gasto:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/expenses/:id - Eliminar gasto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await ExpensesService.deleteExpense(id, req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error eliminando gasto:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/:id/installments - Obtener cuotas de un gasto
router.get('/:id/installments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el gasto pertenece al usuario
    const expenseResult = await ExpensesService.getExpenses(req.user.id, {});
    const userExpense = expenseResult.data.find(e => e.id === id);
    
    if (!userExpense) {
      return res.status(404).json({
        success: false,
        error: 'Gasto no encontrado o no autorizado'
      });
    }

    const result = await ExpensesService.getInstallments(id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo cuotas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/:id/installments-summary - Obtener resumen de cuotas
router.get('/:id/installments-summary', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el gasto pertenece al usuario
    const expenseResult = await ExpensesService.getExpenses(req.user.id, {});
    const userExpense = expenseResult.data.find(e => e.id === id);
    
    if (!userExpense) {
      return res.status(404).json({
        success: false,
        error: 'Gasto no encontrado o no autorizado'
      });
    }

    const result = await ExpensesService.getExpenseInstallmentsSummary(id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo resumen de cuotas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/expenses/installments/:id/status - Actualizar estado de cuota
router.put('/installments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status_id } = req.body;

    if (!payment_status_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_status_id es requerido'
      });
    }

    const result = await ExpensesService.updateInstallmentStatus(id, payment_status_id);

    res.json(result);
  } catch (error) {
    console.error('Error actualizando estado de cuota:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/expenses/:id/mark-as-paid - Marcar gasto como pagado
router.put('/:id/mark-as-paid', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_status_id } = req.body;

    if (!payment_status_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_status_id es requerido'
      });
    }

    const result = await ExpensesService.markAsPaid(id, payment_status_id);

    res.json(result);
  } catch (error) {
    console.error('Error marcando gasto como pagado:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/upcoming-installments - Obtener cuotas próximas a vencer
router.get('/upcoming-installments', authenticateToken, async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;

    const result = await ExpensesService.getUpcomingInstallments(req.user.id, limit);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo cuotas próximas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/payment-status - Obtener estado de pago por código
router.get('/payment-status', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Código de estado es requerido'
      });
    }

    const result = await ExpensesService.getPaymentStatusByCode(code);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estado de pago:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/expenses/installments - Crear cuotas para un gasto
router.post('/installments', authenticateToken, async (req, res) => {
  try {
    const installmentsData = req.body;

    if (!Array.isArray(installmentsData)) {
      return res.status(400).json({
        success: false,
        error: 'Los datos deben ser un array de cuotas'
      });
    }

    const result = await ExpensesService.createInstallments(installmentsData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando cuotas:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Ruta para obtener categorías del usuario (solo las que tiene gastos)
router.get('/user-categories', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Primero obtener las categorías que el usuario tiene gastos
    const { data: expenseCategories, error: expenseError } = await supabase
      .from('expenses')
      .select('category_id')
      .eq('user_id', userId);
    
    if (expenseError) {
      throw expenseError;
    }
    
    // Si no hay gastos, retornar array vacío
    if (!expenseCategories || expenseCategories.length === 0) {
      return res.json({
        success: true,
        categories: []
      });
    }
    
    // Extraer los IDs únicos de categorías
    const categoryIds = [...new Set(expenseCategories.map(exp => exp.category_id))];
    
    // Obtener las categorías
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select(`
        id,
        name,
        color
      `)
      .in('id', categoryIds)
      .order('name');
    
    if (categoriesError) {
      throw categoriesError;
    }
    
    res.json({
      success: true,
      categories: categories || []
    });
  } catch (error) {
    console.error('Error obteniendo categorías del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener tarjetas del usuario (solo las que tiene gastos asociados)
router.get('/user-cards', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Obtener todas las tarjetas del usuario que tienen gastos
    const { data: userCards, error: userCardsError } = await supabase
      .from('user_cards')
      .select(`
        available_card_id,
        available_cards(
          id,
          name,
          type,
          bank,
          payment_day,
          credit_limit
        )
      `)
      .eq('user_id', userId);
    
    if (userCardsError) {
      throw userCardsError;
    }
    
    // Si no hay tarjetas, retornar array vacío
    if (!userCards || userCards.length === 0) {
      return res.json({
        success: true,
        cards: []
      });
    }
    
    // Extraer las tarjetas disponibles y filtrar solo las que tienen gastos
    const cardsWithExpenses = [];
    
    for (const userCard of userCards) {
      if (userCard.available_cards) {
        // Verificar si esta tarjeta tiene gastos
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('id')
          .eq('user_id', userId)
          .eq('card_id', userCard.available_card_id)
          .limit(1);
        
        if (expensesError) {
          console.error('Error verificando gastos para tarjeta:', expensesError);
          continue;
        }
        
        // Si hay gastos, agregar la tarjeta a la lista
        if (expenses && expenses.length > 0) {
          cardsWithExpenses.push(userCard.available_cards);
        }
      }
    }
    
    res.json({
      success: true,
      cards: cardsWithExpenses
    });
  } catch (error) {
    console.error('Error obteniendo tarjetas del usuario:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router; 