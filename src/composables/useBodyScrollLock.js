/**
 * Evita scroll del documento detrás de modales (especialmente en iOS).
 * Usa position:fixed en body y restaura la posición al desbloquear.
 */
export function useBodyScrollLock() {
  let scrollY = 0

  const lock = () => {
    scrollY = window.scrollY || document.documentElement.scrollTop || 0
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
  }

  const unlock = () => {
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''
    window.scrollTo(0, scrollY)
  }

  return { lock, unlock }
}
