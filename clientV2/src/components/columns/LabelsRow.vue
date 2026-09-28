<script setup>
import Popover from 'primevue/popover'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getContrastColor, normalizeColor } from '../../shared/lib/colorUtils.js'
import { rootFontSizePx } from '../../shared/lib/remToPx.js'
import { TEXT_SCALE_REM } from '../../shared/lib/textScale.js'
import { bodyFontFamily, measureTextWidth } from '../../shared/lib/textWidth.js'
import HighlightText from '../common/HighlightText.vue'

const props = defineProps({
  labels: {
    type: Array,
    default: () => [],
  },
  // Allow customization for different contexts (e.g., standalone column vs shared row)
  compact: {
    type: Boolean,
    default: false,
  },
  searchTerm: {
    type: String,
    default: '',
  },
})

const popoverRef = ref()
let hideTimeout = null

// Chip geometry in px derived from rem so it tracks the root font-size along
// with the chip CSS below. Padding, gap and font (--text-md) mirror .label-tag /
// .labels-row exactly; the +N badge is a chip too and is measured the same
// way. `compact` only drops the trailing margin.
const root = rootFontSizePx()
const LABEL_FONT = `600 ${TEXT_SCALE_REM.md * root}px ${bodyFontFamily()}`
const LABEL_PADDING = 0.9 * root
const LABEL_GAP = 0.25 * root
const RIGHT_MARGIN = computed(() => props.compact ? 0 : 0.75 * root)

// Container ref and width
const containerRef = ref(null)
const containerWidth = ref(0)
let resizeObserver = null

onMounted(() => {
  if (containerRef.value) {
    // Initial measurement
    containerWidth.value = containerRef.value.offsetWidth

    // Watch for resize
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

// Rendered width of a chip for the given text
function estimateLabelWidth(text) {
  return measureTextWidth(String(text), LABEL_FONT) + LABEL_PADDING
}

// Computed: which labels to show based on container width
const visibleLabelsData = computed(() => {
  const labels = props.labels
  const width = containerWidth.value

  if (!labels || labels.length === 0) {
    return { visible: [], overflow: [], overflowCount: 0 }
  }

  // Render nothing until the container is measured. Rendering every label
  // first would widen an auto-layout column and flash before collapsing.
  if (!width || width <= 0) {
    return { visible: [], overflow: [], overflowCount: 0 }
  }

  const availableWidth = width - RIGHT_MARGIN.value
  let usedWidth = 0
  const visible = []

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i]
    const labelWidth = estimateLabelWidth(label.name) + (visible.length > 0 ? LABEL_GAP : 0)

    // Check if we need room for overflow badge
    const remainingLabels = labels.length - i - 1
    const needsOverflowBadge = remainingLabels > 0
    const reservedWidth = needsOverflowBadge ? estimateLabelWidth(`+${remainingLabels}`) + LABEL_GAP : 0

    if (usedWidth + labelWidth + reservedWidth <= availableWidth) {
      visible.push(label)
      usedWidth += labelWidth
    }
    else {
      break
    }
  }

  // Always show at least one label if there are any
  if (visible.length === 0 && labels.length > 0) {
    visible.push(labels[0])
  }

  const overflow = labels.slice(visible.length)

  return {
    visible,
    overflow,
    overflowCount: overflow.length,
  }
})

function showPopover(event) {
  // Cancel any pending hide
  if (hideTimeout) {
    clearTimeout(hideTimeout)
    hideTimeout = null
  }
  popoverRef.value?.show(event)
}

function scheduleHide() {
  // Delay hiding to allow mouse to move to popover
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
  <div ref="containerRef" class="labels-row">
    <span
      v-for="label in visibleLabelsData.visible"
      :key="label.labelId"
      :style="{ backgroundColor: normalizeColor(label.color, '#cccccc'), color: getContrastColor(label.color, '#000000', 'var(--color-text-primary)') }"
      class="label-tag"
    >
      <HighlightText :text="label.name" :term="searchTerm" />
    </span>
    <span
      v-if="visibleLabelsData.overflowCount > 0"
      class="label-tag label-overflow"
      @mouseenter="showPopover"
      @mouseleave="scheduleHide"
    >
      +{{ visibleLabelsData.overflowCount }}
    </span>

    <Popover ref="popoverRef">
      <div
        class="overflow-labels-popover"
        @mouseenter="cancelHide"
        @mouseleave="hidePopover"
      >
        <span
          v-for="label in visibleLabelsData.overflow"
          :key="label.labelId"
          :style="{ backgroundColor: normalizeColor(label.color, '#cccccc'), color: getContrastColor(label.color, '#000000', 'var(--color-text-primary)') }"
          class="label-tag"
        >
          <HighlightText :text="label.name" :term="searchTerm" />
        </span>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
/* inline-size containment keeps the rendered chips from feeding back into an
   auto-layout column's width, so the row is sized by its cell, not the
   reverse. */
.labels-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.25rem;
  align-items: center;
  contain: inline-size;
}

.label-tag {
  display: inline-block;
  font-size: var(--text-md);
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 6px;
  white-space: nowrap;
}

.label-overflow {
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  cursor: pointer;
}

.overflow-labels-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 250px;
}
</style>
