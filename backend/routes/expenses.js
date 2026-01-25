import express from 'express';
import { ExpensesService } from '../services/expensesService.js';
import { authenticateToken } from '../middleware/auth.js';
import { verifyExpenseOwnership, verifyInstallmentOwnership } from '../middleware/ownership.js';
import { body, validationResult } from 'express-validator';
import { queryValidators, handleValidationErrors } from '../middleware/validation.js';
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
  body('payment_status_id').optional().isInt({ min: 1 }).withMessage('ID de estado de pago inválido'),
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

// Middleware de validación para gastos programados
const validateScheduledExpense = [
  body('description').isLength({ min: 1 }).withMessage('La descripción es requerida'),
  body('amount').isFloat({ min: 0.01 }).withMessage('El monto debe ser mayor a 0'),
  body('card_id').isUUID().withMessage('ID de tarjeta inválido'),
  body('category_id').isUUID().withMessage('ID de categoría inválido'),
  body('scheduled_start_month').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Fecha de inicio inválida (formato: YYYY-MM-DD)'),
  body('scheduled_months').optional().custom((value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'number' && value >= 1) return true;
    throw new Error('El número de meses debe ser mayor a 0');
  }),
  body('payment_status_id').optional().isInt({ min: 1 }).withMessage('ID de estado de pago inválido'),
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
router.get('/', 
  authenticateToken,
  queryValidators.month,
  queryValidators.year,
  queryValidators.uuid('card_id'),
  queryValidators.uuid('category_id'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        card_id: req.query.card_id && req.query.card_id !== 'null' ? req.query.card_id : null,
        category_id: req.query.category_id && req.query.category_id !== 'null' ? req.query.category_id : null,
        month: req.query.month || null,
        year: req.query.year || null
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
  }
);

// GET /api/expenses/monthly - Obtener gastos mensuales con cuotas
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const { month, year, card_id, category_id, payment_status_id } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({
        success: false,
        error: 'Mes y año son requeridos'
      });
    }

    // Validar que month y year sean números válidos
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    
    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        success: false,
        error: 'Mes y año deben ser números válidos (mes: 1-12)'
      });
    }

    const filters = {
      card_id: card_id && card_id !== 'null' ? card_id : null,
      category_id: category_id && category_id !== 'null' ? category_id : null,
      payment_status_id: payment_status_id && payment_status_id !== 'null' ? payment_status_id : null
    };
    


    const result = await ExpensesService.getMonthlyExpensesWithInstallments(
      req.user.id,
      monthNum,
      yearNum,
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
router.get('/monthly-total',
  authenticateToken,
  ...queryValidators.monthYearRequired,
  queryValidators.uuid('card_id'),
  queryValidators.uuid('category_id'),
  queryValidators.paymentStatusId,
  handleValidationErrors,
  async (req, res) => {
    try {
      const filters = {
        card_id: req.query.card_id || null,
        category_id: req.query.category_id || null,
        payment_status_id: req.query.payment_status_id && req.query.payment_status_id !== 'null'
          ? parseInt(req.query.payment_status_id)
          : null
      };

      const result = await ExpensesService.getMonthlyTotalWithInstallments(
        req.user.id,
        req.query.month,
        req.query.year,
        filters
      );

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo total mensual:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

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
router.put('/:id', authenticateToken, verifyExpenseOwnership, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // IMPORTANTE: Aunque el gasto sea parte de un gasto programado (is_scheduled = true),
    // cuando se actualiza un gasto individual, solo debemos actualizar ese gasto específico,
    // NO todos los gastos programados relacionados.
    // Para actualizar todos los gastos programados de una serie, se debe usar PUT /api/expenses/scheduled/:id
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

// DELETE /api/expenses/:id/scheduled - Eliminar gasto programado con opciones (DEBE IR ANTES DE /:id)
router.delete('/:id/scheduled', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 DEBUG - Ruta de eliminación programada llamada');
    console.log('📋 Parámetros:', { id: req.params.id, body: req.body });
    
    const { deleteOption } = req.body; // 'current' o 'future'
    console.log('🔍 DeleteOption recibido:', deleteOption);
    
    const result = await ExpensesService.deleteScheduledExpense(
      req.user.id, 
      req.params.id, 
      deleteOption || 'current'
    );
    
    console.log('✅ Resultado de eliminación:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error eliminando gasto programado:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor'
    });
  }
});

// DELETE /api/expenses/:id - Eliminar gasto
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { deleteOption } = req.body; // Puede ser 'future' para gastos programados

    console.log('🔍 DEBUG - Eliminando gasto ID:', id, 'deleteOption:', deleteOption);
    console.log('🔍 DEBUG - Cuerpo de la petición:', req.body);
    console.log('🔍 DEBUG - Tipo de deleteOption:', typeof deleteOption);

    const result = await ExpensesService.deleteExpense(id, req.user.id, deleteOption);

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
router.get('/:id/installments', authenticateToken, verifyExpenseOwnership, async (req, res) => {
  try {
    const { id } = req.params;

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
router.get('/:id/installments-summary', authenticateToken, verifyExpenseOwnership, async (req, res) => {
  try {
    const { id } = req.params;

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
router.put('/installments/:id/status', authenticateToken, verifyInstallmentOwnership, async (req, res) => {
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
    const userId = req.user.id;

    if (!payment_status_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_status_id es requerido'
      });
    }

    let result;
    
    // Detectar si es una cuota (prefijo installment-) o un gasto normal
    if (id.startsWith('installment-')) {
      const installmentId = id.replace('installment-', '');
      
      // Verificar ownership de la cuota
      const { data: installment, error: installmentError } = await supabase
        .from('installments')
        .select(`
          id,
          expenses!inner(user_id)
        `)
        .eq('id', installmentId)
        .eq('expenses.user_id', userId)
        .single();
      
      if (installmentError || !installment) {
        return res.status(404).json({
          success: false,
          error: 'Cuota no encontrada o no autorizada'
        });
      }
      
      result = await ExpensesService.markInstallmentAsPaid(installmentId, payment_status_id);
    } else {
      // Verificar ownership del gasto
      const { data: expense, error: expenseError } = await supabase
        .from('expenses')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();
      
      if (expenseError || !expense) {
        return res.status(404).json({
          success: false,
          error: 'Gasto no encontrado o no autorizado'
        });
      }
      
      result = await ExpensesService.markAsPaid(id, payment_status_id);
    }

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
router.get('/upcoming-installments',
  authenticateToken,
  queryValidators.limit,
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = req.query.limit || 100;

      const result = await ExpensesService.getUpcomingInstallments(req.user.id, limit);

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo cuotas próximas:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// GET /api/expenses/payment-status - Obtener estado de pago por código
router.get('/payment-status',
  authenticateToken,
  queryValidators.code,
  handleValidationErrors,
  async (req, res) => {
    try {
      const result = await ExpensesService.getPaymentStatusByCode(req.query.code);

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo estado de pago:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);

// GET /api/expenses/payment-statuses - Obtener todos los estados de pago
router.get('/payment-statuses', authenticateToken, async (req, res) => {
  try {
    const result = await ExpensesService.getAllPaymentStatuses();

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo estados de pago:', error);
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

// GET /api/expenses/credit-cards-summary - Obtener resumen de gastos por tarjeta de crédito
router.get('/credit-cards-summary', authenticateToken, async (req, res) => {
  try {
    const isAnnual = req.query.period === 'annual';
    
    const result = await ExpensesService.getCreditCardsSummary(req.user.id, isAnnual);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo resumen de tarjetas:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/expenses/summary-by-type - Obtener resumen de gastos por tipo de tarjeta
router.get('/summary-by-type', authenticateToken, async (req, res) => {
  try {
    const period = req.query.period;
    const isAnnual = period === 'annual';
    
    console.log(`📊 Request recibido - period: "${period}", isAnnual: ${isAnnual}`);
    
    const result = await ExpensesService.getExpensesSummaryByType(req.user.id, isAnnual);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo resumen por tipo:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== RUTAS PARA GASTOS PROGRAMADOS =====

// GET /api/expenses/scheduled - Obtener gastos programados del usuario
router.get('/scheduled', authenticateToken, async (req, res) => {
  try {
    const result = await ExpensesService.getScheduledExpenses(req.user.id);

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo gastos programados:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/expenses/scheduled - Crear gasto programado
router.post('/scheduled', authenticateToken, validateScheduledExpense, async (req, res) => {
  try {
    const expenseData = {
      ...req.body,
      user_id: req.user.id,
      is_scheduled: true
    };

    const result = await ExpensesService.createScheduledExpense(expenseData);

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creando gasto programado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/expenses/scheduled/:id - Actualizar gasto programado
router.put('/scheduled/:id', authenticateToken, validateScheduledExpense, async (req, res) => {
  try {
    const result = await ExpensesService.updateScheduledExpense(req.user.id, req.params.id, req.body);

    res.json(result);
  } catch (error) {
    console.error('Error actualizando gasto programado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/expenses/scheduled/:id - Cancelar gasto programado
router.delete('/scheduled/:id', authenticateToken, async (req, res) => {
  try {
    const result = await ExpensesService.cancelScheduledExpense(req.user.id, req.params.id);

    res.json(result);
  } catch (error) {
    console.error('Error cancelando gasto programado:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router; 