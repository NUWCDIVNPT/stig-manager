<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'
import Textarea from 'primevue/textarea'
import { computed, ref, watch } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { getReviewButtonStates } from '../lib/reviewButtonStates.js'

const props = defineProps({
  gridData: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedRuleId: {
    type: String,
    default: null,
  },
  accessMode: {
    type: String,
    default: 'r',
  },
  revisionInfo: {
    type: Object,
    default: null,
  },
  fieldSettings: {
    type: Object,
    default: () => ({
      detail: { enabled: 'always', required: 'always' },
      comment: { enabled: 'always', required: 'findings' },
    }),
  },
  canAccept: {
    type: Boolean,
    default: false,
  },
  isSaving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select-rule', 'cell-edit', 'status-action', 'refresh'])

const selectedRow = ref(null)
const checklistMenu = ref()
const resultPopover = ref()
const editingRow = ref(null)

function openResultPopover(event, rowData) {
  editingRow.value = rowData
  resultPopover.value.toggle(event)
}

function selectResult(newValue) {
  if (editingRow.value && newValue !== editingRow.value.result) {
    emit('cell-edit', { ruleId: editingRow.value.ruleId, field: 'result', newValue })
  }
  resultPopover.value.hide()
  editingRow.value = null
}

// --- Display mode (Group/Rule toggle) ---
const displayMode = ref('groupRule')

const displayModeItems = ref([
  {
    label: 'Group/Rule display',
    items: [
      {
        label: 'Group ID and Rule title',
        icon: () => displayMode.value === 'groupRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'groupRule' },
      },
      {
        label: 'Group ID and Group title',
        icon: () => displayMode.value === 'groupGroup' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'groupGroup' },
      },
      {
        label: 'Rule ID and Rule title',
        icon: () => displayMode.value === 'ruleRule' ? 'pi pi-circle-fill' : 'pi pi-circle',
        command: () => { displayMode.value = 'ruleRule' },
      },
    ],
  },
])

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

// Column visibility based on display mode
const showGroupId = computed(() => displayMode.value !== 'ruleRule')
const showRuleId = computed(() => displayMode.value === 'ruleRule')
const showRuleTitle = computed(() => displayMode.value !== 'groupGroup')
const showGroupTitle = computed(() => displayMode.value === 'groupGroup')

// Map severity to CatBadge category number
const severityMap = { high: 1, medium: 2, low: 3 }

// Map API result values to ResultBadge display codes
const resultDisplayMap = {
  pass: 'NF',
  fail: 'O',
  notapplicable: 'NA',
  notchecked: 'NR',
  informational: 'I',
  unknown: 'NR',
  error: 'NR',
  notselected: 'NR',
  fixed: 'NF',
}

const resultOptions = [
  { value: 'pass', label: 'Not a Finding' },
  { value: 'fail', label: 'Open' },
  { value: 'notapplicable', label: 'Not Applicable' },
  { value: 'informational', label: 'Informational' },
  { value: 'notchecked', label: 'Not Reviewed' },
]

function getResultDisplay(result) {
  if (!result) {
    return null
  }
  return resultDisplayMap[result] || 'NR'
}

function getEngineDisplay(item) {
  if (!item.resultEngine) {
    return null
  }
  if (item.resultEngine.overrides?.length) {
    return 'override'
  }
  return 'engine'
}

function durationToNow(date) {
  if (!date) {
    return '-'
  }
  const d = Math.abs(new Date(date) - new Date()) / 1000
  const days = Math.floor(d / 86400)
  if (days > 0) {
    return `${days} d`
  }
  const hours = Math.floor(d / 3600)
  if (hours > 0) {
    return `${hours} h`
  }
  const minutes = Math.floor(d / 60)
  if (minutes > 0) {
    return `${minutes} m`
  }
  return 'now'
}

// Cell editability logic
function isCellEditable(rowData, field) {
  if (props.accessMode !== 'rw') {
    return false
  }

  const statusLabel = rowData.status?.label ?? rowData.status ?? ''
  const editable = statusLabel === '' || statusLabel === 'saved' || statusLabel === 'rejected'
  if (!editable) {
    return false
  }

  if (field === 'result') {
    return true
  }

  if (field === 'detail' || field === 'comment') {
    if (!rowData.result) {
      return false
    }
    const fieldSetting = props.fieldSettings[field]
    if (fieldSetting?.enabled === 'always') {
      return true
    }
    if (fieldSetting?.enabled === 'findings') {
      return rowData.result === 'fail'
    }
    return false
  }

  return false
}

// Returns true when the row is editable but has no result yet
function needsResultFirst(rowData, field) {
  if (props.accessMode !== 'rw') {
    return false
  }
  const statusLabel = rowData.status?.label ?? rowData.status ?? ''
  if (statusLabel !== '' && statusLabel !== 'saved' && statusLabel !== 'rejected') {
    return false
  }
  if (field !== 'detail' && field !== 'comment') {
    return false
  }
  return !rowData.result
}

// Cell editing events
function onCellEditComplete(event) {
  const { data, newValue, field, value } = event
  if (newValue === value) {
    return
  }
  emit('cell-edit', { ruleId: data.ruleId, field, newValue })
}

// Status action buttons for selected row
const selectedRowStatus = computed(() => {
  if (!selectedRow.value) {
    return ''
  }
  return selectedRow.value.status?.label ?? selectedRow.value.status ?? ''
})

const selectedRowSubmittable = computed(() => {
  if (!selectedRow.value) {
    return false
  }
  const result = selectedRow.value.result
  if (!result || (result !== 'pass' && result !== 'fail' && result !== 'notapplicable')) {
    return false
  }
  const fs = props.fieldSettings
  if (fs.detail?.required === 'always' && !selectedRow.value.detail?.trim()) {
    return false
  }
  if (fs.detail?.required === 'findings' && result === 'fail' && !selectedRow.value.detail?.trim()) {
    return false
  }
  if (fs.comment?.required === 'always' && !selectedRow.value.comment?.trim()) {
    return false
  }
  if (fs.comment?.required === 'findings' && result === 'fail' && !selectedRow.value.comment?.trim()) {
    return false
  }
  return true
})

const buttonStates = computed(() => {
  return getReviewButtonStates({
    accessMode: props.accessMode,
    statusLabel: selectedRowStatus.value,
    isDirty: false,
    isSubmittable: selectedRowSubmittable.value,
    canAccept: props.canAccept,
  })
})

function onStatusAction(actionType) {
  if (selectedRow.value && actionType) {
    emit('status-action', { ruleId: selectedRow.value.ruleId, actionType })
  }
}

// Tally stats
const stats = computed(() => {
  const data = props.gridData
  if (!data?.length) {
    return null
  }

  const results = { pass: 0, fail: 0, notapplicable: 0, other: 0 }
  const engine = { manual: 0, engine: 0, override: 0 }
  const statuses = { saved: 0, submitted: 0, accepted: 0, rejected: 0 }

  for (const item of data) {
    if (item.result === 'pass') {
      results.pass++
    }
    else if (item.result === 'fail') {
      results.fail++
    }
    else if (item.result === 'notapplicable') {
      results.notapplicable++
    }
    else {
      results.other++
    }

    if (item.result) {
      if (!item.resultEngine) {
        engine.manual++
      }
      else if (item.resultEngine.overrides?.length) {
        engine.override++
      }
      else {
        engine.engine++
      }
    }

    const statusLabel = item.status?.label ?? item.status
    if (statusLabel && statuses[statusLabel] !== undefined) {
      statuses[statusLabel]++
    }
  }

  return { results, engine, statuses, total: data.length }
})

// Header display text
const headerTitle = computed(() => {
  if (props.revisionInfo?.display) {
    return props.revisionInfo.display
  }
  return 'Checklist'
})

// Sync selectedRow when selectedRuleId prop changes
watch(() => props.selectedRuleId, (ruleId) => {
  if (!ruleId) {
    selectedRow.value = null
    return
  }
  const item = props.gridData?.find(r => r.ruleId === ruleId)
  if (item && selectedRow.value?.ruleId !== ruleId) {
    selectedRow.value = item
  }
})

// Auto-select first row when data loads
watch(() => props.gridData, (data) => {
  if (data?.length && !props.selectedRuleId) {
    selectedRow.value = data[0]
    emit('select-rule', data[0].ruleId)
  }
})

function onRowSelect(event) {
  emit('select-rule', event.data.ruleId)
}

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
}
</script>

<template>
  <div class="checklist-grid">
    <div class="checklist-grid__header">
      <div class="checklist-grid__header-left">
        <Button
          type="button"
          size="small"
          text
          class="checklist-grid__menu-btn"
          title="Checklist options"
          @click="toggleChecklistMenu"
        >
          <i class="pi pi-list" />
          <span>Checklist</span>
          <i class="pi pi-chevron-down" style="font-size: .8rem; margin-left: 0.15rem" />
        </Button>
        <Menu
          ref="checklistMenu"
          :model="displayModeItems"
          :popup="true"
        />
        <span class="checklist-grid__title">{{ headerTitle }}</span>
      </div>
      <div class="checklist-grid__header-right">
        <Button
          v-if="buttonStates.btn1.visible"
          :label="buttonStates.btn1.text"
          :disabled="!buttonStates.btn1.enabled || isSaving"
          :title="buttonStates.btn1.tooltip"
          size="small"
          severity="secondary"
          outlined
          @click="onStatusAction(buttonStates.btn1.actionType)"
        />
        <Button
          v-if="buttonStates.btn2.visible"
          :label="buttonStates.btn2.text"
          :disabled="!buttonStates.btn2.enabled || isSaving"
          :title="buttonStates.btn2.tooltip"
          size="small"
          :severity="buttonStates.btn2.actionType === 'accept' ? 'warn' : 'primary'"
          @click="onStatusAction(buttonStates.btn2.actionType)"
        />
        <span
          class="checklist-grid__access-badge"
          :class="accessMode === 'rw' ? 'access-rw' : 'access-r'"
        >
          {{ accessMode === 'rw' ? 'Writeable' : 'Read only' }}
        </span>
      </div>
    </div>

    <DataTable
      v-model:selection="selectedRow"
      :value="gridData"
      :loading="isLoading"
      data-key="ruleId"
      selection-mode="single"
      edit-mode="cell"
      scrollable
      scroll-height="flex"
      striped-rows
      class="checklist-grid__table"
      @row-select="onRowSelect"
      @cell-edit-complete="onCellEditComplete"
    >
      <Column header="CAT" field="severity" :style="{ width: '44px', textAlign: 'center' }">
        <template #body="{ data }">
          <CatBadge v-if="data.severity" :category="severityMap[data.severity] || 2" />
        </template>
      </Column>

      <Column
        v-if="showGroupId"
        header="Group"
        field="groupId"
        :style="{ width: '50px' }"
      >
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.groupId }}</span>
        </template>
      </Column>

      <Column
        v-if="showRuleId"
        header="Rule Id"
        field="ruleId"
        :style="{ width: '100px' }"
      >
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.ruleId }}</span>
        </template>
      </Column>

      <Column
        v-if="showRuleTitle"
        header="Rule Title"
        field="ruleTitle"
        :style="{ width: '225px' }"
      >
        <template #body="{ data }">
          <span class="cell-text--clamped" :title="data.ruleTitle">{{ data.ruleTitle }}</span>
        </template>
      </Column>

      <Column
        v-if="showGroupTitle"
        header="Group Title"
        field="groupTitle"
        :style="{ width: '180px' }"
      >
        <template #body="{ data }">
          <span class="cell-text--clamped" :title="data.groupTitle">{{ data.groupTitle }}</span>
        </template>
      </Column>

      <Column header="Result" field="result" :style="{ width: '40px', textAlign: 'center' }">
        <template #body="{ data }">
          <div
            class="cell-result"
            :class="{ 'cell-result--editable': isCellEditable(data, 'result') }"
            @click.stop="isCellEditable(data, 'result') && openResultPopover($event, data)"
          >
            <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
            <span v-else-if="isCellEditable(data, 'result')" class="cell-result__empty">—</span>
          </div>
        </template>
      </Column>

      <Column header="Detail" field="detail" :style="{ width: '200px' }">
        <template #body="{ data }">
          <div class="cell-text-field">
            <span class="cell-text--clamped" :title="data.detail">{{ data.detail }}</span>
            <i v-if="isCellEditable(data, 'detail')" class="pi pi-pencil cell-edit-indicator" />
          </div>
        </template>
        <template #editor="{ data, field }">
          <Textarea
            v-if="isCellEditable(data, field)"
            v-model="data[field]"
            autofocus
            fluid
            rows="3"
            auto-resize
            :maxlength="32767"
          />
          <span
            v-else
            class="cell-text--clamped"
            :title="data.detail"
            @click="needsResultFirst(data, 'detail') && openResultPopover($event, data)"
          >{{ data.detail }}</span>
        </template>
      </Column>

      <Column header="Comment" field="comment" :style="{ width: '200px' }">
        <template #body="{ data }">
          <div class="cell-text-field">
            <span class="cell-text--clamped" :title="data.comment">{{ data.comment }}</span>
            <i v-if="isCellEditable(data, 'comment')" class="pi pi-pencil cell-edit-indicator" />
          </div>
        </template>
        <template #editor="{ data, field }">
          <Textarea
            v-if="isCellEditable(data, field)"
            v-model="data[field]"
            autofocus
            fluid
            rows="3"
            auto-resize
            :maxlength="32767"
          />
          <span
            v-else
            class="cell-text--clamped"
            :title="data.comment"
            @click="needsResultFirst(data, 'comment') && openResultPopover($event, data)"
          >{{ data.comment }}</span>
        </template>
      </Column>

      <Column field="resultEngine" :style="{ width: '24px', textAlign: 'center' }">
        <template #header>
          <img
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="engine-header-icon"
            title="Result engine"
          >
        </template>
        <template #body="{ data }">
          <img
            v-if="getEngineDisplay(data) === 'engine'"
            src="../../../assets/bot2.svg"
            alt="Engine"
            class="engine-icon"
            title="Result engine"
          >
          <img
            v-else-if="getEngineDisplay(data) === 'override'"
            src="../../../assets/override2.svg"
            alt="Override"
            class="engine-icon"
            title="Overridden result"
          >
        </template>
      </Column>

      <Column header="Status" field="status" :style="{ width: '40px', textAlign: 'center' }">
        <template #body="{ data }">
          <StatusBadge v-if="data.status" :status="data.status?.label ?? data.status" />
        </template>
      </Column>

      <Column field="touchTs" :style="{ width: '40px', textAlign: 'center' }">
        <template #header>
          <i class="pi pi-clock" title="Last action" />
        </template>
        <template #body="{ data }">
          <span :title="data.touchTs">{{ durationToNow(data.touchTs) }}</span>
        </template>
      </Column>

      <template v-if="stats" #footer>
        <StatusFooter
          :refresh-loading="isLoading"
          :total-count="stats.total"
          @action="handleFooterAction"
        >
          <template #left-extra>
            <ResultBadge status="O" :count="stats.results.fail" />
            <ResultBadge status="NF" :count="stats.results.pass" />
            <ResultBadge status="NA" :count="stats.results.notapplicable" />
            <ResultBadge status="NR+" :count="stats.results.other" />
            <span class="footer-divider">|</span>
            <ManualBadge :count="stats.engine.manual" />
            <EngineBadge :count="stats.engine.engine" />
            <OverrideBadge :count="stats.engine.override" />
            <span class="footer-divider">|</span>
            <StatusBadge status="saved" :count="stats.statuses.saved" />
            <StatusBadge status="submitted" :count="stats.statuses.submitted" />
            <StatusBadge status="accepted" :count="stats.statuses.accepted" />
            <StatusBadge status="rejected" :count="stats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>

    <Popover ref="resultPopover" append-to="body">
      <ul class="result-popover-list">
        <li
          v-for="opt in resultOptions"
          :key="opt.value"
          class="result-popover-item"
          :class="{ 'result-popover-item--active': editingRow?.result === opt.value }"
          @click="selectResult(opt.value)"
        >
          <ResultBadge :status="getResultDisplay(opt.value)" />
          <span>{{ opt.label }}</span>
        </li>
      </ul>
    </Popover>
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

.checklist-grid__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
  gap: 0.5rem;
}

.checklist-grid__header-left {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  overflow: hidden;
}

.checklist-grid__header-right {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

.checklist-grid__menu-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.4rem;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  flex-shrink: 0;
}

.checklist-grid__menu-btn i:first-child {
  font-size: 1rem;
}

.checklist-grid__title {
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.checklist-grid__access-badge {
  font-weight: 600;
  font-size: 1rem;
  padding: 0.1rem 0.4rem;
  border-radius: 3px;
  flex-shrink: 0;
}

.access-rw {
  background-color: hsl(120deg 40% 25%);
  color: hsl(120deg 60% 75%);
}

.access-r {
  background-color: hsl(0deg 40% 25%);
  color: hsl(0deg 60% 75%);
}

.checklist-grid__table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-table-container) {
  height: 100%;
}

:deep(.p-datatable-tbody > tr > td) {
  vertical-align: top;
  padding: 0.15rem 0.35rem;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.2rem 0.35rem;
}

:deep(.p-datatable-footer) {
  padding: 0;
  border: none;
}

/* Remove padding when cell is in edit mode */
:deep(.p-datatable-tbody > tr > td.p-cell-editing) {
  padding: 0;
}

/* Result popover */
.cell-result--editable {
  cursor: pointer;
  border-radius: 3px;
}

.cell-result--editable:hover {
  background-color: var(--p-highlight-background);
}

.cell-result__empty {
  color: var(--color-text-dim);
  font-size: 1rem;
  opacity: 0.9;
}

.result-popover-list {
  list-style: none;
  margin: 0;
  padding: 0.25rem 0;
}

.result-popover-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.75rem;
  cursor: pointer;
  border-radius: 3px;
  white-space: nowrap;
}

.result-popover-item:hover {
  background-color: var(--p-highlight-background);
}

.result-popover-item--active {
  background-color: var(--p-highlight-background);
}

.cell-text--mono {
  font-size: 1.2rem;
  font-family: monospace;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.3;
}

.cell-result {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}

.cell-text-field {
  display: flex;
  align-items: flex-start;
  gap: 0.25rem;
}

.cell-text-field .cell-text--clamped {
  flex: 1;
  min-width: 0;
}

.cell-edit-indicator {
  font-size: 1rem;
  color: var(--color-text-dim);
  opacity: 0.9;
  flex-shrink: 0;
  margin-top: 0.15rem;
}

.engine-header-icon {
  width: 1rem;
  height: 1rem;
}

.engine-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.7;
  flex-shrink: 0;
}

.footer-divider {
  color: var(--color-border-light);
}
</style>
