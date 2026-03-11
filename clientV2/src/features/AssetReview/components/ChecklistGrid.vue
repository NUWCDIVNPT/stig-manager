<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import { computed, ref, watch } from 'vue'
import CatBadge from '../../../components/common/CatBadge.vue'
import EngineBadge from '../../../components/common/EngineBadge.vue'
import ManualBadge from '../../../components/common/ManualBadge.vue'
import OverrideBadge from '../../../components/common/OverrideBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import ReviewEditPopover from '../../../components/common/ReviewEditPopover.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'

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

const emit = defineEmits(['select-rule', 'row-save', 'status-action', 'refresh'])

const selectedRow = ref(null)
const checklistMenu = ref()
const reviewEditPopover = ref()
const editingRow = ref(null)
const editingPopoverWidth = ref(null)

function openRowEditor(event, rowData) {
  editingRow.value = rowData
  const row = event.target.closest('tr')
  const resultCell = row?.querySelector('[data-result-cell]')
  const anchorEl = resultCell || event.currentTarget

  // Calculate width: from result cell's left edge to grid container's right edge
  const gridEl = event.target.closest('.checklist-grid')
  if (gridEl && resultCell) {
    const gridRect = gridEl.getBoundingClientRect()
    const cellRect = resultCell.getBoundingClientRect()
    editingPopoverWidth.value = gridRect.right - cellRect.left
  }
  else {
    editingPopoverWidth.value = null
  }

  reviewEditPopover.value.toggle({ currentTarget: anchorEl, target: anchorEl })
}

function onPopoverSave(payload) {
  emit('row-save', payload)
}

function onPopoverStatusAction(payload) {
  emit('status-action', payload)
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
      scrollable
      scroll-height="flex"
      striped-rows
      class="checklist-grid__table"
      @row-select="onRowSelect"
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
            data-result-cell
            class="cell-result cell-result--clickable"
            @click.stop="openRowEditor($event, data)"
          >
            <ResultBadge v-if="getResultDisplay(data.result)" :status="getResultDisplay(data.result)" />
            <span v-else class="cell-result__empty">—</span>
          </div>
        </template>
      </Column>

      <Column header="Detail" field="detail" :style="{ width: '200px' }">
        <template #body="{ data }">
          <div
            class="cell-text-field cell-text-field--clickable"
            @click.stop="openRowEditor($event, data)"
          >
            <span v-if="data.detail" class="cell-text--clamped" :title="data.detail">{{ data.detail }}</span>
            <span v-else class="cell-text--placeholder">Add review...</span>
          </div>
        </template>
      </Column>

      <Column header="Comment" field="comment" :style="{ width: '200px' }">
        <template #body="{ data }">
          <div
            class="cell-text-field cell-text-field--clickable"
            @click.stop="openRowEditor($event, data)"
          >
            <span class="cell-text--clamped" :title="data.comment">{{ data.comment }}</span>
          </div>
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

    <ReviewEditPopover
      ref="reviewEditPopover"
      :row-data="editingRow"
      :width="editingPopoverWidth"
      :field-settings="fieldSettings"
      :access-mode="accessMode"
      :can-accept="canAccept"
      :is-saving="isSaving"
      @save="onPopoverSave"
      @status-action="onPopoverStatusAction"
      @close="editingRow = null"
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

.cell-result--clickable {
  cursor: pointer;
  border-radius: 3px;
  height: 100%;
}

.cell-result--clickable:hover {
  background-color: var(--p-highlight-background);
}

.cell-result__empty {
  color: var(--color-text-dim);
  font-size: 1rem;
  opacity: 0.9;
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

.cell-text-field--clickable {
  cursor: pointer;
  border-radius: 3px;
  height: 100%;
}

.cell-text--placeholder {
  color: var(--color-text-dim);
  font-style: italic;
  opacity: 0.5;
}

.cell-text-field--clickable:hover {
  background-color: var(--p-highlight-background);
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
