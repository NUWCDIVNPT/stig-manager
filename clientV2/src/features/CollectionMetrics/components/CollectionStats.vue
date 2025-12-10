<script setup>
import { computed, defineProps, toRefs } from 'vue'
import GenericStatCard from './GenericStatCard.vue'

const props = defineProps({
  metrics: {
    type: Object,
    required: false,
    default: null,
  },
})

const { metrics } = toRefs(props)

function formatAge(days) {
  return `${days} d`
}

const data = computed(() => {
  if (!metrics.value) {
    return null
  }

  const m = metrics.value.metrics || metrics.value
  const root = metrics.value

  const findings = m.findings || { high: 0, medium: 0, low: 0 }

  return {
    inventory: {
      title: 'Inventory',
      stats: [
        { label: 'Assets', value: root.assetCount || m.assetCount || 0, color: 'var(--color-inventory)' },
        { label: 'STIGs', value: root.stigCount || m.stigCount || 0, color: 'var(--color-inventory)' },
        { label: 'Checklists', value: root.checklistCount || m.checklistCount || 0, color: 'var(--color-inventory)' },
      ],
      actions: [
        { label: 'Export...', onClick: () => console.log('Export clicked') },
      ],
    },
    findings: {
      title: 'Findings',
      stats: [
        { label: 'CAT 3', value: findings.low || 0, color: 'var(--color-cat3)' },
        { label: 'CAT 2', value: findings.medium || 0, color: 'var(--color-cat2)' },
        { label: 'CAT 1', value: findings.high || 0, color: 'var(--color-cat1)' },
      ],
      actions: [
        { label: 'Details', onClick: () => console.log('Details clicked') },
      ],
    },
    ages: {
      title: 'Review Ages',
      stats: [
        { label: 'Oldest', value: formatAge(m.minMsgAge || 0), color: 'var(--color-review-age)' },
        { label: 'Newest', value: formatAge(m.maxMsgAge || 0), color: 'var(--color-review-age)' },
        { label: 'Updated', value: formatAge(m.lastUpdatedAge || 0), color: 'var(--color-review-age)' },
      ],
    },
  }
})
</script>

<template>
  <div v-if="data" class="stats-card">
    <GenericStatCard
      :title="data.inventory.title"
      :stats="data.inventory.stats"
      :actions="data.inventory.actions"
    />
    <GenericStatCard
      :title="data.findings.title"
      :stats="data.findings.stats"
      :actions="data.findings.actions"
    />
    <GenericStatCard
      :title="data.ages.title"
      :stats="data.ages.stats"
      :border-bottom="false"
    />
  </div>
</template>

<style scoped>
.stats-card {
  background-color: #18181b;
  color: #e4e4e7;
  border-radius: 20px;
  padding: 15px;
  width: 100%;
  max-width: 400px;
  min-width: 320px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>
