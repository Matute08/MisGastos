<script setup>
const model = defineModel({ type: Boolean, default: false })

const shortcuts = [
  { keys: ['Ctrl', 'N'], label: 'Nuevo gasto' },
  { keys: ['Ctrl', 'I'], label: 'Nuevo ingreso' },
  { keys: ['Ctrl', 'E'], label: 'Ir a gastos' },
  { keys: ['Ctrl', 'D'], label: 'Ir al dashboard' },
  { keys: ['?'], label: 'Mostrar esta ayuda' },
  { keys: ['Esc'], label: 'Cerrar ventana' },
]

const handleBackdrop = () => {
  model.value = false
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    model.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="model"
        class="fixed inset-0 z-[60] flex items-center justify-center p-4"
        @keydown="handleKeydown"
        @click.self="handleBackdrop"
      >
        <div class="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        <div
          role="dialog"
          aria-modal="true"
          aria-label="Atajos de teclado"
          class="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg dark:shadow-none dark:border dark:border-gray-700 overflow-hidden"
        >
          <div class="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <h2 class="text-lg font-bold text-slate-900 dark:text-gray-100">
              Atajos de teclado
            </h2>
            <button
              type="button"
              @click="model = false"
              class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div class="p-6 space-y-3">
            <div
              v-for="shortcut in shortcuts"
              :key="shortcut.keys.join('-')"
              class="flex items-center justify-between py-2"
            >
              <span class="text-sm text-slate-600 dark:text-gray-300">{{ shortcut.label }}</span>
              <div class="flex items-center gap-1.5">
                <kbd
                  v-for="key in shortcut.keys"
                  :key="key"
                  class="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 text-xs font-semibold text-slate-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm"
                >{{ key }}</kbd>
              </div>
            </div>
          </div>

          <div class="px-6 pb-6">
            <p class="text-xs text-slate-400 dark:text-gray-500 text-center">
              Presiona <kbd class="inline-flex items-center justify-center min-w-[1.5rem] h-5 px-1 text-xs font-semibold text-slate-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded">?</kbd> para abrir esta ayuda
            </p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
