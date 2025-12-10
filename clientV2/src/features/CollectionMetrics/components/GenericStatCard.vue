<script setup>
import { defineProps } from 'vue'

defineProps({
  title: {
    type: String,
    required: true,
  },
  stats: {
    type: Array,
    required: true,
    // Expected structure: [{ label: 'Assets', value: 10, color: '#abcdef' }]
  },
  actions: {
    type: Array,
    default: () => [],
    // Expected structure: [{ label: 'Export', onClick: () => {} }]
  },
  borderBottom: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div class="section" :class="{ 'border-none': !borderBottom }">
    <div class="section-header">
      <h3 class="title">
        {{ title }}
      </h3>
      <div v-if="actions.length" class="actions">
        <span
          v-for="(action, index) in actions"
          :key="index"
          class="action-link"
          @click="action.onClick && action.onClick()"
        >
          {{ action.label }}
        </span>
      </div>
    </div>
    <div class="badge-row">
      <div
        v-for="(stat, index) in stats"
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
.section {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.section.border-none {
  border-bottom: none;
  padding-bottom: 0;
}

.section-header {
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
