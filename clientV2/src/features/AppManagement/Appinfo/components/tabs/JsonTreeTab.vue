<script setup>
import JsonTree from '../../../../../components/common/JsonTree.vue'

defineProps({
  report: { type: Object, default: null },
})
</script>

<template>
  <div class="json-tree-tab">
    <div v-if="!report || !Object.keys(report).length" class="json-tree-empty">
      <i class="pi pi-info-circle" />
      No report is loaded.
    </div>
    <JsonTree v-else :value="report" />
  </div>
</template>

<style scoped>
.json-tree-tab {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.25rem 0.5rem;
  font-family: var(--font-mono);
}

.json-tree-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  color: var(--color-text-dim);
  font-size: var(--text-md);
}
</style>
