<script setup>
import Column from 'primevue/column'
import DataTable from 'primevue/datatable'
import { computed, ref, watch } from 'vue'

import DurationColumn from '../../../../components/columns/DurationColumn.vue'
import PercentageColumn from '../../../../components/columns/PercentageColumn.vue'
import ColumnSearchFilter from '../../../../components/common/ColumnSearchFilter.vue'
import StatusFooter from '../../../../components/common/StatusFooter.vue'
import { fetchCollectionStigSummary } from '../../../../shared/api/collectionsApi.js'
import { useAsyncState } from '../../../../shared/composables/useAsyncState.js'
import { useStigTable } from '../../composables/useStigTable.js'
import StigToolbar from './StigToolbar.vue'

const props = defineProps({
  collectionId: {
    type: String,
    required: true,
  },
})

const dataTableRef = ref(null)

const { state: stigs, isLoading, execute: loadStigs } = useAsyncState(
  () => fetchCollectionStigSummary(props.collectionId),
  { initialState: [], immediate: false },
)

watch(() => props.collectionId, loadStigs, { immediate: true })

const { stigFilter, filteredData } = useStigTable(stigs)

const borderPt = { headerCell: { style: 'border-right: 1px solid var(--color-border-default)' } }
const tablePt = { footer: { style: 'padding: 0; border: none;' } }

const columns = [
  { field: 'revisionStr', header: 'Revision', component: Column, width: '50px', pt: borderPt },
  { field: 'ruleCount', header: 'Rules', component: Column, width: '30px', pt: borderPt },
  { field: 'assets', header: 'Assets', component: Column, width: '30px', pt: borderPt },
  { field: 'oldest', header: 'Oldest', component: DurationColumn, width: '30px', pt: borderPt },
  { field: 'newest', header: 'Newest', component: DurationColumn, width: '30px', pt: borderPt },
  { field: 'assessedPct', header: 'Assessed', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'submittedPct', header: 'Submitted', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'acceptedPct', header: 'Accepted', component: PercentageColumn, width: '60px', pt: borderPt },
  { field: 'rejectedPct', header: 'Rejected', component: PercentageColumn, width: '60px', pt: borderPt },
]

const selectedStigs = ref([])

const hasSelection = computed(() => selectedStigs.value.length > 0)
const singleSelection = computed(() => selectedStigs.value.length === 1)

function clearSelection() {
  selectedStigs.value = []
}

function onStigsChanged() {
  clearSelection()
  loadStigs()
}

function handleFooterAction(action) {
  if (action === 'refresh') {
    loadStigs()
  }
  else if (action === 'export') {
    dataTableRef.value?.exportCSV()
  }
}
</script>

<template>
  <div class="manage-stigs">
    <header class="page-header">
      <h2 class="page-title">
        STIGs
      </h2>
      <p class="page-desc">
        Manage collection STIGs and view their assessment metrics.
      </p>
    </header>

    <StigToolbar
      :collection-id="props.collectionId"
      :selected-stigs="selectedStigs"
      :has-selection="hasSelection"
      :single-selection="singleSelection"
      @clear-selection="clearSelection"
      @stigs-changed="onStigsChanged"
    />

    <div class="table-container">
      <DataTable
        ref="dataTableRef"
        :value="filteredData"
        data-key="benchmarkId"
        scrollable
        scroll-height="flex"
        resizable-columns
        column-resize-mode="fit"
        :loading="isLoading"
        :virtual-scroller-options="{ itemSize: 27, delay: 0 }"
        class="flex-fill clickable-rows"
        :table-style="{ 'table-layout': 'fixed' }"
        :pt="tablePt"
        v-model:selection="selectedStigs"
        selection-mode="multiple"
      >
        <Column selection-mode="multiple" style="width: 1.5rem; height: 27px; padding: 0 0.5rem;" />

        <Column
          field="benchmarkId"
          sortable
          :pt="borderPt"
          style="min-width: 100px; width: 140px;"
          :body-style="{ height: '27px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
          :header-style="{ padding: '0 0.5rem' }"
        >
          <template #header>
            <div class="column-header-with-filter">
              Benchmark ID
              <ColumnSearchFilter v-model="stigFilter" placeholder="Search STIG..." />
            </div>
          </template>
          <template #body="{ data }">
            <div class="sm-grid-cell-with-toolbar">
              <div class="sm-info" :title="data.benchmarkId">
                {{ data.benchmarkId }}
              </div>
            </div>
          </template>
        </Column>

        <template v-for="col in columns" :key="col.field">
          <component
            :is="col.component"
            v-bind="col"
            sortable
            :style="`width: ${col.width}; min-width: ${col.width};`"
            :body-style="{ height: '27px', padding: '0 0.5rem', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }"
            :header-style="{ padding: '0 0.5rem' }"
          />
        </template>

        <template #footer>
          <StatusFooter
            :refresh-loading="isLoading"
            :total-count="filteredData.length"
            :show-selected="selectedStigs.length > 0"
            :selected-items="selectedStigs"
            total-label="STIGs"
            @action="handleFooterAction"
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

.page-header {
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border-default);
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-default);
  margin-bottom: 0.25rem;
}

.page-desc {
  color: var(--color-text-dim);
  font-size: 0.9rem;
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

.column-header-with-filter {
  display: flex;
  align-items: center;
  gap: 0.25rem;
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

:deep(th:nth-child(n+3) .p-datatable-column-header-content) {
  justify-content: center;
}

:deep(td:nth-child(n+3)) {
  text-align: center;
}
</style>
