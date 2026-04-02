import { computed, ref } from 'vue'

// Shared state across all Review Resources tabs (History, Other Assets)
// Independent from the main ChecklistGrid
const lineClamp = ref(3)

export function useReviewDensity() {
  // Row height control (line-clamp 1-10, default 3)
  const itemSize = computed(() => (15 * lineClamp.value) + 16) // Slightly more padding for these tabs

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
