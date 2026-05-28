<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import Select from 'primevue/select'
import VirtualScroller from 'primevue/virtualscroller'
import { computed, reactive, ref, watch } from 'vue'

import shieldIcon from '../../../../assets/shield-green-check.svg'
import targetIcon from '../../../../assets/target.svg'
import { useCurrentUser } from '../../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../../shared/composables/useGlobalError.js'
import { formatPercent } from '../../../../shared/lib.js'
import { readStoredValue, storeValue } from '../../../../shared/lib/localStorage.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../ImportWizard/lib/importDialogPt.js'
import {
  downloadArchive,
  fetchStigAssetSummary,
  startCollectionExport,
} from '../api/exportResultsApi.js'
import {
  archiveFilename,
  buildDestinationOptions,
  buildStigTree,
  computeStigEffectiveSelections,
  parsePrefs,
  validateExport,
} from '../exportResultsLogic.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedStigs: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:visible',
  'export-started',
  'collection-export-progress',
  'collection-export-complete',
  'collection-export-error',
  'archive-export-progress',
  'archive-export-complete',
  'archive-export-error',
])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const { user } = useCurrentUser()
const { triggerError } = useGlobalError()

const TARGETS = [
  { label: 'Zip archive', value: 'archive' },
  { label: 'Collection', value: 'collection' },
]

const FORMATS = [
  { label: 'CKL', value: 'ckl', mode: 'mono' },
  { label: 'CKL (multi-STIG)', value: 'ckl', mode: 'multi' },
  { label: 'CKLB', value: 'cklb', mode: 'mono' },
  { label: 'CKLB (multi-STIG)', value: 'cklb', mode: 'multi' },
  { label: 'XCCDF', value: 'xccdf', mode: null },
]

const prefsKey = computed(() => `exportResultsStig:${props.collectionId}`)

const target = ref('archive')
const selectedFormat = ref(FORMATS[0])
const selectedDestinationId = ref(null)

const destinationOptions = computed(() =>
  buildDestinationOptions(user.value?.collectionGrants, props.collectionId),
)

// ── Tree state ────────────────────────────────────────────────────────────────

const nodes = ref([])
const selectionKeys = ref({})
const loadingTree = ref(false)
const expandedStigIds = reactive(new Set())

function badgeClass(pct) {
  return pct >= 99.5 ? 'badge-complete' : 'badge-incomplete'
}

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

// ── Flat rows for VirtualScroller ─────────────────────────────────────────────

const flatRows = computed(() => {
  const rows = []
  const root = nodes.value?.[0]
  if (!root) { return rows }

  rows.push({ type: 'root', key: root.key, label: root.label, data: root.data, _node: root })

  for (const stigNode of (root.children ?? [])) {
    const isExpanded = expandedStigIds.has(stigNode.data.benchmarkId)
    rows.push({
      type: 'stig',
      key: stigNode.key,
      label: stigNode.label,
      data: stigNode.data,
      _node: stigNode,
      assetCount: stigNode.children?.length ?? 0,
      expanded: isExpanded,
    })
    if (isExpanded) {
      for (const assetNode of (stigNode.children ?? [])) {
        rows.push({
          type: 'asset',
          key: assetNode.key,
          label: assetNode.label,
          data: assetNode.data,
          _node: assetNode,
          _stigNode: stigNode,
        })
      }
    }
  }
  return rows
})

// ── Checkbox state helpers ────────────────────────────────────────────────────

function computeStigCheckState(stigNode, keys) {
  const assetNodes = stigNode.children ?? []
  if (assetNodes.length === 0) {
    const s = keys[stigNode.key]
    return { checked: s?.checked ?? false, partialChecked: false }
  }
  const checkedCount = assetNodes.filter(a => keys[a.key]?.checked).length
  if (checkedCount === assetNodes.length) { return { checked: true, partialChecked: false } }
  if (checkedCount > 0) { return { checked: false, partialChecked: true } }
  return { checked: false, partialChecked: false }
}

function computeRootCheckState(rootNode, keys) {
  const stigNodes = rootNode.children ?? []
  if (stigNodes.length === 0) { return { checked: false, partialChecked: false } }
  let allChecked = true
  let anyChecked = false
  for (const stig of stigNodes) {
    const s = keys[stig.key]
    if (s?.checked) {
      anyChecked = true
    }
    else if (s?.partialChecked) {
      anyChecked = true
      allChecked = false
    }
    else {
      allChecked = false
    }
  }
  if (allChecked) { return { checked: true, partialChecked: false } }
  if (anyChecked) { return { checked: false, partialChecked: true } }
  return { checked: false, partialChecked: false }
}

// ── Checkbox toggle handlers ──────────────────────────────────────────────────

function toggleRoot() {
  const root = nodes.value?.[0]
  if (!root) { return }
  const keys = { ...selectionKeys.value }
  const rootState = keys[root.key]
  const newChecked = !(rootState?.checked)

  keys[root.key] = { checked: newChecked, partialChecked: false }
  for (const stig of (root.children ?? [])) {
    keys[stig.key] = { checked: newChecked, partialChecked: false }
    for (const asset of (stig.children ?? [])) {
      keys[asset.key] = { checked: newChecked, partialChecked: false }
    }
  }
  selectionKeys.value = keys
}

function toggleStig(stigNode) {
  const root = nodes.value?.[0]
  if (!root) { return }
  const keys = { ...selectionKeys.value }
  const stigState = keys[stigNode.key]
  const newChecked = !(stigState?.checked || stigState?.partialChecked)

  keys[stigNode.key] = { checked: newChecked, partialChecked: false }
  for (const asset of (stigNode.children ?? [])) {
    keys[asset.key] = { checked: newChecked, partialChecked: false }
  }

  keys[root.key] = computeRootCheckState(root, keys)
  selectionKeys.value = keys
}

function toggleAsset(assetNode, stigNode) {
  const root = nodes.value?.[0]
  if (!root) { return }
  const keys = { ...selectionKeys.value }
  const assetState = keys[assetNode.key]
  keys[assetNode.key] = { checked: !assetState?.checked, partialChecked: false }

  keys[stigNode.key] = computeStigCheckState(stigNode, keys)
  keys[root.key] = computeRootCheckState(root, keys)
  selectionKeys.value = keys
}

function toggleExpand(row) {
  const id = row.data.benchmarkId
  if (expandedStigIds.has(id)) {
    expandedStigIds.delete(id)
  }
  else {
    expandedStigIds.add(id)
  }
}

// ── Submission shape ──────────────────────────────────────────────────────────

const effectiveSelections = computed(() =>
  computeStigEffectiveSelections(nodes.value, selectionKeys.value),
)

const validationMessage = computed(() => validateExport({
  target: target.value,
  count: effectiveSelections.value.length,
  destinationId: selectedDestinationId.value,
}))

const canSubmit = computed(() => !loadingTree.value && validationMessage.value === null)

const submitLabel = computed(() =>
  target.value === 'collection' ? 'Export to collection' : 'Download archive',
)

// ── Prefs (localStorage) ──────────────────────────────────────────────────────

function loadPrefs() {
  const raw = readStoredValue(prefsKey.value, null)
  const next = parsePrefs(raw, FORMATS, destinationOptions.value, {
    target: target.value,
    format: selectedFormat.value,
    destinationId: selectedDestinationId.value,
  })
  target.value = next.target
  selectedFormat.value = next.format
  selectedDestinationId.value = next.destinationId
}

function savePrefs() {
  storeValue(prefsKey.value, JSON.stringify({
    target: target.value,
    formatKey: `${selectedFormat.value.value}|${selectedFormat.value.mode ?? ''}`,
    destinationId: selectedDestinationId.value,
  }))
}

// ── Submit ────────────────────────────────────────────────────────────────────

async function submitArchive() {
  const { value, mode } = selectedFormat.value
  const filename = archiveFilename(props.collectionName, value)
  try {
    const result = await downloadArchive({
      collectionId: props.collectionId,
      format: value,
      mode,
      selections: effectiveSelections.value,
      filename,
      onStreamStart: () => {
        emit('export-started', { type: 'archive', format: value, mode, filename })
      },
      onProgress: ({ bytesReceived, totalBytes }) => {
        emit('archive-export-progress', { bytesReceived, totalBytes })
      },
    })
    if (result?.via !== 'service-worker') {
      emit('archive-export-complete', { filename })
    }
  }
  catch (err) {
    emit('archive-export-error', err)
  }
}

async function submitCollection() {
  const dstId = selectedDestinationId.value
  const dstName = destinationOptions.value.find(d => d.value === String(dstId))?.label ?? ''
  emit('export-started', { type: 'collection', dstCollectionId: dstId, dstCollectionName: dstName })
  try {
    const response = await startCollectionExport({
      collectionId: props.collectionId,
      dstCollectionId: dstId,
      selections: effectiveSelections.value,
    })
    const { readNdjson } = await import('../../../../shared/lib/ndjsonStream.js')
    let errorEvent = null
    for await (const event of readNdjson(response)) {
      emit('collection-export-progress', event)
      if (event && event.status === 'error') {
        errorEvent = event
      }
    }
    if (errorEvent) {
      const err = new Error(errorEvent.message || 'Export failed')
      err.event = errorEvent
      emit('collection-export-error', err)
      return
    }
    emit('collection-export-complete', { dstCollectionId: dstId })
  }
  catch (err) {
    emit('collection-export-error', err)
  }
}

function onSubmit() {
  if (!canSubmit.value) { return }
  savePrefs()
  localVisible.value = false
  if (target.value === 'archive') {
    submitArchive()
  }
  else {
    submitCollection()
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

watch(() => props.visible, (open) => {
  if (open) {
    expandedStigIds.clear()
    loadTree()
    loadPrefs()
  }
})

watch(target, () => {
  if (target.value === 'collection' && !selectedDestinationId.value && destinationOptions.value.length > 0) {
    selectedDestinationId.value = destinationOptions.value[0].value
  }
})

// ── PT ────────────────────────────────────────────────────────────────────────

const dialogPt = {
  root: { style: 'background: var(--color-background-dark); border: 1px solid var(--color-border-default); border-radius: 8px; color: var(--color-text-primary); display: flex; flex-direction: column; overflow: hidden;' },
  header: { style: 'background: var(--color-background-dark); padding: 0; border-bottom: 1px solid var(--color-border-default); flex-shrink: 0;' },
  content: { style: 'background: var(--color-background-dark); padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column;' },
  footer: { style: 'flex-shrink: 0; padding: 0; border: none;' },
  closeButton: { style: 'color: var(--color-text-dim);' },
}

const selectPt = {
  root: { style: 'background: var(--color-background-light); border-color: var(--color-border-default); color: var(--color-text-primary);' },
}

const radioButtonPt = {
  root: { style: 'width: 1.3rem; height: 1.3rem; cursor: pointer;' },
  box: { style: 'width: 1.3rem; height: 1.3rem; cursor: pointer;' },
}
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(480px, 96vw)', height: '72vh', maxHeight: '680px', minHeight: '420px' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i class="pi pi-download" />
        </div>
        <div>
          <div class="modal-header-title">
            Export results
          </div>
          <div class="modal-header-sub">
            Select STIGs and Assets
          </div>
        </div>
        <div class="badge-legend">
          <span class="legend-label">Badges:</span>
          <span class="badge badge-incomplete">Accepted: &lt; 100%</span>
          <span class="badge badge-complete">Accepted: 100%</span>
        </div>
      </div>
    </template>

    <div class="modal-body">
      <!-- Virtual list pane -->
      <div class="tree-pane">
        <div v-if="loadingTree" class="loading-state">
          <i class="pi pi-spin pi-spinner" />
          <span>Loading assets...</span>
        </div>
        <div v-else-if="nodes.length === 0" class="empty">
          No assets found for the selected STIGs.
        </div>
        <VirtualScroller
          v-else
          :items="flatRows"
          :item-size="30"
          style="height: 100%; width: 100%;"
        >
          <template #item="{ item: row }">
            <!-- Root row -->
            <div v-if="row.type === 'root'" class="vs-row vs-row--root">
              <div
                class="custom-cb"
                :class="{
                  'custom-cb--on': selectionKeys[row.key]?.checked,
                  'custom-cb--partial': selectionKeys[row.key]?.partialChecked,
                }"
                @click.stop="toggleRoot"
              >
                <i v-if="selectionKeys[row.key]?.checked" class="pi pi-check" />
                <i v-else-if="selectionKeys[row.key]?.partialChecked" class="pi pi-minus" />
              </div>
              <img :src="shieldIcon" class="node-icon" alt="">
              <span class="node-label node-label--bold">{{ row.label }}</span>
            </div>

            <!-- STIG row -->
            <div v-else-if="row.type === 'stig'" class="vs-row vs-row--stig">
              <button class="expand-btn" :aria-label="row.expanded ? 'Collapse' : 'Expand'" @click.stop="toggleExpand(row)">
                <i :class="row.expanded ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" />
              </button>
              <div
                class="custom-cb"
                :class="{
                  'custom-cb--on': selectionKeys[row.key]?.checked,
                  'custom-cb--partial': selectionKeys[row.key]?.partialChecked,
                }"
                @click.stop="toggleStig(row._node)"
              >
                <i v-if="selectionKeys[row.key]?.checked" class="pi pi-check" />
                <i v-else-if="selectionKeys[row.key]?.partialChecked" class="pi pi-minus" />
              </div>
              <img :src="shieldIcon" class="node-icon" alt="">
              <div class="row-content">
                <span class="node-label" :title="row.data.title">{{ row.label }}</span>
                <span class="asset-count">· {{ row.assetCount }}</span>
                <span
                  v-if="row.data.acceptedPct != null"
                  class="badge"
                  :class="badgeClass(row.data.acceptedPct)"
                  :title="`Accepted ${formatPercent(row.data.acceptedPct, 100)}`"
                >
                  {{ formatPercent(row.data.acceptedPct, 100) }}
                </span>
              </div>
            </div>

            <!-- Asset row -->
            <div v-else-if="row.type === 'asset'" class="vs-row vs-row--asset">
              <div class="asset-indent" />
              <div
                class="custom-cb"
                :class="{ 'custom-cb--on': selectionKeys[row.key]?.checked }"
                @click.stop="toggleAsset(row._node, row._stigNode)"
              >
                <i v-if="selectionKeys[row.key]?.checked" class="pi pi-check" />
              </div>
              <img :src="targetIcon" class="node-icon" alt="">
              <div class="row-content">
                <span class="node-label">{{ row.label }}</span>
                <span
                  v-if="row.data.acceptedPct != null"
                  class="badge"
                  :class="badgeClass(row.data.acceptedPct)"
                  :title="`Accepted ${formatPercent(row.data.acceptedPct, 100)}`"
                >
                  {{ formatPercent(row.data.acceptedPct, 100) }}
                </span>
              </div>
            </div>
          </template>
        </VirtualScroller>
      </div>

      <div class="options-bar">
        <div v-if="validationMessage" class="validation-warning">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ validationMessage }}</span>
        </div>
        <div class="options-row">
          <span class="opt-label">Export to:</span>
          <div class="radio-group">
            <div v-for="opt in TARGETS" :key="opt.value" class="radio-option">
              <RadioButton v-model="target" :value="opt.value" :input-id="`stig-target-${opt.value}`" :pt="radioButtonPt" />
              <label :for="`stig-target-${opt.value}`">{{ opt.label }}</label>
            </div>
          </div>
        </div>

        <div v-if="target === 'archive'" class="options-row">
          <span class="opt-label">Format:</span>
          <Select
            v-model="selectedFormat"
            :options="FORMATS"
            option-label="label"
            class="opt-select"
            :pt="selectPt"
          />
        </div>

        <div v-if="target === 'collection'" class="options-row">
          <span class="opt-label">Destination:</span>
          <Select
            v-model="selectedDestinationId"
            :options="destinationOptions"
            option-label="label"
            option-value="value"
            placeholder="Choose collection..."
            empty-message="No accessible destination collections"
            class="opt-select"
            :pt="selectPt"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button label="Cancel" :pt="secondaryBtnPt" @click="localVisible = false" />
        <Button
          :label="submitLabel"
          :pt="primaryBtnPt"
          :disabled="!canSubmit"
          @click="onSubmit"
        />
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.modal-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
}

.modal-header-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: color-mix(in srgb, var(--color-action-blue-dark) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-action-blue-dark) 40%, transparent);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-action-blue-dark);
  flex-shrink: 0;
}

.modal-header-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-bright);
  line-height: 1.25;
}

.modal-header-sub {
  font-size: 1.025rem;
  color: var(--color-text-dim);
  margin-top: 2px;
}

.badge-legend {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
}

.legend-label {
  color: var(--color-text-dim);
  margin-right: 0.1rem;
}

/* ── Body: tree fills top, options bar pinned to bottom ── */
.modal-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.tree-pane {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

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

/* ── Virtual scroller rows ── */
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

.vs-row--stig,
.vs-row--asset {
  padding-left: 0.3rem;
}

/* Indent asset rows to sit under the STIG content area */
.asset-indent {
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
  color: #111;
  transition: background-color 0.1s, border-color 0.1s;
  user-select: none;
}

.custom-cb--on,
.custom-cb--partial {
  background: var(--p-primary-color);
  border-color: var(--p-primary-color);
}

.custom-cb:hover {
  border-color: var(--color-border-strong, #888);
}

/* Node icon */
.node-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
  display: block;
}

/* Row content: label + count + badge flow together */
.row-content {
  flex: 1;
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  min-width: 0;
}

/* Node label */
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

/* Asset count — inline after STIG name */
.asset-count {
  font-size: 0.82rem;
  color: var(--color-text-dim);
  flex-shrink: 0;
  white-space: nowrap;
}

/* ── Options bar ── */
.options-bar {
  flex-shrink: 0;
  border-top: 1px solid var(--color-border-default);
  padding: 0.6rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.options-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.opt-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  min-width: 6rem;
}

.opt-select {
  flex: 1;
}

.radio-group {
  display: flex;
  gap: 1.25rem;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.radio-option label {
  cursor: pointer;
  font-size: 1rem;
  color: var(--color-text-primary);
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.65rem 1rem;
  justify-content: flex-end;
}

/* ── Badges ── */
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

/* ── Validation warning ── */
.validation-warning {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: color-mix(in srgb, var(--color-text-warning, #f59e0b) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-text-warning, #f59e0b) 35%, transparent);
  border-radius: 4px;
  font-size: 0.88rem;
  color: var(--color-text-warning, #f59e0b);
}

.validation-warning .pi {
  flex-shrink: 0;
  font-size: 0.9rem;
}
</style>
