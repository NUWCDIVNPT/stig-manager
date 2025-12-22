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
  return [
    { label: 'CAT 3', value: findings.value.low || 0, color: 'var(--color-cat3)' },
    { label: 'CAT 2', value: findings.value.medium || 0, color: 'var(--color-cat2)' },
    { label: 'CAT 1', value: findings.value.high || 0, color: 'var(--color-cat1)' },
  ]
})
</script>

<template>
  <div v-if="data" class="stat-card">
    <div class="header">
      <h3 class="title">
        Findings
      </h3>
      <div class="actions">
        <span class="action-link" @click="console.log('Details clicked')">Details</span>
      </div>
    </div>
    <div class="badge-row">
      <div
        v-for="(stat, index) in data"
        :key="index"
        class="stat-badge"
        :style="{ backgroundColor: stat.color }"
      >
        <span class="badge-label">{{ stat.label }}</span>
        <span class="badge-value">{{ stat.value }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stat-card {
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

.header {
  display: flex;
  align-items: center;
}

.title {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
  color: #e4e4e7;
  flex: 1;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-link {
  font-size: 12px;
  color: #71717a;
  cursor: pointer;
  font-weight: 500;
}
.action-link:hover {
  color: #a1a1aa;
}

.badge-row {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.stat-badge {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 4px;
  border-radius: 8px;
  min-width: 80px;
}

.badge-label {
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.8);
}

.badge-value {
  font-size: 18px;
  color: rgba(0, 0, 0, 0.9);
  line-height: 1.1;
  font-weight: 700;
}
</style>
