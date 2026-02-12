<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: {
    type: String,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
})
const getTextColorFromBackground = (hexcolor) => {
  const r = Number.parseInt(hexcolor.substr(0, 2), 16)
  const g = Number.parseInt(hexcolor.substr(2, 2), 16)
  const b = Number.parseInt(hexcolor.substr(4, 2), 16)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  return (yiq >= 128) ? '#080808' : '#f7f7f7'
}

const textColor = computed(() => {
  return getTextColorFromBackground(props.color.replace('#', ''))
})
</script>

<template>
  <span
    class="sm-label-sprite"
    :style="{
      backgroundColor: props.color,
      color: textColor,
    }"
  >
    {{ props.value }}
  </span>
</template>

<style scoped>
.sm-label-sprite {
  font-weight: 600;
  font-size: 0.9rem;
  line-height: 14px;
  top: 0;
  padding: 0 5px;
  border-radius: 3px;
  margin-left: 3px;
  white-space: nowrap
}
</style>
