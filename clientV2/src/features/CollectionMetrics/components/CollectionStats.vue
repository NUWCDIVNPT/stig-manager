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

function formatAge(dateString) {
  if (!dateString) {
    return '0 d'
  }
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return `${diffDays} d`
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
        { label: 'Assets', value: root.assets || m.assets || 0, color: 'var(--color-inventory)' },
        { label: 'STIGs', value: root.stigs || m.stigs || 0, color: 'var(--color-inventory)' },
        { label: 'Checklists', value: root.checklists || m.checklists || 0, color: 'var(--color-inventory)' },
      ],
      actions: [
        { label: 'Export...', onClick: () => console.log('Export clicked') }, // Keeping action but no op or could remove
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
        { label: 'Oldest', value: formatAge(m.minTs || 0), color: 'var(--color-review-age)' },
        { label: 'Newest', value: formatAge(m.maxTs || 0), color: 'var(--color-review-age)' },
        { label: 'Updated', value: formatAge(m.maxTouchTs || 0), color: 'var(--color-review-age)' },
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
