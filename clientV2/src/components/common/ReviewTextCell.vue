<script setup>
import { computed } from 'vue'
import { compactCellText } from '../../shared/lib/cellText.js'
import HighlightText from './HighlightText.vue'

// A review's Detail or Comment in a density grid: clamped to the grid's line
// count, keeping the author's line breaks and indentation. The tooltip carries
// the text as entered. The grid root must bind useGridDensity's gridStyle,
// which supplies the clamp, the text size and the single-line flow. The
// cell-text class is a hook for the grid's own rules: its text colour, and
// any row-state colour such as the row being edited.
const props = defineProps({
  text: {
    type: String,
    default: '',
  },
  // Grid search term; matches are highlighted
  term: {
    type: String,
    default: '',
  },
  // Shown dimmed when there is no text; nothing is shown without it
  placeholder: {
    type: String,
    default: '',
  },
})

const displayText = computed(() => compactCellText(props.text))
</script>

<template>
  <span v-if="displayText || !placeholder" class="cell-text review-text-cell" :title="text">
    <HighlightText :text="displayText" :term="term" />
  </span>
  <span v-else class="cell-text review-text-cell__placeholder">{{ placeholder }}</span>
</template>

<style scoped>
.review-text-cell {
  display: -webkit-box;
  line-clamp: var(--line-clamp, 1);
  -webkit-line-clamp: var(--line-clamp, 1);
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  font-size: var(--cell-font-size);
  line-height: var(--cell-line-height, 1.3);
  /* line breaks are kept, except at a clamp of one line; see useGridDensity */
  white-space: var(--cell-multiline-white-space, normal);
  overflow-wrap: anywhere;
  word-break: break-word;
}

/* With cell-text, to outrank the grid's own cell-text colour whatever order
   the stylesheets load in */
.cell-text.review-text-cell__placeholder {
  font-size: var(--cell-font-size);
  line-height: var(--cell-line-height, 1.3);
  color: var(--color-text-dim);
  font-style: italic;
  opacity: 0.5;
}
</style>
