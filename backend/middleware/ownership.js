import { supabase } from '../config/database.js';

/**
 * Middleware para verificar que un gasto pertenece al usuario autenticado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const verifyExpenseOwnership = async (req, res, next) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.id;

    if (!expenseId) {
      return res.status(400).json({
        success: false,
        error: 'ID de gasto requerido'
      });
    }

    // Consulta directa y eficiente: solo trae el ID y user_id
    const { data, error } = await supabase
      .from('expenses')
      .select('id, user_id')
      .eq('id', expenseId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Gasto no encontrado o no autorizado'
      });
    }

    // Ownership verificado, continuar al siguiente middleware/handler
    next();
  } catch (error) {
    console.error('Error verificando ownership de gasto:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar que una tarjeta de usuario pertenece al usuario autenticado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const verifyUserCardOwnership = async (req, res, next) => {
  try {
    const userCardId = req.params.id;
    const userId = req.user.id;

    if (!userCardId) {
      return res.status(400).json({
        success: false,
        error: 'ID de tarjeta requerido'
      });
    }

    const { data, error } = await supabase
      .from('user_cards')
      .select('id, user_id')
      .eq('id', userCardId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Tarjeta no encontrada o no autorizada'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de tarjeta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar que una cuota (installment) pertenece al usuario autenticado
 * La cuota pertenece al usuario a través de su gasto asociado
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const verifyInstallmentOwnership = async (req, res, next) => {
  try {
    const installmentId = req.params.id;
    const userId = req.user.id;

    if (!installmentId) {
      return res.status(400).json({
        success: false,
        error: 'ID de cuota requerido'
      });
    }

    // Verificar ownership a través de la relación con expenses
    const { data, error } = await supabase
      .from('installments')
      .select(`
        id,
        expenses!inner(user_id)
      `)
      .eq('id', installmentId)
      .eq('expenses.user_id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        error: 'Cuota no encontrada o no autorizada'
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando ownership de cuota:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
};

/**
 * Helper function para verificar ownership de un gasto (para usar en servicios)
 * @param {string} expenseId - ID del gasto
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} - true si el gasto pertenece al usuario
 * @throws {Error} - Si el gasto no pertenece al usuario
 */
export const verifyExpenseOwnershipHelper = async (expenseId, userId) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, user_id')
    .eq('id', expenseId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Gasto no encontrado o no autorizado');
  }

  return true;
};

/**
 * Helper function para verificar ownership de una tarjeta de usuario
 * @param {string} userCardId - ID de la tarjeta de usuario
 * @param {string} userId - ID del usuario
 * @returns {Promise<boolean>} - true si la tarjeta pertenece al usuario
 * @throws {Error} - Si la tarjeta no pertenece al usuario
 */
export const verifyUserCardOwnershipHelper = async (userCardId, userId) => {
  const { data, error } = await supabase
    .from('user_cards')
    .select('id, user_id')
    .eq('id', userCardId)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    throw new Error('Tarjeta no encontrada o no autorizada');
  }

  return true;
};


