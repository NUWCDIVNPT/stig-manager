<script setup>
import VirtualScroller from 'primevue/virtualscroller'
import { computed, reactive, watch } from 'vue'
import shieldIcon from '../../../../assets/shield-green-check.svg'
import targetIcon from '../../../../assets/target.svg'
import { formatPercent } from '../../../../shared/lib.js'
import {
  toggleBranchSelection,
  toggleLeafSelection,
  toggleRootSelection,
} from '../exportResultsLogic.js'

/**
 * Virtualized, three-level selection tree (root → branch → leaf) used by the
 * export modals. Rendering and tri-state checkbox propagation are structural
 * (depth-based), so it serves both pivots:
 *   - asset-pivot: branch = asset, leaf = STIG (branch children lazy-loaded)
 *   - STIG-pivot:  branch = STIG,  leaf = asset (eager)
 *
 * Node shape: { key, label, leaf, children, data: { type, acceptedPct, title } }
 * `data.type` ('asset' | 'stig') drives the per-node icon; the root uses `rootIcon`.
 */
const props = defineProps({
  /** Tree nodes — a single root node with branch children. */
  nodes: { type: Array, required: true },
  /** PrimeVue-style selection map: { [key]: { checked, partialChecked } }. */
  selectionKeys: { type: Object, required: true },
  /** Set of branch keys currently loading children (shows a spinner). */
  loadingKeys: { type: Object, default: () => new Set() },
  /** Icon source for the root row (matches the branch level's icon). */
  rootIcon: { type: String, default: shieldIcon },
  /** Show a `· N` child-count next to branch labels (eager pivots only). */
  showChildCount: { type: Boolean, default: false },
})

const emit = defineEmits(['update:selectionKeys', 'node-expand'])

const expandedKeys = reactive(new Set())

// Reset expansion when the tree is rebuilt (e.g. modal reopened).
watch(() => props.nodes, () => expandedKeys.clear())

// Per-node presentation (icon, badge) is static, so it is resolved once here
// rather than per visible row on every VirtualScroller scroll frame.
function nodeIcon(node, role) {
  if (role === 'root') { return props.rootIcon }
  return node.data?.type === 'stig' ? shieldIcon : targetIcon
}

function nodeBadge(node) {
  const pct = node.data?.acceptedPct
  if (pct == null) { return null }
  return {
    class: pct >= 99.5 ? 'badge-complete' : 'badge-incomplete',
    text: formatPercent(pct, 100),
  }
}

const flatRows = computed(() => {
  const rows = []
  const root = props.nodes?.[0]
  if (!root) { return rows }

  rows.push({ role: 'root', key: root.key, node: root, icon: nodeIcon(root, 'root') })

  for (const branch of (root.children ?? [])) {
    const expanded = expandedKeys.has(branch.key)
    rows.push({
      role: 'branch',
      key: branch.key,
      node: branch,
      expanded,
      childCount: branch.children?.length ?? 0,
      icon: nodeIcon(branch, 'branch'),
      badge: nodeBadge(branch),
    })
    if (expanded) {
      for (const leaf of (branch.children ?? [])) {
        rows.push({ role: 'leaf', key: leaf.key, node: leaf, parent: branch, icon: nodeIcon(leaf, 'leaf'), badge: nodeBadge(leaf) })
      }
    }
  }
  return rows
})

function isLoading(key) {
  return props.loadingKeys.has(key)
}

function cbClass(key) {
  return {
    'custom-cb--on': props.selectionKeys[key]?.checked,
    'custom-cb--partial': props.selectionKeys[key]?.partialChecked,
  }
}

function toggleRoot() {
  const root = props.nodes?.[0]
  if (!root) { return }
  emit('update:selectionKeys', toggleRootSelection(root, props.selectionKeys))
}

function toggleBranch(branch) {
  const root = props.nodes?.[0]
  if (!root) { return }
  emit('update:selectionKeys', toggleBranchSelection(root, branch, props.selectionKeys))
}

function toggleLeaf(leaf, branch) {
  const root = props.nodes?.[0]
  if (!root) { return }
  emit('update:selectionKeys', toggleLeafSelection(root, branch, leaf, props.selectionKeys))
}

function toggleExpand(branch) {
  if (expandedKeys.has(branch.key)) {
    expandedKeys.delete(branch.key)
  }
  else {
    expandedKeys.add(branch.key)
    emit('node-expand', branch)
  }
}
</script>

<template>
  <VirtualScroller
    :items="flatRows"
    :item-size="30"
    style="height: 100%; width: 100%;"
  >
    <template #item="{ item: row }">
      <!-- Root row -->
      <div v-if="row.role === 'root'" class="vs-row vs-row--root">
        <div class="custom-cb" :class="cbClass(row.key)" @click.stop="toggleRoot">
          <i v-if="selectionKeys[row.key]?.checked" class="pi pi-check" />
          <i v-else-if="selectionKeys[row.key]?.partialChecked" class="pi pi-minus" />
        </div>
        <img :src="row.icon" class="node-icon" alt="">
        <span class="node-label node-label--bold">{{ row.node.label }}</span>
      </div>

      <!-- Branch row -->
      <div v-else-if="row.role === 'branch'" class="vs-row vs-row--branch">
        <button
          class="expand-btn"
          :aria-label="row.expanded ? 'Collapse' : 'Expand'"
          @click.stop="toggleExpand(row.node)"
        >
          <i :class="row.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
        </button>
        <div class="custom-cb" :class="cbClass(row.key)" @click.stop="toggleBranch(row.node)">
          <i v-if="selectionKeys[row.key]?.checked" class="pi pi-check" />
          <i v-else-if="selectionKeys[row.key]?.partialChecked" class="pi pi-minus" />
        </div>
        <img :src="row.icon" class="node-icon" alt="">
        <div class="row-content">
          <span class="node-label" :title="row.node.data?.title">{{ row.node.label }}</span>
          <span v-if="showChildCount" class="child-count">· {{ row.childCount }}</span>
          <span v-if="isLoading(row.key)" class="node-loading">
            <i class="pi pi-spin pi-spinner" />
          </span>
          <span
            v-if="row.badge"
            class="badge"
            :class="row.badge.class"
            :title="`Accepted ${row.badge.text}`"
          >
            {{ row.badge.text }}
          </span>
        </div>
      </div>

      <!-- Leaf row -->
      <div v-else class="vs-row vs-row--leaf">
        <div class="leaf-indent" />
        <div class="custom-cb" :class="cbClass(row.key)" @click.stop="toggleLeaf(row.node, row.parent)">
          <i v-if="selectionKeys[row.key]?.checked" class="pi pi-check" />
        </div>
        <img :src="row.icon" class="node-icon" alt="">
        <div class="row-content">
          <span class="node-label">{{ row.node.label }}</span>
          <span
            v-if="row.badge"
            class="badge"
            :class="row.badge.class"
            :title="`Accepted ${row.badge.text}`"
          >
            {{ row.badge.text }}
          </span>
        </div>
      </div>
    </template>
  </VirtualScroller>
</template>

<style scoped>
.vs-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 30px;
  padding: 0 0.5rem;
  box-sizing: border-box;
  cursor: default;
  border-radius: 3px;
}

.vs-row:hover {
  background: var(--color-background-subtle);
}

.vs-row--root {
  padding-left: 0.6rem;
}

.vs-row--branch,
.vs-row--leaf {
  padding-left: 0.3rem;
}

/* Indent leaf rows to sit under the branch content area */
.leaf-indent {
  width: 2.6rem;
  flex-shrink: 0;
}

/* Expand / collapse chevron button */
.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  width: 1.4rem;
  height: 1.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-dim);
  flex-shrink: 0;
  font-size: 0.75rem;
  border-radius: 3px;
}

.expand-btn:hover {
  color: var(--color-text-primary);
  background: var(--color-background-light);
}

/* Custom tri-state checkbox */
.custom-cb {
  width: 1.5rem;
  height: 1.5rem;
  min-width: 1.5rem;
  border: 2px solid var(--color-border-default);
  border-radius: 3px;
  background: var(--color-background-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 0.8rem;
  color: var(--color-text-bright);
  transition: background-color 0.1s, border-color 0.1s;
  user-select: none;
}

.custom-cb--on,
.custom-cb--partial {
  background: var(--color-action-blue-dark);
  border-color: var(--color-action-blue-dark);
}

.custom-cb:hover {
  border-color: var(--color-border-hover);
}

.node-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
  display: block;
}

.row-content {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
}

.node-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 1rem;
}

.node-label--bold {
  font-weight: 600;
  font-size: 1.02rem;
  flex: 1;
}

.child-count {
  font-size: 0.82rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
  white-space: nowrap;
}

.node-loading {
  color: var(--color-text-dim);
  font-size: 0.75rem;
  flex-shrink: 0;
}

.badge {
  font-size: 0.9rem;
  font-weight: 600;
  padding: 0.15rem 0.55rem;
  border-radius: 3px;
  font-style: italic;
  min-width: 38px;
  text-align: center;
  flex-shrink: 0;
}

.badge-complete {
  background-color: var(--metrics-status-chart-accepted);
  color: var(--color-text-bright);
}

.badge-incomplete {
  background-color: var(--metrics-status-chart-unassessed);
  color: var(--color-text-bright);
}
</style>
