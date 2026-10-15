<script setup>
import { computed } from 'vue'
import { getContrastColor, normalizeColor } from '../../shared/lib/colorUtils.js'
import HighlightText from './HighlightText.vue'

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    default: '',
  },
  searchTerm: {
    type: String,
    default: '',
  },
})

const backgroundColor = computed(() => normalizeColor(props.color, '#cccccc'))
const textColor = computed(() => getContrastColor(backgroundColor.value, '#000000', 'var(--color-text-primary)'))
</script>

<template>
  <!-- LabelsRow measures chip width from this padding and font; keep them in sync -->
  <span class="label-tag" :style="{ backgroundColor, color: textColor }">
    <HighlightText :text="props.value" :term="props.searchTerm" />
  </span>
</template>

<style scoped>
.label-tag {
  display: inline-block;
  font-size: var(--text-md);
  font-weight: 600;
  padding: 0.1rem 0.45rem;
  border-radius: 6px;
  white-space: nowrap;
}
</style>
