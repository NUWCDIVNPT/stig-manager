import { vi } from 'vitest'
import { resetRootFontSizeCache } from '../shared/lib/remToPx.js'

// jsdom has no computed root font-size, so tests of rem-derived geometry stub
// it. Pair with restoreRootFontSize() in afterEach: remToPx memoizes the root
// size, so the memo must be dropped along with the spy.
export function mockRootFontSize(px) {
  resetRootFontSizeCache()
  return vi.spyOn(globalThis, 'getComputedStyle').mockReturnValue({ fontSize: `${px}px` })
}

export function restoreRootFontSize() {
  vi.restoreAllMocks()
  resetRootFontSizeCache()
}
