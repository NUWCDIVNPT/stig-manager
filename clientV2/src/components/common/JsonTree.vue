<script setup>
import Tree from 'primevue/tree'
import { ref, watch } from 'vue'
import {
  buildChildNodes,
  buildJsonTreeNodes,
  expandPaths,
  leafDisplay,
  sizeBadge,
} from '../../shared/lib/jsonTreeNodes.js'

// Collapsible tree view of an object or array. Renders nothing for an empty value,
// so the caller owns the empty state.
const props = defineProps({
  value: { type: Object, default: null },
  // Paths to open whenever `value` changes; see expandPaths
  defaultExpanded: { type: Array, default: () => [] },
})

const nodes = ref([])
const expandedKeys = ref({})

watch(() => props.value, (value) => {
  // Expand before the nodes become reactive
  const built = buildJsonTreeNodes(value)
  expandedKeys.value = expandPaths(built, props.defaultExpanded)
  nodes.value = built
}, { immediate: true })

const treePt = {
  root: { style: 'background: transparent; border: none; padding: 0.25rem 0; color: var(--color-text-primary); overflow: auto; flex: 1 1 auto; min-height: 0; font-family: var(--font-mono);' },
  nodeContent: { style: 'padding: 0.1rem 0.25rem; background: transparent; color: var(--color-text-primary);' },
  nodeLabel: { style: 'font-size: var(--text-md);' },
  nodeToggleButton: { style: 'width: 1.5rem; height: 1.5rem; color: var(--color-text-dim);' },
}
</script>

<template>
  <Tree
    v-if="nodes.length"
    v-model:expanded-keys="expandedKeys"
    :value="nodes"
    :pt="treePt"
    @node-expand="buildChildNodes"
  >
    <template #default="{ node }">
      <span class="json-line">
        <span class="json-key">{{ node.label }}</span>
        <span v-if="!node.leaf" class="json-size">{{ sizeBadge(node.data) }}</span>
        <template v-else>
          <span class="json-separator">:</span>
          <span class="json-value" :class="`json-${node.data.type}`">{{ leafDisplay(node.data) }}</span>
        </template>
      </span>
    </template>
  </Tree>
</template>

<style scoped>
.json-line {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  font-family: inherit;
}

.json-key {
  color: var(--color-text-bright);
}

.json-size,
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
