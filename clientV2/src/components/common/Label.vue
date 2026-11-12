<script setup>
import { computed } from 'vue'
import { labelChipStyle } from '../../shared/lib/colorUtils.js'
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

const style = computed(() => labelChipStyle(props.color))
</script>

<template>
  <!-- .label-tag is global (style.css) -->
  <span class="label-tag" :style="style">
    <HighlightText :text="value" :term="searchTerm" />
  </span>
</template>
