/**
 * Evita scroll del documento detrás de modales (especialmente en iOS).
 * Usa position:fixed en body y restaura la posición al desbloquear.
 */
export function useBodyScrollLock() {
  let scrollY = 0

  const lock = () => {
    scrollY = window.scrollY || document.documentElement.scrollTop || 0
    const html = document.documentElement
    html.style.overflow = 'hidden'
    html.style.position = 'fixed'
    html.style.top = `-${scrollY}px`
    html.style.left = '0'
    html.style.right = '0'
    html.style.width = '100%'
  }

  const unlock = () => {
    const html = document.documentElement
    html.style.overflow = ''
    html.style.position = ''
    html.style.top = ''
    html.style.left = ''
    html.style.right = ''
    html.style.width = ''
    window.scrollTo(0, scrollY)
  }

  return { lock, unlock }
}
