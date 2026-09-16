// Virtual scrollers need a px itemSize, but the client sizes rows in rem.
// Declare row heights in rem and convert here so a root font-size change
// (style.css :root) moves every scroller with it instead of leaving rows taller
// than the scroller thinks they are.

const FALLBACK_ROOT_PX = 16 // browser default; jsdom has no computed font-size

export function rootFontSizePx() {
  if (typeof document === 'undefined') {
    return FALLBACK_ROOT_PX
  }
  const px = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
  return Number.isFinite(px) && px > 0 ? px : FALLBACK_ROOT_PX
}

// Rounds up: rows are pinned to this value with overflow hidden, so a px too
// tall is invisible while a px too short clips content.
export function remToPx(rem) {
  return Math.ceil(rem * rootFontSizePx())
}
