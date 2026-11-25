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
 * @param {import('vue').MaybeRefOrGetter<number>} options.maxRem the tallest
 *   the element can render, e.g. a getter for a viewport-relative stylesheet
 *   cap. Read on every change, so the height never runs past what is shown.
 * @param {import('vue').MaybeRefOrGetter<boolean>} [options.inverted] true when
 *   the element grows upward from a fixed bottom edge, so moving up is taller
 */
export function useResizableHeight({ storageKey, defaultRem, minRem, maxRem, inverted = false }) {
  // Heights are kept to a tenth of a rem; the maximum rounds down so the
  // result never passes it. The minimum wins over a smaller maximum, as
  // min-height does in CSS.
  function clamp(rem) {
    const max = Math.floor(toValue(maxRem) * 10) / 10
    return Math.max(minRem, Math.min(max, Math.round(rem * 10) / 10))
  }

  // The stored height is not held to the maximum on load: the maximum can rise
  // later (a taller window) and the stylesheet caps what is shown meanwhile.
  function readStored() {
    const stored = Number.parseFloat(readStoredValue(storageKey, ''))
    return Number.isFinite(stored) ? Math.max(minRem, stored) : defaultRem
  }

  const targetEl = ref(null)
  const heightRem = ref(readStored())
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
    // Step from the height in force now, which the maximum may have reduced
    heightRem.value = clamp(clamp(heightRem.value) + step * growDirection())
    persist()
  }

  function reset() {
    heightRem.value = clamp(defaultRem)
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
