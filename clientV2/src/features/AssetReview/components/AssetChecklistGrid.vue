<script setup>
import { computed, inject, onMounted, ref, toRefs, watch } from 'vue'
import { useRoute } from 'vue-router'

import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { statusPayloadForAction } from '../../../shared/lib/reviewFormUtils.js'
import { patchReview, putReview } from '../../../shared/api/reviewsApi.js'
import { useGridDensity } from '../../../shared/composables/useGridDensity.js'
import AssetChecklistGridHeader from './AssetChecklistGridHeader.vue'
import AssetChecklistGridTable from './AssetChecklistGridTable.vue'

const props = defineProps({
  searchFilter: {
    type: String,
    default: '',
  },
  gridData: {
    type: Array,
    default: () => [],
  },
  isChecklistLoading: {
    type: Boolean,
    default: false,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  asset: {
    type: Object,
    default: null,
  },
  revisionInfo: {
    type: Object,
    default: null,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  selectRule: {
    type: Function,
    required: true,
  },
  ruleLookupMap: {
    type: Object,
    default: () => new Map(),
  },
  fieldSettings: {
    type: Object,
    default: null,
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  collectionId: {
    type: String,
    default: null,
  },
  assetId: {
    type: [String, Number],
    default: null,
  },
})

const emit = defineEmits(['update:searchFilter', 'review-saved', 'refresh'])

const { selectRule } = props

const {
  gridData,
  isChecklistLoading: isLoading,
  selectedRuleId,
  asset,
  revisionInfo,
  accessMode,
  ruleLookupMap,
  fieldSettings,
  canAccept,
  collectionId,
  assetId,
} = toRefs(props)

const selectedRow = computed(() => {
  if (!selectedRuleId.value || !gridData.value) {
    return null
  }
  return ruleLookupMap.value.get(selectedRuleId.value) ?? null
})
const reviewEditPopover = ref()
const popoverAnchor = ref(null)
const editingRow = ref(null)

const currentReview = computed(() => gridData.value.find(r => r.ruleId === editingRow.value?.ruleId) ?? null)

const { isLoading: isSavingReview, execute: executeSaveReview } = useAsyncState(
  async ({ ruleId, result, detail, comment, status }) => {
    const row = gridData.value.find(r => r.ruleId === ruleId)
    const resultChanged = row ? result !== row.result : true
    const body = {
      result,
      detail: detail ?? '',
      comment: comment ?? '',
      resultEngine: resultChanged ? null : (row?.resultEngine ?? null),
      status: status || 'saved',
    }
    const saved = await putReview(collectionId.value, assetId.value, ruleId, body)
    emit('review-saved', { ...saved, ruleId })
    return saved
  },
  { immediate: false },
)

const { isLoading: isSavingStatus, execute: executeSaveStatus } = useAsyncState(
  async ({ ruleId, actionType }) => {
    const status = statusPayloadForAction(actionType)
    if (status === null) return null
    const saved = await patchReview(collectionId.value, assetId.value, ruleId, { status })
    emit('review-saved', { ...saved, ruleId })
    return saved
  },
  { immediate: false },
)

const isSaving = computed(() => isSavingReview.value || isSavingStatus.value)

function onPopoverSave(payload) {
  if (!editingRow.value) return
  executeSaveReview({
    ruleId: payload.ruleId,
    result: payload.result,
    detail: payload.detail,
    comment: payload.comment,
    status: payload.status,
  })
}

function onPopoverStatusAction(payload) {
  if (!editingRow.value) return
  executeSaveStatus({ ruleId: payload.ruleId, actionType: payload.actionType })
}

const route = useRoute()

const TOGGLEABLE_COLUMNS = [
  { field: 'groupTitle', header: 'Group Title' },
  { field: 'ruleTitle', header: 'Rule Title' },
  { field: 'detail', header: 'Detail' },
  { field: 'comment', header: 'Comment' },
  { field: 'touchTs', icon: 'pi pi-clock' },
]

const DISPLAY_MODE_ID_FIELD = {
  groupRule: 'groupId',
  groupGroup: 'groupId',
  ruleRule: 'ruleId',
}

const DISPLAY_MODE_TITLE_FIELD = {
  groupRule: 'ruleTitle',
  groupGroup: 'groupTitle',
  ruleRule: 'ruleTitle',
}

const selectedColumns = ref(TOGGLEABLE_COLUMNS.filter(c => c.field !== 'groupTitle'))
const displayMode = ref('groupRule')

watch(displayMode, (mode) => {
  const titleField = DISPLAY_MODE_TITLE_FIELD[mode]
  selectedColumns.value = TOGGLEABLE_COLUMNS.filter(c => {
    if (c.field === 'groupTitle' || c.field === 'ruleTitle') return c.field === titleField
    return selectedColumns.value.some(s => s.field === c.field)
  })
})

const visibleFields = computed(() => {
  const fields = new Set(['severity', 'result', 'resultEngine', 'status'])
  const idField = DISPLAY_MODE_ID_FIELD[displayMode.value]
  if (idField) fields.add(idField)
  for (const col of selectedColumns.value) fields.add(col.field)
  return fields
})

const { lineClamp, itemSize } = useGridDensity('asset-review-checklist', 3, 6, 15)

const localSearchFilter = computed({
  get: () => props.searchFilter,
  set: (val) => emit('update:searchFilter', val)
})

watch([
  () => route.params.collectionId,
  () => route.params.assetId,
  () => route.params.benchmarkId,
  () => route.params.revisionStr,
], () => {
  localSearchFilter.value = ''
})

function openRowEditor(event, rowData) {
  const isSameRow = editingRow.value?.ruleId === rowData.ruleId
  const wasOpen = !!editingRow.value

  editingRow.value = rowData

  const row = event.target?.closest ? event.target.closest('tr') : null
  const rowRect = row ? row.getBoundingClientRect() : { top: 0, bottom: 0, height: 0 }
  const clickX = event.clientX

  if (popoverAnchor.value) {
    popoverAnchor.value.style.left = `${clickX}px`
    popoverAnchor.value.style.top = `${rowRect.top}px`
    popoverAnchor.value.style.height = `${rowRect.height}px`
  }

  const anchorEvent = {
    currentTarget: popoverAnchor.value,
    target: popoverAnchor.value,
    clientX: clickX,
  }

  if (isSameRow) {
    reviewEditPopover.value.toggle(anchorEvent)
  }
  else if (wasOpen) {
    reviewEditPopover.value.reposition(anchorEvent)
  }
  else {
    reviewEditPopover.value.show(anchorEvent)
  }
}


const scrollLocked = computed(() => !!editingRow.value && !!reviewEditPopover.value?.isDirty)

function onGridWheel(event) {
  if (scrollLocked.value) {
    event.preventDefault()
  }
}

function onGridScroll() {
  if (!editingRow.value) {
    return
  }
  reviewEditPopover.value?.hide()
}

watch(() => gridData.value, (data) => {
  if (!data?.length) {
    selectRule(null)
    return
  }

  const isValid = selectedRuleId.value && data.some(r => r.ruleId === selectedRuleId.value)

  if (!isValid) {
    const firstVisible = data[0]
    if (firstVisible) {
      selectRule(firstVisible.ruleId)
    }
  }

  if (editingRow.value) {
    const updated = ruleLookupMap.value.get(editingRow.value.ruleId)
    if (updated) {
      editingRow.value = updated
    }
  }
})

function guardUnsaved(targetRuleId) {
  const isSameRow = editingRow.value?.ruleId === targetRuleId
  if (!isSameRow && reviewEditPopover.value?.isDirty) {
    reviewEditPopover.value.triggerUnsavedWarning()
    return false
  }
  return true
}

function onSelectionChange(newRow) {
  if (!newRow) {
    return
  }
  if (!guardUnsaved(newRow.ruleId)) {
    return
  }
  selectRule(newRow.ruleId)
}

function onRowClick(event) {
  event.originalEvent?.stopPropagation()
  if (!guardUnsaved(event.data.ruleId)) {
    return
  }
  selectRule(event.data.ruleId)
  openRowEditor(event.originalEvent || event, event.data)
}


</script>

<template>
  <div
    class="checklist-grid" :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }"
    @scroll.capture="onGridScroll" @wheel.capture="onGridWheel"
  >
    <AssetChecklistGridHeader
      v-model:search-filter="localSearchFilter"
      v-model:display-mode="displayMode"
      v-model:selected-columns="selectedColumns"
      :toggleable-columns="TOGGLEABLE_COLUMNS"
      :asset="asset" :revision-info="revisionInfo" :is-loading="isLoading"
      :access-mode="accessMode" @refresh="emit('refresh')"
    />

    <AssetChecklistGridTable
      :selected-row="selectedRow" :grid-data="gridData" :is-loading="isLoading"
      :search-filter="localSearchFilter"
      :visible-fields="visibleFields"
      :item-size="itemSize"
      @update:selected-row="onSelectionChange" @row-click="onRowClick"
      @refresh="emit('refresh')"
    />

    <ReviewEditPopover
      ref="reviewEditPopover"
      :current-review="currentReview"
      :selected-rule-id="selectedRuleId"
      :collection-id="collectionId"
      :asset-id="assetId"
      :field-settings="fieldSettings"
      :access-mode="accessMode"
      :can-accept="canAccept"
      :is-saving="isSaving"
      @save="onPopoverSave"
      @status-action="onPopoverStatusAction"
      @close="editingRow = null"
    />

    <div
      ref="popoverAnchor"
      class="popover-anchor"
      style="position: fixed; width: 0px; pointer-events: none; visibility: hidden; z-index: -1;"
    />
  </div>
</template>

<style scoped>
.checklist-grid {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.footer-divider {
  color: var(--color-border-default);
  margin: 0 0.25rem;
  font-weight: 300;
}
</style>
