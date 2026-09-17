import { computed, ref } from 'vue'
import { remToPx } from '../lib/remToPx.js'

// Unitless line-height of the clamped cell text in every density grid.
const LINE_HEIGHT = 1.3

// Row geometry per grid, in rem so it follows the root font-size.
//   defaultLineClamp: lines of clamped cell text shown until the user changes it
//   minLineClamp: lowest clamp the density control allows (default 1); a grid
//            whose rows hold more than the clamped text (badges, label rows)
//            floors higher so one line of text never leaves the row half empty
//   fontRem: font-size of the clamped cell text (the grid's .cell-text rule
//            must match). One rendered line is fontRem × LINE_HEIGHT; the grid
//            binds it as --cell-line-height and the clamped cell rule reads it,
//            so N clamped lines fill exactly N lines and the virtual scroller's
//            n × itemSize placement holds.
//   padRem:  vertical room around the text (cell padding plus breathing space)
//   minRem:  natural height of the tallest non-text cell (badges, icons, input
//            controls); rows never shrink below it at low clamps
// A grid's header and body components both call useGridDensity(gridKey) and get
// the same geometry, so the two can not fall out of sync.
export const GRID_GEOMETRY = {
  'asset-review-checklist': { defaultLineClamp: 3, fontRem: 1.1, padRem: 0.4, minRem: 2.2 },
  'collection-checklist': { defaultLineClamp: 2, fontRem: 1.1, padRem: 0.4, minRem: 2.2 },
  'collection-rule-table': { defaultLineClamp: 1, fontRem: 1.1, padRem: 0.4, minRem: 2.4 },
  'findings-aggregated': { defaultLineClamp: 2, minLineClamp: 2, fontRem: 1, padRem: 0.67, minRem: 2.2 },
  'findings-individual': { defaultLineClamp: 2, minLineClamp: 2, fontRem: 1, padRem: 0.67, minRem: 2.4 },
  'stig-library-benchmarks': { defaultLineClamp: 2, fontRem: 1.05, padRem: 0.54, minRem: 1.9 },
  'stig-library-rules': { defaultLineClamp: 2, fontRem: 1.05, padRem: 0.54, minRem: 2.2 },
}

const MAX_LINE_CLAMP = 10

const densityState = new Map()

// Test seam: density state is module-level so header and body share it.
export function resetDensityState() {
  densityState.clear()
}

if (import.meta.hot) {
  import.meta.hot.dispose(resetDensityState)
}

export function useGridDensity(gridKey) {
  const geometry = GRID_GEOMETRY[gridKey]
  if (!geometry) {
    throw new Error(`useGridDensity: no geometry registered for grid "${gridKey}"`)
  }
  const minLineClamp = geometry.minLineClamp ?? 1
  const lineRem = Number((geometry.fontRem * LINE_HEIGHT).toFixed(3))

  if (!densityState.has(gridKey)) {
    densityState.set(gridKey, ref(geometry.defaultLineClamp))
  }

  const lineClamp = densityState.get(gridKey)

  const itemSize = computed(() =>
    remToPx(Math.max(geometry.minRem, lineRem * lineClamp.value + geometry.padRem)),
  )

  // Bind on the grid root; its clamped cell CSS reads these variables.
  const gridStyle = computed(() => ({
    '--line-clamp': lineClamp.value,
    '--item-size': `${itemSize.value}px`,
    '--cell-line-height': `${lineRem}rem`,
  }))

  const canIncrease = computed(() => lineClamp.value < MAX_LINE_CLAMP)
  const canDecrease = computed(() => lineClamp.value > minLineClamp)

  function increaseRowHeight() {
    if (canIncrease.value) {
      lineClamp.value++
    }
  }

  function decreaseRowHeight() {
    if (canDecrease.value) {
      lineClamp.value--
    }
  }

  return {
    lineClamp,
    itemSize,
    gridStyle,
    canIncrease,
    canDecrease,
    increaseRowHeight,
    decreaseRowHeight,
  }
}
