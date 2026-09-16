import { computed, ref } from 'vue'
import { rootFontSizePx } from '../lib/remToPx.js'

// Row geometry per grid, in rem so it follows the root font-size.
//   defaultLineClamp: lines of clamped cell text shown until the user changes it
//   lineRem: height of one rendered line of the clamped text. The grid sets it
//            on its root as --cell-line-height and the clamped cell rule reads
//            it, so N clamped lines fill exactly N × lineRem and the virtual
//            scroller's n × itemSize placement holds. The cell font-size is
//            free as long as it is smaller than lineRem.
//   padRem:  vertical room around the text (cell padding plus breathing space)
//   minRem:  natural height of the tallest non-text cell (badges, icons, input
//            controls); rows never shrink below it at low clamps
// A grid's header and body components both call useGridDensity(gridKey) and get
// the same geometry, so the two can not fall out of sync.
export const GRID_GEOMETRY = {
  'asset-review-checklist': { defaultLineClamp: 3, lineRem: 1.1 * 1.3, padRem: 0.4, minRem: 2.2 },
  'collection-checklist': { defaultLineClamp: 2, lineRem: 1.1 * 1.3, padRem: 1.32, minRem: 2.2 },
  'collection-rule-table': { defaultLineClamp: 1, lineRem: 1.1 * 1.3, padRem: 1.84, minRem: 2.4 },
  'findings-aggregated': { defaultLineClamp: 2, lineRem: 1 * 1.3, padRem: 0.67, minRem: 2.2 },
  'findings-individual': { defaultLineClamp: 2, lineRem: 1 * 1.3, padRem: 0.67, minRem: 2.4 },
  'stig-library-benchmarks': { defaultLineClamp: 2, lineRem: 1.05 * 1.3, padRem: 0.54, minRem: 1.9 },
  'stig-library-rules': { defaultLineClamp: 2, lineRem: 1.05 * 1.3, padRem: 0.54, minRem: 2.2 },
}

const MIN_LINE_CLAMP = 1
const MAX_LINE_CLAMP = 10

const densityState = new Map()

if (import.meta.hot) {
  import.meta.hot.dispose(() => densityState.clear())
}

export function useGridDensity(gridKey) {
  const geometry = GRID_GEOMETRY[gridKey]
  if (!geometry) {
    throw new Error(`useGridDensity: no geometry registered for grid "${gridKey}"`)
  }

  if (!densityState.has(gridKey)) {
    densityState.set(gridKey, ref(geometry.defaultLineClamp))
  }

  const lineClamp = densityState.get(gridKey)

  // rem string for the clamped cell's line-height (see lineRem above).
  const cellLineHeight = `${Number(geometry.lineRem.toFixed(4))}rem`

  const itemSize = computed(() => {
    const rem = Math.max(geometry.minRem, geometry.lineRem * lineClamp.value + geometry.padRem)
    return Math.ceil(rem * rootFontSizePx())
  })

  function increaseRowHeight() {
    if (lineClamp.value < MAX_LINE_CLAMP) {
      lineClamp.value++
    }
  }

  function decreaseRowHeight() {
    if (lineClamp.value > MIN_LINE_CLAMP) {
      lineClamp.value--
    }
  }

  return {
    lineClamp,
    itemSize,
    cellLineHeight,
    increaseRowHeight,
    decreaseRowHeight,
  }
}
