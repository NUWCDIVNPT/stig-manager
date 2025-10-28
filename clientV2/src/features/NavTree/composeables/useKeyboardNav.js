import { onBeforeUnmount, onMounted } from 'vue'

// - handlers: { Enter?: (e: KeyboardEvent) => void, Escape?: (e: KeyboardEvent) => void }
// - options?: { target?: Window | Document | HTMLElement }
export function useKeyboardNav(handlers = {}, options = {}) {
  const target = options.target || window

  function onKey(e) {
    if (e.key === 'Enter' && typeof handlers.Enter === 'function') {
      handlers.Enter(e)
    }
    if (e.key === 'Escape' && typeof handlers.Escape === 'function') {
      handlers.Escape(e)
    }
  }

  onMounted(() => target.addEventListener('keydown', onKey))
  onBeforeUnmount(() => target.removeEventListener('keydown', onKey))
}
