<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Select from 'primevue/select'

import Tree from 'primevue/tree'
import { computed, reactive, ref, watch } from 'vue'
import { useCurrentUser } from '../../../shared/composables/useCurrentUser.js'
import { useGlobalError } from '../../../shared/composables/useGlobalError.js'
import { primaryBtnPt, secondaryBtnPt } from '../../ImportWizard/lib/importDialogPt.js'
import {
  downloadArchive,
  fetchAssetStigSummary,
  startCollectionExport,
} from '../api/exportResultsApi.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  collectionId: { type: String, required: true },
  collectionName: { type: String, default: '' },
  selectedAssets: { type: Array, default: () => [] },
})

const emit = defineEmits([
  'update:visible',
  'export-started',
  'collection-export-progress',
  'collection-export-complete',
  'collection-export-error',
])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const { user } = useCurrentUser()
const { triggerError } = useGlobalError()

const COLLECTION_MIN = 1
const COLLECTION_MAX = 100

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

const prefsKey = computed(() => `exportResults:${props.collectionId}`)

const target = ref('archive')
const formatKey = ref('ckl|mono')
const selectedDestinationId = ref(null)

const destinationOptions = computed(() => {
  if (!user.value?.collectionGrants?.length) {
    return []
  }
  return user.value.collectionGrants
    .filter(g => g.roleId >= 3 && String(g.collection.collectionId) !== String(props.collectionId))
    .map(g => ({ label: g.collection.name, value: String(g.collection.collectionId) }))
    .sort((a, b) => a.label.localeCompare(b.label))
})

const eligibleAssets = computed(() =>
  props.selectedAssets.filter(a => (a.stigCnt ?? 0) > 0),
)

const isSubmitting = ref(false)

// ── Tree state ────────────────────────────────────────────────────────────────

const nodes = ref([])
// PrimeVue checkbox selection keys: { [key]: { checked, partialChecked } }
const selectionKeys = ref({})
// Track which asset nodes have been expanded (children resolved)
const expandedAssetIds = reactive(new Set())
const loadingAssetIds = reactive(new Set())

function assetKey(assetId) {
  return `asset-${assetId}`
}

function stigKey(assetId, benchmarkId) {
  return `stig-${assetId}-${benchmarkId}`
}

function badgeClass(pct) {
  return pct >= 99.5 ? 'badge-complete' : 'badge-incomplete'
}

function formatPct(value) {
  if (value == null || Number.isNaN(value)) {
    return '—'
  }
  const rounded = value > 0 && value < 1
    ? 1
    : value > 99 && value < 100
      ? 99
      : Math.round(value)
  return `${rounded}%`
}

function buildInitialTree() {
  const keys = {}
  nodes.value = eligibleAssets.value.map((a) => {
    keys[assetKey(a.assetId)] = { checked: true, partialChecked: false }
    return {
      key: assetKey(a.assetId),
      label: a.assetName,
      data: {
        type: 'asset',
        assetId: a.assetId,
        acceptedPct: a.acceptedPct ?? 0,
      },
      leaf: false,
      children: [],
    }
  })
  selectionKeys.value = keys
  expandedAssetIds.clear()
  loadingAssetIds.clear()
}

async function onNodeExpand(node) {
  if (node?.data?.type !== 'asset') {
    return
  }
  const assetId = node.data.assetId
  if (expandedAssetIds.has(assetId) || loadingAssetIds.has(assetId)) {
    return
  }
  loadingAssetIds.add(assetId)
  try {
    const summary = await fetchAssetStigSummary(props.collectionId, assetId)
    const parentSelection = selectionKeys.value[assetKey(assetId)]
    const parentChecked = !!parentSelection?.checked && !parentSelection?.partialChecked
    const children = (summary ?? []).map((row) => {
      const benchmarkId = row.benchmarkId
      const assessments = row.metrics?.assessments ?? 0
      const accepted = row.metrics?.statuses?.accepted ?? 0
      const pct = assessments ? (accepted / assessments) * 100 : 0
      return {
        key: stigKey(assetId, benchmarkId),
        label: benchmarkId,
        data: {
          type: 'stig',
          assetId,
          benchmarkId,
          acceptedPct: pct,
        },
        leaf: true,
      }
    })
    const idx = nodes.value.findIndex(n => n.key === assetKey(assetId))
    if (idx !== -1) {
      const next = { ...nodes.value[idx], children }
      nodes.value = nodes.value.with(idx, next)
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
    loadingAssetIds.delete(assetId)
  }
}

// ── Submission shape ──────────────────────────────────────────────────────────

const effectiveSelections = computed(() => {
  const out = []
  for (const node of nodes.value) {
    if (node.data?.type !== 'asset') {
      continue
    }
    const assetId = node.data.assetId
    const state = selectionKeys.value[assetKey(assetId)]
    if (!state) {
      continue
    }

    const hasChildren = node.children?.length > 0
    const fullyChecked = state.checked && !state.partialChecked

    if (fullyChecked && !hasChildren) {
      // Asset checked but children never loaded → omit stigs, server uses defaults
      out.push({ assetId: String(assetId) })
      continue
    }

    if (state.checked || state.partialChecked) {
      const benchmarkIds = []
      for (const child of node.children ?? []) {
        const cState = selectionKeys.value[child.key]
        if (cState?.checked) {
          benchmarkIds.push(child.data.benchmarkId)
        }
      }
      if (benchmarkIds.length > 0) {
        out.push({ assetId: String(assetId), stigs: benchmarkIds })
      }
      else if (fullyChecked) {
        out.push({ assetId: String(assetId) })
      }
    }
  }
  return out
})

const validationMessage = computed(() => {
  const count = effectiveSelections.value.length
  if (count === 0) {
    return 'Select at least one asset.'
  }
  if (target.value === 'collection') {
    if (count < COLLECTION_MIN || count > COLLECTION_MAX) {
      return `Collection export requires ${COLLECTION_MIN}–${COLLECTION_MAX} assets (currently ${count}).`
    }
    if (!selectedDestinationId.value) {
      return 'Choose a destination collection.'
    }
  }
  return null
})

const canSubmit = computed(() => !isSubmitting.value && validationMessage.value === null)

const submitLabel = computed(() => {
  if (target.value === 'collection') {
    return 'Export to collection'
  }
  return 'Download archive'
})

// ── Prefs (localStorage) ──────────────────────────────────────────────────────

function loadPrefs() {
  try {
    const raw = localStorage.getItem(prefsKey.value)
    if (!raw) {
      return
    }
    const parsed = JSON.parse(raw)
    if (parsed.target === 'collection' || parsed.target === 'archive') {
      target.value = parsed.target
    }
    if (typeof parsed.formatKey === 'string' && FORMATS.some(f => `${f.value}|${f.mode ?? ''}` === parsed.formatKey)) {
      formatKey.value = parsed.formatKey
    }
    if (parsed.destinationId && destinationOptions.value.some(d => d.value === String(parsed.destinationId))) {
      selectedDestinationId.value = String(parsed.destinationId)
    }
  }
  catch {
    // ignore
  }
  // If remembered destination is missing for collection mode, fall back to archive
  if (target.value === 'collection' && !selectedDestinationId.value) {
    target.value = 'archive'
  }
}

function savePrefs() {
  try {
    localStorage.setItem(prefsKey.value, JSON.stringify({
      target: target.value,
      formatKey: formatKey.value,
      destinationId: selectedDestinationId.value,
    }))
  }
  catch {
    // ignore
  }
}

// ── Submit ────────────────────────────────────────────────────────────────────

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').replace(/Z$/, '')
}

function archiveFilename(format) {
  const safeName = (props.collectionName || 'collection').replace(/[\\/:*?"<>|]/g, '_')
  return `${safeName}_${format}_${timestamp()}.zip`
}

async function submitArchive() {
  const [value, modeRaw] = formatKey.value.split('|')
  const mode = modeRaw || null
  const filename = archiveFilename(value)
  await downloadArchive({
    collectionId: props.collectionId,
    format: value,
    mode,
    selections: effectiveSelections.value,
    filename,
  })
  emit('export-started', { type: 'archive', format: value, mode })
}

async function submitCollection() {
  const dstId = selectedDestinationId.value
  emit('export-started', { type: 'collection', dstCollectionId: dstId })
  try {
    const response = await startCollectionExport({
      collectionId: props.collectionId,
      dstCollectionId: dstId,
      selections: effectiveSelections.value,
    })
    const { readNdjson } = await import('../../../shared/lib/ndjsonStream.js')
    for await (const event of readNdjson(response)) {
      emit('collection-export-progress', event)
    }
    emit('collection-export-complete', { dstCollectionId: dstId })
  }
  catch (err) {
    emit('collection-export-error', err)
  }
}

async function onSubmit() {
  if (!canSubmit.value) {
    return
  }
  isSubmitting.value = true
  savePrefs()
  try {
    if (target.value === 'archive') {
      await submitArchive()
      localVisible.value = false
    }
    else {
      // close modal first; parent shows progress window
      localVisible.value = false
      // fire collection export without blocking the dialog close
      submitCollection()
    }
  }
  catch (err) {
    triggerError(err)
  }
  finally {
    isSubmitting.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────

watch(() => props.visible, (open) => {
  if (open) {
    buildInitialTree()
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

const treePt = {
  root: { style: 'background: transparent; padding: 0; border: none; color: var(--color-text-primary);' },
  nodeContent: ({ context }) => ({
    style: `padding: 0.2rem 0.4rem; border-radius: 3px; background: ${context.selected ? 'var(--color-background-subtle)' : 'transparent'};`,
    onmouseenter: (e) => { e.currentTarget.style.background = 'var(--color-background-subtle)' },
    onmouseleave: (e) => { e.currentTarget.style.background = context.selected ? 'var(--color-background-subtle)' : 'transparent' },
  }),
  nodeCheckbox: {
    root: { style: 'display: flex; align-items: center;' },
    box: ({ context }) => ({
      style: `background: ${context.checked || context.partialChecked ? 'var(--color-action-blue-dark)' : 'var(--color-background-light)'}; border-color: ${context.checked || context.partialChecked ? 'var(--color-action-blue-dark)' : 'var(--color-border-default)'};`,
    }),
    icon: { style: 'color: white;' },
  },
}



const selectPt = {
  root: { style: 'background: var(--color-background-light); border-color: var(--color-border-default); color: var(--color-text-primary);' },
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
        <div class="modal-header-text">
          <div class="modal-header-title">
            Export results
          </div>
          <div class="modal-header-sub">
            Select Assets and STIGs
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
      <!-- Tree -->
      <div class="tree-pane">
        <div v-if="nodes.length === 0" class="empty">
          No selected assets have STIG assignments to export.
        </div>
        <Tree
          v-else
          v-model:selection-keys="selectionKeys"
          :value="nodes"
          selection-mode="checkbox"
          :pt="treePt"
          @node-expand="onNodeExpand"
        >
          <template #default="{ node }">
            <div class="node-row">
              <span class="node-label">{{ node.label }}</span>
              <span
                v-if="node.data?.type === 'asset' && loadingAssetIds.has(node.data.assetId)"
                class="node-loading"
              >
                <i class="pi pi-spin pi-spinner" />
              </span>
              <span
                v-if="node.data?.acceptedPct != null"
                class="badge"
                :class="badgeClass(node.data.acceptedPct)"
                :title="`Accepted ${formatPct(node.data.acceptedPct)}`"
              >
                {{ formatPct(node.data.acceptedPct) }}
              </span>
            </div>
          </template>
        </Tree>
      </div>

      <!-- Bottom options bar -->
      <div class="options-bar">
        <div class="options-row">
          <span class="opt-label">Export to:</span>
          <div class="radio-group">
            <label v-for="opt in TARGETS" :key="opt.value" class="radio-option">
              <input type="radio" :value="opt.value" v-model="target" />
              {{ opt.label }}
            </label>
          </div>
        </div>

        <div v-if="target === 'archive'" class="options-row">
          <span class="opt-label">Format:</span>
          <Select
            v-model="formatKey"
            :options="FORMATS.map(f => ({ label: f.label, value: `${f.value}|${f.mode ?? ''}` }))"
            option-label="label"
            option-value="value"
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
        <span v-if="validationMessage" class="status-error">
          <i class="pi pi-exclamation-triangle" /> {{ validationMessage }}
        </span>
        <span v-else class="status-ok">
          <i class="pi pi-check-circle" /> {{ effectiveSelections.length }} asset{{ effectiveSelections.length === 1 ? '' : 's' }} ready
        </span>
        <div class="footer-actions">
          <Button label="Cancel" :pt="secondaryBtnPt" @click="localVisible = false" />
          <Button
            :label="submitLabel"
            :pt="primaryBtnPt"
            :loading="isSubmitting"
            :disabled="!canSubmit"
            @click="onSubmit"
          />
        </div>
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
  font-size: 0.75rem;
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
  padding: 0.75rem;
  overflow: auto;
  min-height: 0;
}

.empty {
  font-size: 0.9rem;
  color: var(--color-text-dim);
  padding: 1rem;
  text-align: center;
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
  font-size: 0.82rem;
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
  gap: 0.45rem;
  font-size: 1rem;
  color: var(--color-text-primary);
  cursor: pointer;
  user-select: none;
}

.radio-option input[type='radio'] {
  accent-color: var(--color-action-blue-dark);
  width: 1.1rem;
  height: 1.1rem;
  cursor: pointer;
  flex-shrink: 0;
}

/* ── Footer ── */
.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.65rem 1rem;
  border-top: 1px solid var(--color-border-default);
}

.footer-actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-left: auto;
}

.status-error {
  font-size: 0.82rem;
  color: var(--color-text-error);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.status-ok {
  font-size: 0.82rem;
  color: var(--color-success);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

/* ── Tree node ── */
.node-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.node-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-loading {
  color: var(--color-text-dim);
  font-size: 0.75rem;
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
  background-color: #425722;
  color: var(--color-text-bright);
}

.badge-incomplete {
  background-color: hsl(220deg 10% 18%);
  color: var(--color-text-dim);
}
</style>
