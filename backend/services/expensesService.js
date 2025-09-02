import { supabase } from '../config/database.js';

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
      
      console.log('🔍 Debug - Payment Status Logic:', {
        cardType: card.type,
        frontendPaymentStatusId: expenseData.payment_status_id,
        finalPaymentStatusId: paymentStatusId
      });
      
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
        console.error('🔍 Backend - ❌ ERROR: El gasto no tiene fecha de primera cuota');
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
        console.error('🔍 Backend - Error insertando cuotas:', installmentsError);
        throw installmentsError;
      }
      
      
    } catch (error) {
      console.error('🔍 Backend - Error en createInstallmentsForExpense:', error);
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
      let directQuery = supabase
        .from('expenses')
        .select(`
          *,
          available_cards(id, name, type),
          categories(id, name, color),
          subcategories(id, name, color),
          payment_status(code, label)
        `)
        .eq('user_id', userId)
        .eq('installments_count', 1) // Solo gastos directos (sin cuotas)
        .gte('purchase_date', startDate)
        .lt('purchase_date', endDate);

      // Aplicar filtros de tarjeta y categoría
      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        directQuery = directQuery.eq('card_id', filters.card_id);
      }

      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        directQuery = directQuery.eq('category_id', filters.category_id);
      }

      const { data: directExpenses, error: directError } = await directQuery.order('purchase_date', { ascending: false });

      if (directError) throw directError;

      // Consulta SQL directa para obtener cuotas que vencen en el mes
      let installmentsQuery = supabase
        .from('installments')
        .select(`
          *,
          expenses!inner(
            *,
            available_cards(id, name, type, bank), 
            categories(id, name, color), 
            subcategories(id, name, color)
          ),
          payment_status(code, label)
        `)
        .eq('expenses.user_id', userId)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      // Aplicar filtros de tarjeta y categoría a las cuotas
      if (filters.card_id && filters.card_id !== 'null' && filters.card_id !== null) {
        installmentsQuery = installmentsQuery.eq('expenses.card_id', filters.card_id);
      }

      if (filters.category_id && filters.category_id !== 'null' && filters.category_id !== null) {
        installmentsQuery = installmentsQuery.eq('expenses.category_id', filters.category_id);
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
          installment_number: installment.installment_number
        }));

      // Combinar resultados
      const combinedResults = [
        ...markedDirectExpenses,
        ...markedInstallments
      ];

      // Validación adicional: filtrar por fecha de manera más estricta
      const filteredResults = combinedResults.filter(item => {
        const itemDate = item.is_installment ? item.due_date : item.purchase_date;
        const itemDateObj = new Date(itemDate);
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        const isInRange = itemDateObj >= startDateObj && itemDateObj < endDateObj;
        
        return isInRange;
      });

      return {
        success: true,
        data: filteredResults
      };

    } catch (error) {
      console.error('🔍 Backend - Error en getMonthlyExpensesWithInstallments:', error);
      throw error;
    }
  }

  // Obtener total mensual con cuotas
  static async getMonthlyTotalWithInstallments(userId, month, year) {
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
      const { data: directExpenses, error: directError } = await supabase
        .from('expenses')
        .select(`
          amount, 
          payment_status(code),
          available_cards(name, type)
        `)
        .eq('user_id', userId)
        .eq('installments_count', 1) // Solo gastos directos
        .gte('purchase_date', startDate)
        .lt('purchase_date', endDate);

      if (directError) throw directError;

      // Obtener cuotas del mes
      const { data: installments, error: installmentsError } = await supabase
        .from('installments')
        .select(`
          amount,
          expenses!inner(user_id),
          payment_status(code)
        `)
        .eq('expenses.user_id', userId)
        .gte('due_date', startDate)
        .lt('due_date', endDate);

      if (installmentsError) throw installmentsError;

      // Calcular totales sin filtrar por estado
      const totalDebitTransfer = directExpenses
        ?.filter(expense => {
          // Incluir gastos de débito, transferencia o sin tarjeta (efectivo)
          const cardType = expense.cards?.type;
          return !cardType || cardType === 'Débito' || cardType === 'Transferencia';
        })
        ?.reduce((sum, expense) => sum + expense.amount, 0) || 0;

      const totalCredit = installments
        ?.reduce((sum, installment) => sum + installment.amount, 0) || 0;

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
      console.error('🔍 Backend - Error en getMonthlyTotalWithInstallments:', error);
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
        console.error('🔍 Backend - Error actualizando cuota:', updateError);
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
      console.error('🔍 Backend - Error en updateInstallmentStatus:', error);
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
      console.error('🔍 Backend - Error actualizando estado del gasto:', error);
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
  static async deleteExpense(id, userId) {
    try {
      // Primero eliminar las cuotas asociadas
      const { error: installmentsError } = await supabase
        .from('installments')
        .delete()
        .eq('expense_id', id);

      if (installmentsError) {
        console.error('Error eliminando cuotas:', installmentsError);
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
} 