<script setup>
defineProps({
  currentReview: {
    type: Object,
    default: null,
  },
})
</script>

<template>
  <div class="review-resources">
    <div class="review-resources__header">
      <span class="review-resources__title">Review Resources</span>
    </div>
    <div class="review-resources__content">
      <p class="review-resources__placeholder">
        History, Other Assets, Attachments, and Status Text tabs will be implemented in a future phase.
      </p>
    </div>
  </div>
</template>

<style scoped>
.review-resources {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.review-resources__header {
  display: flex;
  align-items: center;
  padding: 0.4rem 0.6rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.review-resources__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.review-resources__content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.review-resources__placeholder {
  color: var(--color-text-dim);
  text-align: center;
}
</style>
