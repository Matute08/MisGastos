import { ref, computed } from 'vue';
import Swal from 'sweetalert2';
import { fireConfetti } from '@/utils/confetti';

export function useExpenseSelection({
  filteredExpensesToShow,
  getExpenseRowKey,
  expensesStore,
  paymentStatusMap,
  loadDataCallback
}) {
  const selectedExpenses = ref(new Set());
  const isBulkMode = ref(false);
  const selectAllExpenses = ref(false);
  const isBulkActionLoading = ref(false);

  const selectedExpensesCount = computed(() => selectedExpenses.value.size);

  const toggleBulkMode = () => {
    if (isBulkActionLoading.value) return;
    isBulkMode.value = !isBulkMode.value;
    if (!isBulkMode.value) {
      selectedExpenses.value = new Set();
      selectAllExpenses.value = false;
    }
  };

  const toggleExpenseSelection = (expenseId) => {
    const nextSelected = new Set(selectedExpenses.value);

    if (nextSelected.has(expenseId)) {
      nextSelected.delete(expenseId);
    } else {
      nextSelected.add(expenseId);
    }

    selectedExpenses.value = nextSelected;
    selectAllExpenses.value =
      filteredExpensesToShow.value.length > 0 &&
      filteredExpensesToShow.value.every((item) => nextSelected.has(getExpenseRowKey(item)));
  };

  const toggleSelectAllExpenses = () => {
    if (isBulkActionLoading.value) return;
    if (selectAllExpenses.value) {
      selectedExpenses.value = new Set();
      selectAllExpenses.value = false;
    } else {
      const allExpenseIds = filteredExpensesToShow.value.map((item) => getExpenseRowKey(item));
      selectedExpenses.value = new Set(allExpenseIds);
      selectAllExpenses.value = true;
    }
  };

  const bulkDeleteExpenses = async () => {
    if (selectedExpensesCount.value === 0) return;

    const { value: confirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: `Se eliminarán ${selectedExpensesCount.value} gasto(s). Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmed) {
      try {
        isBulkActionLoading.value = true;
        Swal.fire({
          title: 'Procesando...',
          text: 'Actualizando gastos seleccionados, por favor esperá.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        let successCount = 0;
        let errorCount = 0;

        for (const selectedId of Array.from(selectedExpenses.value)) {
          const expenseId = selectedId.startsWith('expense-')
            ? selectedId.replace('expense-', '')
            : selectedId;

          const result = await expensesStore.deleteExpense(expenseId);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
          }
        }

        await loadDataCallback();

        selectedExpenses.value = new Set();
        isBulkMode.value = false;
        selectAllExpenses.value = false;
        Swal.close();

        await Swal.fire({
          icon: successCount > 0 ? 'success' : 'error',
          title: successCount > 0 ? '¡Gastos eliminados!' : 'Error al eliminar',
          text:
            successCount > 0
              ? `Se eliminaron ${successCount} gasto(s) correctamente.${errorCount > 0 ? ` ${errorCount} gasto(s) no se pudieron eliminar.` : ''}`
              : 'No se pudo eliminar ningún gasto.'
        });
      } catch (error) {
        Swal.close();
        await Swal.fire({
          icon: 'error',
          title: 'Error inesperado',
          text: error.message || 'Ocurrió un error al eliminar los gastos.'
        });
      } finally {
        isBulkActionLoading.value = false;
      }
    }
  };

  const bulkChangeStatus = async (newStatusId) => {
    if (selectedExpensesCount.value === 0) return;

    const statusLabel = paymentStatusMap[newStatusId]?.label || 'estado';

    const { value: confirmed } = await Swal.fire({
      title: '¿Confirmar cambio?',
      text: `Se cambiarán ${selectedExpensesCount.value} gasto(s) a estado "${statusLabel}".`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cambiar',
      cancelButtonText: 'Cancelar'
    });

    if (confirmed) {
      try {
        isBulkActionLoading.value = true;
        Swal.fire({
          title: 'Procesando...',
          text: 'Actualizando gastos seleccionados, por favor esperá.',
          allowOutsideClick: false,
          allowEscapeKey: false,
          showConfirmButton: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });
        let successCount = 0;
        let errorCount = 0;

        for (const expenseId of Array.from(selectedExpenses.value)) {
          try {
            let actualId = expenseId;
            let isInstallment = false;

            if (expenseId.startsWith('installment-')) {
              actualId = expenseId.replace('installment-', '');
              isInstallment = true;
            } else if (expenseId.startsWith('expense-')) {
              actualId = expenseId.replace('expense-', '');
              isInstallment = false;
            }

            let result;
            if (isInstallment) {
              result = await expensesStore.markInstallmentAsPaid(actualId, newStatusId);
            } else {
              result = await expensesStore.markAsPaid(actualId, newStatusId);
            }
            if (result.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch (error) {
            console.error(`Error actualizando gasto ${expenseId}:`, error);
            errorCount++;
          }
        }

        await loadDataCallback();

        selectedExpenses.value = new Set();
        isBulkMode.value = false;
        selectAllExpenses.value = false;
        Swal.close();

        if (successCount > 0 && newStatusId === 2) {
          fireConfetti({ count: 60 });
        }

        await Swal.fire({
          icon: successCount > 0 ? 'success' : 'error',
          title: successCount > 0 ? '¡Estado actualizado!' : 'Error al actualizar',
          text:
            successCount > 0
              ? `Se actualizaron ${successCount} gasto(s) a "${statusLabel}".${errorCount > 0 ? ` ${errorCount} gasto(s) no se pudieron actualizar.` : ''}`
              : 'No se pudo actualizar ningún gasto.'
        });
      } catch (error) {
        Swal.close();
        await Swal.fire({
          icon: 'error',
          title: 'Error inesperado',
          text: error.message || 'Ocurrió un error al actualizar los gastos.'
        });
      } finally {
        isBulkActionLoading.value = false;
      }
    }
  };

  return {
    selectedExpenses,
    isBulkMode,
    selectAllExpenses,
    isBulkActionLoading,
    selectedExpensesCount,
    toggleBulkMode,
    toggleExpenseSelection,
    toggleSelectAllExpenses,
    bulkDeleteExpenses,
    bulkChangeStatus
  };
}
