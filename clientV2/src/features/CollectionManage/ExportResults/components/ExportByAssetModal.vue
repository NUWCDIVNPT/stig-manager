<script setup>
import { computed, reactive, ref, watch } from 'vue'
import targetIcon from '../../../../assets/target.svg'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { fetchAssetStigSummary } from '../api/exportResultsApi.js'
import { assetKey, computeEffectiveSelections } from '../exportResultsLogic.js'
import ExportModalShell from './ExportModalShell.vue'
import ExportTreeView from './ExportTreeView.vue'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedAssets: { type: Array, default: () => [] },
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

// ── Tree state (asset-pivot: branch = asset, leaf = STIG, lazy load) ──────────
const ROOT_KEY = 'root-all'
const nodes = ref([])
const selectionKeys = ref({})
const expandedAssetIds = reactive(new Set())
const loadingKeys = reactive(new Set())

function stigKey(assetId, benchmarkId) {
  return `stig-${assetId}-${benchmarkId}`
}

function buildInitialTree() {
  const keys = {}
  const assetNodes = props.selectedAssets.map((a) => {
    keys[assetKey(a.assetId)] = { checked: true, partialChecked: false }
    return {
      key: assetKey(a.assetId),
      label: a.assetName,
      data: { type: 'asset', assetId: a.assetId, acceptedPct: a.acceptedPct ?? 0 },
      leaf: false,
      children: [],
    }
  })
  keys[ROOT_KEY] = { checked: true, partialChecked: false }
  nodes.value = [{
    key: ROOT_KEY,
    label: 'All Assets',
    data: { type: 'root' },
    leaf: false,
    children: assetNodes,
  }]
  selectionKeys.value = keys
  expandedAssetIds.clear()
  loadingKeys.clear()
}

async function onNodeExpand(node) {
  if (node?.data?.type !== 'asset') { return }
  const assetId = node.data.assetId
  const key = assetKey(assetId)
  if (expandedAssetIds.has(assetId) || loadingKeys.has(key)) { return }

  loadingKeys.add(key)
  try {
    const summary = await fetchAssetStigSummary(props.collectionId, assetId)
    const parentSelection = selectionKeys.value[key]
    const parentChecked = !!parentSelection?.checked && !parentSelection?.partialChecked
    const children = (summary ?? []).map((row) => {
      const benchmarkId = row.benchmarkId
      const assessments = row.metrics?.assessments ?? 0
      const accepted = row.metrics?.statuses?.accepted ?? 0
      const pct = assessments ? (accepted / assessments) * 100 : 0
      return {
        key: stigKey(assetId, benchmarkId),
        label: benchmarkId,
        data: { type: 'stig', assetId, benchmarkId, acceptedPct: pct },
        leaf: true,
      }
    })
    const rootNode = nodes.value[0]
    if (!rootNode) { return }
    const assetNode = (rootNode.children ?? []).find(n => n.key === key)
    if (assetNode) {
      assetNode.children = children
    }
    if (parentChecked) {
      const nextKeys = { ...selectionKeys.value }
      for (const child of children) {
        nextKeys[child.key] = { checked: true, partialChecked: false }
      }
      selectionKeys.value = nextKeys
    }
    expandedAssetIds.add(assetId)
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    loadingKeys.delete(key)
  }
}

const effectiveSelections = computed(() =>
  computeEffectiveSelections(nodes.value, selectionKeys.value),
)

watch(() => props.visible, (open) => {
  if (open) { buildInitialTree() }
})
</script>

<template>
  <ExportModalShell
    :visible="visible"
    :collection-id="collectionId"
    :collection-name="collectionName"
    :effective-selections="effectiveSelections"
    prefs-key-prefix="exportResults"
    subtitle="Select Assets and STIGs"
    @update:visible="$emit('update:visible', $event)"
    @export-started="$emit('export-started', $event)"
    @collection-export-progress="$emit('collection-export-progress', $event)"
    @collection-export-complete="$emit('collection-export-complete', $event)"
    @collection-export-error="$emit('collection-export-error', $event)"
    @archive-export-progress="$emit('archive-export-progress', $event)"
    @archive-export-complete="$emit('archive-export-complete', $event)"
    @archive-export-error="$emit('archive-export-error', $event)"
  >
    <div v-if="nodes.length === 0" class="empty">
      No selected assets have STIG assignments to export.
    </div>
    <ExportTreeView
      v-else
      v-model:selection-keys="selectionKeys"
      :nodes="nodes"
      :loading-keys="loadingKeys"
      :root-icon="targetIcon"
      @node-expand="onNodeExpand"
    />
  </ExportModalShell>
</template>

<style scoped>
.empty {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  padding: 1rem;
  text-align: center;
}
</style>
