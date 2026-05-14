import { ref, onMounted, onUnmounted } from 'vue'

export function useKeyboardShortcuts() {
  const showShortcutsHelp = ref(false)

  const handler = (event) => {
    if (event.key === 'Escape') {
      if (showShortcutsHelp.value) {
        showShortcutsHelp.value = false
      }
      return
    }

    if (event.key === '?' && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
      showShortcutsHelp.value = !showShortcutsHelp.value
      return
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
    const modKey = isMac ? event.metaKey : event.ctrlKey

    if (!modKey) return

    switch (event.key.toLowerCase()) {
      case 'n':
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('shortcut:new-expense'))
        break
      case 'i':
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('shortcut:new-income'))
        break
      case 'e':
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('shortcut:go-expenses'))
        break
      case 'd':
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('shortcut:go-dashboard'))
        break
    }
  }

  const registerShortcuts = () => {
    document.addEventListener('keydown', handler)
  }

  const unregisterShortcuts = () => {
    document.removeEventListener('keydown', handler)
  }

  return {
    registerShortcuts,
    unregisterShortcuts,
    showShortcutsHelp,
  }
}
