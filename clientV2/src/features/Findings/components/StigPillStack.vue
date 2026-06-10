<script setup>
import Popover from 'primevue/popover'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

// Vertical stack of STIG benchmarkId pills for virtual-scrolled grid cells.
// The row height is pinned to itemSize, so we never clip a pill mid-way:
// we estimate how many whole pills fit in the height budget and replace the
// rest with a "+N" badge (hover shows the full list). Same approach as
// LabelsRow, but vertical, and the estimation is height-based.
//
// Estimation is deterministic because pills render in Ubuntu Mono (advance
// width is exactly 0.5em) with an explicit line-height — see the constants.

const props = defineProps({
  stigs: { type: Array, default: () => [] },
  // The grid's virtual-scroll itemSize (px). The stack budgets its pills to
  // fit within this minus the cell's vertical padding.
  itemSize: { type: Number, required: true },
})

// Geometry constants, derived from the CSS below at the 11px root:
//   CHAR_W      pill font is 0.95rem (10.45px) Ubuntu Mono → 0.5em advance
//               ≈ 5.23px/char; 5.3 rounds up so we under-, never over-fit
//   LINE_H      explicit line-height 1.3 × 10.45px ≈ 13.6 → 14
//   PILL_CHROME 2 × 0.05rem vertical padding (≈1.1px) + 2 × 1px border → 3
//   PILL_HPAD   2 × 0.3rem horizontal padding (≈6.6px) + 2 × 1px border → 9
//   GAP         stack gap 0.15rem → 2
//   CELL_VPAD   host cell vertical padding 2 × 0.15rem → 4
//   BADGE_GUTTER right gutter reserved for the +N badge when overflowing
const CHAR_W = 5.3
const LINE_H = 14
const PILL_CHROME = 3
const PILL_HPAD = 9
const GAP = 2
const CELL_VPAD = 4
const BADGE_GUTTER = 26
const MAX_PILL_LINES = 2

const containerRef = ref(null)
const containerWidth = ref(0)
let resizeObserver = null
let hideTimeout = null

onMounted(() => {
  if (containerRef.value) {
    containerWidth.value = containerRef.value.offsetWidth
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        containerWidth.value = entry.contentRect.width
      }
    })
    resizeObserver.observe(containerRef.value)
  }
})

onBeforeUnmount(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  if (hideTimeout) {
    clearTimeout(hideTimeout)
  }
})

function pillHeight(benchmarkId, pillWidth) {
  const charsPerLine = Math.max(1, Math.floor((pillWidth - PILL_HPAD) / CHAR_W))
  const lines = Math.min(MAX_PILL_LINES, Math.ceil(benchmarkId.length / charsPerLine))
  return lines * LINE_H + PILL_CHROME
}

// Walk the stack accumulating estimated pill heights until the budget is
// spent. Returns the pills that fully fit at the given width.
function fitPills(stigs, pillWidth, budget) {
  let used = 0
  const visible = []
  for (const s of stigs) {
    const h = pillHeight(s.benchmarkId, pillWidth) + (visible.length ? GAP : 0)
    if (used + h > budget) {
      break
    }
    visible.push(s)
    used += h
  }
  return visible
}

const layout = computed(() => {
  const stigs = props.stigs ?? []
  const width = containerWidth.value
  if (stigs.length === 0) {
    return { visible: [], overflowCount: 0 }
  }
  // Pre-measure (first render): show everything; recomputes once observed.
  if (!width) {
    return { visible: stigs, overflowCount: 0 }
  }
  const budget = props.itemSize - CELL_VPAD
  // Try at full width first — if every pill fits, no badge, no gutter.
  let visible = fitPills(stigs, width, budget)
  if (visible.length >= stigs.length) {
    return { visible: stigs, overflowCount: 0 }
  }
  // Overflowing: re-fit with the right gutter reserved for the badge.
  visible = fitPills(stigs, width - BADGE_GUTTER, budget)
  if (visible.length === 0) {
    // Degenerate budget — always show at least the first pill (the grid's
    // density floor is chosen so a 2-line pill fits; this is a safety net).
    visible = [stigs[0]]
  }
  return { visible, overflowCount: stigs.length - visible.length }
})

// Hover popover for the +N badge, mirroring LabelsRow's show/hide dance so
// the pointer can travel from badge to popover without it closing.
const popoverRef = ref(null)

function showPopover(event) {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  popoverRef.value?.show(event)
}

function scheduleHide() {
  hideTimeout = setTimeout(() => {
    popoverRef.value?.hide()
  }, 150)
}

function cancelHide() {
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
}

function hidePopover() {
  cancelHide()
  popoverRef.value?.hide()
}
</script>

<template>
  <div
    ref="containerRef"
    class="stig-stack"
    :class="{ 'stig-stack--overflowing': layout.overflowCount > 0 }"
  >
    <!-- The full-list popover opens from any pill, not just the +N badge —
         hovering a pill is the natural gesture, and ellipsized ids need it. -->
    <span
      v-for="s in layout.visible"
      :key="s.benchmarkId"
      class="stig-pill"
      @mouseenter="showPopover"
      @mouseleave="scheduleHide"
    >
      {{ s.benchmarkId }}
    </span>
    <button
      v-if="layout.overflowCount > 0"
      type="button"
      class="stig-stack__more"
      :aria-label="`${layout.overflowCount} more STIGs`"
      @mouseenter="showPopover"
      @mouseleave="scheduleHide"
      @click="showPopover"
    >
      +{{ layout.overflowCount }}
    </button>

    <Popover ref="popoverRef">
      <ul
        class="stig-stack__popover-list"
        @mouseenter="cancelHide"
        @mouseleave="hidePopover"
      >
        <li v-for="s in (stigs ?? [])" :key="s.benchmarkId" class="stig-pill">
          {{ s.benchmarkId }}
        </li>
      </ul>
    </Popover>
  </div>
</template>

<style scoped>
.stig-stack {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  min-width: 0;
  overflow: hidden;
}

/* Reserve the right gutter the fit math assumed, so pills and badge never
   overlap. Width must agree with BADGE_GUTTER in the script. */
.stig-stack--overflowing {
  padding-right: 26px;
}

.stig-pill {
  font-size: 0.95rem;
  /* Explicit line-height: the fit estimation depends on it (LINE_H). */
  line-height: 1.3;
  font-family: var(--font-mono);
  color: var(--color-text-dim);
  padding: 0.05rem 0.3rem;
  background: color-mix(in srgb, var(--color-primary-highlight) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary-highlight) 18%, transparent);
  border-radius: 2px;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
  /* Long ids wrap to at most 2 lines, then ellipsize (MAX_PILL_LINES). */
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.stig-stack__more {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.05rem 0.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: var(--color-text-primary);
  background: var(--color-background-darkest);
  border: 1px solid var(--color-border-default);
  border-radius: 8px;
  cursor: pointer;
}

.stig-stack__more:hover {
  border-color: var(--color-primary-highlight);
  color: var(--color-text-bright);
}

.stig-stack__popover-list {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  max-width: 28rem;
}
</style>
