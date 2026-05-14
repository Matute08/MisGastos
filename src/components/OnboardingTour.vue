<script setup>
import { computed } from 'vue'
import { useOnboardingStore } from '@/stores/onboarding'
import { Wallet, CreditCard, Receipt, TrendingUp, ChevronLeft, ChevronRight, X } from 'lucide-vue-next'

const onboardingStore = useOnboardingStore()

const steps = [
  {
    title: '¡Bienvenido a MisGastos!',
    description: 'Gestiona tus finanzas personales de forma simple y eficiente. Lleva el control de todos tus gastos en un solo lugar.',
    icon: Wallet,
  },
  {
    title: 'Agrega tus cuentas',
    description: 'Vincula tus tarjetas de crédito y débito para tener una visión completa de tus finanzas desde el primer día.',
    icon: CreditCard,
  },
  {
    title: 'Registra tus gastos',
    description: 'Lleva el control de cada peso que gastas. Categoriza y organiza todos tus movimientos para entender tus hábitos.',
    icon: Receipt,
  },
  {
    title: 'Dashboard inteligente',
    description: 'Visualiza gráficos y métricas clave para tomar mejores decisiones financieras. Todo tu resumen en un vistazo.',
    icon: TrendingUp,
  },
]

const currentStep = computed(() => steps[onboardingStore.currentStep])
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="onboardingStore.showOnboarding"
        class="fixed inset-0 z-[70] flex items-end sm:items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-label="Tour de bienvenida"
      >
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <Transition
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          enter-to-class="opacity-100 translate-y-0 sm:scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 translate-y-0 sm:scale-100"
          leave-to-class="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          mode="out-in"
        >
          <div
            :key="onboardingStore.currentStep"
            class="relative w-full sm:max-w-lg bg-white dark:bg-gray-800 rounded-t-2xl sm:rounded-2xl shadow-soft-lg dark:shadow-none dark:border dark:border-gray-700 overflow-hidden"
          >
            <button
              type="button"
              @click="onboardingStore.skipTour()"
              class="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 z-10"
              aria-label="Cerrar tour"
            >
              <X class="w-5 h-5" />
            </button>

            <div class="p-8 sm:p-10">
              <div class="flex flex-col items-center text-center">
                <div class="mb-2">
                  <span class="text-xs font-semibold text-primary-500 dark:text-primary-400 uppercase tracking-wider">
                    Paso {{ onboardingStore.currentStep + 1 }} de {{ steps.length }}
                  </span>
                </div>

                <div class="w-20 h-20 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-6">
                  <component
                    :is="currentStep.icon"
                    class="w-10 h-10 text-primary-600 dark:text-primary-400"
                  />
                </div>

                <h2 class="text-xl sm:text-2xl font-bold text-slate-900 dark:text-gray-100 mb-3">
                  {{ currentStep.title }}
                </h2>

                <p class="text-sm sm:text-base text-slate-500 dark:text-gray-400 leading-relaxed max-w-sm">
                  {{ currentStep.description }}
                </p>
              </div>
            </div>

            <div class="flex items-center justify-center gap-2 pb-6">
              <span
                v-for="i in steps.length"
                :key="i"
                class="block w-2 h-2 rounded-full transition-all duration-300"
                :class="
                  i - 1 === onboardingStore.currentStep
                    ? 'bg-primary-600 dark:bg-primary-400 w-6'
                    : 'bg-gray-200 dark:bg-gray-600'
                "
              ></span>
            </div>

            <div class="flex items-center justify-between px-8 pb-8 gap-3">
              <button
                type="button"
                @click="onboardingStore.skipTour()"
                class="text-sm font-medium text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-3 py-2"
              >
                Saltar
              </button>

              <div class="flex items-center gap-2">
                <button
                  v-if="onboardingStore.currentStep > 0"
                  type="button"
                  @click="onboardingStore.prevStep()"
                  class="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-gray-600 text-slate-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Paso anterior"
                >
                  <ChevronLeft class="w-5 h-5" />
                </button>

                <button
                  v-if="onboardingStore.currentStep < steps.length - 1"
                  type="button"
                  @click="onboardingStore.nextStep()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  Siguiente
                  <ChevronRight class="w-4 h-4" />
                </button>

                <button
                  v-if="onboardingStore.currentStep === steps.length - 1"
                  type="button"
                  @click="onboardingStore.completeTour()"
                  class="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                >
                  ¡Empezar!
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
