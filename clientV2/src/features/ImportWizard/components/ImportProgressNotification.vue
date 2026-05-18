<script setup>
import { computed } from 'vue'
import NotificationCard from '../../../components/global/NotificationCard.vue'
import { useImportProgressStore } from '../../../shared/stores/importProgressStore.js'

const props = defineProps({
  state: { type: Object, required: true },
})

defineEmits(['dismiss'])

const progressStore = useImportProgressStore()

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
    <template v-else>
      <div class="progress-meta">
        <span class="meta-count">{{ state.totalCount }} asset{{ state.totalCount !== 1 ? 's' : '' }} processed</span>
      </div>
      <button class="view-results-btn" @click="progressStore.requestViewResults()">
        <span class="pi pi-external-link" />
        View Results
      </button>
    </template>
  </NotificationCard>
</template>

<style scoped>
.header-icon {
  font-size: 1.25rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
}

.header-icon--done {
  color: var(--color-success);
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
  background: var(--color-action-blue-dark);
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

.view-results-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  margin-top: 0.25rem;
  padding: 0.35rem 0.75rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-action-blue);
  background: color-mix(in srgb, var(--color-action-blue-dark) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 35%, transparent);
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
  align-self: flex-start;
}
.view-results-btn:hover {
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  color: var(--color-primary-highlight);
}
</style>
