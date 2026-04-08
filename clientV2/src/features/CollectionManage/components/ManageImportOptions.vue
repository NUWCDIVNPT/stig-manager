<script setup>
defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})
</script>

<template>
  <div class="manage-stub">
    <p>Import Options: auto-status per result, unreviewed rules, empty field handling</p>
    <p class="manage-stub-id">Collection {{ collectionId }}</p>
  </div>
</template>

<style scoped>
.manage-stub {
  color: var(--color-text-dim);
}

.manage-stub-id {
  margin-top: 0.5rem;
  color: var(--color-text-muted);
}
</style>
