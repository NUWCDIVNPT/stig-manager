// Text width measurement for components that fit content to a width (e.g. the
// label chips in LabelsRow). One canvas context and one cache serve every
// caller: cell components mount per row on the scroll path, so per-instance
// state here would be re-created continuously while scrolling.

import { ref } from 'vue'

// Average glyph width relative to the font size, used when no canvas is available (jsdom).
const FALLBACK_EM_RATIO = 0.6
const FALLBACK_FONT_PX = 16

let ctx // 2D context, created on first use; null when unavailable
let ctxFont = '' // font last assigned to ctx, so it is set once per font
let cachedBodyFontFamily
const cache = new Map() // `${font}\0${text}` -> width in px

// Bumped when a font finishes loading: widths measured against a fallback face
// are stale, so the cache is dropped and reactive callers recompute.
const fontsVersion = ref(0)

function onFontsLoaded() {
  cache.clear()
  fontsVersion.value++
}

if (typeof document !== 'undefined' && document.fonts) {
  document.fonts.addEventListener('loadingdone', onFontsLoaded)
}

function getContext() {
  if (ctx === undefined) {
    ctx = typeof document === 'undefined' ? null : document.createElement('canvas').getContext?.('2d') ?? null
  }
  return ctx
}

function fontSizePx(font) {
  const match = /(\d+(?:\.\d+)?)px/.exec(font)
  return match ? Number(match[1]) : FALLBACK_FONT_PX
}

/**
 * The document's body font-family, read once per page. Use it to build a CSS
 * font shorthand for `measureTextWidth` that matches inherited text.
 */
export function bodyFontFamily() {
  cachedBodyFontFamily ??= (typeof document === 'undefined' ? '' : getComputedStyle(document.body).fontFamily) || 'sans-serif'
  return cachedBodyFontFamily
}

/**
 * Width in px of `text` rendered in `font` (a CSS font shorthand such as
 * `600 10.8px Inter, sans-serif`). Cached per font and text. Reading it inside
 * a computed re-runs that computed after a web font loads.
 */
export function measureTextWidth(text, font) {
  void fontsVersion.value
  const key = `${font}\0${text}`
  let width = cache.get(key)
  if (width === undefined) {
    const context = getContext()
    if (context) {
      if (ctxFont !== font) {
        context.font = font
        ctxFont = font
      }
      width = context.measureText(text).width
    }
    else {
      width = text.length * FALLBACK_EM_RATIO * fontSizePx(font)
    }
    cache.set(key, width)
  }
  return width
}

// Test seam, and dropped on every Vite update (CSS ones included) since a
// hot-swapped stylesheet can change the fonts being measured.
export function resetTextWidthCache() {
  cache.clear()
  ctx = undefined
  ctxFont = ''
  cachedBodyFontFamily = undefined
}

if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', resetTextWidthCache)
}
