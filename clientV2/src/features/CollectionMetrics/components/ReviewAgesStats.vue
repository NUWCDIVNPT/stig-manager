<script setup>
import { computed, defineProps, toRefs } from 'vue'
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
  return [
    { label: 'Oldest', value: formatAge(ages.value.minTs), color: 'var(--color-review-age)' },
    { label: 'Newest', value: formatAge(ages.value.maxTs), color: 'var(--color-review-age)' },
    { label: 'Updated', value: formatAge(ages.value.maxTouchTs), color: 'var(--color-review-age)' },
  ]
})
</script>

<template>
  <div v-if="data" class="stat-card">
    <div class="header">
      <h3 class="title">
        Review Ages
      </h3>
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
