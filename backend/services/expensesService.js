import { supabase } from '../config/database.js';
import logger from '../utils/logger.js';

export class ExpensesService {
  // Obtener gastos del usuario
  static async getExpenses(userId, filters = {}) {
    try {
      let query = supabase
        .from('expenses')
        .select(`
          *,
          available_cards(name, type),
          categories(name, color),
          subcategories(name, color),
          payment_status(code, label)
        `)
        .eq('user_id', userId);

      // Aplicar filtros solo si no son null
      if (filters.card_id && filters.card_id !== 'null') {
        query = query.eq('card_id', filters.card_id);
      }

      if (filters.category_id && filters.category_id !== 'null') {
        query = query.eq('category_id', filters.category_id);
      }

      if (filters.month && filters.year && filters.month !== 'null' && filters.year !== 'null' && 
          !isNaN(parseInt(filters.month)) && !isNaN(parseInt(filters.year))) {
        const month = parseInt(filters.month);
        const year = parseInt(filters.year);
        
        // Validar que el mes esté en el rango correcto
        if (month >= 1 && month <= 12) {
          const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
          // Usar el primer día del mes siguiente con comparación < para evitar fechas inválidas (31)
          const nextMonth = month === 12 ? 1 : month + 1;
          const nextMonthYear = month === 12 ? year + 1 : year;
          const nextMonthStart = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
          query = query.gte('purchase_date', startDate).lt('purchase_date', nextMonthStart);
        }
      }

      const { data, error } = await query.order('purchase_date', { ascending: false });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Crear nuevo gasto
  static async createExpense(expenseData) {
    try {
      // Validar datos requeridos
      if (!expenseData.user_id) {
        throw new Error('user_id es requerido');
      }
      if (!expenseData.card_id) {
        throw new Error('card_id es requerido');
      }

      // Si es un gasto programado, crear múltiples gastos
      if (expenseData.is_scheduled) {
        return await this.createScheduledExpense(expenseData);
      }
      
      // 1. Verificar que la tarjeta pertenece al usuario y obtener información
      const { data: userCard, error: userCardError } = await supabase
        .from('user_cards')
        .select(`
          *,
          available_card:available_cards(*)
        `)
        .eq('user_id', expenseData.user_id)
        .eq('available_card_id', expenseData.card_id)
        .single();

      if (userCardError) {
        throw new Error(`Error en la consulta: ${userCardError.message}`);
      }

      if (!userCard) {
        throw new Error('Tarjeta no encontrada o no pertenece al usuario');
      }

      if (!userCard.available_card) {
        throw new Error('Tarjeta no encontrada o no pertenece al usuario');
      }

      const card = userCard.available_card;


      // 2. Determinar el estado de pago según el tipo de tarjeta
      let paymentStatusId = expenseData.payment_status_id || 1; // Usar el del frontend o por defecto pendiente
      

      
      // Solo aplicar lógica automática si no se envió payment_status_id desde el frontend
      if (!expenseData.payment_status_id) {
        if (card.type === 'Débito' || card.type === 'Transferencia') {
          paymentStatusId = 2; // Pagada para débito y transferencias
        } else if (card.type === 'Crédito') {
          paymentStatusId = 1; // Pendiente para crédito
        }
      }

      // 3. Preparar datos para inserción (SIN incluir month y year)
      const expenseToInsert = {
        user_id: expenseData.user_id,
        description: expenseData.description,
        amount: expenseData.amount,
        purchase_date: expenseData.purchase_date,
        card_id: expenseData.card_id,
        category_id: expenseData.category_id,
        subcategory_id: expenseData.subcategory_id || null,
        installments_count: expenseData.installments_count || 1,
        payment_status_id: paymentStatusId
      };
      
      // 4. Determinar la fecha de primera cuota según el tipo de tarjeta
      let firstInstallmentDate = null;
      
      if (card.type === 'Débito' || card.type === 'Transferencia') {
        // Para débito y transferencias, usar la fecha de compra como fecha de primera cuota
        firstInstallmentDate = expenseData.purchase_date;
      } else if (card.type === 'Crédito') {
        // Para crédito, usar la fecha proporcionada o null
        if (expenseData.first_installment_date && 
            expenseData.first_installment_date !== 'null' && 
            expenseData.first_installment_date !== '' &&
            expenseData.first_installment_date !== undefined) {
          firstInstallmentDate = expenseData.first_installment_date;
        } 
      }
      
      // 5. Incluir first_installment_date si se determinó
      if (firstInstallmentDate) {
        expenseToInsert.first_installment_date = firstInstallmentDate;
      } 
      
      
      // 6. Insertar el gasto
      const { data: createdExpense, error: insertError } = await supabase
        .from('expenses')
        .insert(expenseToInsert)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      
      // 7. Crear cuotas si es necesario (solo para tarjetas de crédito con installments_count > 1)
      if (createdExpense.installments_count > 1 && card.type === 'Crédito') {
        
        try {
          await this.createInstallmentsForExpense(createdExpense);
        } catch (error) {
          // NO fallar la creación del gasto si fallan las cuotas
        }
      } else {
      }

      return {
        success: true,
        data: createdExpense
      };

    } catch (error) {
      throw error;
    }
  }

  // Crear cuotas para un gasto
  static async createInstallmentsForExpense(expense) {
    try {
      
      // Verificar que el gasto tiene fecha de primera cuota
      if (!expense.first_installment_date || 
          expense.first_installment_date === 'null' || 
          expense.first_installment_date === '' ||
          expense.first_installment_date === undefined) {
        logger.error('El gasto no tiene fecha de primera cuota', { expenseId });
        throw new Error('El gasto debe tener fecha de primera cuota para crear cuotas');
      }
      
      // Convertir la fecha de primera cuota
      const firstInstallmentDate = new Date(expense.first_installment_date);
      
      // Calcular monto por cuota
      const installmentAmount = expense.amount / expense.installments_count;
      
      // Crear las cuotas
      const installmentsData = [];
      for (let i = 1; i <= expense.installments_count; i++) {
        const dueDate = new Date(firstInstallmentDate);
        dueDate.setMonth(dueDate.getMonth() + (i - 1));
        
        const installment = {
          expense_id: expense.id,
          installment_number: i,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          payment_status_id: 1 // 1 = pendiente por defecto
        };
        
        installmentsData.push(installment);
      }
      
      
      // Insertar las cuotas
      const { error: installmentsError } = await supabase
        .from('installments')
        .insert(installmentsData);
      
      if (installmentsError) {
        logger.error('Error insertando cuotas:', { error: installmentsError.message, expenseId });
        throw installmentsError;
      }
      
      
    } catch (error) {
      logger.error('Error en createInstallmentsForExpense:', { error: error.message, expenseId });
      throw error;
    }
  }

  // NOTA: Las cuotas se crean manualmente por el backend

  // Obtener gastos mensuales con cuotas
  static async getMonthlyExpensesWithInstallments(userId, month, year, filters = {}) {
    try {

      // Validar que month y year sean números válidos
      if (!month || !year || month < 1 || month > 12 || isNaN(month) || isNaN(year)) {
        return {
          success: true,
          data: []
        };
      }
      
      // Calcular fechas de inicio y fin del mes
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      // Usar el primer día del mes siguiente con comparación < para evitar fechas inválidas (31)
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextMonthYear = month === 12 ? year + 1 : year;
      const endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;

      // Consulta SQL directa para obtener SOLO gastos directos (sin cuotas) del mes
      // IMPORTANTE: Para tarjetas de crédito, debemos filtrar por first_installment_date si existe
      // Para débito/transferencia, filtramos por purchase_date
      let directQuery = supabase
        .from('expenses')
        .select(`
          id,
          user_id,
          description,
          amount,
          card_id,
          category_id,
          subcategory_id,
          purchase_date,
          payment_status_id,
          installments_count,
          first_installment_date,
          month,
          year,
          created_at,
          updated_at,
          is_scheduled,
          scheduled_start_month,
          scheduled_months,
          scheduled_end_month,
          is_active,
          available_cards(id, name, type),
          categories(id, name, color),
          subcategories(id, name, color),
          payment_status(code, label)
        `)
        .eq('user_id', userId)
        .eq('installments_count', 1); // Solo gastos directos (sin cuotas)

      // Aplicar filtros de tarjeta, categoría y estado de pago
      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        directQuery = directQuery.eq('card_id', filters.card_id);
      }

      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        directQuery = directQuery.eq('category_id', filters.category_id);
      }

      if (filters.payment_status_id && filters.payment_status_id !== 'null' && filters.payment_status_id !== null) {
        directQuery = directQuery.eq('payment_status_id', filters.payment_status_id);
      }

      // Obtener todos los gastos directos sin filtrar por fecha (lo haremos después)
      const { data: allDirectExpenses, error: directError } = await directQuery.order('purchase_date', { ascending: false });

      if (directError) throw directError;

      // Filtrar gastos según el tipo de tarjeta y la fecha correspondiente
      const directExpenses = (allDirectExpenses || []).filter(expense => {
        const cardType = expense.available_cards?.type;
        
        // Para tarjetas de crédito con first_installment_date, usar esa fecha
        if (cardType === 'Crédito' && expense.first_installment_date) {
          const installmentDate = new Date(expense.first_installment_date);
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          return installmentDate >= startDateObj && installmentDate < endDateObj;
        }
        
        // Para débito, transferencia o crédito sin first_installment_date, usar purchase_date
        const purchaseDate = new Date(expense.purchase_date);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        return purchaseDate >= startDateObj && purchaseDate < endDateObj;
      });

      // Logs de depuración removidos

      // Consulta SQL directa para obtener cuotas que vencen en el mes
      let installmentsQuery = supabase
        .from('installments')
        .select(`
          *,
          expenses!inner(
            id,
            user_id,
            description,
            amount,
            card_id,
            category_id,
            subcategory_id,
            purchase_date,
            payment_status_id,
            installments_count,
            first_installment_date,
            month,
            year,
            created_at,
            updated_at,
            is_scheduled,
            scheduled_start_month,
            scheduled_months,
            scheduled_end_month,
            is_active,
            available_cards(id, name, type, bank), 
            categories(id, name, color), 
            subcategories(id, name, color)
          ),
          payment_status(code, label)
        `)
        .eq('expenses.user_id', userId)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      // Aplicar filtros de tarjeta, categoría y estado de pago a las cuotas
      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        installmentsQuery = installmentsQuery.eq('expenses.card_id', filters.card_id);
      }

      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        installmentsQuery = installmentsQuery.eq('expenses.category_id', filters.category_id);
      }

      if (filters.payment_status_id && filters.payment_status_id !== 'null' && filters.payment_status_id !== null) {
        installmentsQuery = installmentsQuery.eq('payment_status_id', filters.payment_status_id);
      }

      const { data: installments, error: installmentsError } = await installmentsQuery.order('due_date', { ascending: true });

      if (installmentsError) throw installmentsError;



      // Marcar gastos directos
      const markedDirectExpenses = (directExpenses || []).map(expense => ({
        ...expense,
        is_installment: false,
        type: 'expense'
      }));

              // Marcar cuotas
        const markedInstallments = (installments || []).map(installment => ({
          ...installment,
          ...installment.expenses, // Copiar todos los campos del expense
          is_installment: true,
          type: 'installment',
          installment_amount: installment.amount,
          installment_id: installment.id,
          due_date: installment.due_date,
          installment_number: installment.installment_number,
          // Mantener el payment_status de la cuota, no del expense
          payment_status: installment.payment_status,
          payment_status_id: installment.payment_status_id
        }));

      // Combinar resultados
      const combinedResults = [
        ...markedDirectExpenses,
        ...markedInstallments
      ];

      // Validación adicional: filtrar por fecha de manera más estricta
      // Para gastos directos de crédito, usar first_installment_date si existe
      const filteredResults = combinedResults.filter(item => {
        if (item.is_installment) {
          // Para cuotas, usar due_date
          const itemDate = item.due_date;
          const itemDateObj = new Date(itemDate);
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          return itemDateObj >= startDateObj && itemDateObj < endDateObj;
        } else {
          // Para gastos directos, determinar la fecha según el tipo de tarjeta
          const cardType = item.available_cards?.type;
          let itemDate;
          
          // Para tarjetas de crédito con first_installment_date, usar esa fecha
          if (cardType === 'Crédito' && item.first_installment_date) {
            itemDate = item.first_installment_date;
          } else {
            // Para débito, transferencia o crédito sin first_installment_date, usar purchase_date
            itemDate = item.purchase_date;
          }
          
          const itemDateObj = new Date(itemDate);
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          
          return itemDateObj >= startDateObj && itemDateObj < endDateObj;
        }
      });



      return {
        success: true,
        data: filteredResults
      };

    } catch (error) {
      logger.error('Error en getMonthlyExpensesWithInstallments:', { error: error.message, userId, month, year });
      throw error;
    }
  }

  // Obtener total mensual con cuotas
  static async getMonthlyTotalWithInstallments(userId, month, year, filters = {}) {
    try {

      // Validar que month y year sean números válidos
      if (!month || !year || month < 1 || month > 12 || isNaN(month) || isNaN(year)) {
        return {
          success: true,
          data: [{
            total_debit_transfer: 0,
            total_credit: 0,
            total_expenses: 0,
            expenses_count: 0,
            installments_count: 0
          }]
        };
      }
      
      // Calcular fechas de inicio y fin del mes
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      // Usar el primer día del mes siguiente con comparación < para evitar fechas inválidas (31)
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextMonthYear = month === 12 ? year + 1 : year;
      const endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;


      // Obtener gastos directos del mes con información de tarjeta
      // IMPORTANTE: Para tarjetas de crédito, debemos filtrar por first_installment_date si existe
      // Para débito/transferencia, filtramos por purchase_date
      let directQuery = supabase
        .from('expenses')
        .select(`
          amount, 
          payment_status(code),
          available_cards(name, type),
          first_installment_date,
          purchase_date
        `)
        .eq('user_id', userId)
        .eq('installments_count', 1); // Solo gastos directos

      // Aplicar filtros
      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        directQuery = directQuery.eq('card_id', filters.card_id);
      }
      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        directQuery = directQuery.eq('category_id', filters.category_id);
      }
      if (filters.payment_status_id && filters.payment_status_id !== 'null' && filters.payment_status_id !== null) {
        directQuery = directQuery.eq('payment_status_id', filters.payment_status_id);
      }

      // Obtener todos los gastos directos sin filtrar por fecha (lo haremos después)
      const { data: allDirectExpenses, error: directError } = await directQuery;

      if (directError) throw directError;

      // Filtrar gastos según el tipo de tarjeta y la fecha correspondiente
      const directExpenses = (allDirectExpenses || []).filter(expense => {
        const cardType = expense.available_cards?.type;
        
        // Para tarjetas de crédito con first_installment_date, usar esa fecha
        if (cardType === 'Crédito' && expense.first_installment_date) {
          const installmentDate = new Date(expense.first_installment_date);
          const startDateObj = new Date(startDate);
          const endDateObj = new Date(endDate);
          return installmentDate >= startDateObj && installmentDate < endDateObj;
        }
        
        // Para débito, transferencia o crédito sin first_installment_date, usar purchase_date
        const purchaseDate = new Date(expense.purchase_date);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        return purchaseDate >= startDateObj && purchaseDate < endDateObj;
      });

      if (directError) throw directError;

      // Obtener cuotas del mes
      let installmentsQuery = supabase
        .from('installments')
        .select(`
          amount,
          expenses!inner(user_id),
          payment_status(code)
        `)
        .eq('expenses.user_id', userId)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      // Aplicar filtros a cuotas
      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        installmentsQuery = installmentsQuery.eq('expenses.card_id', filters.card_id);
      }
      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        installmentsQuery = installmentsQuery.eq('expenses.category_id', filters.category_id);
      }
      if (filters.payment_status_id && filters.payment_status_id !== 'null' && filters.payment_status_id !== null) {
        installmentsQuery = installmentsQuery.eq('payment_status_id', filters.payment_status_id);
      }

      const { data: installments, error: installmentsError } = await installmentsQuery;

      if (installmentsError) throw installmentsError;

      // Calcular totales sin filtrar por estado
      // Separar gastos de débito/transferencia de gastos de crédito
      const debitTransferExpenses = directExpenses.filter(expense => {
        // Incluir gastos de débito, transferencia o sin tarjeta (efectivo)
        const cardType = expense.available_cards?.type;
        return !cardType || cardType === 'Débito' || cardType === 'Transferencia';
      });
      
      const creditExpenses = directExpenses.filter(expense => {
        // Incluir solo gastos de crédito
        const cardType = expense.available_cards?.type;
        return cardType === 'Crédito';
      });

      const totalDebitTransfer = debitTransferExpenses
        ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      // Total de crédito = gastos directos de crédito + cuotas
      const totalCreditDirect = creditExpenses
        ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      const totalCreditInstallments = installments
        ?.reduce((sum, installment) => sum + installment.amount, 0) || 0;

      const totalCredit = totalCreditDirect + totalCreditInstallments;

      const totalExpenses = totalDebitTransfer + totalCredit;

    

      return {
        success: true,
        data: [{
          total_debit_transfer: totalDebitTransfer,
          total_credit: totalCredit,
          total_expenses: totalExpenses,
          expenses_count: directExpenses?.length || 0,
          installments_count: installments?.length || 0
        }]
      };

    } catch (error) {
      logger.error('Error en getMonthlyTotalWithInstallments:', { error: error.message, userId, month, year });
      throw error;
    }
  }

        // Obtener cuotas de un gasto
      static async getInstallments(expenseId) {
        try {
          const { data, error } = await supabase
            .from('installments')
            .select(`
              *,
              expenses!inner(description, installments_count, available_cards(name, type), categories(name, color), subcategories(name, color)),
              payment_status(code, label)
            `)
            .eq('expense_id', expenseId)
            .order('installment_number', { ascending: true });

      if (error) throw error;

      // Agregar la información del gasto a cada cuota
      const installmentsWithExpenseInfo = (data || []).map(installment => ({
        ...installment,
        expense: installment.expenses
      }));

      return {
        success: true,
        data: installmentsWithExpenseInfo
      };
    } catch (error) {
      throw error;
    }
  }

  // Obtener resumen de cuotas de un gasto
  static async getExpenseInstallmentsSummary(expenseId) {
    try {
      const { data: installments, error } = await supabase
        .from('installments')
        .select(`
          *,
          payment_status(code, label)
        `)
        .eq('expense_id', expenseId)
        .order('installment_number', { ascending: true });

      if (error) throw error;

      // Calcular resumen
      const totalInstallments = installments?.length || 0;
      const paidInstallments = installments?.filter(i => i.payment_status?.code === 'pagada').length || 0;
      const pendingInstallments = installments?.filter(i => i.payment_status?.code === 'pendiente').length || 0;
      const totalAmount = installments?.reduce((sum, i) => sum + i.amount, 0) || 0;
      const paidAmount = installments?.filter(i => i.payment_status?.code === 'pagada').reduce((sum, i) => sum + i.amount, 0) || 0;
      const pendingAmount = installments?.filter(i => i.payment_status?.code === 'pendiente').reduce((sum, i) => sum + i.amount, 0) || 0;
      const nextDueDate = installments?.filter(i => i.payment_status?.code === 'pendiente').sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0]?.due_date;
      const isCompleted = totalInstallments > 0 && paidInstallments === totalInstallments;

      return {
        success: true,
        data: [{
          total_installments: totalInstallments,
          paid_installments: paidInstallments,
          pending_installments: pendingInstallments,
          total_amount: totalAmount,
          paid_amount: paidAmount,
          pending_amount: pendingAmount,
          next_due_date: nextDueDate,
          is_completed: isCompleted
        }]
      };

    } catch (error) {
      throw error;
    }
  }

        // Obtener cuotas próximas a vencer
      static async getUpcomingInstallments(userId, limit = 100) {
        try {
          // Obtener todos los gastos del usuario
          const { data: expenses, error: expensesError } = await supabase
            .from('expenses')
            .select('id')
            .eq('user_id', userId);

          if (expensesError) throw expensesError;

          if (!expenses || expenses.length === 0) {
            return {
              success: true,
              data: []
            };
          }

          const expenseIds = expenses.map(expense => expense.id);

          // Obtener cuotas pendientes de esos gastos
          const { data, error } = await supabase
            .from('installments')
            .select(`
              *,
              expenses!inner(
                description, 
                user_id, 
                card_id,
                available_cards(id, name, type, bank), 
                categories(id, name, color), 
                subcategories(id, name, color)
              ),
              payment_status(code, label)
            `)
            .in('expense_id', expenseIds)
            .in('payment_status_id', [1, 2]) // 1: pendiente, 2: en deuda
            .order('due_date', { ascending: true })
            .limit(limit);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener estados de pago
  static async getPaymentStatus() {
    try {
      const { data, error } = await supabase
        .from('payment_status')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener estado de pago por código
  static async getPaymentStatusByCode(code) {
    try {
      const { data, error } = await supabase
        .from('payment_status')
        .select('*')
        .eq('code', code);

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Marcar gasto como pagado
  static async markAsPaid(expenseId, paymentStatusId) {
    try {
      // Primero verificar que el gasto existe
      const { data: existingExpense, error: checkError } = await supabase
        .from('expenses')
        .select('id')
        .eq('id', expenseId)
        .single();

      if (checkError) {
        throw new Error(`Gasto no encontrado: ${expenseId}`);
      }

      // Actualizar el gasto
      const { data, error } = await supabase
        .from('expenses')
        .update({ payment_status_id: paymentStatusId })
        .eq('id', expenseId)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };

    } catch (error) {
      throw error;
    }
  }

  // Crear cuotas manualmente
  static async createInstallments(installmentsData) {
    try {
      const { data, error } = await supabase
        .from('installments')
        .insert(installmentsData)
        .select();

      if (error) throw error;

      return {
        success: true,
        data
      };

    } catch (error) {
      throw error;
    }
  }

  // Actualizar estado de cuota y actualizar estado del gasto
  static async updateInstallmentStatus(installmentId, paymentStatusId) {
    try {

      // 1. Actualizar el estado de la cuota
      const { data: updatedInstallment, error: updateError } = await supabase
        .from('installments')
        .update({ payment_status_id: paymentStatusId })
        .eq('id', installmentId)
        .select(`
          *,
          expenses(id, user_id),
          payment_status(code, label)
        `)
        .single();

      if (updateError) {
        logger.error('Error actualizando cuota:', { error: updateError.message, installmentId });
        throw updateError;
      }


      // 2. Obtener el expense_id de la cuota actualizada
      const expenseId = updatedInstallment.expense_id;

      // 3. Replicar la lógica de actualizar_estado_gasto
      await this.updateExpenseStatusBasedOnInstallments(expenseId);

      return {
        success: true,
        data: updatedInstallment
      };

    } catch (error) {
      logger.error('Error en updateInstallmentStatus:', { error: error.message, installmentId, paymentStatusId });
      throw error;
    }
  }

  // Replicar la lógica de actualizar_estado_gasto
  static async updateExpenseStatusBasedOnInstallments(expenseId) {
    try {

      // Obtener los IDs de los estados
      const { data: statuses, error: statusError } = await supabase
        .from('payment_status')
        .select('id, code')
        .in('code', ['pagada', 'pendiente', 'en_deuda']);

      if (statusError) throw statusError;

      const statusMap = {};
      statuses.forEach(status => {
        statusMap[status.code] = status.id;
      });

      const idPagada = statusMap['pagada'];
      const idPendiente = statusMap['pendiente'];
      const idEnDeuda = statusMap['en_deuda'];

      // Obtener todas las cuotas del gasto
      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select('payment_status_id')
        .eq('expense_id', expenseId);

      if (installmentsError) throw installmentsError;

      // Determinar el nuevo estado del gasto según las cuotas
      let nuevoEstado = idPendiente; // Por defecto

      if (installments && installments.length > 0) {
        const totalInstallments = installments.length;
        const enDeudaCount = installments.filter(i => i.payment_status_id === idEnDeuda).length;
        const pendienteCount = installments.filter(i => i.payment_status_id === idPendiente).length;
        const pagadaCount = installments.filter(i => i.payment_status_id === idPagada).length;

        if (enDeudaCount > 0) {
          nuevoEstado = idEnDeuda;
        } else if (pendienteCount > 0) {
          nuevoEstado = idPendiente;
        } else if (pagadaCount === totalInstallments) {
          nuevoEstado = idPagada;
        }
      }

      // Obtener el estado actual del gasto
      const { data: currentExpense, error: currentError } = await supabase
        .from('expenses')
        .select('payment_status_id')
        .eq('id', expenseId)
        .single();

      if (currentError) throw currentError;

      // Solo actualizar si el estado realmente cambió
      if (currentExpense.payment_status_id !== nuevoEstado) {

        const { error: updateError } = await supabase
          .from('expenses')
          .update({ payment_status_id: nuevoEstado })
          .eq('id', expenseId);

        if (updateError) throw updateError;

      } 

    } catch (error) {
      logger.error('Error actualizando estado del gasto:', { error: error.message, expenseId, paymentStatusId });
      throw error;
    }
  }

  // Actualizar gasto existente
  static async updateExpense(id, updates) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data
      };

    } catch (error) {
      throw error;
    }
  }

  // Eliminar gasto
  static async deleteExpense(id, userId, deleteOption = null) {
    try {
      // Primero obtener el gasto para verificar si es programado
      const { data: expense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchError) {
        throw new Error('Gasto no encontrado');
      }

      // Logs de depuración removidos

      // Si es un gasto programado y se especifica eliminar futuros
      if (expense.is_scheduled && deleteOption === 'future') {
        // Logs de depuración removidos
        
        // Para gastos programados, usar scheduled_start_month como referencia
        // y eliminar desde la fecha actual en adelante
        const currentDate = expense.purchase_date; // Fecha del gasto que se está eliminando
        
        // Logs de depuración removidos
        
        // Obtener todos los gastos programados de la misma serie programada
        const { data: relatedExpenses, error: fetchRelatedError } = await supabase
          .from('expenses')
          .select('id, purchase_date, description, amount, scheduled_start_month')
          .eq('user_id', userId)
          .eq('is_scheduled', true)
          .eq('description', expense.description)
          .eq('amount', expense.amount)
          .eq('card_id', expense.card_id)
          .eq('category_id', expense.category_id)
          .eq('scheduled_start_month', expense.scheduled_start_month) // Mismo inicio programado
          .gte('purchase_date', currentDate)
          .order('purchase_date', { ascending: true });

        if (fetchRelatedError) throw fetchRelatedError;

        // Logs de depuración removidos

        if (relatedExpenses && relatedExpenses.length > 0) {
          // Eliminar todos los gastos encontrados
          const { error: deleteError } = await supabase
            .from('expenses')
            .delete()
            .eq('user_id', userId)
            .eq('is_scheduled', true)
            .eq('description', expense.description)
            .eq('amount', expense.amount)
            .eq('card_id', expense.card_id)
            .eq('category_id', expense.category_id)
            .eq('scheduled_start_month', expense.scheduled_start_month)
            .gte('purchase_date', currentDate);

          if (deleteError) throw deleteError;

          return {
            success: true,
            message: `Gasto programado cancelado. Se eliminaron ${relatedExpenses.length} gastos (actual y futuros).`
          };
        } else {
          return {
            success: true,
            message: 'No se encontraron gastos futuros para eliminar.'
          };
        }
      } else {
        // Eliminación normal (solo el gasto actual)
        
        // Primero eliminar las cuotas asociadas
        const { error: installmentsError } = await supabase
          .from('installments')
          .delete()
          .eq('expense_id', id);

        if (installmentsError) {
          logger.error('Error eliminando cuotas:', { error: installmentsError.message, expenseId });
        }

        // Luego eliminar el gasto
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) throw error;

        return {
          success: true,
          message: 'Gasto eliminado correctamente'
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // Obtener resumen detallado por tipo de tarjeta
  static async getExpensesSummaryByType(userId, isAnnual = false) {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Calcular fechas según el período
      let startDate, endDate;
      
      if (isAnnual) {
        // Año: desde enero hasta el mes actual
        startDate = `${currentYear}-01-01`;
        const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
        endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;
      } else {
        // Mes: desde el primer día del mes actual hasta el último día
        startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
        endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
      }

      // Obtener gastos directos agrupados por tipo de tarjeta
      const { data: directExpenses, error: directError } = await supabase
        .from('expenses')
        .select(`
          amount,
          available_cards(type)
        `)
        .eq('user_id', userId)
        .eq('installments_count', 1) // Solo gastos directos
        .gte('purchase_date', startDate)
        .lt('purchase_date', endDate);

      if (directError) throw directError;

      // Obtener cuotas agrupadas por tipo de tarjeta
      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select(`
          amount,
          expenses!inner(
            available_cards(type)
          )
        `)
        .eq('expenses.user_id', userId)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      if (installmentsError) throw installmentsError;

      // Agrupar por tipo de tarjeta
      const summaryByType = {};

      // Procesar gastos directos
      (directExpenses || []).forEach(expense => {
        const cardType = expense.available_cards?.type || 'Sin especificar';
        if (!summaryByType[cardType]) {
          summaryByType[cardType] = { direct: 0, installments: 0, total: 0 };
        }
        summaryByType[cardType].direct += expense.amount;
        summaryByType[cardType].total += expense.amount;
      });

      // Procesar cuotas
      (installments || []).forEach(installment => {
        const cardType = installment.expenses?.available_cards?.type || 'Sin especificar';
        if (!summaryByType[cardType]) {
          summaryByType[cardType] = { direct: 0, installments: 0, total: 0 };
        }
        summaryByType[cardType].installments += installment.amount;
        summaryByType[cardType].total += installment.amount;
      });

      // Convertir a array y ordenar por tipo
      const summaryArray = Object.entries(summaryByType).map(([type, amounts]) => ({
        type,
        direct: amounts.direct,
        installments: amounts.installments,
        total: amounts.total
      })).sort((a, b) => a.type.localeCompare(b.type));

      return {
        success: true,
        data: summaryArray
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener resumen de gastos por tarjeta de crédito
  static async getCreditCardsSummary(userId, isAnnual = false) {
    try {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1;

      // Obtener todas las tarjetas de crédito del usuario
      const { data: userCards, error: userCardsError } = await supabase
        .from('user_cards')
        .select(`
          *,
          available_card:available_cards(*)
        `)
        .eq('user_id', userId)
        .eq('available_card.type', 'Crédito');

      if (userCardsError) throw userCardsError;

      if (!userCards || userCards.length === 0) {
        return {
          success: true,
          data: []
        };
      }

      const cardsSummary = [];

      for (const userCard of userCards) {
        const card = userCard.available_card;
        
        // Saltar si la tarjeta no existe
        if (!card || !card.id) {
          continue;
        }
        
        // Calcular fechas según el período
        let startDate, endDate;
        
        if (isAnnual) {
          // Año: desde enero hasta el mes actual
          startDate = `${currentYear}-01-01`;
          // Calcular el último día del mes actual
          const lastDayOfMonth = new Date(currentYear, currentMonth, 0).getDate();
          endDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-${lastDayOfMonth.toString().padStart(2, '0')}`;
        } else {
          // Mes: desde el primer día del mes actual hasta el último día
          startDate = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
          const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
          const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;
          endDate = `${nextMonthYear}-${nextMonth.toString().padStart(2, '0')}-01`;
        }

        // Obtener gastos directos de la tarjeta en el período
        const { data: directExpenses, error: directError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('user_id', userId)
          .eq('card_id', card.id)
          .eq('installments_count', 1) // Solo gastos directos
          .gte('purchase_date', startDate)
          .lt('purchase_date', endDate);

        if (directError) throw directError;

        // Obtener cuotas que vencen en el período
        const { data: installments, error: installmentsError } = await supabase
          .from('installments')
          .select(`
            amount,
            expenses!inner(card_id, user_id)
          `)
          .eq('expenses.user_id', userId)
          .eq('expenses.card_id', card.id)
          .gte('due_date', startDate)
          .lt('due_date', endDate);

        if (installmentsError) throw installmentsError;

        // Calcular totales
        const directTotal = (directExpenses || []).reduce((sum, expense) => sum + expense.amount, 0);
        const installmentsTotal = (installments || []).reduce((sum, installment) => sum + installment.amount, 0);
        const totalAmount = directTotal + installmentsTotal;

        cardsSummary.push({
          id: card.id,
          name: card.name,
          bank: card.bank,
          type: card.type,
          amount: totalAmount,
          directExpenses: directTotal,
          installments: installmentsTotal,
          period: isAnnual ? 'annual' : 'monthly'
        });
      }

      // Ordenar por nombre de tarjeta alfabéticamente
      cardsSummary.sort((a, b) => a.name.localeCompare(b.name));

      return {
        success: true,
        data: cardsSummary
      };

    } catch (error) {
      throw error;
    }
  }

  // Marcar cuota como pagada/pendiente
  static async markInstallmentAsPaid(installmentId, paymentStatusId) {
    try {
      // Actualizar el estado de pago de la cuota
      const { data, error } = await supabase
        .from('installments')
        .update({ payment_status_id: paymentStatusId })
        .eq('id', installmentId)
        .select(`
          *,
          payment_status(code, label)
        `)
        .single();

      if (error) throw error;

      return {
        success: true,
        data: data
      };

    } catch (error) {
      throw error;
    }
  }

  // Obtener todos los estados de pago
  static async getAllPaymentStatuses() {
    try {
      const { data, error } = await supabase
        .from('payment_status')
        .select('id, code, label')
        .order('id', { ascending: true });

      if (error) throw error;

      return {
        success: true,
        data: data || []
      };

    } catch (error) {
      throw error;
    }
  }

  // Crear gasto programado
  static async createScheduledExpense(expenseData) {
    try {
      // Validar datos específicos de gastos programados
      if (!expenseData.scheduled_start_month) {
        throw new Error('scheduled_start_month es requerido para gastos programados');
      }

      // 1. Verificar que la tarjeta pertenece al usuario
      const { data: userCard, error: userCardError } = await supabase
        .from('user_cards')
        .select(`
          *,
          available_card:available_cards(*)
        `)
        .eq('user_id', expenseData.user_id)
        .eq('available_card_id', expenseData.card_id)
        .single();

      if (userCardError) {
        throw new Error(`Error en la consulta: ${userCardError.message}`);
      }

      if (!userCard) {
        throw new Error('Tarjeta no encontrada o no pertenece al usuario');
      }

      const card = userCard.available_card;

      // 2. Para gastos programados, siempre usar estado pendiente
      let paymentStatusId = 1; // Siempre pendiente para gastos programados

      // 3. Calcular fechas de inicio y fin
      // CORRECCIÓN FINAL: Parsear la fecha correctamente
      const [year, month, day] = expenseData.scheduled_start_month.split('-');
      const startYear = parseInt(year);
      const startMonth = parseInt(month) - 1; // Convertir de 1-12 a 0-11 para JavaScript
      const startDate = new Date(startYear, startMonth, parseInt(day));
      
      // Debug logs (remover en producción)
      // console.log(`🔍 Debug - Fecha de inicio: ${expenseData.scheduled_start_month}`);
      // console.log(`🔍 Debug - Fecha parseada: ${startDate.toISOString().split('T')[0]}`);
      // console.log(`🔍 Debug - Mes (0-11): ${startDate.getMonth()}, Mes (1-12): ${startDate.getMonth() + 1}`);

      let endDate = null;
      if (expenseData.scheduled_months && expenseData.scheduled_months > 0) {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + expenseData.scheduled_months);
      }

      // 4. Crear gastos para cada mes
      const expensesToCreate = [];
      const currentDate = new Date();
      const maxMonths = expenseData.scheduled_months || 24; // 24 meses por defecto para gastos indefinidos

      for (let i = 0; i < maxMonths; i++) {
        // Calcular la fecha correctamente
        // CORRECCIÓN FINAL: Usar directamente startYear y startMonth + i
        const expenseDate = new Date(startYear, startMonth + i, 1);
        
        // console.log(`🔍 Debug - Mes ${i + 1}: ${expenseDate.toISOString().split('T')[0]} (${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')})`);

        // Si hay fecha de fin y ya la pasamos, parar
        if (endDate && expenseDate >= endDate) {
          break;
        }

        // Solo crear gastos para meses futuros o el mes actual
        if (expenseDate >= new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)) {
          const expense = {
            user_id: expenseData.user_id,
            description: expenseData.description,
            amount: expenseData.amount,
            card_id: expenseData.card_id,
            category_id: expenseData.category_id,
            subcategory_id: expenseData.subcategory_id || null,
            purchase_date: expenseDate.toISOString().split('T')[0],
            payment_status_id: paymentStatusId,
            installments_count: 1,
            is_scheduled: true,
            scheduled_start_month: expenseData.scheduled_start_month,
            scheduled_months: expenseData.scheduled_months,
            scheduled_end_month: endDate ? endDate.toISOString().split('T')[0] : null,
            is_active: true
          };

          expensesToCreate.push(expense);
        }
      }

      if (expensesToCreate.length === 0) {
        throw new Error('No se pueden crear gastos programados para fechas pasadas');
      }

      // 5. Insertar todos los gastos
      const { data, error } = await supabase
        .from('expenses')
        .insert(expensesToCreate)
        .select(`
          *,
          available_cards(name, type),
          categories(name, color),
          subcategories(name, color),
          payment_status(code, label)
        `);

      if (error) throw error;

      return {
        success: true,
        data: data,
        message: `Se crearon ${data.length} gastos programados`
      };

    } catch (error) {
      throw error;
    }
  }

  // Cancelar gasto programado (marcar como inactivo)
  static async cancelScheduledExpense(userId, scheduledExpenseId) {
    try {
      // Obtener el gasto programado original
      const { data: originalExpense, error: fetchError } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', scheduledExpenseId)
        .eq('user_id', userId)
        .eq('is_scheduled', true)
        .single();

      if (fetchError) {
        throw new Error('Gasto programado no encontrado');
      }

      // Marcar como inactivo todos los gastos programados futuros de esta serie
      const currentDate = new Date();
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

      const { error: updateError } = await supabase
        .from('expenses')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_scheduled', true)
        .eq('scheduled_start_month', originalExpense.scheduled_start_month)
        .eq('description', originalExpense.description)
        .eq('amount', originalExpense.amount)
        .eq('card_id', originalExpense.card_id)
        .gte('purchase_date', currentMonth.toISOString().split('T')[0]);

      if (updateError) throw updateError;

      return {
        success: true,
        message: 'Gasto programado cancelado exitosamente'
      };

    } catch (error) {
      throw error;
    }
  }


  // Obtener gastos programados activos del usuario
  static async getScheduledExpenses(userId) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          available_cards(name, type),
          categories(name, color),
          subcategories(name, color),
          payment_status(code, label)
        `)
        .eq('user_id', userId)
        .eq('is_scheduled', true)
        .eq('is_active', true)
        .order('scheduled_start_month', { ascending: false });

      if (error) throw error;

      // Agrupar por serie de gastos programados
      const groupedExpenses = {};
      data.forEach(expense => {
        const key = `${expense.scheduled_start_month}-${expense.description}-${expense.amount}-${expense.card_id}`;
        if (!groupedExpenses[key]) {
          groupedExpenses[key] = {
            id: expense.id,
            description: expense.description,
            amount: expense.amount,
            card_id: expense.card_id,
            category_id: expense.category_id,
            subcategory_id: expense.subcategory_id,
            scheduled_start_month: expense.scheduled_start_month,
            scheduled_months: expense.scheduled_months,
            scheduled_end_month: expense.scheduled_end_month,
            available_cards: expense.available_cards,
            categories: expense.categories,
            subcategories: expense.subcategories,
            payment_status: expense.payment_status,
            expenses: []
          };
        }
        groupedExpenses[key].expenses.push(expense);
      });

      return {
        success: true,
        data: Object.values(groupedExpenses)
      };

    } catch (error) {
      throw error;
    }
  }
} 