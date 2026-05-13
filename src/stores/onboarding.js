import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOnboardingStore = defineStore('onboarding', () => {
  const STORAGE_KEY = 'onboarding_completed'

  const showOnboarding = ref(false)
  const currentStep = ref(0)
  const completed = ref(true)

  const loadState = () => {
    const stored = localStorage.getItem(STORAGE_KEY)
    completed.value = stored === 'true'
  }

  loadState()

  const skipTour = () => {
    completed.value = true
    showOnboarding.value = false
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const completeTour = () => {
    completed.value = true
    showOnboarding.value = false
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const startTour = () => {
    currentStep.value = 0
    showOnboarding.value = true
  }

  const nextStep = () => {
    if (currentStep.value < 3) {
      currentStep.value++
    }
  }

  const prevStep = () => {
    if (currentStep.value > 0) {
      currentStep.value--
    }
  }

  return {
    showOnboarding,
    currentStep,
    completed,
    skipTour,
    completeTour,
    startTour,
    nextStep,
    prevStep,
  }
})
