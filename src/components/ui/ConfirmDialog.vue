<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { AlertTriangle, Info, X } from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'Confirmar' },
  message: { type: String, default: '' },
  confirmText: { type: String, default: 'Confirmar' },
  cancelText: { type: String, default: 'Cancelar' },
  variant: { type: String, default: 'danger' }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

const dialogRef = ref(null)

const variantStyles = {
  danger: {
    icon: AlertTriangle,
    iconClass: 'text-danger-600',
    iconBg: 'bg-danger-50 dark:bg-danger-900/30',
    buttonClass: 'btn-danger !py-2.5 !px-5 !text-sm'
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning-600',
    iconBg: 'bg-warning-50 dark:bg-warning-900/30',
    buttonClass: 'bg-warning-500 hover:bg-warning-600 text-white font-semibold rounded-xl px-5 py-2.5 transition-all duration-200'
  },
  info: {
    icon: Info,
    iconClass: 'text-primary-600',
    iconBg: 'bg-primary-50 dark:bg-primary-900/30',
    buttonClass: 'btn-primary !py-2.5 !px-5 !text-sm'
  }
}

const currentVariant = computed(() => variantStyles[props.variant] || variantStyles.danger)

const handleBackdrop = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const handleConfirm = () => {
  emit('confirm')
  emit('update:modelValue', false)
}

const handleCancel = () => {
  emit('update:modelValue', false)
  emit('cancel')
}

const handleKeydown = (e) => {
  if (e.key === 'Escape') {
    handleCancel()
  }
  if (e.key === 'Tab') {
    trapFocus(e)
  }
}

const trapFocus = (e) => {
  if (!dialogRef.value) return
  const focusable = dialogRef.value.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
  if (focusable.length === 0) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

watch(() => props.modelValue, async (val) => {
  if (val) {
    await nextTick()
    dialogRef.value?.querySelector('.confirm-cancel-btn')?.focus()
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="confirm">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @keydown="handleKeydown"
      >
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="handleBackdrop"
        ></div>
        <div
          ref="dialogRef"
          role="alertdialog"
          aria-modal="true"
          :aria-label="title"
          class="relative bg-white dark:bg-gray-800 rounded-2xl shadow-soft-lg dark:shadow-none dark:border dark:border-gray-700 max-w-sm w-full p-6 border border-slate-100"
        >
          <button
            @click="handleCancel"
            class="absolute top-4 right-4 p-1.5 text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            :aria-label="cancelText"
          >
            <X class="h-4 w-4" />
          </button>
          <div :class="['w-12 h-12 rounded-2xl flex items-center justify-center mb-4', currentVariant.iconBg]">
            <component :is="currentVariant.icon" :class="['h-6 w-6', currentVariant.iconClass]" />
          </div>
          <h3 class="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">{{ title }}</h3>
          <p v-if="message" class="text-sm text-slate-600 dark:text-gray-400 mb-6 leading-relaxed">{{ message }}</p>
          <div class="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
            <button
              @click="handleCancel"
              class="confirm-cancel-btn btn-secondary !py-2.5 !px-5 !text-sm"
            >
              {{ cancelText }}
            </button>
            <button
              @click="handleConfirm"
              :class="currentVariant.buttonClass"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.confirm-enter-active,
.confirm-leave-active {
  transition: opacity 0.2s ease;
}
.confirm-enter-from,
.confirm-leave-to {
  opacity: 0;
}
.confirm-enter-active > div:last-child,
.confirm-leave-active > div:last-child {
  transition: transform 0.2s ease;
}
.confirm-enter-from > div:last-child,
.confirm-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
