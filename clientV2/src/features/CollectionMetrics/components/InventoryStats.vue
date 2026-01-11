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
  return [
    { label: 'Assets', value: inventory.value.assets || 0, color: 'var(--color-inventory)' },
    { label: 'STIGs', value: inventory.value.stigs || 0, color: 'var(--color-inventory)' },
    { label: 'Checklists', value: inventory.value.checklists || 0, color: 'var(--color-inventory)' },
  ]
})
</script>

<template>
  <div v-if="data" class="stat-card">
    <div class="header">
      <h3 class="title">
        Inventory
      </h3>
      <div class="actions">
        <span class="action-link" @click="$emit('export')">Export...</span>
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
  font-size: 16px;
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
