<script setup>
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Popover from 'primevue/popover'
import Select from 'primevue/select'
import { computed, ref, watch } from 'vue'

import shieldIcon from '../../../../assets/shield-green-check.svg'
import HelpIcon from '../../../../components/common/HelpIcon.vue'
import PickList from '../../../../components/common/PickList.vue'
import { fetchCollectionLabels } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { getContrastColor, normalizeColor } from '../../../../shared/lib/colorUtils.js'
import { TOOLTIPS } from '../../../../shared/lib/tooltips.js'
import { primaryBtnPt, secondaryBtnPt } from '../../../../shared/lib/dialogPt.js'
import {
  fetchAssetsByCollectionStig,
  fetchCollectionAssetsWithStigs,
  fetchInstalledStigsWithRevisions,
  writeStigProps,
} from '../../api/stigManageApi.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  mode: {
    type: String,
    required: true,
    validator: v => v === 'assign' || v === 'modify',
  },
  collectionId: { type: String, required: true },
  selectedStig: { type: Object, default: null },
})
const emit = defineEmits(['update:visible', 'stigs-changed'])

const localVisible = computed({
  get: () => props.visible,
  set: v => emit('update:visible', v),
})

const isModify = computed(() => props.mode === 'modify')

const headerTitle = computed(() =>
  isModify.value ? 'Modify STIG assignment' : 'Assign STIG',
)

const headerSubtitle = computed(() =>
  isModify.value && props.selectedStig?.benchmarkId
    ? props.selectedStig.benchmarkId
    : 'Select STIGs and Assets',
)

const stigs = ref([])
const assets = ref([])
const stigAssets = ref([])
const labelMap = ref(new Map())

const LATEST_REVISION = 'latest'
const MAX_VISIBLE_LABELS = 2
const VIRTUAL_SCROLLER_OPTIONS = { itemSize: 40 }

const selectedBenchmarkId = ref(null)
const selectedRevisionStr = ref(LATEST_REVISION)
const pickerValue = ref([[], []])

const benchmarkOptions = computed(() =>
  (stigs.value ?? []).map(s => ({
    value: s.benchmarkId,
    label: s.benchmarkId,
  })),
)

const selectedBenchmark = computed(() =>
  (stigs.value ?? []).find(s => s.benchmarkId === selectedBenchmarkId.value) ?? null,
)

const revisionOptions = computed(() => {
  const base = [{ value: LATEST_REVISION, label: 'Most recent revision' }]
  const revisions = selectedBenchmark.value?.revisions ?? []
  return [
    ...base,
    ...revisions.map(rev => ({
      value: rev.revisionStr,
      label: `${rev.revisionStr} (${rev.benchmarkDate})`,
    })),
  ]
})

const { isLoading: loadingStigs, execute: loadStigs } = useAsyncState(
  () => fetchInstalledStigsWithRevisions(),
  { immediate: false },
)

const { isLoading: loadingAssets, execute: loadAssets } = useAsyncState(
  () => fetchCollectionAssetsWithStigs(props.collectionId),
  { immediate: false },
)

const {
  isLoading: loadingStigAssets,
  error: stigAssetsError,
  execute: fetchStigAssetsAsync,
} = useAsyncState(
  benchmarkId => fetchAssetsByCollectionStig(props.collectionId, benchmarkId),
  { immediate: false },
)

// Labels are decorative; suppress the global error toast on failure so a
// missing label fetch doesn't block the user from assigning STIGs.
const { execute: fetchLabelsAsync } = useAsyncState(
  () => fetchCollectionLabels(props.collectionId),
  { immediate: false, onError: null },
)

const {
  isLoading: saving,
  error: saveError,
  execute: executeSave,
} = useAsyncState(
  (benchmarkId, body) => writeStigProps(props.collectionId, benchmarkId, body),
  { immediate: false },
)

const isLoading = computed(
  () => loadingStigs.value || loadingAssets.value || loadingStigAssets.value,
)

const canSave = computed(
  () => !isLoading.value
    && !saving.value
    && !!selectedBenchmarkId.value
    && !stigAssetsError.value,
)

async function onSave() {
  if (!canSave.value) {
    return
  }
  await executeSave(selectedBenchmarkId.value, {
    defaultRevisionStr: selectedRevisionStr.value,
    assetIds: pickerValue.value[1].map(r => String(r.assetId)),
  })
  if (saveError.value) {
    // useAsyncState already surfaced via global error toast.
    return
  }
  emit('stigs-changed')
  localVisible.value = false
}

function onCancel() {
  if (saving.value) {
    return
  }
  localVisible.value = false
}

async function loadAssetsForBenchmark(benchmarkId) {
  if (!benchmarkId) {
    stigAssets.value = []
    return
  }
  const result = await fetchStigAssetsAsync(benchmarkId)
  stigAssets.value = result ?? []
}

function resetSelections() {
  if (isModify.value && props.selectedStig?.benchmarkId) {
    selectedBenchmarkId.value = props.selectedStig.benchmarkId
    selectedRevisionStr.value = props.selectedStig.revisionPinned
      ? props.selectedStig.revisionStr ?? LATEST_REVISION
      : LATEST_REVISION
  }
  else {
    selectedBenchmarkId.value = null
    selectedRevisionStr.value = LATEST_REVISION
  }
}

async function loadLabels() {
  const result = await fetchLabelsAsync()
  const map = new Map()
  for (const label of (result ?? [])) {
    map.set(label.labelId, label)
  }
  labelMap.value = map
}

async function onOpen() {
  resetSelections()
  stigs.value = []
  assets.value = []
  stigAssets.value = []
  labelMap.value = new Map()
  pickerValue.value = [[], []]

  const benchId = selectedBenchmarkId.value
  const tasks = [
    loadStigs().then(r => (stigs.value = r ?? [])),
    loadAssets().then(r => (assets.value = r ?? [])),
    loadLabels(),
  ]
  if (benchId) {
    tasks.push(loadAssetsForBenchmark(benchId))
  }
  await Promise.all(tasks)
  rebuildPicker()
}

async function onBenchmarkChange(value) {
  selectedRevisionStr.value = LATEST_REVISION
  await loadAssetsForBenchmark(value)
  rebuildPicker()
}

watch(() => props.visible, (open) => {
  if (open) {
    onOpen()
  }
})

function buildAssetRow(asset) {
  const labelIds = asset.labelIds ?? []
  const labels = []
  for (const id of labelIds) {
    const label = labelMap.value.get(id)
    if (label) {
      labels.push(label)
    }
  }
  return {
    assetId: asset.assetId,
    name: asset.name,
    labelIds,
    visibleLabels: labels.slice(0, MAX_VISIBLE_LABELS),
    overflowLabels: labels.slice(MAX_VISIBLE_LABELS),
    benchmarkIds: (asset.stigs ?? []).map(s => s.benchmarkId),
  }
}

function rebuildPicker() {
  const benchId = selectedBenchmarkId.value
  if (!benchId) {
    pickerValue.value = [[], []]
    return
  }
  const assignedIds = new Set(
    (stigAssets.value ?? []).map(a => String(a.assetId)),
  )
  const available = []
  const assigned = []
  for (const asset of (assets.value ?? [])) {
    const row = buildAssetRow(asset)
    if (assignedIds.has(String(row.assetId))) {
      assigned.push(row)
    }
    else {
      available.push(row)
    }
  }
  pickerValue.value = [available, assigned]
}

function onPickerUpdate(newValue) {
  const benchId = selectedBenchmarkId.value
  if (!benchId) {
    pickerValue.value = newValue
    return
  }
  const [newAvailable, newAssigned] = newValue
  const prevAssignedIds = new Set(pickerValue.value[1].map(r => r.assetId))
  const nextAssignedIds = new Set(newAssigned.map(r => r.assetId))

  for (const row of newAssigned) {
    if (!prevAssignedIds.has(row.assetId) && !row.benchmarkIds.includes(benchId)) {
      row.benchmarkIds = [...row.benchmarkIds, benchId]
    }
  }
  for (const row of newAvailable) {
    if (prevAssignedIds.has(row.assetId) && !nextAssignedIds.has(row.assetId)) {
      row.benchmarkIds = row.benchmarkIds.filter(id => id !== benchId)
    }
  }
  pickerValue.value = newValue
}

const assignedCount = computed(() => pickerValue.value[1].length)
const availableCount = computed(() => pickerValue.value[0].length)

function labelChipStyle(label) {
  return {
    backgroundColor: normalizeColor(label.color, '#cccccc'),
    color: getContrastColor(label.color, '#000000', 'var(--color-text-primary)'),
  }
}

const overflowPopoverRef = ref(null)
const overflowPopoverLabels = ref([])

function showOverflowPopover(event, labels) {
  overflowPopoverLabels.value = labels
  overflowPopoverRef.value?.show(event)
}

function hideOverflowPopover() {
  overflowPopoverRef.value?.hide()
}

function assetTextFilter(item, text) {
  const lower = text.toLowerCase()
  if (item.name && item.name.toLowerCase().includes(lower)) {
    return true
  }
  for (const id of (item.labelIds ?? [])) {
    const label = labelMap.value.get(id)
    if (label?.name?.toLowerCase().includes(lower)) {
      return true
    }
  }
  return false
}

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
</script>

<template>
  <Dialog
    v-model:visible="localVisible"
    modal
    :draggable="false"
    :style="{ width: 'min(900px, 96vw)', height: '78vh', maxHeight: '780px', minHeight: '520px' }"
    :pt="dialogPt"
  >
    <template #header>
      <div class="modal-header">
        <div class="modal-header-icon">
          <i :class="isModify ? 'pi pi-sliders-h' : 'pi pi-plus-circle'" />
        </div>
        <div>
          <div class="modal-header-title">
            {{ headerTitle }}
          </div>
          <div class="modal-header-sub">
            {{ headerSubtitle }}
          </div>
        </div>
      </div>
    </template>

    <div class="modal-body">
      <div class="selection-row">
        <span class="selection-label">Benchmark ID</span>
        <Select
          v-model="selectedBenchmarkId"
          :options="benchmarkOptions"
          option-label="label"
          option-value="value"
          :placeholder="loadingStigs ? 'Loading STIGs...' : 'Assign a STIG...'"
          :disabled="isModify || loadingStigs"
          :filter="!isModify"
          filter-placeholder="Search benchmarks"
          class="selection-select"
          :class="{ 'selection-select--locked': isModify }"
          :pt="selectPt"
          @update:model-value="onBenchmarkChange"
        />
      </div>

      <div class="selection-row">
        <span class="selection-label">Default Revision <HelpIcon :content="TOOLTIPS.defaultRevision" /></span>
        <Select
          v-model="selectedRevisionStr"
          :options="revisionOptions"
          option-label="label"
          option-value="value"
          :disabled="!selectedBenchmarkId || loadingStigs"
          class="selection-select"
          :pt="selectPt"
        />
      </div>

      <div class="picker-pane" :class="{ 'picker-pane--blurred': !selectedBenchmarkId }">
        <PickList
          :model-value="pickerValue"
          data-key="assetId"
          :show-source-filter="true"
          :show-target-filter="true"
          filter-by="name"
          source-filter-placeholder="Search available assets and labels..."
          target-filter-placeholder="Search assigned assets and labels..."
          :virtual-scroller-options="VIRTUAL_SCROLLER_OPTIONS"
          :text-filter-fn="assetTextFilter"
          @update:model-value="onPickerUpdate"
        >
          <template #sourceheader>
            <span class="header-row">
              <span>Available <span class="header-count">({{ availableCount }})</span></span>
              <i v-if="isLoading" class="pi pi-spin pi-spinner header-spinner" />
            </span>
          </template>
          <template #targetheader>
            <span class="header-row">
              <span>Assigned <span class="header-count">({{ assignedCount }})</span></span>
              <i v-if="isLoading" class="pi pi-spin pi-spinner header-spinner" />
            </span>
          </template>
          <template #item="{ item }">
            <div class="asset-row">
              <span class="asset-name">{{ item.name }}</span>
              <div class="asset-labels">
                <span
                  v-for="label in item.visibleLabels"
                  :key="label.labelId"
                  class="label-chip"
                  :style="labelChipStyle(label)"
                >
                  {{ label.name }}
                </span>
                <span
                  v-if="item.overflowLabels.length > 0"
                  class="label-chip label-chip--overflow"
                  @mouseenter="showOverflowPopover($event, item.overflowLabels)"
                  @mouseleave="hideOverflowPopover"
                >
                  +{{ item.overflowLabels.length }}
                </span>
              </div>
              <span class="asset-stig-count" :title="item.benchmarkIds.join(', ')">
                <img :src="shieldIcon" class="asset-stig-icon" alt="">
                {{ item.benchmarkIds.length }}
              </span>
            </div>
          </template>
        </PickList>
      </div>

      <Popover ref="overflowPopoverRef">
        <div class="overflow-labels-popover">
          <span
            v-for="label in overflowPopoverLabels"
            :key="label.labelId"
            class="label-chip"
            :style="labelChipStyle(label)"
          >
            {{ label.name }}
          </span>
        </div>
      </Popover>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button
          label="Cancel"
          :pt="secondaryBtnPt"
          :disabled="saving"
          @click="onCancel"
        />
        <Button
          :label="isModify ? 'Save' : 'Assign'"
          :pt="primaryBtnPt"
          :disabled="!canSave"
          :loading="saving"
          @click="onSave"
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

.modal-body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  padding: 1rem 1.1rem;
  gap: 0.75rem;
}

.selection-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.selection-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text-primary);
  width: 9rem;
  flex-shrink: 0;
  white-space: nowrap;
}

.selection-select {
  flex: 1;
  min-width: 0;
}

.selection-select--locked :deep(.p-select) {
  background: var(--color-background-subtle);
  border-color: var(--color-border-default);
  opacity: 0.75;
  cursor: not-allowed;
}

.selection-select--locked :deep(.p-select-label) {
  color: var(--color-text-dim);
  font-style: italic;
}

.selection-select--locked :deep(.p-select-dropdown) {
  display: none;
}

.picker-pane {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-top: 1px solid var(--color-border-default);
  padding-top: 0.75rem;
}

.picker-pane--blurred > :deep(.common-picklist-root) {
  filter: blur(3px);
  opacity: 0.5;
  pointer-events: none;
  user-select: none;
}

.header-count {
  font-weight: 500;
  color: var(--color-text-dim);
  font-size: 0.9em;
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  width: 100%;
}

.header-spinner {
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.asset-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  min-width: 0;
}

.asset-name {
  min-width: 0;
  max-width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 0;
}

.asset-labels {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 3px;
  overflow: hidden;
}

.label-chip {
  display: inline-block;
  font-size: 0.9rem;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 6px;
  white-space: nowrap;
  max-width: 10rem;
  overflow: hidden;
  text-overflow: ellipsis;
}

.label-chip--overflow {
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
  cursor: pointer;
}

.overflow-labels-popover {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 250px;
}

.asset-stig-count {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.asset-stig-icon {
  width: 1.35rem;
  height: 1.35rem;
  display: block;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.65rem 1rem;
  justify-content: flex-end;
}
</style>
