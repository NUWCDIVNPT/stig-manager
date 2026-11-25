import { ref, toValue } from 'vue'
import { readStoredValue, storeValue } from '../lib/localStorage.js'
import { rootFontSizePx } from '../lib/remToPx.js'

/**
 * A height in rem that the user sets with a drag handle, remembered per browser.
 * Bind `targetEl` to the element being sized and `handleListeners` to the handle
 * with `v-on`: dragging resizes, the up/down arrow keys step by 1rem and a
 * double-click restores the default. The stored value is written when a drag
 * ends, not on every move.
 * @param {object} options
 * @param {string} options.storageKey localStorage key for the height
 * @param {number} options.defaultRem
 * @param {number} options.minRem
 * @param {number} options.maxRem
 * @param {import('vue').MaybeRefOrGetter<boolean>} [options.inverted] true when
 *   the element grows upward from a fixed bottom edge, so moving up is taller
 */
export function useResizableHeight({ storageKey, defaultRem, minRem, maxRem, inverted = false }) {
  function clamp(rem) {
    if (!Number.isFinite(rem)) {
      return defaultRem
    }
    return Math.min(maxRem, Math.max(minRem, Math.round(rem * 10) / 10))
  }

  const targetEl = ref(null)
  const heightRem = ref(clamp(Number.parseFloat(readStoredValue(storageKey, ''))))
  let drag = null

  function persist() {
    storeValue(storageKey, String(heightRem.value))
  }

  function growDirection() {
    return toValue(inverted) ? -1 : 1
  }

  function onPointerdown(event) {
    if (event.button) {
      return
    }
    event.preventDefault()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    // Start from the rendered height, which a stylesheet cap may have reduced
    const renderedPx = targetEl.value?.getBoundingClientRect().height
    drag = {
      startY: event.clientY,
      startRem: renderedPx ? renderedPx / rootFontSizePx() : heightRem.value,
    }
  }

  function onPointermove(event) {
    if (!drag) {
      return
    }
    const deltaPx = (event.clientY - drag.startY) * growDirection()
    heightRem.value = clamp(drag.startRem + deltaPx / rootFontSizePx())
  }

  function onPointerend() {
    if (!drag) {
      return
    }
    drag = null
    persist()
  }

  function onKeydown(event) {
    const step = { ArrowUp: -1, ArrowDown: 1 }[event.key]
    if (!step) {
      return
    }
    event.preventDefault()
    heightRem.value = clamp(heightRem.value + step * growDirection())
    persist()
  }

  function reset() {
    heightRem.value = defaultRem
    persist()
  }

  const handleListeners = {
    pointerdown: onPointerdown,
    pointermove: onPointermove,
    pointerup: onPointerend,
    pointercancel: onPointerend,
    keydown: onKeydown,
    dblclick: reset,
  }

  return { heightRem, targetEl, handleListeners }
}
