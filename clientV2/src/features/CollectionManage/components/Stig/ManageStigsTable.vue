<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import DurationColumn from '../../../../components/columns/DurationColumn.vue'
import PercentageColumn from '../../../../components/columns/PercentageColumn.vue'
import ColumnToggle from '../../../../components/common/ColumnToggle.vue'
import GridFilterButton from '../../../../components/common/GridFilterButton.vue'
import GridSearch from '../../../../components/common/GridSearch.vue'
import GridToolbar from '../../../../components/common/GridToolbar.vue'
import HighlightText from '../../../../components/common/HighlightText.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchCollectionStigSummary } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useColumnVisibility } from '../../../../shared/composables/useColumnVisibility.js'
import { useGridSearch } from '../../../../shared/composables/useGridSearch.js'
import { rowHeightPx } from '../../../../shared/lib/rowHeights.js'
import { useStigTable } from '../../composables/useStigTable.js'
import StigToolbar from './StigToolbar.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const ROW_HEIGHT = rowHeightPx('dense')

const dataTableRef = ref(null)

const { state: stigs, isLoading, execute: loadStigs } = useAsyncState(
  () => fetchCollectionStigSummary(props.collectionId),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, loadStigs, { immediate: true })

const { tableData } = useStigTable(stigs)

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
const tablePt = { footer: { style: 'padding: 0; border: none;' } }

const metricColumns = [
  { field: 'revisionStr', header: 'Revision', component: Column, width: '4.5rem', pt: borderPt },
  { field: 'ruleCount', header: 'Rules', component: Column, width: '2.75rem', pt: borderPt },
  { field: 'assets', header: 'Assets', component: Column, width: '2.75rem', pt: borderPt },
  { field: 'oldest', header: 'Oldest', component: DurationColumn, width: '2.75rem', pt: borderPt },
  { field: 'newest', header: 'Newest', component: DurationColumn, width: '2.75rem', pt: borderPt },
  { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, width: '5.5rem', pt: borderPt },
  { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, width: '5.5rem', pt: borderPt },
  { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, width: '5.5rem', pt: borderPt },
  { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, width: '5.5rem', pt: borderPt },
]

const { toggleableColumns, selectedColumns, visibleFields } = useColumnVisibility([
  { field: 'benchmarkId', header: 'Benchmark ID', locked: true },
  ...metricColumns.map(({ field, header }) => ({ field, header })),
], 'manageStigs.columns')

const visibleMetricColumns = computed(() => metricColumns.filter(c => visibleFields.value.has(c.field)))

const selectedStigs = ref([])

// Title isn't a column; it shows as the Benchmark ID tooltip
const {
  term: searchTerm,
  filters: gridFilters,
  filteredRows,
  isFiltered,
  filterColumns,
  valueOptions,
  highlightTerm,
} = useGridSearch(tableData, [
  { field: 'benchmarkId', header: 'Benchmark ID' },
  { field: 'title', header: 'Title', shownWith: 'benchmarkId' },
  { field: 'revisionStr', header: 'Revision' },
], { visibleFields, selection: selectedStigs, dataKey: 'benchmarkId' })

const hasSelection = computed(() => selectedStigs.value.length > 0)
const singleSelection = computed(() => selectedStigs.value.length === 1)

function clearSelection() {
  selectedStigs.value = []
}

function onStigsChanged() {
  clearSelection()
  loadStigs()
}
</script>

<template>
  <div class="manage-stigs">
    <StigToolbar
      :collection-id="props.collectionId"
      :selected-stigs="selectedStigs"
      :has-selection="hasSelection"
      :single-selection="singleSelection"
      @clear-selection="clearSelection"
      @stigs-changed="onStigsChanged"
    />

    <div class="table-container">
      <GridToolbar compact>
        <GridSearch v-model="searchTerm" label="Search STIGs" placeholder="Search STIGs..." />
        <template #end>
          <GridFilterButton v-model="gridFilters" :columns="filterColumns" :value-options="valueOptions" />
          <ColumnToggle v-model="selectedColumns" :columns="toggleableColumns" />
        </template>
      </GridToolbar>
      <DataTable
        ref="dataTableRef"
        v-model:selection="selectedStigs"
        :value="filteredRows"
        data-key="benchmarkId"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        :loading="isLoading"
        :virtual-scroller-options="{ itemSize: ROW_HEIGHT, delay: 0 }"
        :style="{ '--item-size': `${ROW_HEIGHT}px` }"
        export-filename="STIGs"
        class="flex-fill clickable-rows"
        :table-style="{ 'table-layout': 'fixed' }"
        :pt="tablePt"
        selection-mode="multiple"
      >
        <Column selection-mode="multiple" style="width: 1rem; height: var(--item-size); padding: 0 0.5rem;" />

        <template #empty>
          {{ isFiltered && tableData.length ? 'No STIGs match the search.' : 'No STIGs found.' }}
        </template>

        <Column
          field="benchmarkId" header="Benchmark ID"
          sortable
          :pt="borderPt"
          style="min-width: 9rem; width: 12.75rem;"
          :body-style="{ height: 'var(--item-size)', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
          :header-style="{ padding: '0 0.5rem' }"
        >
          <template #body="{ data }">
            <div class="sm-grid-cell-with-toolbar">
              <div class="sm-info" :title="data.title || data.benchmarkId">
                <HighlightText :text="data.benchmarkId" :term="highlightTerm('benchmarkId')" />
              </div>
            </div>
          </template>
        </Column>

        <template v-for="col in visibleMetricColumns" :key="col.field">
          <component
            :is="col.component"
            v-bind="col"
            sortable
            header-class="metric-col"
            body-class="metric-col"
            :style="`width: ${col.width}; min-width: ${col.width};`"
            :body-style="{ height: 'var(--item-size)', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
            :header-style="{ padding: '0 0.5rem' }"
          />
        </template>

        <template #footer>
          <StatusFooter
            :dt="dataTableRef"
            :refresh-loading="isLoading"
            :total-count="tableData.length"
            :filtered-count="isFiltered ? filteredRows.length : null"
            :show-selected="selectedStigs.length > 0"
            :selected-items="selectedStigs"
            total-label="STIGs"
            @refresh="loadStigs"
          />
        </template>
      </DataTable>
    </div>
  </div>
</template>

<style scoped>
.manage-stigs {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-width: 1000px;
  padding: 1.5rem 3rem 3rem 3rem;
}

.table-container {
  flex: 1;
  min-height: 0;
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  user-select: none;
}

.flex-fill {
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}

/* Whole row toggles selection via @row-click. */
.clickable-rows :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.sm-grid-cell-with-toolbar {
  display: flex;
  align-items: center;
}

.sm-info {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(th.metric-col .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(td.metric-col) {
  text-align: center;
}
</style>
