<script setup>
import { computed, toRefs } from 'vue'
import { formatAge } from '../../../shared/lib.js'

const props = defineProps({
  ages: {
    type: Object,
    required: false,
    default: () => ({ minTs: null, maxTs: null, maxTouchTs: null }),
  },
})

const { ages } = toRefs(props)

const data = computed(() => {
  if (!ages.value) {
    return null
  }
  return [
    { label: 'Oldest', value: formatAge(ages.value.minTs), color: 'var(--color-review-age)' },
    { label: 'Newest', value: formatAge(ages.value.maxTs), color: 'var(--color-review-age)' },
    { label: 'Updated', value: formatAge(ages.value.maxTouchTs), color: 'var(--color-review-age)' },
  ]
})
</script>

<template>
  <div v-if="data" class="metric-card">
    <div class="metric-header">
      <h3 class="metric-title">
        Review Ages
      </h3>
    </div>
    <div class="metric-badge-row">
      <div
        v-for="(stat, index) in data"
        :key="index"
        class="metric-badge"
        :style="{ backgroundColor: stat.color }"
      >
        <span class="metric-badge-label dark-text">{{ stat.label }}</span>
        <span class="metric-badge-value dark-text">{{ stat.value }}</span>
      </div>
    </div>
  </div>
  <div v-else class="metric-card">
    <div class="metric-header">
      <h3 class="metric-title">
        Review Ages
      </h3>
    </div>
  </div>
</template>

<style scoped>
@import './metrics.css';
</style>
