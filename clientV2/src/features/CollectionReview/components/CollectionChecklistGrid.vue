<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import Popover from 'primevue/popover'
import { computed, ref, watch } from 'vue'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import CatBadge from '../../../components/common/CatBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useChecklistDisplayMode } from '../../../shared/composables/useChecklistDisplayMode.js'
import { durationToNow } from '../../../shared/lib.js'
import { severityMap } from '../../AssetReview/lib/checklistUtils.js'

const props = defineProps({
  checklistData: {
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
  stats: {
    type: Object,
    default: null,
  },
  headerTitle: {
    type: String,
    default: 'Checklist',
  },
})

const emit = defineEmits(['select-rule', 'refresh'])

// --- Display mode ---
const {
  displayModeItems,
  showGroupId,
  showRuleId,
  showRuleTitle,
  showGroupTitle,
  lineClamp,
  itemSize,
  increaseRowHeight,
  decreaseRowHeight,
} = useChecklistDisplayMode()

// --- Column visibility toggle ---
const toggleableColumns = [
  { field: 'counts.results.fail', header: 'O', title: 'Open', labelClass: 'col-header--open' },
  { field: 'counts.results.pass', header: 'NF', title: 'Not a Finding', labelClass: 'col-header--nf' },
  { field: 'counts.results.notapplicable', header: 'NA', title: 'Not Applicable' },
  { field: 'counts.results.other', header: 'NR+', title: 'Not Reviewed / Other', labelClass: 'col-header--nr' },
  { field: 'counts.statuses.submitted', header: 'Submitted', title: 'Submitted', icon: 'pi pi-check', labelClass: 'col-header-icon--submitted' },
  { field: 'counts.statuses.rejected', header: 'Rejected', title: 'Rejected', icon: 'pi pi-times-circle', labelClass: 'col-header-icon--rejected' },
  { field: 'counts.statuses.accepted', header: 'Accepted', title: 'Accepted', icon: 'pi pi-star', labelClass: 'col-header-icon--accepted' },
  { field: 'oldest', header: 'Oldest', title: 'Oldest review activity' },
  { field: 'newest', header: 'Newest', title: 'Newest review activity' },
]
const visibleColumnFields = ref(new Set(
  toggleableColumns
    .filter(c => !['oldest', 'newest'].includes(c.field))
    .map(c => c.field),
))

function isColumnVisible(field) {
  return visibleColumnFields.value.has(field)
}

function toggleColumn(field) {
  const s = new Set(visibleColumnFields.value)
  if (s.has(field)) {
    s.delete(field)
  }
  else {
    s.add(field)
  }
  visibleColumnFields.value = s
}

// --- Controlled sorting ---
const sortField = ref('groupId')
const sortOrder = ref(1)

// --- Column toggle popover ---
const columnTogglePopover = ref()

function toggleColumnPopover(event) {
  columnTogglePopover.value.toggle(event)
}

// --- Checklist menu ---
const checklistMenu = ref()

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

// --- Column header menu ---
const headerMenu = ref()
const activeHeaderField = ref(null)

const headerMenuItems = computed(() => [
  {
    label: 'Sort Ascending',
    icon: 'pi pi-sort-amount-up',
    command: () => {
      sortField.value = activeHeaderField.value
      sortOrder.value = 1
    },
  },
  {
    label: 'Sort Descending',
    icon: 'pi pi-sort-amount-down',
    command: () => {
      sortField.value = activeHeaderField.value
      sortOrder.value = -1
    },
  },
])

function openHeaderMenu(event, field) {
  activeHeaderField.value = field
  headerMenu.value.toggle(event)
}

// --- Row selection ---
const selectedRow = ref(null)

watch(() => props.selectedRuleId, (ruleId) => {
  if (!ruleId) {
    selectedRow.value = null
    return
  }
  const item = props.checklistData?.find(r => r.ruleId === ruleId)
  if (item) {
    selectedRow.value = item
  }
})

function onRowClick(event) {
  emit('select-rule', event.data.ruleId)
}

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    emit('refresh')
  }
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'fixed' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
}

function countDisplay(val) {
  return val > 0 ? val : '\u2014'
}
</script>

<template>
  <div class="checklist-grid" :style="{ '--line-clamp': lineClamp, '--item-size': `${itemSize}px` }">
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
        <button
          class="checklist-grid__icon-btn"
          title="Decrease row height"
          :disabled="lineClamp <= 1"
          @click="decreaseRowHeight"
        >
          <img :src="lineHeightDown" alt="Decrease row height">
        </button>
        <button
          class="checklist-grid__icon-btn"
          title="Increase row height"
          :disabled="lineClamp >= 10"
          @click="increaseRowHeight"
        >
          <img :src="lineHeightUp" alt="Increase row height">
        </button>
        <button
          class="checklist-grid__icon-btn"
          title="Toggle columns"
          @click="toggleColumnPopover"
        >
          <i class="pi pi-th-large" />
        </button>
        <Popover ref="columnTogglePopover">
          <div class="column-toggle-header">
            Columns
          </div>
          <div class="column-toggle-list">
            <div
              v-for="col in toggleableColumns"
              :key="col.field"
              class="column-toggle-item"
              :title="col.title"
              @click="toggleColumn(col.field)"
            >
              <i
                class="pi"
                :class="isColumnVisible(col.field) ? 'pi-check-square column-toggle-item__check--active' : 'pi-stop'"
              />
              <span :class="col.labelClass">
                <i v-if="col.icon" :class="col.icon" />
                {{ col.header }}
              </span>
            </div>
          </div>
        </Popover>
      </div>
    </div>

    <DataTable
      v-model:selection="selectedRow"
      :value="checklistData"
      :loading="isLoading"
      data-key="ruleId"
      selection-mode="single"
      scrollable
      scroll-height="flex"
      :virtual-scroller-options="{ itemSize }"
      striped-rows
      :sort-field="sortField"
      :sort-order="sortOrder"
      class="checklist-grid__table"
      :pt="dataTablePt"
      @row-click="onRowClick"
    >
      <Column field="severity" :style="{ width: '5rem' }">
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'severity')">
            CAT
            <i v-if="sortField === 'severity'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <CatBadge :category="severityMap[data.severity]" variant="label" />
        </template>
      </Column>

      <Column
        v-if="showGroupId"
        field="groupId"
        :style="{ width: '7rem' }"
      >
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'groupId')">
            Group
            <i v-if="sortField === 'groupId'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.groupId }}</span>
        </template>
      </Column>

      <Column
        v-if="showRuleId"
        field="ruleId"
        :style="{ width: '16rem' }"
      >
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'ruleId')">
            Rule Id
            <i v-if="sortField === 'ruleId'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="cell-text--mono">{{ data.ruleId }}</span>
        </template>
      </Column>

      <Column
        v-if="showRuleTitle"
        field="ruleTitle"
      >
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'ruleTitle')">
            Rule Title
            <i v-if="sortField === 'ruleTitle'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="cell-text--clamped" :title="data.ruleTitle">{{ data.ruleTitle }}</span>
        </template>
      </Column>

      <Column
        v-if="showGroupTitle"
        field="groupTitle"
      >
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'groupTitle')">
            Group Title
            <i v-if="sortField === 'groupTitle'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="cell-text--clamped" :title="data.groupTitle">{{ data.groupTitle }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.results.fail')"
        field="counts.results.fail"
        :style="{ width: '3.5rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger col-header--open" title="Open" @click.stop="openHeaderMenu($event, 'counts.results.fail')">
            O
            <i v-if="sortField === 'counts.results.fail'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span
            class="count-cell"
            :class="{ 'count-cell--open-active': data.counts?.results?.fail > 0 }"
          >{{ countDisplay(data.counts?.results?.fail) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.results.pass')"
        field="counts.results.pass"
        :style="{ width: '3.5rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger col-header--nf" title="Not a Finding" @click.stop="openHeaderMenu($event, 'counts.results.pass')">
            NF
            <i v-if="sortField === 'counts.results.pass'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="count-cell">{{ countDisplay(data.counts?.results?.pass) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.results.notapplicable')"
        field="counts.results.notapplicable"
        :style="{ width: '3.5rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger" title="Not Applicable" @click.stop="openHeaderMenu($event, 'counts.results.notapplicable')">
            NA
            <i v-if="sortField === 'counts.results.notapplicable'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="count-cell">{{ countDisplay(data.counts?.results?.notapplicable) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.results.other')"
        field="counts.results.other"
        :style="{ width: '3.5rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger col-header--nr" title="Not Reviewed / Other" @click.stop="openHeaderMenu($event, 'counts.results.other')">
            NR+
            <i v-if="sortField === 'counts.results.other'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span
            class="count-cell"
            :class="{ 'count-cell--nr-active': data.counts?.results?.other > 0 }"
          >{{ countDisplay(data.counts?.results?.other) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.statuses.submitted')"
        field="counts.statuses.submitted"
        :style="{ width: '3rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger" title="Submitted" @click.stop="openHeaderMenu($event, 'counts.statuses.submitted')">
            <i class="pi pi-check col-header-icon--submitted" />
            <i v-if="sortField === 'counts.statuses.submitted'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="count-cell count-cell--dim">{{ countDisplay(data.counts?.statuses?.submitted) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.statuses.rejected')"
        field="counts.statuses.rejected"
        :style="{ width: '3rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger" title="Rejected" @click.stop="openHeaderMenu($event, 'counts.statuses.rejected')">
            <i class="pi pi-times-circle col-header-icon--rejected" />
            <i v-if="sortField === 'counts.statuses.rejected'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="count-cell count-cell--dim">{{ countDisplay(data.counts?.statuses?.rejected) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('counts.statuses.accepted')"
        field="counts.statuses.accepted"
        :style="{ width: '3rem', textAlign: 'center' }"
      >
        <template #header>
          <span class="col-header-trigger" title="Accepted" @click.stop="openHeaderMenu($event, 'counts.statuses.accepted')">
            <i class="pi pi-star col-header-icon--accepted" />
            <i v-if="sortField === 'counts.statuses.accepted'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span class="count-cell count-cell--dim">{{ countDisplay(data.counts?.statuses?.accepted) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('oldest')"
        field="timestamps.touchTs.min"
        :style="{ width: '5rem' }"
      >
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'timestamps.touchTs.min')">
            Oldest
            <i v-if="sortField === 'timestamps.touchTs.min'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span :title="data.timestamps?.touchTs?.min">{{ durationToNow(data.timestamps?.touchTs?.min) }}</span>
        </template>
      </Column>

      <Column
        v-if="isColumnVisible('newest')"
        field="timestamps.touchTs.max"
        :style="{ width: '5rem' }"
      >
        <template #header>
          <span class="col-header-trigger" @click.stop="openHeaderMenu($event, 'timestamps.touchTs.max')">
            Newest
            <i v-if="sortField === 'timestamps.touchTs.max'" class="pi" :class="sortOrder === 1 ? 'pi-sort-amount-up' : 'pi-sort-amount-down'" />
          </span>
        </template>
        <template #body="{ data }">
          <span :title="data.timestamps?.touchTs?.max">{{ durationToNow(data.timestamps?.touchTs?.max) }}</span>
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
            <StatusBadge status="submitted" :count="stats.statuses.submitted" />
            <StatusBadge status="accepted" :count="stats.statuses.accepted" />
            <StatusBadge status="rejected" :count="stats.statuses.rejected" />
          </template>
        </StatusFooter>
      </template>
    </DataTable>

    <Menu
      ref="headerMenu"
      :model="headerMenuItems"
      :popup="true"
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

.checklist-grid__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: 1px solid transparent;
  border-radius: 3px;
  padding: 0.15rem;
  cursor: pointer;
  opacity: 0.8;
}

.checklist-grid__icon-btn:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-border-light);
}

.checklist-grid__icon-btn:disabled {
  opacity: 0.3;
  cursor: default;
}

.checklist-grid__icon-btn img {
  width: 16px;
  height: 16px;
}

.checklist-grid__table {
  flex: 1;
  min-height: 0;
}

:deep(.p-datatable-tbody > tr > td) {
  vertical-align: top;
  padding: 0.15rem 0.35rem;
  overflow: hidden;
}

:deep(.p-datatable-thead > tr > th) {
  padding: 0.2rem 0.35rem;
}

/* Cell styles */
.cell-text--mono {
  font-size: 1.2rem;
  font-family: monospace;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  -webkit-line-clamp: var(--line-clamp, 3);
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--color-text-primary);
  word-break: break-word;
  line-height: 1.3;
}

/* Count columns */
.count-cell {
  display: block;
  text-align: center;
  color: var(--color-text-dim);
}

.count-cell--open-active {
  color: var(--result-fail);
  font-weight: 600;
}

.count-cell--nr-active {
  color: var(--result-fail);
  font-weight: 600;
}

.count-cell--dim {
  color: var(--color-text-dim);
}

/* Column toggle popover */
.column-toggle-header {
  font-weight: 600;
  padding: 0.35rem 0.6rem;
  border-bottom: 1px solid var(--color-border-light);
  margin-bottom: 0.25rem;
  color: var(--color-text-primary);
}

.column-toggle-list {
  display: flex;
  flex-direction: column;
  min-width: 10rem;
}

.column-toggle-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  cursor: pointer;
  user-select: none;
  border-radius: 3px;
  transition: background-color 0.15s;
}

.column-toggle-item:hover {
  background-color: var(--color-bg-hover-strong);
}

.column-toggle-item i {
  color: var(--color-text-dim);
}

.column-toggle-item__check--active {
  color: var(--color-primary-highlight) !important;
}

/* Column header trigger */
.col-header-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
  font-weight: 600;
  user-select: none;
  width: 100%;
}

.col-header-trigger:hover {
  color: var(--color-primary-highlight);
}

.col-header-trigger .pi-sort-amount-up,
.col-header-trigger .pi-sort-amount-down {
  font-size: 0.85rem;
  color: var(--color-primary-highlight);
}

/* Column header colors */
.col-header--open {
  color: var(--result-fail);
}

.col-header--nf {
  color: var(--color-shield-green-dark);
}

.col-header--nr {
  color: var(--result-fail);
}

.col-header-icon--submitted {
  color: var(--color-action-blue);
}

.col-header-icon--rejected {
  color: var(--result-fail);
}

.col-header-icon--accepted {
  color: var(--color-shield-green-dark);
}

.footer-divider {
  color: var(--color-border-light);
}
</style>
