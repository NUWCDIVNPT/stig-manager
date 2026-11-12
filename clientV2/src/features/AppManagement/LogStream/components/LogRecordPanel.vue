<script setup>
import { computed } from 'vue'
import JsonTree from '../../../../components/common/JsonTree.vue'

// East panel: the selected log record as an expandable JSON tree.
const props = defineProps({
  record: { type: Object, default: null },
})

// Legacy auto-expand: open `data`, and for a transaction its immediate
// children too (request/response/operationStats).
const defaultExpanded = computed(() =>
  [props.record?.type === 'transaction' ? ['data', '*'] : ['data']],
)
</script>

<template>
  <div class="log-record-panel">
    <div class="log-record-header">
      <i class="pi pi-sitemap" />
      <span>JSON Tree</span>
    </div>
    <div class="log-record-body">
      <div v-if="!record || !Object.keys(record).length" class="log-record-empty">
        <i class="pi pi-info-circle" />
        Select a log record
      </div>
      <JsonTree v-else :value="record" :default-expanded="defaultExpanded" />
    </div>
  </div>
</template>

<style scoped>
/* Background/border/radius come from the parent's .ls-card. */
.log-record-panel {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Matches the Service Jobs feature's .panel-title header bars; the taller
   vertical padding lines this bar up with the viewer toolbar's height. */
.log-record-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.85rem 0.75rem;
  font-size: var(--text-md);
  font-weight: 700;
  color: var(--color-text-bright);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
  flex-shrink: 0;
}

/* The scrolling body, on the same surface as the transactions table rows. */
.log-record-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--p-datatable-row-background);
  font-family: var(--font-mono);
}

.log-record-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  color: var(--color-text-dim);
  font-size: var(--text-md);
}
</style>
