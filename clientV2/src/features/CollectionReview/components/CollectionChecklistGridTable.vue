<script setup>
import { FilterMatchMode } from '@primevue/core/api'
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'
import assessmentIcon from '../../../assets/assessment.svg'
import shieldGreenCheck from '../../../assets/shield-green-check.svg'
import targetIcon from '../../../assets/target.svg'
import CatBadge from '../../../components/common/CatBadge.vue'
import ColumnFilter from '../../../components/common/ColumnFilter.vue'
import ResultBadge from '../../../components/common/ResultBadge.vue'
import StatusBadge from '../../../components/common/StatusBadge.vue'
import StatusFooter from '../../../components/common/StatusFooter.vue'
import { durationToNow } from '../../../shared/lib.js'
import { severityMap } from '../../../shared/lib/checklistUtils.js'
import { fieldMatches, highlightText } from '../../../shared/lib/searchUtils.js'

const props = defineProps({
  gridData: {
    type: Array,
    default: () => [],
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  selectedRow: {
    type: Object,
    default: null,
  },
  searchFilter: {
    type: String,
    default: '',
  },
  assetCount: {
    type: Number,
    default: 0,
  },
  visibleFields: {
    type: Set,
    required: true,
  },
  itemSize: {
    type: Number,
    required: true,
  },
})

const emit = defineEmits(['update:selectedRow', 'refresh'])

const dataTableRef = ref(null)

function onFooterAction(key) {
  if (key === 'export') {
    dataTableRef.value?.exportCSV()
  }
  else if (key === 'refresh') {
    emit('refresh')
  }
}

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  severity: { value: null, matchMode: FilterMatchMode.IN },
})

const globalFilterFields = ['groupId', 'groupTitle', 'version', 'ruleId', 'ruleTitle']

watch(() => props.searchFilter, (val) => {
  filters.value.global.value = val || null
})

const filteredData = ref(null)

function onFilter(event) {
  filteredData.value = event.filteredValue
}

const visibleData = computed(() => filteredData.value ?? props.gridData)
const isFiltered = computed(() => filteredData.value !== null && filteredData.value.length !== props.gridData.length)

function sumCounts(data) {
  const results = { fail: 0, pass: 0, notapplicable: 0, other: 0 }
  const statuses = { submitted: 0, rejected: 0, accepted: 0, saved: 0 }

  for (const row of data) {
    const r = row.counts?.results
    const s = row.counts?.statuses
    if (r) {
      results.fail += r.fail ?? 0
      results.pass += r.pass ?? 0
      results.notapplicable += r.notapplicable ?? 0
      results.other += r.other ?? 0
    }
    if (s) {
      statuses.submitted += s.submitted ?? 0
      statuses.rejected += s.rejected ?? 0
      statuses.accepted += s.accepted ?? 0
      statuses.saved += s.saved ?? 0
    }
  }

  return { results, statuses }
}

const footerStats = computed(() => sumCounts(visibleData.value))

const requiredAssessments = computed(() => visibleData.value.length * props.assetCount)

const footerMetrics = computed(() => [
  { key: 'assets', value: props.assetCount, label: 'assets', iconSrc: targetIcon },
  { key: 'assessments', value: requiredAssessments.value, label: 'assessments', iconSrc: assessmentIcon },
])

const catOptions = computed(() => {
  const severities = new Set(props.gridData.map(item => item.severity).filter(Boolean))
  return Array.from(severities).map(val => ({
    value: val,
    label: `Cat ${severityMap[val] ?? val}`,
  })).sort((a, b) => a.label.localeCompare(b.label))
})

function getColumnPt(alignment = 'left') {
  const isCenter = alignment === 'center'
  return {
    headerCell: {
      style: { borderRight: '1px solid var(--color-border-light)' },
      class: isCenter ? 'column-header-center' : 'column-header-left',
    },
    columnHeaderContent: {
      style: {
        fontSize: '1rem',
        color: 'var(--color-text-primary)',
        justifyContent: isCenter ? 'center' : 'flex-start',
        textAlign: isCenter ? 'center' : 'left',
      },
    },
    bodyCell: {
      style: {
        verticalAlign: 'top',
        padding: '0.15rem 0.35rem',
        overflow: 'hidden',
        textAlign: isCenter ? 'center' : 'left',
      },
      class: isCenter ? 'column-body-center' : 'column-body-left',
    },
    bodyCellContent: {
      style: {
        display: 'flex',
        justifyContent: isCenter ? 'center' : 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
      },
    },
  }
}

const columnPt = {
  center: getColumnPt('center'),
  left: getColumnPt('left'),
}

const dataTablePt = {
  tableContainer: { style: { height: '100%' } },
  table: { style: { tableLayout: 'fixed', minWidth: '100%' } },
  bodyRow: { style: { cursor: 'pointer', height: 'var(--item-size)', overflow: 'hidden' } },
  footer: { style: { padding: '0', border: 'none' } },
  emptyMessageCell: { class: 'agg-grid-empty-cell' },
}
</script>

<template>
  <DataTable
    ref="dataTableRef"
    v-model:filters="filters"
    :global-filter-fields="globalFilterFields"
    :value="gridData"
    :loading="isLoading"
    :selection="selectedRow"
    selection-mode="single"
    data-key="ruleId"
    scrollable
    scroll-height="flex"
    :virtual-scroller-options="{ itemSize }"
    resizable-columns
    striped-rows
    class="checklist-grid__table"
    :pt="dataTablePt"
    @update:selection="(val) => emit('update:selectedRow', val)"
    @filter="onFilter"
  >
    <Column field="severity" filter-field="severity" sortable :style="{ width: '3rem', minWidth: '3rem' }" :pt="columnPt.center">
      <template #header>
        <div class="column-header-with-filter">
          Cat
          <ColumnFilter v-model="filters.severity.value" :options="catOptions">
            <template #option="{ option }">
              <CatBadge :category="severityMap[option.value]" variant="label" />
            </template>
          </ColumnFilter>
        </div>
      </template>
      <template #body="{ data }">
        <div class="cell-center">
          <CatBadge :category="severityMap[data.severity]" variant="label" />
        </div>
      </template>
    </Column>
    <Column v-if="visibleFields.has('groupId')" field="groupId" header="Group" sortable :style="{ width: '5rem', minWidth: '5rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.groupId, searchFilter) }">
          <span v-if="searchFilter" v-html="highlightText(data.groupId, searchFilter)" />
          <template v-else>{{ data.groupId }}</template>
        </span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('groupTitle')" field="groupTitle" header="Group Title" sortable :style="{ width: '14rem', minWidth: '14rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span
            class="cell-text cell-text--clamped"
            :class="{ 'cell--match': searchFilter && fieldMatches(data.groupTitle, searchFilter) }"
            :title="data.groupTitle"
          >
            <span v-if="searchFilter" v-html="highlightText(data.groupTitle, searchFilter)" />
            <template v-else>{{ data.groupTitle }}</template>
          </span>
        </div>
      </template>
    </Column>
    <Column v-if="visibleFields.has('version')" field="version" header="STIG Id" sortable :style="{ width: '6rem', minWidth: '6rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.version, searchFilter) }">
          <span v-if="searchFilter" v-html="highlightText(data.version, searchFilter)" />
          <template v-else>{{ data.version }}</template>
        </span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('ruleId')" field="ruleId" header="Rule Id" sortable :style="{ width: '13rem', minWidth: '10rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <span class="cell-text" :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleId, searchFilter) }">
          <span v-if="searchFilter" v-html="highlightText(data.ruleId, searchFilter)" />
          <template v-else>{{ data.ruleId }}</template>
        </span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('ruleTitle')" field="ruleTitle" header="Rule Title" sortable :style="{ width: '40%', minWidth: '18rem' }" :pt="columnPt.left">
      <template #body="{ data }">
        <div class="cell-text-field">
          <span
            class="cell-text cell-text--clamped cell-text--clickable"
            :class="{ 'cell--match': searchFilter && fieldMatches(data.ruleTitle, searchFilter) }"
            :title="data.ruleTitle"
          >
            <span v-if="searchFilter" v-html="highlightText(data.ruleTitle, searchFilter)" />
            <template v-else>{{ data.ruleTitle }}</template>
          </span>
        </div>
      </template>
    </Column>

    <!-- Count Columns -->
    <Column v-if="visibleFields.has('fail')" field="counts.results.fail" sortable :style="{ width: '2.5rem', minWidth: '2.5rem' }" :pt="columnPt.center">
      <template #header>
        <ResultBadge status="O" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.results?.fail ?? 0 }}</span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('pass')" field="counts.results.pass" sortable :style="{ width: '2.5rem', minWidth: '2.5rem' }" :pt="columnPt.center">
      <template #header>
        <ResultBadge status="NF" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.results?.pass ?? 0 }}</span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('notapplicable')" field="counts.results.notapplicable" sortable :style="{ width: '2.5rem', minWidth: '2.5rem' }" :pt="columnPt.center">
      <template #header>
        <ResultBadge status="NA" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.results?.notapplicable ?? 0 }}</span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('other')" field="counts.results.other" sortable :style="{ width: '2.5rem', minWidth: '2.5rem' }" :pt="columnPt.center">
      <template #header>
        <ResultBadge status="NR+" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.results?.other ?? 0 }}</span>
      </template>
    </Column>

    <!-- Status Icons -->
    <Column v-if="visibleFields.has('submitted')" field="counts.statuses.submitted" sortable :style="{ width: '3rem', minWidth: '3rem' }" :pt="columnPt.center">
      <template #header>
        <StatusBadge status="submitted" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.statuses?.submitted ?? 0 }}</span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('rejected')" field="counts.statuses.rejected" sortable :style="{ width: '3rem', minWidth: '3rem' }" :pt="columnPt.center">
      <template #header>
        <StatusBadge status="rejected" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.statuses?.rejected ?? 0 }}</span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('accepted')" field="counts.statuses.accepted" sortable :style="{ width: '3rem', minWidth: '3rem' }" :pt="columnPt.center">
      <template #header>
        <StatusBadge status="accepted" />
      </template>
      <template #body="{ data }">
        <span class="cell-text">{{ data.counts?.statuses?.accepted ?? 0 }}</span>
      </template>
    </Column>

    <!-- Timestamp Columns -->
    <Column v-if="visibleFields.has('oldest')" field="timestamps.ts.min" header="Oldest" sortable :style="{ width: '3rem', minWidth: '3rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <span v-if="data.timestamps?.ts?.min" class="cell-text" :title="data.timestamps.ts.min">{{ durationToNow(data.timestamps.ts.min) }}</span>
      </template>
    </Column>
    <Column v-if="visibleFields.has('newest')" field="timestamps.ts.max" header="Newest" sortable :style="{ width: '3rem', minWidth: '3rem' }" :pt="columnPt.center">
      <template #body="{ data }">
        <span v-if="data.timestamps?.ts?.max" class="cell-text" :title="data.timestamps.ts.max">{{ durationToNow(data.timestamps.ts.max) }}</span>
      </template>
    </Column>

    <template #empty>
      <div class="agg-grid-empty-state">
        No checklist items found.
      </div>
    </template>

    <template #footer>
      <StatusFooter
        class="collection-review-footer"
        :metrics="footerMetrics"
        :total-count="gridData.length"
        :filtered-count="isFiltered ? visibleData.length : null"
        total-label="rules"
        :total-icon-src="shieldGreenCheck"
        :show-refresh="true"
        :show-export="true"
        @action="onFooterAction"
      >
        <template #right-extra>
          <ResultBadge status="O" :count="footerStats.results.fail" />
          <ResultBadge status="NF" :count="footerStats.results.pass" />
          <ResultBadge status="NA" :count="footerStats.results.notapplicable" />
          <ResultBadge status="NR+" :count="footerStats.results.other" />
          <span class="footer-divider">|</span>
          <StatusBadge status="submitted" :count="footerStats.statuses.submitted" />
          <StatusBadge status="rejected" :count="footerStats.statuses.rejected" />
          <StatusBadge status="accepted" :count="footerStats.statuses.accepted" />
        </template>
      </StatusFooter>
    </template>
  </DataTable>
</template>

<style scoped>
.column-header-with-filter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.1rem;
  width: 100%;
}

.checklist-grid__table {
  flex: 1;
  min-height: 0;
}

.cell-text {
  font-size: 1.1rem;
  line-height: 1.3;
  color: var(--color-text-primary);
}

.cell-text--clamped {
  display: -webkit-box;
  line-clamp: var(--line-clamp, 1);
  -webkit-line-clamp: var(--line-clamp, 1);
  -webkit-box-orient: vertical;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  white-space: normal;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.cell-center {
  display: flex;
  justify-content: center;
  width: 100%;
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

:deep(.p-datatable-thead > tr > th:last-child) {
  border-right: none;
}

:deep(td.column-body-center) {
  text-align: center;
}

:deep(td.column-body-left) {
  text-align: left;
}

:deep(.p-datatable-thead > tr > th) {
  background: var(--color-background-dark);
  color: var(--color-text-dim);
  font-size: 0.85rem;
  font-weight: 600;
  text-transform: none;
  border-bottom: 1px solid var(--color-border-default);
}
:deep(.p-datatable-thead > tr > th:hover) {
  background: color-mix(in srgb, var(--color-background-light) 10%, var(--color-background-dark));
}

:deep(.p-datatable-tbody > tr.p-highlight) {
  background: color-mix(in srgb, var(--color-primary, #3b82f6) 12%, var(--color-background-light)) !important;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary, #3b82f6) 25%, transparent);
  outline: 1px inset color-mix(in srgb, var(--color-primary) 20%, transparent);
}

:deep(.p-datatable-tbody > tr:hover) {
  background: var(--color-background-light) !important;
}

:deep(.p-datatable-tbody > tr.p-highlight .cell-text) {
  color: var(--color-text-bright);
  font-weight: 500;
}

.cell--match {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 8%, transparent);
  border-radius: 2px;
}

:deep(.search-highlight) {
  background-color: color-mix(in srgb, var(--color-warning-yellow, #f59e0b) 40%, transparent);
  color: inherit;
  border-radius: 1px;
  padding: 0 1px;
}

.agg-grid-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4rem;
  color: var(--color-text-dim);
}

.footer-divider {
  color: var(--color-border-default);
  padding: 0 0.25rem;
}
</style>
