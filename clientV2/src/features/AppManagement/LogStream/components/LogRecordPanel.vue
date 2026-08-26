<script setup>
import Tree from 'primevue/tree'
import { ref, watch } from 'vue'
import {
  buildChildNodes,
  buildJsonTreeNodes,
  leafDisplay,
  sizeBadge,
} from '../../Appinfo/lib/adapters/jsonTreeNodes.js'

// East panel: the selected log record as an expandable JSON tree. Reuses the
// AppInfo JSON-tree adapter/Tree; the only bespoke bit is the legacy auto-expand
// (open `data`, and for a transaction its immediate children too).
const props = defineProps({
  record: { type: Object, default: null },
})

const nodes = ref([])
const expandedKeys = ref({})

watch(() => props.record, (record) => {
  if (!record) {
    nodes.value = []
    expandedKeys.value = {}
    return
  }
  nodes.value = buildJsonTreeNodes(record)
  expandedKeys.value = computeExpanded(record, nodes.value)
}, { immediate: true })

function computeExpanded(record, topNodes) {
  const keys = {}
  const dataNode = topNodes.find(node => node.label === 'data')
  if (dataNode && !dataNode.leaf) {
    keys[dataNode.key] = true
    // A transaction's data holds request/response/operationStats — the legacy
    // panel opened all of them one level down.
    if (record.type === 'transaction') {
      for (const child of buildChildNodes(dataNode)) {
        if (!child.leaf) {
          keys[child.key] = true
        }
      }
    }
  }
  return keys
}

function onNodeExpand(node) {
  buildChildNodes(node)
}

const treePt = {
  root: { style: 'background: transparent; border: none; padding: 0.25rem 0; color: var(--color-text-primary); overflow: auto; flex: 1 1 auto; min-height: 0;' },
  nodeContent: { style: 'padding: 0.1rem 0.25rem; background: transparent; color: var(--color-text-primary);' },
  nodeLabel: { style: 'font-size: 1rem;' },
  nodeToggleButton: { style: 'width: 1.5rem; height: 1.5rem; color: var(--color-text-dim);' },
}
</script>

<template>
  <div class="log-record-panel">
    <div class="log-record-header">
      <i class="pi pi-sitemap" />
      <span>JSON Tree</span>
    </div>
    <div class="log-record-body">
      <div v-if="!nodes.length" class="log-record-empty">
        <i class="pi pi-info-circle" />
        Select a log record
      </div>
      <Tree
        v-else
        v-model:expanded-keys="expandedKeys"
        :value="nodes"
        :pt="treePt"
        @node-expand="onNodeExpand"
      >
        <template #default="{ node }">
          <span class="json-line">
            <span class="json-key">{{ node.label }}</span>
            <span v-if="sizeBadge(node.data)" class="json-size">{{ sizeBadge(node.data) }}</span>
            <template v-else>
              <span class="json-separator">:</span>
              <span class="json-value" :class="`json-${node.data.type}`">{{ leafDisplay(node.data) }}</span>
            </template>
          </span>
        </template>
      </Tree>
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
  font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
}

/* Matches the Service Jobs feature's .panel-title header bars; the taller
   vertical padding lines this bar up with the viewer toolbar's height. */
.log-record-header {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.85rem 0.75rem;
  font-size: 1.05rem;
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
}

.log-record-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  color: var(--color-text-dim);
  font-size: 1rem;
}

.json-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: inherit;
}

.json-key {
  color: var(--color-text-bright);
}

.json-size {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.json-separator {
  color: var(--color-text-dim);
}

.json-value {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.json-string {
  color: var(--color-success);
}

.json-number {
  color: var(--color-action-blue);
}

.json-boolean {
  color: var(--color-warning-yellow);
}

.json-null,
.json-undefined,
.json-object,
.json-array {
  color: var(--color-text-dim);
}
</style>
