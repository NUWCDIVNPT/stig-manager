import { computed, ref } from 'vue'

const densityState = new Map()

export function useGridDensity(gridKey, defaultLineClamp = 1, baseItemSize = 12, sizeMultiplier = 24) {
  if (!densityState.has(gridKey)) {
    densityState.set(gridKey, ref(defaultLineClamp))
  }

  const lineClamp = densityState.get(gridKey)

  const itemSize = computed(() => (sizeMultiplier * lineClamp.value) + baseItemSize)

  function increaseRowHeight() {
    if (lineClamp.value < 10) {
      lineClamp.value++
    }
  }

  function decreaseRowHeight() {
    if (lineClamp.value > 1) {
      lineClamp.value--
    }
  }

  return {
    lineClamp,
    itemSize,
    increaseRowHeight,
    decreaseRowHeight,
  }
}
