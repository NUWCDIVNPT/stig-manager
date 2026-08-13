<script setup>
import Tree from 'primevue/tree'
import { ref, watch } from 'vue'
import {
  buildChildNodes,
  buildJsonTreeNodes,
  leafDisplay,
  sizeBadge,
} from '../../lib/adapters/jsonTreeNodes.js'

const props = defineProps({
  report: { type: Object, default: null },
})

const nodes = ref([])
const expandedKeys = ref({})

watch(() => props.report, (report) => {
  nodes.value = buildJsonTreeNodes(report)
  expandedKeys.value = {}
}, { immediate: true })

// Children are materialized only when a node is first expanded
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
  <div class="json-tree-tab">
    <div v-if="!nodes.length" class="json-tree-empty">
      <i class="pi pi-info-circle" />
      No report is loaded.
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
</template>

<style scoped>
.json-tree-tab {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0.25rem 0.5rem;
  font-family: 'SF Mono', 'JetBrains Mono', ui-monospace, monospace;
}

.json-tree-empty {
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
