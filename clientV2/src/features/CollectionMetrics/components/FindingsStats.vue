<script setup>
import { computed, defineProps, toRefs } from 'vue'

const props = defineProps({
  findings: {
    type: Object,
    required: false,
    default: () => ({ high: 0, medium: 0, low: 0 }),
  },
})

const { findings } = toRefs(props)

const data = computed(() => {
  if (!findings.value) {
    return null
  }
  return [
    { label: 'CAT 3', value: findings.value.low || 0, color: 'var(--color-cat3)' },
    { label: 'CAT 2', value: findings.value.medium || 0, color: 'var(--color-cat2)' },
    { label: 'CAT 1', value: findings.value.high || 0, color: 'var(--color-cat1)' },
  ]
})
</script>

<template>
  <div v-if="data" class="metric-card">
    <div class="metric-header">
      <h3 class="metric-title">
        Findings
      </h3>
      <div class="metric-actions">
        <span class="metric-action-link" @click="console.log('Details clicked')">Details</span>
      </div>
    </div>
    <div class="metric-badge-row">
      <div
        v-for="(stat, index) in data"
        :key="index"
        class="metric-badge"
        :style="{ backgroundColor: stat.color }"
      >
        <span class="metric-badge-label">{{ stat.label }}</span>
        <span class="metric-badge-value">{{ stat.value }}</span>
      </div>
    </div>
  </div>
  <div v-else class="metric-card">
    <div class="metric-header">
      <h3 class="metric-title">
        Findings
      </h3>
      <div class="metric-actions">
        <span class="metric-action-link" @click="console.log('Details clicked')">Details</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './metrics.css';
</style>
