<script setup>
import { ref } from 'vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

// eslint-disable-next-line unused-imports/no-unused-vars
const emit = defineEmits(['imported'])
</script>

<template>
  <div class="manage-stub">
    <p>Import Options: configure auto-status, unreviewed rules, and empty field handling</p>
    <p class="manage-stub-id">
      Collection {{ collectionId }}
    </p>
  </div>
</template>

<style scoped>
.manage-import-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-action {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
</style>
