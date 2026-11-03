// Virtual scrollers need a px itemSize, but the client sizes rows in rem.
// Declare row heights in rem and convert here so a root font-size change
// (style.css :root) moves every scroller with it instead of leaving rows taller
// than the scroller thinks they are.

const FALLBACK_ROOT_PX = 16 // browser default; jsdom has no computed font-size

// The root font-size is fixed for the life of the page (browser zoom scales CSS
// px uniformly), so read it once. Row cell components call this per mount on
// the scroll path, where a CSSOM read can force a style recalc.
let cachedRootPx

function readRootFontSizePx() {
  if (typeof document === 'undefined') {
    return FALLBACK_ROOT_PX
  }
  const px = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(px) && px > 0 ? px : FALLBACK_ROOT_PX
}

export function rootFontSizePx() {
  cachedRootPx ??= readRootFontSizePx()
  return cachedRootPx
}

// Test seam: tests mock getComputedStyle per case, so the memo must not carry over.
export function resetRootFontSizeCache() {
  cachedRootPx = undefined
}

// A hot-swapped stylesheet can change the root font-size, so drop the memo on
// every Vite update (CSS ones included) and let the next mount re-read it.
// Already-mounted scrollers keep the itemSize they computed until they remount.
if (import.meta.hot) {
  import.meta.hot.on('vite:afterUpdate', resetRootFontSizeCache)
}

// Rounds up: rows are pinned to this value with overflow hidden, so a px too
// tall is invisible while a px too short clips content.
export function remToPx(rem) {
  return Math.ceil(rem * rootFontSizePx())
}
