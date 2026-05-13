import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

class TransactionError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = 'TransactionError';
    this.cause = cause;
    this.statusCode = 500;
  }
}

class Transaction {
  constructor() {
    this.operations = [];
    this.committed = false;
  }

  addOperation(name, rollbackFn) {
    this.operations.push({ name, rollbackFn });
  }

  async rollback() {
    this.committed = false;
    const errors = [];

    for (let i = this.operations.length - 1; i >= 0; i--) {
      const { name, rollbackFn } = this.operations[i];
      try {
        if (typeof rollbackFn === 'function') {
          await rollbackFn();
        }
      } catch (error) {
        errors.push({ operation: name, error: error.message });
        logger.error(`Rollback fallido para operación ${name}:`, { error: error.message });
      }
    }

    return errors;
  }

  commit() {
    this.committed = true;
  }
}

export async function executeTransaction(callback) {
  const transaction = new Transaction();

  try {
    const result = await callback(transaction);
    transaction.commit();
    return { success: true, data: result };
  } catch (error) {
    logger.error('Error en transacción, ejecutando rollback:', { error: error.message });

    const rollbackErrors = await transaction.rollback();

    if (rollbackErrors.length > 0) {
      logger.error('Errores durante rollback:', { errors: rollbackErrors });
    }

    if (error instanceof TransactionError) {
      throw error;
    }

    throw new TransactionError(
      error.message || 'Error en la transacción',
      error
    );
  }
}

export { Transaction, TransactionError };
