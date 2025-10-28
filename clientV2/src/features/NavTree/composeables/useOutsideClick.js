import { onBeforeUnmount, onMounted, unref, watchEffect } from 'vue'

export function useOutsideClick(targetRef, onOutside, options = {}) {
  const events = options.events || ['mousedown', 'touchstart']
  let cleanup = () => {}

  function handler(e) {
    const el = unref(targetRef)
    if (!el) {
      return
    }
    const target = e.target
    if (!(target instanceof Node)) {
      return
    }
    if (!el.contains(target)) {
      onOutside(e)
    }
  }

  function add() {
    remove()
    for (const ev of events) {
      document.addEventListener(ev, handler, { passive: true })
    }
    cleanup = () => {
      for (const ev of events) {
        document.removeEventListener(ev, handler)
      }
      cleanup = () => {}
    }
  }

  function remove() {
    cleanup()
  }

  onMounted(() => {
    if (unref(options.active) ?? true) {
      add()
    }
  })

  onBeforeUnmount(() => remove())

  // react to active flag changes if it's a ref
  watchEffect(() => {
    const active = unref(options.active)
    if (active === undefined) {
      return
    }
    if (active) {
      add()
    }
    else { remove() }
  })

  return { attach: add, detach: remove }
}
