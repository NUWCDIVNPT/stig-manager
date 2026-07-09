<script setup>
import Tree from 'primevue/tree'
import { computed, ref, watch } from 'vue'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
import { TOOLTIPS } from '../../../../shared/lib/tooltips.js'
import { formatDateTime, transformLastClaims } from '../lib/userDisplay.js'
// TODO get a real tree json tools
// Read-only diagnostic view of statistics.lastClaims — the claims presented
// at the user's most recent authentication.
const props = defineProps({
  lastClaims: {
    type: Object,
    default: null,
  },
})

const claims = computed(() => transformLastClaims(props.lastClaims))
const hasClaims = computed(() => Object.keys(claims.value).length > 0)

function leafText(value) {
  if (value instanceof Date) {
    return formatDateTime(value)
  }
  return String(value)
}

// The claims schema is open-ended, so values may be scalars, arrays, or
// nested objects. Array items render as their own child nodes.
function entryNode(label, value, path) {
  if (Array.isArray(value)) {
    return {
      key: path,
      label,
      children: value.map((item, index) => entryNode(
        typeof item === 'object' && item !== null && !(item instanceof Date) ? String(index) : null,
        item,
        `${path}.${index}`,
      )),
    }
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    return {
      key: path,
      label,
      children: Object.entries(value).map(([childKey, childValue]) =>
        entryNode(childKey, childValue, `${path}.${childKey}`)),
    }
  }
  return {
    key: path,
    label: label === null ? leafText(value) : `${label}: ${leafText(value)}`,
    leaf: true,
  }
}

const nodes = computed(() =>
  Object.entries(claims.value).map(([key, value]) => entryNode(key, value, key)),
)

// Expand everything by default whenever the claims change.
const expandedKeys = ref({})
watch(nodes, (list) => {
  const keys = {}
  const walk = (node) => {
    if (node.children?.length) {
      keys[node.key] = true
      node.children.forEach(walk)
    }
  }
  list.forEach(walk)
  expandedKeys.value = keys
}, { immediate: true })

const treePt = {
  root: { style: 'background: transparent; border: none; padding: 0.25rem 0; color: var(--color-text-primary); overflow: auto; flex: 1 1 auto; min-height: 0;' },
  nodeContent: { style: 'padding: 0.1rem 0.25rem; background: transparent; color: var(--color-text-primary);' },
  nodeLabel: { style: 'font-size: 1rem;' },
  nodeToggleButton: { style: 'width: 1.5rem; height: 1.5rem; color: var(--color-text-dim);' },
}
</script>

<template>
  <div class="last-claims">
    <div class="claims-header">
      Last Authentication Claims
      <HelpIcon :content="TOOLTIPS.lastClaims.html" icon="pi pi-info-circle" />
    </div>
    <div v-if="!hasClaims" class="no-claims">
      <i class="pi pi-info-circle" />
      No claims have been presented.
    </div>
    <Tree
      v-else
      v-model:expanded-keys="expandedKeys"
      :value="nodes"
      :pt="treePt"
    />
  </div>
</template>

<style scoped>
.last-claims {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border-default);
  border-radius: 6px;
  overflow: hidden;
  background: var(--color-background-light);
}

.claims-header {
  display: flex;
  align-items: center;
  padding: 0.6rem 0.85rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  background: var(--color-background-subtle);
  border-bottom: 1px solid var(--color-border-default);
}

.no-claims {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.85rem 1rem;
  color: var(--color-text-dim);
  font-size: 1rem;
}
</style>
