<script setup>
import Button from 'primevue/button'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import Menu from 'primevue/menu'
import Splitter from 'primevue/splitter'
import SplitterPanel from 'primevue/splitterpanel'
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import lineHeightDown from '../../../assets/line-height-down.svg'
import lineHeightUp from '../../../assets/line-height-up.svg'
import CatBadge from '../../../components/common/CatBadge.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { useAsyncState } from '../../../shared/composables/useAsyncState.js'
import { useChecklistDisplayMode } from '../../../shared/composables/useChecklistDisplayMode.js'
import { durationToNow } from '../../../shared/lib.js'
import RuleInfo from '../../AssetReview/components/RuleInfo.vue'
import { severityMap } from '../../AssetReview/lib/checklistUtils.js'
import { fetchCollectionChecklist, fetchRuleContent } from '../api/collectionReviewApi.js'

const route = useRoute()

const collectionId = computed(() => route.params.collectionId)
const benchmarkId = computed(() => route.params.benchmarkId)
const revisionStr = computed(() => route.params.revisionStr)

// --- Display mode (shared with AssetReview ChecklistGrid) ---
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

// --- Timestamp column visibility ---
const showOldest = ref(false)
const showNewest = ref(false)

// --- Checklist menu items ---
const checklistMenu = ref()
const checklistMenuItems = computed(() => [
  ...displayModeItems.value,
  {
    label: 'Columns',
    items: [
      {
        label: 'Oldest',
        icon: () => showOldest.value ? 'pi pi-check-square' : 'pi pi-stop',
        command: () => { showOldest.value = !showOldest.value },
      },
      {
        label: 'Newest',
        icon: () => showNewest.value ? 'pi pi-check-square' : 'pi pi-stop',
        command: () => { showNewest.value = !showNewest.value },
      },
    ],
  },
])

function toggleChecklistMenu(event) {
  checklistMenu.value.toggle(event)
}

// --- Checklist data ---
const { state: checklistData, isLoading: isChecklistLoading, execute: loadChecklist } = useAsyncState(
  () => fetchCollectionChecklist(collectionId.value, benchmarkId.value, revisionStr.value),
  { initialState: [], immediate: false },
)

// --- Rule content for info panel ---
const selectedRuleId = ref(null)
const selectedRow = ref(null)

const { state: ruleContent, isLoading: isRuleLoading, execute: loadRuleContent } = useAsyncState(
  () => fetchRuleContent(benchmarkId.value, revisionStr.value, selectedRuleId.value),
  { immediate: false, onError: null },
)

// Selected checklist item (for RuleInfo header)
const selectedChecklistItem = computed(() => {
  if (!selectedRuleId.value || !checklistData.value?.length) {
    return null
  }
  return checklistData.value.find(r => r.ruleId === selectedRuleId.value) || null
})

// --- Load data on route change ---
watch([collectionId, benchmarkId, revisionStr], () => {
  selectedRuleId.value = null
  selectedRow.value = null
  ruleContent.value = null
  if (collectionId.value && benchmarkId.value && revisionStr.value) {
    loadChecklist()
  }
}, { immediate: true })

// --- Rule selection ---
function selectRule(ruleId) {
  if (selectedRuleId.value === ruleId) {
    return
  }
  selectedRuleId.value = ruleId
  if (ruleId && benchmarkId.value && revisionStr.value) {
    loadRuleContent()
  }
}

function onRowClick(event) {
  selectRule(event.data.ruleId)
}

// Sync selectedRow when selectedRuleId changes
watch(selectedRuleId, (ruleId) => {
  if (!ruleId) {
    selectedRow.value = null
    return
  }
  const item = checklistData.value?.find(r => r.ruleId === ruleId)
  if (item) {
    selectedRow.value = item
  }
})

// --- Aggregate stats ---
const stats = computed(() => {
  const data = checklistData.value
  if (!data?.length) {
    return null
  }

  const results = { fail: 0, pass: 0, notapplicable: 0, other: 0 }
  const statuses = { saved: 0, submitted: 0, accepted: 0, rejected: 0 }

  for (const item of data) {
    results.fail += item.counts?.results?.fail || 0
    results.pass += item.counts?.results?.pass || 0
    results.notapplicable += item.counts?.results?.notapplicable || 0
    results.other += item.counts?.results?.other || 0
    statuses.saved += item.counts?.statuses?.saved || 0
    statuses.submitted += item.counts?.statuses?.submitted || 0
    statuses.accepted += item.counts?.statuses?.accepted || 0
    statuses.rejected += item.counts?.statuses?.rejected || 0
  }

  return { results, statuses, total: data.length }
})

function handleFooterAction(actionKey) {
  if (actionKey === 'refresh') {
    loadChecklist()
  }
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'fixed' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
}

// Cell display helpers
function countDisplay(val) {
  return val > 0 ? val : '\u2014'
}
</script>

<template>
  <div class="collection-review">
    <div class="collection-review__content">
      <Splitter
        :pt="{
          gutter: { style: 'background: var(--color-border-dark)' },
          root: { style: 'border: none; background: transparent' },
        }"
        style="height: 100%"
      >
        <!-- Left: Rule Table + Asset Reviews (vertical split) -->
        <SplitterPanel :size="70" :min-size="40">
          <Splitter
            layout="vertical"
            :pt="{
              gutter: { style: 'background: var(--color-border-dark)' },
              root: { style: 'border: none; background: transparent' },
            }"
            style="height: 100%"
          >
            <!-- Top: Rule Checklist Table -->
            <SplitterPanel :size="50" :min-size="20">
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
                      :model="checklistMenuItems"
                      :popup="true"
                    />
                    <span class="checklist-grid__title">{{ benchmarkId }} {{ revisionStr }}</span>
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
                  </div>
                </div>

                <DataTable
                  v-model:selection="selectedRow"
                  :value="checklistData"
                  :loading="isChecklistLoading"
                  data-key="ruleId"
                  selection-mode="single"
                  scrollable
                  scroll-height="flex"
                  :virtual-scroller-options="{ itemSize }"
                  striped-rows
                  sort-field="groupId"
                  :sort-order="1"
                  class="checklist-grid__table"
                  :pt="dataTablePt"
                  @row-click="onRowClick"
                >
                  <Column header="CAT" field="severity" sortable :style="{ width: '5rem' }">
                    <template #body="{ data }">
                      <CatBadge :category="severityMap[data.severity]" variant="label" />
                    </template>
                  </Column>

                  <Column
                    v-if="showGroupId"
                    header="Group"
                    field="groupId"
                    sortable
                    :style="{ width: '7rem' }"
                  >
                    <template #body="{ data }">
                      <span class="cell-text--mono">{{ data.groupId }}</span>
                    </template>
                  </Column>

                  <Column
                    v-if="showRuleId"
                    header="Rule Id"
                    field="ruleId"
                    sortable
                    :style="{ width: '16rem' }"
                  >
                    <template #body="{ data }">
                      <span class="cell-text--mono">{{ data.ruleId }}</span>
                    </template>
                  </Column>

                  <Column
                    v-if="showRuleTitle"
                    header="Rule Title"
                    field="ruleTitle"
                    sortable
                  >
                    <template #body="{ data }">
                      <span class="cell-text--clamped" :title="data.ruleTitle">{{ data.ruleTitle }}</span>
                    </template>
                  </Column>

                  <Column
                    v-if="showGroupTitle"
                    header="Group Title"
                    field="groupTitle"
                    sortable
                  >
                    <template #body="{ data }">
                      <span class="cell-text--clamped" :title="data.groupTitle">{{ data.groupTitle }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.results.fail"
                    sortable
                    :style="{ width: '3.5rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <span class="col-header col-header--open" title="Open">O</span>
                    </template>
                    <template #body="{ data }">
                      <span
                        class="count-cell"
                        :class="{ 'count-cell--open-active': data.counts?.results?.fail > 0 }"
                      >{{ countDisplay(data.counts?.results?.fail) }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.results.pass"
                    sortable
                    :style="{ width: '3.5rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <span class="col-header col-header--nf" title="Not a Finding">NF</span>
                    </template>
                    <template #body="{ data }">
                      <span class="count-cell">{{ countDisplay(data.counts?.results?.pass) }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.results.notapplicable"
                    sortable
                    :style="{ width: '3.5rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <span class="col-header" title="Not Applicable">NA</span>
                    </template>
                    <template #body="{ data }">
                      <span class="count-cell">{{ countDisplay(data.counts?.results?.notapplicable) }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.results.other"
                    sortable
                    :style="{ width: '3.5rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <span class="col-header col-header--nr" title="Not Reviewed / Other">NR+</span>
                    </template>
                    <template #body="{ data }">
                      <span
                        class="count-cell"
                        :class="{ 'count-cell--nr-active': data.counts?.results?.other > 0 }"
                      >{{ countDisplay(data.counts?.results?.other) }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.statuses.submitted"
                    sortable
                    :style="{ width: '3rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <i class="pi pi-check col-header-icon col-header-icon--submitted" title="Submitted" />
                    </template>
                    <template #body="{ data }">
                      <span class="count-cell count-cell--dim">{{ countDisplay(data.counts?.statuses?.submitted) }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.statuses.rejected"
                    sortable
                    :style="{ width: '3rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <i class="pi pi-times-circle col-header-icon col-header-icon--rejected" title="Rejected" />
                    </template>
                    <template #body="{ data }">
                      <span class="count-cell count-cell--dim">{{ countDisplay(data.counts?.statuses?.rejected) }}</span>
                    </template>
                  </Column>

                  <Column
                    field="counts.statuses.accepted"
                    sortable
                    :style="{ width: '3rem', textAlign: 'center' }"
                  >
                    <template #header>
                      <i class="pi pi-star col-header-icon col-header-icon--accepted" title="Accepted" />
                    </template>
                    <template #body="{ data }">
                      <span class="count-cell count-cell--dim">{{ countDisplay(data.counts?.statuses?.accepted) }}</span>
                    </template>
                  </Column>

                  <!-- Toggleable timestamp columns -->
                  <Column
                    v-if="showOldest"
                    field="timestamps.touchTs.min"
                    sortable
                    :style="{ width: '5rem' }"
                  >
                    <template #header>
                      <span title="Oldest review activity">Oldest</span>
                    </template>
                    <template #body="{ data }">
                      <span :title="data.timestamps?.touchTs?.min">{{ durationToNow(data.timestamps?.touchTs?.min) }}</span>
                    </template>
                  </Column>

                  <Column
                    v-if="showNewest"
                    field="timestamps.touchTs.max"
                    sortable
                    :style="{ width: '5rem' }"
                  >
                    <template #header>
                      <span title="Newest review activity">Newest</span>
                    </template>
                    <template #body="{ data }">
                      <span :title="data.timestamps?.touchTs?.max">{{ durationToNow(data.timestamps?.touchTs?.max) }}</span>
                    </template>
                  </Column>

                  <template v-if="stats" #footer>
                    <StatusFooter
                      :refresh-loading="isChecklistLoading"
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
              </div>
            </SplitterPanel>

            <!-- Bottom: Asset Reviews Table -->
            <SplitterPanel :size="50" :min-size="20">
              <div class="cr-panel">
                <div class="cr-panel__header">
                  <span v-if="selectedRuleId" class="cr-panel__title">
                    Reviews of {{ selectedRuleId }}
                  </span>
                  <span v-else class="cr-panel__title cr-panel__title--dim">
                    Select a rule to view reviews
                  </span>
                </div>

                <div class="cr-panel__toolbar">
                  <button type="button" class="cr-action-btn" disabled title="Accept">
                    <i class="pi pi-star" />
                    <span>Accept</span>
                  </button>
                  <button type="button" class="cr-action-btn" disabled title="Reject">
                    <i class="pi pi-ban" />
                    <span>Reject</span>
                  </button>
                  <span class="cr-toolbar__divider" />
                  <button type="button" class="cr-action-btn" disabled title="Submit">
                    <i class="pi pi-check" />
                    <span>Submit</span>
                  </button>
                  <button type="button" class="cr-action-btn" disabled title="Unsubmit">
                    <i class="pi pi-replay" />
                    <span>Unsubmit</span>
                  </button>
                  <span class="cr-toolbar__divider" />
                  <button type="button" class="cr-action-btn" disabled title="Batch edit">
                    <i class="pi pi-pencil" />
                    <span>Batch edit</span>
                  </button>
                </div>

                <div class="cr-panel__body">
                  <div class="cr-panel__placeholder">
                    <template v-if="selectedRuleId">
                      Asset reviews table
                    </template>
                    <template v-else>
                      Select a rule to view asset reviews
                    </template>
                  </div>
                </div>

                <div class="cr-panel__footer">
                  <div class="cr-panel__footer-left">
                    <button type="button" class="cr-footer-btn" title="Refresh" disabled>
                      <i class="pi pi-refresh" />
                    </button>
                    <button type="button" class="cr-footer-btn" title="Export CSV" disabled>
                      <i class="pi pi-download" />
                      <span>CSV</span>
                    </button>
                  </div>
                  <div class="cr-panel__footer-right">
                    <span class="cr-stat cr-stat--count" title="Reviews">
                      <span class="cr-stat__value">&mdash;</span>
                      <span class="cr-stat__label">reviews</span>
                    </span>
                  </div>
                </div>
              </div>
            </SplitterPanel>
          </Splitter>
        </SplitterPanel>

        <!-- Right: Rule Info Panel -->
        <SplitterPanel :size="30" :min-size="20">
          <RuleInfo
            :rule-content="ruleContent"
            :is-loading="isRuleLoading"
            :selected-checklist-item="selectedChecklistItem"
          />
        </SplitterPanel>
      </Splitter>
    </div>
  </div>
</template>

<style scoped>
.collection-review {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-background-darkest);
  color: var(--color-text-primary);
}

.collection-review__content {
  flex: 1;
  overflow: hidden;
}

/* --- Checklist grid (top panel) --- */
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

/* Cell styles (matching ChecklistGrid) */
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

/* Column headers */
.col-header {
  font-weight: 600;
}

.col-header--open {
  color: var(--result-fail);
}

.col-header--nf {
  color: var(--color-shield-green-dark);
}

.col-header--nr {
  color: var(--result-fail);
}

.col-header-icon {
  font-size: 1rem;
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

/* --- Reviews panel (bottom) --- */
.cr-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-background-subtle);
  border: 1px solid var(--color-border-light);
  border-radius: 4px;
  overflow: hidden;
}

.cr-panel__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cr-panel__title {
  font-weight: 600;
  font-size: 1rem;
  color: var(--color-text-primary);
}

.cr-panel__title--dim {
  color: var(--color-text-dim);
}

.cr-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.3rem 0.5rem;
  background-color: var(--color-background-dark);
  border-bottom: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cr-action-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.3rem 0.6rem;
  background-color: var(--color-background-light);
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  color: var(--color-text-primary);
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.cr-action-btn:hover:not(:disabled) {
  background-color: var(--color-bg-hover-strong);
}

.cr-action-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.cr-action-btn i {
  font-size: 1rem;
}

.cr-toolbar__divider {
  width: 1px;
  height: 1.2rem;
  background-color: var(--color-border-default);
  margin: 0 0.15rem;
}

.cr-panel__body {
  flex: 1;
  overflow: auto;
}

.cr-panel__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-dim);
}

.cr-panel__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0.4rem;
  background-color: var(--color-background-subtle);
  border-top: 1px solid var(--color-border-light);
  flex-shrink: 0;
}

.cr-panel__footer-left {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.cr-panel__footer-right {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.cr-footer-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.15rem 0.35rem;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-dim);
  cursor: pointer;
  transition: color 0.15s, background-color 0.15s;
}

.cr-footer-btn:hover:not(:disabled) {
  color: var(--color-primary-highlight);
  background-color: var(--color-button-hover-bg);
}

.cr-footer-btn:disabled {
  opacity: 0.4;
  cursor: default;
}

.cr-stat {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  padding: 0.1rem 0.3rem;
  border: 1px solid var(--color-border-default);
  border-radius: 2px;
  background-color: var(--color-background-subtle);
}

.cr-stat__label {
  color: var(--color-text-dim);
}

.cr-stat__value {
  font-weight: 600;
  color: var(--color-text-bright);
}

.cr-stat--count {
  background-color: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
  border-color: color-mix(in srgb, var(--color-primary-highlight) 8%, transparent);
}
</style>
