<script setup>
import Popover from 'primevue/popover'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { getContrastColor, normalizeColor } from '../../shared/lib/colorUtils.js'
import { rootFontSizePx } from '../../shared/lib/remToPx.js'

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
})

const popoverRef = ref()
let hideTimeout = null

// Label width estimate, in px derived from rem so it tracks the root font-size
// along with the chip CSS below (0.9rem text, 0.45rem side padding, 0.25rem
// gap). Tighter values when compact.
const root = rootFontSizePx()
const CHAR_WIDTH = computed(() => (props.compact ? 0.5 : 0.6) * root)
const LABEL_PADDING = computed(() => (props.compact ? 0.9 : 1.1) * root)
const LABEL_GAP = 0.25 * root
const OVERFLOW_BADGE_WIDTH = 0.75 * root
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

// Estimate the width of a label based on its text
function estimateLabelWidth(text) {
  return (String(text).length * CHAR_WIDTH.value) + LABEL_PADDING.value
}

// Computed: which labels to show based on container width
const visibleLabelsData = computed(() => {
  const labels = props.labels
  const width = containerWidth.value

  if (!labels || labels.length === 0) {
    return { visible: [], overflow: [], overflowCount: 0 }
  }

  // If we don't have width yet, show all (will recalculate after mount)
  if (!width || width <= 0) {
    return { visible: labels, overflow: [], overflowCount: 0 }
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
    const reservedWidth = needsOverflowBadge ? OVERFLOW_BADGE_WIDTH + LABEL_GAP : 0

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
      {{ label.name }}
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
          {{ label.name }}
        </span>
      </div>
    </Popover>
  </div>
</template>

<style scoped>
.labels-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.25rem;
  align-items: center;
}

.label-tag {
  display: inline-block;
  font-size: 0.9rem;
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
