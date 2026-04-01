<script setup>
import { formatReviewDate } from '../../../shared/lib/reviewFormUtils.js'

defineProps({
  currentReview: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <div class="status-text-content sm-scrollbar-thin">
    <div v-if="currentReview?.status?.text" class="status-card">
      <div class="status-card__header">
        <div class="status-card__author">
          <i class="pi pi-user status-card__icon" />
          <span class="status-card__username">{{ currentReview.status.user?.username || 'Unknown User' }}</span>
        </div>
        <div v-if="currentReview.status.ts" class="status-card__date">
          <i class="pi pi-clock status-card__icon" />
          <span>{{ formatReviewDate(currentReview.status.ts) }}</span>
        </div>
      </div>
      <div class="status-card__body">
        {{ currentReview.status.text }}
      </div>
    </div>
    <div v-else class="status-text__empty">
      <i class="pi pi-info-circle" />
      <span>No status text has been provided.</span>
    </div>
  </div>
</template>

<style scoped>
.status-text-content {
  padding: 1.5rem;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-dark);
}

.status-card {
  background: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-left: 3px solid var(--color-primary-highlight);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.status-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid var(--color-border-light);
}

.status-card__author, .status-card__date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--color-text-dim);
}

.status-card__username {
  font-weight: 700;
  color: var(--color-text-bright);
}

.status-card__icon {
  font-size: 0.8rem;
  opacity: 0.7;
}

.status-card__body {
  padding: 1rem;
  color: var(--color-text-primary);
  font-size: 1.15rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.status-text__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--color-text-dim);
  font-style: italic;
  font-size: 1.1rem;
  opacity: 0.6;
}

.status-text__empty .pi {
  font-size: 1.5rem;
}
</style>
