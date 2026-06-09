<script setup>
import { computed, ref, watch } from 'vue'
import shieldIcon from '../../../../assets/shield-green-check.svg'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { fetchStigAssetSummary } from '../api/exportResultsApi.js'
import { buildStigTree, computeStigTreeSelections } from '../exportResultsLogic.js'
import ExportModalShell from './ExportModalShell.vue'
import ExportTreeView from './ExportTreeView.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedStigs: { type: Array, default: () => [] },
})

defineEmits([
  'update:visible',
  'export-started',
  'collection-export-progress',
  'collection-export-complete',
  'collection-export-error',
  'archive-export-progress',
  'archive-export-complete',
  'archive-export-error',
])

const { triggerError } = useGlobalError()

// ── Tree state (STIG-pivot: branch = STIG, leaf = asset, eager load) ──────────
const nodes = ref([])
const selectionKeys = ref({})
const loadingTree = ref(false)

async function loadTree() {
  if (props.selectedStigs.length === 0) {
    nodes.value = []
    selectionKeys.value = {}
    return
  }

  loadingTree.value = true
  try {
    const results = await Promise.all(
      props.selectedStigs.map(s => fetchStigAssetSummary(props.collectionId, s.benchmarkId)),
    )
    const rowsByBenchmarkId = new Map()
    props.selectedStigs.forEach((s, i) => {
      rowsByBenchmarkId.set(s.benchmarkId, results[i] ?? [])
    })
    const built = buildStigTree(props.selectedStigs, rowsByBenchmarkId)
    nodes.value = built.nodes
    selectionKeys.value = built.selectionKeys
  }
  catch (err) {
    triggerError(err)
    nodes.value = []
    selectionKeys.value = {}
  }
  finally {
    loadingTree.value = false
  }
}

const effectiveSelections = computed(() =>
  computeStigTreeSelections(nodes.value, selectionKeys.value),
)

watch(() => props.visible, (open) => {
  if (open) { loadTree() }
})
</script>

<template>
  <ExportModalShell
    :visible="visible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    :effective-selections="effectiveSelections"
    :busy="loadingTree"
    prefs-key-prefix="exportResultsStig"
    subtitle="Select STIGs and Assets"
    @update:visible="$emit('update:visible', $event)"
    @export-started="$emit('export-started', $event)"
    @collection-export-progress="$emit('collection-export-progress', $event)"
    @collection-export-complete="$emit('collection-export-complete', $event)"
    @collection-export-error="$emit('collection-export-error', $event)"
    @archive-export-progress="$emit('archive-export-progress', $event)"
    @archive-export-complete="$emit('archive-export-complete', $event)"
    @archive-export-error="$emit('archive-export-error', $event)"
  >
    <div v-if="loadingTree" class="loading-state">
      <i class="pi pi-spin pi-spinner" />
      <span>Loading assets...</span>
    </div>
    <div v-else-if="nodes.length === 0" class="empty">
      No assets found for the selected STIGs.
    </div>
    <ExportTreeView
      v-else
      v-model:selection-keys="selectionKeys"
      :nodes="nodes"
      :root-icon="shieldIcon"
      show-child-count
    />
  </ExportModalShell>
</template>

<style scoped>
.loading-state {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 1rem;
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.empty {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  padding: 1rem;
  text-align: center;
}
</style>
