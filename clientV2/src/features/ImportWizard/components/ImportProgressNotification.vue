<script setup>
import { computed } from 'vue'
import NotificationCard from '../../../components/global/NotificationCard.vue'

const props = defineProps({
  state: { type: Object, required: true },
})

defineEmits(['dismiss'])

const progressPct = computed(() => {
  if (!props.state.totalCount) return 0
  return Math.round((props.state.completedCount / props.state.totalCount) * 100)
})
</script>

<template>
  <NotificationCard @dismiss="$emit('dismiss')">
    <template #header>
      <span v-if="!state.isDone" class="pi pi-spin pi-spinner header-icon" />
      <span v-else class="pi pi-check-circle header-icon header-icon--done" />
      <span class="header-title">{{ state.isDone ? 'Import Complete' : 'Importing…' }}</span>
    </template>
    <template v-if="!state.isDone" #close>
      <!-- hide close button while in progress -->
    </template>

    <template v-if="!state.isDone">
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: progressPct + '%' }" />
      </div>
      <div class="progress-meta">
        <span class="meta-count">{{ state.completedCount }} / {{ state.totalCount }}</span>
        <span class="meta-text">{{ state.progressText }}</span>
      </div>
    </template>
    <div v-else class="progress-meta">
      <span class="meta-count">{{ state.totalCount }} asset{{ state.totalCount !== 1 ? 's' : '' }} processed</span>
    </div>
  </NotificationCard>
</template>

<style scoped>
.header-icon {
  font-size: 1.25rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.header-icon--done {
  color: #22c55e;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
}

.progress-track {
  height: 4px;
  background: var(--color-border-default);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #2563eb;
  border-radius: 2px;
  transition: width 0.2s ease;
}

.progress-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.meta-count {
  font-size: 1.05rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.meta-text {
  font-size: 1.05rem;
  color: var(--color-text-dim);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
