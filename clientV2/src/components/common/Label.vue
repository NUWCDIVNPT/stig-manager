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

const backgroundColor = computed(() => normalizeColor(props.color))
const textColor = computed(() => getContrastColor(backgroundColor.value, 'var(--color-text-dark)', 'var(--color-text-primary)'))
</script>

<template>
  <!-- .label-tag is global (style.css) -->
  <span class="label-tag" :style="{ backgroundColor, color: textColor }">
    <HighlightText :text="value" :term="searchTerm" />
  </span>
</template>
