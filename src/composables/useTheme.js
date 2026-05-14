import { ref, watch } from 'vue'

const isDark = ref(false)

export function useTheme() {
  const STORAGE_KEY = 'theme'

  function applyTheme(dark) {
    if (dark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    isDark.value = dark
  }

  function initTheme() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'dark') {
      applyTheme(true)
    } else if (stored === 'light') {
      applyTheme(false)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      applyTheme(prefersDark)
    }
  }

  function toggleTheme() {
    applyTheme(!isDark.value)
  }

  watch(isDark, (val) => {
    localStorage.setItem(STORAGE_KEY, val ? 'dark' : 'light')
  })

  return { isDark, toggleTheme, initTheme }
}
