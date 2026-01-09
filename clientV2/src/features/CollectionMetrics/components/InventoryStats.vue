<script setup>
import { computed, defineProps, toRefs } from 'vue'

const props = defineProps({
  inventory: {
    type: Object,
    required: false,
    default: () => ({ assets: 0, stigs: 0, checklists: 0 }),
  },
})

defineEmits(['export'])

const { inventory } = toRefs(props)

const data = computed(() => {
  if (!inventory.value) {
    return null
  }
  return [
    { label: 'Assets', value: inventory.value.assets || 0 },
    { label: 'STIGs', value: inventory.value.stigs || 0 },
    { label: 'Checklists', value: inventory.value.checklists || 0 },
  ]
})
</script>

<template>
  <div v-if="data" class="metric-card">
    <div class="metric-header">
      <h3 class="metric-title">
        Inventory
      </h3>
      <div class="metric-actions">
        <span class="metric-action-link" @click="$emit('export')">Export...</span>
      </div>
    </div>
    <div class="metric-badge-row">
      <div
        v-for="(stat, index) in data"
        :key="index"
        class="metric-badge"
        :style="{ backgroundColor: 'var(--color-inventory)' }"
      >
        <span class="metric-badge-label">{{ stat.label }}</span>
        <span class="metric-badge-value">{{ stat.value }}</span>
      </div>
    </div>
  </div>
  <div v-else class="metric-card">
    <div class="metric-header">
      <h3 class="metric-title">
        Inventory
      </h3>
      <div class="metric-actions">
        <span class="metric-action-link" @click="$emit('export')">Export...</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './metrics.css';
</style>
