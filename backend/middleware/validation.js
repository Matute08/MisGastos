import { query, param, body, validationResult } from 'express-validator';

/**
 * Middleware para manejar errores de validación de forma consistente
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }
  next();
};

/**
 * Validadores para query parameters comunes
 */
export const queryValidators = {
  /**
   * Validar mes (1-12) en query parameter
   */
  month: query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('El mes debe ser un número entre 1 y 12')
    .toInt(),

  /**
   * Validar año (número positivo) en query parameter
   */
  year: query('year')
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage('El año debe ser un número válido (1900-2100)')
    .toInt(),

  /**
   * Validar mes y año requeridos
   */
  monthYearRequired: [
    query('month')
      .notEmpty()
      .withMessage('El mes es requerido')
      .isInt({ min: 1, max: 12 })
      .withMessage('El mes debe ser un número entre 1 y 12')
      .toInt(),
    query('year')
      .notEmpty()
      .withMessage('El año es requerido')
      .isInt({ min: 1900, max: 2100 })
      .withMessage('El año debe ser un número válido (1900-2100)')
      .toInt()
  ],

  /**
   * Validar UUID en query parameter (permite "null" como string)
   */
  uuid: (fieldName = 'id') => query(fieldName)
    .optional()
    .custom((value) => {
      // Permitir null, undefined, o el string "null"
      if (!value || value === 'null' || value === null || value === undefined) {
        return true;
      }
      // Validar UUID si tiene un valor
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error(`${fieldName} debe ser un UUID válido`);
      }
      return true;
    }),

  /**
   * Validar UUID requerido en query parameter
   */
  uuidRequired: (fieldName = 'id') => query(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} es requerido`)
    .isUUID()
    .withMessage(`${fieldName} debe ser un UUID válido`),

  /**
   * Validar ID numérico en query parameter
   */
  numericId: (fieldName = 'id') => query(fieldName)
    .optional()
    .isInt({ min: 1 })
    .withMessage(`${fieldName} debe ser un número entero positivo`)
    .toInt(),

  /**
   * Validar ID numérico requerido en query parameter
   */
  numericIdRequired: (fieldName = 'id') => query(fieldName)
    .notEmpty()
    .withMessage(`${fieldName} es requerido`)
    .isInt({ min: 1 })
    .withMessage(`${fieldName} debe ser un número entero positivo`)
    .toInt(),

  /**
   * Validar límite para paginación (aumentado para permitir más resultados)
   */
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('El límite debe ser un número entre 1 y 10000')
    .toInt(),

  /**
   * Validar página para paginación
   */
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La página debe ser un número entero positivo')
    .toInt(),

  /**
   * Validar código de estado de pago
   */
  paymentStatusId: query('payment_status_id')
    .optional()
    .custom((value) => {
      if (value === 'null' || value === null || value === undefined) {
        return true; // Permite null explícito
      }
      const num = parseInt(value);
      if (isNaN(num) || num < 1) {
        throw new Error('payment_status_id debe ser un número entero positivo');
      }
      return true;
    }),

  /**
   * Validar código (string requerido)
   */
  code: query('code')
    .notEmpty()
    .withMessage('El código es requerido')
    .isLength({ min: 1 })
    .withMessage('El código no puede estar vacío')
};

/**
 * Validadores para URL parameters
 */
export const paramValidators = {
  /**
   * Validar UUID en URL parameter
   */
  uuid: (paramName = 'id') => param(paramName)
    .isUUID()
    .withMessage(`${paramName} debe ser un UUID válido`),

  /**
   * Validar ID numérico en URL parameter
   */
  numericId: (paramName = 'id') => param(paramName)
    .isInt({ min: 1 })
    .withMessage(`${paramName} debe ser un número entero positivo`)
    .toInt()
};

/**
 * Helper para crear validadores combinados comunes
 */
export const commonValidators = {
  /**
   * Validar filtros comunes para expenses (month, year, card_id, category_id)
   */
  expenseFilters: [
    queryValidators.month,
    queryValidators.year,
    queryValidators.uuid('card_id'),
    queryValidators.uuid('category_id'),
    queryValidators.paymentStatusId
  ],

  /**
   * Validar filtros de paginación
   */
  pagination: [
    queryValidators.page,
    queryValidators.limit
  ]
};

